import { create } from "zustand";
interface PlayerState { sceneIndex: number; transitioning: boolean; muted: boolean; rsvpOpen: boolean; goTo: (index: number, count: number) => void; setTransitioning: (value: boolean) => void; toggleMuted: () => void; setRsvpOpen: (value: boolean) => void; reset: () => void }
export const usePlayer = create<PlayerState>((set) => ({
  sceneIndex: 0, transitioning: false, muted: true, rsvpOpen: false,
  goTo: (index, count) => set({ sceneIndex: Math.max(0, Math.min(count - 1, index)) }),
  setTransitioning: (transitioning) => set({ transitioning }), toggleMuted: () => set((state) => ({ muted: !state.muted })),
  setRsvpOpen: (rsvpOpen) => set({ rsvpOpen }), reset: () => set({ sceneIndex: 0, transitioning: false, muted: true, rsvpOpen: false }),
}));
