import { $ } from './env';

export function initGifts(): void {
  const toggle = $<HTMLButtonElement>('#giftToggle');
  const panel = $<HTMLElement>('#giftPanel');
  const label = $('#giftToggleText');
  if (!toggle || !panel || !label) return;

  toggle.addEventListener('click', () => {
    const open = panel.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    label.textContent = open ? 'Sembunyikan Rekening' : 'Tampilkan Rekening';
  });
}
