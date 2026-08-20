import type { APIRoute } from 'astro';
import { isAdmin } from '../../lib/auth';
import { listAllWishes } from '../../lib/blobs';
import { csvResponse, toCsv } from '../../lib/csv';
import { adminTimeLabel } from '../../lib/time';

export const prerender = false;

export const GET: APIRoute = async ({ session }) => {
  if (!(await isAdmin(session))) {
    return new Response('Tidak diizinkan', { status: 401 });
  }

  const wishes = await listAllWishes();

  const body = toCsv(
    ['Nama', 'Ucapan', 'Waktu (WIB)'],
    wishes.map((w) => [w.nama, w.pesan, adminTimeLabel(w.waktu)]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`ucapan-adif-anggun-${stamp}.csv`, body);
};
