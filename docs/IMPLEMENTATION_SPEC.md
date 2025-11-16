# ReversingLabs SSCS Portal - Implementation Specification

## Project Overview

**Project Name**: SHA256 File Hasher
**Type**: TypeScript React Web Application
**Purpose**: Calculate SHA256 hash for user-provided files up to 10GB with non-blocking UI
**Target Audience**: Internal tool users, security professionals
**Deployment**: Static web app (GitHub Pages, Vercel, or Netlify)

---

## System Architecture

### High-Level Architecture

**IMPORTANT**: This is a **100% client-side application**. Files are NEVER uploaded to any server. They stay on the user's disk and are read in chunks by the browser.

```
User's Disk (10GB file)
        │
        │ File API Reference
        ▼
┌─────────────────────────────────────────┐
│    Browser (Client-Side Only)          │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     Main UI Thread                │  │
│  │  - File Upload Component          │  │
│  │  - Description Input              │  │
│  │  - Results Display                │  │
│  │  - Error Handler                  │  │
│  └───────────┬───────────────────────┘  │
│              │ postMessage              │
│  ┌───────────▼───────────────────────┐  │
│  │     Web Worker Thread             │  │
│  │  - Read 64MB chunks via File API │  │
│  │  - SHA256 Computation (streaming) │  │
│  │  - Progress Updates               │  │
│  │  - Memory: ~100-200MB max         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
        │
        │ Display Result
        ▼
User sees hash (no network transfer)
```

### Why Browsers Can Handle 10GB Files

**Key Insight**: The browser doesn't load the entire 10GB into memory. Instead:

1. **File API gives a reference** - `File` object is just metadata + file handle
2. **Read in 64MB chunks** - Using `file.slice()` to read small portions
3. **Streaming hash computation** - Update hash with each chunk
4. **Memory efficiency** - Only 64MB in memory at any time
5. **No upload required** - File never leaves user's computer

**Memory Usage**:

- Without chunking: 10GB (❌ CRASH)
- With chunking: ~100-200MB (✅ WORKS)

---

## Project Structure

Following the established patterns from our license-app:

```
sha256-hasher/
├── src/
│   ├── app/                        # Main application
│   │   ├── app.tsx                 # Root component
│   │   ├── config/
│   │   │   └── app.config.ts       # App configuration
│   │   ├── theme/
│   │   │   └── theme.css           # Tailwind CSS + CSS variables
│   │   └── utils/
│   │       └── cn.ts               # className utilities
│   ├── features/
│   │   └── hash-computation/       # Feature-based organization
│   │       ├── hash-computation.page.tsx
│   │       ├── hash-computation.types.ts
│   │       ├── hash-computation.const.ts
│   │       ├── state/
│   │       │   └── hash.state.ts
│   │       ├── hooks/
│   │       │   └── use-hash-worker.ts    # Worker logic hook
│   │       ├── utils/
│   │       │   └── format-bytes.ts       # Feature utilities
│   │       ├── workers/
│   │       │   ├── hash.worker.ts        # SHA256 computation worker
│   │       │   └── hash.worker.types.ts
│   │       └── ui/
│   │           ├── file-uploader.tsx
│   │           ├── description-input.tsx
│   │           ├── compute-button.tsx
│   │           ├── progress-bar.tsx
│   │           ├── results-display.tsx
│   │           └── error-display.tsx
│   ├── ui/                         # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── textarea.tsx
│   │   ├── progress.tsx
│   │   └── hooks/
│   │       └── use-mobile.ts
│   ├── main.tsx                    # App entry point
│   └── vite-env.d.ts               # Vite types
├── public/
│   └── vite.svg
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── components.json                 # Shadcn UI config
├── package.json
├── pnpm-lock.yaml
└── README.md
```

**Key Conventions:**

- ✅ **kebab-case** for all file names
- ✅ **pnpm** as package manager
- ✅ **Feature-based** organization in `src/features/`
- ✅ **Feature utilities** in `src/features/*/utils/`
- ✅ **Feature workers** in `src/features/*/workers/`
- ✅ **Shadcn UI** components in `src/ui/`
- ✅ **Tailwind CSS v4** with CSS variables
- ✅ **TypeScript** with strict mode

---

## Technical Specifications

### 1. Technology Stack

#### Core Technologies

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "typescript": "~5.9.3",
  "vite": "^7.1.7"
}
```

#### UI & Styling (Shadcn UI + Tailwind v4)

```json
{
  "@radix-ui/react-label": "^2.1.8",
  "@radix-ui/react-slot": "^1.2.4",
  "tailwindcss": "^4.1.11",
  "@tailwindcss/vite": "^4.1.11",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "lucide-react": "^0.552.0",
  "tw-animate-css": "^1.4.0"
}
```

#### Hashing & Utilities

```json
{
  "crypto-js": "^4.2.0"
}
```

#### State Management

```json
{
  "zustand": "^5.0.8"
}
```

#### Testing (Bonus)

```json
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0"
}
```

#### Development

```json
{
  "@vitejs/plugin-react": "^5.0.4",
  "eslint": "^9.36.0",
  "@eslint/js": "^9.36.0",
  "typescript-eslint": "^8.45.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.22",
  "@types/node": "^24.6.0",
  "shadcn": "^3.5.0"
}
```

### 2. TypeScript Configuration

**tsconfig.json** (strict mode with path aliases)

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@ui/*": ["./src/ui/*"]
    }
  }
}
```

**tsconfig.app.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@ui/*": ["./src/ui/*"]
    }
  },
  "include": ["src"]
}
```

### 3. Vite Configuration

**vite.config.ts**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@ui": path.resolve(__dirname, "./src/ui"),
    },
  },
});
```

### 4. Tailwind CSS Configuration

**No tailwind.config.js needed!** - Tailwind v4 uses CSS-first configuration.

**src/app/theme/theme.css**

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 5. Shadcn UI Configuration

**components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/theme/theme.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/ui",
    "utils": "@/app/utils",
    "ui": "@/ui",
    "lib": "@/app/utils",
    "hooks": "@/ui/hooks"
  }
}
```

---

## Main Application Structure

### Entry Point

**src/main.tsx**

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/app/theme/theme.css";
import App from "@/app/app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Root Component

**src/app/app.tsx**

```typescript
import { HashComputationPage } from "@/features/hash-computation/hash-computation.page";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            SHA256 File Hasher
          </h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <HashComputationPage />
      </main>
    </div>
  );
}

export default App;
```

### Feature Page

**src/features/hash-computation/hash-computation.page.tsx**

```typescript
import { FileUploader } from "./ui/file-uploader";
import { DescriptionInput } from "./ui/description-input";
import { ComputeButton } from "./ui/compute-button";
import { ProgressBar } from "./ui/progress-bar";
import { ResultsDisplay } from "./ui/results-display";
import { ErrorDisplay } from "./ui/error-display";
import { useHashWorker } from "./hooks/use-hash-worker";

export function HashComputationPage() {
  // Initialize worker logic via custom hook
  useHashWorker();

  // Page is just a layout - all widgets handle their own state via Zustand
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <FileUploader />
      <DescriptionInput />
      <ComputeButton />
      <ProgressBar />
      <ResultsDisplay />
      <ErrorDisplay />
    </div>
  );
}
```

**Why this approach?**

- ✅ **No prop drilling**: Each widget accesses Zustand state directly
- ✅ **Layout only**: Page component is purely presentational
- ✅ **Self-contained widgets**: Each widget manages its own logic and visibility
- ✅ **Custom hook**: Complex worker logic extracted to `use-hash-worker`
- ✅ **Scalable**: Easy to add/remove/reorder widgets

---

### Custom Hook for Worker Logic

**src/features/hash-computation/hooks/use-hash-worker.ts**

```typescript
import { useEffect } from "react";
import { useHashState } from "../state/hash.state";
import type { HashWorkerMessage } from "../hash-computation.types";

/**
 * Custom hook that handles Web Worker initialization and message handling.
 * Extracted from page component to keep page as pure layout.
 */
