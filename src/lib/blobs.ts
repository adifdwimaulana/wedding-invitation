import { getStore } from '@netlify/blobs';

export interface RsvpRecord {
  id: string;
  nama: string;
  jumlah: number;
  kehadiran: string;
  /** The ?to= value the guest arrived with, so an RSVP maps back to an invite. */
  tamuUndangan: string | null;
  waktu: string;
}

export interface WishRecord {
  id: string;
  nama: string;
  pesan: string;
  waktu: string;
}

/**
 * An ISO timestamp prefix makes keys lexicographically sortable, so the read
 * path can order and page on key names alone instead of fetching every record
 * to look at its timestamp.
 */
function newKey(): string {
  return `${new Date().toISOString()}-${crypto.randomUUID()}`;
}

/**
 * getStore (rather than getDeployStore) is deliberate: this data has to
 * outlive deploys.
 */
const rsvpStore = () => getStore('rsvp');
const wishStore = () => getStore('wishes');

/**
 * One blob per record, never an append to a shared array.
 *
 * Netlify Blobs is last-write-wins on a key, so a read-modify-write against a
 * single "all records" blob would silently drop submissions whenever two
 * guests submit at the same time — which is exactly what happens in the
 * minutes after an invitation is broadcast.
 */
export async function putRsvp(input: {
  nama: string;
  jumlah: number;
  kehadiran: string;
  tamuUndangan: string | null;
}): Promise<RsvpRecord> {
  const record: RsvpRecord = { id: newKey(), ...input, waktu: new Date().toISOString() };
  await rsvpStore().setJSON(record.id, record);
  return record;
}

export async function putWish(input: { nama: string; pesan: string }): Promise<WishRecord> {
  const record: WishRecord = { id: newKey(), ...input, waktu: new Date().toISOString() };
  await wishStore().setJSON(record.id, record);
  return record;
}

/**
 * list() returns keys without values, so reading N wishes costs N+1 round
 * trips. Capping at the newest `limit` keeps that bounded, and the requests
 * run in parallel. If the guestbook ever outgrows this, compact old records
 * into an archive blob rather than raising the cap.
 */
export async function listWishes(limit = 50): Promise<WishRecord[]> {
  return listNewest(wishStore(), limit);
}

export async function countWishes(): Promise<number> {
  const { blobs } = await wishStore().list();
  return blobs.length;
}

/** Every RSVP, newest first. Unbounded — the admin page needs exact totals. */
export async function listRsvps(): Promise<RsvpRecord[]> {
  return listNewest(rsvpStore(), Infinity);
}

export async function listAllWishes(): Promise<WishRecord[]> {
  return listNewest(wishStore(), Infinity);
}

export async function deleteWish(key: string): Promise<void> {
  await wishStore().delete(key);
}

/**
 * Shared read path. list() returns keys without values, so reading N records
 * costs N+1 round trips; the gets run in parallel and keys sort by their ISO
 * timestamp prefix, so ordering never needs the values.
 */
async function listNewest<T extends object>(
  store: ReturnType<typeof getStore>,
  limit: number,
): Promise<T[]> {
  const { blobs } = await store.list();

  const newest = blobs
    .map((b) => b.key)
    .sort()
    .reverse()
    .slice(0, limit === Infinity ? undefined : limit);

  const records: (T | null)[] = await Promise.all(
    newest.map(async (key) => {
      try {
        return ((await store.get(key, { type: 'json' })) ?? null) as T | null;
      } catch {
        // A record deleted between list() and get() is not an error here.
        return null;
      }
    }),
  );

  return records.filter((record): record is T => record !== null);
}
