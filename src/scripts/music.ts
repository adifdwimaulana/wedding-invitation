import { $ } from './env';

function els() {
  return {
    audio: $<HTMLAudioElement>('#audio'),
    button: $<HTMLButtonElement>('#music'),
  };
}

export function playMusic(): void {
  const { audio, button } = els();
  if (!audio || !button) return;

  audio.play().then(
    () => {
      button.classList.add('is-playing');
      button.setAttribute('aria-pressed', 'true');
    },
    () => {
      // Blocked by the browser. Leave it to the user to press the toggle.
      button.classList.remove('is-playing');
      button.setAttribute('aria-pressed', 'false');
    },
  );
}

export function pauseMusic(): void {
  const { audio, button } = els();
  if (!audio || !button) return;

  audio.pause();
  button.classList.remove('is-playing');
  button.setAttribute('aria-pressed', 'false');
}

export function initMusic(): void {
  const { audio, button } = els();
  if (!audio || !button) return;

  button.addEventListener('click', () => {
    if (audio.paused) playMusic();
    else pauseMusic();
  });
}