export function useHashWorker() {
  const {
    worker,
    file,
    description,
    initializeWorker,
    terminateWorker,
    setProgress,
    setStatus,
    setResult,
    setError,
  } = useHashState();

  // Initialize worker on mount, cleanup on unmount
  useEffect(() => {
    initializeWorker();
    return () => terminateWorker();
  }, [initializeWorker, terminateWorker]);

  // Handle worker messages
  useEffect(() => {
    if (!worker) return;

    worker.onmessage = (e: MessageEvent<HashWorkerMessage>) => {
      const { type, data } = e.data;

      switch (type) {
        case "progress":
          setProgress(data.progress || 0);
          break;

        case "complete":
          setStatus("completed");
          setResult({
            hash: data.hash!,
            fileName: file!.name,
            fileSize: file!.size,
            description,
            computedAt: new Date(),
          });
          break;

        case "error":
          setStatus("error");
          setError(data.error || "Unknown error");
          break;
      }
    };

    worker.onerror = (error) => {
      setStatus("error");
      setError(`Worker error: ${error.message}`);
    };
  }, [worker, file, description, setProgress, setStatus, setResult, setError]);
}
```

---

### Widget Components (No Props!)

Each widget component accesses Zustand state directly - no props passed from parent.

**src/features/hash-computation/ui/file-uploader.tsx**

```typescript
import { useHashState } from "../state/hash.state";
import { MAX_FILE_SIZE, ERROR_MESSAGES } from "../hash-computation.const";
import { formatBytes } from "../utils/format-bytes";

export function FileUploader() {
  const { status, setFile, setStatus, setResult, setError } = useHashState();

  // Only show when idle or no file selected
  if (status !== "idle") return null;

  const handleFileSelect = (selectedFile: File) => {
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        `${ERROR_MESSAGES.FILE_TOO_LARGE} File size: ${formatBytes(
          selectedFile.size
        )}`
      );
      return;
    }

    // Reset state and set new file
    setFile(selectedFile);
    setStatus("idle");
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
    >
      <input
        type="file"
        id="file-input"
        onChange={handleFileInput}
        className="hidden"
      />
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="space-y-2">
          <p className="text-lg font-medium">
            Drop file here or click to select
          </p>
          <p className="text-sm text-gray-500">
            Maximum file size: {formatBytes(MAX_FILE_SIZE)}
          </p>
        </div>
      </label>
    </div>
  );
}
```

**src/features/hash-computation/ui/description-input.tsx**

```typescript
import { useHashState } from "../state/hash.state";
import { MAX_DESCRIPTION_LENGTH } from "../hash-computation.const";
import { Textarea } from "@ui/textarea";
import { Label } from "@ui/label";

export function DescriptionInput() {
  const { file, status, description, setDescription } = useHashState();

  // Only show when file is selected (but allow editing during computation!)
  // Hide only when completed to show results
  if (!file || status === "completed") return null;

  const remaining = MAX_DESCRIPTION_LENGTH - description.length;

  const handleChange = (value: string) => {
    // Enforce character limit
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="description">File Description (Optional)</Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Add a description for this file..."
        rows={3}
        className="resize-none"
      />
      <p className="text-sm text-gray-500 text-right">
        {remaining} characters remaining
      </p>
    </div>
  );
}
```

**src/features/hash-computation/ui/compute-button.tsx**

```typescript
import { useHashState } from "../state/hash.state";
import { Button } from "@ui/button";

export function ComputeButton() {
  const { file, status, worker, setStatus, setProgress } = useHashState();

  // Only show when file selected and idle
  if (!file || status !== "idle") return null;

  const handleCompute = () => {
    if (!worker) return;

    setStatus("computing");
    setProgress(0);
    worker.postMessage({ file });
  };

  return (
    <Button onClick={handleCompute} className="w-full" size="lg">
      Compute SHA256 Hash
    </Button>
  );
}
```

**src/features/hash-computation/ui/progress-bar.tsx**

```typescript
import { useHashState } from "../state/hash.state";
import { Progress } from "@ui/progress";
import { formatBytes } from "../utils/format-bytes";

export function ProgressBar() {
  const { file, status, progress } = useHashState();

  // Only show when computing
  if (status !== "computing" || !file) return null;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium">Computing hash...</p>
        <p className="text-sm text-gray-500">{Math.round(progress)}%</p>
      </div>
      <Progress value={progress} className="w-full" />
      <p className="text-xs text-gray-500">
        Processing: {file.name} ({formatBytes(file.size)})
      </p>
    </div>
  );
}
```

**src/features/hash-computation/ui/results-display.tsx**

```typescript
import { useHashState } from "../state/hash.state";
import { Button } from "@ui/button";
import { formatBytes } from "../utils/format-bytes";

