import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { 
  Activity, Apple, Smartphone, Check, RefreshCw, 
  Scale, Footprints, Flame, Lock, Crown,
  Download, Upload, FileText, Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHealthConnect } from '@/hooks/useHealthConnect';

interface HealthSyncProps {
  onClose?: () => void;
}

interface SyncSettings {
  syncWeight: boolean;
  syncSteps: boolean;
  syncCalories: boolean;
  autoSync: boolean;
}

interface ImportedHealthData {
  weight?: number;
  steps?: number;
  caloriesBurned?: number;
  date: string;
}

export const HealthSync = ({ onClose }: HealthSyncProps) => {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const isPremium = subscriptionStatus?.subscribed === true;
  
  const {
    isNativeApp,
    platform,
    isConnected,
    permissions,
    healthData,
    isLoading,
    requestPermissions,
    syncHealthData,
    disconnect,
    saveWeight,
  } = useHealthConnect();

  const [settings, setSettings] = useState<SyncSettings>(() => {
    const saved = localStorage.getItem('healthSyncSettings');
    return saved ? JSON.parse(saved) : {
      syncWeight: true,
      syncSteps: true,
      syncCalories: true,
      autoSync: true
    };
  });
  const [lastSync, setLastSync] = useState<Date | null>(() => {
    const saved = localStorage.getItem('healthSyncLastSync');
    return saved ? new Date(saved) : null;
  });
  const [manualWeight, setManualWeight] = useState('');
  const [importedData, setImportedData] = useState<ImportedHealthData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Health Sync is Premium-only
  if (!isPremium) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 relative">
            <Activity className="h-8 w-8 text-muted-foreground" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Lock className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Health Sync</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Premium-Feature
          </p>
        </div>
        
        <Card className="p-4 bg-primary/10 border-primary/30">
          <div className="flex gap-3">
            <Crown className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Upgrade auf Premium</p>
              <p className="text-xs text-muted-foreground">
                Synchronisiere mit Apple Health & Google Fit, um deine Gesundheitsdaten automatisch zu tracken.
              </p>
            </div>
          </div>
        </Card>

        <Button className="w-full" onClick={() => navigate('/premium')}>
          Premium werden
        </Button>
      </div>
    );
  }

  useEffect(() => {
    localStorage.setItem('healthSyncSettings', JSON.stringify(settings));
  }, [settings]);

  const handleConnectHealth = async () => {
    const success = await requestPermissions();
    if (success) {
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('healthSyncLastSync', now.toISOString());
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let data: ImportedHealthData[] = [];

      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          data = json.map((item: any) => ({
            weight: item.weight || item.value,
            date: item.date || item.recorded_at || new Date().toISOString()
          }));
        } else if (json.data) {
          data = json.data.map((item: any) => ({
            weight: item.weight || item.value,
            date: item.date || new Date().toISOString()
          }));
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n');
        const headers = lines[0].toLowerCase().split(',');
        const weightIdx = headers.findIndex(h => h.includes('weight') || h.includes('gewicht'));
        const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('datum'));

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length > Math.max(weightIdx, dateIdx)) {
            const weight = parseFloat(values[weightIdx]);
            if (!isNaN(weight)) {
              data.push({
                weight,
                date: dateIdx >= 0 ? values[dateIdx] : new Date().toISOString()
              });
            }
          }
        }
      }

      if (data.length > 0) {
        setImportedData(data);
        toast({ 
          title: `${data.length} Einträge erkannt`,
          description: 'Klicke auf "Importieren" um die Daten zu speichern.'
        });
      } else {
        toast({ 
          title: 'Keine Daten gefunden',
          description: 'Die Datei enthält keine gültigen Gewichtsdaten.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: 'Import fehlgeschlagen',
        description: 'Die Datei konnte nicht gelesen werden.',
        variant: 'destructive'
      });
    }
  };

  const handleImportData = async () => {
    if (!user || importedData.length === 0) return;

    setIsSyncing(true);
    try {
      const entries = importedData
        .filter(d => d.weight && d.weight > 0)
        .map(d => ({
          user_id: user.id,
          weight: d.weight!,
          recorded_at: new Date(d.date).toISOString()
        }));

      if (entries.length > 0) {
        const { error } = await supabase
          .from('weight_entries')
          .insert(entries);

        if (error) throw error;

        toast({ 
          title: `${entries.length} Einträge importiert! ✅`,
          description: 'Die Gewichtsdaten wurden gespeichert.'
        });
        setImportedData([]);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: 'Import fehlgeschlagen',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualWeightAdd = async () => {
    if (!user || !manualWeight) return;

    const weight = parseFloat(manualWeight);
    if (isNaN(weight) || weight <= 0) {
      toast({ title: 'Ungültiges Gewicht', variant: 'destructive' });
      return;
    }

    setIsSyncing(true);
    try {
      const success = await saveWeight(weight, user.id);
      if (success) {
        toast({ title: `${weight} kg gespeichert! ✅` });
        setManualWeight('');
        
        const now = new Date();
        setLastSync(now);
        localStorage.setItem('healthSyncLastSync', now.toISOString());
      } else {
        throw new Error('Failed to save weight');
      }
    } catch (error) {
      console.error('Error saving weight:', error);
      toast({ title: 'Fehler beim Speichern', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      await syncHealthData();
      
      const now = new Date();
      setLastSync(now);
      localStorage.setItem('healthSyncLastSync', now.toISOString());
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
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

  const getPlatformName = () => {
    if (platform === 'ios') return 'Apple Health';
    if (platform === 'android') return 'Google Fit';
    return 'Health App';
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
          Synchronisiere deine Gesundheitsdaten
        </p>
      </div>

      {/* Web Version - Manual Import Section */}
      {!isNativeApp && (
        <Card className="p-4 bg-card/50 border-primary/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Manueller Import (Web)
          </h3>
          
          {/* Quick Weight Entry */}
          <div className="flex gap-2 mb-4">
            <Input
              type="number"
              placeholder="Gewicht in kg"
              value={manualWeight}
              onChange={(e) => setManualWeight(e.target.value)}
              className="flex-1"
              step="0.1"
            />
            <Button 
              size="sm" 
              onClick={handleManualWeightAdd}
              disabled={!manualWeight || isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Scale className="h-4 w-4 mr-1" />
                  Speichern
                </>
              )}
            </Button>
          </div>

          {/* File Import */}
          <div className="space-y-2">
            <label className="block">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <FileText className="h-4 w-4" />
                CSV/JSON Datei importieren
              </div>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileImport}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary/10 file:text-primary
                  hover:file:bg-primary/20
                  cursor-pointer"
              />
            </label>
            
            {importedData.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">
                  {importedData.length} Einträge bereit
                </span>
                <Button size="sm" onClick={handleImportData} disabled={isSyncing}>
                  {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Importieren
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-3">
            Du kannst Gewichtsdaten aus Google Fit, Apple Health oder Fitnessapps als CSV/JSON exportieren und hier importieren.
          </p>
        </Card>
      )}

      {/* Native App Info */}
      {!isNativeApp && (
        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <div className="flex gap-3">
            <Smartphone className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-500">Für automatische Sync</p>
              <p className="text-xs text-muted-foreground">
                Lade die native iOS/Android App für automatische Synchronisierung mit Apple Health & Google Fit.
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
                  {isConnected && platform === 'ios' ? 'Verbunden' : isNativeApp && platform === 'ios' ? 'Nicht verbunden' : 'Nur in iOS App'}
                </p>
              </div>
            </div>
            {isConnected && platform === 'ios' ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDisconnect}
              >
                Trennen
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={handleConnectHealth}
                variant={isNativeApp && platform === 'ios' ? "default" : "outline"}
                disabled={!isNativeApp || platform !== 'ios' || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isNativeApp && platform === 'ios' ? 'Verbinden' : 'iOS App nötig'
                )}
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
                  {isConnected && platform === 'android' ? 'Verbunden' : isNativeApp && platform === 'android' ? 'Nicht verbunden' : 'Nur in Android App'}
                </p>
              </div>
            </div>
            {isConnected && platform === 'android' ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDisconnect}
              >
                Trennen
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={handleConnectHealth}
                variant={isNativeApp && platform === 'android' ? "default" : "outline"}
                disabled={!isNativeApp || platform !== 'android' || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isNativeApp && platform === 'android' ? 'Verbinden' : 'Android App nötig'
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Sync Options */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="font-semibold">Synchronisieren</h3>
          
          {/* Health Data Preview */}
          {healthData && (
            <Card className="p-3 bg-primary/5">
              <div className="grid grid-cols-3 gap-2 text-center">
                {healthData.weight && (
                  <div>
                    <p className="text-lg font-bold">{healthData.weight} kg</p>
                    <p className="text-xs text-muted-foreground">Gewicht</p>
                  </div>
                )}
                {healthData.steps !== undefined && (
                  <div>
                    <p className="text-lg font-bold">{healthData.steps.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Schritte</p>
                  </div>
                )}
                {healthData.caloriesBurned !== undefined && (
                  <div>
                    <p className="text-lg font-bold">{healthData.caloriesBurned}</p>
                    <p className="text-xs text-muted-foreground">kcal</p>
                  </div>
                )}
              </div>
            </Card>
          )}
          
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
      {isConnected && (
        <div className="space-y-2">
          <Button 
            className="w-full gap-2" 
            onClick={handleSync}
            disabled={isSyncing || isLoading}
          >
            {isSyncing || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
      )}

      {/* Connected Status */}
      {isConnected && (
        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-500">Mit {getPlatformName()} verbunden</p>
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
