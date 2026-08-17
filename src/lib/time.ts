/**
 * Shared by the server island and the client, so a wish shows the same
 * timestamp whichever rendered it.
 *
 * The timezone is pinned: Netlify functions run in UTC, so without it every
 * server-rendered wish would read seven hours early.
 */
export function wishTimeLabel(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
