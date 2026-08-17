# Migrasi ke Astro — Undangan Pernikahan Adif & Anggun

**Status:** Draft
**Project:** `wedding-invitation`
**Source of truth today:** a single self-contained `index.html` (~1,790 lines, inline CSS + one IIFE)
**Target:** Astro 7 static site on Netlify, with RSVP and guestbook persisted in Netlify Blobs
**Verified against:** Astro docs as of 17 August 2026 (see §14 for references)

Bracketed values like `[Nama Ayah]` are content placeholders that already exist in `index.html`. They stay placeholders through this migration; filling them in is a separate task.

---

## 1. Purpose

The current invitation works and is deliberately dependency-free. Migrating it to Astro buys three things it cannot have as one static file:

1. **Durable RSVP and guestbook data.** Today both forms call stub functions that only `console.log`. Nothing is stored, and wishes vanish on reload.
2. **Maintainable structure.** One 1,790-line file mixes twelve sections, a design system, and seven behaviours. Editing the countdown means scrolling past the gallery.
3. **Real image optimization.** Eight gallery photos plus two portraits plus a cover are currently unprocessed remote URLs.

What it must not cost: the page is opened by a few hundred guests, most of them inside WhatsApp's in-app browser on a phone. It has to stay fast, and it has to look byte-for-byte identical when the migration lands.

---

## 2. Goals and non-goals

### Goals

- Visual and behavioural parity with the current `index.html`. A guest should not be able to tell the difference.
- RSVP submissions and guestbook wishes persisted durably and race-free.
- Wishes visible to other guests without a redeploy.
- The invitation itself stays statically prerendered and CDN-cached. Only the guestbook list and the two form endpoints touch the server.
- One typed content module drives every piece of copy, so the date cannot say October in one place and November in another.
- Motion, `prefers-reduced-motion` handling, and the WhatsApp in-app browser fallbacks (`:has()`, clipboard) all survive intact.

### Non-goals (this migration)

- **Admin page.** Explicitly out of scope per decision. See §11.4 for how to read submissions in the meantime, and understand that this leaves a real gap.
- Multi-page routing. It stays a single scrolling page.
- Guest accounts, seating charts, live stream, wallet passes.
- Changing the design. Sage and olive palette, typography, and section order are frozen.
- A no-JavaScript form fallback. The current site already requires JS to submit; §8.2 explains the trade-off and what it would cost to add.
- Per-guest invite link generation tooling. The `?to=` parameter keeps working exactly as it does now.

---

## 3. Current state

What exists in `index.html` today, so the port has a checklist.

| Concern | Current implementation |
| --- | --- |
| Sections | 12, in fixed order: cover, quote, mempelai, save-the-date, acara, lokasi, galeri, RSVP, ucapan, hadiah, penutup, footer |
| Styling | ~800 lines of inline CSS, all colour via custom properties on `:root`, plus an `.invert` class that re-declares those properties to flip a section to dark olive |
| Behaviour | One IIFE: guest name from `?to=`, cover unlock, audio toggle, `IntersectionObserver` reveals, stagger delays, parallax, countdown, calendar link, lightbox, RSVP, guestbook, clipboard, share, nav scroll-spy |
| Data | None. `submitRsvp()` and `submitWish()` are marked stubs. `wishes` is an in-memory array |
| Images | 11 remote `picsum.photos` placeholders, unoptimized |
| Fonts | Playfair Display + Inter from Google Fonts |
| Audio | One hotlinked placeholder MP3 |
| Placeholders | 17 `[PLACEHOLDER]` markers |

---

## 4. Target stack

Pinned deliberately. Astro 7 changed enough that a spec written from 2024 knowledge would be wrong in at least six places (§12).

| Package | Version | Why |
| --- | --- | --- |
| `astro` | `^7.2.2` | Current stable, shipped 13 Aug 2026 |
| `@astrojs/netlify` | `^8.2.1` | Required for Actions and server islands |
| `@netlify/blobs` | latest | Storage. Astro's own Actions docs use it |
| Node | `>=22.12.0` | Hard requirement since Astro 6 |

