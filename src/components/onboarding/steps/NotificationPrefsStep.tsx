import { motion } from "framer-motion";
import { StepCard } from "../components";
import { StepProps } from "../types";
import { Bell, Droplets, Scale, Utensils } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const NotificationPrefsStep = ({ userData, setUserData }: StepProps) => {
  const { language } = useLanguage();
  
  const notifications = [
    { 
      id: 'meals' as const, 
      label: language === 'de' ? 'Mahlzeiten' : language === 'fr' ? 'Repas' : 'Meals', 
      desc: language === 'de' ? 'Erinnere mich ans Essen loggen' : language === 'fr' ? 'Rappel de noter les repas' : 'Remind me to log meals',
      icon: Utensils,
      color: 'text-orange-500'
    },
    { 
      id: 'water' as const, 
      label: language === 'de' ? 'Wasser trinken' : language === 'fr' ? 'Boire de l\'eau' : 'Drink water', 
      desc: language === 'de' ? 'Regelmäßige Trink-Erinnerungen' : language === 'fr' ? 'Rappels réguliers de boire' : 'Regular drink reminders',
      icon: Droplets,
      color: 'text-blue-500'
    },
    { 
      id: 'weight' as const, 
      label: language === 'de' ? 'Tägliches Wiegen' : language === 'fr' ? 'Pesée quotidienne' : 'Daily weigh-in', 
      desc: language === 'de' ? 'Morgens ans Wiegen erinnern' : language === 'fr' ? 'Rappel de pesée le matin' : 'Morning weigh reminder',
      icon: Scale,
      color: 'text-purple-500'
    },
  ];

  const toggleNotification = (key: 'meals' | 'water' | 'weight') => {
    setUserData({
      ...userData,
      notificationPrefs: {
        ...userData.notificationPrefs,
        [key]: !userData.notificationPrefs[key]
      }
    });
  };

  return (
    <StepCard step="notification-prefs">
      <div className="flex flex-col items-center text-center px-6 w-full">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
        >
          <Bell className="w-8 h-8 text-primary" />
        </motion.div>
        
        <motion.h1
          className="text-2xl font-bold mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {language === 'de' ? 'Erinnerungen' : language === 'fr' ? 'Rappels' : 'Reminders'}
        </motion.h1>
        <motion.p
          className="text-muted-foreground/50 text-xs mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {language === 'de' ? 'Woran sollen wir dich erinnern?' : language === 'fr' ? 'À quoi devons-nous te rappeler?' : 'What should we remind you about?'}
        </motion.p>
        
        <div className="w-full max-w-sm space-y-3">
          {notifications.map((item, index) => {
            const Icon = item.icon;
            const isEnabled = userData.notificationPrefs[item.id];
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.3, ease: "easeOut" }}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block text-sm">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground/50">{item.desc}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => toggleNotification(item.id)}
                  className={`w-12 h-7 rounded-full transition-all duration-200 ${
                    isEnabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <motion.div
                    className="w-5 h-5 bg-white rounded-full shadow-sm"
                    animate={{ x: isEnabled ? 22 : 2 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                </button>
              </motion.div>
            );
          })}
        </div>
        
        <motion.p
          className="text-xs text-muted-foreground/40 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {language === 'de' ? 'Erinnerungen helfen 94% der Nutzer, ihre Ziele zu erreichen' : language === 'fr' ? 'Les rappels aident 94% des utilisateurs à atteindre leurs objectifs' : 'Reminders help 94% of users reach their goals'}
        </motion.p>
        <p className="text-[10px] text-muted-foreground/50 mt-3 max-w-sm mx-auto leading-snug">
          {language === 'de'
            ? 'Tipp: Unter Einstellungen → Erinnerungen kannst du die Browser-Berechtigung für Push-Benachrichtigungen erteilen – dann funktionieren die Erinnerungen zuverlässig.'
            : language === 'fr'
              ? 'Astuce : dans Réglages → Rappels, autorise les notifications du navigateur pour des rappels fiables.'
              : 'Tip: In Settings → Reminders, allow browser notifications so reminders work reliably.'}
        </p>
      </div>
    </StepCard>
  );
};
