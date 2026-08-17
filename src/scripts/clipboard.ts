import { $$ } from './env';
import { toast } from './toast';

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  // Fallback for WhatsApp's in-app browser and older WebViews.
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);

  if (!ok) throw new Error('copy failed');
}

export function initClipboard(): void {
  $$<HTMLButtonElement>('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const source = document.getElementById(btn.dataset.copy ?? '');
      if (!source) return;

      const text = (source.textContent ?? '').replace(/\s+/g, ' ').trim();
      const original = btn.textContent ?? 'Salin';

      try {
        await copyText(text);
        btn.textContent = 'Tersalin';
        toast(`${btn.dataset.label ?? 'Teks'} tersalin`);
        window.setTimeout(() => { btn.textContent = original; }, 2000);
      } catch {
        toast('Gagal menyalin');
      }
    });
  });
}
