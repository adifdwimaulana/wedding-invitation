import { $ } from './env';

const FALLBACK = 'Tamu Undangan';

/**
 * Read the guest name from ?to=. Stays client-side on purpose: reading it
 * during the render would make the query string part of the CDN cache key and
 * defeat caching for the one page every guest loads.
 */
function parseGuest(): string {
  try {
    const raw = new URLSearchParams(window.location.search).get('to');
    if (!raw) return FALLBACK;
    const clean = raw.replace(/\+/g, ' ').trim().slice(0, 60);
    return clean || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export const GUEST = parseGuest();
export const IS_NAMED_GUEST = GUEST !== FALLBACK;

export function initGuest(): void {
  const target = $('#guestName');
  if (target) target.textContent = GUEST;

  // Carried through to the RSVP record so a reply maps back to the invite sent.
  const hidden = $<HTMLInputElement>('#rsvpTamu');
  if (hidden) hidden.value = IS_NAMED_GUEST ? GUEST : '';
}
