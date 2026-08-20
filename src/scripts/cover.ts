import { $, REDUCED } from './env';
import { playMusic } from './music';

export function initCover(): void {
  const cover = $<HTMLElement>('#cover');
  const openBtn = $<HTMLButtonElement>('#openBtn');
  const nav = $('#bottomnav');
  const musicBtn = $('#music');
  if (!cover || !openBtn) return;

  // Trigger the cover's entrance once styles have settled.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => cover.classList.add('is-ready'));
  });

  let opened = false;

  openBtn.addEventListener('click', () => {
    if (opened) return;
    opened = true;

    cover.classList.add('is-gone');
    document.body.classList.remove('is-locked');
    nav?.classList.add('is-up');
    musicBtn?.classList.add('is-shown');

    // Autoplay is blocked until a user gesture, and this click is that gesture.
    playMusic();

    const quote = $('#quote');
    if (!quote) return;

    if (REDUCED) {
      quote.scrollIntoView();
    } else {
      // Let the cover start fading before scrolling, for a calmer transition.
      window.setTimeout(
        () => quote.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        180,
      );
    }
    window.setTimeout(() => cover.setAttribute('hidden', ''), 1100);
  });
}