export function ResultsDisplay() {
  const { status, result, reset } = useHashState();

  // Only show when completed
  if (status !== "completed" || !result) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-green-900">
          Hash Computed Successfully
        </h3>
        <Button variant="outline" size="sm" onClick={reset}>
          Compute Another
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700">SHA256 Hash:</p>
          <code className="block mt-1 p-2 bg-white border rounded text-sm break-all font-mono">
            {result.hash}
          </code>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">File Name:</p>
          <p className="text-sm text-gray-600">{result.fileName}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">File Size:</p>
          <p className="text-sm text-gray-600">
            {formatBytes(result.fileSize)}
          </p>
        </div>

        {result.description && (
          <div>
            <p className="text-sm font-medium text-gray-700">Description:</p>
            <p className="text-sm text-gray-600">{result.description}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-gray-700">Computed At:</p>
          <p className="text-sm text-gray-600">
            {result.computedAt.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
```

**src/features/hash-computation/ui/error-display.tsx**

```typescript
import { useHashState } from "../state/hash.state";
import { Button } from "@ui/button";

export function ErrorDisplay() {
  const { status, error, worker, setStatus, setProgress, reset } =
    useHashState();

  // Only show when error occurred
  if (status !== "error" || !error) return null;

  const handleRetry = () => {
    const { file } = useHashState.getState();
    if (!file || !worker) return;

    setStatus("computing");
    setProgress(0);
    worker.postMessage({ file });
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-red-900">Error</h3>
      <p className="text-sm text-red-700">{error}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleRetry}>
          Retry
        </Button>
        <Button variant="ghost" onClick={reset}>
          Start Over
        </Button>
      </div>
    </div>
  );
}
```

---

## User Stories

### User Story 1: File Upload with Validation

**User Story**: As a user, I want to upload a file so that I can calculate its SHA256 hash.

**Acceptance Criteria**:

- ✅ Support drag & drop file upload
- ✅ Support click to select file
- ✅ Validate file size (max 10GB)
- ✅ Display clear error for oversized files
- ✅ Show file name and size after selection

**Feature Constants**: `src/features/hash-computation/hash-computation.const.ts`

```typescript
export const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB in bytes
export const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB
export const MAX_DESCRIPTION_LENGTH = 500;

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: "File size exceeds the maximum allowed size of 10GB.",
  FILE_READ_ERROR: "Unable to read the file. Please try again.",
  WORKER_ERROR: "An error occurred during hash computation. Please try again.",
  BROWSER_NOT_SUPPORTED: "Your browser does not support the required features.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;
```

**Technical Implementation**:

```typescript
import { MAX_FILE_SIZE } from "./hash-computation.const";
import { formatBytes } from "./utils/format-bytes";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  maxSize: number; // bytes
  disabled?: boolean;
}

// Validation logic
const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `File size (${formatBytes(
      file.size
    )}) exceeds maximum allowed size (10GB)`;
  }
  return null;
};
```

**Edge Cases**:

- Multiple files dropped (take first or show error)
- Empty file (size = 0)
- File access denied by OS
- File deleted after selection

---

### User Story 2: Non-Blocking SHA256 Computation

**User Story**: As a user, I want the UI to remain responsive while my file is being hashed.

**Acceptance Criteria**:

- ✅ UI remains interactive during hash computation
- ✅ User can type in description field while hashing
- ✅ Computation runs in Web Worker
- ✅ Progress updates don't freeze UI
- ✅ File processed in chunks (never loaded entirely into memory)

**Important Note**: The file is NEVER uploaded to a server. It stays on the user's disk and is read in 64MB chunks locally. This is why browsers can handle 10GB files - we only load 64MB at a time into memory.

**Technical Implementation**:

**State Management with Zustand**:

**src/features/hash-computation/state/hash.state.ts**

```typescript
import { create } from "zustand";
import type { HashResult } from "../hash-computation.types";

interface HashState {
  // File state
  file: File | null;
  description: string;

  // Computation state
  status: "idle" | "computing" | "completed" | "error";
  progress: number;

  // Results
  result: HashResult | null;
  error: string | null;

  // Worker
  worker: Worker | null;

  // Actions
  setFile: (file: File | null) => void;
  setDescription: (description: string) => void;
  setStatus: (status: HashState["status"]) => void;
  setProgress: (progress: number) => void;
  setResult: (result: HashResult | null) => void;
  setError: (error: string | null) => void;
  initializeWorker: () => void;
  terminateWorker: () => void;
  reset: () => void;
}

export const useHashState = create<HashState>((set, get) => ({
  // Initial state
  file: null,
  description: "",
  status: "idle",
  progress: 0,
  result: null,
  error: null,
  worker: null,

  // Actions
  setFile: (file) => set({ file }),
  setDescription: (description) => set({ description }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),

  initializeWorker: () => {
    const worker = new Worker(
      new URL("./workers/hash.worker.ts", import.meta.url),
      { type: "module" }
    );
    set({ worker });
  },

  terminateWorker: () => {
    const { worker } = get();
    worker?.terminate();
    set({ worker: null });
  },

  reset: () =>
    set({
      file: null,
      description: "",
      status: "idle",
      progress: 0,
      result: null,
      error: null,
    }),
}));
```

**Web Worker Implementation**

**src/features/hash-computation/workers/hash.worker.ts**:

```typescript
const CHUNK_SIZE = 64 * 1024 * 1024; // 64MB chunks

self.onmessage = async (e: MessageEvent<{ file: File }>) => {
  const { file } = e.data;

  try {
    const hash = await computeSHA256(file, (progress) => {
      self.postMessage({ type: "progress", data: { progress } });
    });

    self.postMessage({ type: "complete", data: { hash } });
  } catch (error) {
    self.postMessage({
      type: "error",
      data: { error: error.message },
    });
  }
};

async function computeSHA256(
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  // Use crypto-js for streaming hash computation
  // This allows processing 10GB files without loading them entirely into memory
  const hash = CryptoJS.algo.SHA256.create();
  let offset = 0;

  // Process file in chunks
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const arrayBuffer = await chunk.arrayBuffer();

    // Convert ArrayBuffer to WordArray for crypto-js
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

    // Update hash incrementally (streaming)
    hash.update(wordArray);

    offset += CHUNK_SIZE;
    const progress = (offset / file.size) * 100;
    onProgress(Math.min(progress, 99)); // Reserve 100% for final computation
  }

  // Finalize hash computation
  const finalHash = hash.finalize();
  onProgress(100);

  return finalHash.toString(CryptoJS.enc.Hex);
}
```

**Why crypto-js?** The Web Crypto API (`crypto.subtle`) doesn't support incremental/streaming hash updates. For 10GB files, we MUST use streaming to avoid loading the entire file into memory. crypto-js provides `.create()`, `.update()`, and `.finalize()` methods that enable true streaming hash computation.

**Alternative Approach (Web Crypto API - NOT RECOMMENDED for large files)**:

```typescript
// ⚠️ WARNING: This loads entire file into memory - NOT suitable for 10GB files
async function computeSHA256WebCrypto(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer(); // ❌ Loads entire file
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}
```

---

### User Story 3: File Description Input

**User Story**: As a user, I want to add a description to my file while it's being hashed.

**Acceptance Criteria**:

- ✅ Text area for description input
- ✅ 500 character limit enforced
- ✅ Character counter showing remaining characters
- ✅ Input remains enabled during hash computation
- ✅ Description saved and displayed with results

**Technical Implementation**:

```typescript
interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  disabled?: boolean;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({
  value,
  onChange,
  maxLength,
  disabled = false,
}) => {
  const remaining = maxLength - value.length;
  const isNearLimit = remaining <= 50;

  return (
    <div className="space-y-2">
      <label htmlFor="description" className="block text-sm font-medium">
        File Description (Optional)
      </label>
      <textarea
        id="description"
        value={value}
        onChange={(e) => {
          const newValue = e.target.value.slice(0, maxLength);
          onChange(newValue);
        }}
        disabled={disabled}
        maxLength={maxLength}
        rows={4}
        className="w-full p-3 border rounded-lg"
        placeholder="Add a description for this file..."
      />
      <div
        className={`text-sm ${
          isNearLimit ? "text-amber-600" : "text-gray-500"
        }`}
      >
        {remaining} characters remaining
      </div>
    </div>
  );
};
```

---

### User Story 4: Results Display

**User Story**: As a user, I want to see the calculated hash and file information clearly.

**Acceptance Criteria**:

- ✅ Hash displayed in green color
- ✅ Hash is monospaced font for readability
- ✅ File name displayed
- ✅ File size displayed in human-readable format
- ✅ Description displayed (if provided)
- ✅ Copy hash button (nice to have)

**Technical Implementation**:

```typescript
interface HashResult {
  hash: string;
  fileName: string;
  fileSize: number;
  description: string;
  computedAt: Date;
}

