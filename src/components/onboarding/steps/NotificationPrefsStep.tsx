import { motion } from "framer-motion";
import { StepCard } from "../components";
import { StepProps } from "../types";
import { Bell, Droplets, Scale, Utensils } from "lucide-react";

export const NotificationPrefsStep = ({ userData, setUserData }: StepProps) => {
  const notifications = [
    { 
      id: 'meals' as const, 
      label: 'Mahlzeiten', 
      desc: 'Erinnere mich ans Essen loggen',
      icon: Utensils,
      color: 'text-orange-500'
    },
    { 
      id: 'water' as const, 
      label: 'Wasser trinken', 
      desc: 'Regelmäßige Trink-Erinnerungen',
      icon: Droplets,
      color: 'text-blue-500'
    },
    { 
      id: 'weight' as const, 
      label: 'Tägliches Wiegen', 
      desc: 'Morgens ans Wiegen erinnern',
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
          Erinnerungen
        </motion.h1>
        <motion.p
          className="text-muted-foreground/50 text-xs mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Woran sollen wir dich erinnern?
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
          Erinnerungen helfen 94% der Nutzer, ihre Ziele zu erreichen
        </motion.p>
      </div>
    </StepCard>
  );
};
