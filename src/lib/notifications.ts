import { Capacitor } from "@capacitor/core";
import { getStoredLanguage, type Language } from "@/contexts/LanguageContext";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import type { YesterdayCalorieBalance } from "@/lib/yesterdayCalorieBalance";

export type NotificationPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface ReminderConfig {
  enabled: boolean;
}

/** Single daily push at this time when notifications are enabled. */
export const DAILY_PUSH_TIME = "12:30";

// Schedule this many days of varied notifications ahead (iOS max 64 local notifs)
const DAYS_AHEAD = 30;

const DAILY_PUSH_BASE_ID = 150;
const TEST_ID = 9999;
const YESTERDAY_BALANCE_ID = 4200;
const YESTERDAY_BALANCE_PENDING_KEY = "frigy_yesterday_balance_pending";

const MIN_GAP_MINUTES = 90;
const WATER_SLOT_COUNT = DEFAULT_WATER_SLOTS.length;

let reminderSyncInFlight: Promise<void> | null = null;

export function normalizeReminderConfig(raw: unknown): ReminderConfig {
  if (!raw || typeof raw !== "object") return { enabled: false };
  const obj = raw as LegacyReminderConfig;
  if (typeof obj.enabled === "boolean") return { enabled: obj.enabled };
  const legacyEnabled = Boolean(obj.water?.enabled || obj.meals?.enabled || obj.weight?.enabled);
  return { enabled: legacyEnabled };
}

export function arePushNotificationsEnabled(): boolean {
  const saved = localStorage.getItem("reminderConfig");
  if (!saved) return false;
  try {
    return normalizeReminderConfig(JSON.parse(saved)).enabled;
  } catch {
    return false;
  }
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const status = await LocalNotifications.checkPermissions();
      if (status.display === "granted") return "granted";
      if (status.display === "denied") return "denied";
      return "prompt";
    } catch {
      return "unsupported";
    }
  }

  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationPermissionState;
}

async function registerWebServiceWorker(): Promise<void> {
  if (isNativeApp() || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw-notifications.js");
  } catch (error) {
    console.warn("[notifications] Service worker registration failed:", error);
  }
}

export type NotificationPermissionOptions = {
  localOnly?: boolean;
  /** Sofort-Testbenachrichtigung nach Aktivierung (standard: verzögert) */
  sendTest?: boolean;
};

async function ensureAndroidReminderChannel(
  LocalNotifications: typeof import("@capacitor/local-notifications").LocalNotifications,
): Promise<void> {
  if (Capacitor.getPlatform() !== "android") return;
  try {
    await LocalNotifications.createChannel({
      id: "frigy_reminders",
      name: "Frigy Erinnerungen",
      description: "Wasser-, Mahlzeit- und Wiege-Erinnerungen",
      importance: 4,
      visibility: 1,
      vibration: true,
    });
  } catch {
    /* channel may already exist */
  }
}

export async function requestNotificationPermission(
  options: NotificationPermissionOptions = {},
): Promise<boolean> {
  return (await requestNotificationPermissionState(options)) === "granted";
}

export async function requestNotificationPermissionState(
  options: NotificationPermissionOptions = {},
): Promise<NotificationPermissionState> {
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");

      let localPermission = (await LocalNotifications.checkPermissions()).display;
      if (localPermission !== "granted") {
        const localResult = await LocalNotifications.requestPermissions();
        localPermission = localResult.display;
      }

      if (localPermission === "granted") {
        await ensureAndroidReminderChannel(LocalNotifications);
        if (!options.localOnly) {
          try {
            const { PushNotifications } = await import("@capacitor/push-notifications");
            let pushGranted = (await PushNotifications.checkPermissions()).receive === "granted";
            if (!pushGranted) {
              const pushResult = await PushNotifications.requestPermissions();
              pushGranted = pushResult.receive === "granted";
            }
            if (pushGranted) {
              await PushNotifications.register();
            }
          } catch (error) {
            console.warn("[notifications] Push registration skipped:", error);
          }
        }
        try {
          await syncRemindersFromStorage();
          await applyPendingTrialReminderNative();
          await applyPendingYesterdayBalanceNotificationNative();
          if (options.sendTest !== false) {
            setTimeout(() => void sendTestNotification(), 4000);
          }
        } catch (error) {
          console.warn("[notifications] Reminder sync skipped:", error);
        }
      }
      if (localPermission === "granted") return "granted";
      if (localPermission === "denied") return "denied";
      return "prompt";
    } catch (error) {
      console.error("[notifications] Native permission request failed:", error);
      return "unsupported";
    }
  }

  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") {
    await registerWebServiceWorker();
    return "granted";
  }
  if (Notification.permission === "denied") return "denied";

  const result = await Notification.requestPermission();
  const granted = result === "granted";
  if (granted) {
    await registerWebServiceWorker();
  }
  if (result === "granted") return "granted";
  if (result === "denied") return "denied";
  return "prompt";
}

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

