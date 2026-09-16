"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MapPin, Maximize2, Minimize2, X } from "lucide-react";
import { MathUtils } from "three";
import { STOPS, type HallPoint } from "./config";
import { HallPhysics } from "./physics";
import "../quiet-garden/quiet-garden.css";
import "./grand-hall.css";

const World = dynamic(() => import("./GrandHallWorld"), { ssr: false });

function ModelLoader() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!active && progress === 100) {
      const timer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#090f19",
        zIndex: 25,
        color: "#f4dfb2",
        pointerEvents: "none",
        transition: "opacity 0.5s ease",
        opacity: active || progress < 100 ? 1 : 0,
      }}
    >
      <span style={{ fontSize: "11px", letterSpacing: "0.25em", marginBottom: "14px", opacity: 0.85 }}>
        MEMUAT GRAND HALL…
      </span>
      <div
        style={{
          width: "180px",
          height: "3px",
          background: "rgba(244, 223, 178, 0.2)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.round(progress)}%`,
            height: "100%",
            background: "#f4dfb2",
            transition: "width 0.2s ease",
          }}
        />
      </div>
      <small style={{ marginTop: "8px", fontSize: "10px", opacity: 0.6 }}>{Math.round(progress)}%</small>
    </div>
  );
}

const stops = [
  { title: "Sebuah Perayaan", body: "Dengan penuh sukacita, Yuda & Putri mengundang Anda untuk hadir dan menjadi bagian dari hari yang istimewa." },
  { title: "Sabtu, 12 Desember 2026", body: "Pukul 16.00 WIB · Perayaan di Grand Hall dilanjutkan dengan jamuan makan malam." },
  { title: "The Sage House", body: "Jl. Taman Teduh No. 12, Bandung. Kehadiran dan doa baik Anda adalah hadiah terindah." },
];
const movementKeys = [
  "w", "a", "s", "d",
  "ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight",
  " ", "Shift", "e", "q", "PageUp", "PageDown"
];

const INTRO_MOTES = [
  { id: 1, left: "22%", top: "72%", size: 4, dur: 4.2, delay: 0.1, drift: -22 },
  { id: 2, left: "74%", top: "68%", size: 3, dur: 3.8, delay: 0.7, drift: 24 },
  { id: 3, left: "33%", top: "78%", size: 5, dur: 5.0, delay: 0.4, drift: 16 },
  { id: 4, left: "62%", top: "74%", size: 4, dur: 4.6, delay: 1.1, drift: -18 },
  { id: 5, left: "48%", top: "82%", size: 6, dur: 5.4, delay: 0.2, drift: 12 },
  { id: 6, left: "26%", top: "62%", size: 3, dur: 3.5, delay: 1.4, drift: -20 },
  { id: 7, left: "80%", top: "60%", size: 4, dur: 4.1, delay: 0.9, drift: 22 },
  { id: 8, left: "16%", top: "76%", size: 5, dur: 4.7, delay: 1.6, drift: 28 },
  { id: 9, left: "42%", top: "64%", size: 3, dur: 3.9, delay: 1.9, drift: -12 },
  { id: 10, left: "67%", top: "80%", size: 4, dur: 4.9, delay: 0.5, drift: 16 },
  { id: 11, left: "86%", top: "70%", size: 3, dur: 4.3, delay: 1.2, drift: -18 },
  { id: 12, left: "36%", top: "86%", size: 5, dur: 5.2, delay: 1.5, drift: 14 },
];

