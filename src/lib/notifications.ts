import { Capacitor } from "@capacitor/core";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";

export type NotificationPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface ReminderConfig {
  water: { enabled: boolean; interval: number };
  meals: { enabled: boolean; times: string[] };
  weight: { enabled: boolean; time: string };
}

/** 2 Mahlzeiten, großer Abstand — keine 3× zur gleichen Stunde */
export const DEFAULT_MEAL_TIMES = ["12:30", "19:30"];

/** Wasser-Slots mit Offset (:45), kollidieren nicht mit Mahlzeiten (:30) */
export const DEFAULT_WATER_SLOTS = [
  { hour: 10, minute: 45 },
  { hour: 14, minute: 15 },
  { hour: 17, minute: 45 },
  { hour: 20, minute: 15 },
];

const WATER_ID_BASE = 100;
const MEALS_ID_BASE = 200;
const WEIGHT_ID = 300;
const TEST_ID = 9999;

const MIN_GAP_MS = 90 * 60 * 1000;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

function migrateMealTimes(times: string[] | undefined): string[] {
  if (!times?.length) return [...DEFAULT_MEAL_TIMES];
  const normalized = times.map((t) => t.trim()).filter(Boolean);
  const legacySet = new Set(["08:00", "12:00", "18:00"]);
  const hasLegacyBurst =
    normalized.length >= 3 && normalized.every((t) => legacySet.has(t));
  if (hasLegacyBurst) return [...DEFAULT_MEAL_TIMES];
  if (normalized.length >= 2) return normalized.slice(0, 2);
  return [...DEFAULT_MEAL_TIMES];
}

export function normalizeReminderConfig(raw: ReminderConfig): ReminderConfig {
  const meals = migrateMealTimes(raw.meals?.times);

  return {
    water: {
      enabled: Boolean(raw.water?.enabled),
      interval: Math.min(4, Math.max(2, Number(raw.water?.interval) || 3)),
    },
    meals: {
      enabled: Boolean(raw.meals?.enabled),
      times: meals,
    },
    weight: {
      enabled: Boolean(raw.weight?.enabled),
      time: raw.weight?.time || "07:15",
    },
  };
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
  if (isNativeApp()) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");

      let localGranted = (await LocalNotifications.checkPermissions()).display === "granted";
      if (!localGranted) {
        const localResult = await LocalNotifications.requestPermissions();
        localGranted = localResult.display === "granted";
      }

      if (localGranted) {
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
          if (options.sendTest !== false) {
            setTimeout(() => void sendTestNotification(), 4000);
          }
        } catch (error) {
          console.warn("[notifications] Reminder sync skipped:", error);
        }
      }
      return localGranted;
    } catch (error) {
      console.error("[notifications] Native permission request failed:", error);
      return false;
    }
  }

  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") {
    await registerWebServiceWorker();
    return true;
  }
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  const granted = result === "granted";
  if (granted) {
    await registerWebServiceWorker();
  }
  return granted;
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

function mealLabel(hour: number): string {
  if (hour < 11) return "Frühstück";
  if (hour < 16) return "Mittagessen";
  return "Abendessen";
}

function buildWaterSchedule(intervalHours: number): { hour: number; minute: number }[] {
  const step = Math.max(2, Math.min(4, intervalHours));
  const slots: { hour: number; minute: number }[] = [];
  for (let i = 0; i < DEFAULT_WATER_SLOTS.length; i++) {
    const base = DEFAULT_WATER_SLOTS[i];
    const hour = Math.min(21, Math.max(9, base.hour + (step - 3) * (i % 2)));
    slots.push({ hour, minute: base.minute });
  }
  return slots;
}

