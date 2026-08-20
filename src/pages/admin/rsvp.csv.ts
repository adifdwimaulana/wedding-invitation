import type { APIRoute } from 'astro';
import { isAdmin } from '../../lib/auth';
import { listRsvps } from '../../lib/blobs';
import { csvResponse, toCsv } from '../../lib/csv';
import { adminTimeLabel } from '../../lib/time';

export const prerender = false;

export const GET: APIRoute = async ({ session }) => {
  if (!(await isAdmin(session))) {
    return new Response('Tidak diizinkan', { status: 401 });
  }

  const rsvps = await listRsvps();

  const body = toCsv(
    ['Nama', 'Jumlah', 'Kehadiran', 'Diundang Sebagai', 'Waktu (WIB)'],
    rsvps.map((r) => [r.nama, r.jumlah, r.kehadiran, r.tamuUndangan ?? '', adminTimeLabel(r.waktu)]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`rsvp-adif-anggun-${stamp}.csv`, body);
};
