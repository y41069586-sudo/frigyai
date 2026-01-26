import { useState, useCallback } from 'react';

// AI Analysis result types
interface FoodAnalysisResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion?: string;
  confidence?: number;
}

type AIAnalysisResult = FoodAnalysisResult | Record<string, any>;

interface CacheEntry {
  result: AIAnalysisResult;
  timestamp: number;
  imageHash: string;
}

const CACHE_KEY = 'frigai_scan_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten
const MAX_CACHE_ENTRIES = 20;

// Einfache Hash-Funktion für Base64-Bilder (verwendet ersten + letzten Teil)
const hashImage = (base64: string): string => {
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, '');
  const length = cleaned.length;
  // Nimm Anfang, Mitte und Ende für einen eindeutigen Fingerprint
  const sample = cleaned.slice(0, 100) + cleaned.slice(length / 2 - 50, length / 2 + 50) + cleaned.slice(-100);
  let hash = 0;
  for (let i = 0; i < sample.length; i++) {
    const char = sample.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36) + '_' + length;
};

export const useAICache = () => {
  const [cacheHits, setCacheHits] = useState(0);

  // Cache aus localStorage laden
  const getCache = useCallback((): Map<string, CacheEntry> => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.error('[AI-CACHE] Error loading cache:', e);
    }
    return new Map();
  }, []);

  // Cache speichern
  const saveCache = useCallback((cache: Map<string, CacheEntry>) => {
    try {
      // Alte Einträge entfernen
      const now = Date.now();
      const filtered = new Map<string, CacheEntry>();
      
      cache.forEach((entry, key) => {
        if (now - entry.timestamp < CACHE_DURATION) {
          filtered.set(key, entry);
        }
      });

      // Auf Maximum begrenzen
      const entries = Array.from(filtered.entries());
      if (entries.length > MAX_CACHE_ENTRIES) {
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        entries.length = MAX_CACHE_ENTRIES;
      }

      localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch (e) {
      console.error('[AI-CACHE] Error saving cache:', e);
    }
  }, []);

  // Ergebnis aus Cache holen
  const getCached = useCallback((imageBase64: string): any | null => {
    const hash = hashImage(imageBase64);
    const cache = getCache();
    const entry = cache.get(hash);

    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
      console.log('[AI-CACHE] Cache hit for hash:', hash.substring(0, 20));
      setCacheHits(prev => prev + 1);
      return entry.result;
    }

    return null;
  }, [getCache]);

  // Ergebnis im Cache speichern
  const setCached = useCallback((imageBase64: string, result: any) => {
    const hash = hashImage(imageBase64);
    const cache = getCache();

    cache.set(hash, {
      result,
      timestamp: Date.now(),
      imageHash: hash,
    });

    saveCache(cache);
    console.log('[AI-CACHE] Cached result for hash:', hash.substring(0, 20));
  }, [getCache, saveCache]);

  // Cache leeren
  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCacheHits(0);
  }, []);

  // Cache-Statistiken
  const getCacheStats = useCallback(() => {
    const cache = getCache();
    const now = Date.now();
    let validEntries = 0;
    
    cache.forEach((entry) => {
      if (now - entry.timestamp < CACHE_DURATION) {
        validEntries++;
      }
    });

    return {
      totalEntries: cache.size,
      validEntries,
      cacheHits,
    };
  }, [getCache, cacheHits]);

  return {
    getCached,
    setCached,
    clearCache,
    getCacheStats,
    cacheHits,
  };
};
