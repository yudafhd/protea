import type { Metadata } from 'next';
import WizardGuestListing from '@/components/wizard/WizardGuestListing';

export const metadata: Metadata = {
  title: 'Daftar Tamu — Yuda & Putri | Protēa',
  robots: { index: false, follow: false },
};

export default function WizardListingPage() {
  return <WizardGuestListing />;
}
