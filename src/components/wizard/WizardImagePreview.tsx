'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image, { type StaticImageData } from 'next/image';
import { X } from 'lucide-react';

export default function WizardImagePreview({ src, alt, className, children }: {
  src: StaticImageData; alt: string; className?: string; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const captionId = useId();

  useEffect(() => {
    if (!open) return;
    const node = dialog.current;
    if (!node) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    node.showModal();
    return () => {
      node.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return <>
    <button ref={trigger} className={`wizard-image-trigger ${className ?? ''}`} type="button" aria-label={`Lihat foto penuh: ${alt}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      {children}
    </button>
    {open && createPortal(<dialog ref={dialog} className="wizard-image-preview" aria-labelledby={captionId} onClose={() => {
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    }} onKeyDown={(event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        event.currentTarget.querySelector<HTMLButtonElement>('.wizard-image-preview-close')?.focus();
      }
    }} onClick={(event) => {
      if (event.target === event.currentTarget) dialog.current?.close();
    }}>
      <button className="wizard-image-preview-close" type="button" aria-label="Tutup preview foto" onClick={() => dialog.current?.close()}><X size={22} aria-hidden="true" /></button>
      <figure className="wizard-image-preview-content">
        <Image src={src} alt={alt} sizes="100vw" />
        <figcaption id={captionId}>{alt}</figcaption>
      </figure>
    </dialog>, document.body)}
  </>;
}
