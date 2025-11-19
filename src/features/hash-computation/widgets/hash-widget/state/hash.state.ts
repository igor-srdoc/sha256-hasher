import { create } from "zustand";
import type { HashState } from "../hash-computation.types";

export const useHashState = create<HashState>((set) => ({
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

  cancel: () =>
    set({
      status: "idle",
      progress: 0,
      error: null,
    }),
}));
