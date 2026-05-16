import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  checkHealthSyncAvailability,
  isNativeHealthPlatform,
  persistSyncedSteps,
  requestNativeHealthPermissions,
  syncNativeHealthData,
  type HealthSyncData,
} from '@/lib/healthSyncService';

interface HealthPermissions {
  weight: boolean;
  steps: boolean;
  calories: boolean;
  heartRate: boolean;
}

interface UseHealthConnectReturn {
  isNativeApp: boolean;
  platform: 'ios' | 'android' | 'web';
  isConnected: boolean;
  permissions: HealthPermissions;
  healthData: HealthSyncData | null;
  isLoading: boolean;
  requestPermissions: () => Promise<boolean>;
  syncHealthData: () => Promise<void>;
  disconnect: () => void;
  saveWeight: (weight: number, userId: string) => Promise<boolean>;
}

export function useHealthConnect(): UseHealthConnectReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [permissions, setPermissions] = useState<HealthPermissions>({
    weight: false,
    steps: false,
    calories: false,
    heartRate: false,
  });
  const [healthData, setHealthData] = useState<HealthSyncData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isNativeApp = isNativeHealthPlatform();
  const platform = (Capacitor.getPlatform() as 'ios' | 'android' | 'web') || 'web';

  useEffect(() => {
    const savedState = localStorage.getItem('healthConnectState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setIsConnected(state.isConnected);
        setPermissions(state.permissions);
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('healthConnectState', JSON.stringify({
      isConnected,
      permissions,
    }));
  }, [isConnected, permissions]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!isNativeApp) {
      toast({
        title: 'Native App erforderlich',
        description: 'Health Sync funktioniert in der installierten iOS/Android-App — nicht im Browser.',
      });
      return false;
    }

    const availability = await checkHealthSyncAvailability();
    if (!availability.ok) {
      if (availability.reason === 'not_installed') {
        toast({
          title: 'Health Connect fehlt',
          description: 'Bitte „Health Connect“ aus dem Play Store installieren.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Nicht verfügbar',
          description: availability.detail ?? 'Health Sync ist auf diesem Gerät nicht verfügbar.',
          variant: 'destructive',
        });
      }
      return false;
    }

    setIsLoading(true);
    try {
      const granted = await requestNativeHealthPermissions();
      if (!granted) {
        toast({
          title: 'Verbindung fehlgeschlagen',
          description: 'Bitte erlaube den Zugriff in den Systemeinstellungen.',
          variant: 'destructive',
        });
        return false;
      }

      setPermissions({
        weight: true,
        steps: true,
        calories: true,
        heartRate: platform === 'ios',
      });
      setIsConnected(true);

      toast({
        title: platform === 'ios' ? 'Apple Health verbunden! 🍎' : 'Health Connect verbunden! 🏃',
        description: 'Deine Gesundheitsdaten können jetzt synchronisiert werden.',
      });
      return true;
    } catch (error) {
      console.error('Health authorization error:', error);
      toast({
        title: 'Verbindung fehlgeschlagen',
        description: 'Bitte erlaube den Zugriff in den Systemeinstellungen.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isNativeApp, platform]);

  const syncHealthData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    try {
      const data = await syncNativeHealthData();

      if (!data || (data.weight == null && data.steps == null && data.caloriesBurned == null)) {
        toast({
          title: 'Keine neuen Daten',
          description: 'In Apple Health / Health Connect wurden keine passenden Einträge für heute gefunden.',
        });
        return;
      }

      if (data.steps != null) {
        persistSyncedSteps(data.steps);
      }

      setHealthData(data);
      localStorage.setItem('healthSyncLastSync', new Date().toISOString());

      toast({ title: 'Daten synchronisiert! ✅' });
    } catch (error) {
      console.error('Health sync error:', error);
      toast({
        title: 'Synchronisierung fehlgeschlagen',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setPermissions({
      weight: false,
      steps: false,
      calories: false,
      heartRate: false,
    });
    setHealthData(null);
    localStorage.removeItem('healthConnectState');

    toast({ title: 'Health-Verbindung getrennt' });
  }, []);

  const saveWeight = useCallback(async (weight: number, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('weight_entries')
        .insert({
          user_id: userId,
          weight,
          recorded_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving weight:', error);
      return false;
    }
  }, []);

  return {
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
  };
}
