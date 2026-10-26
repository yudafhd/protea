export type WizardGiftAccount = {
  bank: string;
  number: string;
  holder: string;
  isDemo?: boolean;
};

export type WizardGoogleForm = {
  url: string;
  fields: { name: string; attendance: string; guests: string; message: string };
  attendanceLabels: { yes: string; no: string };
};

export const WIZARD_CONTENT = {
  bride: 'Putri',
  groom: 'Yuda',
  date: '2026-11-02',
  dateLabel: 'Senin, 2 November 2026',
  dateParts: ['02', '11', '26'],
  address: 'Jalan Empu Sendok No. 5',
  city: 'Sooko, Mojokerto',
  mapsUrl: 'https://maps.app.goo.gl/JRXDjYGB8LeEy6cB8',
  googleForm: {
    url: 'https://docs.google.com/forms/d/e/1FAIpQLScdN9JIZicJ7lEwJkB0CC-NGS3hFvW2Y1xIaKFOKJdklwaPBQ/viewform',
    fields: { name: 'entry.986528962', attendance: 'entry.877086558', guests: 'entry.1498135098', message: 'entry.2606285' },
    attendanceLabels: { yes: 'Ya, saya akan hadir', no: 'Maaf, saya tidak bisa hadir' },
  } satisfies WizardGoogleForm,
  introduction: 'Atas Rahmat Tuhan Yang Maha Esa, kami bermaksud mengundang Anda di acara Kami. Merupakan suatu kehormatan dan kebahagiaan bagi kami sekeluarga, apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
  quote: 'Dan di antara tanda-tanda kebesaran-Nya, Dia menciptakan pasangan untukmu agar kamu merasa tenteram.',
  partnerProfiles: {
    groom: {
      fullName: 'Ahmad Yuda Fahrudin',
      relationship: 'Putra dari',
      father: 'Bpk Yusuf Wibisono',
      mother: 'Ibu Siti Romadoni',
    },
    bride: {
      fullName: 'Rischyanti Putri Octavia',
      relationship: 'Putri dari',
      father: 'Alm. Bpk Sugeng Utomo',
      mother: 'Ibu Sulastri',
    },
  },
  giftAccounts: [
    { bank: 'BCA', number: '1070071661', holder: 'AHMAD YUDA FAHRUDIN' },
  ] as WizardGiftAccount[],
  events: [
    { id: 'akad', title: 'Akad Nikah', time: '09.00 – 10.00 WIB', start: '2026-11-02T09:00:00+07:00', end: '2026-11-02T10:00:00+07:00', note: '' },
    { id: 'resepsi', title: 'Resepsi', time: '18.00 WIB', start: '2026-11-02T11:00:00+07:00', end: '2026-11-02T14:00:00+07:00', note: '' },
  ],
};

export type WizardContent = Omit<typeof WIZARD_CONTENT, 'googleForm'> & { googleForm?: WizardGoogleForm };

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function createWizardCalendar(content: WizardContent = WIZARD_CONTENT) {
  const utc = (value: string) => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Protea//Wizard Wedding//ID', 'CALSCALE:GREGORIAN'];
  for (const event of content.events) {
    lines.push('BEGIN:VEVENT', `UID:wizard-${content.date}-${encodeURIComponent(content.groom)}-${encodeURIComponent(content.bride)}-${event.id}@protea.local`, 'DTSTAMP:20261025T000000Z',
      `DTSTART:${utc(event.start)}`, `DTEND:${utc(event.end)}`,
      `SUMMARY:${escapeCalendarText(`${event.title} — ${content.groom} & ${content.bride}`)}`,
      `LOCATION:${escapeCalendarText(`${content.address}, ${content.city}`)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  // RFC 5545 folds content lines at 75 UTF-8 octets; continuation starts with a space.
  const encoder = new TextEncoder();
  return lines.map((line) => {
    const parts: string[] = [];
    let part = '';
    let bytes = 0;
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (bytes + size > 75) { parts.push(part); part = ' '; bytes = 1; }
      part += character;
      bytes += size;
    }
    parts.push(part);
    return parts.join('\r\n');
  }).join('\r\n') + '\r\n';
}
