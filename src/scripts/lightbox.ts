import { $, $$ } from './env';

export function initLightbox(): void {
  const lb = $<HTMLElement>('#lightbox');
  const img = $<HTMLImageElement>('#lbImg');
  const close = $<HTMLButtonElement>('#lbClose');
  if (!lb || !img || !close) return;

  let lastFocus: HTMLElement | null = null;
  let lockedAt = 0;

  const open = (source: HTMLImageElement) => {
    lastFocus = document.activeElement as HTMLElement | null;
    img.src = source.currentSrc || source.src;
    img.alt = source.alt || '';
    lb.classList.add('is-open');

    // Making the viewport unscrollable resets its offset, so remember it.
    lockedAt = window.scrollY || 0;
    document.body.classList.add('is-locked');
    close.focus();
  };

  const dismiss = () => {
    lb.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    // "instant" overrides the page-level scroll-behavior: smooth.
    window.scrollTo({ top: lockedAt, behavior: 'instant' });
    lastFocus?.focus({ preventScroll: true });

    // removeAttribute, not src = "": an empty src would resolve to the page URL
    // and trigger a spurious request.
    window.setTimeout(() => {
      if (!lb.classList.contains('is-open')) img.removeAttribute('src');
    }, 400);
  };

  $$<HTMLButtonElement>('#gallery .gitem').forEach((btn) => {
    btn.addEventListener('click', () => {
      const source = btn.querySelector('img');
      if (source) open(source);
    });
  });

  close.addEventListener('click', dismiss);
  lb.addEventListener('click', (e) => {
    if (e.target === lb || e.target === img) dismiss();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lb.classList.contains('is-open')) dismiss();
  });
}
