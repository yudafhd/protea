import type { Metadata, Viewport } from 'next';
import WizardInvitation from '@/components/wizard/WizardInvitation';

export const metadata: Metadata = {
  title: 'Yuda & Putri — A Love Beyond Magic | Protēa',
  description: 'Undangan pernikahan Yuda & Putri. Senin, 2 November 2026, Sooko, Mojokerto. Sebuah kisah cinta di antara dua dunia.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#efe3cd',
};

export default async function WizardPage({ searchParams }: {
  searchParams: Promise<{ to?: string | string[] }>;
}) {
  const { to } = await searchParams;
  const guestName = (Array.isArray(to) ? to[0] : to)?.trim().slice(0, 120) || 'Tamu Istimewa';
  return <WizardInvitation guestName={guestName} />;
}
