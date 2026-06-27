/** Local calendar date as YYYY-MM-DD (matches Supabase `food_entries.date`). */
export function getLocalDateISO(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local calendar date as `Date#toDateString()` (matches `todayFood` cache). */
export function getLocalDateString(date = new Date()): string {
  return date.toDateString();
}

export function isSameLocalCalendarDay(a: Date, b: Date): boolean {
  return getLocalDateISO(a) === getLocalDateISO(b);
}

export function getLocalYesterdayISO(date = new Date()): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getLocalDateISO(d);
}

/** Montag der aktuellen Kalenderwoche (lokal) als YYYY-MM-DD. */
export function getLocalWeekStartISO(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return getLocalDateISO(d);
}
