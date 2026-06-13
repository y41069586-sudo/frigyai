import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  getNotificationPermission,
  isNativeApp,
  normalizeReminderConfig,
  requestNotificationPermissionState,
  syncRemindersFromConfig,
  type ReminderConfig,
} from '@/lib/notifications';

const DEFAULT_CONFIG: ReminderConfig = { enabled: false };

function loadReminderConfig(): ReminderConfig {
  const saved = localStorage.getItem('reminderConfig');
  if (!saved) return DEFAULT_CONFIG;
  try {
    return normalizeReminderConfig(JSON.parse(saved));
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
        enabledDesc: 'Tu recevras au maximum une notification par jour.',
        deniedTitle: 'Autorisation refusee',
        deniedDesc: isNativeApp()
          ? 'Active les notifications dans les reglages de l appareil.'
          : 'Autorise les notifications dans ton navigateur.',
        promptTitle: 'Autorisation necessaire',
        promptDesc: 'Accepte la demande systeme pour activer les notifications.',
        unsupportedTitle: 'Notifications non disponibles',
        unsupportedDesc: 'Cet appareil ne prend pas en charge les notifications ici.',
        bannerTitle: 'Notifications desactivees',
        bannerDesc: 'Appuie sur Activer pour autoriser les notifications.',
        bannerButton: 'Activer',
        pushLabel: 'Notifications push',
        pushDesc: 'Une seule notification par jour, ou aucune si desactive.',
        webOnlyNote:
          'Dans le navigateur, les rappels fonctionnent seulement tant que Frigy est ouverte. Installe l app pour des notifications fiables.',
      }
    : language === 'en'
      ? {
          enabledTitle: 'Notifications enabled ✓',
          enabledDesc: 'You will receive at most one notification per day.',
          deniedTitle: 'Permission denied',
          deniedDesc: isNativeApp()
            ? 'Enable notifications in your device settings.'
            : 'Allow notifications in your browser.',
          promptTitle: 'Permission needed',
          promptDesc: 'Accept the system prompt to enable notifications.',
          unsupportedTitle: 'Notifications unavailable',
          unsupportedDesc: 'Notifications are not available on this device here.',
          bannerTitle: 'Notifications disabled',
          bannerDesc: 'Tap Enable to allow notifications.',
          bannerButton: 'Enable',
          pushLabel: 'Push notifications',
          pushDesc: 'One notification per day when on — none when off.',
          webOnlyNote:
            'In the browser, reminders only work while Frigy is open. Install the app for reliable push notifications.',
        }
      : {
          enabledTitle: 'Benachrichtigungen aktiviert ✓',
          enabledDesc: 'Du erhältst maximal eine Benachrichtigung pro Tag.',
          deniedTitle: 'Berechtigung abgelehnt',
          deniedDesc: isNativeApp()
            ? 'Aktiviere Benachrichtigungen in den Geräteeinstellungen.'
            : 'Erlaube Benachrichtigungen im Browser.',
          promptTitle: 'Berechtigung nötig',
          promptDesc: 'Bestätige die Systemabfrage, um Benachrichtigungen zu aktivieren.',
          unsupportedTitle: 'Benachrichtigungen nicht verfügbar',
          unsupportedDesc: 'Auf diesem Gerät sind Benachrichtigungen hier nicht verfügbar.',
          bannerTitle: 'Benachrichtigungen deaktiviert',
          bannerDesc: 'Tippe auf Aktivieren, um Benachrichtigungen zu erlauben.',
          bannerButton: 'Aktivieren',
          pushLabel: 'Push-Benachrichtigungen',
          pushDesc: 'Maximal eine Erinnerung pro Tag — aus heißt gar keine.',
          webOnlyNote:
            'Im Browser funktionieren Erinnerungen nur, solange Frigy geöffnet ist. Installiere die App für zuverlässige Push-Benachrichtigungen.',
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

  const requestPermission = async (enablePush = false): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> => {
    setPermissionBusy(true);
    try {
      const next = await requestNotificationPermissionState({ localOnly: true, sendTest: false });
      setPermission(next);

      if (next === 'granted') {
        if (enablePush) {
          setConfig({ enabled: true });
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

  const updatePushEnabled = async (enabled: boolean) => {
    if (enabled) {
      if (permission !== 'granted') {
        const next = await requestPermission(true);
        if (next !== 'granted') return;
      }
      setConfig({ enabled: true });
      return;
    }
    setConfig({ enabled: false });
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
                <p className="text-xs text-muted-foreground">{copy.bannerDesc}</p>
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
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/15">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Label className="text-sm font-medium">{copy.pushLabel}</Label>
            <p className="text-xs text-muted-foreground">{copy.pushDesc}</p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => void updatePushEnabled(checked)}
            disabled={permissionBusy}
          />
        </div>
      </Card>
    </div>
  );
};
