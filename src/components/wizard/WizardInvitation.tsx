'use client';

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import Image from 'next/image';
import wizardBride from '../../../public/assets/wizard/bride.webp';
import wizardGroom from '../../../public/assets/wizard/groom.webp';
import wizardPicnic from '../../../public/assets/wizard/couple-picnic-hd.webp';
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Copy, Download, Gift, Heart, Mail, MapPin, Send, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { gsap } from 'gsap';
import WizardWishes from './WizardWishes';
import WizardFootsteps from './WizardFootsteps';
import WizardImagePreview from './WizardImagePreview';
import useWizardAudio from './useWizardAudio';
import useWizardAssets from './useWizardAssets';
import useWizardChapters from './useWizardChapters';
import { createWizardCalendar, WIZARD_CONTENT, type WizardContent, type WizardGiftAccount, type WizardGoogleForm } from '@/templates/wizard/content';
import './wizard.css';

const asset = (name: string) => `/assets/wizard/${name}`;
const chapters = [{ id: 'sampul', label: 'Sampul', icon: Sparkles }, { id: 'pasangan', label: 'Pasangan', icon: Heart }, { id: 'acara', label: 'Acara', icon: CalendarDays }, { id: 'rsvp', label: 'RSVP', icon: Send }, { id: 'gift', label: 'Gift', icon: Gift }];
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

function WizardRsvp({ guestName, invitationId, googleForm }: { guestName: string; invitationId: string; googleForm?: WizardGoogleForm }) {
  const [attendance, setAttendance] = useState<'yes' | 'no'>('yes');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    if (status === 'saving') { event.preventDefault(); return; }
    const data = new FormData(event.currentTarget);
    const name = String(data.get(googleForm?.fields.name ?? 'name') ?? '').trim();
    if (!name) {
      event.preventDefault();
      setError('Silakan isi nama Anda.');
      event.currentTarget.querySelector<HTMLInputElement>('#wizard-guest')?.focus();
      return;
    }
    setError('');
    // Let the browser open Google's prefilled form. A handoff is not a saved RSVP.
    if (googleForm) return;
    event.preventDefault();
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
  return status === 'saved' ? <div className="wizard-rsvp-success" role="status"><span><Check size={24} /></span><h3>Terima kasih untuk kabar baiknya.</h3><p>{attendance === 'yes' ? 'Kehadiran Anda akan melengkapi hari bahagia kami. Sampai bertemu di hari istimewa.' : 'Terima kasih atas doa dan restunya. Semoga kita dapat bertemu di kesempatan berikutnya.'}</p></div> : <form className="wizard-form" onSubmit={submit} action={googleForm?.url} method={googleForm ? 'get' : undefined} target={googleForm ? '_blank' : undefined} rel={googleForm ? 'noopener noreferrer' : undefined}>
    <fieldset disabled={status === 'saving'}>
      <legend className="sr-only">Konfirmasi kehadiran</legend>
      {googleForm && <><input type="hidden" name="usp" value="pp_url" /><input type="hidden" name={googleForm.fields.attendance} value={googleForm.attendanceLabels[attendance]} /></>}
      <label htmlFor="wizard-guest">Nama Panggilan/Lengkap<input id="wizard-guest" name={googleForm?.fields.name ?? 'name'} placeholder="Nama lengkap" defaultValue={guestName === 'Tamu Istimewa' ? '' : guestName} required maxLength={120} autoComplete="name" /></label>
      <label htmlFor="wizard-attendance">Kehadiran<select id="wizard-attendance" name={googleForm ? undefined : 'attendance'} value={attendance} onChange={(event) => setAttendance(event.target.value as 'yes' | 'no')}><option value="yes">Dengan senang hati, hadir</option><option value="no">Maaf, belum bisa hadir</option></select></label>
      <label htmlFor="wizard-guests">Jumlah tamu<select id="wizard-guests" name={googleForm?.fields.guests ?? 'guests'} disabled={attendance === 'no'}>{[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number} orang</option>)}</select></label>
      <label htmlFor="wizard-message">Sepatah doa untuk kami <span>(opsional)</span><textarea id="wizard-message" name={googleForm?.fields.message ?? 'message'} placeholder="Tuliskan doa dan harapan Anda…" maxLength={1200} rows={4} /></label>
      {error && <p className="wizard-form-error" role="alert">{error}</p>}
      {googleForm && <p className="wizard-form-note">Jawaban Anda akan terisi di Google Form pada tab baru.</p>}
      <button className="wizard-button" type="submit">{googleForm ? 'Kirim ke Google Form' : status === 'saving' ? 'Mengirim konfirmasi…' : 'Kirim konfirmasi'}{googleForm ? <ArrowUpRight size={15} /> : <Send size={15} />}</button>
    </fieldset>
  </form>;
}

