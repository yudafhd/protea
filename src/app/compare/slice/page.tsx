import InvitationPlayer from "@/components/player/InvitationPlayer";
import { getCinematicTemplate } from "@/templates/registry";
export default async function SlicePage() { return <InvitationPlayer experience={await getCinematicTemplate()} comparison />; }