interface ResultsDisplayProps {
  result: HashResult;
  onReset?: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, onReset }) => {
  const [copied, setCopied] = useState(false);

  const copyHash = async () => {
    await navigator.clipboard.writeText(result.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold">Hash Computation Complete</h3>

      {/* Hash Display */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-600">SHA256 Hash</label>
        <div className="flex items-center gap-2">
          <code className="block p-3 bg-green-50 text-green-700 rounded font-mono text-sm break-all">
            {result.hash}
          </code>
          <button
            onClick={copyHash}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* File Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600">File Name</label>
          <p className="text-gray-900">{result.fileName}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">File Size</label>
          <p className="text-gray-900">{formatBytes(result.fileSize)}</p>
        </div>
      </div>

      {/* Description */}
      {result.description && (
        <div>
          <label className="text-sm font-medium text-gray-600">
            Description
          </label>
          <p className="text-gray-900 whitespace-pre-wrap">
            {result.description}
          </p>
        </div>
      )}

      {/* Actions */}
      {onReset && (
        <button
          onClick={onReset}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Hash Another File
        </button>
      )}
    </div>
  );
};

// Utility function
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
```

**Feature Utility**: `src/features/hash-computation/utils/format-bytes.ts`

```typescript
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
```

**Usage in feature**:

```typescript
import { formatBytes } from "./utils/format-bytes";

const fileSize = formatBytes(file.size); // "1.5 GB"
```

**CN utility**: `src/app/utils/cn.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

### User Story 5: Error Handling & Retry

**User Story**: As a user, I want to see clear error messages and be able to retry if something goes wrong.

**Acceptance Criteria**:

- ✅ Error messages displayed in blue color
- ✅ Error messages are user-friendly
- ✅ Retry button available on error
- ✅ Different errors have appropriate messages
- ✅ Errors don't crash the application

**Technical Implementation**:

```typescript
interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
  onDismiss?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
}) => {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-600" /* error icon */>
            {/* SVG path */}
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-blue-900 font-medium">Error</h4>
          <p className="text-blue-800 mt-1">{error}</p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Error messages
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: "File size exceeds the maximum allowed size of 10GB.",
  FILE_READ_ERROR: "Unable to read the file. Please try again.",
  WORKER_ERROR: "An error occurred during hash computation. Please try again.",
  BROWSER_NOT_SUPPORTED: "Your browser does not support the required features.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
```

---

### User Story 6: Progress Bar (Bonus)

**User Story**: As a user, I want to see how long until my file hash is computed.

**Acceptance Criteria**:

- ✅ Progress bar shows percentage completion
- ✅ Progress updates smoothly
- ✅ Accurate progress based on processed bytes
- ✅ Visual feedback during computation

**Technical Implementation**:

```typescript
interface ProgressBarProps {
  progress: number; // 0-100
  fileName: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, fileName }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Processing: {fileName}</span>
        <span className="text-gray-900 font-medium">
          {progress.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
```

---

## Application State Management

### Zustand Store

The application uses **Zustand** for state management, providing a simple and performant global state solution.

**Benefits of Zustand**:

- ✅ Minimal boilerplate
- ✅ No context providers needed
- ✅ TypeScript-first
- ✅ DevTools support
- ✅ Matches license-app pattern

### State Structure

```typescript
interface HashState {
  // File state
  file: File | null;
  description: string;

  // Computation state
  status: "idle" | "computing" | "completed" | "error";
  progress: number;

  // Results
  result: HashResult | null;
  error: string | null;

  // Worker
  worker: Worker | null;

  // Actions
  setFile: (file: File | null) => void;
  setDescription: (description: string) => void;
  setStatus: (status: HashState["status"]) => void;
  setProgress: (progress: number) => void;
  setResult: (result: HashResult | null) => void;
  setError: (error: string | null) => void;
  initializeWorker: () => void;
  terminateWorker: () => void;
  reset: () => void;
}
```

### Usage Example

```typescript
import { useHashState } from "./state/hash.state";

function Component() {
  const { file, setFile, status, setStatus } = useHashState();

  // Use state and actions
  const handleFileSelect = (newFile: File) => {
    setFile(newFile);
    setStatus("idle");
  };

  return <div>{/* ... */}</div>;
}
```

---

## Testing Strategy (Bonus)

### Test File Structure

Tests are colocated with the code they test, following this structure:

```
src/features/hash-computation/
├── hash-computation.page.tsx
├── hash-computation.page.test.tsx           # Page integration tests
├── hooks/
│   ├── use-hash-worker.ts
│   └── use-hash-worker.test.ts              # Hook tests
├── utils/
│   ├── format-bytes.ts
│   └── format-bytes.test.ts                 # Utility tests
├── workers/
│   ├── hash.worker.ts
│   └── hash.worker.test.ts                  # Worker tests
└── ui/
    ├── file-uploader.tsx
    ├── file-uploader.test.tsx               # Component tests
    ├── description-input.tsx
    ├── description-input.test.tsx
    ├── progress-bar.tsx
    ├── progress-bar.test.tsx
    ├── results-display.tsx
    ├── results-display.test.tsx
    ├── error-display.tsx
    └── error-display.test.tsx

e2e/
├── hash-computation.spec.ts                 # E2E tests
└── fixtures/
    ├── small-file.txt                       # Test files
    ├── medium-file.bin
    └── large-file.bin
```

---

### Unit Tests

#### 1. Utility Function Tests

**Utilities to Test**:

1. `formatBytes` - byte formatting
2. `validateFile` - file validation logic
3. Any helper functions

**Example Utility Test**:

**src/features/hash-computation/utils/format-bytes.test.ts**

```typescript
import { describe, it, expect } from "vitest";
import { formatBytes } from "./format-bytes";

describe("formatBytes", () => {
  it("formats 0 bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats bytes correctly", () => {
    expect(formatBytes(500)).toBe("500 Bytes");
  });

  it("formats kilobytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes correctly", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(5242880)).toBe("5 MB");
  });

  it("formats gigabytes correctly", () => {
    expect(formatBytes(1073741824)).toBe("1 GB");
    expect(formatBytes(10737418240)).toBe("10 GB");
  });

  it("formats terabytes correctly", () => {
    expect(formatBytes(1099511627776)).toBe("1 TB");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1638400)).toBe("1.56 MB");
  });

  it("handles large numbers", () => {
    const tenGB = 10 * 1024 * 1024 * 1024;
    expect(formatBytes(tenGB)).toBe("10 GB");
  });
});
```

---

#### 2. Component Tests

**Components to Test**:

1. `FileUploader` - file validation, drag & drop
2. `DescriptionInput` - character limit, onChange
3. `ResultsDisplay` - proper rendering of results
4. `ErrorDisplay` - error messages, retry button
5. `ProgressBar` - progress calculation
6. `ComputeButton` - visibility based on state

**Example Component Test**:

**src/features/hash-computation/ui/description-input.test.tsx**

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DescriptionInput } from "./description-input";

describe("DescriptionInput", () => {
  beforeEach(() => {
    // Reset Zustand store before each test
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "idle",
      description: "",
    });
  });

  it("enforces character limit", () => {
    render(<DescriptionInput />);

    const textarea = screen.getByRole("textbox");
    const longText = "a".repeat(600);

    fireEvent.change(textarea, { target: { value: longText } });

    const state = require("../state/hash.state").useHashState.getState();
    expect(state.description).toBe("a".repeat(500));
  });

  it("shows character counter", () => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({ description: "Hello" });

    render(<DescriptionInput />);

    expect(screen.getByText("495 characters remaining")).toBeInTheDocument();
  });

  it("updates counter as user types", () => {
    render(<DescriptionInput />);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Test description" } });

    expect(screen.getByText(/characters remaining/)).toBeInTheDocument();
  });

  it("hides when file is not selected", () => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({ file: null });

    const { container } = render(<DescriptionInput />);

    expect(container.firstChild).toBeNull();
  });

  it("remains visible during computation", () => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "computing",
      description: "Initial description",
    });

    render(<DescriptionInput />);

    // Should still be visible and editable
    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Initial description");
  });

  it("hides when computation is completed", () => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      status: "completed",
      description: "Final description",
    });

    const { container } = render(<DescriptionInput />);

    expect(container.firstChild).toBeNull();
  });
});
```

---

#### 3. Component Tests - Visual Styling

These tests verify that visual requirements (colors, styling) are correctly applied.

**Components to Test**:

1. `ResultsDisplay` - Hash displayed in green with monospace font
2. `ErrorDisplay` - Errors displayed in blue

**Example Styling Tests**:

**src/features/hash-computation/ui/results-display.test.tsx**

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ResultsDisplay } from "./results-display";

describe("ResultsDisplay - Styling", () => {
  beforeEach(() => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({
      status: "completed",
      result: {
        hash: "abc123def456",
        fileName: "test.txt",
        fileSize: 1024,
        description: "Test description",
        computedAt: new Date(),
      },
    });
  });

  it("displays hash in green color", () => {
    render(<ResultsDisplay />);

    const hashElement = screen.getByText(/abc123def456/i);

    // Check for green color class (Tailwind: text-green-600 or similar)
    expect(hashElement).toHaveClass(/text-green/);
  });

  it("displays hash in monospace font", () => {
    render(<ResultsDisplay />);

    const hashElement = screen.getByText(/abc123def456/i);

    // Check for monospace font class (Tailwind: font-mono)
    expect(hashElement).toHaveClass("font-mono");
  });

  it("hides when no result available", () => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({
      status: "idle",
      result: null,
    });

    const { container } = render(<ResultsDisplay />);

    expect(container.firstChild).toBeNull();
  });
});
```

