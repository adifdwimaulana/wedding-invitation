import { ADMIN_PASSWORD } from 'astro:env/server';
import type { AstroSession } from 'astro';

export const ADMIN_SESSION_KEY = 'isAdmin';

/**
 * Compares SHA-256 digests instead of the raw strings so the loop always runs
 * over 32 bytes. A plain `===` on the passwords would return as soon as it hit
 * a differing character, leaking the length of the shared prefix.
 */
export async function verifyPassword(candidate: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(candidate), sha256(ADMIN_PASSWORD)]);

  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

export async function isAdmin(session: AstroSession | undefined): Promise<boolean> {
  if (!session) return false;
  return (await session.get<boolean>(ADMIN_SESSION_KEY)) === true;
}
