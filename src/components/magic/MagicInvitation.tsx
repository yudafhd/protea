"use client";
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Compass, Feather, Map, Sparkles } from 'lucide-react';
import { Dialog } from '@/components/Dialog';
import RsvpForm from '@/components/player/RsvpForm';
import content from '@/templates/demo-content.json';
const World3D = dynamic(() => import('./World3D'), { ssr: false, loading: () => <div className="magic-3d-loading">Membuka dunia sihir 3D…</div> });
import { advance, avoidScenery, chapters, nearby, type Point } from './world';
import { cameraMovement, INITIAL_YAW, INITIAL_PITCH } from './camera';
import './magic.css';
const start = { x: 195, y: 520 };
const alleyStart = { x: 195, y: 450 };
export default function MagicInvitation() {
  const [scene, setScene] = useState(0);
  const [position, setPosition] = useState<Point>(alleyStart);
  const [moving, setMoving] = useState(false);
  const [visited, setVisited] = useState<number[]>([]);
  const [letter, setLetter] = useState<number | null>(null);
  const [journal, setJournal] = useState(false);
  const [rsvp, setRsvp] = useState(false);
  const [compact, setCompact] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [overview, setOverview] = useState(false);
  const cameraYaw = useRef(INITIAL_YAW);
  const cameraPitch = useRef(INITIAL_PITCH);
  const target = useRef<Point | null>(null);
  const keys = useRef(new Set<string>());
  const current = useRef(position);
  const suppressed = useRef<number | null>(null);

  const paused = letter !== null || journal || rsvp;
  const chapter = chapters[scene];
  const complete = [scene*2, scene*2+1].every(id=>visited.includes(id));
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReduced(motion.matches); updateMotion(); motion.addEventListener('change', updateMotion);
    const query = window.matchMedia('(max-width: 700px)');
    const update = () => setCompact(query.matches); update(); query.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); motion.removeEventListener('change', updateMotion); };
  }, []);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (paused || e.ctrlKey || e.metaKey || e.altKey || (e.target instanceof HTMLElement && e.target.closest('input,textarea,select'))) return; if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); keys.current.add(e.key); target.current = null; } };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key);
    const clear = () => { keys.current.clear(); target.current = null; };
    window.addEventListener('keydown',down); window.addEventListener('keyup',up); window.addEventListener('blur',clear); document.addEventListener('visibilitychange',clear);
    return () => { window.removeEventListener('keydown',down); window.removeEventListener('keyup',up); window.removeEventListener('blur',clear); document.removeEventListener('visibilitychange',clear); clear(); };
  }, [paused]);
  useEffect(() => {
    if (paused) { setMoving(false); return; }
    let frame = 0, last = 0;
    const tick = (time: number) => {
      const dt = last ? (time-last)/1000 : 0; last=time;
      const k = keys.current;
      const dx = Number(k.has('d')||k.has('ArrowRight'))-Number(k.has('a')||k.has('ArrowLeft'));
      const dy = Number(k.has('s')||k.has('ArrowDown'))-Number(k.has('w')||k.has('ArrowUp'));
      const p = current.current;
      const direction = dx||dy ? cameraMovement(dx*100,dy*100,cameraYaw.current) : target.current ? { x: target.current.x-p.x, y: target.current.y-p.y } : {x:0,y:0};
      const next = avoidScenery(advance(p,direction,dt), scene);
      const walking = Math.hypot(next.x-p.x,next.y-p.y)>.05;
      setMoving(walking);
      if (walking) { current.current=next; setPosition(next); }
      if (target.current && Math.hypot(next.x-target.current.x,next.y-target.current.y)<3) target.current=null;
      const near = chapters[scene].points.findIndex(point=>nearby(next,point));
      if (near<0) suppressed.current=null;
      else { const id=scene*2+near; if (suppressed.current!==id) { suppressed.current=id; target.current=null; keys.current.clear(); setVisited(v=>v.includes(id)?v:[...v,id]); setLetter(id); return; } }
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(frame);
  }, [scene,paused]);
  function travel(index: number) { cameraYaw.current=INITIAL_YAW; cameraPitch.current=INITIAL_PITCH; setOverview(false); setScene(index); current.current=index===0?alleyStart:start; setPosition(current.current); target.current=null; keys.current.clear(); suppressed.current=null; }
  function walkTo(point: Point) { if (!paused) target.current=scene===0?avoidScenery(point,scene):point; }

  return <main className="magic-page">
    <section className="magic-game" aria-label="Mini game undangan pernikahan">
      <World3D scene={scene} position={position} moving={moving} visited={visited} onWalk={walkTo} paused={paused} compact={compact} reduced={reduced} overview={overview} cameraYaw={cameraYaw} cameraPitch={cameraPitch}/>
      <div className="magic-vignette"/>
      <button className="magic-journal-button" onClick={()=>setJournal(true)} aria-label="Buka buku undangan" title="Buka buku undangan"><BookOpen size={20}/></button>
      <nav className="magic-quest" aria-label="Titik undangan">{chapter.points.map((point,i)=><button key={i} onClick={()=>walkTo(point)} aria-label={point.label} title={point.label}>{visited.includes(scene*2+i)?<Check size={20}/>:i===0?<Feather size={20}/>:<Sparkles size={20}/>}</button>)}</nav>
      <button className="magic-camera-toggle" onClick={()=>setOverview(!overview)} aria-pressed={overview} aria-label={overview ? "Ikuti karakter" : "Lihat dunia"} title={overview ? "Ikuti karakter" : "Lihat dunia"}><Compass size={20}/></button>
      <div className="magic-dpad" aria-label="Kontrol berjalan">{[{key:'ArrowUp',label:'Jalan ke atas',icon:ChevronUp},{key:'ArrowLeft',label:'Jalan ke kiri',icon:ChevronLeft},{key:'ArrowDown',label:'Jalan ke bawah',icon:ChevronDown},{key:'ArrowRight',label:'Jalan ke kanan',icon:ChevronRight}].map(({key,label,icon:Icon})=><button key={key} aria-label={label} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);if(!paused){keys.current.add(key);target.current=null;}}} onPointerUp={()=>keys.current.delete(key)} onPointerCancel={()=>keys.current.delete(key)} onLostPointerCapture={()=>keys.current.delete(key)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!paused)keys.current.add(key);}}} onKeyUp={()=>keys.current.delete(key)} onBlur={()=>keys.current.delete(key)}><Icon size={20}/></button>)}</div>
      <div className="magic-travel">{scene>0&&<button onClick={()=>travel(scene-1)} aria-label="Kembali ke scene sebelumnya"><ArrowLeft size={16}/></button>}{complete && (scene<2?<button className="magic-gold-button" onClick={()=>travel(scene+1)}>Menuju {chapters[scene+1].short}<ArrowRight size={15}/></button>:<button className="magic-gold-button" onClick={()=>setRsvp(true)}>Kirim RSVP <Feather size={15}/></button>)}</div>
    </section>
    {letter!==null && <Dialog titleId="magic-letter-title" onClose={()=>setLetter(null)}><span className="magic-letter-kicker"><Sparkles size={18}/> KEPINGAN UNDANGAN 0{letter+1}</span><h2 id="magic-letter-title">{chapters[Math.floor(letter/2)].points[letter%2].title}</h2>{letter===0?<><p>Kepada {content.guest.name}, dengan penuh cinta kami mengundang Anda merayakan pernikahan kami.</p><h3>{content.couple.groom} & {content.couple.bride}</h3></>:letter===1?<p>Dua jalan bertemu, lalu tumbuh menjadi ribuan petualangan kecil. Kini Adrian dan Isabella memilih satu tujuan: menulis kisah selamanya, bersama.</p>:letter===2?<><h3>Senin, 2 November 2026</h3><p>Akad nikah: {content.wedding.akad}<br/>Resepsi: {content.wedding.reception}</p></>:letter===3?<><h3>{content.venue.name}</h3><p>{content.venue.address}</p><a className="primary-button" href={content.venue.mapLink} target="_blank" rel="noopener noreferrer"><Map size={16}/> Lihat lokasi</a></>:letter===4?<p>Di antara seluruh keajaiban dunia, menemukan satu sama lain adalah yang terindah. Doa dan restu Anda akan melengkapi langkah baru kami.</p>:<><p>Gerbang telah terbuka, dan satu tempat menanti Anda. Mari rayakan cinta, persahabatan, dan awal kisah kami.</p><button className="primary-button" onClick={()=>{setLetter(null);setRsvp(true);}}>Konfirmasi kehadiran <Feather size={16}/></button></>}<button className="magic-letter-continue" onClick={()=>setLetter(null)}>Lanjutkan petualangan <ArrowRight size={16}/></button></Dialog>}
    {journal && <Dialog titleId="magic-book-title" onClose={()=>setJournal(false)}><span className="magic-letter-kicker">YOUR COLLECTED MEMORIES</span><h2 id="magic-book-title">Buku undangan</h2><p>{visited.length} dari 6 kepingan ditemukan. Kunjungi cahaya di setiap scene untuk melengkapi kisah.</p>{chapters.flatMap((c,s)=>c.points.map((p,i)=><button className="magic-book-row" key={s*2+i} disabled={!visited.includes(s*2+i)} onClick={()=>{setJournal(false);setLetter(s*2+i);}}><span>0{s*2+i+1}</span>{visited.includes(s*2+i)?p.title:'Belum ditemukan'}{visited.includes(s*2+i)&&<Check size={15}/>}</button>))}</Dialog>}
    {rsvp&&<RsvpForm invitationId="demo" onClose={()=>setRsvp(false)}/>}
  </main>;
}
