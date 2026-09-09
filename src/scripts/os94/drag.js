// Mahanin OS 94 — drag helpers.

import { readVar, setVarPx, clamp } from './utils.js';
import { focusWin } from './windowManager.js';

// Shared pointer plumbing: capture the press point, hand every move to `apply` as a delta
// from it, and unbind on release.
function trackDrag(e, apply) {
  e.preventDefault();
  const startX = e.clientX;
  const startY = e.clientY;

  function onMove(ev) {
    apply(ev.clientX - startX, ev.clientY - startY);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// Start dragging any element that uses --x/--y for position.  On the first press, convert
// CSS anchor (top/right/bottom/left) to left/top by reading offsetLeft/offsetTop — this
// avoids the rotated bounding-box jump (see comment below).  Then clamp within `bounds` as
// supplied by the caller.
export function startDraggable(el, e, bounds) {
  const box = el.offsetParent;
  if (!box) return;

  // On first grab, read the CSS-anchor position and switch to left/top so cursor deltas
  // make sense.  We use offsetLeft/offsetTop rather than getBoundingClientRect because the
  // element may be rotated (the desk photo is rotated 0°, sticky notes -2.2°) — a client
  // rect on a rotated element is the *rotated* bounding box, which is wider than the
  // element itself and offset from it, causing a visible jump.
  if (!el.classList.contains('is-dragged')) {
    setVarPx(el, '--x', el.offsetLeft);
    setVarPx(el, '--y', el.offsetTop);
    el.classList.add('is-dragged');
  }

  const originX = readVar(el, '--x', 0);
  const originY = readVar(el, '--y', 0);
  trackDrag(e, (dx, dy) => {
    setVarPx(el, '--x', clamp(originX + dx, bounds.minX, bounds.maxX));
    setVarPx(el, '--y', clamp(originY + dy, bounds.minY, bounds.maxY));
  });
}

// Window drag: focus the window, clamp to viewport (minus title-bar / taskbar clearance).
export function startDrag(win, e) {
  focusWin(win.dataset.win);
  startDraggable(win, e, {
    minX: 0,
    maxX: window.innerWidth - 70,
    minY: 0,
    maxY: window.innerHeight - 90,
  });
}

// Desk photo / sticky note: clamp to parent element bounds.
export function startPhotoDrag(photo, e) {
  const box = photo.offsetParent;
  if (!box) return;
  startDraggable(photo, e, {
    minX: 0,
    maxX: Math.max(0, box.clientWidth - photo.offsetWidth),
    minY: 0,
    maxY: Math.max(0, box.clientHeight - photo.offsetHeight),
  });
}
