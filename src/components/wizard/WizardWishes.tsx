'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { WizardWish } from '@/server/wizard-wishes';

export default function WizardWishes({ active }: { active: boolean }) {
  const [wishes, setWishes] = useState<WizardWish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const list = useRef<HTMLUListElement>(null);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/wizard/wishes', { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Could not load wishes.');
      const data = await response.json();
      if (!Array.isArray(data.wishes)) throw new Error('Unexpected wishes response.');
      if (!controller.signal.aborted) {
        setWishes(data.wishes);
      }
    } catch {
      if (!controller.signal.aborted) setError('Ucapan belum dapat dimuat. Silakan coba kembali.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    void refresh();
    const resume = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', resume);
    const interval = window.setInterval(resume, 60000);
    return () => {
      request.current?.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [active, refresh]);

  useEffect(() => {
    const node = list.current;
    if (!active || !node) return;
    const rows = Array.from(node.children).slice(0, 3);
    const resize = () => {
      if (wishes.length <= 3) {
        node.style.removeProperty('--wizard-wishes-height');
        return;
      }
      const gap = Number.parseFloat(getComputedStyle(node).rowGap) || 0;
      const height = rows.reduce((total, row) => total + row.getBoundingClientRect().height, 0) + gap * (rows.length - 1);
      node.style.setProperty('--wizard-wishes-height', `${height}px`);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    rows.forEach((row) => observer.observe(row));
    resize();
    return () => observer.disconnect();
  }, [active, wishes]);

  return <section className="wizard-wishes" aria-labelledby="wizard-wishes-title">
    <h2 id="wizard-wishes-title">Ucapan &amp; Doa</h2>
    <p className="wizard-wishes-intro">Terima kasih untuk setiap doa baik yang sudah diberikan kepada kami.</p>
    {loading && !wishes.length && <p className="wizard-wishes-status" role="status">Memuat ucapan…</p>}
    {!loading && !error && !wishes.length && <p className="wizard-wishes-status">Ucapan dan doa akan hadir di sini.</p>}
    {!!wishes.length && <ul ref={list} className="wizard-wishes-list" tabIndex={wishes.length > 3 ? 0 : undefined} aria-label="Daftar ucapan dan doa tamu">{wishes.map((wish, index) => <li className="wizard-wish" key={`${wish.name}-${index}`}>
      <span className="wizard-wish-avatar" aria-hidden="true">{Array.from(wish.name)[0]}</span>
      <div><h3>{wish.name}</h3><p>{wish.message}</p></div>
    </li>)}</ul>}
    {error && <p className="wizard-wishes-status" role="status">{error}</p>}
    <div className="wizard-wishes-actions">
      <button className="wizard-text-link" type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={12} aria-hidden="true" />{loading ? 'Memuat…' : 'Perbarui ucapan'}</button>
    </div>
  </section>;
}