No CSS framework. The existing hand-written CSS is already token-driven and smaller than a framework runtime; that reasoning has not changed.

No ORM, no `@astrojs/db` — **that package was removed from Astro in 7.0** (§12.1).

### 4.1 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://[deployed-domain]',
  adapter: netlify(),
  output: 'static',

  // Astro 7 defaults this to 'jsx', which strips whitespace between inline
  // elements. Our markup relies on HTML whitespace collapsing. See §12.3.
  compressHTML: true,

  image: {
    layout: 'constrained',
    // We style images ourselves; leaving this true would fight our CSS.
    responsiveStyles: false,
    // Only needed while picsum placeholders remain. Delete with them.
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
});
```

---

## 5. Project structure

```
astro.config.mjs
netlify.toml
public/
  audio/backsound.mp3            # self-hosted, replaces the hotlinked URL
src/
  assets/                        # real photos, processed by astro:assets
    cover.jpg
    adif.jpg
    anggun.jpg
    gallery/01.jpg … 08.jpg
  actions/index.ts               # rsvp + wish actions
  components/
    Cover.astro
    Quote.astro
    Couple.astro
    Person.astro                 # takes a Person from the content module
    SaveTheDate.astro
    Countdown.astro
    Events.astro
    Location.astro
    Gallery.astro
    Lightbox.astro
    RsvpForm.astro
    WishForm.astro
    Wishes.astro                 # server island — see §9
    WishesSkeleton.astro         # its fallback
    Gifts.astro
    Closing.astro
    BottomNav.astro
    MusicToggle.astro
    Toast.astro
  data/
    wedding.ts                   # typed single source of truth for all copy
  layouts/
    Base.astro                   # <head>, OG tags, global CSS, global scripts
  lib/
    blobs.ts                     # store accessors + record types
    format.ts                    # date/time helpers, gcal link builder
  pages/
    index.astro
  scripts/
    reveal.ts
    parallax.ts
    countdown.ts
    lightbox.ts
    music.ts
    clipboard.ts
    share.ts
    nav.ts
    guest.ts                     # ?to= parsing, shared by cover + share
    toast.ts
  styles/
    tokens.css                   # :root and .invert custom properties
    base.css                     # reset, typography, primitives
    components.css               # section-specific rules
```

### 5.1 Component mapping

Each of the 12 current sections maps to exactly one component, preserving order in `index.astro`. No section is split or merged. This keeps the diff reviewable: a reviewer can compare one component against one block of the old file.

---

## 6. Content model

A typed TS module, not a content collection. Content collections are built for querying many entries; there is exactly one wedding. A plain module gives full type inference with no loader indirection.

```ts
// src/data/wedding.ts
export interface Person {
  first: string;
  full: string;
  role: 'Mempelai Pria' | 'Mempelai Wanita';
  order: 'Putra pertama' | 'Putri pertama';
  father: string;
  mother: string;
  instagram?: string;
}

export const wedding = {
  groom: {
    first: 'Adif',
    full: 'Adif Dwi Maulana',
    role: 'Mempelai Pria',
    order: 'Putra pertama',
    father: '[Nama Ayah]',
    mother: '[Nama Ibu]',
  },
  bride: { /* Anggun Ika Widhiyanti … */ },

  // Single source of truth for every date calculation on the page.
  akadStart: new Date('2026-10-25T08:00:00+07:00'),
  resepsiStart: new Date('2026-10-25T10:00:00+07:00'),
  resepsiEnd: new Date('2026-10-25T14:00:00+07:00'),

  venue: 'Gedung Islamic Center Kraksaan',
  address: 'Jl. Raya Kraksaan, Kecamatan Kraksaan,\nKabupaten Probolinggo, Jawa Timur',
  mapsUrl: 'https://maps.app.goo.gl/9MVwx94iFbcXMCX17',
  mapsEmbedQuery: 'Gedung Islamic Center Kraksaan Probolinggo',

  gifts: [
    { bank: 'Bank BCA', number: '[Nomor Rekening]', holder: 'Adif Dwi Maulana' },
    { bank: 'DANA / E-Wallet', number: '[Nomor E-Wallet]', holder: 'Anggun Ika Widhiyanti' },
  ],
  giftAddress: '[Alamat lengkap]',
} as const;
```

Only the countdown needs these dates on the client. Pass the ISO string as a `data-` attribute rather than re-declaring it in a client script, so build and runtime cannot drift.

---

## 7. Rendering strategy

| Route / unit | Mode | Reason |
| --- | --- | --- |
| `src/pages/index.astro` | Prerendered (static) | Read by every guest. Must be CDN-cached |
| `Wishes` component | Server island (`server:defer`) | Needs fresh data on each view |
| `/_actions/rsvp`, `/_actions/wish` | On-demand (generated by Astro) | Writes |

`output: 'static'` with an adapter installed. The adapter is what makes Actions and server islands possible; it does not make the page dynamic.

The `?to=` guest name stays **client-side**. Reading it server-side would make the URL part of the cache key and defeat CDN caching for the one thing every guest loads. It is already client-side today; keep it.

---

## 8. Forms via Astro Actions

### 8.1 Action definitions

```ts
// src/actions/index.ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';                 // NOT astro:schema — see §12.5
import { putRsvp, putWish } from '../lib/blobs';

