import { parseExperience, type WeddingExperience } from "@/schemas/experience";
export const DRAFT_KEY = "protea:invitation:v1";
export function saveDraft(experience: WeddingExperience) { localStorage.setItem(DRAFT_KEY, JSON.stringify(parseExperience(experience))); }
export function readDraft(): WeddingExperience | null { const raw = localStorage.getItem(DRAFT_KEY); return raw ? parseExperience(JSON.parse(raw)) : null; }
export function downloadJson(experience: WeddingExperience) {
  const blob = new Blob([JSON.stringify(parseExperience(experience), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${experience.id}-invitation.json`; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function importJson(file: File): Promise<WeddingExperience> { if (file.size > 5 * 1024 * 1024) throw new Error("JSON must be smaller than 5 MB."); return parseExperience(JSON.parse(await file.text())); }
