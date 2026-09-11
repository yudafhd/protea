"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { WeddingExperience } from "@/schemas/experience";
import { readDraft } from "@/utils/documents";
import InvitationPlayer from "./InvitationPlayer";
export default function DraftPreview() {
  const [experience, setExperience] = useState<WeddingExperience | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { try { setExperience(readDraft()); } finally { setLoaded(true); } }, []);
  if (!experience) return <div className="empty-state"><h1>{loaded ? "Your story starts here." : "Opening your preview…"}</h1><p>{loaded ? "Save a draft in the editor to preview your invitation." : ""}</p><Link href="/edit" className="primary-button">Open the editor</Link></div>;
  return <InvitationPlayer experience={experience} />;
}
