// Mahanin OS 94 — retro desktop hub behavior. Vanilla JS, no dependencies.
// DOM is the state: open/min are classes, position/z are custom properties,
// guest entries are child nodes, wallpaper is a data attribute.

const BOOT = [
  'MEMORY TEST ............ OK',
  'LOADING PERSONALITY .... OK',
  'MOUNTING /photos ....... OK',
  'MOUNTING /books ........ 1 IN PROGRESS',
  'COFFEE.SYS ............. FOUND',
  'RESUME.DOC ............. TIDY, FOR HR',
  'READY.'
];

let topZ = 30;
let bootTimer = null;
let bootCount = 0;
const mq = window.matchMedia('(max-width: 759px)');
// Mirrors the CSS guard on every looping animation, for the parts JS drives instead.
const stillMq = window.matchMedia('(prefers-reduced-motion: reduce)');

function getWin(id) {
  return document.getElementById('win-' + id);
}

function readVar(el, name, fallback) {
  const value = parseFloat(el.style.getPropertyValue(name));
  return Number.isNaN(value) ? fallback : value;
}

function setVarPx(el, name, value) {
  el.style.setProperty(name, value + 'px');
}

// --- Window manager -------------------------------------------------------

function openWin(id) {
  const win = getWin(id);
  if (!win) return;
  win.classList.add('is-open');
  win.classList.remove('is-min');
  if (!mq.matches) {
    const w = readVar(win, '--w', win.offsetWidth);
    const h = readVar(win, '--h', win.offsetHeight);
    const curX = readVar(win, '--x', 0);
    const curY = readVar(win, '--y', 0);
    const maxX = Math.max(16, window.innerWidth - w - 24);
    const maxY = Math.max(10, window.innerHeight - 44 - h - 12);
    setVarPx(win, '--x', Math.min(curX, maxX));
    setVarPx(win, '--y', Math.min(curY, maxY));
  }
  focusWin(id);
  closeMenus();
  renderTaskbar();
}

function focusWin(id) {
  const win = getWin(id);
  if (!win) return;
  topZ += 1;
  win.style.setProperty('--z', String(topZ));
  win.classList.remove('is-min');
}

function minWin(id) {
  const win = getWin(id);
  if (!win) return;
  win.classList.add('is-min');
  renderTaskbar();
}

function closeWin(id) {
  const win = getWin(id);
  if (!win) return;
  win.classList.remove('is-open', 'is-min');
  renderTaskbar();
}

// Highest --z among the windows actually on screen; null if the desktop is bare.
function topOpenWindow() {
  let top = null;
  document.querySelectorAll('.win.is-open:not(.is-min)').forEach((win) => {
    if (!top || readVar(win, '--z', 0) > readVar(top, '--z', 0)) top = win;
  });
  return top;
}

function isTopWindow(win) {
  const z = readVar(win, '--z', 0);
  let isTop = true;
  document.querySelectorAll('.win.is-open:not(.is-min)').forEach((other) => {
    if (other === win) return;
    if (readVar(other, '--z', 0) > z) isTop = false;
  });
  return isTop;
}

function taskClick(id) {
  const win = getWin(id);
  if (!win) return;
  const isMin = win.classList.contains('is-min');
  if (!isMin && isTopWindow(win)) {
    minWin(id);
  } else {
    focusWin(id);
    renderTaskbar();
  }
}

function renderTaskbar() {
  const container = document.getElementById('taskbar-btns');
  if (!container) return;
  container.innerHTML = '';
  document.querySelectorAll('.win.is-open').forEach((win) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'task-btn';
    if (win.classList.contains('is-min')) btn.classList.add('is-min');
    btn.dataset.task = win.dataset.win;
    btn.textContent = win.dataset.label || win.dataset.win;
    container.appendChild(btn);
  });
}

// --- Drag -------------------------------------------------------------

