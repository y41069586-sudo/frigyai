import { useEffect, useRef } from 'react';

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
    const checkReminders = () => {
      const saved = localStorage.getItem('reminderConfig');
      if (!saved) return;

      const config: ReminderConfig = JSON.parse(saved);
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = now.toDateString();

      // Check meal reminders
      if (config.meals.enabled) {
        config.meals.times.forEach(time => {
          const reminderKey = `${today}-${time}`;
          if (currentTime === time && lastMealReminderRef.current !== reminderKey) {
            lastMealReminderRef.current = reminderKey;
            const mealName = getNextMealName(now.getHours());
            sendNotification(
              `🍽️ ${mealName} Zeit!`,
              'Vergiss nicht, deine Mahlzeit zu loggen.'
            );
          }
        });
      }

      // Check weight reminder
      if (config.weight.enabled) {
        const reminderKey = `${today}-weight`;
        if (currentTime === config.weight.time && lastWeightReminderRef.current !== reminderKey) {
          lastWeightReminderRef.current = reminderKey;
          sendNotification(
            '⚖️ Zeit zum Wiegen!',
            'Dokumentiere deinen Fortschritt.'
          );
        }
      }
    };

    const startWaterReminder = () => {
      const saved = localStorage.getItem('reminderConfig');
      if (!saved) return;

      const config: ReminderConfig = JSON.parse(saved);
      
      // Clear existing interval
      if (waterIntervalRef.current) {
        clearInterval(waterIntervalRef.current);
      }

      if (config.water.enabled) {
        const intervalMs = config.water.interval * 60 * 60 * 1000; // Convert hours to ms
        waterIntervalRef.current = window.setInterval(() => {
          sendNotification(
            '💧 Wasser trinken!',
            'Zeit für ein Glas Wasser.'
          );
        }, intervalMs);
      }
    };

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

    return () => {
      if (waterIntervalRef.current) clearInterval(waterIntervalRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
};
