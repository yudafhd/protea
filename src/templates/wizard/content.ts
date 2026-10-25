export const WIZARD_CONTENT = {
  bride: 'Putri',
  groom: 'Yuda',
  date: '2026-11-02',
  dateLabel: 'Senin, 2 November 2026',
  dateParts: ['02', '11', '26'],
  address: 'Jalan Empu Sendok No. 5',
  city: 'Sooko, Mojokerto',
  introduction: 'Dengan penuh rasa syukur dan bahagia, kami mengundang Bapak/Ibu/Saudara/i untuk menjadi bagian dari hari istimewa kami.',
  quote: 'Di antara begitu banyak dunia, kami menemukan rumah dalam satu sama lain.',
  events: [
    { id: 'akad', title: 'Akad Nikah', time: '09.00 – 10.00 WIB', start: '2026-11-02T09:00:00+07:00', end: '2026-11-02T10:00:00+07:00', note: 'Sebuah janji, untuk selamanya.' },
    { id: 'resepsi', title: 'Resepsi', time: '11.00 – 14.00 WIB', start: '2026-11-02T11:00:00+07:00', end: '2026-11-02T14:00:00+07:00', note: 'Merayakan cinta bersama orang terkasih.' },
  ],
};

export type WizardContent = typeof WIZARD_CONTENT;

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
