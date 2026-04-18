/** Wird ausgelöst, wenn sich lokale App-Daten ändern (Wochenplan, Einkaufsliste, …). */
export const FRIGY_STORAGE_UPDATED = "frigy-storage-updated";

/** localStorage-Wert `"1"` = Hinweis „Wochenplan / Kühlschrank“ nach Kauf wurde gezeigt oder verworfen */
export const POST_PAY_WEEKPLAN_COACH_DISMISSED_KEY = "frigy_post_pay_weekplan_coach";

export function notifyFrigyStorageUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FRIGY_STORAGE_UPDATED));
}
