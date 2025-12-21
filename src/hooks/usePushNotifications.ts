import { useEffect, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// For Capacitor notifications
let PushNotifications: any = null;
let LocalNotifications: any = null;

// Dynamic imports for Capacitor
const loadCapacitorPlugins = async () => {
  try {
    const [pushModule, localModule] = await Promise.all([
      import("@capacitor/push-notifications").catch(() => null),
      import("@capacitor/local-notifications").catch(() => null),
    ]);
    
    if (pushModule) PushNotifications = pushModule.PushNotifications;
    if (localModule) LocalNotifications = localModule.LocalNotifications;
    
    return true;
  } catch {
    return false;
  }
};

export const usePushNotifications = () => {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt">("prompt");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const capacitorAvailable = await loadCapacitorPlugins();
      setIsCapacitor(capacitorAvailable && (PushNotifications || LocalNotifications));

      if (capacitorAvailable && PushNotifications) {
        const status = await PushNotifications.checkPermissions();
        setPermissionStatus(status.receive);

        PushNotifications.addListener("registration", (token: any) => {
          console.log("Push registration token:", token.value);
          setToken(token.value);
        });

        PushNotifications.addListener("registrationError", (error: any) => {
          console.error("Push registration error:", error);
        });

        PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
          console.log("Push notification received:", notification);
          toast({
            title: notification.title || "FrigBuddy",
            description: notification.body,
          });
        });

        PushNotifications.addListener("pushNotificationActionPerformed", (notification: any) => {
          console.log("Push notification action:", notification);
        });
      } else if (capacitorAvailable && LocalNotifications) {
        const status = await LocalNotifications.checkPermissions();
        setPermissionStatus(status.display);
      } else {
        if ("Notification" in window) {
          setPermissionStatus(Notification.permission as "granted" | "denied" | "prompt");
        }
      }
    };

    init();
  }, []);

  const requestPermission = useCallback(async () => {
    if (isCapacitor && PushNotifications) {
      const result = await PushNotifications.requestPermissions();
      setPermissionStatus(result.receive);

      if (result.receive === "granted") {
        await PushNotifications.register();
        toast({
          title: "🔔 Benachrichtigungen aktiviert!",
          description: "Du erhältst jetzt Push-Benachrichtigungen.",
        });
      }
      return result.receive === "granted";
    } else if (isCapacitor && LocalNotifications) {
      const result = await LocalNotifications.requestPermissions();
      setPermissionStatus(result.display);
      
      if (result.display === "granted") {
        toast({
          title: "🔔 Benachrichtigungen aktiviert!",
          description: "Du erhältst jetzt lokale Erinnerungen.",
        });
      }
      return result.display === "granted";
    } else if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setPermissionStatus(result as "granted" | "denied" | "prompt");
      
      if (result === "granted") {
        toast({
          title: "🔔 Benachrichtigungen aktiviert!",
          description: "Du erhältst jetzt Browser-Benachrichtigungen.",
        });
      }
      return result === "granted";
    }
    return false;
  }, [isCapacitor]);

  const sendLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    if (permissionStatus !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    if (isCapacitor && LocalNotifications) {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) },
            sound: "default",
            extra: data,
          },
        ],
      });
    } else if ("Notification" in window) {
      new Notification(title, {
        body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data,
      });
    }
  }, [isCapacitor, permissionStatus]);

  const scheduleReminder = useCallback(async (
    type: "water" | "meal" | "weight", 
    time: Date,
    recurring: boolean = false
  ) => {
    const config: Record<string, { title: string; body: string; icon: string }> = {
      water: {
        title: "💧 Zeit für Wasser!",
        body: "Bleib hydriert - trink ein Glas Wasser!",
        icon: "💧",
      },
      meal: {
        title: "🍽️ Zeit fürs Essen!",
        body: "Vergiss nicht, dein Essen zu loggen.",
        icon: "🍽️",
      },
      weight: {
        title: "⚖️ Wiegen nicht vergessen!",
        body: "Trage dein heutiges Gewicht ein.",
        icon: "⚖️",
      },
    };

    const { title, body } = config[type];

    if (isCapacitor && LocalNotifications) {
      const notificationId = type === "water" ? 1 : type === "meal" ? 2 : 3;
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title,
            body,
            schedule: { 
              at: time,
              repeats: recurring,
              every: recurring ? "day" : undefined,
            },
            sound: "default",
            smallIcon: "ic_stat_icon_config_sample",
            largeIcon: "ic_launcher",
          },
        ],
      });
      
      console.log(`Scheduled ${type} reminder for ${time.toISOString()}`);
      return true;
    } else {
      // Browser fallback with setTimeout
      const delay = time.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          sendLocalNotification(title, body, { type });
        }, delay);
        return true;
      }
    }
    return false;
  }, [isCapacitor, sendLocalNotification]);

  const cancelReminder = useCallback(async (type: "water" | "meal" | "weight") => {
    if (isCapacitor && LocalNotifications) {
      const notificationId = type === "water" ? 1 : type === "meal" ? 2 : 3;
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      console.log(`Cancelled ${type} reminder`);
    }
  }, [isCapacitor]);

  const scheduleWaterReminders = useCallback(async (intervalHours: number = 2) => {
    if (permissionStatus !== "granted") return false;

    // Schedule reminders every X hours from 8am to 10pm
    const now = new Date();
    const reminders: Date[] = [];
    
    for (let hour = 8; hour <= 22; hour += intervalHours) {
      const reminderTime = new Date(now);
      reminderTime.setHours(hour, 0, 0, 0);
      
      if (reminderTime > now) {
        reminders.push(reminderTime);
      }
    }

    if (isCapacitor && LocalNotifications) {
      const notifications = reminders.map((time, index) => ({
        id: 100 + index,
        title: "💧 Zeit für Wasser!",
        body: "Bleib hydriert - trink ein Glas Wasser!",
        schedule: { at: time },
        sound: "default",
      }));

      await LocalNotifications.schedule({ notifications });
      return true;
    }
    
    return false;
  }, [isCapacitor, permissionStatus]);

  return {
    isCapacitor,
    permissionStatus,
    token,
    requestPermission,
    sendLocalNotification,
    scheduleReminder,
    cancelReminder,
    scheduleWaterReminders,
  };
};
