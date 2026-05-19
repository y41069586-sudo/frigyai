import { Capacitor } from "@capacitor/core";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";

export type NotificationPermissionState = "granted" | "denied" | "prompt" | "unsupported";

export interface ReminderConfig {
  water: { enabled: boolean; interval: number };
  meals: { enabled: boolean; times: string[] };
  weight: { enabled: boolean; time: string };
}

const WATER_ID_BASE = 100;
const MEALS_ID_BASE = 200;
const WEIGHT_ID = 300;
const TEST_ID = 9999;

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
  /** Onboarding: only ask for local reminders (Android POST_NOTIFICATIONS), skip push registration. */
  localOnly?: boolean;
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
      importance: 5,
      visibility: 1,
      vibration: true,
    });
  } catch {
    /* channel may already exist */
  }
}

/** Requests local + push permission on native; browser permission on web. */
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
  if (hour < 10) return "Frühstück";
  if (hour < 15) return "Mittagessen";
  return "Abendessen";
}

export async function syncRemindersFromConfig(config: ReminderConfig): Promise<void> {
  if (!isNativeApp()) return;

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return;

  if (Capacitor.getPlatform() === "android") {
    try {
      await LocalNotifications.createChannel({
        id: "frigy_reminders",
        name: "Frigy Erinnerungen",
        description: "Wasser-, Mahlzeit- und Wiege-Erinnerungen",
        importance: 5,
        visibility: 1,
        vibration: true,
      });
    } catch {
      /* channel may already exist */
    }
  }

  const cancelIds = [
    ...Array.from({ length: 15 }, (_, i) => ({ id: WATER_ID_BASE + i })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: MEALS_ID_BASE + i })),
    { id: WEIGHT_ID },
  ];
  await LocalNotifications.cancel({ notifications: cancelIds });

  const notifications: Parameters<typeof LocalNotifications.schedule>[0]["notifications"] = [];

  if (config.water.enabled) {
    const interval = Math.max(1, config.water.interval || 2);
    let idx = 0;
    for (let hour = 8; hour <= 22 && idx < 15; hour += interval) {
      notifications.push({
        id: WATER_ID_BASE + idx,
        title: "💧 Zeit für Wasser!",
        body: "Bleib hydriert – trink ein Glas Wasser!",
        schedule: { at: nextDailyOccurrence(hour, 0), repeats: true, every: "day" },
        sound: "default",
        channelId: "frigy_reminders",
      });
      idx += 1;
    }
  }

  if (config.meals.enabled) {
    config.meals.times.forEach((time, idx) => {
      const { hour, minute } = parseTime(time);
      notifications.push({
        id: MEALS_ID_BASE + idx,
        title: `🍽️ ${mealLabel(hour)} Zeit!`,
        body: "Vergiss nicht, deine Mahlzeit zu loggen.",
        schedule: { at: nextDailyOccurrence(hour, minute), repeats: true, every: "day" },
        sound: "default",
        channelId: "frigy_reminders",
      });
    });
  }

  if (config.weight.enabled) {
    const { hour, minute } = parseTime(config.weight.time);
    notifications.push({
      id: WEIGHT_ID,
      title: "⚖️ Zeit zum Wiegen!",
      body: "Dokumentiere deinen Fortschritt.",
      schedule: { at: nextDailyOccurrence(hour, minute), repeats: true, every: "day" },
      sound: "default",
      channelId: "frigy_reminders",
    });
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications });
  }
}

export async function syncRemindersFromStorage(): Promise<void> {
  const saved = localStorage.getItem("reminderConfig");
  if (!saved) return;
  try {
    await syncRemindersFromConfig(JSON.parse(saved) as ReminderConfig);
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
    water: { enabled: prefs.water, interval: 2 },
    meals: { enabled: prefs.meals, times: ["08:00", "12:00", "18:00"] },
    weight: { enabled: prefs.weight, time: "07:00" },
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
          body: "Benachrichtigungen wurden erfolgreich aktiviert!",
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
        body: "Benachrichtigungen wurden erfolgreich aktiviert!",
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
      });
      return;
    } catch {
      /* fallback below */
    }
  }

  new Notification("Frigy Erinnerungen", {
    body: "Benachrichtigungen wurden erfolgreich aktiviert!",
    icon: "/pwa-192x192.png",
  });
}
