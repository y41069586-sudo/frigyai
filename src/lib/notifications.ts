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

/** Returns the day-of-year (1–366) for the given date (defaults to today). */
function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.round((date.getTime() - start.getTime()) / 86_400_000);
}

type MessagePair = { title: string; body: string };

const MESSAGES: Record<Language, MessagePair[]> = {
  de: [
    { title: "🍽️ Mahlzeit geloggt?", body: "Öffne Frigy und trag ein, was du heute gegessen hast." },
    { title: "💧 Genug getrunken heute?", body: "Bleib hydriert — log deinen Wasserkonsum jetzt." },
    { title: "💪 Dein Ziel wartet!", body: "Kleine Schritte zählen. Öffne Frigy und bleib auf Kurs." },
    { title: "📊 Wie läuft dein Tag?", body: "Schau kurz, wo du beim Kalorienziel stehst." },
    { title: "⚖️ Gewicht getrackt?", body: "Deine Daten helfen dir, Muster zu erkennen und Ziele zu erreichen." },
    { title: "🥗 Was war dein Mittagessen?", body: "Ein Foto reicht — log es jetzt und behalte den Überblick." },
    { title: "🌟 Gut gemacht, weiter so!", body: "Öffne Frigy und trag deine heutige Mahlzeit ein." },
    { title: "🔥 Kalorien im Blick!", body: "Kurz eintragen und wissen, wie viel noch übrig ist." },
    { title: "🧠 Wusstest du?", body: "Regelmäßiges Tracking hilft, Gewohnheiten dauerhaft zu verbessern." },
    { title: "🎯 Zielgerade im Blick!", body: "Log deine Mahlzeit — jeder Eintrag bringt dich näher ans Ziel." },
    { title: "🥦 Gemüse heute dabei?", body: "Öffne Frigy und schau, wie ausgewogen dein Tag war." },
    { title: "⏰ Mittagspause — Zeit für Frigy!", body: "Trag jetzt ein, was du gegessen hast." },
    { title: "🏃 Aktiv geblieben heute?", body: "Log deine Mahlzeiten und behalte dein Energielevel im Blick." },
    { title: "💡 Tipp des Tages", body: "Proteine sättigen länger — schau, ob du heute genug hattest." },
    { title: "🍎 Fruchtig gesund?", body: "Öffne Frigy und log, was du heute zu dir genommen hast." },
    { title: "📱 30 Sekunden reichen!", body: "Schnell einloggen und den Rest des Tages genießen." },
    { title: "🌱 Gesund essen, besser fühlen", body: "Track deine Mahlzeiten und erkenne, was dir Energie gibt." },
    { title: "🍳 Frühstück, Mittag, Abend?", body: "Was fehlt noch? Öffne Frigy und füll die Lücken." },
    { title: "💬 Kleine Gewohnheit, große Wirkung", body: "Täglich tracken macht den Unterschied — öffne Frigy." },
    { title: "🏅 Dein bester Tag wartet!", body: "Log was du gegessen hast und bleib deinen Zielen treu." },
    { title: "🌊 Wasser nicht vergessen!", body: "Hydrierung ist wichtig — log deinen Wasserkonsum in Frigy." },
    { title: "🥩 Protein auf Kurs?", body: "Schau kurz nach — öffne Frigy und check deine Makros." },
    { title: "🧘 Balance ist alles", body: "Öffne Frigy und tracke, wie ausgewogen dein Tag heute war." },
    { title: "📅 Tag im Griff?", body: "Ein kurzer Blick in Frigy zeigt dir, wie du unterwegs bist." },
    { title: "🌈 Bunt essen?", body: "Verschiedene Farben auf dem Teller = verschiedene Nährstoffe." },
    { title: "🎉 Du schaffst das!", body: "Öffne Frigy und zeig deinem Körper, wie gut du für ihn sorgst." },
    { title: "⚡ Energie tanken!", body: "Track deine Mahlzeiten und entdecke, was dir Power gibt." },
    { title: "🔍 Makros im Check?", body: "Öffne Frigy — Kohlenhydrate, Fette, Proteine im Blick." },
    { title: "🍵 Mittagspause nutzen!", body: "Schnell die letzte Mahlzeit eintragen — dauert nur 30 Sekunden." },
    { title: "💫 Konsistenz gewinnt!", body: "Jeden Tag ein Eintrag — öffne Frigy und bleib dabei." },
  ],
  en: [
    { title: "🍽️ Meal logged yet?", body: "Open Frigy and track what you ate today." },
    { title: "💧 Staying hydrated?", body: "Log your water intake and keep your streak going." },
    { title: "💪 Your goal is waiting!", body: "Small steps add up. Open Frigy and stay on track." },
    { title: "📊 How's your day going?", body: "Check how close you are to your calorie goal." },
    { title: "⚖️ Tracked your weight?", body: "Your data helps you spot patterns and hit goals." },
    { title: "🥗 What did you have for lunch?", body: "One photo is enough — log it now and stay on track." },
    { title: "🌟 Great job, keep it up!", body: "Open Frigy and log today's meal." },
    { title: "🔥 Calories in check!", body: "Quick entry — see how much you have left for the day." },
    { title: "🧠 Did you know?", body: "Regular tracking helps you improve habits for good." },
    { title: "🎯 Finish line in sight!", body: "Log your meal — every entry brings you closer to your goal." },
    { title: "🥦 Veggies in today?", body: "Open Frigy and see how balanced your day was." },
    { title: "⏰ Lunch break — Frigy time!", body: "Log what you just ate while it's fresh." },
    { title: "🏃 Active today?", body: "Log your meals and keep an eye on your energy balance." },
    { title: "💡 Today's tip", body: "Protein keeps you fuller longer — check if you hit your target." },
    { title: "🍎 Eating your fruits?", body: "Open Frigy and log what you've had today." },
    { title: "📱 30 seconds is all it takes!", body: "Log it quick and enjoy the rest of your day." },
    { title: "🌱 Eat well, feel great", body: "Track your meals and see what gives you energy." },
    { title: "🍳 Breakfast, lunch, dinner?", body: "What's missing? Open Frigy and fill in the gaps." },
    { title: "💬 Small habit, big results", body: "Daily tracking makes the difference — open Frigy." },
    { title: "🏅 Your best day awaits!", body: "Log what you ate and stay true to your goals." },
    { title: "🌊 Don't forget water!", body: "Hydration matters — log your water intake in Frigy." },
    { title: "🥩 Protein on track?", body: "Quick check — open Frigy and review your macros." },
    { title: "🧘 Balance is everything", body: "Open Frigy and see how balanced your day was." },
    { title: "📅 Got your day covered?", body: "A quick glance at Frigy shows your progress." },
    { title: "🌈 Eating the rainbow?", body: "Different colors on your plate = different nutrients." },
    { title: "🎉 You've got this!", body: "Open Frigy and show your body how well you treat it." },
    { title: "⚡ Fuel up!", body: "Track your meals and discover what gives you power." },
    { title: "🔍 Macros in check?", body: "Open Frigy — carbs, fats, protein at a glance." },
    { title: "🍵 Use your lunch break!", body: "Log your last meal — it only takes 30 seconds." },
    { title: "💫 Consistency wins!", body: "One entry a day — open Frigy and keep it up." },
  ],
  fr: [
    { title: "🍽️ Repas noté ?", body: "Ouvre Frigy et enregistre ce que tu as mangé aujourd'hui." },
    { title: "💧 Tu bois assez ?", body: "Note ta consommation d'eau et garde le rythme." },
    { title: "💪 Ton objectif t'attend !", body: "Les petits pas font les grands progrès. Ouvre Frigy." },
    { title: "📊 Comment se passe ta journée ?", body: "Vérifie où tu en es par rapport à ton objectif calorique." },
    { title: "⚖️ Poids noté aujourd'hui ?", body: "Tes données t'aident à repérer des tendances et à atteindre tes objectifs." },
    { title: "🥗 Qu'as-tu mangé à midi ?", body: "Une photo suffit — note-le maintenant et reste sur la bonne voie." },
    { title: "🌟 Bravo, continue !", body: "Ouvre Frigy et note ton repas du jour." },
    { title: "🔥 Calories sous contrôle !", body: "Note vite — vois ce qu'il te reste pour la journée." },
    { title: "🧠 Le savais-tu ?", body: "Le suivi régulier t'aide à améliorer tes habitudes durablement." },
    { title: "🎯 La ligne d'arrivée est proche !", body: "Note ton repas — chaque entrée te rapproche de ton objectif." },
    { title: "🥦 Des légumes aujourd'hui ?", body: "Ouvre Frigy et vois à quel point ta journée est équilibrée." },
    { title: "⏰ Pause déjeuner — c'est l'heure Frigy !", body: "Note ce que tu viens de manger pendant que c'est frais." },
    { title: "🏃 Actif aujourd'hui ?", body: "Note tes repas et surveille ton bilan énergétique." },
    { title: "💡 Conseil du jour", body: "Les protéines rassasient plus longtemps — vérifie si tu as atteint ta cible." },
    { title: "🍎 Tu manges des fruits ?", body: "Ouvre Frigy et note ce que tu as consommé aujourd'hui." },
    { title: "📱 30 secondes suffisent !", body: "Note vite et profite du reste de ta journée." },
    { title: "🌱 Bien manger, se sentir bien", body: "Suis tes repas et découvre ce qui te donne de l'énergie." },
    { title: "🍳 Petit-déj, déjeuner, dîner ?", body: "Qu'est-ce qui manque ? Ouvre Frigy et complète." },
    { title: "💬 Petite habitude, grands résultats", body: "Le suivi quotidien fait la différence — ouvre Frigy." },
    { title: "🏅 Ta meilleure journée t'attend !", body: "Note ce que tu as mangé et reste fidèle à tes objectifs." },
    { title: "🌊 N'oublie pas l'eau !", body: "L'hydratation est essentielle — note ta consommation dans Frigy." },
    { title: "🥩 Protéines en bonne voie ?", body: "Vérification rapide — ouvre Frigy et consulte tes macros." },
    { title: "🧘 L'équilibre avant tout", body: "Ouvre Frigy et vois si ta journée est bien équilibrée." },
    { title: "📅 Ta journée est bien gérée ?", body: "Un coup d'œil dans Frigy te montre ta progression." },
    { title: "🌈 Tu manges varié ?", body: "Des couleurs variées dans l'assiette = des nutriments variés." },
    { title: "🎉 Tu y arrives !", body: "Ouvre Frigy et montre à ton corps combien tu en prends soin." },
    { title: "⚡ Faits le plein d'énergie !", body: "Suis tes repas et découvre ce qui te donne de la puissance." },
    { title: "🔍 Macros vérifiés ?", body: "Ouvre Frigy — glucides, lipides, protéines en un coup d'œil." },
    { title: "🍵 Profite de ta pause !", body: "Note ton dernier repas — ça ne prend que 30 secondes." },
    { title: "💫 La constance gagne !", body: "Une entrée par jour — ouvre Frigy et continue." },
  ],
};