function startDrag(win, e) {
  e.preventDefault();
  const id = win.dataset.win;
  focusWin(id);
  const startX = e.clientX;
  const startY = e.clientY;
  const originX = readVar(win, '--x', 0);
  const originY = readVar(win, '--y', 0);

  function onMove(ev) {
    const nx = Math.max(0, Math.min(originX + ev.clientX - startX, window.innerWidth - 70));
    const ny = Math.max(0, Math.min(originY + ev.clientY - startY, window.innerHeight - 90));
    setVarPx(win, '--x', nx);
    setVarPx(win, '--y', ny);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

// --- Boot / shutdown ----------------------------------------------------

function appendBootLine(text) {
  const container = document.getElementById('boot-lines');
  if (!container) return;
  const line = document.createElement('div');
  line.textContent = text;
  container.appendChild(line);
}

function startBoot() {
  bootTimer = setInterval(() => {
    if (bootCount >= BOOT.length) {
      clearInterval(bootTimer);
      bootTimer = null;
      endBoot();
      return;
    }
    appendBootLine(BOOT[bootCount]);
    bootCount += 1;
  }, 50);
}

function skipBoot() {
  if (bootTimer) {
    clearInterval(bootTimer);
    bootTimer = null;
  }
  const os = document.getElementById('os');
  if (os && os.classList.contains('is-booting')) endBoot();
}

function endBoot() {
  if (bootTimer) {
    clearInterval(bootTimer);
    bootTimer = null;
  }
  const os = document.getElementById('os');
  if (os) os.classList.remove('is-booting');
  window.removeEventListener('keydown', onBootKeydown);
}

function onBootKeydown() {
  skipBoot();
}

function shutdown() {
  const os = document.getElementById('os');
  if (os) os.classList.add('is-off');
  closeMenus();
}

function poweron() {
  const os = document.getElementById('os');
  if (os) os.classList.remove('is-off');
}

// --- Clock / uptime -------------------------------------------------------

// Uptime is an exact age off the real birthday, 10 Nov 1994. The old version counted
// days from a 1 Jan 1994 epoch and split them with /365 and %365, which overshot by a
// whole year before November and drifted a day per leap year. Compare date-only UTC
// midnights so DST shifts can never round the day count off by one.
const BIRTH_YEAR = 1994;
const BIRTH_MONTH = 10; // zero-based: November
const BIRTH_DATE = 10;

function uptimeText(now) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  let years = now.getFullYear() - BIRTH_YEAR;
  let anniversary = Date.UTC(now.getFullYear(), BIRTH_MONTH, BIRTH_DATE);
  if (today < anniversary) {
    years -= 1;
    anniversary = Date.UTC(now.getFullYear() - 1, BIRTH_MONTH, BIRTH_DATE);
  }
  const days = Math.round((today - anniversary) / 86400000);
  return years + 'y ' + days + 'd';
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function tick() {
  const now = new Date();
  let hours = now.getHours();
  const ampm = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, '0');
  setText('clock', hours + ':' + minutes + ' ' + ampm);
  setText('uptime', uptimeText(now));
  netTick();
}

// --- Network gauge --------------------------------------------------------

// The cFosSpeed cosplay in the corner. There is no real traffic to measure, so the
// numbers take a random walk from their server-rendered start: a fresh random each
// second reads as noise, while a walk reads as a connection. Under prefers-reduced-motion
// the whole thing goes still and the server-rendered values stand — no ticker, no bars.
//
// Both directions are drawn against one scale (NET_MAX), so the bars can be compared by
// length. Per-bar scales would draw a 300K download and a 72K upload the same width and
// the asymmetry — the thing that makes it look like a real link — would be invisible.
// Download rests around 4x upload, so it leads nearly always; the bands overlap only at
// their extremes, which is what leaves room for the occasional upload spike to win.
const NET_MAX = 500;
const NET_DOWN = { base: 300, spread: 90, min: 55, max: 495 };
const NET_UP = { base: 72, spread: 40, min: 14, max: 165 };
// Every so often something is actually sent — a push, a photo. The burst lifts upload's
// resting rate for a few seconds and is the only thing that lets it out-run download.
// Without it the two never cross in a whole session, which reads as a loop, not a link.
const NET_UP_BURST = { base: 430, spread: 120, min: 14, max: 495 };
const NET_BURST_ODDS = 0.012;
let netDown = 300;
let netUp = 72.4;
let netUpBurst = 0;
let netPing = 49;
let netConn = 60;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Mean-reverting, not a free walk: the pull toward `base` is what keeps download high and
// upload low over a long session. An unpulled walk eventually parks against a bound and
// stays there, which is how a fake gauge gives itself away.
function drift(value, profile) {
  const pull = (profile.base - value) * 0.12;
  return clamp(value + pull + (Math.random() - 0.5) * profile.spread, profile.min, profile.max);
}

// cFosSpeed keeps one decimal below 100 and drops it above — 75.9K, but 240K.
function netFormat(value) {
  return (value < 100 ? value.toFixed(1) : String(Math.round(value))) + 'K';
}

function setFill(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.setProperty('--fill', Math.round((value / NET_MAX) * 100) + '%');
}

function netTick() {
  if (stillMq.matches) return;
  if (netUpBurst > 0) netUpBurst -= 1;
  else if (Math.random() < NET_BURST_ODDS) netUpBurst = 4 + Math.floor(Math.random() * 6);

  netDown = drift(netDown, NET_DOWN);
  netUp = drift(netUp, netUpBurst > 0 ? NET_UP_BURST : NET_UP);
  netPing = clamp(netPing + Math.round((Math.random() - 0.5) * 15), 11, 120);
  netConn = clamp(netConn + Math.round((Math.random() - 0.5) * 5), 41, 78);

  setText('net-ping', netPing + 'ms');
  setText('net-conn', String(netConn));
  setText('net-down', netFormat(netDown));
  setText('net-up', netFormat(netUp));
  setFill('net-down-bar', netDown);
  setFill('net-up-bar', netUp);
}

// --- Menus / wallpaper -----------------------------------------------------

function closeMenus() {
  document.querySelectorAll('[data-menu].is-visible').forEach((menu) => menu.classList.remove('is-visible'));
}

function anyMenuOpen() {
  return document.querySelector('[data-menu].is-visible') !== null;
}

// Right-click menus open at the cursor, clamped into the viewport — for the taskbar,
// which sits at the bottom, that clamp is what flips the menu up above the pointer.
function openContextMenu(id, e) {
  const menu = document.getElementById(id);
  if (!menu) return;
  e.preventDefault();
  closeMenus();
  menu.classList.add('is-visible');
  const x = Math.min(e.clientX, window.innerWidth - menu.offsetWidth - 6);
  const y = Math.min(e.clientY, window.innerHeight - menu.offsetHeight - 6);
  menu.style.left = Math.max(4, x) + 'px';
  menu.style.top = Math.max(4, y) + 'px';
}

// Win95's desktop Refresh mostly just repainted the icons, which is exactly what this
// does — a three-step opacity blink, no reload. Removing the class and forcing a reflow
// before re-adding it is what lets the animation restart on a second Refresh.
function refreshDesktop() {
  closeMenus();
  const icons = document.getElementById('icons');
  if (icons) {
    icons.classList.remove('is-refreshing');
    void icons.offsetWidth;
    icons.classList.add('is-refreshing');
  }
  renderTaskbar();
}

function toggleStart() {
  const startMenu = document.getElementById('start-menu');
  if (!startMenu) return;
  const wasOpen = startMenu.classList.contains('is-visible');
  closeMenus();
  if (!wasOpen) startMenu.classList.add('is-visible');
}

function copyToClipboard(text, btn) {
  const showResult = (ok) => {
    if (!btn) return;
    // Resting label must be captured once, before any swap ever happens — reading
    // btn.textContent here would pick up a still-pending '✓'/'✕' from an earlier
    // click (fires within the same 1.5s window) and the button would get stuck.
    if (btn.dataset.idleLabel === undefined) btn.dataset.idleLabel = btn.textContent;
    const original = btn.dataset.idleLabel;
    btn.classList.remove('is-copied', 'is-copy-failed');
    btn.classList.add(ok ? 'is-copied' : 'is-copy-failed');
    btn.textContent = ok ? '✓' : '✕';
    clearTimeout(btn._copyResetTimer);
    btn._copyResetTimer = setTimeout(() => {
      btn.classList.remove('is-copied', 'is-copy-failed');
      btn.textContent = original;
    }, 1500);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showResult(true), () => showResult(false));
  } else {
    showResult(false);
  }
}

