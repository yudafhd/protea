import { notFound } from "next/navigation";
import InvitationPlayer from "@/components/player/InvitationPlayer";
import { readInvitation } from "@/server/storage";
export const dynamic = "force-dynamic";
export default async function PublishedInvitation({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const experience = await readInvitation(id); if (!experience) notFound(); return <InvitationPlayer experience={experience} invitationId={id} />; }
