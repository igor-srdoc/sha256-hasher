import { useEffect, useRef } from "react";
import { useHashState } from "../state/hash.state";
import type { WorkerResponse } from "../workers/hash.worker.types";
import { MESSAGES } from "../hash-computation.const";

export function useHashWorker() {
  const workerRef = useRef<Worker | null>(null);
  const { setProgress, setResult, setError } = useHashState();

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(
      new URL("../workers/hash.worker.ts", import.meta.url),
      { type: "module" }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      switch (message.type) {
        case "PROGRESS":
          setProgress(message.progress);
          break;

        case "RESULT": {
          // Get current state values at the time of completion
          const { file, description } = useHashState.getState();
          setResult({
            hash: message.hash,
            fileName: file?.name || "",
            fileSize: file?.size || 0,
            description,
            computedAt: new Date(),
          });
          break;
        }

        case "ERROR":
          setError(message.error || MESSAGES.ERRORS.COMPUTATION_FAILED);
          break;
      }
    };

    // Handle worker errors
    workerRef.current.onerror = (error) => {
      console.error("Worker error:", error);
      setError(MESSAGES.ERRORS.COMPUTATION_FAILED);
    };

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, [setProgress, setResult, setError]);

  return workerRef;
}
