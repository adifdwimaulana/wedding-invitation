import { $ } from './env';

let timer: number | undefined;

export function toast(message: string): void {
  const el = $('#toast');
  if (!el) return;

  el.textContent = message;
  el.classList.add('is-shown');

  window.clearTimeout(timer);
  timer = window.setTimeout(() => el.classList.remove('is-shown'), 2200);
}
