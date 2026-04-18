import { useState, useEffect } from 'react';
import { Bell, BellOff, Droplets, Utensils, Scale, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { notifyFrigyStorageUpdated } from '@/lib/frigyStorageSync';

interface ReminderConfig {
  water: { enabled: boolean; interval: number }; // interval in hours
  meals: { enabled: boolean; times: string[] };
  weight: { enabled: boolean; time: string };
}

const DEFAULT_CONFIG: ReminderConfig = {
  water: { enabled: false, interval: 2 },
  meals: { enabled: false, times: ['08:00', '12:00', '18:00'] },
  weight: { enabled: false, time: '07:00' },
};

export const ReminderSettings = () => {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [config, setConfig] = useState<ReminderConfig>(() => {
    const saved = localStorage.getItem('reminderConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('reminderConfig', JSON.stringify(config));
    notifyFrigyStorageUpdated();
  }, [config]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Nicht unterstützt',
        description: 'Dein Browser unterstützt keine Benachrichtigungen.',
        variant: 'destructive',
      });
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      toast({
        title: 'Benachrichtigungen aktiviert ✓',
        description: 'Du erhältst jetzt Erinnerungen.',
      });
      // Test notification
      new Notification('Frigy Erinnerungen', {
        body: 'Benachrichtigungen wurden erfolgreich aktiviert!',
        icon: '/favicon.ico',
      });
    } else {
      toast({
        title: 'Berechtigung abgelehnt',
        description: 'Aktiviere Benachrichtigungen in deinen Browser-Einstellungen.',
        variant: 'destructive',
      });
    }
  };

  const updateWaterReminder = (enabled: boolean) => {
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

  const updateMealsReminder = (enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      meals: { ...prev.meals, enabled },
    }));
  };

  const updateWeightReminder = (enabled: boolean) => {
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

  return (
    <div className="space-y-4">
      {/* Permission Card */}
      {permission !== 'granted' && (
        <Card className="p-4 border-amber-500/30 bg-amber-500/10">
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium">Benachrichtigungen deaktiviert</p>
              <p className="text-xs text-muted-foreground">Aktiviere Benachrichtigungen um Erinnerungen zu erhalten</p>
            </div>
            <Button size="sm" onClick={requestPermission} className="bg-primary hover:bg-primary/90">
              <Bell className="h-4 w-4 mr-1" />
              Aktivieren
            </Button>
          </div>
        </Card>
      )}

      {/* Water Reminder */}
      <Card className="p-4 bg-background/50 border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Droplets className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Wasser-Erinnerung</Label>
            <p className="text-xs text-muted-foreground">Regelmäßig ans Trinken erinnern</p>
          </div>
          <Switch
            checked={config.water.enabled}
            onCheckedChange={updateWaterReminder}
            disabled={permission !== 'granted'}
          />
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

      {/* Meal Reminder */}
      <Card className="p-4 bg-background/50 border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Utensils className="h-5 w-5 text-green-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Mahlzeiten-Erinnerung</Label>
            <p className="text-xs text-muted-foreground">Frühstück, Mittag & Abendessen loggen</p>
          </div>
          <Switch
            checked={config.meals.enabled}
            onCheckedChange={updateMealsReminder}
            disabled={permission !== 'granted'}
          />
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

      {/* Weight Reminder */}
      <Card className="p-4 bg-background/50 border-border/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Scale className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium">Wiege-Erinnerung</Label>
            <p className="text-xs text-muted-foreground">Täglich morgens wiegen</p>
          </div>
          <Switch
            checked={config.weight.enabled}
            onCheckedChange={updateWeightReminder}
            disabled={permission !== 'granted'}
          />
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