export const server = {
  rsvp: defineAction({
    accept: 'form',
    input: z.object({
      nama: z.string().trim().min(1).max(80),
      jumlah: z.coerce.number().int().min(1).max(10),
      kehadiran: z.enum(['Hadir', 'Tidak Hadir', 'Masih Ragu']),
      // Empty form fields arrive as null, not "". See §12.6.
      tamuUndangan: z.string().trim().max(80).nullable().default(null),
      honeypot: z.string().nullable().default(null),
    }),
    handler: async (input) => {
      if (input.honeypot) throw new ActionError({ code: 'BAD_REQUEST' });
      await putRsvp(input);
      return { ok: true };
    },
  }),

  wish: defineAction({
    accept: 'form',
    input: z.object({
      nama: z.string().trim().min(1).max(80),
      pesan: z.string().trim().min(1).max(500),
      honeypot: z.string().nullable().default(null),
    }),
    handler: async (input) => {
      if (input.honeypot) throw new ActionError({ code: 'BAD_REQUEST' });
      const wish = await putWish(input);
      // Returned so the client can prepend optimistically. See §9.2.
      return { ok: true, wish };
    },
  }),
};
```

The action name is `input`, not `inputSchema`.

### 8.2 Client wiring, and the no-JS trade-off

Submit from the client:

```ts
import { actions } from 'astro:actions';
const { data, error } = await actions.wish(new FormData(form));
```

This keeps `index.astro` prerendered.

The alternative — `<form method="POST" action={actions.wish}>` with `Astro.getActionResult()` — works without JavaScript, but requires `export const prerender = false` on the page, turning every guest's page load into a server render. For a page whose whole job is to be opened by hundreds of people from a WhatsApp link, that is the wrong trade. The current site already requires JS to submit, so this is parity, not a regression.

If a no-JS fallback is ever wanted, the honest cost is: page goes on-demand, plus the POST/Redirect/GET middleware pattern from Astro's Actions docs (without it, refresh re-prompts submission and results vanish on revisit).

Keep the existing UX: disabled button with `Mengirim…`, then swap the card for the thank-you state; toast on failure.

---

## 9. Storage — Netlify Blobs

### 9.1 Key design

Two site-wide stores, `rsvp` and `wishes`, via `getStore(name)` so data survives deploys (`getDeployStore()` would not).

**One blob per record.** Netlify Blobs is last-write-wins on a key, so a read-modify-write "append to one big JSON array" pattern would silently drop concurrent submissions — exactly what happens when a WhatsApp broadcast goes out and thirty people RSVP in the same minute.

```ts
// src/lib/blobs.ts
import { getStore } from '@netlify/blobs';

// ISO timestamp prefix makes keys lexicographically sortable, so the read
// path can order and page without fetching every record first.
const key = () => `${new Date().toISOString()}-${crypto.randomUUID()}`;

export interface WishRecord { id: string; nama: string; pesan: string; waktu: string; }

