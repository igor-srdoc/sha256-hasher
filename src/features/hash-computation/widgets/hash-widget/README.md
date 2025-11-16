# HashWidget - Isolated Zustand Instance Pattern

## Overview

The `HashWidget` is a fully self-contained, reusable component that demonstrates the **Isolated Zustand Instance Pattern** - each widget has its own independent state and Web Worker, enabling multiple widgets on the same page.

## Architecture

### Key Components

```
widgets/hash-widget/
├── hash-widget.tsx                   # Main widget component (entry point)
├── hash-computation.types.ts         # TypeScript types
├── hash-computation.const.ts         # Constants
├── state/                            # State management
│   ├── hash.state.ts                # Original global store (for tests)
│   ├── hash-widget.store.ts         # Zustand store factory
│   └── hash-widget.context.tsx      # Internal context provider
├── ui/                               # Widget-specific UI components
│   ├── compute-button.tsx
│   ├── cancel-button.tsx
│   ├── file-uploader.tsx
│   ├── description-input.tsx
│   ├── progress-bar.tsx
│   ├── results-display.tsx
│   └── error-display.tsx
├── utils/                            # Utility functions
│   ├── format-bytes.ts
│   └── validate-file.ts
├── workers/                          # Web Workers
│   ├── hash.worker.ts
│   └── hash.worker.types.ts
└── hooks/                            # Custom hooks (legacy)
    └── use-hash-worker.ts
```

### How It Works

#### 1. **Store Factory** (`state/hash-widget.store.ts`)

Creates a new Zustand vanilla store instance per widget:

```typescript
export function createHashStore() {
  let worker: Worker | null = null;  // Encapsulated worker

  const store = createStore<HashState>((set, get) => ({
    // State
    file: null,
    status: "idle",
    // ...

    // Actions
    initWorker: () => {
      if (!worker) {
        worker = new Worker(...);
        // Setup message handlers
      }
      return worker;
    },

    cancel: () => {
      worker?.terminate();
      worker = null;
      set({ status: "idle", ... });
    },
  }));

  return store;
}
```

**Key Insight**: Each store has its **own** `worker` variable in closure scope, ensuring complete isolation.

#### 2. **Internal Context Provider** (`state/hash-widget.context.tsx`)

Provides the store instance only within the widget:

```typescript
export function HashWidgetProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<HashStore>();

  if (!storeRef.current) {
    storeRef.current = createHashStore(); // Create once per widget
  }

  useEffect(() => {
    return () => {
      storeRef.current?.getState().cleanupWorker?.(); // Cleanup on unmount
    };
  }, []);

  return (
    <HashWidgetContext.Provider value={storeRef.current}>
      {children}
    </HashWidgetContext.Provider>
  );
}
```

**Key Insight**: Context is used **internally** - consumers never see it!

#### 3. **Widget Component** (`hash-widget.tsx`)

Self-contained component that wraps everything:

```typescript
import { HashWidgetProvider } from "./state/hash-widget.context";
import { FileUploader } from "./ui/file-uploader";
// ... other imports

export function HashWidget() {
  return (
    <HashWidgetProvider>
      {" "}
      {/* Context only here */}
      <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
        <FileUploader />
        <DescriptionInput />
        {/* ... more components */}
      </div>
    </HashWidgetProvider>
  );
}
```

**Key Insight**: Provider is **inside** the widget - consumers just use `<HashWidget />`!

#### 4. **UI Components** (e.g., `compute-button.tsx`)

Access the widget's store via custom hooks from the context:

```typescript
import { useHashWidgetStore, useHashWidgetActions } from "../state/hash-widget.context";

export function ComputeButton() {
  const file = useHashWidgetStore((state) => state.file);
  const status = useHashWidgetStore((state) => state.status);
  const { setStatus, initWorker } = useHashWidgetActions();

  const handleCompute = () => {
    const worker = initWorker!();  // Get THIS widget's worker
    worker.postMessage({ type: "COMPUTE_HASH", file, ... });
  };

  return <Button onClick={handleCompute}>Compute Hash</Button>;
}
```

**Key Insight**: Each component accesses **only its widget's store** - complete isolation!

## Usage

### Single Widget

```tsx
import { HashWidget } from "@/features/hash-computation/widgets/hash-widget/hash-widget";

function MyPage() {
  return (
    <div>
      <h1>SHA256 Hasher</h1>
      <HashWidget />
    </div>
  );
}
```

### Multiple Independent Widgets

```tsx
import { HashWidget } from "@/features/hash-computation/widgets/hash-widget/hash-widget";

function MultiHashPage() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h2>Widget 1</h2>
        <HashWidget /> {/* Own state + worker */}
      </div>
      <div>
        <h2>Widget 2</h2>
        <HashWidget /> {/* Completely independent! */}
      </div>
    </div>
  );
}
```

**Each widget:**

- ✅ Has its own isolated state
- ✅ Has its own Web Worker
- ✅ Operates completely independently
- ✅ No global state pollution
- ✅ No provider wrapping required by consumers

## Benefits

### 1. **Zero Configuration for Consumers**

