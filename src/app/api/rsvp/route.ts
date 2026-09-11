import { z } from "zod";
import { readInvitation, saveRsvp } from "@/server/storage";
import { readJson } from "@/server/request";
const schema = z.object({ invitationId: z.union([z.literal("demo"), z.uuid()]), name: z.string().trim().min(1).max(120), attendance: z.enum(["yes", "no"]), guests: z.number().int().min(1).max(5), message: z.string().max(1200).default("") });
export const runtime = "nodejs";
export async function POST(request: Request) {
  let data;
  try { data = schema.parse(await readJson(request, 8192)); } catch { return Response.json({ error: "Please check your name, attendance, and message." }, { status: 400 }); }
  try { if (data.invitationId !== "demo" && !await readInvitation(data.invitationId)) return Response.json({ error: "Invitation not found." }, { status: 404 }); await saveRsvp({ ...data, guests: data.attendance === "no" ? 0 : data.guests }); return Response.json({ received: true }, { status: 201 }); }
  catch (error) { console.error("RSVP storage failed", error); return Response.json({ error: "We could not save your response. Please try again." }, { status: 503 }); }
}
