# OS94 hub

Implementation notes for `src/pages/index.astro` — the retro-desktop homepage. Read this
before touching the hub. [`CLAUDE.md`](../../CLAUDE.md) keeps only the short version.

## What is on screen

A skippable boot screen, then a bare desktop: an icon grid top-left, the bio in the middle,
a photo and widgets down the right, a taskbar with a start menu, and a shutdown screen.

**No window opens at startup.** Onboarding is a hand-drawn doodle (SVG arrow + "HR start
here" scrawl) pinned to the resume icon.

### Windows

Four are reachable:

| Window | Opened by |
|---|---|
| `contact` | icon grid + start menu (`APPS`) |
| `recycle` | icon grid + start menu (`APPS`) |
| `taskman` | taskbar right-click menu **only** |
| `netmon` | the `.netgauge` widget **only** |

Four are parked — rendered and styled but unreachable, kept for easy restore: `welcome`,
`char`, `projects`, `winamp`. Restore one by re-adding its `APPS` entry.

`recycle` is the Recycle Bin: joke files whose punchlines are authored as `data-note`
attributes in the markup, so `os94.js` only moves a string into `#bin-status`. **Put new
copy in the markup, never in the script.** Reachable at both breakpoints; on mobile its rows
get a taller hit area.

`welcome.exe` was the Mint-style first-visit panel. Now parked — its "show at startup"
checkbox and the `localStorage['os94-welcome']` key are both gone.

### Right-click menus

Two `.ctx-menu` blocks, positioned at the cursor by JS:

- **Desktop** → `Refresh`, which repaints the icon grid with a three-step opacity blink
  rather than reloading the page.
- **Taskbar** → `Task Manager`, which opens `taskman.exe`, a window whose entire content is
  a joke about not having built a task manager.

Right-clicking *inside* a window is left to the browser, so text stays copyable.

### Keyboard

A tap of the Windows/Cmd key or Ctrl+Esc toggles the start menu. Escape closes the top-most
open window, or the open menu if there is one.

The Meta tap resolves on **keyup**, and any intervening keydown cancels it — acting on
keydown would pop the start menu on every Cmd+C.

## Components (`src/components/os94/`)

### `Window.astro`
Window chrome (title bar, min/close buttons, body variants), used 8× by the hub. Geometry
arrives as CSS custom properties (`--x/--y/--w/--h/--z`).

### `AppIcon.astro` / `StartItem.astro`
The two surfaces `APPS` renders onto — desktop icon and start-menu row. Each takes one `app`
object and picks its tag dynamically: entries with an `href` render an `<a>` (plus
`linkAttrs`), the rest a `<button data-app>`. Only `AppIcon` renders a doodle.

### `DoodleArrow.astro`
The hand-drawn arrow + scrawl (`text` prop), used by `AppIcon`.

Driven by a `doodle` string on an `APPS` entry (only `resume` has one) and rendered *inside*
the icon `<a>`, positioned against `.icon { position: relative }` — never against grid
coordinates, since icon heights vary with label line count. It is `pointer-events: none` so
clicks fall through to the icon link, and `display: none` below 1000px, where
`.desktop-readme` hugs its 140px left bound and would collide. Hidden under 760px too, where
the scrolling row would put it on top of the next icon over.

### `StickyNote.astro`
One desktop sticky note. Props: `label` (defaults to `STICKY NOTE`; pass `label=""` to drop
the header), `sign` (omit for no signature line), `tint` (`mint` | `pink`, default yellow),
`w`, `rotate`, and any of `top`/`right`/`bottom`/`left` — only the sides you pass are
emitted, so a note can hang off any corner. Body is the default slot.

Add more notes by adding more `<StickyNote>` calls inside `.widgets`; they do not auto-tile,
so give each one its own coordinates.

### `DeskPhoto.astro`
The printed photo in the top-right, and the only draggable thing on the desktop that is not
a window. Props: `src`, `alt`, intrinsic `width`/`height`, displayed `w`, `rotate`, and
call-site sides.

**It is anchored by `top`/`right` until the first drag**, which is what holds it in the
corner on any viewport. A `right`-anchored element cannot take a cursor delta, so
`startPhotoDrag()` converts the anchor to `--x`/`--y` once and `.is-dragged` flips the
element to `left`/`top`.

That conversion reads `offsetLeft`/`offsetTop`, **never** `getBoundingClientRect()` — the
photo can be rotated, and a client rect is the *rotated* bounding box, so the photo would
jump the moment you grabbed it.

`draggable="false"` on the `<img>` is load-bearing: without it the browser's native image
drag hijacks the gesture.

### `GhostIcon.astro`
A dead desktop shortcut: `glyph`, `label`, and any of `top`/`right`/`bottom`/`left`.

Used once, for `camflock` — the Thai internet of the mid-2000s (Camfrog, one letter off),
still on the desktop and no longer installed. Built to look exactly like a real `.icon`,
then faded to `opacity: .3` with no `:hover`, no window behind it, and no `APPS` entry.

It is the one thing inside `.widgets` that *wants* the overlay's `pointer-events: none`, so
it must never gain the `pointer-events: auto` opt-in — being unclickable is the joke.

It currently sits **completely hidden behind the desk photo**, a pure easter egg that is
invisible until the photo is dragged off it. That overlap is pure DOM order: both are
`position: absolute` with no `z-index`, so `<GhostIcon>` must stay *before* `<DeskPhoto>` in
`index.astro` or the frog paints over the photo instead. The cover clears by only ~2px at
the bottom, so nudging either element down, widening the icon, or picking a taller glyph
will expose it — re-check both whenever one moves.

### `SysMon.astro`
The SYSTEM MONITOR widget. Takes `rows` (`{label, value}`, or `{label, id}` for a JS-filled
span) and pads labels to a common width with U+00A0 so the `·` column lines up.

`UPTIME` is exact age off the real birthday, computed over date-only UTC midnights so DST
can never round the day count off by one.

### `NetGauge.astro`
The cFosSpeed-style traffic gauge (latency, connection count, download/upload bars), and the
sole opener for the `netmon` window — which is why it renders as a `<button data-app="netmon">`
rather than a div. Deliberately title-less, since the gadget it mimics has no title bar.

Every value is a prop with a server-rendered default, so the widget reads correctly with JS
off; `netTick()` walks them once a second and writes bar length as `--fill`.

**Both bars share one scale (`NET_MAX`).** Per-bar scales would draw a 300K download and a
72K upload at the same length and destroy the asymmetry that makes it read as a real link.

Download rests ~4× upload (`NET_DOWN`/`NET_UP` profiles, mean-reverting toward `base` so
neither parks against a bound) and leads ~98.6% of seconds. The rest is `NET_UP_BURST`, a
rare few-second upload spike that exists so the two lines cross occasionally. The numbers are
invented, not measured.

Under `prefers-reduced-motion: reduce` the whole ticker is skipped and the server-rendered
values stand — which is also why the bar's `width` transition needs no guard of its own.

It shares the bottom-right column with `.sysmon`, which sits directly above it at the same
width and right edge. Moving one means re-checking the other's `bottom`.

### `BrandIcon.astro`
Inlined LinkedIn and GitHub marks (`name` prop) for the contact rows.

Inlined rather than `<img src="/assets/icon/…">`, and still worth keeping that way even
though the desk photo now makes the hub's one image request. The reason was never a
round-number budget: the contact window is in the HTML whether or not it is opened, and
`display: none` does not reliably stop a browser fetching images, so an `<img>` there would
be fetched by everyone who never opens the window. The desk photo is visible from the first
paint, so its request buys something.

### `NetworkIcon.astro`
The 16×16 Win95 Network Neighborhood sprite in the taskbar tray. Decorative. Blinks on a
1.6s `steps(1)` cycle with the front screen offset `.8s`, guarded by `prefers-reduced-motion`.

## Config — `src/data/os94.js`

`DEFS` (window geometry), `Z`, `APPS`, `appsById`, `START_ORDER`, `linkAttrs`.

Imported by `index.astro` and the os94 components; **not** by `src/scripts/os94.js`, which
reads the same numbers back off the DOM as custom properties.

## Runtime — `src/scripts/os94.js`

All hub behaviour, vanilla JS, bundled by Astro as one deferred module.

### Window placement
`placeWin()` centres a window against `.desktop` the first time it opens. Centring is
first-open only, keyed on a `data-placed` flag, so a dragged position survives close and
reopen; later opens only re-clamp, which is what keeps a window reachable after the viewport
shrinks. Windows opened while others are up cascade down-right in 26px steps, wrapping every
fourth, so they do not stack exactly now that they share one centre point.

### Dragging
`trackDrag()` owns the press-point capture and the move/up listener pair. `startDrag()`
(windows) and `startPhotoDrag()` (desk photo) each apply their own clamped delta.

## The desktop, not-a-window parts

**The bio (`.desktop-readme`) is not a window.** It renders straight onto the desktop,
centred between the icon column and the widgets, and carries the page's only `<h1>`. Nothing
covers it — it is the first thing on screen after boot. On mobile it reflows below the icon
row.

**`.widgets` is a transparent `inset: 0` overlay** over the whole desktop — see invariant 8.

## Mobile (<760px)

The desktop reflows; it does not get its own markup.

- `.icons` and `.desktop-readme` drop out of their absolute positions into normal document
  order, and `.desktop` scrolls vertically to reach the bio underneath.
- The icon grid becomes **one row that scrolls sideways** (`grid-auto-flow: column` +
  `overflow-x: auto`). Columns are a fixed 84px, not `1fr`: `1fr` divides the width so the
  last visible icon ends flush with the screen edge and the row looks finished, while 84px
  cuts the next icon mid-glyph and reads as "keep going". No scroll snapping — five icons
  total 436px, so a large phone scrolls barely 26px, and a snap point every 88px would drag
  that back to the start and put the last icon out of reach.
- Windows pin to the top edge at **content height** — they are not full-screen. `.win` drops
  its `bottom` so the frame sizes to what is inside it, and the height cap lives on
  `.win-frame` (the flex column) so `.win-body` has a definite bound to shrink and scroll
  against. The cap is `calc(100vh - 56px)` with a `calc(100dvh - 56px)` upgrade behind
  `@supports` — **two `max-height` declarations in one rule do not survive**, the minifier
  drops the first as a dead duplicate and leaves non-`dvh` browsers uncapped.
- `.widgets` is hidden entirely, which takes the photo, camflock, sticky notes, SYSMON and
  the gauge with it.

## Assets

`assets/profile.webp` (1080×1080) serves `og:image`; the JPG that used to fill that role is
gone. Scraper support for WebP is good but not universal, so a preview that renders blank on
some platform is the first thing to suspect — the fix is a JPG alongside it, not a different
WebP.

`assets/profile-note.webp` (240×304, 12KB) is the desk photo — a crop of `profile.webp` sized
for the ~122px slot it renders into, since shipping the full 70KB original for a thumbnail is
most of an image request wasted. Re-crop from `profile.webp`, not from the note file:

```bash
magick public/assets/profile.webp -crop 490x620+300+380 +repage \
  -resize 240x -quality 82 public/assets/profile-note.webp
```

## Invariants — the expensive ones

1. **All OS94 CSS lives in the page's `<style is:global>` block.** Astro scoped styles are
   stamped only onto statically rendered elements, so JS-created DOM (taskbar buttons, boot
   lines) would silently miss scoped rules.

2. **The initial HTML must be valid without JS.** `#os` ships with `is-booting`, **no window
   ships `is-open`**, `#taskbar-btns` is therefore server-rendered empty, and a `<noscript>`
   style skips the boot screen. The server-rendered taskbar buttons must match exactly what
   `renderTaskbar()` derives from `.win.is-open`, or the taskbar flickers on load. `init()`
   must not touch open/min state — the server HTML is already correct. Never "fix" a flash by
   moving initial state into JS.

3. **The `<noscript>` link list must survive edits** (resume / Unsplash / GitHub / Goodreads /
   email / LinkedIn). It is the only navigation JS-off visitors get, since the `data-app` rows
   do nothing without JS. **It lives in `.desktop-readme`, not in a window**: no window ships
   `is-open`, so `.win { display: none }` would hide it entirely. It sits on the dark desktop,
   so it needs the light-text/accent-link override — don't restyle it as window body copy.

4. **Geometry lives exactly once, at the call site.** `DEFS`/`Z` in `src/data/os94.js` reach
   the DOM as custom-property props on each `<Window>`. JS reads and writes the same
   properties — never duplicate the coordinates table into `os94.js`. `<StickyNote>`,
   `<GhostIcon>` and `<DeskPhoto>` follow the same rule
   (`--top/--right/--bottom/--left/--w/--rot`); coordinates never get hardcoded back into CSS.

   **`DEFS` x/y is only the pre-JS value, not where a window lands** — `placeWin()` centres
   it, because a fixed x tuned to centre on a 1280px desktop reads as left-aligned on a
   2560px one. Centre against `.desktop`, never the viewport: it is the windows' containing
   block and already stops above the taskbar, so subtracting a taskbar height there would
   double-count it.

5. **`APPS` is the single source for the icon grid and the start menu.** An entry with an
   `href` renders as an `<a>` carrying no `data-app` — external hrefs get
   `target="_blank" rel="noopener noreferrer"` via `linkAttrs()`, internal ones stay same-tab
   unless the entry sets `newTab: true` (resume does, so the desktop survives behind it).
   `linkAttrs()` takes the whole app object, not just the href. Entries without `href` open
   the window matching their `id`. `START_ORDER` mirrors `APPS` by id and must be edited
   alongside — a stale id there crashes the start-menu render, since `appsById[id]` comes back
   undefined.

6. **Parked windows must have zero openers left — but check which windows are actually
   parked.** `taskman` and `netmon` have no `APPS` entry yet neither is parked: each has
   exactly one bespoke opener (the taskbar right-click menu; the `.netgauge` button), so
   deleting that opener strands the window.

   Parking means removing the `APPS` entry, the `START_ORDER` id, *and* any hand-written
   `data-app`/`data-task` reference elsewhere in the page — the welcome window's quick-menu
   rows were hand-written rather than generated from `APPS`, which is how a parked window kept
   an opener before. Grep `data-app="<id>"` and `data-task="<id>"` and expect zero hits. **This
   is the step that gets missed.**

7. **Mobile reflows the desktop; it does not get its own markup.** One DOM, styled per
   breakpoint — never solve a mobile layout problem by adding a second copy of the icons or
   the prose. Details in [Mobile](#mobile-760px) above.

8. **`.widgets` is a transparent `inset: 0` overlay over the whole desktop.** It shares
   `z-index: 1` with `.desktop-readme` and sits later in the DOM, so it paints on top and
   would swallow every pointer event over the bio — text unselectable, uncopyable. It carries
   `pointer-events: none`, with `.sticky-note`, `.sysmon`, `.netgauge` and `.desk-photo`
   opting back in via `pointer-events: auto`. Anything new inside `.widgets` needs the same
   opt-in — except `.ghost-icon`, which deliberately stays inert. Opting in does not cost the
   desktop right-click menu: that handler matches `closest('.desktop')`, which every widget is
   nested inside.

9. **Keep multi-line inline elements (`<a>`, `<strong>`, `<span>`) on one line in `.astro`
   markup.** Astro collapses surrounding whitespace.