function FantasyWeddingIntro({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"entering" | "visible" | "fading">("entering");
  const dismissed = useRef(false);

  useEffect(() => {
    const tEnter = setTimeout(() => {
      if (!dismissed.current) setPhase("visible");
    }, 1400);

    return () => {
      clearTimeout(tEnter);
    };
  }, []);

  const handleDismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    setPhase("fading");
    setTimeout(onFinish, 1050);
  };

  return (
    <div
      className={`magic-intro-overlay is-${phase}`}
      onClick={handleDismiss}
      onPointerDown={(e) => {
        e.stopPropagation();
        handleDismiss();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleDismiss();
        }
      }}
      aria-label="Selamat Datang di Wedding Yuda & Putri — Sentuh layar untuk membuka"
    >
      <div className="magic-intro-aura" />

      <div className="magic-rune-wrap" aria-hidden="true">
        <svg className="magic-rune-svg" viewBox="0 0 400 400" fill="none">
          <g className="magic-ring-outer">
            <circle cx="200" cy="200" r="190" stroke="rgba(244, 223, 178, 0.28)" strokeWidth="1" strokeDasharray="3 7" />
            <circle cx="200" cy="200" r="176" stroke="rgba(244, 223, 178, 0.45)" strokeWidth="1.5" />
            <polygon points="200,24 235,165 376,200 235,235 200,376 165,235 24,200 165,165" stroke="rgba(244, 223, 178, 0.25)" strokeWidth="1" fill="none" />
            <polygon points="200,38 314,86 362,200 314,314 200,362 86,314 38,200 86,86" stroke="rgba(212, 175, 55, 0.22)" strokeWidth="1" strokeDasharray="6 6" fill="none" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const cx = 200 + 176 * Math.cos(rad);
              const cy = 200 + 176 * Math.sin(rad);
              return (
                <g key={deg} transform={`translate(${cx}, ${cy})`}>
                  <circle r="3.5" fill="#f4dfb2" />
                  <circle r="6" stroke="rgba(244, 223, 178, 0.5)" strokeWidth="1" />
                </g>
              );
            })}
          </g>

          <g className="magic-ring-inner">
            <circle cx="200" cy="200" r="138" stroke="rgba(244, 223, 178, 0.5)" strokeWidth="1.5" strokeDasharray="14 7" />
            <circle cx="200" cy="200" r="118" stroke="rgba(212, 175, 55, 0.35)" strokeWidth="1" />
            <path d="M200 82 L204 196 L318 200 L204 204 L200 318 L196 204 L82 200 L196 196 Z" fill="rgba(244, 223, 178, 0.1)" stroke="rgba(244, 223, 178, 0.55)" strokeWidth="1" />
            <circle cx="200" cy="200" r="76" stroke="rgba(244, 223, 178, 0.35)" strokeWidth="1" strokeDasharray="4 4" />
          </g>
        </svg>
      </div>

      <div className="magic-motes" aria-hidden="true">
        {INTRO_MOTES.map((m) => (
          <span
            key={m.id}
            className="magic-mote"
            style={
              {
                left: m.left,
                top: m.top,
                width: `${m.size}px`,
                height: `${m.size}px`,
                "--mote-dur": `${m.dur}s`,
                "--mote-delay": `${m.delay}s`,
                "--mote-drift": `${m.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="magic-intro-content">
        <div className="magic-crest">
          <span className="crest-spark">✧</span>
          <span className="crest-center">✦</span>
          <span className="crest-spark">✧</span>
        </div>

        <p className="magic-subtitle">SELAMAT DATANG DI WEDDING</p>

        <h1 className="magic-title">
          <span className="magic-title-text">Yuda &amp; Putri</span>
        </h1>

        <div className="magic-divider">
          <span className="divider-line" />
          <span className="divider-badge">✦ THE GRAND HALL ✦</span>
          <span className="divider-line" />
        </div>

        <small className="magic-date">12 · 12 · 2026</small>

        <div className="magic-skip-hint">
          <span>✦</span>
          <span>Sentuh layar untuk membuka</span>
          <span>✦</span>
        </div>
      </div>
    </div>
  );
}

export default function GrandHallInvitation() {
  const [physics] = useState(() => new HallPhysics());
  const [introFinished, setIntroFinished] = useState(false);
  const [position, setPosition] = useState<HallPoint>({ x: 0, y: 0, z: 5.5 });
  const [moving, setMoving] = useState(false);
  const [visited, setVisited] = useState<number[]>([]);
  const [open, setOpen] = useState<number>();
  const [reduced, setReduced] = useState(false);
  const current = useRef(position);
  const target = useRef<HallPoint | null>(null);
  const keys = useRef(new Set<string>());
  const yaw = useRef(Math.PI);
  const pitch = useRef(-0.08);
  const fov = useRef(76);
  const suppressed = useRef<number | undefined>(undefined);
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number }>());
  const pinchDistance = useRef<number | null>(null);
  const dragged = useRef(false);
  const paused = !introFinished || open !== undefined;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as unknown as {
        fullscreenElement?: Element;
        webkitFullscreenElement?: Element;
      };
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const doc = document as unknown as {
      fullscreenElement?: Element;
      webkitFullscreenElement?: Element;
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };

    const isFull = Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
    const canFullscreen = Boolean(el.requestFullscreen || el.webkitRequestFullscreen);

    if (!canFullscreen) {
      setIosHint(true);
      setTimeout(() => setIosHint(false), 4500);
      return;
    }

    if (!isFull) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          setIosHint(true);
          setTimeout(() => setIosHint(false), 4500);
        });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(motion.matches); update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const prevent = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", prevent, { passive: false });
    document.addEventListener("gesturechange", prevent, { passive: false });
    document.addEventListener("gestureend", prevent, { passive: false });

    const prevOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
      document.removeEventListener("gestureend", prevent);
      document.body.style.overscrollBehavior = prevOverscroll;
      document.documentElement.style.overscrollBehavior = "";
    };
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
      physics.step(dt, reduced);
      const pressed = keys.current;
      const strafe = Number(pressed.has("d") || pressed.has("ArrowRight")) - Number(pressed.has("a") || pressed.has("ArrowLeft"));
      const forward = Number(pressed.has("w") || pressed.has("ArrowUp")) - Number(pressed.has("s") || pressed.has("ArrowDown"));
      const vertical = Number(pressed.has(" ") || pressed.has("e") || pressed.has("PageUp")) - Number(pressed.has("Shift") || pressed.has("q") || pressed.has("PageDown"));
      const point = current.current;
      let dx = Math.sin(yaw.current) * forward - Math.cos(yaw.current) * strafe;
      let dz = Math.cos(yaw.current) * forward + Math.sin(yaw.current) * strafe;
      let dy = vertical * 5.2 * dt;

      if (!dx && !dz && target.current) {
        dx = target.current.x - point.x;
        dz = target.current.z - point.z;
        if (target.current.y !== undefined) {
          const diffY = target.current.y - (point.y ?? 0);
          dy = Math.sign(diffY) * Math.min(Math.abs(diffY), 5.2 * dt);
        }
      }
      const length = Math.hypot(dx, dz);
      const distance = Math.min(length, 4 * dt);
      const currentY = point.y ?? 0;
      const nextY = MathUtils.clamp(currentY + dy, 0, 20.2);

      const next = physics.movePlayer(point, {
        x: length ? point.x + dx / length * distance : point.x,
        y: nextY,
        z: length ? point.z + dz / length * distance : point.z,
      });
      const walking = Math.hypot(next.x - point.x, next.z - point.z) > 0.00001 || Math.abs((next.y ?? 0) - currentY) > 0.00001;
      setMoving(walking);
      if (walking) { current.current = next; setPosition(next); }
      if (target.current && ((!walking && physics.ready && dt > 0) || (Math.hypot(next.x - target.current.x, next.z - target.current.z) < 0.12 && Math.abs((next.y ?? 0) - (target.current.y ?? currentY)) < 0.15))) target.current = null;
      const near = STOPS.findIndex(stop => Math.hypot(next.x - stop.x, next.z - stop.z) < 0.85 && (next.y ?? 0) < 1);
      if (near < 0) suppressed.current = undefined;
      else if (suppressed.current !== near) {
        suppressed.current = near; target.current = null; keys.current.clear();
        setVisited(value => value.includes(near) ? value : [...value, near]); setOpen(near);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused, physics, reduced]);

  const walkTo = (point: HallPoint) => { if (!paused && !dragged.current) target.current = point; };
  const press = (key: string) => { if (!paused) { keys.current.add(key); target.current = null; } };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (paused) return;
    if ((event.target as HTMLElement).closest("button, a")) return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
    });

    if (pointers.current.size === 1) {
      dragged.current = false;
    } else if (pointers.current.size === 2) {
      dragged.current = true;
      const [p1, p2] = Array.from(pointers.current.values());
      pinchDistance.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (paused || !pointers.current.has(event.pointerId)) return;
    const prev = pointers.current.get(event.pointerId)!;
    const currentPoint = {
      x: event.clientX,
      y: event.clientY,
      startX: prev.startX,
      startY: prev.startY,
    };
    pointers.current.set(event.pointerId, currentPoint);

    if (Math.hypot(event.clientX - prev.startX, event.clientY - prev.startY) > 6) {
      dragged.current = true;
    }

    if (pointers.current.size === 1 && dragged.current) {
      const dx = event.clientX - prev.x;
      const dy = event.clientY - prev.y;
      yaw.current -= dx * 0.0055;
      pitch.current = MathUtils.clamp(pitch.current + dy * 0.0035, -0.6, 1.3);
    } else if (pointers.current.size >= 2) {
      const [p1, p2] = Array.from(pointers.current.values());
      const currentDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pinchDistance.current !== null) {
        const delta = pinchDistance.current - currentDist;
        fov.current = MathUtils.clamp(fov.current + delta * 0.09, 42, 85);
      }
      pinchDistance.current = currentDist;
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {}
    }
    if (pointers.current.size < 2) {
      pinchDistance.current = null;
    }
    if (pointers.current.size === 0) {
      setTimeout(() => {
        dragged.current = false;
      }, 50);
    }
  };

  return (
    <main className="qg-page">
      <section
        className={`qg-frame is-started ${!introFinished ? "is-intro" : ""}`}
        aria-label="Undangan interaktif Grand Hall"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={e => e.preventDefault()}
        onWheel={event => {
          if (!paused) {
            fov.current = MathUtils.clamp(fov.current + event.deltaY * 0.04, 42, 85);
          }
        }}
      >
        <World position={position} moving={moving} visited={visited} onWalk={walkTo} onPortrait={() => { target.current = null; keys.current.clear(); setOpen(0); }} yaw={yaw} pitch={pitch} fov={fov} reduced={reduced} physics={physics} paused={paused} />
        <ModelLoader />
        <div className="qg-shade" />

        {!introFinished && <FantasyWeddingIntro onFinish={() => setIntroFinished(true)} />}

        <header className="qg-header"><span>GRAND HALL</span><strong>Yuda & Putri</strong><small>12 · 12 · 2026</small></header>
        <button
          className="qg-btn-fullscreen"
          aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        <div className="qg-crosshair" aria-hidden="true" />
        <nav className="qg-stops" aria-label="Titik undangan">
          {stops.map((stop, index) => (
            <button key={stop.title} aria-label={stop.title} onClick={() => { dragged.current = false; target.current = STOPS[index]; }}>
              {visited.includes(index) ? <Check size={14} /> : index + 1}
            </button>
          ))}
        </nav>
        <div className="qg-controls" aria-label="Kontrol gerakan">
          <div className="qg-dpad" aria-label="Kontrol berjalan">
            {[
              { key: "ArrowUp", label: "Maju", icon: ChevronUp, area: "up" },
              { key: "ArrowLeft", label: "Kiri", icon: ChevronLeft, area: "left" },
              { key: "ArrowDown", label: "Mundur", icon: ChevronDown, area: "down" },
              { key: "ArrowRight", label: "Kanan", icon: ChevronRight, area: "right" },
            ].map(({ key, label, icon: Icon, area }) => (
              <button
                key={key}
                className={area}
                aria-label={label}
                title={label}
                onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); press(key); }}
                onPointerUp={() => keys.current.delete(key)}
                onPointerCancel={() => keys.current.delete(key)}
                onLostPointerCapture={() => keys.current.delete(key)}
              >
                <Icon size={24} />
              </button>
            ))}
          </div>
          <div className="qg-flight" aria-label="Kontrol terbang">
            <button
              aria-label="Terbang naik (Spasi / e)"
              title="Terbang naik"
              onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); press(" "); }}
              onPointerUp={() => keys.current.delete(" ")}
              onPointerCancel={() => keys.current.delete(" ")}
              onLostPointerCapture={() => keys.current.delete(" ")}
            >
              FLY
            </button>
            <button
              aria-label="Turun (Shift / q)"
              title="Turun"
              onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); press("Shift"); }}
              onPointerUp={() => keys.current.delete("Shift")}
              onPointerCancel={() => keys.current.delete("Shift")}
              onLostPointerCapture={() => keys.current.delete("Shift")}
            >
              DOWN
            </button>
          </div>
        </div>
        <p className="qg-hint">WASD / D-pad · Sentuh benda untuk mendorong · FLY / DOWN</p>

        {open !== undefined && <div className="qg-dialog" role="dialog" aria-modal="true" aria-labelledby="qg-dialog-title" style={{ maxHeight: '85dvh', overflowY: 'auto' }}><button className="qg-close" onClick={() => setOpen(undefined)} aria-label="Tutup"><X size={18} /></button><span>KEPINGAN 0{open + 1}</span>{open === 0 && <img src="/assets/models/grand-hall/couple-portrait.png" alt="Potret Yuda dan Putri dengan bingkai emas bertema dunia sihir" width={1254} height={1254} style={{ display: 'block', width: '100%', maxHeight: '45dvh', objectFit: 'contain', height: 'auto', margin: '12px auto' }} />}<h2 id="qg-dialog-title">{stops[open].title}</h2><p>{stops[open].body}</p>{open === 2 && <a href="https://maps.google.com" target="_blank" rel="noreferrer"><MapPin size={15} /> Lihat lokasi</a>}<button className="qg-continue" onClick={() => setOpen(undefined)}>Lanjutkan</button></div>}

        {iosHint && (
          <div className="toast" style={{ bottom: "100px", textAlign: "center", lineHeight: 1.5, pointerEvents: "none" }}>
            Di iPhone, Apple membatasi fullscreen browser. Buka di <strong>Safari</strong> lalu pilih <strong>Bagikan &gt; Tambahkan ke Layar Utama</strong> untuk mode layar penuh tanpa bar browser.
          </div>
        )}
      </section>
    </main>
  );
}
