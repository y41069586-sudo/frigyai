import { lazy } from "react";
import type { ComponentType } from "react";
import { attemptRuntimeRecovery, resetRuntimeRecovery } from "@/lib/runtimeRecovery";

const RELOAD_KEY = "frigy_chunk_reload_attempted";

const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Failed to fetch|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(
    message,
  );
};

export function lazyWithReload<T extends { default: ComponentType<unknown> }>(
  importer: () => Promise<T>,
) {
  return lazy(async () => {
    try {
      const module = await importer();
      resetRuntimeRecovery(RELOAD_KEY);
      return module;
    } catch (error) {
      if (isChunkLoadError(error) && attemptRuntimeRecovery(RELOAD_KEY)) {
        // Page reload in progress — avoid hanging Suspense forever on a never-resolving promise.
        throw error;
      }

      throw error;
    }
  });
}
