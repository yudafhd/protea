export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new Error("Request origin is not allowed.");
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("Expected JSON.");
  const reader = request.body?.getReader(); if (!reader) throw new Error("Request body is empty.");
  const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new Error("The document is too large."); } chunks.push(value); } } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