```tsx
// ✅ Just import and use - no setup!
<HashWidget />

// ❌ No need for:
<HashProvider>
  <HashWidget />
</HashProvider>
```

### 2. **Complete Isolation**

```tsx
<HashWidget />  // Widget 1: Computing 5GB file at 50%
<HashWidget />  // Widget 2: Idle, different file selected
<HashWidget />  // Widget 3: Completed, showing results
```

Each operates independently - no shared state or workers!

### 3. **Proper Cleanup**

When a widget unmounts:

- Worker is terminated
- State is cleaned up
- No memory leaks

### 4. **Type Safety**

```typescript
// Full TypeScript support
const file = useHashWidgetStore((state) => state.file); // File | null
const { initWorker } = useHashWidgetActions(); // () => Worker
```

### 5. **No Provider Hell**

Developers can't forget to wrap components because the provider is **internal** to the widget.

## Comparison with Other Patterns

| Pattern                     | Pros                   | Cons                             |
| --------------------------- | ---------------------- | -------------------------------- |
| **Global Zustand**          | Simple                 | Can't have multiple instances    |
| **React Context**           | Standard               | Easy to forget provider wrapping |
| **Isolated Zustand** (this) | ✅ Best of both worlds | Slightly more complex setup      |

## How It Differs from Global Zustand

**Global Zustand** (original approach in `state/hash.state.ts`):

```typescript
// Single global store - still kept for backward compatibility with tests
export const useHashState = create<HashState>((set) => ({ ... }));

// Problem: All components share the SAME state
<HashWidget />  // All widgets share one worker!
<HashWidget />  // Can't have multiple instances
```

**Isolated Zustand** (this approach in `state/hash-widget.store.ts`):

```typescript
// Factory creates NEW store per widget
export function createHashStore() {
  let worker: Worker | null = null;  // Isolated per store

  return createStore<HashState>((set) => ({
    // ... state and actions
  }));
}

// Solution: Each widget gets its OWN store + worker
<HashWidget />  // Own store instance
<HashWidget />  // Different store instance
```

## Testing

### Unit Tests

Unit tests can use the original global store for simplicity:

```typescript
import { useHashState } from "../state/hash.state";

describe("Utility Functions", () => {
  it("formats bytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });
});
```

### Integration Tests (if needed)

For component tests that need state, you can wrap in `HashWidgetProvider`:

```typescript
import { HashWidgetProvider } from "../state/hash-widget.context";
import { render } from "@testing-library/react";

describe("ComputeButton", () => {
  it("renders", () => {
    render(
      <HashWidgetProvider>
        <ComputeButton />
      </HashWidgetProvider>
    );
  });
});
```

### E2E Tests

E2E tests work seamlessly because the widget is self-contained:

```typescript
test("handles file upload", async ({ page }) => {
  // Widget auto-initializes its own store
  await page.goto("/");
  await page.getByText(/Drop file here/).click();
  // ... interact with page
});
```

## Implementation Details

### Worker Management

Each store encapsulates its own worker in `state/hash-widget.store.ts`:

```typescript
export function createHashStore() {
  let worker: Worker | null = null; // Closure scope - isolated per store!

  return createStore<HashState>((set, get) => ({
    // ... state

    initWorker: () => {
      if (!worker) {
        worker = new Worker(
          new URL("../workers/hash.worker.ts", import.meta.url),
          { type: "module" }
        );
        worker.onmessage = (event) => {
          // Update THIS store only
          get().setProgress(event.data.progress);
        };
      }
      return worker;
    },

    cancel: () => {
      worker?.terminate(); // Terminate THIS worker only
      worker = null;
      set({ status: "idle", progress: 0, error: null });
    },

    cleanupWorker: () => {
      worker?.terminate();
      worker = null;
    },
  }));
}
```

### State Updates

Each widget's UI components only affect their own store:

```typescript
// In ComputeButton of Widget 1
const { initWorker } = useHashWidgetActions();  // Widget 1's actions

initWorker().postMessage(...);  // Only Widget 1's worker
```

Widget 2's worker is never affected!

## Future Enhancements

### Add Props for Configuration

```typescript
interface HashWidgetProps {
  maxFileSize?: number;
  allowedFileTypes?: string[];
  onComplete?: (hash: string) => void;
}

export function HashWidget({
  maxFileSize = 10 * GB,
  allowedFileTypes = ["*"],
  onComplete,
}: HashWidgetProps) {
  // Pass to store factory if needed
  return <HashWidgetProvider config={{ maxFileSize, ... }}>
    ...
  </HashWidgetProvider>;
}
```

### Support Different Hashing Algorithms

```typescript
<HashWidget algorithm="sha256" />
<HashWidget algorithm="md5" />
<HashWidget algorithm="sha512" />
```

### Theming

```typescript
<HashWidget theme="dark" />
<HashWidget theme="light" />
```

## Conclusion

The **Isolated Zustand Instance Pattern** gives us:

✅ **Zustand** power (simple, performant state management)
✅ **Context** isolation (each widget independent)
✅ **Zero setup** for consumers (just import and use)
✅ **Type safety** (full TypeScript support)
✅ **Scalability** (unlimited widgets per page)

Perfect for reusable components that need their own state! 🎉
