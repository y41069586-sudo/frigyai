import { createRoot } from "react-dom/client";
import { MotionConfig } from "framer-motion";
import App from "./App.tsx";
import "./index.css";

/** Drop stale SW + Cache Storage in dev so lazy routes (e.g. Index_*.js) are not intercepted. */
async function clearDevClientCaches(): Promise<void> {
  if (!import.meta.env.DEV) return;
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    // non-fatal
  }
}

void clearDevClientCaches().then(() => {
  createRoot(document.getElementById("root")!).render(
    <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
      <App />
    </MotionConfig>,
  );
});
