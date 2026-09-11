import type { Metadata } from "next";
import InvitationPlayer from "@/components/player/InvitationPlayer";
import { getTemplate } from "@/templates/registry";

export const metadata: Metadata = {
  title: "Modern Vow — Protēa Undangan Pernikahan",
  description: "Tipografi modern dan tata letak editorial kontemporer untuk perayaan pernikahan intim yang elegan.",
};

export default async function MinimalPage() {
  const experience = await getTemplate("minimal");
  return <InvitationPlayer experience={experience} comparison />;
}