function WizardGift({ accounts }: { accounts: WizardGiftAccount[] }) {
  const [copied, setCopied] = useState('');
  const [error, setError] = useState('');

  async function copyNumber(number: string) {
    setError('');
    setCopied('');
    try {
      await navigator.clipboard.writeText(number);
      setCopied(number);
    } catch {
      setError('Nomor belum tersalin. Silakan salin nomor rekening secara manual.');
    }
  }

  return <div className="wizard-gift-accounts">
    {accounts.map((account) => <article className="wizard-gift-account" key={`${account.bank}-${account.number}`}>
      <div className="wizard-gift-bank"><h3>{account.bank}</h3>{account.isDemo && <span>Rekening contoh</span>}</div>
      <p className="wizard-gift-number">{account.number}</p>
      <p className="wizard-gift-holder">Atas nama <strong>{account.holder}</strong></p>
      <button className="wizard-button wizard-button-outline" type="button" onClick={() => copyNumber(account.number)}>{copied === account.number ? <Check size={15} /> : <Copy size={15} />}{copied === account.number ? 'Nomor tersalin' : 'Salin nomor rekening'}</button>
    </article>)}
    <p className="wizard-gift-feedback" role="status">{error || (copied ? 'Nomor rekening berhasil disalin.' : '')}</p>
  </div>;
}

