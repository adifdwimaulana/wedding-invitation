import { $$, REDUCED } from './env';

/**
 * Gives the image enough overflow to slide without exposing a gap at the edge
 * of its frame.
 */
const SCALE = 1.14;

interface Layer {
  el: HTMLElement;
  frame: Element;
  amount: number;
  onScreen: boolean;
}

export function initParallax(): void {
  if (REDUCED || !('IntersectionObserver' in window)) return;

  const layers: Layer[] = $$<HTMLElement>('[data-parallax]')
    .filter((el) => el.parentElement !== null)
    .map((el) => {
      // Applied up front, otherwise the image visibly jumps from its CSS scale
      // to the parallax scale on first intersection.
      el.style.transform = `translate3d(0,0,0) scale(${SCALE})`;
      return {
        el,
        frame: el.parentElement!,
        amount: Number.parseFloat(el.dataset.parallax ?? '') || 20,
        onScreen: false,
      };
    });

  if (!layers.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const layer = layers.find((l) => l.frame === entry.target);
        if (layer) layer.onScreen = entry.isIntersecting;
      }
    },
    { rootMargin: '20% 0px 20% 0px' },
  );
  layers.forEach((l) => io.observe(l.frame));

  let queued = false;

  // All reads happen before any writes, to avoid layout thrash.
  const apply = () => {
    queued = false;
    const vh = window.innerHeight;

    const offsets = layers
      .filter((l) => l.onScreen)
      .map((l) => {
        const r = l.frame.getBoundingClientRect();
        // -1 when the frame sits below the fold, +1 once it is above.
        const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        return { layer: l, y: Math.max(-1, Math.min(1, progress)) * l.amount };
      });

    for (const { layer, y } of offsets) {
      layer.el.style.transform = `translate3d(0,${y.toFixed(1)}px,0) scale(${SCALE})`;
    }
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(apply);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  apply();
}
