import type { InvitationContent } from "@/schemas/experience";

export function resolveBinding(content: InvitationContent, path?: string, fallback = ""): string {
  if (!path) return fallback;
  if (path === "couple.names") return `${content.couple.groom} & ${content.couple.bride}`;
  let value: unknown = content;
  for (const key of path.split(".")) {
    if (["__proto__", "constructor", "prototype"].includes(key)) return fallback;
    if (typeof value !== "object" || value === null || !Object.hasOwn(value, key)) return fallback;
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}
export function safeUrl(value: string): string | undefined {
  if (/^\/(?!\/)/.test(value) || /^data:image\/(webp|png|jpeg|avif);base64,/.test(value)) return value;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined; } catch { return undefined; }
}
