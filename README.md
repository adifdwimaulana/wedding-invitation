# Undangan Pernikahan — Adif & Anggun

Single-file digital wedding invitation. No dependencies, no build step: `index.html` contains
all markup, CSS and JS inline. Fonts come from Google Fonts, images from a placeholder CDN.

**Minggu, 25 Oktober 2026 · Gedung Islamic Center Kraksaan, Probolinggo**

## Preview locally

```bash
python3 -m http.server 4321
```

Then open <http://localhost:4321/?to=Bapak+Budi+Santoso>.

Any static server works — the file also opens fine as `file://`, except `navigator.clipboard`,
which falls back to `document.execCommand("copy")` outside a secure context.

## Per-guest links

The cover reads the guest name from the `?to=` query string and falls back to
"Tamu Undangan" when it is missing.

```
https://your-domain.com/?to=Bapak+Budi+Santoso
https://your-domain.com/?to=Keluarga+Hartono
```

Spaces can be `+` or `%20`. The name is trimmed to 60 characters.

## Deploy

Drop the folder into any static host:

- **Netlify** — drag the folder onto the dashboard, or `netlify deploy --prod --dir .`
- **Vercel** — `vercel --prod`
- **GitHub Pages** — push, then enable Pages for the branch root

Afterwards update `og:url` and `og:image` in `<head>` so the WhatsApp link preview works.
`og:image` must be an absolute URL to a 1200×630 image.

## Before sending it out

Every spot needing real content is marked `[PLACEHOLDER]` in the source. Search for it.

- [ ] Cover, portrait and gallery photos (currently `picsum.photos` placeholders)
- [ ] Parents' names in **Mempelai** and **Penutup**
- [ ] Instagram handles, or delete the two `.ig` links
- [ ] Street address in **Lokasi**
- [ ] Bank name, account numbers and holders in **Amplop Digital**
- [ ] Physical gift address
- [ ] Background music track — self-host an MP3 rather than hotlinking
- [ ] `og:url` and `og:image`

## Wiring up RSVP and wishes

Both forms call clearly marked stub functions in the inline script and currently only
`console.log`. Replace their bodies with a real request:

- `submitRsvp(payload)` — payload is `{ nama, jumlah, kehadiran, tamuUndangan, waktu }`
- `submitWish(payload)` — payload is `{ nama, pesan, waktu }`

Each stub has commented examples for a Google Apps Script Web App and for Formspree.
Wishes are stored in memory only, so they disappear on reload until a backend is attached;
to show existing ones, fetch them on load and seed the `wishes` array before the first
`renderWishes()` call.

## Palette

Sage and olive over a warm off-white, with white cards as the anchoring accent and gold used
sparingly on dividers. Every colour is a custom property at the top of the `<style>` block, so
retinting the whole site means editing that one block.

The `.invert` class flips a section to dark olive by redefining those same variables locally
rather than restyling each component. It is currently on the countdown section and the footer;
adding it to any other `<section>` will just work.

## Motion

- Fade-up reveals via `IntersectionObserver`, with staggered delays inside any element marked
  `data-stagger="<ms>"`
- Gentle vertical parallax on the two portraits (`data-parallax="<px>"`), throttled with
  `requestAnimationFrame` and only computed for photos currently on screen
- Countdown digits roll up from zero the first time the grid scrolls into view, then hand off
  to the live one-second ticker
- Slow ken-burns drift on the cover photo, and dividers that draw themselves in

All of it collapses to a static page under `prefers-reduced-motion: reduce`.

## Notes

- Photos are full colour, with a slight saturation lift and an olive gradient wash on hover
  in the gallery.
- Built mobile-first for WhatsApp's in-app browser: no framework payload, `:has()` has a JS
  fallback, clipboard has an `execCommand` fallback, and safe-area insets are respected.
