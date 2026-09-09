// Mahanin OS 94 — window manager.

import { getWin, readVar, setVarPx, clamp } from './utils.js';
import { closeMenus } from './menus.js';

// How far each additional window steps down-right from centre, and how many steps before
// the cascade starts over — Win95 staggered new windows for the same reason.
const CASCADE_STEP = 26;
const CASCADE_WRAP = 4;
const EDGE_GAP = 14;

// DEFS still owns every window's size, but not where it ends up on screen: a fixed x that
// centres a 408px window on a 1280px desktop leaves it visibly left of centre on a 2560px
// one. So the first time a window opens it is centred against .desktop — which is the
// element windows are positioned inside, and already stops above the taskbar, so there is
// no taskbar height to subtract here. The DEFS x/y survive as the pre-JS values.
//
// Centring is first-open only. Once a window has been placed, its position belongs to the
// user (they may have dragged it) and must survive close/reopen; from then on this only
// re-clamps it, which is what keeps an off-screen window reachable after a resize.
export function placeWin(win) {
  const desk = document.querySelector('.desktop');
  if (!desk) return;
  const w = readVar(win, '--w', win.offsetWidth);
  const h = readVar(win, '--h', win.offsetHeight);
  const maxX = Math.max(EDGE_GAP, desk.clientWidth - w - EDGE_GAP);
  const maxY = Math.max(EDGE_GAP, desk.clientHeight - h - EDGE_GAP);
  let x = readVar(win, '--x', 0);
  let y = readVar(win, '--y', 0);

  if (!win.dataset.placed) {
    // -1 drops this window from the count: openWin marks it .is-open before calling.
    const depth = Math.max(0, document.querySelectorAll('.win.is-open').length - 1) % CASCADE_WRAP;
    x = Math.round((desk.clientWidth - w) / 2) + depth * CASCADE_STEP;
    y = Math.round((desk.clientHeight - h) / 2) + depth * CASCADE_STEP;
    win.dataset.placed = '1';
  }

  setVarPx(win, '--x', clamp(x, EDGE_GAP, maxX));
  setVarPx(win, '--y', clamp(y, EDGE_GAP, maxY));
}

export function openWin(id) {
  const win = getWin(id);
  if (!win) return;
  win.classList.add('is-open');
  win.classList.remove('is-min');
  // Mobile windows are fixed to the viewport by CSS, so there is nothing to position.
  if (!mq.matches) placeWin(win);
  focusWin(id);
  closeMenus();
}

export function focusWin(id) {
  const win = getWin(id);
  if (!win) return;
  topZ += 1;
  win.style.setProperty('--z', String(topZ));
  win.classList.remove('is-min');
}

export function minWin(id) {
  const win = getWin(id);
  if (!win) return;
  win.classList.add('is-min');
}

export function closeWin(id) {
  const win = getWin(id);
  if (!win) return;
  win.classList.remove('is-open', 'is-min');
}

// Highest --z among the windows actually on screen; null if the desktop is bare.
export function topOpenWindow() {
  let top = null;
  document.querySelectorAll('.win.is-open:not(.is-min)').forEach((win) => {
    if (!top || readVar(win, '--z', 0) > readVar(top, '--z', 0)) top = win;
  });
  return top;
}

export function isTopWindow(win) {
  const z = readVar(win, '--z', 0);
  let isTop = true;
  document.querySelectorAll('.win.is-open:not(.is-min)').forEach((other) => {
    if (other === win) return;
    if (readVar(other, '--z', 0) > z) isTop = false;
  });
  return isTop;
}

export function taskClick(id) {
  const win = getWin(id);
  if (!win) return;
  const isMin = win.classList.contains('is-min');
  if (!isMin && isTopWindow(win)) {
    minWin(id);
  } else {
    focusWin(id);
  }
}
