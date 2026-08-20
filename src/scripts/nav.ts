import { $$ } from './env';

export function initNav(): void {
  if (!('IntersectionObserver' in window)) return;

  const links = $$<HTMLAnchorElement>('#bottomnav a');
  if (!links.length) return;

  const byId = new Map<string, HTMLAnchorElement>();
  for (const a of links) {
    byId.set((a.getAttribute('href') ?? '').slice(1), a);
  }

  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) => a.classList.remove('is-active'));
        byId.get(entry.target.id)?.classList.add('is-active');
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );

  for (const id of byId.keys()) {
    const section = document.getElementById(id);
    if (section) spy.observe(section);
  }
}
