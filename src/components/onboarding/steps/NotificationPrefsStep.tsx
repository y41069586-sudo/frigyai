import { motion } from "framer-motion";
import { Bell, ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import notificationOnboarding from "@/assets/notification-onboarding.png";
import {
  requestNotificationPermission,
  saveReminderConfigFromOnboarding,
  sendTestNotification,
} from "@/lib/notifications";
import type { StepProps } from "../types";

const PALETTE = {
  primary: "#6EF0A8",
  primaryDark: "#4AE896",
  bg: "#FFFFFF",
  text: "#101827",
  muted: "#53645C",
};

export const NotificationPrefsStep = ({ userData, setUserData, goNext, goBack }: StepProps) => {
  const { language } = useLanguage();

  const copy = {
    de: {
      app: "Frigy",
      notifTitle: "Es ist Mittagszeit 🥗",
      notifBody: "Mahlzeit vergessen? Ein Foto reicht - logge sie jetzt!",
      title: "ERREICHE DEINE ZIELE MIT BENACHRICHTIGUNGEN",
      body: "Erinnerungen helfen dir, Mahlzeiten, Wasser und Gewicht nicht zu vergessen.",
      later: "Nicht jetzt",
      enable: "Aktivieren",
      settingsHint: "Bitte aktiviere Benachrichtigungen in den App-Einstellungen deines Geräts.",
    },
    en: {
      app: "Frigy",
      notifTitle: "It's lunch time 🥗",
      notifBody: "Missed logging your meal? It only takes a second - snap it now!",
      title: "REACH YOUR GOALS WITH NOTIFICATIONS",
      body: "Reminders help you keep meals, water and weight tracking on your radar.",
      later: "Not now",
      enable: "Enable",
      settingsHint: "Please enable notifications in your device's app settings.",
    },
    fr: {
      app: "Frigy",
      notifTitle: "C'est l'heure du repas 🥗",
      notifBody: "Tu as oublié de noter ton repas ? Une photo suffit.",
      title: "ATTEINS TES OBJECTIFS AVEC LES NOTIFICATIONS",
      body: "Les rappels t'aident à suivre tes repas, ton eau et ton poids.",
      later: "Pas maintenant",
      enable: "Activer",
      settingsHint: "Active les notifications dans les paramètres de l'appareil.",
    },
  } as const;

  const t = copy[(language as "de" | "en" | "fr")] ?? copy.de;

  const setAllNotifications = (enabled: boolean) => {
    setUserData({
      ...userData,
      notificationPrefs: {
        ...userData.notificationPrefs,
        meals: enabled,
        water: enabled,
        weight: enabled,
      },
    });
  };

  const enableNotifications = async () => {
    const prefs = { meals: true, water: true, weight: true };
    setUserData({
      ...userData,
      notificationPrefs: prefs,
    });

    try {
      const granted = await requestNotificationPermission({ localOnly: true });
      if (granted) {
        saveReminderConfigFromOnboarding(prefs);
        try {
          await sendTestNotification();
        } catch {
          /* test ping is optional */
        }
      } else {
        setAllNotifications(false);
      }
    } catch (error) {
      console.warn("[onboarding] notification permission failed:", error);
      setAllNotifications(false);
    }

    goNext();
  };

  const skipNotifications = () => {
    setAllNotifications(false);
    goNext();
  };

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"
      style={{ backgroundColor: PALETTE.bg, color: PALETTE.text }}
    >
      <div className="flex shrink-0 items-center px-5 pb-1 pt-[calc(env(safe-area-inset-top,0px)+1.375rem)]">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={goBack}
          aria-label="Zurück"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "#F5FFF9",
            color: PALETTE.primaryDark,
            boxShadow: "0 1px 2px rgba(15,40,30,0.04)",
          }}
        >
          <ChevronLeft className="size-5" strokeWidth={2.4} />
        </motion.button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-24">
        <div className="relative z-10 -mx-4 flex h-[315px] shrink-0 items-start justify-center overflow-hidden bg-white pt-0 max-[380px]:h-[285px]">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[390px]"
          >
            <img
              src={notificationOnboarding}
              alt=""
              className="block w-full select-none object-contain"
              draggable={false}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="relative z-0 -mx-4 flex-1 rounded-t-[2rem] bg-white px-4 pt-6 pb-24 max-[380px]:pt-5"
        >
          <div>
            <h1 className="max-w-[300px] text-[18px] font-black uppercase leading-[1.08] tracking-[-0.05em] text-black max-[380px]:text-[17px]">
              {t.title}
            </h1>
            <p className="mt-3 max-w-[310px] text-[13px] font-medium leading-snug tracking-[-0.025em] text-[#53645C] max-[380px]:text-[12px]">
              {t.body}
            </p>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px)+0.75rem)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.35rem] bg-[#F5FFF9] shadow-[0_12px_30px_-22px_rgba(15,23,42,0.5)]">
          <Bell className="h-5 w-5" style={{ color: PALETTE.primaryDark }} />
        </div>
        <div className="pointer-events-auto grid h-12 w-[58%] max-w-[230px] shrink-0 grid-cols-2 overflow-hidden rounded-[1.35rem] border-2 border-black bg-white shadow-[0_12px_30px_-22px_rgba(15,23,42,0.5)]">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={skipNotifications}
          className="h-full bg-white text-[12px] font-bold text-black min-[380px]:text-[13px]"
        >
          {t.later}
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={enableNotifications}
          className="h-full text-[12px] font-bold text-white min-[380px]:text-[13px]"
          style={{ background: `linear-gradient(135deg, ${PALETTE.primary} 0%, ${PALETTE.primaryDark} 100%)` }}
        >
          {t.enable}
        </motion.button>
        </div>
      </div>
    </div>
  );
};