/**
 * Pick a varied daily notification message.
 * dayOffset=0 → today, dayOffset=1 → tomorrow, etc.
 * Uses the day-of-year so the same day always gets the same message,
 * and messages rotate through the full pool before repeating.
 */
export function reminderNotificationCopy(
  language: Language,
  dayOffset: number = 0,
): { dailyTitle: string; dailyBody: string } {
  const pool = MESSAGES[language] ?? MESSAGES.de;
  const index = (dayOfYear() + dayOffset) % pool.length;
  const { title, body } = pool[index];
  return { dailyTitle: title, dailyBody: body };
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
    // Fallback: cancel known ID ranges
    const fallbackIds = [
      TEST_ID,
      YESTERDAY_BALANCE_ID,
      // Legacy water reminder IDs (100–107)
      ...Array.from({ length: 8 }, (_, i) => ({ id: 100 + i })),
      // Legacy single daily push ID
      { id: 150 },
      // New varied daily push IDs
      ...Array.from({ length: DAYS_AHEAD }, (_, i) => ({ id: DAILY_PUSH_BASE_ID + i })),
    ].map((x) => (typeof x === "number" ? { id: x } : x));
    await LocalNotifications.cancel({ notifications: fallbackIds });
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

  const lang = getStoredLanguage();
  const { hour, minute } = parseTime(DAILY_PUSH_TIME);

  // Schedule the next DAYS_AHEAD days individually so each day gets a different
  // message. Individual scheduled notifications are more reliable on iOS than
  // a single `repeats: true` trigger which can be silently skipped.
  const base = nextDailyOccurrence(hour, minute);
  const notifications = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const at = new Date(base);
    at.setDate(at.getDate() + i);
    const copy = reminderNotificationCopy(lang, i);
    return {
      id: DAILY_PUSH_BASE_ID + i,
      title: copy.dailyTitle,
      body: copy.dailyBody,
      schedule: { at },
      sound: "default",
      channelId: "frigy_reminders",
    };
  });

  await LocalNotifications.schedule({ notifications });
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
