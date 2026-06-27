import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  checkWebTrialEndingReminder,
  isNativeApp,
  resyncYesterdayBalanceNotificationForUser,
  syncRemindersFromStorage,
} from "@/lib/notifications";
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

    void runSync();
  }, []);

  return null;
}
