import type { RsvpRecord } from './blobs';

export interface RsvpSummary {
  responses: number;
  attending: number;
  notAttending: number;
  unsure: number;
  /** Head count from guests who said Hadir, not the number of replies. */
  attendingGuests: number;
  unsureGuests: number;
  /**
   * True when at least one guest picked "5 orang atau lebih", which caps at 5
   * and makes the head counts a lower bound rather than exact.
   */
  hasOpenEnded: boolean;
}

const OPEN_ENDED = 5;

export function summarise(rsvps: RsvpRecord[]): RsvpSummary {
  const summary: RsvpSummary = {
    responses: rsvps.length,
    attending: 0,
    notAttending: 0,
    unsure: 0,
    attendingGuests: 0,
    unsureGuests: 0,
    hasOpenEnded: false,
  };

  for (const r of rsvps) {
    if (r.jumlah >= OPEN_ENDED && r.kehadiran !== 'Tidak Hadir') summary.hasOpenEnded = true;

    if (r.kehadiran === 'Hadir') {
      summary.attending++;
      summary.attendingGuests += r.jumlah;
    } else if (r.kehadiran === 'Tidak Hadir') {
      summary.notAttending++;
    } else {
      summary.unsure++;
      summary.unsureGuests += r.jumlah;
    }
  }

  return summary;
}
