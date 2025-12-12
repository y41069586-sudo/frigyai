import { useEffect, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// For Capacitor native notifications
let PushNotifications: any = null;

// Dynamic import for Capacitor
const loadCapacitorPush = async () => {
  try {
    const module = await import("@capacitor/push-notifications");
    PushNotifications = module.PushNotifications;
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
      // Check if running in Capacitor
      const capacitorAvailable = await loadCapacitorPush();
      setIsCapacitor(capacitorAvailable && PushNotifications);

      if (capacitorAvailable && PushNotifications) {
        // Check current permission status
        const status = await PushNotifications.checkPermissions();
        setPermissionStatus(status.receive);

        // Listen for registration
        PushNotifications.addListener("registration", (token: any) => {
          console.log("Push registration token:", token.value);
          setToken(token.value);
          // TODO: Send token to server for later notifications
        });

        // Listen for registration errors
        PushNotifications.addListener("registrationError", (error: any) => {
          console.error("Push registration error:", error);
        });

        // Listen for push notifications
        PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
          console.log("Push notification received:", notification);
          toast({
            title: notification.title || "FriG AI",
            description: notification.body,
          });
        });

        // Listen for notification actions
        PushNotifications.addListener("pushNotificationActionPerformed", (notification: any) => {
          console.log("Push notification action:", notification);
        });
      } else {
        // Fallback to browser notifications
        if ("Notification" in window) {
          setPermissionStatus(Notification.permission as "granted" | "denied" | "prompt");
        }
      }
    };

    init();
  }, []);

  const requestPermission = useCallback(async () => {
    if (isCapacitor && PushNotifications) {
      // Request Capacitor push permission
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
    } else if ("Notification" in window) {
      // Request browser notification permission
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

    if (isCapacitor && PushNotifications) {
      // For local notifications on Capacitor, you'd use LocalNotifications plugin
      // This is for push notifications from server
      console.log("Would send Capacitor notification:", { title, body });
    } else if ("Notification" in window) {
      // Browser notification
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data,
      });
    }
  }, [isCapacitor, permissionStatus]);

  const scheduleReminder = useCallback(async (type: "water" | "meal" | "weight", time: Date) => {
    const titles: Record<string, string> = {
      water: "💧 Zeit für Wasser!",
      meal: "🍽️ Zeit fürs Essen!",
      weight: "⚖️ Wiegen nicht vergessen!",
    };

    const bodies: Record<string, string> = {
      water: "Bleib hydriert - trink ein Glas Wasser!",
      meal: "Vergiss nicht, dein Essen zu loggen.",
      weight: "Trage dein heutiges Gewicht ein.",
    };

    // For now, just use setTimeout for simple scheduling
    // In production, you'd use a proper scheduling system
    const delay = time.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        sendLocalNotification(titles[type], bodies[type]);
      }, delay);
    }
  }, [sendLocalNotification]);

  return {
    isCapacitor,
    permissionStatus,
    token,
    requestPermission,
    sendLocalNotification,
    scheduleReminder,
  };
};
