import CryptoJS from "crypto-js";
import type { WorkerRequest, WorkerResponse } from "./hash.worker.types";

// This runs in a Web Worker thread
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, file, chunkSize } = event.data;

  if (type !== "COMPUTE_HASH") {
    return;
  }

  try {
    const sha256 = CryptoJS.algo.SHA256.create();
    const fileSize = file.size;
    let offset = 0;
    let lastProgressSent = -1;

    while (offset < fileSize) {
      // Read chunk
      const chunk = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();

      // Convert ArrayBuffer to WordArray for crypto-js
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);

      // Update hash with chunk
      sha256.update(wordArray);

      // Update offset
      offset += chunkSize;

      // Calculate and send progress (only if changed by at least 1%)
      const progress = Math.min(Math.round((offset / fileSize) * 100), 100);
      if (progress !== lastProgressSent && progress % 1 === 0) {
        const progressMessage: WorkerResponse = {
          type: "PROGRESS",
          progress,
        };
        self.postMessage(progressMessage);
        lastProgressSent = progress;
      }
    }

    // Finalize hash
    const hash = sha256.finalize();
    const hashHex = hash.toString(CryptoJS.enc.Hex);

    const resultMessage: WorkerResponse = {
      type: "RESULT",
      hash: hashHex,
    };
    self.postMessage(resultMessage);
  } catch (error) {
    const errorMessage: WorkerResponse = {
      type: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
    self.postMessage(errorMessage);
  }
};

export {};
