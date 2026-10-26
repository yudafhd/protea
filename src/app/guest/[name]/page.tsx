import WizardInvitation from '@/components/wizard/WizardInvitation';

export { metadata, viewport } from '../../templates/wizard/page';

export default async function GuestPage({ params }: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  let decodedName = name;
  try {
    decodedName = decodeURIComponent(name);
  } catch {
    // Keep literal percent signs when a name is not URI-encoded.
  }
  const guestName = decodedName.trim().replace(/\s+/gu, ' ').slice(0, 120)
    .toLocaleLowerCase('id-ID')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('id-ID'));

  return <WizardInvitation guestName={guestName || 'Tamu Istimewa'} />;
}
