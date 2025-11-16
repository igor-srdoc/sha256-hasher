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
    let chunkNumber = 0;

    console.log(`[Worker] Starting hash computation for ${file.name} (${(fileSize / (1024 * 1024)).toFixed(2)}MB)`);

    while (offset < fileSize) {
      chunkNumber++;
      const chunkStart = Date.now();

      // Read chunk
      console.log(`[Worker] Reading chunk ${chunkNumber} at offset ${offset}...`);
      const chunk = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();
      console.log(`[Worker] Chunk ${chunkNumber} read in ${Date.now() - chunkStart}ms, size: ${arrayBuffer.byteLength} bytes`);

      // Convert ArrayBuffer to WordArray for crypto-js
      const conversionStart = Date.now();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
      console.log(`[Worker] WordArray conversion took ${Date.now() - conversionStart}ms`);

      // Update hash with chunk
      const hashStart = Date.now();
      sha256.update(wordArray);
      console.log(`[Worker] Hash update took ${Date.now() - hashStart}ms`);

      // Update offset
      offset += chunkSize;

      // Calculate and send progress (only if changed by at least 1%)
      const progress = Math.min(Math.round((offset / fileSize) * 100), 100);
      if (progress !== lastProgressSent && progress % 1 === 0) {
        console.log(`[Worker] Progress: ${progress}%`);
        const progressMessage: WorkerResponse = {
          type: "PROGRESS",
          progress,
        };
        self.postMessage(progressMessage);
        lastProgressSent = progress;
      }

      console.log(`[Worker] Total time for chunk ${chunkNumber}: ${Date.now() - chunkStart}ms`);
    }

    console.log(`[Worker] Finalizing hash...`);

    // Finalize hash
    const finalizeStart = Date.now();
    const hash = sha256.finalize();
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(`[Worker] Hash finalized in ${Date.now() - finalizeStart}ms: ${hashHex}`);

    const resultMessage: WorkerResponse = {
      type: "RESULT",
      hash: hashHex,
    };
    self.postMessage(resultMessage);
  } catch (error) {
    console.error(`[Worker] Error during hash computation:`, error);
    const errorMessage: WorkerResponse = {
      type: "ERROR",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
    self.postMessage(errorMessage);
  }
};

export {};
