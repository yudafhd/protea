"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MapPin, X } from "lucide-react";
import { MathUtils } from "three";
import { STOPS, type HallPoint } from "./config";
import "../quiet-garden/quiet-garden.css";
import "./grand-hall.css";

const World = dynamic(() => import("./GrandHallWorld"), { ssr: false });
const stops = [
  { title: "Sebuah Perayaan", body: "Dengan penuh sukacita, Laras mengundang Anda untuk hadir dan menjadi bagian dari hari yang istimewa." },
  { title: "Sabtu, 12 Desember 2026", body: "Pukul 16.00 WIB · Perayaan di Grand Hall dilanjutkan dengan jamuan makan malam." },
  { title: "The Sage House", body: "Jl. Taman Teduh No. 12, Bandung. Kehadiran dan doa baik Anda adalah hadiah terindah." },
];
const movementKeys = ["w", "a", "s", "d", "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];

export default function GrandHallInvitation() {
  const [started, setStarted] = useState(false);
  const [position, setPosition] = useState<HallPoint>({ x: 0, z: 5 });
  const [moving, setMoving] = useState(false);
  const [visited, setVisited] = useState<number[]>([]);
  const [open, setOpen] = useState<number>();
  const [reduced, setReduced] = useState(false);
  const current = useRef(position);
  const target = useRef<HallPoint | null>(null);
  const keys = useRef(new Set<string>());
  const yaw = useRef(Math.PI);
  const pitch = useRef(0.08);
  const suppressed = useRef<number | undefined>(undefined);
  const gesture = useRef({ x: 0, y: 0, lastX: 0, lastY: 0, id: -1, active: false, dragged: false });
  const paused = !started || open !== undefined;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(motion.matches); update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (paused || event.ctrlKey || event.metaKey || event.altKey) return;
      if (movementKeys.includes(event.key)) { event.preventDefault(); keys.current.add(event.key); target.current = null; }
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key);
    const clear = () => { keys.current.clear(); target.current = null; setMoving(false); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); };
  }, [paused]);

  useEffect(() => {
    if (paused) { setMoving(false); return; }
    let frame = 0, last = 0;
    const tick = (time: number) => {
      const dt = last ? Math.min((time - last) / 1000, 0.05) : 0; last = time;
      const pressed = keys.current;
      const strafe = Number(pressed.has("d") || pressed.has("ArrowRight")) - Number(pressed.has("a") || pressed.has("ArrowLeft"));
      const forward = Number(pressed.has("w") || pressed.has("ArrowUp")) - Number(pressed.has("s") || pressed.has("ArrowDown"));
      const point = current.current;
      let dx = Math.sin(yaw.current) * forward + Math.cos(yaw.current) * strafe;
      let dz = Math.cos(yaw.current) * forward - Math.sin(yaw.current) * strafe;
      if (!dx && !dz && target.current) { dx = target.current.x - point.x; dz = target.current.z - point.z; }
      const length = Math.hypot(dx, dz);
      const distance = Math.min(length, 4 * dt);
      const next = length ? {
        x: MathUtils.clamp(point.x + dx / length * distance, -1.3, 1.3),
        z: MathUtils.clamp(point.z + dz / length * distance, -23.8, 5.5),
      } : point;
      const walking = Math.hypot(next.x - point.x, next.z - point.z) > 0.001;
      setMoving(walking);
      if (walking) { current.current = next; setPosition(next); }
      if (target.current && Math.hypot(next.x - target.current.x, next.z - target.current.z) < 0.12) target.current = null;
      const near = STOPS.findIndex(stop => Math.hypot(next.x - stop.x, next.z - stop.z) < 0.85);
      if (near < 0) suppressed.current = undefined;
      else if (suppressed.current !== near) {
        suppressed.current = near; target.current = null; keys.current.clear();
        setVisited(value => value.includes(near) ? value : [...value, near]); setOpen(near);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  const walkTo = (point: HallPoint) => { if (!paused && !gesture.current.dragged) target.current = point; };
  const press = (key: string) => { if (!paused) { keys.current.add(key); target.current = null; } };

  return (
    <main className="qg-page">
      <section className={`qg-frame ${started ? "is-started" : ""}`} aria-label="Undangan interaktif Grand Hall"
        onPointerDownCapture={event => { if (!paused) gesture.current = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, id: event.pointerId, active: true, dragged: false }; }}
        onPointerMoveCapture={event => { const g = gesture.current; if (!g.active || g.id !== event.pointerId || paused) return; if (Math.hypot(event.clientX - g.x, event.clientY - g.y) > 7) g.dragged = true; if (g.dragged) { yaw.current -= (event.clientX - g.lastX) * 0.006; pitch.current = MathUtils.clamp(pitch.current + (event.clientY - g.lastY) * 0.004, -0.6, 1.3); } g.lastX = event.clientX; g.lastY = event.clientY; }}
        onPointerUpCapture={event => { if (gesture.current.id === event.pointerId) gesture.current.active = false; }}
        onPointerCancel={() => { gesture.current.active = false; gesture.current.dragged = true; }}>
        <World position={position} moving={moving} visited={visited} onWalk={walkTo} yaw={yaw} pitch={pitch} reduced={reduced} />
        <div className="qg-shade" />
        <header className="qg-header"><span>GRAND HALL</span><strong>Laras</strong><small>12 · 12 · 2026</small></header>

        {!started && <div className="qg-cover"><p>YOU ARE INVITED TO</p><h1>A grand<br/><i>celebration</i></h1><span>Susuri cahaya lentera dan temukan undangan</span><button onClick={() => setStarted(true)}>Mulai perjalanan <ChevronRight size={17} /></button></div>}

        {started && <><div className="qg-crosshair" aria-hidden="true"/><nav className="qg-stops" aria-label="Titik undangan">{stops.map((stop, index) => <button key={stop.title} aria-label={stop.title} onClick={() => { gesture.current.dragged = false; target.current = STOPS[index]; }}>{visited.includes(index) ? <Check size={14} /> : index + 1}</button>)}</nav><div className="qg-dpad" aria-label="Kontrol berjalan">{[
          { key: "ArrowUp", label: "Maju", icon: ChevronUp, area: "up" }, { key: "ArrowLeft", label: "Kiri", icon: ChevronLeft, area: "left" }, { key: "ArrowDown", label: "Mundur", icon: ChevronDown, area: "down" }, { key: "ArrowRight", label: "Kanan", icon: ChevronRight, area: "right" },
        ].map(({ key, label, icon: Icon, area }) => <button key={key} className={area} aria-label={label} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); press(key); }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)}><Icon size={18}/></button>)}</div><p className="qg-hint">WASD / D-pad · geser layar untuk melihat</p></>}

        {open !== undefined && <div className="qg-dialog" role="dialog" aria-modal="true" aria-labelledby="qg-dialog-title"><button className="qg-close" onClick={() => setOpen(undefined)} aria-label="Tutup"><X size={18} /></button><span>KEPINGAN 0{open + 1}</span><h2 id="qg-dialog-title">{stops[open].title}</h2><p>{stops[open].body}</p>{open === 2 && <a href="https://maps.google.com" target="_blank" rel="noreferrer"><MapPin size={15} /> Lihat lokasi</a>}<button className="qg-continue" onClick={() => setOpen(undefined)}>Lanjutkan</button></div>}
      </section>
    </main>
  );
}
