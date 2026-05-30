import { useState, useEffect } from 'react';
import { Bell, BellOff, Droplets, Utensils, Scale, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DEFAULT_MEAL_TIMES,
  getNotificationPermission,
  isNativeApp,
  normalizeReminderConfig,
  requestNotificationPermissionState,
  syncRemindersFromConfig,
  type ReminderConfig,
} from '@/lib/notifications';
import { formatReminderTime, WEIGHT_REMINDER_TIMES } from '@/lib/reminderTimeFormat';

const DEFAULT_CONFIG: ReminderConfig = {
  water: { enabled: false, interval: 3 },
  meals: { enabled: false, times: [...DEFAULT_MEAL_TIMES] },
  weight: { enabled: false, time: '07:15' },
};

function loadReminderConfig(): ReminderConfig {
  const saved = localStorage.getItem('reminderConfig');
  if (!saved) return DEFAULT_CONFIG;
  try {
    return normalizeReminderConfig(JSON.parse(saved) as ReminderConfig);
  } catch {
    return DEFAULT_CONFIG;
  }
}

interface ReminderSettingsProps {
  compact?: boolean;
}

export const ReminderSettings = ({ compact = false }: ReminderSettingsProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [config, setConfig] = useState<ReminderConfig>(loadReminderConfig);
  const [permissionBusy, setPermissionBusy] = useState(false);

  const copy = language === 'fr'
    ? {
        enabledTitle: 'Notifications activees ✓',
          enabledDesc: isNativeApp()
            ? 'Les rappels sont maintenant actifs et seront programmes tout de suite.'
            : 'Rappels actifs dans le navigateur tant que l app est ouverte. Pour des notifications fiables, utilise l app installee.',
          webOnlyNote:
            'Dans le navigateur, les rappels fonctionnent seulement tant que Frigy est ouverte. Pour des notifications systeme fiables, installe l app sur iPhone ou Android.',
        deniedTitle: 'Autorisation refusee',
        deniedDesc: isNativeApp()
          ? 'Frigy a d abord essaye d ouvrir la demande iPhone/Android. Si tu l as deja refusee, active-la dans les reglages de l appareil.'
          : 'Autorise les notifications dans ton navigateur pour activer les rappels.',
        promptTitle: 'Autorisation necessaire',
        promptDesc: 'Accepte la demande systeme pour activer directement les rappels.',
        unsupportedTitle: 'Notifications non disponibles',
        unsupportedDesc: 'Cet appareil ne prend pas en charge les notifications ici.',
        bannerTitle: 'Notifications desactivees',
        bannerDesc: 'Appuie sur Activer et Frigy demandera directement l autorisation iPhone/Android.',
        bannerButton: 'Activer',
        waterLabel: 'Rappel d eau',
        waterDesc: 'Rappel regulier pour boire',
        mealsLabel: 'Rappel repas',
        mealsDesc: '2 fois par jour, bien espace',
        weightLabel: 'Rappel de poids',
        weightDesc: 'Se peser chaque matin',
        every: 'Toutes les',
        hours2: '2 h',
        hours3: '3 h',
        hours4: '4 h',
      }
    : language === 'en'
      ? {
          enabledTitle: 'Notifications enabled ✓',
          enabledDesc: isNativeApp()
            ? 'Reminders are now active and will be scheduled right away.'
            : 'Reminders work in the browser while Frigy stays open. Install the app for reliable system notifications.',
          webOnlyNote:
            'In the browser, reminders only work while Frigy is open. Install the app on iPhone or Android for reliable push notifications.',
          deniedTitle: 'Permission denied',
          deniedDesc: isNativeApp()
            ? 'Frigy first tried to open the iPhone/Android permission prompt. If you already denied it, enable it in your device settings.'
            : 'Allow notifications in your browser to enable reminders.',
          promptTitle: 'Permission needed',
          promptDesc: 'Accept the system prompt to enable reminders directly.',
          unsupportedTitle: 'Notifications unavailable',
          unsupportedDesc: 'Notifications are not available on this device here.',
          bannerTitle: 'Notifications disabled',
          bannerDesc: 'Tap Enable and Frigy will request iPhone/Android permission directly.',
          bannerButton: 'Enable',
          waterLabel: 'Water reminder',
          waterDesc: 'Regular reminders to drink',
          mealsLabel: 'Meal reminder',
          mealsDesc: '2 times daily, spaced out',
          weightLabel: 'Weigh-in reminder',
          weightDesc: 'Weigh yourself every morning',
          every: 'Every',
          hours2: '2 hrs',
          hours3: '3 hrs',
          hours4: '4 hrs',
        }
      : {
          enabledTitle: 'Benachrichtigungen aktiviert ✓',
          enabledDesc: 'Die Erinnerungen sind jetzt aktiv und werden sofort eingerichtet.',
          deniedTitle: 'Berechtigung abgelehnt',
          deniedDesc: isNativeApp()
            ? 'Frigy hat zuerst die iPhone-/Android-Abfrage geöffnet. Wenn du sie schon abgelehnt hast, aktiviere Benachrichtigungen in den Geräteeinstellungen.'
            : 'Erlaube Benachrichtigungen im Browser, um Erinnerungen zu aktivieren.',
          promptTitle: 'Berechtigung nötig',
          promptDesc: 'Bestätige die Systemabfrage, damit die Erinnerungen direkt aktiviert werden.',
          unsupportedTitle: 'Benachrichtigungen nicht verfügbar',
          unsupportedDesc: 'Auf diesem Gerät sind Benachrichtigungen hier nicht verfügbar.',
          bannerTitle: 'Benachrichtigungen deaktiviert',
          bannerDesc: 'Tippe auf Aktivieren und Frigy fragt direkt die iPhone-/Android-Berechtigung an.',
          bannerButton: 'Aktivieren',
          waterLabel: 'Wasser-Erinnerung',
          waterDesc: 'Regelmäßig ans Trinken erinnern',
          mealsLabel: 'Mahlzeiten-Erinnerung',
          mealsDesc: '2× täglich, großer Abstand',
          weightLabel: 'Wiege-Erinnerung',
          weightDesc: 'Täglich morgens wiegen',
          every: 'Alle',
          hours2: '2 Std',
          hours3: '3 Std',
          hours4: '4 Std',
        };

  useEffect(() => {
    void getNotificationPermission().then(setPermission);
  }, []);

  useEffect(() => {
    localStorage.setItem("reminderConfig", JSON.stringify(config));
    const timer = window.setTimeout(() => {
      void syncRemindersFromConfig(config);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [config]);

  const requestPermission = async (enableAll = false): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> => {
    setPermissionBusy(true);
    try {
      const next = await requestNotificationPermissionState({ localOnly: true, sendTest: false });
      setPermission(next);

      if (next === 'granted') {
        if (enableAll) {
          setConfig(prev => ({
            water: { ...prev.water, enabled: true },
            meals: { ...prev.meals, enabled: true },
            weight: { ...prev.weight, enabled: true },
          }));
        }
        toast({
          title: copy.enabledTitle,
          description: copy.enabledDesc,
        });
      } else if (next === 'denied') {
        toast({
          title: copy.deniedTitle,
          description: copy.deniedDesc,
          variant: 'destructive',
        });
      } else if (next === 'prompt') {
        toast({
          title: copy.promptTitle,
          description: copy.promptDesc,
          variant: 'destructive',
        });
      } else {
        toast({
          title: copy.unsupportedTitle,
          description: copy.unsupportedDesc,
          variant: 'destructive',
        });
      }

      return next;
    } finally {
      setPermissionBusy(false);
    }
  };

  const ensurePermission = async (): Promise<boolean> => {
    if (permission === 'granted') return true;
    const next = await requestPermission(false);
    return next === 'granted';
  };

  const updateWaterReminder = async (enabled: boolean) => {
    if (enabled && !(await ensurePermission())) return;
    setConfig(prev => ({
      ...prev,
      water: { ...prev.water, enabled },
    }));
  };

  const updateWaterInterval = (interval: string) => {
    setConfig(prev => ({
      ...prev,
      water: { ...prev.water, interval: parseInt(interval) },
    }));
  };

  const updateMealsReminder = async (enabled: boolean) => {
    if (enabled && !(await ensurePermission())) return;
    setConfig(prev => ({
      ...prev,
      meals: { ...prev.meals, enabled },
    }));
  };

  const updateWeightReminder = async (enabled: boolean) => {
    if (enabled && !(await ensurePermission())) return;
    setConfig(prev => ({
      ...prev,
      weight: { ...prev.weight, enabled },
    }));
  };

  const updateWeightTime = (time: string) => {
    setConfig(prev => ({
      ...prev,
      weight: { ...prev.weight, time },
    }));
  };

  const rowClass = compact
    ? "rounded-xl border border-slate-100 bg-slate-50/50 p-3"
    : "p-4 bg-background/50 border-border/50";

  const webOnly = !isNativeApp();

  return (
    <div className={compact ? "space-y-2.5" : "space-y-4"}>
      {webOnly && (
        <Card className={compact ? "p-3 border-sky-500/25 bg-sky-500/8 shadow-none" : "p-4 border-sky-500/30 bg-sky-500/10"}>
          <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
            {language === "fr" ? "Rappels dans le navigateur" : language === "en" ? "Browser reminders" : "Browser-Erinnerungen"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.webOnlyNote}</p>
        </Card>
      )}
      {permission !== 'granted' && (
        <Card className={compact ? "p-3 border-amber-500/25 bg-amber-500/8 shadow-none" : "p-4 border-amber-500/30 bg-amber-500/10"}>
          <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{copy.bannerTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {copy.bannerDesc}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => void requestPermission(true)}
              disabled={permissionBusy}
              className="w-full shrink-0 bg-primary hover:bg-primary/90 min-[380px]:w-auto"
            >
              <Bell className="h-4 w-4 mr-1" />
              {copy.bannerButton}
            </Button>
          </div>
        </Card>
      )}

      <Card className={cn("border-border/50 shadow-none", rowClass)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Droplets className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">{copy.waterLabel}</Label>
            <p className="text-xs text-muted-foreground">{copy.waterDesc}</p>
          </div>
          <Switch checked={config.water.enabled} onCheckedChange={updateWaterReminder} disabled={permissionBusy} />
        </div>
        {config.water.enabled && (
          <div className="flex items-center gap-2 ml-11">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{copy.every}</span>
            <Select value={config.water.interval.toString()} onValueChange={updateWaterInterval}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">{copy.hours2}</SelectItem>
                <SelectItem value="3">{copy.hours3}</SelectItem>
                <SelectItem value="4">{copy.hours4}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      <Card className={cn("border-border/50 shadow-none", rowClass)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Utensils className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">{copy.mealsLabel}</Label>
            <p className="text-xs text-muted-foreground">{copy.mealsDesc}</p>
          </div>
          <Switch checked={config.meals.enabled} onCheckedChange={updateMealsReminder} disabled={permissionBusy} />
        </div>
        {config.meals.enabled && (
          <div className="flex items-center gap-2 ml-11 flex-wrap">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {normalizeReminderConfig(config).meals.times.map((time) => (
              <span key={time} className="text-xs px-2 py-1 rounded bg-muted">
                {formatReminderTime(time, language)}
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className={cn("border-border/50 shadow-none", rowClass)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Scale className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">{copy.weightLabel}</Label>
            <p className="text-xs text-muted-foreground">{copy.weightDesc}</p>
          </div>
          <Switch checked={config.weight.enabled} onCheckedChange={updateWeightReminder} disabled={permissionBusy} />
        </div>
        {config.weight.enabled && (
          <div className="flex items-center gap-2 ml-11">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={config.weight.time} onValueChange={updateWeightTime}>
              <SelectTrigger className="w-[7.25rem] h-8 text-xs">
                <SelectValue>
                  {formatReminderTime(config.weight.time, language)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {WEIGHT_REMINDER_TIMES.map((time) => (
                  <SelectItem key={time} value={time}>
                    {formatReminderTime(time, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>
    </div>
  );
};

