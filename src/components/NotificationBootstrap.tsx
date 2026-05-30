import { useEffect, useRef } from "react";
import { isNativeApp, syncRemindersFromStorage } from "@/lib/notifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useReminders } from "@/hooks/useReminders";

/** Initializes push listeners (native) and reminder scheduling. */
export function NotificationBootstrap() {
  usePushNotifications();
  useReminders();

  const syncInFlight = useRef(false);

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
