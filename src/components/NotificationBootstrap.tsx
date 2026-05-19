import { useEffect } from "react";
import { FRIGY_STORAGE_UPDATED } from "@/lib/frigyStorageSync";
import { isNativeApp, syncRemindersFromStorage } from "@/lib/notifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useReminders } from "@/hooks/useReminders";

/** Initializes push listeners (native) and reminder scheduling. */
export function NotificationBootstrap() {
  usePushNotifications();
  useReminders();

  useEffect(() => {
    if (!isNativeApp()) return;
    void syncRemindersFromStorage();

    const onStorageUpdate = () => {
      void syncRemindersFromStorage();
    };
    window.addEventListener(FRIGY_STORAGE_UPDATED, onStorageUpdate);
    return () => window.removeEventListener(FRIGY_STORAGE_UPDATED, onStorageUpdate);
  }, []);

  return null;
}
