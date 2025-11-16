export type HashStatus = "idle" | "computing" | "completed" | "error";

export interface HashResult {
  hash: string;
  fileName: string;
  fileSize: number;
  description: string;
  computedAt: Date;
}

export interface HashState {
  // File state
  file: File | null;
  
  // Computation state
  status: HashStatus;
  progress: number; // 0-100
  error: string | null;
  
  // Results
  result: HashResult | null;
  
  // User input
  description: string;
  
  // Actions
  setFile: (file: File | null) => void;
  setDescription: (description: string) => void;
  setStatus: (status: HashStatus) => void;
  setProgress: (progress: number) => void;
  setResult: (result: HashResult) => void;
  setError: (error: string) => void;
  reset: () => void;
}

