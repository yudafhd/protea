'use client';

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, ArrowUpRight, CalendarDays, Check, Heart, Mail, MapPin, Send, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';
import { createWizardCalendar, WIZARD_CONTENT, type WizardContent } from '@/templates/wizard/content';
import './wizard.css';

const asset = (name: string) => `/assets/wizard/${name}`;
const chapters = [{ id: 'sampul', label: 'Sampul', icon: Sparkles }, { id: 'pasangan', label: 'Pasangan', icon: Heart }, { id: 'acara', label: 'Acara', icon: CalendarDays }, { id: 'surat', label: 'Surat', icon: Mail }, { id: 'rsvp', label: 'RSVP', icon: Send }];
type JourneyPhase = 'cover' | 'entering' | 'inside' | 'leaving';

function Star({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <img className={`wizard-star ${className}`} src={asset('gold-star.svg')} alt="" aria-hidden="true" width="24" height="24" style={style} />;
}

function useParallax() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let x = 0;
    let y = 0;
    const paint = () => {
      frame = 0;
      node.style.setProperty('--wizard-x', String(preference.matches ? 0 : x));
      node.style.setProperty('--wizard-y', String(preference.matches ? 0 : y));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(paint); };
    const move = (event: PointerEvent) => {
      if (!finePointer.matches || preference.matches) return;
      const bounds = node.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
      y = Math.max(-1, Math.min(1, event.clientY / innerHeight * 2 - 1));
      schedule();
    };
    const leave = () => { x = 0; y = 0; schedule(); };
    window.addEventListener('resize', schedule, { passive: true });
    node.addEventListener('pointermove', move, { passive: true });
    node.addEventListener('pointerleave', leave);
    preference.addEventListener('change', schedule);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', leave);
      preference.removeEventListener('change', schedule);
    };
  }, []);
  return root;
}

function WizardRsvp({ guestName, invitationId }: { guestName: string; invitationId: string }) {
  const [attendance, setAttendance] = useState('yes');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'saving') return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    if (!name) {
      setError('Silakan isi nama Anda.');
      event.currentTarget.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
      return;
    }
    setStatus('saving');
    setError('');
    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId, name, attendance, guests: Number(data.get('guests') ?? 1), message: String(data.get('message') ?? '').trim() }),
      });
      if (!response.ok) {
        setStatus('idle');
        setError(response.status === 400 ? 'Periksa kembali nama dan jumlah tamu Anda.' : 'Konfirmasi belum terkirim. Silakan coba kembali.');
        return;
      }
      setStatus('saved');
    } catch {
      setStatus('idle');
      setError('Konfirmasi belum terkirim. Periksa koneksi Anda dan coba kembali.');
    }
  }
  return status === 'saved' ? <div className="wizard-rsvp-success" role="status"><span><Check size={24} /></span><h3>Terima kasih untuk kabar baiknya.</h3><p>{attendance === 'yes' ? 'Kehadiran Anda akan melengkapi hari bahagia kami. Sampai bertemu di hari istimewa.' : 'Terima kasih atas doa dan restunya. Semoga kita dapat bertemu di kesempatan berikutnya.'}</p></div> : <form className="wizard-form" onSubmit={submit}>
    <fieldset disabled={status === 'saving'}>
      <legend className="sr-only">Konfirmasi kehadiran</legend>
      <label htmlFor="wizard-guest">Nama Anda<input id="wizard-guest" name="name" placeholder="Nama lengkap" defaultValue={guestName === 'Tamu Istimewa' ? '' : guestName} required maxLength={120} autoComplete="name" /></label>
      <div className="wizard-form-row"><label htmlFor="wizard-attendance">Kehadiran<select id="wizard-attendance" name="attendance" value={attendance} onChange={(event) => setAttendance(event.target.value)}><option value="yes">Dengan senang hati, hadir</option><option value="no">Maaf, belum bisa hadir</option></select></label><label htmlFor="wizard-guests">Jumlah tamu<select id="wizard-guests" name="guests" disabled={attendance === 'no'}>{[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number} orang</option>)}</select></label></div>
      <label htmlFor="wizard-message">Sepatah doa untuk kami <span>(opsional)</span><textarea id="wizard-message" name="message" placeholder="Tuliskan doa dan harapan Anda…" maxLength={1200} rows={4} /></label>
      {error && <p className="wizard-form-error" role="alert">{error}</p>}
      <button className="wizard-button" type="submit">{status === 'saving' ? 'Mengirim konfirmasi…' : 'Kirim konfirmasi'}<Send size={15} /></button>
    </fieldset>
  </form>;
}

