const isBrowser = typeof window !== "undefined";

export async function clearRuntimeCaches() {
  if (!isBrowser) return;

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
}

export function resetRuntimeRecovery(storageKey: string) {
  if (!isBrowser) return;
  sessionStorage.removeItem(storageKey);
}

export function attemptRuntimeRecovery(storageKey: string) {
  if (!isBrowser) return false;
  if (sessionStorage.getItem(storageKey) === "true") return false;

  sessionStorage.setItem(storageKey, "true");
  void clearRuntimeCaches().finally(() => {
    window.location.reload();
  });
  return true;
}
