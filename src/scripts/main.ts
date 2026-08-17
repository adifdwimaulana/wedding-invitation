import { initClipboard } from './clipboard';
import { initCountdown } from './countdown';
import { initCover } from './cover';
import { initForms } from './forms';
import { initGifts } from './gifts';
import { initGuest } from './guest';
import { initLightbox } from './lightbox';
import { initMusic } from './music';
import { initNav } from './nav';
import { initParallax } from './parallax';
import { initReveal } from './reveal';
import { initShare } from './share';

// Astro <script> is type="module" and therefore deferred, so the DOM is already
// parsed by the time this runs.
initGuest();
initCover();
initMusic();
initReveal();
initParallax();
initCountdown();
initLightbox();
initGifts();
initClipboard();
initShare();
initForms();
initNav();
