'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Copy, Plus, Trash2, Users } from 'lucide-react';
import styles from './WizardGuestListing.module.css';

const STORAGE_KEY = 'protea:wizard:guest-names';

export default function WizardGuestListing() {
  const [names, setNames] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(stored) || !stored.every((item) => typeof item === 'string')) {
        throw new Error('Invalid guest list');
      }
      setNames([...new Set(stored.filter((item) => item.trim()))]);
    } catch {
      setError('Daftar tamu tidak dapat dibaca dari penyimpanan browser.');
    } finally {
      setReady(true);
    }
  }, []);

  function saveNames(nextNames: string[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNames));
      setNames(nextNames);
      setError('');
      return true;
    } catch {
      setError('Perubahan belum tersimpan. Pastikan penyimpanan browser tersedia, lalu coba lagi.');
      setMessage('');
      return false;
    }
  }

  function addName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim().replace(/\s+/gu, ' ');
    setMessage('');
    if (!trimmedName) {
      setError('Masukkan nama tamu terlebih dahulu.');
      inputRef.current?.focus();
      return;
    }
    if (names.some((item) => item.toLocaleLowerCase('id-ID') === trimmedName.toLocaleLowerCase('id-ID'))) {
      setError('Nama ini sudah ada dalam daftar tamu.');
      return;
    }
    if (saveNames([...names, trimmedName])) {
      setName('');
      setMessage(`${trimmedName} ditambahkan.`);
      inputRef.current?.focus();
    }
  }

  async function copyUrl(guestName: string) {
    setMessage('');
    setError('');
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/guest/${encodeURIComponent(guestName)}`);
      setMessage(`Link undangan untuk ${guestName} disalin.`);
    } catch {
      setError('Link belum tersalin. Izinkan akses clipboard atau salin alamat link di bawah nama tamu.');
    }
  }

  function deleteName(guestName: string) {
    if (saveNames(names.filter((item) => item !== guestName))) {
      setMessage(`${guestName} dihapus.`);
    }
  }

  return (
    <main className={styles.page} lang="id">
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Yuda &amp; Putri · Undangan Pernikahan</p>
          <h1>Daftar tamu</h1>
          <p>Tambahkan nama dan bagikan link undangan personal untuk setiap tamu.</p>
        </header>

        <form className={styles.form} onSubmit={addName}>
          <label htmlFor="guest-name">Nama tamu</label>
          <div className={styles.formRow}>
            <input
              ref={inputRef}
              id="guest-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Budi Santoso"
              maxLength={120}
              required
              disabled={!ready}
            />
            <button className={styles.submit} type="submit" disabled={!ready}>
              <Plus size={17} aria-hidden="true" /> Tambah nama
            </button>
          </div>
          <p className={styles.hint}>Daftar tersimpan otomatis di browser ini.</p>
        </form>

        <div className={styles.feedback}>
          <p role="status">{message}</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
        </div>

        <section className={styles.listSection} aria-labelledby="guest-list-heading" aria-busy={!ready}>
          <div className={styles.listHeading}>
            <h2 id="guest-list-heading">Tamu undangan</h2>
            <span>{names.length} nama</span>
          </div>
          {!ready ? (
            <p className={styles.empty}>Memuat daftar tamu…</p>
          ) : names.length === 0 ? (
            <div className={styles.empty}>
              <Users size={28} aria-hidden="true" />
              <p>Belum ada tamu.</p>
              <span>Tambahkan nama pertama melalui form di atas.</span>
            </div>
          ) : (
            <ul className={styles.list}>
              {names.map((guestName) => {
                const path = `/guest/${encodeURIComponent(guestName)}`;
                return (
                  <li className={styles.guest} key={guestName}>
                    <div className={styles.guestInfo}>
                      <h3>{guestName}</h3>
                      <a href={path} target="_blank" rel="noopener noreferrer">{path}</a>
                    </div>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => copyUrl(guestName)} aria-label={`Salin link ${guestName}`}>
                        <Copy size={16} aria-hidden="true" /> Copy
                      </button>
                      <button className={styles.delete} type="button" onClick={() => deleteName(guestName)} aria-label={`Hapus ${guestName}`}>
                        <Trash2 size={16} aria-hidden="true" /> Hapus
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
