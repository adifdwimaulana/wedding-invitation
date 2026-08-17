import { $$, REDUCED } from './env';

/** Give each child of [data-stagger] a growing transition delay. */
function applyStagger(root: ParentNode = document): void {
  $$<HTMLElement>('[data-stagger]', root).forEach((group) => {
    const step = Number.parseInt(group.dataset.stagger ?? '', 10) || 100;

    // A staggered group is either a set of .reveal children or (for the cover)
    // every direct child, animated by CSS.
    let kids: HTMLElement[] = $$<HTMLElement>(':scope > .reveal', group);
    if (!kids.length) kids = Array.from(group.children) as HTMLElement[];

    kids.forEach((el, i) => el.style.setProperty('--d', `${i * step}ms`));
  });
}

/**
 * Reveals elements as they scroll in. Exported so server-island content can
 * register its own nodes after the initial page script has already run.
 */
export function observeReveals(root: ParentNode = document): void {
  const targets = $$('.reveal, .amp-div, .rule--short', root);

  if (REDUCED || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
  );

  targets.forEach((el) => io.observe(el));
}

export function initReveal(): void {
  applyStagger();
  observeReveals();
}
