import type { Metadata, Viewport } from "next";
import GrandHallInvitation from "@/components/grand-hall/GrandHallInvitation";

export const metadata: Metadata = {
  title: "Grand Hall — Protēa",
  description: "Undangan portrait 3D dengan satu karakter di hall gothic bercahaya lentera.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function QuietGardenPage() {
  return <GrandHallInvitation />;
}