// --- Dispatch / actions -----------------------------------------------

function dispatchAction(action, el) {
  switch (action) {
    case 'min': {
      const win = el.closest('.win');
      if (win) minWin(win.dataset.win);
      break;
    }
    case 'close': {
      const win = el.closest('.win');
      if (win) closeWin(win.dataset.win);
      break;
    }
    case 'start':
      toggleStart();
      break;
    case 'refresh':
      refreshDesktop();
      break;
    case 'bin':
      selectBinItem(el);
      break;
    case 'shutdown':
      shutdown();
      break;
    case 'poweron':
      poweron();
      break;
    case 'copy':
      if (el.dataset.copyText) copyToClipboard(el.dataset.copyText, el);
      break;
    default:
      break;
  }
}

// --- Recycle bin ----------------------------------------------------------

// Every punchline is authored in the markup as data-note, so this only moves a string
// into the status bar. The EMPTY button carries a note too and gets no selection, since
// it is not a row in the list.
function selectBinItem(el) {
  const status = document.getElementById('bin-status');
  if (status && el.dataset.note) status.textContent = el.dataset.note;
  if (!el.classList.contains('bin-item')) return;
  document.querySelectorAll('.bin-item.is-selected').forEach((item) => item.classList.remove('is-selected'));
  el.classList.add('is-selected');
}

