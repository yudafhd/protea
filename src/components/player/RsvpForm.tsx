"use client";
import { useState, type FormEvent } from "react";
import { Check, Flower2, Heart } from "lucide-react";
import { Dialog } from "@/components/Dialog";
export default function RsvpForm({ invitationId, onClose }: { invitationId: string; onClose: () => void }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setStatus("saving"); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try { const response = await fetch("/api/rsvp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, guests: Number(values.guests), invitationId }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error ?? "Could not send your response."); setStatus("saved"); }
    catch (error) { setError(error instanceof Error ? error.message : "Please try again."); setStatus("idle"); }
  }
  return <Dialog titleId="rsvp-title" onClose={onClose}><Flower2 size={28} /><span className="tiny-label">{invitationId === "demo" ? "DEMO INVITATION · RSVP" : "WITH LOVE, PLEASE REPLY"}</span><h2 id="rsvp-title">{status === "saved" ? "Thank you, with love." : "We saved you a seat."}</h2>{status === "saved" ? <><p>Your response has been received{invitationId === "demo" ? " for this demo invitation" : ""}. Thank you for being part of our story.</p><button className="primary-button" onClick={onClose}>Back to the story <Check size={16} /></button></> : <form onSubmit={submit}><label>Your name<input name="name" required maxLength={120} autoComplete="name" /></label><div className="form-row"><label>Will you be joining?<select name="attendance"><option value="yes">Joyfully accepts</option><option value="no">Regretfully declines</option></select></label><label>Number of guests<select name="guests">{[1, 2, 3, 4, 5].map((number) => <option key={number}>{number}</option>)}</select></label></div><label>A little wish for us<textarea name="message" maxLength={1200} rows={3} /></label>{error && <p className="error" role="alert">{error}</p>}<button className="primary-button" disabled={status === "saving"}>{status === "saving" ? "Sending your wishes…" : "Send with love"}<Heart size={15} /></button></form>}</Dialog>;
}
