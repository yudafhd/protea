"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, ChevronDown, Flower2, Heart, SlidersHorizontal, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import type { WeddingExperience } from "@/schemas/experience";
import { usePlayer } from "@/store/player";
import { resolveBinding, safeUrl } from "@/utils/binding";
import { InteractionController } from "@/scene-engine/InteractionController";
import { useStoryProgress } from "@/store/story";
import { StoryProgress } from "./StoryProgress";
const SpatialCanvas = dynamic(() => import("@/scene-engine/SpatialCanvas"), { ssr: false, loading: () => <div className="world-loading"><Flower2 size={28} /><span>Unfolding a little world…</span></div> });
const RsvpForm = dynamic(() => import("./RsvpForm"), { ssr: false });
const StoryStage = dynamic(() => import("@/scene-engine/story/StoryStage"), { ssr: false, loading: () => <div className="world-loading"><Flower2 size={28} /><span>Unfolding a little world…</span></div> });

export default function InvitationPlayer({ experience, invitationId = "demo", comparison = false }: { experience: WeddingExperience; invitationId?: string; comparison?: boolean }) {
  const surface = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const { sceneIndex, muted, rsvpOpen, goTo, toggleMuted, setRsvpOpen } = usePlayer();
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [audioError, setAudioError] = useState("");
  const navigate = useCallback((index: number) => {
    const next = Math.max(0, Math.min(experience.scenes.length - 1, index));
    const distance = (surface.current?.parentElement?.offsetHeight ?? 0) - (surface.current?.offsetHeight ?? 0);
    const progress = experience.scenes[next].lifecycle?.anchor ?? next / Math.max(1, experience.scenes.length - 1);
    if (!experience.story) goTo(next, experience.scenes.length);
    window.scrollTo({ top: Math.max(0, distance) * progress, behavior: experience.story && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
    setChaptersOpen(false);
  }, [goTo, experience]);
  useEffect(() => { usePlayer.getState().reset(); useStoryProgress.getState().setProgress(0); window.scrollTo(0, 0); }, [experience.id]);
  useEffect(() => { if (!audio.current) return; audio.current.volume = experience.audio?.volume ?? 0.4; if (muted) audio.current.pause(); else void audio.current.play().catch(() => { setAudioError("Music could not play. Check the audio URL in Personalize."); if (!usePlayer.getState().muted) usePlayer.getState().toggleMuted(); }); }, [muted, experience.audio]);
  const interact = useCallback((id: string) => {
    const action = experience.interactions.find((item) => item.id === id);
    if (!action) return;
    const index = usePlayer.getState().sceneIndex;
    if (action.action === "next") navigate(index + 1);
    if (action.action === "previous") navigate(index - 1);
    if (action.action === "scene") navigate(experience.scenes.findIndex((scene) => scene.id === action.scene));
    if (action.action === "rsvp") setRsvpOpen(true);
    if (action.action === "url") { const url = safeUrl(resolveBinding(experience.content, action.bind)); if (url) window.open(url, "_blank", "noopener,noreferrer"); }
  }, [experience, navigate, setRsvpOpen]);
  const scene = experience.scenes[sceneIndex] ?? experience.scenes[0];
  const closeRsvp = useCallback(() => setRsvpOpen(false), [setRsvpOpen]);
  return <div className="experience-scroll portrait-experience" style={{ height: `${(experience.story?.scrollScreens ?? experience.scenes.length) * 100}svh` }}><main ref={surface} className={`invitation portrait-invitation${experience.story ? " cinematic-invitation" : ""}${experience.story?.world ? " woodland-invitation" : ""}`} style={{ "--paper": experience.theme.background, "--ink": experience.theme.foreground, "--olive": experience.theme.accent, "--muted": experience.theme.muted } as CSSProperties}>
    <header className="player-header"><Link className="wordmark" href="/" aria-label="Protea home"><Flower2 strokeWidth={1.15} /> protēa<span>INVITATIONS, REIMAGINED</span></Link><nav>{comparison ? <><Link href="/" className="comparison-link">← Katalog</Link><Link href="/templates/enchanted" className="comparison-link">Enchanted <Sparkles size={14} /></Link><Link href="/compare/before" className={`comparison-link${!experience.story ? " selected" : ""}`}>Classic</Link><Link href="/templates/woodland" className={`comparison-link${experience.story ? " selected" : ""}`}>Woodland <ArrowRight size={14} /></Link></> : <><Link href="/" className="comparison-link">← Katalog</Link><Link href="/edit" className="quiet-link"><SlidersHorizontal size={14} /> Personalize</Link><Link href="/studio" className="studio-link">Invitation studio <ArrowRight size={14} /></Link></>}</nav></header>
    <div className="world-heading"><span className="tiny-label">{experience.name.toUpperCase()}</span><span className="heading-rule" /><p>A love story, waiting to unfold.</p></div>
    <div className="spatial-world" aria-label={`Scene ${sceneIndex + 1}: ${scene.name}`}>{experience.story ? <StoryStage experience={experience} onInteraction={interact} /> : <SpatialCanvas experience={experience} sceneIndex={sceneIndex} onInteraction={interact} />}</div>
    <div className="scene-side-label"><span>{String(sceneIndex + 1).padStart(2, "0")}</span><span className="side-rule" /><span>{scene.name}</span></div>
    <aside className="chapter-dots" aria-label="Invitation chapters">{experience.scenes.map((item, index) => <button key={item.id} className={index === sceneIndex ? "active" : ""} onClick={() => navigate(index)} aria-label={`${index + 1}. ${item.name}`} aria-current={index === sceneIndex ? "step" : undefined}><span>{item.name}</span></button>)}</aside>
    <div className="invitation-action">
      {sceneIndex === 0 ? <><span className="guest-label">DEAR {experience.content.guest.name.toUpperCase()}</span><button className="primary-button" onClick={() => navigate(1)}>Open the invitation <ArrowRight size={16} /></button><p>Made with love. Best experienced with sound.</p></> : <><span className="guest-label" aria-live="polite">{scene.name}</span><div className="scene-actions"><button className="round-button" onClick={() => navigate(sceneIndex - 1)} aria-label="Previous scene"><ArrowLeft size={17} /></button>{scene.id === "rsvp" ? <button className="primary-button" onClick={() => setRsvpOpen(true)}>Count me in <Heart size={15} /></button> : scene.id === "venue" ? <button className="primary-button" onClick={() => interact("map")}>View location <ArrowRight size={15} /></button> : <button className="primary-button" onClick={() => navigate(sceneIndex + 1)}>Continue our story <ArrowRight size={15} /></button>}{sceneIndex < experience.scenes.length - 1 && <button className="round-button" onClick={() => navigate(sceneIndex + 1)} aria-label="Next scene"><ArrowRight size={17} /></button>}</div><p><ArrowDown size={11} /> Scroll or swipe to explore</p></>}
    </div>
    <footer className="player-footer"><div className="template-credit"><span className="live-dot" /> {experience.name}<span className="credit-separator">/</span><span>A spatial wedding experience</span></div><div className="footer-controls"><button className="chapter-toggle" onClick={() => setChaptersOpen(!chaptersOpen)} aria-expanded={chaptersOpen}>{String(sceneIndex + 1).padStart(2, "0")} <span>/ {String(experience.scenes.length).padStart(2, "0")}</span><ChevronDown size={13} /></button><span className="control-divider" /><button className="audio-button" onClick={() => { if (experience.audio?.src) { setAudioError(""); toggleMuted(); } else setAudioError("Add your favorite music in Personalize → Music."); }} aria-label={muted ? "Play music" : "Pause music"}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}<span>SOUND {muted ? "OFF" : "ON"}</span></button></div></footer>
    {experience.story ? <StoryProgress /> : <div className="scene-progress"><span style={{ width: `${((sceneIndex + 1) / experience.scenes.length) * 100}%` }} /></div>}
    {chaptersOpen && <div className="chapter-menu"><span className="tiny-label">EXPLORE THE STORY</span>{experience.scenes.map((item, index) => <button key={item.id} onClick={() => navigate(index)}><span>{String(index + 1).padStart(2, "0")}</span>{item.name}{index === sceneIndex && <Check size={13} />}</button>)}</div>}
    {audioError && <div className="toast" role="status">{audioError}<button onClick={() => setAudioError("")} aria-label="Dismiss"><X size={14} /></button></div>}
    {experience.audio?.src && <audio ref={audio} src={safeUrl(experience.audio.src)} loop preload="none" />}
    <InteractionController surface={surface} count={experience.scenes.length} onNavigate={navigate} experience={experience} />
    {rsvpOpen && <RsvpForm invitationId={invitationId} onClose={closeRsvp} />}
  </main></div>;
}