// --- Keyboard ------------------------------------------------------------

// A tap of the Windows key (Meta, or Cmd on a Mac) toggles the start menu. It has to be
// resolved on keyup: Meta fires a keydown ahead of every Cmd+C / Cmd+T too, so acting on
// keydown would pop the menu open on any shortcut the user typed. Any other key pressed
// while Meta is held cancels the tap. Ctrl+Esc is the real Win95 binding and works
// everywhere, which matters because Windows itself swallows the Windows key.
let metaTap = false;

function onKeydown(e) {
  const os = document.getElementById('os');
  if (os && os.classList.contains('is-booting')) return;

  metaTap = e.key === 'Meta' || e.key === 'OS';

  if (e.key === 'Escape' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    toggleStart();
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    // Menus first, so Escape backs out of what is on top rather than closing a window
    // out from under an open menu.
    if (anyMenuOpen()) {
      closeMenus();
      return;
    }
    const win = topOpenWindow();
    if (win) closeWin(win.dataset.win);
  }
}

function onKeyup(e) {
  if ((e.key === 'Meta' || e.key === 'OS') && metaTap) {
    metaTap = false;
    const os = document.getElementById('os');
    if (os && os.classList.contains('is-booting')) return;
    toggleStart();
  }
}

// --- Dispatch / listeners ---------------------------------------------

function initListeners() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-app],[data-action],[data-task]');
    if (!el) return;
    if (el.dataset.app) {
      openWin(el.dataset.app);
      return;
    }
    if (el.dataset.task) {
      taskClick(el.dataset.task);
      return;
    }
    if (el.dataset.action) dispatchAction(el.dataset.action, el);
  });

  document.addEventListener(
    'mousedown',
    (e) => {
      const os = document.getElementById('os');
      if (os && os.classList.contains('is-booting')) {
        skipBoot();
        return;
      }
      const inMenu = e.target.closest && e.target.closest('[data-menu]');
      if (inMenu) return;
      if (anyMenuOpen()) closeMenus();
    },
    true
  );

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    // Clicking anywhere in an open window — not just its title bar — should bring it
    // to the front, same as a real desktop. Drag-start (below) is a separate concern.
    const win = e.target.closest('.win.is-open:not(.is-min)');
    if (win) focusWin(win.dataset.win);
    if (mq.matches) return;
    if (e.target.closest('.win-btn')) return;
    const titleBar = e.target.closest('.win-title');
    if (!titleBar || !win) return;
    startDrag(win, e);
  });

  document.addEventListener('contextmenu', (e) => {
    if (!e.target.closest) return;
    // Inside a window the browser's own menu wins — that is where the copyable text is.
    if (e.target.closest('.win')) return;
    if (e.target.closest('.taskbar')) {
      openContextMenu('taskbar-menu', e);
    } else if (e.target.closest('.desktop') || e.target.closest('.wallpaper')) {
      openContextMenu('desktop-menu', e);
    }
  });

  window.addEventListener('keydown', onBootKeydown);
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
}

function init() {
  // No window opens at startup — the desktop icon doodle does the onboarding now.
  // Nothing here may touch open/min state: the server HTML is already correct.
  initListeners();
  tick();
  setInterval(tick, 1000);
  renderTaskbar();
  startBoot();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
