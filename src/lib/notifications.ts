import { Capacitor } from "@capacitor/core";
import { getStoredLanguage, type Language } from "@/contexts/LanguageContext";
import { notifyFrigyStorageUpdated } from "@/lib/frigyStorageSync";
import { getLocalDateISO } from "@/lib/localDate";
import { readStoredTrackerTargets } from "@/lib/trackerTargets";
import { YESTERDAY_BALANCE_MIN_DELTA, type YesterdayCalorieBalance } from "@/lib/yesterdayCalorieBalance";
import { supabase } from "@/integrations/supabase/client";

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
const TRIAL_REMINDER_ID = 4100;
const YESTERDAY_BALANCE_ID = 4200;
const TRIAL_REMINDER_AT_KEY = "frigy_trial_reminder_at";
const YESTERDAY_BALANCE_PENDING_KEY = "frigy_yesterday_balance_pending";
const YESTERDAY_BALANCE_WEB_SENT_PREFIX = "frigy_yesterday_balance_web_";
const YESTERDAY_BALANCE_NOTIFY_HOUR = 8;
const YESTERDAY_BALANCE_NOTIFY_MINUTE = 15;

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

/** Daily water slots for web + native (no tight setInterval). */
export function buildWaterSchedule(intervalHours: number): { hour: number; minute: number }[] {
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
    const ids = (pending.notifications ?? [])
      .filter((n) => n.id !== TRIAL_REMINDER_ID && n.id !== YESTERDAY_BALANCE_ID)
      .map((n) => ({ id: n.id }));
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
  const normalized = normalizeReminderConfig(config);
  // Do not notifyFrigyStorageUpdated here — would re-sync on every food/plan save and spam notifications.

  if (!isNativeApp()) return;

  const copy = reminderNotificationCopy(getStoredLanguage());
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
        title: copy.waterTitle,
        body: copy.waterBody,
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
        title: `🍽️ ${copy.mealName(hour)}!`,
        body: copy.mealBody,
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
        title: copy.weightTitle,
        body: copy.weightBody,
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

function trialReminderCopy(language: Language) {
  if (language === "en") {
    return {
      title: "⏰ Your trial ends soon",
      body: "Your 3-day free trial ends tomorrow. Cancel in subscription settings if you don't want to continue.",
    };
  }
  if (language === "fr") {
    return {
      title: "⏰ Ton essai se termine bientôt",
      body: "Ton essai gratuit de 3 jours se termine demain. Annule dans les réglages d'abonnement si tu ne veux pas continuer.",
    };
  }
  return {
    title: "⏰ Testphase endet bald",
    body: "Deine 3-tägige Testphase endet morgen. Kündige in den Abo-Einstellungen, wenn du nicht weitermachen möchtest.",
  };
}

function computeTrialReminderAt(from: Date = new Date()): Date {
  const at = new Date(from);
  at.setDate(at.getDate() + 2);
  at.setHours(10, 0, 0, 0);
  return at;
}

/** Native: schedule stored trial reminder after notification permission is granted. */
export async function applyPendingTrialReminderNative(): Promise<void> {
  if (!isNativeApp()) return;
  if ((await getNotificationPermission()) !== "granted") return;

  const raw = localStorage.getItem(TRIAL_REMINDER_AT_KEY);
  if (!raw) return;

  let at: Date;
  try {
    at = new Date(raw);
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) return;
  } catch {
    return;
  }

  const copy = trialReminderCopy(getStoredLanguage());
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await ensureAndroidReminderChannel(LocalNotifications);
  await LocalNotifications.cancel({ notifications: [{ id: TRIAL_REMINDER_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TRIAL_REMINDER_ID,
        title: copy.title,
        body: copy.body,
        schedule: { at },
        sound: "default",
        channelId: "frigy_reminders",
      },
    ],
  });
}

