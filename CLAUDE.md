# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Astro dev server (localhost:4321)
npm run build     # Build static site to dist/
npm run preview   # Serve the built dist/ locally
```

There are no test or lint commands — this is a static site.

## Architecture

Personal site at [mahanin.com](https://mahanin.com), built with Astro (static output). Two pages:

- `src/pages/index.astro` — the hub, styled as "Mahanin OS 94": a retro desktop with a skippable boot screen, 1 reachable draggable window (`contact`) plus 4 parked ones (`welcome`, `char`, `projects`, `winamp` — rendered and styled but unreachable: no `APPS` entry, so no icon, mobile row, start-menu row or quick-menu row; restore one by re-adding its `APPS` entry), a single-column desktop icon grid, taskbar with start menu, and a shutdown screen. There is no right-click context menu and the wallpaper is fixed — both were removed once their only items were wallpaper cycling and an opener for the readme window. **No window opens at startup** — the desktop lands bare and onboarding is a hand-drawn doodle (SVG arrow + "HR start here" scrawl) pinned to the resume icon. `welcome.exe` was the Mint-style first-visit panel; it is now parked, and its "show at startup" checkbox plus the `localStorage['os94-welcome']` key are gone. Mobile (<760px) swaps the icon grid for a list menu and makes windows full-screen.
- The doodle is driven by a `doodle` string on an `APPS` entry (only `resume` has one) and rendered *inside* the icon `<a>`, positioned against `.icon { position: relative }` — never against grid coordinates, since icon heights vary with label line count. It is `pointer-events: none` (clicks fall through to the icon link) and `display: none` below 960px, where `.desktop-readme` hugs its 140px left bound and would collide. The icon grid renders it; the mobile menu and start menu ignore it.
- The bio (`.desktop-readme`) is **not** a window — it renders straight onto the desktop, centred between the icon column and the widgets, and carries the page's only `<h1>`. Nothing covers it any more: it is the first thing on screen after boot. On mobile the block reflows below the menu rows (see invariant 8).
- `src/pages/resume/index.astro` — the resume, printable to PDF via the "Save as PDF" button
- `src/layouts/Base.astro` — shared head/meta shell; pages pass title/description/canonical/og props; a named `head` slot lets pages inject extras (the hub uses it for font preloads)
- `src/components/os94/Window.astro` — the window chrome (title bar, min/close buttons, body variants) used 5× by the hub; geometry arrives as CSS custom properties (`--x/--y/--w/--h/--z`)
- `src/components/os94/StickyNote.astro` — one desktop sticky note. Props: `label` (defaults to `STICKY NOTE`; pass `label=""` to drop the header), `sign` (omit for no signature line), `tint` (`mint` | `pink`, default yellow), `w`, `rotate`, and any of `top`/`right`/`bottom`/`left` — only the sides you pass are emitted, so a note can hang off any corner. Body is the default slot. Add more notes by adding more `<StickyNote>` calls inside `.widgets`; they do not auto-tile, so give each one its own coordinates.
- `src/components/os94/AppIcon.astro` / `AppRow.astro` / `StartItem.astro` — the three surfaces `APPS` renders onto (desktop icon, mobile list row, start-menu row). Each takes one `app` object and picks its tag dynamically: entries with an `href` render an `<a>` (plus `linkAttrs`), the rest a `<button data-app>`. Only `AppIcon` renders a doodle.
- `src/components/os94/DoodleArrow.astro` — the hand-drawn arrow + scrawl (`text` prop), used by `AppIcon`
- `src/components/os94/NetworkIcon.astro` — the 16×16 Win95 Network Neighborhood sprite in the taskbar tray, decorative
- `src/components/os94/SysMon.astro` — the SYSTEM MONITOR widget; takes `rows` (`{label, value}`, or `{label, id}` for a JS-filled span) and pads labels to a common width with U+00A0 so the `·` column lines up
- `src/data/os94.js` — hub config: `DEFS` (window geometry), `Z`, `APPS`, `appsById`, `START_ORDER`, `linkAttrs`. Imported by `index.astro` and the os94 components; **not** by `src/scripts/os94.js`, which reads the same numbers back off the DOM.
- `src/scripts/os94.js` — all hub behavior, vanilla JS, bundled by Astro as one deferred module
- `public/fonts/` — self-hosted latin-subset woff2 (Silkscreen 400, IBM Plex Mono 400/600); no Google Fonts requests

**Key design decisions:**
- Performance: the resume page keeps the original regime — ~20KB HTML+CSS, only a small `<script is:inline>` (age counter, IT-years counter, print-title swap) so Astro never bundles or defers it. The hub is heavier by design (~34KB HTML+inlined CSS, ~5KB bundled JS, 24KB fonts — ~9KB gz for the HTML) but still framework-free; its JS ships as an Astro-bundled module rather than is:inline because the initial HTML is fully correct without JS, so deferral causes no flash and the asset caches separately.
- All CSS is inlined into the HTML (`build.inlineStylesheets: 'always'` in `astro.config.mjs`) — no render-blocking stylesheet requests.
- Tailwind v3 wired manually via `postcss.config.cjs` + `src/styles/global.css` (no `@astrojs/tailwind` — it peer-caps at Astro 5); utilities are purged against `src/**/*.astro`. The resume uses Tailwind utilities; the hub's OS94 CSS is bespoke and uses none.
- The resume's `@media print` block powers PDF export (page margins, 12px root font scaling, `.no-print`, page-break rules). Do not scope or restructure it.
- Static files (images as WebP, favicon, robots.txt, fonts) live in `public/`; `assets/profile.jpg` is kept as JPG because it serves `og:image` for link-preview scrapers.
- Sitemap is generated by `@astrojs/sitemap` (`sitemap-index.xml`, referenced from `public/robots.txt`).

**OS94 hub invariants (expensive to relearn — don't break):**
1. All OS94 CSS lives in the page's `<style is:global>` block. Astro scoped styles are stamped only onto statically rendered elements, so JS-created DOM (taskbar buttons, boot lines) would silently miss scoped rules.
2. The initial HTML must be valid without JS: `#os` ships with `is-booting`, **no window ships `is-open`**, `#taskbar-btns` is therefore server-rendered empty, and a `<noscript>` style skips the boot screen. The server-rendered taskbar buttons must match exactly what `renderTaskbar()` derives from `.win.is-open`, or the taskbar flickers on load. `init()` must not touch open/min state — the server HTML is already correct. Never "fix" a flash by moving initial state into JS.
3. The `<noscript>` link list (resume / Unsplash / GitHub / Goodreads / email / LinkedIn) must survive edits — it is the only navigation JS-off visitors get, since the `data-app` rows do nothing without JS. **It lives in `.desktop-readme`, not in a window**: no window ships `is-open`, so `.win { display: none }` would hide it entirely. It sits on the dark desktop, so it needs the light-text/accent-link override — don't restyle it as window body copy.
4. Window geometry lives exactly once, in `DEFS`/`Z` in `src/data/os94.js`, reaching the DOM as custom-property props on each `<Window>` in `index.astro`. JS reads/writes the same properties — never duplicate the coordinates table into `os94.js`. `<StickyNote>` follows the same rule (`--top/--right/--bottom/--left/--w/--rot`): coordinates belong at the call site, never hardcoded back into the `.sticky-note` CSS.
5. The `APPS` array (in `src/data/os94.js`) is the single source for the icon grid, mobile menu, and start menu — rendered by `AppIcon` / `AppRow` / `StartItem` respectively. An entry with an `href` renders as an `<a>` carrying no `data-app` — external hrefs (photos → Unsplash, bookshelf → Goodreads) get `target="_blank" rel="noopener noreferrer"` via `linkAttrs()`, internal ones stay same-tab unless the entry sets `newTab: true` (resume → `/resume/` does, so the desktop survives behind it). `linkAttrs()` takes the whole app object, not just the href. Entries without `href` open the window matching their `id`. `START_ORDER` mirrors it by id and must be edited alongside — a stale id there crashes the start-menu render, since `appsById[id]` comes back undefined.
6. **Parked windows must have zero openers left.** Parking means removing the `APPS` entry, the `START_ORDER` id, *and* any hand-written `data-app`/`data-task` reference elsewhere in the page — the welcome window's quick-menu rows were hand-written rather than generated from `APPS`, which is how a parked window kept an opener before. Grep `data-app="<id>"` and `data-task="<id>"` across the file and expect zero hits. This is the step that gets missed. (Welcome itself is now parked, so its rows are dead markup kept only for restore.)
7. **`.desktop-readme` must stay reachable on mobile.** It is the only place the bio lives now that the readme window is gone. Below 760px `.mobile-menu` drops out of its `inset: 0` overlay into normal document order and `.desktop` scrolls, so the same single block flows in beneath the menu rows. Never solve a mobile layout problem here by duplicating the prose — one copy in the DOM, styled per breakpoint.
8. **`.widgets` is a transparent `inset: 0` overlay over the whole desktop.** It shares `z-index: 1` with `.desktop-readme` and sits later in the DOM, so it paints on top and would swallow every pointer event over the bio — text unselectable, uncopyable. It carries `pointer-events: none`, with `.sticky-note` and `.sysmon` opting back in via `pointer-events: auto`. Anything new added inside `.widgets` needs the same opt-in.
9. Keep multi-line inline elements (`<a>`, `<strong>`, `<span>`) on one line in `.astro` markup — Astro collapses surrounding whitespace (known repo gotcha).

## Hosting

Cloudflare Pages. Build command `npm run build`, output directory `dist`, framework preset Astro, `NODE_VERSION=22`.