**src/features/hash-computation/ui/error-display.test.tsx**

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ErrorDisplay } from "./error-display";

describe("ErrorDisplay - Styling", () => {
  beforeEach(() => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({
      status: "error",
      error: "File size exceeds the maximum allowed size of 10GB.",
    });
  });

  it("displays error message in blue color", () => {
    render(<ErrorDisplay />);

    const errorElement = screen.getByText(/file size exceeds/i);

    // Check for blue color class (Tailwind: text-blue-600 or similar)
    expect(errorElement).toHaveClass(/text-blue/);
  });

  it("shows retry button on error", () => {
    render(<ErrorDisplay />);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("hides when no error", () => {
    const { useHashState } = require("../state/hash.state");
    useHashState.setState({
      status: "idle",
      error: null,
    });

    const { container } = render(<ErrorDisplay />);

    expect(container.firstChild).toBeNull();
  });

  it("clears error and resets state on retry click", () => {
    const { useHashState } = require("../state/hash.state");

    render(<ErrorDisplay />);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryButton);

    const state = useHashState.getState();
    expect(state.status).toBe("idle");
    expect(state.error).toBeNull();
  });
});
```

---

#### 4. Custom Hook Tests

**Hooks to Test**:

1. `useHashWorker` - worker initialization and message handling

**Example Hook Test**:

**src/features/hash-computation/hooks/use-hash-worker.test.ts**

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useHashWorker } from "./use-hash-worker";
import { useHashState } from "../state/hash.state";

// Mock Web Worker
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;

  postMessage(data: any) {
    // Simulate worker behavior
  }

  terminate() {
    // Clean up
  }
}

global.Worker = MockWorker as any;

describe("useHashWorker", () => {
  beforeEach(() => {
    useHashState.setState({
      file: null,
      status: "idle",
      progress: 0,
      result: null,
      error: null,
      worker: null,
    });
  });

  it("initializes worker on mount", () => {
    const { result } = renderHook(() => useHashWorker());

    const state = useHashState.getState();
    expect(state.worker).toBeTruthy();
  });

  it("terminates worker on unmount", () => {
    const { unmount } = renderHook(() => useHashWorker());

    const worker = useHashState.getState().worker;
    const terminateSpy = vi.spyOn(worker!, "terminate");

    unmount();

    expect(terminateSpy).toHaveBeenCalled();
  });

  it("handles progress messages", async () => {
    renderHook(() => useHashWorker());

    const worker = useHashState.getState().worker;
    worker!.onmessage!({
      data: { type: "progress", data: { progress: 50 } },
    } as MessageEvent);

    await waitFor(() => {
      expect(useHashState.getState().progress).toBe(50);
    });
  });

  it("handles completion messages", async () => {
    useHashState.setState({
      file: new File(["test"], "test.txt"),
      description: "Test file",
    });

    renderHook(() => useHashWorker());

    const worker = useHashState.getState().worker;
    const testHash = "abc123";

    worker!.onmessage!({
      data: { type: "complete", data: { hash: testHash } },
    } as MessageEvent);

    await waitFor(() => {
      const state = useHashState.getState();
      expect(state.status).toBe("completed");
      expect(state.result?.hash).toBe(testHash);
    });
  });

  it("handles error messages", async () => {
    renderHook(() => useHashWorker());

    const worker = useHashState.getState().worker;
    const errorMessage = "File read error";

    worker!.onmessage!({
      data: { type: "error", data: { error: errorMessage } },
    } as MessageEvent);

    await waitFor(() => {
      const state = useHashState.getState();
      expect(state.status).toBe("error");
      expect(state.error).toBe(errorMessage);
    });
  });
});
```

