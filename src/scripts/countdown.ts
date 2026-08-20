import { $, REDUCED } from './env';

interface Parts { d: number; h: number; m: number; s: number }

const pad = (n: number) => String(n).padStart(2, '0');

export function initCountdown(): void {
  const grid = $<HTMLElement>('#countdown');
  const done = $('#cdDone');
  const cells = {
    d: $('#cdD'),
    h: $('#cdH'),
    m: $('#cdM'),
    s: $('#cdS'),
  };
  if (!grid || !done || !cells.d || !cells.h || !cells.m || !cells.s) return;

  // The target comes from the rendered markup rather than a second literal in
  // this file, so the build and the client cannot disagree about the date.
  const target = new Date(grid.dataset.start ?? '').getTime();
  if (Number.isNaN(target)) return;

  let timer: number | undefined;

  const remaining = (): Parts | null => {
    const diff = target - Date.now();
    if (diff <= 0) return null;
    const s = Math.floor(diff / 1000);
    return {
      d: Math.floor(s / 86400),
      h: Math.floor(s / 3600) % 24,
      m: Math.floor(s / 60) % 60,
      s: s % 60,
    };
  };

  const paint = (p: Parts) => {
    cells.d!.textContent = pad(p.d);
    cells.h!.textContent = pad(p.h);
    cells.m!.textContent = pad(p.m);
    cells.s!.textContent = pad(p.s);
  };

  const finish = () => {
    grid.setAttribute('hidden', '');
    done.removeAttribute('hidden');
    if (timer) window.clearInterval(timer);
  };

  const tick = () => {
    const p = remaining();
    if (!p) { finish(); return; }
    paint(p);
  };

  const runLive = () => {
    tick();
    timer ??= window.setInterval(tick, 1000);
  };

  // Digits roll up from zero once, then hand over to the live ticker.
  const rollUp = () => {
    const goal = remaining();
    if (!goal) { finish(); return; }
    if (REDUCED) { runLive(); return; }

    const DURATION = 1200;
    let t0: number | null = null;

    const frame = (now: number) => {
      t0 ??= now;
      const p = Math.min(1, (now - t0) / DURATION);
      const eased = 1 - (1 - p) ** 3;
      paint({
        d: Math.round(goal.d * eased),
        h: Math.round(goal.h * eased),
        m: Math.round(goal.m * eased),
        s: Math.round(goal.s * eased),
      });
      if (p < 1) requestAnimationFrame(frame);
      else runLive();
    };
    requestAnimationFrame(frame);
  };

  if (REDUCED || !('IntersectionObserver' in window)) {
    runLive();
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return;
      io.disconnect();
      rollUp();
    },
    { threshold: 0.35 },
  );
  io.observe(grid);
}