function dailyScheduleAt(hour: number, minute: number) {
  return {
    on: {
      hour,
      minute,
      second: 0,
    },
  };
}

function isSlotTooClose(
  hour: number,
  minute: number,
  scheduled: { hour: number; minute: number }[],
): boolean {
  const slotMinutes = minutesSinceMidnight(hour, minute);
  return scheduled.some((other) => {
    const diff = Math.abs(slotMinutes - minutesSinceMidnight(other.hour, other.minute));
    return diff > 0 && diff < MIN_GAP_MINUTES;
  });
}

export function reminderNotificationCopy(language: Language) {
  if (language === "en") {
    return {
      waterTitle: "💧 Time to drink water!",
      waterBody: "Stay hydrated – have a glass of water!",
      mealBody: "Don't forget to log your meal.",
      weightTitle: "⚖️ Time to weigh in!",
      weightBody: "Track your progress.",
      mealName: (hour: number) => {
        if (hour < 11) return "Breakfast";
        if (hour < 16) return "Lunch";
        return "Dinner";
      },
    };
  }
  if (language === "fr") {
    return {
      waterTitle: "💧 C'est l'heure de boire !",
      waterBody: "Reste hydraté – bois un verre d'eau !",
      mealBody: "N'oublie pas d'enregistrer ton repas.",
      weightTitle: "⚖️ C'est l'heure de te peser !",
      weightBody: "Suis ta progression.",
      mealName: (hour: number) => {
        if (hour < 11) return "Petit-déjeuner";
        if (hour < 16) return "Déjeuner";
        return "Dîner";
      },
    };
  }
  return {
    waterTitle: "💧 Zeit für Wasser!",
    waterBody: "Bleib hydriert – trink ein Glas Wasser!",
    mealBody: "Vergiss nicht, deine Mahlzeit zu loggen.",
    weightTitle: "⚖️ Zeit zum Wiegen!",
    weightBody: "Dokumentiere deinen Fortschritt.",
    mealName: (hour: number) => {
      if (hour < 11) return "Frühstück";
      if (hour < 16) return "Mittagessen";
      return "Abendessen";
    },
  };
}

/** How many water reminders per day for the chosen interval (min 2, max 4). */
export function waterReminderCount(intervalHours: number): number {
  const step = Math.max(2, Math.min(4, intervalHours));
  if (step >= 4) return 2;
  if (step >= 3) return 3;
  return 4;
}

/** Daily water slots for web + native — count follows user interval setting. */
export function buildWaterSchedule(intervalHours: number): { hour: number; minute: number }[] {
  const count = waterReminderCount(intervalHours);
  return DEFAULT_WATER_SLOTS.slice(0, count);
}

async function cancelAllFrigyNotifications(
  LocalNotifications: typeof import("@capacitor/local-notifications").LocalNotifications,
): Promise<void> {
  const fixedCancelIds = [
    ...Array.from({ length: WATER_SLOT_COUNT }, (_, i) => ({ id: WATER_ID_BASE + i })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: MEALS_ID_BASE + i })),
    { id: WEIGHT_ID },
    { id: TEST_ID },
  ];

  try {
    await LocalNotifications.cancel({ notifications: fixedCancelIds });
  } catch {
    /* ignore */
  }

  try {
    const pending = await LocalNotifications.getPending();
    const extraIds = (pending.notifications ?? [])
      .filter(
        (n) =>
          n.id !== TRIAL_REMINDER_ID &&
          n.id !== YESTERDAY_BALANCE_ID &&
          !fixedCancelIds.some((entry) => entry.id === n.id),
      )
      .map((n) => ({ id: n.id }));
    if (extraIds.length > 0) {
      await LocalNotifications.cancel({ notifications: extraIds });
    }
  } catch {
    /* ignore */
  }
}