---

### Integration Tests

**Scenarios to Test**:

1. Complete happy path: upload → compute → display results
2. Error path: upload oversized file → see error → retry
3. Description functionality: type while computing
4. State persistence across widget interactions

**Example Integration Test**:

**src/features/hash-computation/hash-computation.page.test.tsx**

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { HashComputationPage } from "./hash-computation.page";
import { useHashState } from "./state/hash.state";

// Mock Web Worker
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage = vi.fn((data) => {
    // Simulate hash computation
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            type: "complete",
            data: { hash: "abc123def456" },
          },
        } as MessageEvent);
      }
    }, 100);
  });
  terminate = vi.fn();
}

global.Worker = MockWorker as any;
global.URL.createObjectURL = vi.fn();

describe("HashComputationPage - Integration", () => {
  beforeEach(() => {
    useHashState.setState({
      file: null,
      description: "",
      status: "idle",
      progress: 0,
      result: null,
      error: null,
      worker: null,
    });
  });

  it("completes full happy path flow", async () => {
    render(<HashComputationPage />);

    // 1. Upload file
    const file = new File(["test content"], "test.txt", { type: "text/plain" });
    const input = screen.getByLabelText(/drop file here/i);

    fireEvent.change(input, { target: { files: [file] } });

    // 2. File should be selected
    await waitFor(() => {
      expect(screen.getByText(/test.txt/i)).toBeInTheDocument();
    });

    // 3. Add description
    const textarea = screen.getByPlaceholderText(/add a description/i);
    fireEvent.change(textarea, { target: { value: "Test file description" } });

    // 4. Click compute button
    const computeButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(computeButton);

    // 5. Should show progress
    await waitFor(() => {
      expect(screen.getByText(/computing/i)).toBeInTheDocument();
    });

    // 6. Should show results
    await waitFor(
      () => {
        expect(
          screen.getByText(/hash computed successfully/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/abc123def456/i)).toBeInTheDocument();
        expect(screen.getByText(/test file description/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("handles oversized file error flow", async () => {
    render(<HashComputationPage />);

    // Create a file larger than 10GB (simulate by setting size)
    const largeFile = new File(["x"], "large.bin");
    Object.defineProperty(largeFile, "size", {
      value: 11 * 1024 * 1024 * 1024, // 11GB
    });

    const input = screen.getByLabelText(/drop file here/i);
    fireEvent.change(input, { target: { files: [largeFile] } });

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/exceeds.*10GB/i)).toBeInTheDocument();
    });

    // Should have retry button
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("allows typing description while computing", async () => {
    render(<HashComputationPage />);

    // Upload file
    const file = new File(["test"], "test.txt");
    const input = screen.getByLabelText(/drop file here/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Add initial description
    const textarea = screen.getByPlaceholderText(/add a description/i);
    fireEvent.change(textarea, { target: { value: "Initial text" } });

    // Start computation
    await waitFor(() => {
      const computeButton = screen.getByRole("button", { name: /compute/i });
      fireEvent.click(computeButton);
    });

    // Verify we're computing
    const state = useHashState.getState();
    expect(state.status).toBe("computing");

    // CRITICAL: Description input should still be visible and editable during computation
    // This demonstrates non-blocking UI
    const textareaWhileComputing =
      screen.getByPlaceholderText(/add a description/i);
    expect(textareaWhileComputing).toBeInTheDocument();
    expect(textareaWhileComputing).toHaveValue("Initial text");

    // User can continue editing while hash is being computed
    fireEvent.change(textareaWhileComputing, {
      target: { value: "Initial text - edited during computation" },
    });

    // Verify the description was updated
    const updatedState = useHashState.getState();
    expect(updatedState.description).toBe(
      "Initial text - edited during computation"
    );
  });

  it("allows resetting and computing another file", async () => {
    render(<HashComputationPage />);

    // Complete first hash
    const file1 = new File(["test1"], "file1.txt");
    const input = screen.getByLabelText(/drop file here/i);
    fireEvent.change(input, { target: { files: [file1] } });

    await waitFor(() => {
      const computeButton = screen.getByRole("button", { name: /compute/i });
      fireEvent.click(computeButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/hash computed successfully/i)
      ).toBeInTheDocument();
    });

    // Click "Compute Another"
    const resetButton = screen.getByRole("button", {
      name: /compute another/i,
    });
    fireEvent.click(resetButton);

    // Should be back to upload state
    await waitFor(() => {
      expect(screen.getByText(/drop file here/i)).toBeInTheDocument();
    });

    const state = useHashState.getState();
    expect(state.file).toBeNull();
    expect(state.result).toBeNull();
  });
});
```

---

### E2E Tests (Optional)

E2E tests use Playwright to test the full application flow with real browser interactions and actual file processing.

**Setup**:

```bash
# Install Playwright
pnpm add -D @playwright/test

# Initialize Playwright
pnpm dlx playwright install
```

**Test File Structure**:

```
e2e/
├── hash-computation.spec.ts
├── fixtures/
│   ├── small-file.txt        # 1KB
│   ├── medium-file.bin       # 10MB
│   └── large-file.bin        # 100MB (for performance testing)
└── playwright.config.ts
```

**Example E2E Test**:

**e2e/hash-computation.spec.ts**

```typescript
import { test, expect } from "@playwright/test";
import path from "path";

test.describe("SHA256 Hash Computation E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
  });

  test("computes hash for small text file", async ({ page }) => {
    // Upload file
    const filePath = path.join(__dirname, "fixtures", "small-file.txt");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Verify file is selected
    await expect(page.getByText("small-file.txt")).toBeVisible();

    // Add description
    await page.getByPlaceholder(/add a description/i).fill("Test description");

    // Click compute button
    await page.getByRole("button", { name: /compute sha256 hash/i }).click();

    // Wait for progress bar
    await expect(page.getByText(/computing hash/i)).toBeVisible();

    // Wait for results (should be fast for small file)
    await expect(page.getByText(/hash computed successfully/i), {
      timeout: 10000,
    }).toBeVisible();

    // Verify hash is displayed (64 character hex string)
    const hashElement = page.locator("code").first();
    const hashText = await hashElement.textContent();
    expect(hashText).toMatch(/^[a-f0-9]{64}$/i);

    // Verify description is shown
    await expect(page.getByText("Test description")).toBeVisible();

    // Verify file metadata
    await expect(page.getByText("small-file.txt")).toBeVisible();
    await expect(page.getByText(/KB|Bytes/)).toBeVisible();
  });

  test("handles large file with progress updates", async ({ page }) => {
    const filePath = path.join(__dirname, "fixtures", "medium-file.bin");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.getByRole("button", { name: /compute/i }).click();

    // Verify progress updates
    await expect(page.getByText(/computing hash/i)).toBeVisible();

    // Progress should increase (check for different percentages)
    const progressText = page.locator("text=/\\d+%/");
    await expect(progressText).toBeVisible();

    // Wait for completion
    await expect(page.getByText(/hash computed successfully/i), {
      timeout: 30000,
    }).toBeVisible();
  });

  test("shows error for oversized file", async ({ page }) => {
    // Note: For E2E, we'd need to create or mock a file > 10GB
    // This test documents the expected behavior

    // Mock file size check by intercepting the file input
    await page.evaluate(() => {
      const originalFileInput = document.querySelector('input[type="file"]');
      if (originalFileInput) {
        originalFileInput.addEventListener("change", (e) => {
          const input = e.target as HTMLInputElement;
          if (input.files && input.files[0]) {
            Object.defineProperty(input.files[0], "size", {
              value: 11 * 1024 * 1024 * 1024, // 11GB
            });
          }
        });
      }
    });

    const filePath = path.join(__dirname, "fixtures", "small-file.txt");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Should show error message
    await expect(page.getByText(/file size exceeds.*10GB/i)).toBeVisible();
  });

  test("allows computing multiple files in sequence", async ({ page }) => {
    // First file
    const file1Path = path.join(__dirname, "fixtures", "small-file.txt");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(file1Path);

    await page.getByRole("button", { name: /compute/i }).click();

    await expect(page.getByText(/hash computed successfully/i)).toBeVisible({
      timeout: 10000,
    });

    const firstHash = await page.locator("code").first().textContent();

    // Click "Compute Another"
    await page.getByRole("button", { name: /compute another/i }).click();

    // Upload second file
    const file2Path = path.join(__dirname, "fixtures", "medium-file.bin");
    await fileInput.setInputFiles(file2Path);

    await page.getByRole("button", { name: /compute/i }).click();

    await expect(page.getByText(/hash computed successfully/i)).toBeVisible({
      timeout: 30000,
    });

    const secondHash = await page.locator("code").first().textContent();

    // Hashes should be different
    expect(firstHash).not.toBe(secondHash);
  });

  test("copy hash to clipboard works", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-write", "clipboard-read"]);

    const filePath = path.join(__dirname, "fixtures", "small-file.txt");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.getByRole("button", { name: /compute/i }).click();

    await expect(page.getByText(/hash computed successfully/i)).toBeVisible({
      timeout: 10000,
    });

    // Click copy button
    await page.getByRole("button", { name: /copy/i }).click();

    // Verify button text changed
    await expect(page.getByText(/copied/i)).toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toMatch(/^[a-f0-9]{64}$/i);
  });

  test("UI remains responsive during computation", async ({ page }) => {
    const filePath = path.join(__dirname, "fixtures", "medium-file.bin");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.getByRole("button", { name: /compute/i }).click();

    // While computing, page should still be interactive
    await expect(page.getByText(/computing hash/i)).toBeVisible();

    // Try to interact with the page (e.g., scroll)
    await page.mouse.wheel(0, 100);

    // Page should not freeze
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("supports drag and drop file upload", async ({ page }) => {
    await page.goto("http://localhost:5173");

    // Prepare file for drag & drop
    const filePath = path.join(__dirname, "fixtures", "small-file.txt");

    // Get the drop zone element (the input or its parent container)
    const dropZone = page.locator('[data-testid="file-upload-zone"]');

    // Read file as buffer
    const fs = require("fs");
    const fileBuffer = fs.readFileSync(filePath);

    // Create DataTransfer with file
    const dataTransfer = await page.evaluateHandle(
      ({ fileName, fileContent }) => {
        const dt = new DataTransfer();
        const file = new File([fileContent], fileName, { type: "text/plain" });
        dt.items.add(file);
        return dt;
      },
      {
        fileName: "small-file.txt",
        fileContent: fileBuffer.toString(),
      }
    );

    // Dispatch drop event
    await dropZone.dispatchEvent("drop", { dataTransfer });

    // Verify file was accepted
    await expect(page.getByText("small-file.txt")).toBeVisible();

    // Should be able to proceed with computation
    const computeButton = page.getByRole("button", { name: /compute/i });
    await expect(computeButton).toBeEnabled();
  });

  test("validates file type and shows hash display styling", async ({
    page,
  }) => {
    const filePath = path.join(__dirname, "fixtures", "small-file.txt");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.getByRole("button", { name: /compute/i }).click();

    // Wait for computation to complete
    await expect(page.getByText(/hash computed successfully/i), {
      timeout: 10000,
    }).toBeVisible();

    // Verify hash styling
    const hashElement = page.locator("code").first();

    // Check for green color (computed style or class)
    const hashColor = await hashElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.color;
    });

    // RGB values for green (varies by exact shade, but should have high green component)
    // This is a basic check - adjust based on actual color used
    expect(hashColor).toMatch(/rgb.*(?:0|34|22)/); // Matches green shades

    // Check for monospace font
    const fontFamily = await hashElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.fontFamily;
    });

    expect(fontFamily).toMatch(/mono|courier|consolas/i);
  });
});
```

**Playwright Configuration**:

**e2e/playwright.config.ts**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### Test Coverage Goals

| Type                  | Target Coverage     | Priority |
| --------------------- | ------------------- | -------- |
| **Utility Functions** | 100%                | High     |
| **Custom Hooks**      | 90%                 | High     |
| **Components**        | 80%                 | Medium   |
| **Integration**       | Key flows           | High     |
| **E2E**               | Happy path + errors | Medium   |

---

### Running Tests

```bash
# Run all unit and integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests in UI mode
pnpm test:e2e:ui

