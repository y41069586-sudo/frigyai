import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  checkWebTrialEndingReminder,
  isNativeApp,
  resyncYesterdayBalanceNotificationForUser,
  syncRemindersFromStorage,
} from "@/lib/notifications";
import { FRIGY_LANGUAGE_CHANGED_EVENT } from "@/lib/mealPlanLanguage";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useReminders } from "@/hooks/useReminders";

/** Initializes push listeners (native) and reminder scheduling. */
export function NotificationBootstrap() {
  usePushNotifications();
  useReminders();
  const { user } = useAuth();

  const syncInFlight = useRef(false);

  useEffect(() => {
    checkWebTrialEndingReminder();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    void resyncYesterdayBalanceNotificationForUser(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!isNativeApp()) return;

    const runSync = async () => {
      if (syncInFlight.current) return;
      syncInFlight.current = true;
      try {
        await syncRemindersFromStorage();
      } finally {
        syncInFlight.current = false;
      }
    };

    // Sync on app-open so the 30-day pool stays fresh.
    void runSync();

    // When the user changes language, cancel the old pre-scheduled notifications
    // (which used the previous language) and reschedule with the new language.
    const onLanguageChange = () => void runSync();
    window.addEventListener(FRIGY_LANGUAGE_CHANGED_EVENT, onLanguageChange);
    return () => window.removeEventListener(FRIGY_LANGUAGE_CHANGED_EVENT, onLanguageChange);
  }, []);

  return null;
}