export default function WizardInvitation({ guestName = 'Tamu Istimewa', content = WIZARD_CONTENT, invitationId = 'demo' }: {
  guestName?: string; content?: WizardContent; invitationId?: string;
}) {
  const root = useParallax();
  const assets = useWizardAssets(root);
  const ready = assets.status === 'ready';
  const sound = useWizardAudio();
  const [phase, setPhase] = useState<JourneyPhase>('cover');
  const journey = useRef({ progress: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const destination = useRef<'cover' | 'inside'>('cover');
  const phaseRef = useRef<JourneyPhase>('cover');
  const hasOpened = useRef(false);
  const interior = useRef<HTMLDivElement>(null);
  const { active, selected, exiting, select } = useWizardChapters(interior, phase === 'inside');

  function setJourneyPhase(value: JourneyPhase) {
    phaseRef.current = value;
    setPhase(value);
  }

  function paintJourney() {
    const node = root.current;
    if (!node) return;
    const progress = journey.current.progress;
    const stage = (start: number, end: number) => {
      const value = Math.max(0, Math.min(1, (progress - start) / (end - start)));
      return value * value * (3 - 2 * value);
    };
    node.style.setProperty('--wizard-journey', String(progress));
    node.style.setProperty('--wizard-characters', String(stage(0, .24)));
    node.style.setProperty('--wizard-characters-fade', String(stage(.2, .28)));
    node.style.setProperty('--wizard-flight', String(stage(0, .32)));
    node.style.setProperty('--wizard-fly-past', String(stage(.2, .38)));
    node.style.setProperty('--wizard-owl-fade', String(stage(.34, .4)));
    node.style.setProperty('--wizard-approach', String(stage(0, .48)));
    node.style.setProperty('--wizard-moon-approach', String(stage(0, .42)));
    node.style.setProperty('--wizard-exterior-fade', String(stage(.44, .58)));
    node.style.setProperty('--wizard-threshold', String(stage(.48, .58)));
    node.style.setProperty('--wizard-door-open', String(stage(.62, .95)));
    node.dataset.cameraProgress = progress.toFixed(4);
    sound.sync(progress);
  }

  function finishJourney() {
    tween.current?.kill();
    tween.current = null;
    journey.current.progress = destination.current === 'inside' ? 1 : 0;
    paintJourney();
    sound.finish(destination.current === 'inside');
    setJourneyPhase(destination.current);
    if (destination.current === 'cover') select('sampul', false);
  }

  function travel(inside: boolean, skipAnimation = false) {
    tween.current?.kill();
    destination.current = inside ? 'inside' : 'cover';
    setJourneyPhase(inside ? 'entering' : 'leaving');
    const animated = !skipAnimation && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    sound.begin(inside, animated);
    if (!animated) {
      finishJourney();
      return;
    }
    tween.current = gsap.to(journey.current, {
      // Finish the exterior journey before revealing and opening the doors.
      ease: 'none',
      keyframes: inside ? [
        { progress: .48, duration: 4.2, ease: 'sine.inOut' },
        { progress: .58, duration: .9, ease: 'sine.inOut' },
        { progress: .62, duration: .6, ease: 'sine.inOut' },
        { progress: 1, duration: 3.6, ease: 'sine.inOut' },
      ] : [
        { progress: .62, duration: 2.6, ease: 'sine.inOut' },
        { progress: .58, duration: .5, ease: 'sine.inOut' },
        { progress: .48, duration: .8, ease: 'sine.inOut' },
        { progress: 0, duration: 3.1, ease: 'sine.inOut' },
      ],
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
      root.current?.querySelector<HTMLElement>(`#${active} h2`)?.focus({ preventScroll: true });
    } else if (phase === 'cover' && hasOpened.current) {
      root.current?.querySelector<HTMLButtonElement>('.wizard-open')?.focus({ preventScroll: true });
    }
  }, [phase, active, root]);

  function goTo(id: string, skipAnimation = false) {
    if (!ready) return;
    if (phaseRef.current === 'entering' || phaseRef.current === 'leaving') return;
    if (id === 'sampul') {
      if (phaseRef.current === 'inside') {
        select(active, false);
        travel(false, skipAnimation);
      }
      return;
    }
    hasOpened.current = true;
    select(id, !skipAnimation);
    if (phaseRef.current === 'cover') travel(true, skipAnimation);
  }

  const mapsUrl = content.mapsUrl;
  const profiles = [
    { id: 'groom', role: 'Mempelai pria', name: content.groom, image: wizardGroom, ...content.partnerProfiles.groom },
    { id: 'bride', role: 'Mempelai wanita', name: content.bride, image: wizardBride, ...content.partnerProfiles.bride },
  ];
  return <div className="wizard-page" lang="id" data-sound={sound.state} data-assets={assets.status}>
    {!ready && <div className="wizard-loader" role="region" aria-label="Pemuatan undangan" aria-busy={assets.status === 'loading'}>
      <div className="wizard-loader-card">
        <Sparkles className="wizard-loader-mark" size={30} strokeWidth={1} aria-hidden="true" />
        <span className="wizard-loader-eyebrow">THE WEDDING OF</span>
        <p className="wizard-loader-names">{content.groom} <i>&amp;</i> {content.bride}</p>
        <div className="wizard-loader-progress" role="progressbar" aria-label="Aset undangan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={assets.progress}><span style={{ width: `${assets.progress}%` }} /></div>
        <p className="wizard-loader-message" role="status">{assets.status === 'error' ? 'Sebagian undangan belum termuat. Periksa koneksi Anda, lalu coba lagi.' : 'Menyiapkan kisah kami untuk Anda…'}</p>
        {assets.status === 'error' ? <button className="wizard-button" type="button" onClick={assets.retry}>Coba lagi</button> : <span className="wizard-loader-percent" aria-hidden="true">{assets.progress}%</span>}
      </div>
    </div>}
    {ready && phase === 'cover' && <button className="wizard-skip" onClick={() => goTo('pasangan', true)}>Lewati sampul</button>}
    <aside className="wizard-desktop-note" aria-label="Tentang undangan" inert={!ready}><div className="wizard-desktop-title"><Star /><p>A LOVE<br />BEYOND MAGIC.</p><span>Beberapa kisah memang<br />ditakdirkan hidup bersama.</span></div><span className="wizard-edition">THE WEDDING COLLECTION — 2026</span></aside>
    <main className="wizard-book" ref={root} data-phase={phase} data-camera-progress="0" inert={!ready} aria-hidden={!ready}>
      <section className="wizard-cover" id="sampul" aria-labelledby="wizard-names" aria-hidden={phase !== 'cover'} inert={phase !== 'cover'}>
        <div className="wizard-cover-art">
          <Image className="wizard-paper" src={asset('parchment.webp')} alt="" fill sizes="(max-width: 600px) 100vw, 540px" preload />
          <Image className="wizard-clouds" src={asset('clouds.webp')} alt="" width={864} height={1821} sizes="(max-width: 600px) 110vw, 600px" loading="eager" />
          <Image className="wizard-moon" src={asset('moon.webp')} alt="" width={768} height={768} sizes="(max-width: 600px) 80vw, 430px" loading="eager" />
          <div className="wizard-landscape-world">
            <Image className="wizard-lake" src={asset('landscape.webp')} alt="" width={1200} height={800} sizes="(max-width: 600px) 260vw, 1400px" loading="eager" />
            <Image className="wizard-castle" src={asset('castle.webp')} alt="" width={1200} height={643} sizes="(max-width: 600px) 100vw, 540px" loading="eager" />
          </div>
          <Image className="wizard-mist" src={asset('mist.webp')} alt="" width={1200} height={600} sizes="(max-width: 600px) 100vw, 540px" />
          <Image className="wizard-owl" src={asset('owl.webp')} alt="" width={1200} height={1200} sizes="(max-width: 600px) 150vw, 900px" loading="eager" />
          <WizardImagePreview className="wizard-cover-character wizard-bride" src={wizardBride} alt={`Potret ${content.bride}`}><Image src={wizardBride} alt="" width={1024} height={1536} sizes="(max-width: 600px) 85vw, 450px" loading="eager" /></WizardImagePreview>
          <WizardImagePreview className="wizard-cover-character wizard-groom" src={wizardGroom} alt={`Potret ${content.groom}`}><Image src={wizardGroom} alt="" width={1024} height={1536} sizes="(max-width: 600px) 85vw, 450px" loading="eager" /></WizardImagePreview>
          <img className="wizard-cover-frame" src={asset('gold-frame.svg')} alt="" />
          <Image className="wizard-banner wizard-banner-left" src={asset('banner-lion.webp')} alt="" width={724} height={2172} sizes="100px" loading="eager" />
          <Image className="wizard-banner wizard-banner-right" src={asset('banner-serpent.webp')} alt="" width={724} height={2172} sizes="100px" loading="eager" />
          {[{ left: '8%', top: '23%', width: '3%' }, { left: '86%', top: '30%', width: '5%' }, { left: '21%', top: '40%', width: '4%' }, { left: '71%', top: '39%', width: '3%' }, { left: '64%', top: '53%', width: '4%' }, { left: '32%', top: '47%', width: '2%' }].map((style, index) => <Star key={index} className={`wizard-spark wizard-spark-${index}`} style={style} />)}
          <div className="wizard-cover-shade" />
        </div>
        <div className="wizard-cover-heading"><span className="wizard-script">The Wedding Of</span><h1 id="wizard-names">{content.groom} <i>&amp;</i> {content.bride}</h1><div className="wizard-separator"><span /><img src={asset('gold-triangle-mark.svg')} width="27" height="27" alt="" /><span /></div><div className="wizard-date-circles" aria-label={content.dateLabel}>{content.dateParts.map((part, index) => <span key={index}>{part}</span>)}</div><p className="wizard-cover-address">{content.address}<br />{content.city}</p></div>
        <p className="wizard-cover-motto">Love is <br />the bridge between you<br /><span>and everything</span></p>
        <div className="wizard-cover-bottom">
          <span>Kepada Yth.<br />Bapak/Ibu/Saudara/i</span><strong>{guestName}</strong><button className="wizard-open" onClick={() => goTo('pasangan')} disabled={!ready}><Mail size={14} /> Buka undangan <ArrowRight size={14} /></button></div>
        <span className="wizard-cover-corner">{content.groom[0]} &amp; {content.bride[0]} · {content.dateParts.join('.')}</span>
      </section>
      <div className="wizard-castle-entry" aria-hidden="true">
        <Image className="wizard-hall" src={asset('castle-hall.webp')} alt="" fill sizes="(max-width: 600px) 100vw, 540px" loading="eager" />
        <div className="wizard-hall-shade" />
        <div className="wizard-gate">
          <div className="wizard-door wizard-door-left"><Image src={asset('castle-gate-left.webp')} alt="" width={1024} height={1536} sizes="(max-width: 600px) 110vh, 1200px" loading="eager" /></div>
          <div className="wizard-door wizard-door-right"><Image src={asset('castle-gate-right.webp')} alt="" width={1024} height={1536} sizes="(max-width: 600px) 110vh, 1200px" loading="eager" /></div>
        </div>
      </div>
      <div className="wizard-arrival-veil" aria-hidden="true" />
      <div className="wizard-reading-shell" hidden={phase !== 'inside'}>
        <WizardFootsteps active={ready && phase === 'inside'} brideName={content.bride} groomName={content.groom} />
        <div className="wizard-interior" ref={interior} role="region" aria-label="Isi undangan" data-chapter={active} data-transition={exiting ? 'leaving' : 'idle'} inert={exiting} aria-busy={exiting}>
          <section className="wizard-section wizard-couple-section" id="pasangan" hidden={active !== 'pasangan'} aria-labelledby="wizard-couple-title">
            <h2 id="wizard-couple-title" className="sr-only" tabIndex={-1}>Pasangan</h2>
            <p className="wizard-greeting" lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="wizard-body-copy">{content.introduction}</p>
            <figure className="wizard-couple-photo"><WizardImagePreview className="wizard-couple-photo-frame" src={wizardPicnic} alt={`Potret piknik bersama ${content.groom} dan ${content.bride}`}><Image src={wizardPicnic} alt={`Potret piknik bersama ${content.groom} dan ${content.bride}`} width={1293} height={1216} sizes="(max-width: 600px) 85vw, 430px" /></WizardImagePreview></figure>
            <blockquote>“{content.quote}”</blockquote><div className="wizard-small-rule"><span /><Star /><span /></div>
            <div className="wizard-profiles" aria-label="Perkenalan mempelai">
              <div className="wizard-profiles-heading-wrap">
                <p className="wizard-profiles-heading">Perkenalkan Kami</p>
                <div className="wizard-profiles-rule" aria-hidden="true"><span /><Star /><span /></div>
              </div>
              {profiles.map((profile, index) => (
                <div key={profile.id} className="wizard-profile-entry">
                  {index > 0 && (
                    <div className="wizard-profiles-separator" aria-hidden="true">
                      <span className="wizard-sep-line" />
                      <span className="wizard-sep-amp">&amp;</span>
                      <span className="wizard-sep-line" />
                    </div>
                  )}
                  <article className={`wizard-profile wizard-profile-${profile.id}`} aria-labelledby={`wizard-profile-${profile.id}-name`}>
                    <figure className="wizard-profile-portrait">
                      <WizardImagePreview className="wizard-portrait-mat" src={profile.image} alt={`Potret ${profile.name}`}>
                        <Image src={profile.image} alt={`Potret ${profile.name} tanpa latar belakang`} sizes="210px" />
                      </WizardImagePreview>
                    </figure>
                    <div className="wizard-profile-copy">
                      <span className="wizard-eyebrow">{profile.role}</span>
                      <h3 className="wizard-profile-name" id={`wizard-profile-${profile.id}-name`}>{profile.fullName}</h3>
                      <div className="wizard-profile-lineage">
                        <p className="wizard-profile-relationship">{profile.relationship}</p>
                        <p className="wizard-profile-parent">{profile.father}</p>
                        <span className="wizard-profile-and" aria-hidden="true">&amp;</span>
                        <p className="wizard-profile-parent">{profile.mother}</p>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </section>

          <section className="wizard-section wizard-event-section" id="acara" hidden={active !== 'acara'} aria-labelledby="wizard-event-title"><h2 id="wizard-event-title" className="sr-only" tabIndex={-1}>Acara pernikahan</h2><time className="wizard-full-date" dateTime={content.date}>{content.dateLabel}</time><div className="wizard-events">{content.events.map((event, index) => <article className="wizard-event" key={event.id}><span className="wizard-event-number">0{index + 1}</span><div><h3>{event.title}</h3><p className="wizard-event-time">{event.time}</p><p>{event.note}</p></div><Star /></article>)}</div><a className="wizard-button wizard-button-outline" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(createWizardCalendar(content))}`} download="pernikahan-yuda-putri.ics"><CalendarDays size={16} /> Simpan tanggalnya</a>
            <div className="wizard-venue"><div className="wizard-venue-art" aria-hidden="true"><Image src={asset('castle.webp')} alt="" width={1200} height={643} sizes="(max-width: 600px) 90vw, 480px" /></div><MapPin size={20} strokeWidth={1.3} /><span className="wizard-eyebrow">TEMPAT KITA MERAYAKAN</span><h3>{content.address}</h3><p>{content.city}</p><a className="wizard-text-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">Google Map <ArrowUpRight size={15} /></a><figure className="wizard-location-qr"><Image src={asset('location-qr.png')} alt="QR lokasi pernikahan Yuda dan Putri di Google Maps" width={1024} height={1024} unoptimized /><figcaption>Pindai untuk membuka lokasi acara</figcaption></figure><a className="wizard-button wizard-button-outline" href={asset('location-qr.png')} download="qr-lokasi-pernikahan-yuda-putri.png"><Download size={15} /> Unduh QR lokasi</a></div>
          </section>

          <section className="wizard-section wizard-gift-section" id="gift" hidden={active !== 'gift'} aria-labelledby="wizard-gift-title"><h2 id="wizard-gift-title" tabIndex={-1}>Gift</h2><p className="wizard-body-copy">Kehadiran dan doa restu Anda merupakan hadiah terindah bagi kami. Bagi Anda yang ingin memberikan tanda kasih, kami menerimanya dengan penuh rasa syukur.</p><WizardGift accounts={content.giftAccounts} /></section>

          <section className="wizard-section wizard-rsvp-section" id="rsvp" hidden={active !== 'rsvp'} aria-labelledby="wizard-rsvp-title"><h2 id="wizard-rsvp-title" className="sr-only" tabIndex={-1}>Konfirmasi kehadiran</h2><WizardRsvp key={`${invitationId}:${guestName}`} guestName={guestName} invitationId={invitationId} googleForm={content.googleForm} /></section>

          <footer className="wizard-footer" hidden={active !== 'rsvp'}><Image src={asset('winged-orb.webp')} alt="" width={1200} height={600} sizes="110px" /><WizardWishes active={phase === 'inside' && active === 'rsvp'} /></footer>
        </div>
        <nav className={`wizard-chapter-nav ${phase === 'inside' ? 'is-open' : ''}`} aria-label="Bagian undangan" inert={!ready}>{chapters.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => goTo(id)} aria-current={selected === id ? 'location' : undefined}><Icon size={17} strokeWidth={1.4} /><span>{label}</span></button>)}</nav>
      </div>
      {phase !== 'cover' && <button className="wizard-sound-toggle" type="button" onClick={sound.toggle} aria-label={sound.state === 'error' ? 'Coba putar suara' : sound.state === 'muted' ? 'Aktifkan suara' : 'Matikan suara'} aria-pressed={sound.state !== 'muted' && sound.state !== 'error'} aria-busy={sound.state === 'loading'} title={sound.state === 'muted' ? 'Aktifkan suara' : 'Matikan suara'}>{sound.state === 'muted' || sound.state === 'error' ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>}
      {phase !== 'cover' && sound.state === 'error' && <p className="wizard-sound-error" role="status">Audio belum dapat diputar. Ketuk tombol suara untuk mencoba lagi.</p>}
    </main>
    <aside className="wizard-desktop-right" aria-hidden="true"><span>A JOURNEY INTO OUR STORY</span><div /><Sparkles size={16} /></aside>
  </div>;
}