function isTooCloseToExisting(at: Date, scheduled: Date[]): boolean {
  return scheduled.some((other) => Math.abs(other.getTime() - at.getTime()) < MIN_GAP_MS);
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
    const cancelIds = [
      ...Array.from({ length: 20 }, (_, i) => ({ id: WATER_ID_BASE + i })),
      ...Array.from({ length: 6 }, (_, i) => ({ id: MEALS_ID_BASE + i })),
      { id: WEIGHT_ID },
      { id: TEST_ID },
    ];
    await LocalNotifications.cancel({ notifications: cancelIds });
  }
}

export async function syncRemindersFromConfig(config: ReminderConfig): Promise<void> {
  if (!isNativeApp()) return;

  const normalized = normalizeReminderConfig(config);
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;

  await ensureAndroidReminderChannel(LocalNotifications);
  await cancelAllFrigyNotifications(LocalNotifications);

  const notifications: Parameters<typeof LocalNotifications.schedule>[0]["notifications"] = [];
  const scheduledTimes: Date[] = [];

  if (normalized.water.enabled) {
    const waterSlots = buildWaterSchedule(normalized.water.interval);
    waterSlots.forEach((slot, idx) => {
      const at = nextDailyOccurrence(slot.hour, slot.minute);
      if (isTooCloseToExisting(at, scheduledTimes)) return;
      scheduledTimes.push(at);
      notifications.push({
        id: WATER_ID_BASE + idx,
        title: "💧 Zeit für Wasser!",
        body: "Bleib hydriert – trink ein Glas Wasser!",
        schedule: { at, repeats: true, every: "day" },
        sound: "default",
        channelId: "frigy_reminders",
      });
    });
  }

  if (normalized.meals.enabled) {
    normalized.meals.times.forEach((time, idx) => {
      const { hour, minute } = parseTime(time);
      const at = nextDailyOccurrence(hour, minute);
      if (isTooCloseToExisting(at, scheduledTimes)) return;
      scheduledTimes.push(at);
      notifications.push({
        id: MEALS_ID_BASE + idx,
        title: `🍽️ ${mealLabel(hour)} Zeit!`,
        body: "Vergiss nicht, deine Mahlzeit zu loggen.",
        schedule: { at, repeats: true, every: "day" },
        sound: "default",
        channelId: "frigy_reminders",
      });
    });
  }

  if (normalized.weight.enabled) {
    const { hour, minute } = parseTime(normalized.weight.time);
    const at = nextDailyOccurrence(hour, minute);
    if (!isTooCloseToExisting(at, scheduledTimes)) {
      notifications.push({
        id: WEIGHT_ID,
        title: "⚖️ Zeit zum Wiegen!",
        body: "Dokumentiere deinen Fortschritt.",
        schedule: { at, repeats: true, every: "day" },
        sound: "default",
        channelId: "frigy_reminders",
      });
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

export async function syncRemindersFromStorage(): Promise<void> {
  const saved = localStorage.getItem("reminderConfig");
  if (!saved) return;
  try {
    await syncRemindersFromConfig(normalizeReminderConfig(JSON.parse(saved) as ReminderConfig));
  } catch (error) {
    console.warn("[notifications] Could not sync reminders:", error);
  }
}

export function saveReminderConfigFromOnboarding(prefs: {
  meals: boolean;
  water: boolean;
  weight: boolean;
}): void {
  const config: ReminderConfig = {
    water: { enabled: prefs.water, interval: 3 },
    meals: { enabled: prefs.meals, times: [...DEFAULT_MEAL_TIMES] },
    weight: { enabled: prefs.weight, time: "07:15" },
  };
  localStorage.setItem("reminderConfig", JSON.stringify(config));
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
          body: "Benachrichtigungen sind aktiv – Erinnerungen kommen verteilt über den Tag.",
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
        body: "Benachrichtigungen sind aktiv – Erinnerungen kommen verteilt über den Tag.",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
      });
      return;
    } catch {
      /* fallback below */
    }
  }

  new Notification("Frigy Erinnerungen", {
    body: "Benachrichtigungen sind aktiv – Erinnerungen kommen verteilt über den Tag.",
    icon: "/pwa-192x192.png",
  });
}
