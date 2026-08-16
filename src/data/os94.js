// Config for the OS94 hub: window geometry, stacking order, and the app list.
// index.astro and the os94 components import from here. `src/scripts/os94.js` (the
// runtime) deliberately does NOT — it reads the same numbers back off the DOM as CSS
// custom properties, so the coordinates still live in exactly one place.

// Window geometry — single source of truth (design's DEFS table). Never duplicate into JS.
export const DEFS = {
  // welcome, char, projects, and winamp are parked: no APPS entry, so none of them has an
  // opener anywhere (icon grid/mobile/start menu). Still rendered + closed in the DOM;
  // restorable by re-adding the corresponding entry to APPS below.
  welcome:  { x: 430, y: 80,  w: 450, h: 363 },
  char:     { x: 392, y: 110, w: 458, h: 452 },
  projects: { x: 352, y: 150, w: 452, h: 356 },
  winamp:   { x: 520, y: 430, w: 276, h: 168 },
  contact:  { x: 420, y: 138, w: 408, h: 243 },
  // taskman has no APPS entry either, but it is NOT parked: the taskbar's right-click
  // menu is its one and only opener. Deleting that menu strands it.
  taskman:  { x: 360, y: 190, w: 396, h: 236 },
  recycle:  { x: 300, y: 120, w: 428, h: 322 },
};

// Static z only orders the parked windows against each other; nothing opens on load. Runtime topZ starts at 30 so every focus still wins.
// readme is no longer a window — its content now renders directly on the desktop (.desktop-readme).
// Z values kept identical to the pre-removal numbering for survivors (life/now/guest/computer/photo/resume/books removed); winamp is new, one above the old highest static z. Gaps are harmless.
export const Z = { char: 13, projects: 15, contact: 20, winamp: 21, taskman: 22, recycle: 23, welcome: 25 };

// External hrefs (http…) get target="_blank" + rel="noopener noreferrer" by default;
// internal ones stay same-tab unless the entry sets `newTab: true` (resume does — the
// desktop stays put behind it). Takes the whole app, not just the href.
export const linkAttrs = (app) => ((app.newTab ?? app.href.startsWith('http')) ? { target: '_blank', rel: 'noopener noreferrer' } : {});

// Apps drive the icon grid and the start menu. An entry with `href` renders as a link
// (no window) instead of a `data-app` opener. The icon grid is the only app surface at
// both breakpoints — mobile reflows the same grid rather than swapping in a list.
// `doodle` adds the hand-drawn arrow + scrawl next to the desktop icon — the only
// onboarding cue now that no window opens at startup. Icon grid only (the start menu
// ignores it); hidden under 1000px, where it would hit .desktop-readme.
export const APPS = [
  { id: 'resume',   icon: '👔', gridLines: ['resume', '(for HR)'], startLabel: 'resume (for HR)', href: '/resume/', newTab: true, doodle: 'HR start here' },
  { id: 'photo',    icon: '📷', gridLines: ['photos'],             startLabel: 'photos',          href: 'https://unsplash.com/@souperwit' },
  { id: 'books',    icon: '📚', gridLines: ['bookshelf'],          startLabel: 'bookshelf',       href: 'https://www.goodreads.com/user/show/177765370-sirawit-mahanin' },
  { id: 'contact',  icon: '✉️', gridLines: ['say hi'],             startLabel: 'say hi' },
  { id: 'recycle',  icon: '🗑️', gridLines: ['recycle bin'],        startLabel: 'recycle bin' },
];

export const appsById = Object.fromEntries(APPS.map((app) => [app.id, app]));

// Start menu mirrors APPS order; null entries are separators before shutdown.
// recycle rides in the same group as contact rather than getting its own separator.
export const START_ORDER = ['resume', null, 'photo', 'books', 'contact', 'recycle', null];
