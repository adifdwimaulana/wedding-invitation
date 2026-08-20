import { $ } from './env';
import { copyText } from './clipboard';
import { GUEST, IS_NAMED_GUEST } from './guest';
import { toast } from './toast';

export function initShare(): void {
  const btn = $<HTMLButtonElement>('#shareBtn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const url = new URL(window.location.href);
    url.hash = '';
    // Keep the current guest's personalised parameter on the shared link.
    if (IS_NAMED_GUEST) url.searchParams.set('to', GUEST);
    const link = url.toString();

    const text = 'Undangan Pernikahan Adif & Anggun \u2014 Minggu, 25 Oktober 2026';

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Undangan Pernikahan Adif & Anggun', text, url: link });
      } catch {
        // User dismissed the share sheet.
      }
      return;
    }

    try {
      await copyText(link);
      toast('Tautan tersalin');
    } catch {
      toast('Gagal menyalin tautan');
    }
  });
}
