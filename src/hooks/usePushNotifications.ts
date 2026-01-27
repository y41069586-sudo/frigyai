import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

// For Capacitor notifications
let PushNotifications: unknown = null;
let LocalNotifications: unknown = null;

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

// Check if browser supports notifications
const isBrowserNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Register service worker for push notifications
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw-notifications.js');
      console.log('[Fridgie] Service Worker registered:', registration.scope);
      return registration;
    } catch (error) {
      console.error('[Fridgie] Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

export const usePushNotifications = () => {
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "prompt">("prompt");
  const [token, setToken] = useState<string | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Track reminder timeouts for cleanup
  const reminderTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const init = async () => {
      // Check browser support first
      const browserSupported = isBrowserNotificationSupported();
      setIsBrowserSupported(browserSupported);

      // Check if we're in a native Capacitor environment (not web)
      const isNativeApp = typeof (window as any).Capacitor !== 'undefined' &&
                          (window as any).Capacitor.isNativePlatform?.();

      if (!isNativeApp) {
        // Web environment - use browser notifications only
        if (browserSupported) {
          setPermissionStatus(Notification.permission as "granted" | "denied" | "prompt");
          const registration = await registerServiceWorker();
          if (registration) {
            setSwRegistration(registration);
          }
        }
        return;
      }

      // Try to load Capacitor plugins (only in native app)
      const capacitorAvailable = await loadCapacitorPlugins();
      setIsCapacitor(capacitorAvailable && (PushNotifications || LocalNotifications));

      try {
        if (capacitorAvailable && PushNotifications) {
          // Capacitor Push Notifications
          const status = await PushNotifications.checkPermissions();
          setPermissionStatus(status.receive);

          PushNotifications.addListener("registration", (token: Record<string, unknown>) => {
            console.log("Push registration token:", token.value);
            setToken(token.value as string);
          });

          PushNotifications.addListener("registrationError", (error: Record<string, unknown>) => {
            console.error("Push registration error:", error);
          });

          PushNotifications.addListener("pushNotificationReceived", (notification: Record<string, unknown>) => {
            console.log("Push notification received:", notification);
            toast({
              title: (notification.title as string) || "Fridgie",
              description: notification.body as string,
            });
          });

          PushNotifications.addListener("pushNotificationActionPerformed", (notification: Record<string, unknown>) => {
            console.log("Push notification action:", notification);
          });
        } else if (capacitorAvailable && LocalNotifications) {
          const status = await LocalNotifications.checkPermissions();
          setPermissionStatus(status.display);
        }
      } catch (error) {
        // Fallback to browser notifications if Capacitor fails
        console.log("[Fridgie] Capacitor plugins not available, using browser notifications");
        if (browserSupported) {
          setPermissionStatus(Notification.permission as "granted" | "denied" | "prompt");
          const registration = await registerServiceWorker();
          if (registration) {
            setSwRegistration(registration);
          }
        }
      }
    };

    init();

    // Cleanup: Remove all Capacitor listeners when component unmounts
    return () => {
      if (PushNotifications && typeof PushNotifications.removeAllListeners === 'function') {
        PushNotifications.removeAllListeners();
      }
      if (LocalNotifications && typeof LocalNotifications.removeAllListeners === 'function') {
        LocalNotifications.removeAllListeners();
      }
    };
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
    } else if (isBrowserSupported) {
      // Browser notification permission
      const result = await Notification.requestPermission();
      setPermissionStatus(result as "granted" | "denied" | "prompt");
      
      if (result === "granted") {
        toast({
          title: "🔔 Benachrichtigungen aktiviert!",
          description: "Du erhältst jetzt Browser-Benachrichtigungen.",
        });
        
        // Re-register service worker if needed
        if (!swRegistration) {
          const registration = await registerServiceWorker();
          if (registration) {
            setSwRegistration(registration);
          }
        }
      }
      return result === "granted";
    }
    return false;
  }, [isCapacitor, isBrowserSupported, swRegistration]);

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
    } else if (isBrowserSupported) {
      // Use service worker for better notification handling
      if (swRegistration) {
        await swRegistration.showNotification(title, {
          body,
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: data?.type || 'fridgie-notification',
          data,
          requireInteraction: false,
        });
      } else {
        // Fallback to basic notification
        new Notification(title, {
          body,
          icon: "/pwa-192x192.png",
          data,
        });
      }
    }
  }, [isCapacitor, isBrowserSupported, permissionStatus, swRegistration]);

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
    } else if (isBrowserSupported) {
      // Browser: Use setTimeout for scheduling
      const delay = time.getTime() - Date.now();
      if (delay > 0) {
        // Store reminder in localStorage for persistence
        const reminders = JSON.parse(localStorage.getItem('fridgie_reminders') || '[]');
        const reminderId = `${type}_${Date.now()}`;
        reminders.push({
          id: reminderId,
          type,
          time: time.toISOString(),
          title,
          body,
          recurring
        });
        localStorage.setItem('fridgie_reminders', JSON.stringify(reminders));

        // Schedule the notification and track the timeout ID for cleanup
        const timeoutId = setTimeout(() => {
          sendLocalNotification(title, body, { type });

          // Remove from storage after sending (if not recurring)
          if (!recurring) {
            const updatedReminders = JSON.parse(localStorage.getItem('fridgie_reminders') || '[]');
            const filtered = updatedReminders.filter((r: any) => r.id !== reminderId);
            localStorage.setItem('fridgie_reminders', JSON.stringify(filtered));
          }

          // Clean up timeout from tracking map
          reminderTimeouts.current.delete(reminderId);
        }, delay);

        // Store timeout ID for later cancellation
        reminderTimeouts.current.set(reminderId, timeoutId);
        
        console.log(`Browser: Scheduled ${type} reminder for ${time.toISOString()}`);
        return true;
      }
    }
    return false;
  }, [isCapacitor, isBrowserSupported, sendLocalNotification]);

  const cancelReminder = useCallback(async (type: "water" | "meal" | "weight") => {
    if (isCapacitor && LocalNotifications) {
      const notificationId = type === "water" ? 1 : type === "meal" ? 2 : 3;
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      console.log(`Cancelled ${type} reminder`);
    } else {
      // Browser: Remove from localStorage and cancel scheduled timeouts
      const reminders = JSON.parse(localStorage.getItem('fridgie_reminders') || '[]');
      const filtered = reminders.filter((r: any) => {
        // Cancel timeout if it exists for this reminder
        if (r.type === type && r.id) {
          const timeoutId = reminderTimeouts.current.get(r.id);
          if (timeoutId) {
            clearTimeout(timeoutId);
            reminderTimeouts.current.delete(r.id);
          }
        }
        return r.type !== type;
      });
      localStorage.setItem('fridgie_reminders', JSON.stringify(filtered));
      console.log(`Browser: Cancelled ${type} reminder`);
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
    } else if (isBrowserSupported) {
      // Browser: Schedule each reminder
      for (const time of reminders) {
        await scheduleReminder('water', time, false);
      }
      return true;
    }
    
    return false;
  }, [isCapacitor, isBrowserSupported, permissionStatus, scheduleReminder]);

  // Check for pending reminders on page load (browser)
  useEffect(() => {
    if (!isBrowserSupported || permissionStatus !== 'granted') return;

    const checkPendingReminders = () => {
      const reminders = JSON.parse(localStorage.getItem('fridgie_reminders') || '[]');
      const now = Date.now();
      
      reminders.forEach((reminder: any) => {
        const reminderTime = new Date(reminder.time).getTime();
        const delay = reminderTime - now;
        
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Within 24 hours
          setTimeout(() => {
            sendLocalNotification(reminder.title, reminder.body, { type: reminder.type });
          }, delay);
        }
      });
    };

    checkPendingReminders();
  }, [isBrowserSupported, permissionStatus, sendLocalNotification]);

  return {
    isCapacitor,
    isBrowserSupported,
    permissionStatus,
    token,
    swRegistration,
    requestPermission,
    sendLocalNotification,
    scheduleReminder,
    cancelReminder,
    scheduleWaterReminders,
  };
};
