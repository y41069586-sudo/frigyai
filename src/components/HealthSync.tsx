import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, Apple, Smartphone, Check, RefreshCw, 
  Scale, Footprints, Heart, Flame, AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface HealthSyncProps {
  onClose?: () => void;
}

interface SyncSettings {
  appleHealth: boolean;
  googleFit: boolean;
  syncWeight: boolean;
  syncSteps: boolean;
  syncCalories: boolean;
  autoSync: boolean;
}

export const HealthSync = ({ onClose }: HealthSyncProps) => {
  const [settings, setSettings] = useState<SyncSettings>(() => {
    const saved = localStorage.getItem('healthSyncSettings');
    return saved ? JSON.parse(saved) : {
      appleHealth: false,
      googleFit: false,
      syncWeight: true,
      syncSteps: true,
      syncCalories: true,
      autoSync: true
    };
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const saved = localStorage.getItem('healthSyncLastSync');
    return saved ? new Date(saved) : null;
  });
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    // Check if running as native app (Capacitor)
    const checkNative = async () => {
      try {
        // @ts-ignore
        const isNative = window.Capacitor?.isNativePlatform?.() ?? false;
        setIsNativeApp(isNative);
      } catch {
        setIsNativeApp(false);
      }
    };
    checkNative();
  }, []);

  useEffect(() => {
    localStorage.setItem('healthSyncSettings', JSON.stringify(settings));
  }, [settings]);

  const handleConnectAppleHealth = async () => {
    if (!isNativeApp) {
      toast({
        title: 'Native App erforderlich',
        description: 'Apple Health ist nur in der iOS App verfügbar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // In a real implementation, this would use Capacitor Health plugin
      // @ts-ignore
      // await CapacitorHealthkit.requestAuthorization({...});
      
      setSettings(prev => ({ ...prev, appleHealth: true }));
      toast({ title: 'Apple Health verbunden! 🍎' });
    } catch (error) {
      toast({
        title: 'Verbindung fehlgeschlagen',
        description: 'Bitte erlaube den Zugriff in den Einstellungen.',
        variant: 'destructive'
      });
    }
  };

  const handleConnectGoogleFit = async () => {
    if (!isNativeApp) {
      toast({
        title: 'Native App erforderlich',
        description: 'Google Fit ist nur in der Android App verfügbar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // In a real implementation, this would use Capacitor Google Fit plugin
      // @ts-ignore
      // await GoogleFit.authorize();
      
      setSettings(prev => ({ ...prev, googleFit: true }));
      toast({ title: 'Google Fit verbunden! 🏃' });
    } catch (error) {
      toast({
        title: 'Verbindung fehlgeschlagen',
        description: 'Bitte erlaube den Zugriff in den Einstellungen.',
        variant: 'destructive'
      });
    }
  };

  const handleSync = async () => {
    if (!settings.appleHealth && !settings.googleFit) {
      toast({
        title: 'Keine Verbindung',
        description: 'Verbinde zuerst eine Health App.',
        variant: 'destructive'
      });
      return;
    }

    setIsSyncing(true);
    
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const now = new Date();
    setLastSync(now);
    localStorage.setItem('healthSyncLastSync', now.toISOString());
    setIsSyncing(false);
    
    toast({ title: 'Synchronisierung erfolgreich! ✅' });
  };

  const handleDisconnect = (platform: 'apple' | 'google') => {
    if (platform === 'apple') {
      setSettings(prev => ({ ...prev, appleHealth: false }));
      toast({ title: 'Apple Health getrennt' });
    } else {
      setSettings(prev => ({ ...prev, googleFit: false }));
      toast({ title: 'Google Fit getrennt' });
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Nie';
    const minutes = Math.floor((Date.now() - lastSync.getTime()) / 1000 / 60);
    if (minutes < 1) return 'Gerade eben';
    if (minutes < 60) return `vor ${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `vor ${hours} Std.`;
    return lastSync.toLocaleDateString('de-DE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Activity className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold">Health Sync</h2>
        <p className="text-sm text-muted-foreground">
          Synchronisiere mit Apple Health & Google Fit
        </p>
      </div>

      {/* Native App Warning */}
      {!isNativeApp && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Web-Version</p>
              <p className="text-xs text-muted-foreground">
                Health Sync ist nur in der nativen iOS/Android App verfügbar. 
                Lade die App aus dem App Store oder Play Store.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Connection Cards */}
      <div className="space-y-3">
        {/* Apple Health */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Apple className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-medium">Apple Health</p>
                <p className="text-xs text-muted-foreground">
                  {settings.appleHealth ? 'Verbunden' : 'Nicht verbunden'}
                </p>
              </div>
            </div>
            {settings.appleHealth ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDisconnect('apple')}
              >
                Trennen
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={handleConnectAppleHealth}
                disabled={!isNativeApp}
              >
                Verbinden
              </Button>
            )}
          </div>
        </Card>

        {/* Google Fit */}
        <Card className="p-4 bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Google Fit</p>
                <p className="text-xs text-muted-foreground">
                  {settings.googleFit ? 'Verbunden' : 'Nicht verbunden'}
                </p>
              </div>
            </div>
            {settings.googleFit ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDisconnect('google')}
              >
                Trennen
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={handleConnectGoogleFit}
                disabled={!isNativeApp}
              >
                Verbinden
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Sync Options */}
      {(settings.appleHealth || settings.googleFit) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="font-semibold">Synchronisieren</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Gewicht</span>
              </div>
              <Switch
                checked={settings.syncWeight}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, syncWeight: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Footprints className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Schritte</span>
              </div>
              <Switch
                checked={settings.syncSteps}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, syncSteps: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Verbrannte Kalorien</span>
              </div>
              <Switch
                checked={settings.syncCalories}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, syncCalories: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Auto-Sync</span>
              </div>
              <Switch
                checked={settings.autoSync}
                onCheckedChange={(v) => setSettings(prev => ({ ...prev, autoSync: v }))}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Sync Button */}
      <div className="space-y-2">
        <Button 
          className="w-full gap-2" 
          onClick={handleSync}
          disabled={isSyncing || (!settings.appleHealth && !settings.googleFit)}
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Synchronisiere...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Jetzt synchronisieren
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Letzte Sync: {formatLastSync()}
        </p>
      </div>

      {/* Connected Status */}
      {(settings.appleHealth || settings.googleFit) && (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-500">Verbunden</p>
              <p className="text-xs text-muted-foreground">
                Deine Gesundheitsdaten werden automatisch synchronisiert.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HealthSync;
