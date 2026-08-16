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

function tick() {
  const now = new Date();
  let hours = now.getHours();
  const ampm = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('clock');
  if (clockEl) clockEl.textContent = hours + ':' + minutes + ' ' + ampm;

  const days = Math.floor((now - new Date(1994, 0, 1)) / 86400000);
  const uptimeEl = document.getElementById('uptime');
  if (uptimeEl) uptimeEl.textContent = Math.floor(days / 365) + 'y ' + (days % 365) + 'd';
}

// --- Menus / wallpaper -----------------------------------------------------

function closeMenus() {
  const startMenu = document.getElementById('start-menu');
  if (startMenu) startMenu.classList.remove('is-visible');
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

// --- Dispatch / listeners ---------------------------------------------

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
      const startMenu = document.getElementById('start-menu');
      if (startMenu && startMenu.classList.contains('is-visible')) closeMenus();
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

  window.addEventListener('keydown', onBootKeydown);

  const welcomeStartup = document.getElementById('welcome-startup');
  if (welcomeStartup) {
    welcomeStartup.addEventListener('change', () => {
      try {
        if (welcomeStartup.checked) {
          localStorage.removeItem('os94-welcome');
        } else {
          localStorage.setItem('os94-welcome', 'off');
        }
      } catch (e) {}
    });
  }
}

function init() {
  try {
    if (localStorage.getItem('os94-welcome') === 'off') {
      const win = getWin('welcome');
      if (win) win.classList.remove('is-open');
    }
  } catch (e) {}

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
