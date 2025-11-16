// File size limits
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 * 1024; // 10GB
export const MAX_FILE_SIZE_GB = 10;

// Description limits
export const MAX_DESCRIPTION_LENGTH = 500;

// Chunk processing
export const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB chunks
export const PROGRESS_UPDATE_INTERVAL = 0.05; // Update every 5%

// UI Messages
export const MESSAGES = {
  ERRORS: {
    FILE_TOO_LARGE: `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE_GB}GB.`,
    NO_FILE_SELECTED: "Please select a file to compute hash.",
    COMPUTATION_FAILED: "Hash computation failed. Please try again.",
    FILE_READ_ERROR: "Failed to read file. Please try again.",
  },
  SUCCESS: {
    HASH_COMPUTED: "Hash computed successfully!",
    HASH_COPIED: "Hash copied to clipboard!",
  },
};

