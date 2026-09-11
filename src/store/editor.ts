import { create } from "zustand";
import type { WeddingExperience } from "@/schemas/experience";
interface EditorState { experience: WeddingExperience | null; dirty: boolean; setExperience: (experience: WeddingExperience, dirty?: boolean) => void; markSaved: () => void }
export const useEditor = create<EditorState>((set) => ({ experience: null, dirty: false, setExperience: (experience, dirty = true) => set({ experience, dirty }), markSaved: () => set({ dirty: false }) }));
