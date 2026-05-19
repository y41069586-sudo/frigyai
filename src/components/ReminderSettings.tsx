import { useState, useEffect } from 'react';
import { Bell, BellOff, Droplets, Utensils, Scale, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  syncRemindersFromConfig,
  type ReminderConfig,
} from '@/lib/notifications';

const DEFAULT_CONFIG: ReminderConfig = {
  water: { enabled: false, interval: 2 },
  meals: { enabled: false, times: ['08:00', '12:00', '18:00'] },
  weight: { enabled: false, time: '07:00' },
};

interface ReminderSettingsProps {
  compact?: boolean;
}

export const ReminderSettings = ({ compact = false }: ReminderSettingsProps) => {
  const { toast } = useToast();
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');
  const [config, setConfig] = useState<ReminderConfig>(() => {
    const saved = localStorage.getItem('reminderConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    void getNotificationPermission().then(setPermission);
  }, []);

  useEffect(() => {
    localStorage.setItem('reminderConfig', JSON.stringify(config));
    notifyFrigyStorageUpdated();
    void syncRemindersFromConfig(config);
  }, [config]);

  const requestPermission = async () => {
    const granted = await requestNotificationPermission();
    const next = await getNotificationPermission();
    setPermission(next);

    if (granted) {
      toast({
        title: 'Benachrichtigungen aktiviert ✓',
        description: 'Du erhältst jetzt Erinnerungen auf dem Gerät.',
      });
      await sendTestNotification();
    } else {
      toast({
        title: 'Berechtigung abgelehnt',
        description: 'Aktiviere Benachrichtigungen in den Einstellungen deines Geräts.',
        variant: 'destructive',
      });
    }
  };

  const ensurePermission = async (): Promise<boolean> => {
    if (permission === 'granted') return true;
    await requestPermission();
    const next = await getNotificationPermission();
    setPermission(next);
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

  return (
    <div className={compact ? "space-y-2.5" : "space-y-4"}>
      {permission !== 'granted' && (
        <Card className={compact ? "p-3 border-amber-500/25 bg-amber-500/8 shadow-none" : "p-4 border-amber-500/30 bg-amber-500/10"}>
          <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <BellOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Benachrichtigungen deaktiviert</p>
                <p className="text-xs text-muted-foreground">
                  Tippe auf Aktivieren – dein Handy fragt dann nach der Berechtigung.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={requestPermission}
              className="w-full shrink-0 bg-primary hover:bg-primary/90 min-[380px]:w-auto"
            >
              <Bell className="h-4 w-4 mr-1" />
              Aktivieren
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
            <Label className="text-sm font-medium">Wasser-Erinnerung</Label>
            <p className="text-xs text-muted-foreground">Regelmäßig ans Trinken erinnern</p>
          </div>
          <Switch checked={config.water.enabled} onCheckedChange={updateWaterReminder} />
        </div>
        {config.water.enabled && (
          <div className="flex items-center gap-2 ml-11">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Alle</span>
            <Select value={config.water.interval.toString()} onValueChange={updateWaterInterval}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Std</SelectItem>
                <SelectItem value="2">2 Std</SelectItem>
                <SelectItem value="3">3 Std</SelectItem>
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
            <Label className="text-sm font-medium">Mahlzeiten-Erinnerung</Label>
            <p className="text-xs text-muted-foreground">Frühstück, Mittag & Abendessen loggen</p>
          </div>
          <Switch checked={config.meals.enabled} onCheckedChange={updateMealsReminder} />
        </div>
        {config.meals.enabled && (
          <div className="flex items-center gap-2 ml-11 flex-wrap">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs px-2 py-1 rounded bg-muted">08:00</span>
            <span className="text-xs px-2 py-1 rounded bg-muted">12:00</span>
            <span className="text-xs px-2 py-1 rounded bg-muted">18:00</span>
          </div>
        )}
      </Card>

      <Card className={cn("border-border/50 shadow-none", rowClass)}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Scale className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Wiege-Erinnerung</Label>
            <p className="text-xs text-muted-foreground">Täglich morgens wiegen</p>
          </div>
          <Switch checked={config.weight.enabled} onCheckedChange={updateWeightReminder} />
        </div>
        {config.weight.enabled && (
          <div className="flex items-center gap-2 ml-11">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={config.weight.time} onValueChange={updateWeightTime}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="06:00">06:00</SelectItem>
                <SelectItem value="07:00">07:00</SelectItem>
                <SelectItem value="08:00">08:00</SelectItem>
                <SelectItem value="09:00">09:00</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>
    </div>
  );
};

