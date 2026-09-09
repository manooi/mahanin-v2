// Mahanin OS 94 — entry point. Imports all modules, wires shared state, calls init().

// Shared mutable state (module-level globals from the original single file).
import { topZ, bootTimer, bootCount } from './boot.js';
import { netDown, netUp, netUpBurst, netPing, netConn } from './gauges.js';
import { metaTap } from './keyboard.js';

// Re-export shared state so other modules can reference it.
Object.assign(globalThis, { topZ, bootTimer, bootCount, netDown, netUp, netUpBurst, netPing, netConn, metaTap });

// Shared matchMedia queries.
const mq = window.matchMedia('(max-width: 759px)');
// Mirrors the CSS guard on every looping animation, for the parts JS drives instead.
const stillMq = window.matchMedia('(prefers-reduced-motion: reduce)');

// Re-export shared state for modules that import it.
Object.assign(globalThis, { mq, stillMq });

// Import all modules (side-effect-free — just registers exports).
import { placeWin, openWin, focusWin, minWin, closeWin, topOpenWindow, isTopWindow, taskClick } from './windowManager.js';
import { renderTaskbar } from './utils.js';
import { startDraggable, startDrag, startPhotoDrag } from './drag.js';
import { skipBoot, endBoot, onBootKeydown, shutdown, poweron, startBoot } from './boot.js';
import { tick, netTick, uptimeText } from './gauges.js';
import { closeMenus, anyMenuOpen, openContextMenu, refreshDesktop, toggleStart } from './menus.js';
import { dispatchAction, selectBinItem } from './actions.js';
import { copyToClipboard } from './clipboard.js';
import { onKeydown, onKeyup } from './keyboard.js';

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
    const photo = e.target.closest('.desk-photo');
    if (photo) {
      startPhotoDrag(photo, e);
      return;
    }
    const note = e.target.closest('.sticky-note');
    if (note) {
      startDraggable(note, e, {
        minX: 0,
        maxX: Math.max(0, note.offsetParent?.clientWidth - note.offsetWidth ?? 0),
        minY: 0,
        maxY: Math.max(0, note.offsetParent?.clientHeight - note.offsetHeight ?? 0),
      });
      return;
    }
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
