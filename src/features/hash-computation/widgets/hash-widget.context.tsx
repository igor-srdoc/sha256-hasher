import { createContext, useContext, useRef, useEffect, type ReactNode } from "react";
import { useStore } from "zustand";
import { createHashStore, type HashStore } from "./hash-widget.store";
import type { HashState } from "../hash-computation.types";

/**
 * Internal context for HashWidget - NOT exposed to consumers.
 * This ensures the store is shared only within a single widget instance.
 */
const HashWidgetContext = createContext<HashStore | null>(null);

/**
 * Provider component - used ONLY internally by HashWidget.
 * Creates an isolated store instance for this widget.
 */
export function HashWidgetProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<HashStore>();

  if (!storeRef.current) {
    storeRef.current = createHashStore();
  }

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      const state = storeRef.current?.getState();
      state?.cleanupWorker?.();
    };
  }, []);

  return (
    <HashWidgetContext.Provider value={storeRef.current}>
      {children}
    </HashWidgetContext.Provider>
  );
}

/**
 * Hook to access this widget's store.
 * Can only be used within HashWidget components.
 */
export function useHashWidgetStore<T>(
  selector: (state: HashState) => T
): T {
  const store = useContext(HashWidgetContext);
  
  if (!store) {
    throw new Error(
      "useHashWidgetStore must be used within HashWidget. " +
      "This is an internal error - HashWidget should provide its own context."
    );
  }

  return useStore(store, selector);
}

/**
 * Hook to access the full store (for actions).
 */
export function useHashWidgetActions() {
  const store = useContext(HashWidgetContext);
  
  if (!store) {
    throw new Error(
      "useHashWidgetActions must be used within HashWidget. " +
      "This is an internal error - HashWidget should provide its own context."
    );
  }

  return store.getState();
}

