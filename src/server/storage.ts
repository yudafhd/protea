import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseExperience, type WeddingExperience } from "@/schemas/experience";
const directory = process.env.PROTEA_DATA_DIR ?? path.join(process.cwd(), ".data");
export async function publishInvitation(experience: WeddingExperience) {
  const id = randomUUID(); await mkdir(path.join(directory, "invitations"), { recursive: true });
  await writeFile(path.join(directory, "invitations", `${id}.json`), JSON.stringify(parseExperience(experience)), { flag: "wx", mode: 0o600 }); return id;
}
export async function readInvitation(id: string): Promise<WeddingExperience | null> {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  try { return parseExperience(JSON.parse(await readFile(path.join(directory, "invitations", `${id}.json`), "utf8"))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function saveRsvp(value: unknown) { await mkdir(directory, { recursive: true }); await appendFile(path.join(directory, "rsvp.jsonl"), JSON.stringify({ id: randomUUID(), createdAt: new Date().toISOString(), ...value as object }) + "\n", { mode: 0o600 }); }