# Run E2E tests headed (see browser)
pnpm test:e2e:headed
```

**package.json scripts**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

---

## Development Workflow

### Phase 1: Setup (30 min)

```bash
# Initialize project with Vite
pnpm create vite sha256-hasher --template react-ts
cd sha256-hasher
pnpm install

# Add dependencies
pnpm add crypto-js
pnpm add -D @types/crypto-js

# Add Tailwind CSS v4 with Vite plugin
pnpm add tailwindcss @tailwindcss/vite
pnpm add class-variance-authority clsx tailwind-merge tw-animate-css

# Add Radix UI primitives
pnpm add @radix-ui/react-label @radix-ui/react-slot

# Add icons
pnpm add lucide-react

# Add state management
pnpm add zustand

# Add Shadcn CLI for UI components
pnpm add -D shadcn

# Initialize Shadcn UI
pnpm dlx shadcn@latest init

# Add specific Shadcn components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add progress

# Add testing (bonus)
pnpm add -D vitest @testing-library/react @testing-library/jest-dom

# Setup project structure
mkdir -p src/app/{config,theme,utils}
mkdir -p src/features/hash-computation/{state,hooks,ui,utils,workers}
```

### Phase 2: Development (6-7 hours)

1. Create base UI layout
2. Implement file upload component
3. Create Web Worker for hashing
4. Build description input
5. Implement results display
6. Add error handling
7. Add progress bar (bonus)

### Phase 3: Testing & Polish (1-2 hours)

1. Manual testing with various file sizes
2. Write unit tests (bonus)
3. Fix bugs and improve UX
4. Code cleanup and refactoring

### Phase 4: Documentation (30 min)

1. Write comprehensive README
2. Add inline code comments
3. Document architecture decisions
4. List tradeoffs and improvements

---

## Performance Considerations

### Optimization Strategies

1. **Chunked File Reading**

   - Read file in 64MB chunks
   - Prevents memory overflow
   - Allows progress updates

2. **Web Worker Usage**

   - Offloads computation from main thread
   - UI remains responsive
   - Can be cancelled if needed

3. **Memory Management**

   - Dispose of ArrayBuffers after processing
   - Terminate worker when done
   - Clear result state when starting new computation

4. **UI Optimizations**
   - Debounce progress updates (max 10 updates/sec)
   - Use CSS transitions for smooth progress bar
   - Virtual scrolling for large result lists (future)

### Performance Metrics Goals

- **Time to Interactive**: < 2 seconds
- **Progress Update Frequency**: 10 updates/second
- **Memory Usage**: < 200MB for 10GB file
- **Hash Computation**: ~10-30 seconds for 1GB file

---

## Browser Compatibility

### Minimum Requirements

- **Chrome**: 90+ (Recommended)
- **Firefox**: 88+
- **Safari**: 15+
- **Edge**: 90+

### Required APIs

- ✅ **Web Workers** - For non-blocking computation
- ✅ **File API** - Access files without uploading
- ✅ **File.slice()** - Read files in chunks (CRITICAL for 10GB support)
- ✅ **FileReader API** - Async chunk reading
- ✅ **crypto-js** - Streaming SHA256 hash computation (CRITICAL for 10GB)
- ✅ **Drag and Drop API** - Enhanced UX

### Can Browsers Really Handle 10GB Files?

**YES!** Here's the proof:

| Capability             | Browser Support                     | Max File Size | Notes                            |
| ---------------------- | ----------------------------------- | ------------- | -------------------------------- |
| **File API reference** | All modern browsers                 | Unlimited     | Just metadata, not loaded        |
| **file.slice()**       | Chrome 21+, Firefox 13+, Safari 10+ | Unlimited     | Creates sub-blob without copying |
| **Chunked reading**    | All modern browsers                 | Unlimited     | Only chunk loaded into memory    |
| **Memory required**    | Any browser with 500MB+ RAM         | N/A           | Only 64MB chunk + overhead       |

**Real-world examples**:

- Google Drive web - Uploads multi-GB files using chunking
- Dropbox web - Same chunked approach
- YouTube - Uploads large videos without full memory load

**The trick**: You're not loading the file, you're reading it like a book - one page (chunk) at a time.

### Primary Approach: crypto-js

**Why crypto-js is the main choice:**

```typescript
import CryptoJS from "crypto-js";