export default function WizardInvitation({ guestName = 'Tamu Istimewa', content = WIZARD_CONTENT, invitationId = 'demo' }: {
  guestName?: string; content?: WizardContent; invitationId?: string;
}) {
  const root = useParallax();
  const [active, setActive] = useState('sampul');
  const [phase, setPhase] = useState<JourneyPhase>('cover');
  const journey = useRef({ progress: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const destination = useRef<'cover' | 'inside'>('cover');
  const phaseRef = useRef<JourneyPhase>('cover');
  const hasOpened = useRef(false);
  const interior = useRef<HTMLDivElement>(null);

  function setJourneyPhase(value: JourneyPhase) {
    phaseRef.current = value;
    setPhase(value);
  }

  function paintJourney() {
    root.current?.style.setProperty('--wizard-journey', String(journey.current.progress));
    if (root.current) root.current.dataset.cameraProgress = journey.current.progress.toFixed(4);
  }

  function finishJourney() {
    tween.current?.kill();
    tween.current = null;
    journey.current.progress = destination.current === 'inside' ? 1 : 0;
    paintJourney();
    setJourneyPhase(destination.current);
    if (destination.current === 'cover') setActive('sampul');
  }

  function travel(inside: boolean, skipAnimation = false) {
    tween.current?.kill();
    destination.current = inside ? 'inside' : 'cover';
    setJourneyPhase(inside ? 'entering' : 'leaving');
    if (skipAnimation || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishJourney();
      return;
    }
    tween.current = gsap.to(journey.current, {
      progress: inside ? 1 : 0,
      duration: inside ? 3.6 : 2.6,
      ease: 'power2.inOut',
      onUpdate: paintJourney,
      onComplete: finishJourney,
    });
  }

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => {
      if (preference.matches && tween.current) finishJourney();
    };
    preference.addEventListener('change', reduce);
    return () => { preference.removeEventListener('change', reduce); tween.current?.kill(); };
    // The callback only reads refs, so it also handles a preference change mid-flight.
  }, []);

  useEffect(() => {
    if (phase === 'inside') {
      if (interior.current) interior.current.scrollTop = 0;
      root.current?.querySelector<HTMLElement>(`#${active} h2`)?.focus({ preventScroll: true });
    } else if (phase === 'cover' && hasOpened.current) {
      root.current?.querySelector<HTMLButtonElement>('.wizard-open')?.focus({ preventScroll: true });
    }
  }, [phase, active, root]);

  function goTo(id: string, skipAnimation = false) {
    if (phaseRef.current === 'entering' || phaseRef.current === 'leaving') return;
    if (id === 'sampul') {
      if (phaseRef.current === 'inside') travel(false, skipAnimation);
      return;
    }
    hasOpened.current = true;
    setActive(id);
    if (phaseRef.current === 'cover') travel(true, skipAnimation);
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${content.address}, ${content.city}`)}`;
  return <div className="wizard-page" lang="id">
    {phase === 'cover' && <button className="wizard-skip" onClick={() => goTo('pasangan', true)}>Lewati sampul</button>}
    <aside className="wizard-desktop-note" aria-label="Tentang undangan"><Link href="/" className="wizard-back"><ArrowLeft size={15} /> Koleksi undangan</Link><div className="wizard-desktop-title"><Star /><p>A LOVE<br />BEYOND MAGIC.</p><span>Beberapa kisah memang<br />ditakdirkan menjadi selamanya.</span></div><span className="wizard-edition">THE WEDDING COLLECTION — 2026</span></aside>
    <main className="wizard-book" ref={root} data-phase={phase} data-camera-progress="0">
      <section className="wizard-cover" id="sampul" aria-labelledby="wizard-names" aria-hidden={phase !== 'cover'} inert={phase !== 'cover'}>
        <div className="wizard-cover-art" aria-hidden="true">
          <Image className="wizard-paper" src={asset('parchment.webp')} alt="" fill sizes="(max-width: 600px) 100vw, 540px" preload />
          <Image className="wizard-clouds" src={asset('clouds.webp')} alt="" width={864} height={1821} sizes="(max-width: 600px) 110vw, 600px" loading="eager" />
          <div className="wizard-landscape-world">
            <Image className="wizard-lake" src={asset('landscape.webp')} alt="" width={1200} height={800} sizes="(max-width: 600px) 260vw, 1400px" loading="eager" />
            <Image className="wizard-castle" src={asset('castle.webp')} alt="" width={1200} height={643} sizes="(max-width: 600px) 100vw, 540px" loading="eager" />
          </div>
          <Image className="wizard-mist" src={asset('mist.webp')} alt="" width={1200} height={600} sizes="(max-width: 600px) 100vw, 540px" />
          <Image className="wizard-owl" src={asset('owl.webp')} alt="" width={1200} height={1200} sizes="140px" />
          <Image className="wizard-bride" src={asset('bride.webp')} alt="" width={1024} height={1536} sizes="(max-width: 600px) 85vw, 450px" loading="eager" />
          <Image className="wizard-groom" src={asset('groom.webp')} alt="" width={1024} height={1536} sizes="(max-width: 600px) 85vw, 450px" loading="eager" />
          <img className="wizard-cover-frame" src={asset('gold-frame.svg')} alt="" />
          <Image className="wizard-banner wizard-banner-left" src={asset('banner-lion.webp')} alt="" width={724} height={2172} sizes="100px" loading="eager" />
          <Image className="wizard-banner wizard-banner-right" src={asset('banner-serpent.webp')} alt="" width={724} height={2172} sizes="100px" loading="eager" />
          {[{ left: '8%', top: '23%', width: '3%' }, { left: '86%', top: '30%', width: '5%' }, { left: '21%', top: '40%', width: '4%' }, { left: '71%', top: '39%', width: '3%' }, { left: '64%', top: '53%', width: '4%' }, { left: '32%', top: '47%', width: '2%' }].map((style, index) => <Star key={index} className={`wizard-spark wizard-spark-${index}`} style={style} />)}
          <div className="wizard-cover-shade" />
        </div>
        <div className="wizard-cover-heading"><span className="wizard-script">The Wedding Of</span><h1 id="wizard-names">{content.groom} <i>&amp;</i> {content.bride}</h1><div className="wizard-separator"><span /><img src={asset('gold-triangle-mark.svg')} width="27" height="27" alt="" /><span /></div><div className="wizard-date-circles" aria-label={content.dateLabel}>{content.dateParts.map((part, index) => <span key={index}>{part}</span>)}</div><p className="wizard-cover-address">{content.address}<br />{content.city}</p></div>
        <p className="wizard-cover-motto">SAME SOULS<br />DIFFERENT WORLDS<br /><span>ALWAYS US</span></p>
        <div className="wizard-cover-bottom"><p className="wizard-script">It was always you.</p><Image className="wizard-orb" src={asset('winged-orb.webp')} alt="" width={1200} height={600} sizes="100px" /><span>Kepada Yth. Bapak/Ibu/Saudara/i</span><strong>{guestName}</strong><button className="wizard-open" onClick={() => goTo('pasangan')}><Mail size={14} /> Buka undangan <ArrowRight size={14} /></button></div>
        <span className="wizard-cover-corner">{content.groom[0]} &amp; {content.bride[0]} · {content.dateParts.join('.')}</span>
      </section>
      <div className="wizard-arrival-veil" aria-hidden="true" />
      <div className="wizard-journey-status" role="status" aria-live="polite">
        {phase === 'entering' && <span>Lebih dekat dengan cerita kita…</span>}
        {phase === 'leaving' && <span>Kembali ke awal cerita…</span>}
      </div>
      <div className="wizard-interior" ref={interior} hidden={phase !== 'inside'} role="region" aria-label="Isi undangan">
        <div className="wizard-interior-header"><Star /><span>{content.groom} &amp; {content.bride}</span><small>{content.dateParts.join(' · ')}</small></div>
      <section className="wizard-section wizard-couple-section" id="pasangan" hidden={active !== 'pasangan'} aria-labelledby="wizard-couple-title">
        <Star className="wizard-section-star" /><span className="wizard-eyebrow">DUA DUNIA, SATU CERITA</span><h2 id="wizard-couple-title" tabIndex={-1}>Ditulis oleh takdir.<br /><em>Dipilih oleh hati.</em></h2><p className="wizard-body-copy">{content.introduction}</p>
        <div className="wizard-couple-portraits"><figure><div className="wizard-portrait-arch"><Image src={asset('groom.webp')} alt={`Potret ${content.groom}`} width={1024} height={1536} sizes="(max-width: 600px) 42vw, 220px" /></div><figcaption><span>THE GROOM</span><h3>{content.groom}</h3></figcaption></figure><span className="wizard-couple-amp">&amp;</span><figure><div className="wizard-portrait-arch"><Image src={asset('bride.webp')} alt={`Potret ${content.bride}`} width={1024} height={1536} sizes="(max-width: 600px) 42vw, 220px" /></div><figcaption><span>THE BRIDE</span><h3>{content.bride}</h3></figcaption></figure></div>
        <blockquote>“{content.quote}”</blockquote><div className="wizard-small-rule"><span /><Star /><span /></div>
      </section>

      <section className="wizard-section wizard-event-section" id="acara" hidden={active !== 'acara'} aria-labelledby="wizard-event-title"><span className="wizard-eyebrow">THE DAY WE SAY ALWAYS</span><h2 id="wizard-event-title" tabIndex={-1}>Satu hari.<br /><em>Untuk selamanya.</em></h2><time className="wizard-full-date" dateTime={content.date}>{content.dateLabel}</time><div className="wizard-events">{content.events.map((event, index) => <article className="wizard-event" key={event.id}><span className="wizard-event-number">0{index + 1}</span><div><h3>{event.title}</h3><p className="wizard-event-time">{event.time}</p><p>{event.note}</p></div><Star /></article>)}</div><a className="wizard-button wizard-button-outline" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(createWizardCalendar(content))}`} download="pernikahan-yuda-putri.ics"><CalendarDays size={16} /> Simpan tanggalnya</a>
        <div className="wizard-venue"><div className="wizard-venue-art" aria-hidden="true"><Image src={asset('castle.webp')} alt="" width={1200} height={643} sizes="(max-width: 600px) 90vw, 480px" /></div><MapPin size={20} strokeWidth={1.3} /><span className="wizard-eyebrow">TEMPAT KITA MERAYAKAN</span><h3>{content.address}</h3><p>{content.city}</p><a className="wizard-text-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">Petunjuk arah <ArrowUpRight size={15} /></a></div>
      </section>

      <section className="wizard-letter" id="surat" hidden={active !== 'surat'} aria-labelledby="wizard-letter-title"><Image className="wizard-letter-owl" src={asset('owl.webp')} alt="Burung hantu membawa sepucuk surat" width={1200} height={1200} sizes="180px" /><span className="wizard-eyebrow">SEPOTONG SURAT UNTUK ANDA</span><h2 id="wizard-letter-title" tabIndex={-1}>Keajaiban terbaik<br />adalah <em>kebersamaan.</em></h2><p>Hari ini akan terasa lebih berarti dengan kehadiran orang-orang terkasih. Datanglah, berbagi tawa, dan tuliskan kenangan indah bersama kami.</p><span className="wizard-letter-signature">Dengan cinta, {content.groom} &amp; {content.bride}</span><Star /></section>

      <section className="wizard-section wizard-rsvp-section" id="rsvp" hidden={active !== 'rsvp'} aria-labelledby="wizard-rsvp-title"><Star className="wizard-section-star" /><span className="wizard-eyebrow">A SEAT IN OUR STORY</span><h2 id="wizard-rsvp-title" tabIndex={-1}>Boleh kami<br /><em>menanti Anda?</em></h2><p className="wizard-body-copy">Sampaikan kabar kehadiran dan sepatah doa untuk perjalanan baru kami.</p><WizardRsvp guestName={guestName} invitationId={invitationId} /></section>

      <footer className="wizard-footer" hidden={active !== 'rsvp'}><Image src={asset('winged-orb.webp')} alt="" width={1200} height={600} sizes="110px" /><p className="wizard-script">After all this time? Always.</p><h2>{content.groom} <i>&amp;</i> {content.bride}</h2><span>{content.dateParts[0]} · {content.dateParts[1]} · {content.date.slice(0, 4)}</span><Link href="/">Dibuat dengan cinta oleh <b>protēa</b><ArrowUpRight size={12} /></Link></footer>
      </div>
    </main>
    <aside className="wizard-desktop-right" aria-hidden="true"><span>A JOURNEY INTO OUR ALWAYS</span><div /><Sparkles size={16} /></aside>
    <nav className={`wizard-chapter-nav ${phase === 'inside' ? 'is-open' : ''}`} aria-label="Bagian undangan">{chapters.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => goTo(id)} aria-current={active === id ? 'location' : undefined}><Icon size={17} strokeWidth={1.4} /><span>{label}</span></button>)}</nav>
  </div>;
}
