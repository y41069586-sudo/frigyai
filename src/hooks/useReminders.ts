import { useEffect, useRef } from "react";
import { getStoredLanguage } from "@/contexts/LanguageContext";
import {
  buildWaterSchedule,
  isNativeApp,
  normalizeReminderConfig,
  reminderNotificationCopy,
  type ReminderConfig,
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

function slotHm(slot: { hour: number; minute: number }): string {
  return `${pad2(slot.hour)}:${pad2(slot.minute)}`;
}

/** At most one notification per logical slot per calendar day. */
function markFiredIfNew(slotId: string): boolean {
  const today = new Date().toDateString();
  const key = `${slotId}:${today}`;
  try {
    const raw = localStorage.getItem(LAST_FIRED_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    if (map[key]) return false;
    map[key] = new Date().toISOString();
    const keys = Object.keys(map);
    if (keys.length > 40) {
      for (const k of keys.slice(0, keys.length - 30)) delete map[k];
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

      let config: ReminderConfig;
      try {
        config = normalizeReminderConfig(JSON.parse(saved) as ReminderConfig);
      } catch {
        return;
      }

      const hm = currentHm();
      const copy = reminderNotificationCopy(getStoredLanguage());

      if (config.water.enabled) {
        const slots = buildWaterSchedule(config.water.interval);
        for (let i = 0; i < slots.length; i++) {
          if (hm !== slotHm(slots[i]!)) continue;
          if (!markFiredIfNew(`water-${i}-${slotHm(slots[i]!)}`)) continue;
          sendNotification(copy.waterTitle, copy.waterBody, "frigy-water");
          break;
        }
      }

      if (config.meals.enabled) {
        for (const time of config.meals.times) {
          if (hm !== time.trim()) continue;
          if (!markFiredIfNew(`meal-${time}`)) continue;
          const hour = new Date().getHours();
          const mealName =
            hour < 11 ? copy.mealName(8) : hour < 16 ? copy.mealName(12) : copy.mealName(19);
          sendNotification(`🍽️ ${mealName}!`, copy.mealBody, `frigy-meal-${time}`);
        }
      }

      if (config.weight.enabled && hm === config.weight.time.trim()) {
        if (markFiredIfNew(`weight-${config.weight.time}`)) {
          sendNotification(copy.weightTitle, copy.weightBody, "frigy-weight");
        }
      }
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
