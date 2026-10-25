export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const origin = request.headers.get("origin");
  // Next may expose the bound address (0.0.0.0) in request.url. The Host header
  // identifies the origin the browser actually contacted; never trust forwarded hosts.
  const expectedOrigin = new URL(request.url);
  const host = request.headers.get("host");
  if (host) expectedOrigin.host = host;
  if (origin && origin !== expectedOrigin.origin) throw new Error("Request origin is not allowed.");
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("Expected JSON.");
  const reader = request.body?.getReader(); if (!reader) throw new Error("Request body is empty.");
  const chunks: Uint8Array[] = []; let size = 0;
  try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new Error("The document is too large."); } chunks.push(value); } } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
