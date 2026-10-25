import { z } from 'zod';

const wishSchema = z.object({
  name: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1200),
});

export type WizardWish = z.infer<typeof wishSchema>;

export async function loadWizardWishes(source = process.env.WIZARD_WISHES_URL, fetcher: typeof fetch = fetch): Promise<{
  status: 'ready' | 'unconfigured'; wishes: WizardWish[];
}> {
  if (!source?.trim()) return { status: 'unconfigured', wishes: [] };
  const url = new URL(source.trim());
  if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname) || url.username || url.password) {
    throw new Error('Expected an Apps Script deployment URL.');
  }
  const response = await fetcher(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Could not read Google Form wishes.');
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('wishes' in payload) || !Array.isArray(payload.wishes)) {
    throw new Error('Unexpected wishes response.');
  }
  // Keep only public names/messages, even if the upstream feed includes other answers.
  const wishes = payload.wishes.slice(0, 100).flatMap((entry: unknown) => {
    const result = wishSchema.safeParse(entry);
    return result.success ? [result.data] : [];
  });
  return { status: 'ready', wishes };
}
