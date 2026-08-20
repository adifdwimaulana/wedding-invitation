import { wedding, coupleNames } from '../data/wedding';

/** Google Calendar wants basic-format UTC: YYYYMMDDTHHMMSSZ */
function gcalStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Spans the whole day from the start of the akad to the end of the reception,
 * which is what a guest actually wants blocked out.
 */
export function googleCalendarUrl(): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Pernikahan ${coupleNames}`,
    dates: `${gcalStamp(wedding.akadStart)}/${gcalStamp(wedding.resepsiEnd)}`,
    details: `Akad Nikah ${wedding.akadTimeLabel}, Resepsi ${wedding.resepsiTimeLabel}.`,
    location: wedding.venueFull,
    ctz: 'Asia/Jakarta',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function mapsEmbedUrl(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(wedding.mapsEmbedQuery)}&output=embed`;
}
