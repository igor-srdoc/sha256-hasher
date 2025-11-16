// Message types from Main Thread to Worker
export type WorkerRequest = {
  type: "COMPUTE_HASH";
  file: File;
  chunkSize: number;
};

// Message types from Worker to Main Thread
export type WorkerResponse =
  | {
      type: "PROGRESS";
      progress: number; // 0-100
    }
  | {
      type: "RESULT";
      hash: string;
    }
  | {
      type: "ERROR";
      error: string;
    };

