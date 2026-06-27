import type { Language } from "@/contexts/LanguageContext";

/** 24h "HH:mm" → "7:15 AM" (en) or "07:15" (de/fr). */
export function formatReminderTime(time24: string, language: Language): string {
  const [hStr, mStr] = time24.split(":");
  const hour = Number.parseInt(hStr ?? "", 10);
  const minute = Number.parseInt(mStr ?? "0", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return time24;

  if (language === "en") {
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  }

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export const WEIGHT_REMINDER_TIMES = ["06:00", "07:00", "07:15", "08:00", "09:00"] as const;