/** Paywall promise: reminder on day 2 of the 3-day monthly trial. */
export async function scheduleTrialEndingReminder(): Promise<void> {
  try {
    let at: Date;
    const existing = localStorage.getItem(TRIAL_REMINDER_AT_KEY);
    if (existing) {
      at = new Date(existing);
      if (Number.isNaN(at.getTime())) {
        at = computeTrialReminderAt();
        localStorage.setItem(TRIAL_REMINDER_AT_KEY, at.toISOString());
      }
    } else {
      at = computeTrialReminderAt();
      if (at.getTime() <= Date.now()) return;
      localStorage.setItem(TRIAL_REMINDER_AT_KEY, at.toISOString());
    }

    if (at.getTime() <= Date.now()) return;

    if (isNativeApp()) {
      await applyPendingTrialReminderNative();
    }
  } catch (error) {
    console.warn("[notifications] Trial reminder schedule failed:", error);
  }
}

/** Web/PWA: fire trial reminder when stored time is reached (app open). */
export function checkWebTrialEndingReminder(): void {
  if (isNativeApp()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const raw = localStorage.getItem(TRIAL_REMINDER_AT_KEY);
  if (!raw) return;

  let at: Date;
  try {
    at = new Date(raw);
    if (Number.isNaN(at.getTime())) return;
  } catch {
    return;
  }

  if (Date.now() < at.getTime()) return;

  const copy = trialReminderCopy(getStoredLanguage());
  try {
    new Notification(copy.title, {
      body: copy.body,
      icon: "/pwa-192x192.png",
      tag: "frigy-trial-reminder",
    });
  } catch {
    /* ignore */
  } finally {
    localStorage.removeItem(TRIAL_REMINDER_AT_KEY);
  }
}

type YesterdayBalancePending = {
  forDateIso: string;
  eatenCalories: number;
  targetCalories: number;
  at: string;
};

function yesterdayBalanceNotificationCopy(
  language: Language,
  delta: number,
  eaten: number,
  target: number,
): { title: string; body: string } {
  const absDelta = Math.abs(delta);
  if (language === "en") {
    return delta > 0
      ? {
          title: "Yesterday over your calorie goal",
          body: `You ate ${absDelta} kcal more than your goal (${eaten} of ${target} kcal). Open Frigy to adjust today's meal plan.`,
        }
      : {
          title: "Yesterday under your calorie goal",
          body: `You ate ${absDelta} kcal less than your goal (${eaten} of ${target} kcal). Open Frigy to adjust today's meal plan.`,
        };
  }
  if (language === "fr") {
    return delta > 0
      ? {
          title: "Hier au-dessus de ton objectif",
          body: `Tu as mangé ${absDelta} kcal de plus que ton objectif (${eaten} sur ${target} kcal). Ouvre Frigy pour ajuster le plan du jour.`,
        }
      : {
          title: "Hier en dessous de ton objectif",
          body: `Tu as mangé ${absDelta} kcal de moins que ton objectif (${eaten} sur ${target} kcal). Ouvre Frigy pour ajuster le plan du jour.`,
        };
  }
  return delta > 0
    ? {
        title: "Gestern über dem Kalorienziel",
        body: `Du warst ${absDelta} kcal über deinem Ziel (${eaten} von ${target} kcal). Öffne Frigy, um den heutigen Wochenplan anzupassen.`,
      }
    : {
        title: "Gestern unter dem Kalorienziel",
        body: `Du warst ${absDelta} kcal unter deinem Ziel (${eaten} von ${target} kcal). Öffne Frigy, um den heutigen Wochenplan anzupassen.`,
      };
}

function computeNextMorningBalanceAt(from = new Date()): Date {
  const at = new Date(from);
  at.setDate(at.getDate() + 1);
  at.setHours(YESTERDAY_BALANCE_NOTIFY_HOUR, YESTERDAY_BALANCE_NOTIFY_MINUTE, 0, 0);
  return at;
}

function isMorningBalanceWindowOpen(now = new Date()): boolean {
  const start = new Date(now);
  start.setHours(YESTERDAY_BALANCE_NOTIFY_HOUR, YESTERDAY_BALANCE_NOTIFY_MINUTE, 0, 0);
  return now.getTime() >= start.getTime();
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

/** Schedule native push for tomorrow morning when today is over/under calorie goal. */
export async function scheduleYesterdayBalanceNotification(opts: {
  eatenCalories: number;
  targetCalories: number;
  forDateIso?: string;
}): Promise<void> {
  const forDateIso = opts.forDateIso ?? getLocalDateISO();
  const eaten = Math.max(0, Math.round(opts.eatenCalories));
  const target = Math.max(0, Math.round(opts.targetCalories));
  const delta = eaten - target;

  if (!target || eaten <= 0 || Math.abs(delta) < YESTERDAY_BALANCE_MIN_DELTA) {
    localStorage.removeItem(YESTERDAY_BALANCE_PENDING_KEY);
    await cancelYesterdayBalanceNotificationNative();
    return;
  }

  const at = computeNextMorningBalanceAt();
  if (at.getTime() <= Date.now()) return;

  const pending: YesterdayBalancePending = {
    forDateIso,
    eatenCalories: eaten,
    targetCalories: target,
    at: at.toISOString(),
  };
  localStorage.setItem(YESTERDAY_BALANCE_PENDING_KEY, JSON.stringify(pending));

  if (!isNativeApp()) return;
  if ((await getNotificationPermission()) !== "granted") return;

  const copy = yesterdayBalanceNotificationCopy(getStoredLanguage(), delta, eaten, target);
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await ensureAndroidReminderChannel(LocalNotifications);
  await LocalNotifications.cancel({ notifications: [{ id: YESTERDAY_BALANCE_ID }] });
  await LocalNotifications.schedule({
    notifications: [
      {
        id: YESTERDAY_BALANCE_ID,
        title: copy.title,
        body: copy.body,
        schedule: { at },
        sound: "default",
        channelId: "frigy_reminders",
      },
    ],
  });
}

export async function applyPendingYesterdayBalanceNotificationNative(): Promise<void> {
  if (!isNativeApp()) return;
  if ((await getNotificationPermission()) !== "granted") return;

  const raw = localStorage.getItem(YESTERDAY_BALANCE_PENDING_KEY);
  if (!raw) return;

  try {
    const pending = JSON.parse(raw) as YesterdayBalancePending;
    const at = new Date(pending.at);
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
      localStorage.removeItem(YESTERDAY_BALANCE_PENDING_KEY);
      return;
    }
    await scheduleYesterdayBalanceNotification({
      eatenCalories: pending.eatenCalories,
      targetCalories: pending.targetCalories,
      forDateIso: pending.forDateIso,
    });
  } catch {
    localStorage.removeItem(YESTERDAY_BALANCE_PENDING_KEY);
  }
}

/** Re-schedule morning balance push from today's tracked macros (app start). */
export async function resyncYesterdayBalanceNotificationForUser(userId: string): Promise<void> {
  const target = readStoredTrackerTargets()?.dailyCalories ?? 0;
  if (!target) return;

  const date = getLocalDateISO();
  const { data, error } = await supabase
    .from("daily_macros")
    .select("calories")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (error) return;

  await scheduleYesterdayBalanceNotification({
    eatenCalories: Math.round(Number(data?.calories) || 0),
    targetCalories: target,
    forDateIso: date,
  });
}

/** Web/PWA: show balance notification on first morning open (no background scheduler). */
export function maybeShowWebYesterdayBalanceNotification(balance: YesterdayCalorieBalance): void {
  if (isNativeApp()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!isMorningBalanceWindowOpen()) return;

  const sentKey = `${YESTERDAY_BALANCE_WEB_SENT_PREFIX}${balance.date}`;
  if (localStorage.getItem(sentKey) === "1") return;

  const copy = yesterdayBalanceNotificationCopy(
    getStoredLanguage(),
    balance.delta,
    balance.eatenCalories,
    balance.targetCalories,
  );

  try {
    new Notification(copy.title, {
      body: copy.body,
      icon: "/pwa-192x192.png",
      tag: `frigy-yesterday-balance-${balance.date}`,
    });
    localStorage.setItem(sentKey, "1");
  } catch {
    /* ignore */
  }
}
