import type { Metadata } from 'next';
import InvitationCatalog from '@/components/catalog/InvitationCatalog';

export const metadata: Metadata = {
  title: 'Protēa — Undangan Pernikahan Spasial & Sinematik',
  description: 'Koleksi undangan pernikahan digital generasi baru. Eksplorasi tema Woodland Reverie, Enchanted Vows, Botanical Reverie, dan Modern Vow.',
};

export default function CatalogPage() {
  return <InvitationCatalog />;
}
