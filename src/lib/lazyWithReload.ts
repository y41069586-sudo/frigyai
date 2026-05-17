import { lazy } from "react";
import type { ComponentType } from "react";

const RELOAD_KEY = "frigy_chunk_reload_attempted";

const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Failed to fetch|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(
    message,
  );
};

const clearRuntimeCaches = async () => {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
};

export function lazyWithReload<T extends { default: ComponentType<unknown> }>(
  importer: () => Promise<T>,
) {
  return lazy(async () => {
    try {
      const module = await importer();
      sessionStorage.removeItem(RELOAD_KEY);
      return module;
    } catch (error) {
      if (isChunkLoadError(error) && sessionStorage.getItem(RELOAD_KEY) !== "true") {
        sessionStorage.setItem(RELOAD_KEY, "true");
        await clearRuntimeCaches();
        window.location.reload();
        return new Promise<T>(() => undefined);
      }

      throw error;
    }
  });
}
