# Undangan Pernikahan — Adif & Anggun

Digital wedding invitation for **Adif Dwi Maulana & Anggun Ika Widhiyanti**, Sunday 25 October 2026 at Gedung Islamic Center Kraksaan, Probolinggo.

Built with Astro 7 and deployed to Netlify. RSVP replies and guestbook wishes persist in Netlify Blobs. `SPEC.md` documents the architecture and the reasoning behind it; this file covers how to run and edit it.

---

## Running locally

Requires Node 22.12 or newer.

```bash
npm install
npm run dev          # netlify dev — http://localhost:8888
```

**Use `npm run dev`, not `astro dev`.** Netlify Blobs, the image CDN and the deployed function environment only exist under `netlify dev`. Under plain `astro dev` the guestbook shows "Buku tamu belum tersedia" and every image returns 404.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Full local stack: Blobs, actions, image CDN |
| `npm run dev:astro` | Astro alone — fine for pure styling work |
| `npm run build` | Production build into `dist/` |
| `npm run check` | Type-check every `.astro` and `.ts` file |

---

## Per-guest links

The cover greets each guest by name, read from the `?to=` query parameter:

```
https://your-site.netlify.app/?to=Bapak%20Budi%20Santoso
https://your-site.netlify.app/?to=Keluarga%20Bapak%20Hartono
```

Spaces may be `%20` or `+`. Without the parameter the cover falls back to "Tamu Undangan". The name is also attached to that guest's RSVP record, so a reply maps back to the invitation you sent.

The parameter is read on the client rather than during render, deliberately: reading it server-side would make the query string part of the CDN cache key and defeat caching on the one page every guest loads.

---

## Editing content

Nearly all copy lives in one file: **`src/data/wedding.ts`**. Names, parents, dates, venue, the Qur'an quote, bank accounts and the gift address are all there. Change a value once and the countdown, the calendar link and the printed times all follow, because they derive from the same three ISO timestamps.

Everything still needing real values is marked `[PLACEHOLDER]`. To find them all:

```bash
grep -rn "PLACEHOLDER\|\[Nama" src/ astro.config.mjs netlify.toml
```

Before sending invitations:

- [ ] Parents' names for both families
- [ ] Real Instagram handles, or delete the `instagram` lines to hide the links
- [ ] Real bank account numbers and holders, and the physical gift address
- [ ] `site` in `astro.config.mjs` set to the deployed URL — the WhatsApp link preview needs it absolute
- [ ] `public/og.jpg` at 1200×630 for that preview
- [ ] Real photos (see below)
- [ ] Verify the Google Maps embed points at the right building

---

## Photos and audio

Both are still placeholders.

**Photos** come from `picsum.photos`, so the couple currently appear as random stock images. To swap in real ones, drop the files into `src/assets/` and import them:

```astro
import cover from '../assets/cover.jpg';
<Image src={cover} alt="" />
```

A local import lets Astro infer dimensions and hash the filename for immutable caching. Once no remote images remain, delete `image.remotePatterns` from `astro.config.mjs` **and** the `[images]` block from `netlify.toml` — both are needed while the placeholders remain, and remote images fail with `403 Forbidden` if either is missing.

**Audio** is hotlinked from soundhelix.com. Self-host the real track at `public/audio/backsound.mp3` and point `MusicToggle.astro` at `/audio/backsound.mp3`.

---

## How RSVP and wishes are stored

Both forms submit through Astro Actions (`src/actions/index.ts`) to Netlify Blobs (`src/lib/blobs.ts`), one blob per record under an ISO-timestamped key.

One blob per record rather than appending to a shared array is deliberate. Blobs is last-write-wins on a key, so a read-modify-write against a single "all records" blob would silently drop submissions whenever two guests submit at once — exactly what happens in the minutes after you broadcast the invitation.

Reads are eventually consistent and can lag by up to a minute, so the guestbook renders as a deferred server island while the rest of the page stays static and CDN-cached. A guest sees their own wish immediately via an optimistic prepend.

### Reading the data

There is no admin page. Use the Netlify CLI:

```bash
netlify blobs:list rsvp
netlify blobs:get rsvp <key>
netlify blobs:list wishes
```

**This is the main practical gap.** Counting RSVPs means listing keys and fetching each one by hand. If you want a real count before invitations go out, say so and it can be built.

To delete an inappropriate wish: `netlify blobs:delete wishes <key>`.

---

## Deploying

```bash
netlify init      # first time only
git push          # Netlify builds from the repo
```

Netlify needs no environment variables for Blobs — the adapter wires them up. Astro generates an `ASTRO_KEY` for the server island automatically at build time.

`netlify.toml` sets `X-Robots-Tag: noindex, nofollow` and the page carries `<meta name="robots" content="noindex">`, so the invitation stays out of search results. That is obscurity, not access control: anyone with the link can open it, which matters because the page shows real bank account numbers.

---

## Design notes

- **Palette** — sage and olive over a warm off-white, with white cards as the anchoring accent. Every colour is a custom property in `src/styles/tokens.css`; the `.invert` class redefines those properties to re-skin a whole section to dark olive without touching component CSS.
- **Photos** are full colour, not filtered.
- **Motion** is medium-intensity: staggered fade-ups on scroll, parallax drift on the portraits, a ken-burns cover, countdown digits that roll up once, and dividers that draw themselves in. All of it collapses under `prefers-reduced-motion: reduce`.
- **Mobile-first**, and specifically tested for the WhatsApp in-app browser: a `:has()` fallback for the attendance pills, an `execCommand` clipboard fallback, and `env(safe-area-inset-*)` padding for notched devices.

Styles are global rather than component-scoped on purpose. The design relies on selectors that cross component boundaries — `.invert .btn`, `.in .rule--short` — which Astro's scoped styles would break.

---

## What is verified and what is not

Verified locally under `netlify dev`: guest-name injection, both form submissions, validation messages, honeypot rejection, guestbook persistence and ordering, XSS safety (a stored `<img src=x onerror=…>` payload renders as inert text), the countdown, the lightbox including scroll restoration, the gift panel, clipboard copy, and bottom-nav scroll spying. Astro's own audit reports no accessibility or performance issues.

**Not yet verified:** the real WhatsApp link preview on iOS and Android, which needs a live deploy.
