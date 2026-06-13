import { useEffect, useRef } from "react";
import { getStoredLanguage } from "@/contexts/LanguageContext";
import {
  DAILY_PUSH_TIME,
  isNativeApp,
  normalizeReminderConfig,
  reminderNotificationCopy,
} from "@/lib/notifications";

const LAST_FIRED_KEY = "frigy_reminder_last_fired_v2";
const REMINDER_CONFIG_KEY = "reminderConfig";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function currentHm(): string {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
}

/** At most one push notification per calendar day. */
function markDailyPushFired(): boolean {
  const today = new Date().toDateString();
  const key = `daily-push:${today}`;
  try {
    const raw = localStorage.getItem(LAST_FIRED_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (map[key]) return false;
    map[key] = new Date().toISOString();
    const keys = Object.keys(map);
    if (keys.length > 14) {
      for (const k of keys.slice(0, keys.length - 7)) delete map[k];
    }
    localStorage.setItem(LAST_FIRED_KEY, JSON.stringify(map));
    return true;
  } catch {
    return true;
  }
}

function sendNotification(title: string, body: string, tag: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/pwa-192x192.png",
      tag,
    });
  } catch {
    /* ignore */
  }
}

export const useReminders = () => {
  const checkIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isNativeApp()) return;

    const tick = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;

      const saved = localStorage.getItem(REMINDER_CONFIG_KEY);
      if (!saved) return;

      let enabled = false;
      try {
        enabled = normalizeReminderConfig(JSON.parse(saved)).enabled;
      } catch {
        return;
      }
      if (!enabled) return;

      if (currentHm() !== DAILY_PUSH_TIME) return;
      if (!markDailyPushFired()) return;

      const copy = reminderNotificationCopy(getStoredLanguage());
      sendNotification(copy.dailyTitle, copy.dailyBody, "frigy-daily-push");
    };

    tick();
    checkIntervalRef.current = window.setInterval(tick, 60_000);

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === REMINDER_CONFIG_KEY) tick();
    };
    window.addEventListener("storage", onStorageChange);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);
};
