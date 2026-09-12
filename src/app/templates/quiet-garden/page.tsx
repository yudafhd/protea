import type { Metadata } from "next";
import GrandHallInvitation from "@/components/grand-hall/GrandHallInvitation";

export const metadata: Metadata = {
  title: "Grand Hall — Protēa",
  description: "Undangan portrait 3D dengan satu karakter di hall gothic bercahaya lentera.",
};

export default function QuietGardenPage() {
  return <GrandHallInvitation />;
}