export async function putWish(input: { nama: string; pesan: string }) {
  const store = getStore('wishes');
  const id = key();
  const record: WishRecord = { id, ...input, waktu: new Date().toISOString() };
  await store.setJSON(id, record);
  return record;
}

export async function listWishes(limit = 50): Promise<WishRecord[]> {
  const store = getStore('wishes');
  const { blobs } = await store.list();
  const newest = blobs.map((b) => b.key).sort().reverse().slice(0, limit);
  const records = await Promise.all(newest.map((k) => store.get(k, { type: 'json' })));
  return records.filter(Boolean) as WishRecord[];
}
```

`list()` returns keys, not values, so reading N wishes costs N+1 round trips. Capping at the newest 50 keeps that bounded and parallel. If the guestbook ever outgrows that, compact old records into a single archive blob rather than raising the cap.

### 9.2 Consistency

Netlify Blobs is eventually consistent by default, with propagation guaranteed inside 60 seconds. Strong consistency is available per-store but costs latency on every read.

Decision: **eventual consistency, with an optimistic client-side prepend.** The guest who just submitted sees their own wish immediately because the action returns the record; everyone else sees it within a minute. For a guestbook that is invisible, and it keeps the island fast.

### 9.3 Record shapes

| Store | Fields |
| --- | --- |
| `rsvp` | `id`, `nama`, `jumlah`, `kehadiran`, `tamuUndangan`, `waktu` |
| `wishes` | `id`, `nama`, `pesan`, `waktu` |

`tamuUndangan` captures the `?to=` value the guest arrived with, which is how an RSVP gets matched back to the invite that was sent.

### 9.4 Reading the data without an admin page

Since an admin page is out of scope, submissions are reachable only through:

- `netlify blobs:list wishes` and `netlify blobs:get wishes <key>` from the Netlify CLI
- The Blobs browser in the Netlify dashboard

**This is a genuine gap.** Counting a few hundred RSVPs by clicking through a dashboard is not realistic, and there is no CSV export. Recommend a follow-up task for at least a single password-protected `/admin` route with a CSV download before invitations actually go out.

### 9.5 Abuse protection

The guestbook is a public, unauthenticated write endpoint on a URL that will be forwarded around WhatsApp.

- Honeypot field, hidden via CSS, rejected server-side (§8.1)
- Hard server-side length caps in the Zod schema — client validation is not a control
- Astro's action body limit defaults to 1 MB; no need to raise it
- If spam appears, add Netlify rate limiting on `/_actions/*` rather than building a captcha

---

## 10. Guestbook as a server island

```astro
---
// src/components/Wishes.astro
import { listWishes } from '../lib/blobs';
const wishes = await listWishes();
---
```

```astro
<!-- in index.astro -->
<Wishes server:defer>
  <WishesSkeleton slot="fallback" />
</Wishes>
```

Constraints that matter here:

- Props are encrypted into a GET query string; over ~2048 bytes Astro falls back to POST and **caching breaks**. Pass no props, or only a numeric limit.
- Set `ASTRO_KEY` (via `astro create-key`) so encrypted props survive rolling deploys and CDN-cached pages.
- `Astro.url` inside the island resolves to `/_server-islands/Wishes`, not the page URL.
- Island content is not in the initial HTML and is not crawler-visible. Irrelevant for a `noindex` invitation.

---

## 11. Porting the CSS and the JavaScript

### 11.1 CSS stays global, not scoped

Tempting to move each section's CSS into a scoped `<style>` in its component. **Do not.** The design system depends on selectors that cross component boundaries:

```css
.invert .btn--ghost { … }
.in .rule--short { … }
.pill:has(input:checked) { … }
```

Astro's scoped styles add a per-component attribute, so a rule written in `Countdown.astro` cannot match a `.btn` rendered by another component. Scoping would silently break the entire `.invert` mechanism — the single cleverest part of the current stylesheet.

Split into `tokens.css`, `base.css`, `components.css`, imported once from `Base.astro`. Same cascade, same output, three readable files.

### 11.2 JavaScript becomes modules

The single IIFE splits into `src/scripts/*.ts`, imported from one `<script>` in `Base.astro`. Astro `<script>` is `type="module"` and therefore deferred, so DOM queries at module top level are safe.

Shared state that the IIFE held in closure — `REDUCED`, the guest name, the toast helper — becomes explicit exports from `guest.ts` and `toast.ts`.

**Gotcha specific to the island:** the reveal `IntersectionObserver` is set up on page load, and server island content arrives after that, so island wishes would never be observed and would stay invisible. Fix: the wishes list renders visible with no reveal animation, and any island-local behaviour lives in a `<script>` inside `Wishes.astro`.

### 11.3 Behaviour parity checklist

Every one of these must survive, and each is a line item for review:

| Behaviour | Note |
| --- | --- |
| `?to=` guest name with fallback to `Tamu Undangan` | Client-side, 60-char cap |
| Cover unlock: scroll lock, nav reveal, music start | Autoplay needs the click gesture |
| Staggered reveals via `data-stagger` | |
| Portrait parallax, rAF-throttled, in-view only | Baseline scale set at init to avoid the jump |
| Countdown roll-up, then live tick | Must read the date from `data-` attr, not a duplicate literal |
| Google Calendar link | Verify stamps stay `20261025T010000Z/20261025T070000Z` |
| Lightbox with scroll-position save/restore | The restore fix must be carried over |
| Clipboard with `execCommand` fallback | Required for WhatsApp's in-app browser |
| Share via `navigator.share`, clipboard fallback | Preserves `?to=` |
| Nav scroll-spy | |
| `prefers-reduced-motion` disabling all of it | |
| `.pill.is-on` JS fallback for `:has()` | |

### 11.4 Images

Move the 11 placeholders to `src/assets/` and render with `<Image />` / `<Picture />` from `astro:assets`.

The cover photo is currently a CSS `background-image`, which `astro:assets` cannot optimize. Restructure `Cover.astro` to use an absolutely-positioned `<Image />` behind the existing overlay `div`, preserving the ken-burns animation on the image element instead of the background layer.

Netlify Image CDN is on by default with this adapter. Remote images still need the `image.remotePatterns` entry, which can be deleted once real photos land.

---

## 12. Astro 7 gotchas that will bite this port

Ordered by how badly each breaks things.

1. **`@astrojs/db` no longer exists.** Removed in Astro 7.0; Astro Studio shut down in 2025. Any plan involving Astro DB is dead. Netlify Blobs is the chosen answer.
2. **`output: 'hybrid'` is not a valid value.** Only `'static' | 'server'`. Per-route control is `export const prerender = false`.
3. **`compressHTML` defaults to `'jsx'`**, which collapses whitespace between inline elements — so `<span>a</span> <em>b</em>` can render as `ab`. Hand-written HTML being ported in will visibly break. Set `compressHTML: true` for the old HTML-aware behaviour.
4. **The Rust compiler is strict.** Unclosed tags are hard errors and invalid nesting is no longer auto-corrected. **Audit `index.html` before assuming it compiles** — in particular the `<p>` wrappers around buttons, which are currently used as layout hooks.
5. **Content config moved** to `src/content.config.ts` and every collection needs a `loader`. Not used here, but relevant if the gallery becomes a collection later.
6. **Zod 4.** Import from `astro/zod`; `astro:schema` is deprecated. `z.string().email()` became `z.email()`, `.nonempty()` became `.min(1)`, and `.default()` now must match the post-transform type.
7. **Empty form inputs arrive as `null`, not `""`.** Optional text fields need `.nullable()` or validation fails on blank submits.
8. **Node ≥ 22.12.0** locally, in CI, and in Netlify's build image.
9. **`Astro.glob()` is removed.** Use `import.meta.glob()`, which no longer returns a Promise.
10. **Actions do not do POST/Redirect/GET for free.** Only relevant if the no-JS path in §8.2 is ever adopted.
11. **`image.responsiveStyles` defaults to `false` and `image.layout` to `undefined`** — responsive images are opt-in twice.

---

## 13. Local development

Blobs are not available under plain `astro dev`. Use `netlify dev`, which provides a sandboxed local store.

That local store **cannot read production data**, so RSVPs submitted in dev never appear in the deployed site and vice versa. Expect to seed test wishes locally.

| Variable | Where from |
| --- | --- |
| `NETLIFY_BLOBS_CONTEXT` | Injected automatically by Netlify and `netlify dev` |
| `ASTRO_KEY` | `astro create-key`, set in Netlify env for stable server islands |

---

## 14. Functional requirements

| ID | Requirement |
| --- | --- |
| F1 | `index.astro` renders all 12 sections in the current order, visually identical to `index.html` at 320px, 390px, 768px, and 1280px |
| F2 | The page is prerendered; no server render on a normal guest visit |
| F3 | `?to=Nama` populates the cover; absent or empty falls back to `Tamu Undangan` |
| F4 | A valid RSVP writes exactly one blob to the `rsvp` store and shows the thank-you state |
| F5 | A valid wish writes exactly one blob to `wishes`, and the submitter sees it prepended immediately |
| F6 | Other guests see new wishes within 60 seconds without a redeploy |
| F7 | Thirty concurrent submissions produce thirty records, none lost |
| F8 | Invalid or over-length input is rejected server-side with a toast, not a crash |
| F9 | Honeypot submissions are rejected and not stored |
| F10 | Every behaviour in §11.3 works, including the clipboard fallback in an Android WebView |
| F11 | `prefers-reduced-motion: reduce` produces a static page with no parallax, reveals, or spinning icon |
| F12 | Countdown reaches zero gracefully and shows the "hari bahagia telah tiba" state |
| F13 | OG tags produce a correct WhatsApp preview card with an absolute `og:image` |
| F14 | Lighthouse mobile performance ≥ 90 on a throttled 4G profile |

---

## 15. Migration phases

Each phase ends at a committable, verifiable state. Do not collapse them — the point is that a regression is attributable to one phase.

| Phase | Work | Done when |
| --- | --- | --- |
| 0 | Audit `index.html` markup against the strict compiler (§12.4) | Known list of tags to fix |
| 1 | Scaffold Astro 7 + Netlify adapter, drop the whole HTML into one `index.astro`, split CSS into three files | Page renders identically; no components yet |
| 2 | Extract the 12 components and `wedding.ts` | Still identical; diff is pure moves |
| 3 | Split the IIFE into `src/scripts/*` | §11.3 checklist passes |
| 4 | `lib/blobs.ts` + both actions, wired to the existing forms | F4, F5, F7, F8, F9 pass |
| 5 | `Wishes` server island + `ASTRO_KEY` | F6 passes |
| 6 | Real photos via `astro:assets`, self-hosted audio, remove `remotePatterns` | F14 passes |
| 7 | Deploy, verify in real WhatsApp on both iOS and Android | F10, F13 pass |

Phase 1 and 2 are where visual regressions hide. Compare screenshots at all four breakpoints before moving on.

---

## 16. Open questions

1. **Admin access.** Out of scope here, but the couple cannot count RSVPs without it (§9.4). When does this become blocking — before invitations go out?
2. **Retention.** How long should RSVP data live after the wedding, and who deletes it? Blobs persist indefinitely.
3. **Wish moderation.** No approval queue is specified. A public guestbook on a forwarded link may need one. Delete-by-key via CLI is the only current remedy.
4. **Repo visibility.** The repo is private, which suits real bank numbers and addresses. Public GitHub Pages hosting would conflict with that; Netlify does not.

---

## 17. References

Verified 17 August 2026.

- [Astro Actions guide](https://docs.astro.build/en/guides/actions/) · [Actions API reference](https://docs.astro.build/en/reference/modules/astro-actions/)
- [Server islands](https://docs.astro.build/en/guides/server-islands/)
- [On-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Netlify adapter](https://docs.astro.build/en/guides/integrations-guide/netlify/)
- [Configuration reference](https://docs.astro.build/en/reference/configuration-reference/)
- [Upgrade to Astro v7](https://docs.astro.build/en/guides/upgrade-to/v7/) · [v6](https://docs.astro.build/en/guides/upgrade-to/v6/)
- [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
- [Goodbye Astro Studio](https://astro.build/blog/goodbye-astro-studio/)
- [Images guide](https://docs.astro.build/en/guides/images/)