async function scheduleRemindersFromConfig(config: ReminderConfig): Promise<void> {
  const normalized = normalizeReminderConfig(config);
  if (!isNativeApp()) return;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions();
  await ensureAndroidReminderChannel(LocalNotifications);
  await cancelAllFrigyNotifications(LocalNotifications);

  const notifications: Parameters<typeof LocalNotifications.schedule>[0]["notifications"] = [];
  const scheduledSlots: { hour: number; minute: number }[] = [];

  if (normalized.water.enabled) {
    const waterSlots = buildWaterSchedule(normalized.water.interval);
    waterSlots.forEach((slot, idx) => {
      if (isSlotTooClose(slot.hour, slot.minute, scheduledSlots)) return;
      scheduledSlots.push(slot);
      notifications.push({
        id: WATER_ID_BASE + idx,
        title: copy.waterTitle,
        body: copy.waterBody,
        schedule: dailyScheduleAt(slot.hour, slot.minute),
        sound: "default",
        channelId: "frigy_reminders",
      });
    });
  }

  if (normalized.meals.enabled) {
    normalized.meals.times.forEach((time, idx) => {
      const { hour, minute } = parseTime(time);
      if (isSlotTooClose(hour, minute, scheduledSlots)) return;
      scheduledSlots.push({ hour, minute });
      notifications.push({
        id: MEALS_ID_BASE + idx,
        title: `🍽️ ${copy.mealName(hour)}!`,
        body: copy.mealBody,
        schedule: dailyScheduleAt(hour, minute),
        sound: "default",
        channelId: "frigy_reminders",
      });
    });
  }

  if (normalized.weight.enabled) {
    const { hour, minute } = parseTime(normalized.weight.time);
    if (!isSlotTooClose(hour, minute, scheduledSlots)) {
      notifications.push({
        id: WEIGHT_ID,
        title: copy.weightTitle,
        body: copy.weightBody,
        schedule: dailyScheduleAt(hour, minute),
        sound: "default",
        channelId: "frigy_reminders",
      });
    }
  }

  await LocalNotifications.schedule({ notifications });
}

export async function syncRemindersFromConfig(config: ReminderConfig): Promise<void> {
  // Do not notifyFrigyStorageUpdated here — would re-sync on every food/plan save and spam notifications.
  if (!isNativeApp()) return;

  if (reminderSyncInFlight) {
    await reminderSyncInFlight;
    return;
  }

  reminderSyncInFlight = scheduleRemindersFromConfig(config).finally(() => {
    reminderSyncInFlight = null;
  });
  await reminderSyncInFlight;
}

export async function syncRemindersFromStorage(): Promise<void> {
  const saved = localStorage.getItem("reminderConfig");
  if (!saved) {
    if (isNativeApp()) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await cancelAllFrigyNotifications(LocalNotifications);
    }
    return;
  }
  try {
    await syncRemindersFromConfig(normalizeReminderConfig(JSON.parse(saved)));
  } catch (error) {
    console.warn("[notifications] Could not sync reminders:", error);
  }
}

export function saveReminderConfigFromOnboarding(prefs: {
  meals: boolean;
  water: boolean;
  weight: boolean;
}): void {
  const enabled = prefs.meals || prefs.water || prefs.weight;
  localStorage.setItem("reminderConfig", JSON.stringify({ enabled }));
  notifyFrigyStorageUpdated();
}

export async function sendTestNotification(): Promise<void> {
  if ((await getNotificationPermission()) !== "granted") return;

  const lang = getStoredLanguage();
  const testCopy = {
    de: { title: "✅ Frigy Erinnerungen aktiv!", body: "Du bekommst ab jetzt täglich eine neue Erinnerung." },
    en: { title: "✅ Frigy reminders active!", body: "You'll now receive a fresh reminder every day." },
    fr: { title: "✅ Rappels Frigy actifs !", body: "Tu recevras désormais un rappel différent chaque jour." },
  };
  const { title, body } = testCopy[lang] ?? testCopy.de;

  if (isNativeApp()) {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await ensureAndroidReminderChannel(LocalNotifications);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TEST_ID,
          title,
          body,
          schedule: { at: new Date(Date.now() + 800) },
          sound: "default",
          channelId: "frigy_reminders",
        },
      ],
    });
    return;
  }

  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
      });
      return;
    } catch {
      /* fallback below */
    }
  }

  new Notification(title, { body, icon: "/pwa-192x192.png" });
}

/** Native: trial reminder is not scheduled separately — max one daily push only. */
export async function applyPendingTrialReminderNative(): Promise<void> {
  return;
}

/** Paywall: no extra push — single daily reminder only when enabled in settings. */
export async function scheduleTrialEndingReminder(): Promise<void> {
  return;
}

/** Web trial reminder disabled — single daily push only. */
export function checkWebTrialEndingReminder(): void {
  return;
}

async function cancelYesterdayBalanceNotificationNative(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await LocalNotifications.cancel({ notifications: [{ id: YESTERDAY_BALANCE_ID }] });
  } catch {
    /* ignore */
  }
}

/** No separate balance push — in-app prompt only; respects single daily push policy. */
export async function scheduleYesterdayBalanceNotification(_opts: {
  eatenCalories: number;
  targetCalories: number;
  forDateIso?: string;
}): Promise<void> {
  localStorage.removeItem(YESTERDAY_BALANCE_PENDING_KEY);
  await cancelYesterdayBalanceNotificationNative();
}

export async function applyPendingYesterdayBalanceNotificationNative(): Promise<void> {
  return;
}

/** No separate balance push scheduled from app start. */
export async function resyncYesterdayBalanceNotificationForUser(_userId: string): Promise<void> {
  return;
}

/** Web balance push disabled — in-app dialog on dashboard handles this. */
export function maybeShowWebYesterdayBalanceNotification(_balance: YesterdayCalorieBalance): void {
  return;
}
