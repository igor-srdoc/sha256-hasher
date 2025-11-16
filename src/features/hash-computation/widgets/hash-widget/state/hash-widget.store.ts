import { createStore } from "zustand/vanilla";
import type { HashState } from "../hash-computation.types";
import type { WorkerResponse } from "../workers/hash.worker.types";
import { MESSAGES } from "../hash-computation.const";

/**
 * Factory function to create isolated hash computation store instances.
 * Each HashWidget gets its own store, enabling multiple independent widgets on the same page.
 */
export function createHashStore() {
  let worker: Worker | null = null;

  const store = createStore<HashState>((set, get) => ({
    // Initial state
    file: null,
    status: "idle",
    progress: 0,
    error: null,
    result: null,
    description: "",
    descriptionWasFocused: false,

    // Actions
    setFile: (file) =>
      set({
        file,
        status: "idle",
        progress: 0,
        error: null,
        result: null,
      }),

    setDescription: (description) => set({ description }),

    setDescriptionFocused: (focused) => set({ descriptionWasFocused: focused }),

    setStatus: (status) => set({ status }),

    setProgress: (progress) => set({ progress }),

    setResult: (result) =>
      set({
        result,
        status: "completed",
        progress: 100,
        error: null,
      }),

    setError: (error) =>
      set({
        error,
        status: "error",
        progress: 0,
      }),

    reset: () =>
      set({
        file: null,
        status: "idle",
        progress: 0,
        error: null,
        result: null,
        description: "",
        descriptionWasFocused: false,
      }),

    cancel: () => {
      // Terminate worker and reset to idle
      if (worker) {
        worker.terminate();
        worker = null;
      }
      set({
        status: "idle",
        progress: 0,
        error: null,
      });
    },

    // Worker management (internal to store)
    initWorker: () => {
      if (worker) return worker;

      worker = new Worker(
        new URL("../workers/hash.worker.ts", import.meta.url),
        { type: "module" }
      );

      // Handle messages from worker
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const message = event.data;

        switch (message.type) {
          case "PROGRESS":
            get().setProgress(message.progress);
            break;

          case "RESULT": {
            const { file, description } = get();
            get().setResult({
              hash: message.hash,
              fileName: file?.name || "",
              fileSize: file?.size || 0,
              description,
              computedAt: new Date(),
            });
            break;
          }

          case "ERROR":
            get().setError(message.error || MESSAGES.ERRORS.COMPUTATION_FAILED);
            break;
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        console.error("Worker error:", error);
        get().setError(MESSAGES.ERRORS.COMPUTATION_FAILED);
      };

      return worker;
    },

    getWorker: () => worker,

    cleanupWorker: () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
    },
  }));

  return store;
}

export type HashStore = ReturnType<typeof createHashStore>;
