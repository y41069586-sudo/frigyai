import { useEffect, useRef } from 'react';
import { getStoredLanguage } from '@/contexts/LanguageContext';
import { FRIGY_STORAGE_UPDATED } from '@/lib/frigyStorageSync';
import { isNativeApp } from '@/lib/notifications';

interface ReminderConfig {
  water: { enabled: boolean; interval: number };
  meals: { enabled: boolean; times: string[] };
  weight: { enabled: boolean; time: string };
}

const sendNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: title, // Prevents duplicate notifications
    });
  }
};

const getNextMealName = (hour: number): string => {
  if (hour < 10) return 'Frühstück';
  if (hour < 15) return 'Mittagessen';
  return 'Abendessen';
};

export const useReminders = () => {
  const waterIntervalRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const lastMealReminderRef = useRef<string>('');
  const lastWeightReminderRef = useRef<string>('');

  useEffect(() => {
    // Native app: reminders are scheduled via Capacitor LocalNotifications (see notifications.ts)
    if (isNativeApp()) return;

    // Check if notifications are supported and permitted
    const checkNotificationPermission = () => {
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return false;
      }
      return Notification.permission === 'granted';
    };

    const checkReminders = () => {
      if (!checkNotificationPermission()) return;
      
      const saved = localStorage.getItem('reminderConfig');
      if (!saved) return;

      const config: ReminderConfig = JSON.parse(saved);
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toDateString();
      const copy = webReminderCopy();

      // Check meal reminders
      if (config.meals.enabled) {
        config.meals.times.forEach(time => {
          const reminderKey = `${today}-${time}`;
          if (currentTime === time && lastMealReminderRef.current !== reminderKey) {
            lastMealReminderRef.current = reminderKey;
            const mealName = getNextMealName(now.getHours());
            sendNotification(copy.mealTitle(mealName), copy.mealBody);
          }
        });
      }

      // Check weight reminder
      if (config.weight.enabled) {
        const reminderKey = `${today}-weight`;
        if (currentTime === config.weight.time && lastWeightReminderRef.current !== reminderKey) {
          lastWeightReminderRef.current = reminderKey;
          sendNotification(copy.weightTitle, copy.weightBody);
        }
      }
    };

    const startWaterReminder = () => {
      if (!checkNotificationPermission()) return;
      
      const saved = localStorage.getItem('reminderConfig');
      if (!saved) return;

      const config: ReminderConfig = JSON.parse(saved);
      
      // Clear existing interval
      if (waterIntervalRef.current) {
        clearInterval(waterIntervalRef.current);
        waterIntervalRef.current = null;
      }

      if (config.water.enabled) {
        const intervalMs = config.water.interval * 60 * 60 * 1000;
        const copy = webReminderCopy();

        waterIntervalRef.current = window.setInterval(() => {
          sendNotification(copy.waterTitle, copy.waterBody);
        }, intervalMs);
      }
    };

    // Run initial check
    checkReminders();
    
    // Check every minute for time-based reminders
    checkIntervalRef.current = window.setInterval(checkReminders, 60000);
    
    // Initial setup
    startWaterReminder();

    // Listen for config changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reminderConfig') {
        startWaterReminder();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    const onAppStorageUpdate = () => {
      startWaterReminder();
      checkReminders();
    };
    window.addEventListener(FRIGY_STORAGE_UPDATED, onAppStorageUpdate);

    return () => {
      if (waterIntervalRef.current) clearInterval(waterIntervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(FRIGY_STORAGE_UPDATED, onAppStorageUpdate);
    };
  }, []);
};
