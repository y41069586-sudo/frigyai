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

const DAILY_PUSH_ID = 150;
const TEST_ID = 9999;
const YESTERDAY_BALANCE_ID = 4200;
const YESTERDAY_BALANCE_PENDING_KEY = "frigy_yesterday_balance_pending";

type LegacyReminderConfig = {
  enabled?: boolean;
  water?: { enabled?: boolean };
  meals?: { enabled?: boolean };
  weight?: { enabled?: boolean };
};

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

function nextDailyOccurrence(hour: number, minute: number): Date {
  const at = new Date();
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= Date.now()) {
    at.setDate(at.getDate() + 1);
  }
  return at;
}

export function reminderNotificationCopy(language: Language) {
  if (language === "en") {
    return {
      dailyTitle: "🍽️ Time to log your meal!",
      dailyBody: "Open Frigy and track what you ate today.",
    };
  }
  if (language === "fr") {
    return {
      dailyTitle: "🍽️ C'est l'heure de noter ton repas !",
      dailyBody: "Ouvre Frigy et enregistre ce que tu as mangé aujourd'hui.",
    };
  }
  return {
    dailyTitle: "🍽️ Zeit, deine Mahlzeit zu loggen!",
    dailyBody: "Öffne Frigy und tracke, was du heute gegessen hast.",
  };
}

async function cancelAllFrigyNotifications(
  LocalNotifications: typeof import("@capacitor/local-notifications").LocalNotifications,
): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    const ids = (pending.notifications ?? []).map((n) => ({ id: n.id }));
    if (ids.length > 0) {
      await LocalNotifications.cancel({ notifications: ids });
    }
  } catch {
    await LocalNotifications.cancel({
      notifications: [
        { id: DAILY_PUSH_ID },
        { id: TEST_ID },
        { id: YESTERDAY_BALANCE_ID },
      ],
    });
  }
}

export async function syncRemindersFromConfig(config: ReminderConfig): Promise<void> {
  const normalized = normalizeReminderConfig(config);

  if (!isNativeApp()) return;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions();
  await ensureAndroidReminderChannel(LocalNotifications);
  await cancelAllFrigyNotifications(LocalNotifications);

  if (perm.display !== "granted" || !normalized.enabled) return;

  const copy = reminderNotificationCopy(getStoredLanguage());
  const { hour, minute } = parseTime(DAILY_PUSH_TIME);
  const at = nextDailyOccurrence(hour, minute);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_PUSH_ID,
        title: copy.dailyTitle,
        body: copy.dailyBody,
        schedule: { at, repeats: true, every: "day" },
        sound: "default",
        channelId: "frigy_reminders",
      },
    ],
  });
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

  if (isNativeApp()) {
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    await ensureAndroidReminderChannel(LocalNotifications);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: TEST_ID,
          title: "Frigy Erinnerungen",
          body: "Benachrichtigungen sind aktiv – maximal eine Erinnerung pro Tag.",
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
      await reg.showNotification("Frigy Erinnerungen", {
        body: "Benachrichtigungen sind aktiv – maximal eine Erinnerung pro Tag.",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
      });
      return;
    } catch {
      /* fallback below */
    }
  }

  new Notification("Frigy Erinnerungen", {
    body: "Benachrichtigungen sind aktiv – maximal eine Erinnerung pro Tag.",
    icon: "/pwa-192x192.png",
  });
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
