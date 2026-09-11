import type { Metadata } from "next";
import InvitationPlayer from "@/components/player/InvitationPlayer";
import { getCinematicTemplate } from "@/templates/registry";

export const metadata: Metadata = {
  title: "Botanical Reverie — Protēa Undangan Pernikahan",
  description: "A continuous illustrated journey: a letter, two souls, and a forever. Undangan pernikahan berestetika botani romantis.",
};

export default async function BotanicalPage() {
  const experience = await getCinematicTemplate();
  return <InvitationPlayer experience={experience} comparison />;
}
