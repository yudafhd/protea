import { create } from "zustand";
export const useStoryProgress = create<{ progress: number; setProgress: (value: number) => void }>((set) => ({
  progress: 0,
  setProgress: (value) => { if (Number.isFinite(value)) set({ progress: Math.min(1, Math.max(0, value)) }); },
}));
