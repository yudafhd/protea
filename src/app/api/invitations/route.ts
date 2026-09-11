import { parseExperience } from "@/schemas/experience";
import { publishInvitation } from "@/server/storage";
import { readJson } from "@/server/request";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let experience;
  try { experience = parseExperience(await readJson(request, 5 * 1024 * 1024)); } catch { return Response.json({ error: "Invalid invitation JSON (maximum 5 MB)." }, { status: 400 }); }
  try { const id = await publishInvitation(experience); return Response.json({ id, path: `/i/${id}` }, { status: 201 }); }
  catch (error) { console.error("Invitation storage failed", error); return Response.json({ error: "The invitation could not be saved. Please try again." }, { status: 503 }); }
}
