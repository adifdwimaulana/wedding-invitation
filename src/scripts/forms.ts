import { actions, isInputError } from 'astro:actions';
import { $ } from './env';
import { toast } from './toast';
import { wishTimeLabel } from '../lib/time';

/**
 * Called from the client rather than posting the form directly, which is what
 * keeps index.astro prerendered. See SPEC.md §8.2 for the trade-off against a
 * no-JavaScript fallback.
 */

/** Mirrors .pill state for browsers without :has() support. */
function initPills(): void {
  const pills = Array.from(document.querySelectorAll<HTMLLabelElement>('.pills .pill'));
  const sync = () =>
    pills.forEach((p) => {
      const radio = p.querySelector<HTMLInputElement>('input');
      p.classList.toggle('is-on', Boolean(radio?.checked));
    });

  pills.forEach((p) => p.querySelector('input')?.addEventListener('change', sync));
  sync();
}

function firstInputError(error: unknown): string | null {
  if (!isInputError(error)) return null;
  for (const messages of Object.values(error.fields)) {
    if (messages?.length) return messages[0]!;
  }
  return null;
}

function initRsvp(): void {
  const form = $<HTMLFormElement>('#rsvpForm');
  const card = $<HTMLElement>('#rsvpCard');
  const thanks = $<HTMLElement>('#rsvpThanks');
  const submit = $<HTMLButtonElement>('#rsvpSubmit');
  if (!form || !card || !thanks || !submit) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameField = $<HTMLInputElement>('#rsvpNama');
    if (!nameField?.value.trim()) {
      nameField?.focus();
      toast('Mohon isi nama');
      return;
    }

    submit.disabled = true;
    const label = submit.textContent ?? 'Kirim Konfirmasi';
    submit.textContent = 'Mengirim\u2026';

    const { error } = await actions.rsvp(new FormData(form));

    if (error) {
      toast(firstInputError(error) ?? 'Gagal mengirim, coba lagi');
      submit.disabled = false;
      submit.textContent = label;
      return;
    }

    card.setAttribute('hidden', '');
    thanks.removeAttribute('hidden');
    thanks.classList.add('in');
  });
}

/** Built with textContent so a guest's message can never be parsed as HTML. */
function wishElement(wish: { nama: string; pesan: string; waktu: string }): HTMLElement {
  const item = document.createElement('article');
  item.className = 'wish';

  const head = document.createElement('div');
  head.className = 'wish-head';

  const name = document.createElement('h3');
  name.className = 'wish-name';
  name.textContent = wish.nama;

  const time = document.createElement('span');
  time.className = 'wish-time';
  time.textContent = wishTimeLabel(wish.waktu);

  const body = document.createElement('p');
  body.className = 'wish-body';
  body.textContent = wish.pesan;

  head.append(name, time);
  item.append(head, body);
  return item;
}

function initWishes(): void {
  const form = $<HTMLFormElement>('#wishForm');
  const submit = $<HTMLButtonElement>('#wishSubmit');
  if (!form || !submit) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nameField = $<HTMLInputElement>('#wishNama');
    const messageField = $<HTMLTextAreaElement>('#wishPesan');
    if (!nameField?.value.trim()) { nameField?.focus(); toast('Mohon isi nama'); return; }
    if (!messageField?.value.trim()) { messageField?.focus(); toast('Mohon isi ucapan'); return; }

    submit.disabled = true;
    const label = submit.textContent ?? 'Kirim Ucapan';
    submit.textContent = 'Mengirim\u2026';

    const { data, error } = await actions.wish(new FormData(form));

    submit.disabled = false;
    submit.textContent = label;

    if (error || !data) {
      toast(firstInputError(error) ?? 'Gagal mengirim, coba lagi');
      return;
    }

    // The island reads eventually-consistent data and can lag by up to a
    // minute, so show the submitter their own wish straight away. These
    // elements are queried now, not at init, because the island renders late.
    const list = $<HTMLElement>('#wishList');
    const empty = $<HTMLElement>('#wishEmpty');
    const count = $<HTMLElement>('#wishCount');

    if (list) {
      empty?.setAttribute('hidden', '');
      list.prepend(wishElement(data.wish));
    }
    if (count) {
      count.textContent = String((Number.parseInt(count.textContent ?? '0', 10) || 0) + 1);
    }

    form.reset();
    toast('Ucapan terkirim');
  });
}

export function initForms(): void {
  initPills();
  initRsvp();
  initWishes();
}
