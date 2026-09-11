import type { Metadata } from "next";
import InvitationPlayer from "@/components/player/InvitationPlayer";
import { getWoodlandTemplate } from "@/templates/registry";

export const metadata: Metadata = {
  title: "Woodland Reverie — Protēa Undangan Pernikahan",
  description: "Through the forest, into the garden, along the river, and beyond the clouds. Pengalaman undangan dongeng dengan kedalaman visual berlapis.",
};

export default async function WoodlandPage() {
  const experience = await getWoodlandTemplate();
  return <InvitationPlayer experience={experience} comparison />;
}