const computeHash = async (file: File, onProgress: (p: number) => void) => {
  // Primary: crypto-js with streaming support
  const hash = CryptoJS.algo.SHA256.create();
  let offset = 0;

  while (offset < file.size) {
    const chunk = file.slice(offset, offset + CHUNK_SIZE);
    const buffer = await chunk.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(buffer);

    hash.update(wordArray); // ✅ Incremental update (streaming)

    offset += CHUNK_SIZE;
    onProgress((offset / file.size) * 100);
  }

  return hash.finalize().toString(CryptoJS.enc.Hex);
};
```

**Key Advantage**: crypto-js supports **incremental hash updates** (`.update()` method), which is essential for processing 10GB files without loading them entirely into memory. The Web Crypto API lacks this capability.

---

## Deployment

### Build Configuration

```bash
# Production build
pnpm build

# Preview build locally
pnpm preview

# Deploy to Vercel (example)
vercel deploy --prod
```

### Hosting Options

1. **Vercel** (Recommended) - Zero config, great for React apps
2. **Netlify** - Easy drag & drop deployment
3. **GitHub Pages** - Free hosting for static sites
4. **AWS S3 + CloudFront** - Enterprise option

### Environment Variables

None required for this project (purely client-side)

---

## Security Considerations

### Client-Side Security

1. **File Validation**

   - Enforce 10GB limit
   - Validate file exists before processing
   - Handle file access errors gracefully

2. **Memory Safety**

   - Process files in chunks
   - Clear buffers after use
   - Terminate workers properly

3. **Error Handling**
   - Don't expose system paths
   - Sanitize error messages
   - Log errors for debugging

### Data Privacy

- All processing happens client-side
- No data sent to servers
- No telemetry or analytics (unless explicitly added)
- No local storage of sensitive data

---

## Success Criteria

### Must Have (Core Requirements)

- ✅ Non-blocking UI during hash computation
- ✅ File description input (500 char limit)
- ✅ Hash displayed in green
- ✅ Error messages in blue with retry
- ✅ Supports files up to 10GB
- ✅ Clean, maintainable code
- ✅ Strict TypeScript types

### Should Have (Bonus)

- ✅ Progress bar with accurate percentage
- ✅ Unit tests for components
- ✅ Copy to clipboard functionality
- ✅ Drag & drop file upload

### Nice to Have (If Time Permits)

- ⭕ Multiple hash algorithm support
- ⭕ File history
- ⭕ Dark mode
- ⭕ Accessibility features
- ⭕ PWA capabilities

---

## Presentation Points (for Technical Interview)

### Architecture Decisions

1. **Why Web Workers?**

   - Prevents UI freezing during long computations
   - Better user experience
   - Can process files while user interacts

2. **Why crypto-js as primary choice?**

   - **Streaming support**: crypto-js provides `.create()`, `.update()`, `.finalize()` for incremental hashing
   - **Memory efficient**: Process 10GB files with only 64MB in memory at a time
   - **Web Crypto API limitation**: `crypto.subtle.digest()` requires entire file in memory (not suitable for 10GB)
   - **Production-ready**: Used by major platforms for client-side hashing

3. **Why Vite over Create React App?**
   - Faster dev server
   - Better TypeScript support
   - Modern bundling with esbuild

### Tradeoffs Made

1. **Limited browser support** → Focus on modern browsers
2. **No backend** → All processing client-side
3. **Single file only** → Could add queue for multiple files
4. **No persistence** → Could add IndexedDB storage

### Future Improvements

1. Multiple file support with queue system
2. More hash algorithms (MD5, SHA1, SHA512)
3. File comparison feature
4. History of computed hashes
5. WebAssembly for faster computation
6. Offline PWA support

---

## Conclusion

This specification provides a complete blueprint for implementing the ReversingLabs SHA256 file hasher. The focus is on:

- **Performance**: Web Workers + chunked processing
- **User Experience**: Non-blocking UI + progress feedback
- **Code Quality**: TypeScript strict mode + clean architecture
- **Maintainability**: Component-based design + documentation

Estimated completion time: **8-9 hours** for core + bonus features.
