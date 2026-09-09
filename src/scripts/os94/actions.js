// Mahanin OS 94 — dispatch actions and recycle bin.

import { getWin } from './utils.js';
import { focusWin, minWin, closeWin } from './windowManager.js';
import { toggleStart, refreshDesktop } from './menus.js';
import { shutdown, poweron } from './boot.js';
import { copyToClipboard } from './clipboard.js';

export function dispatchAction(action, el) {
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

// Every punchline is authored in the markup as data-note, so this only moves a string
// into the status bar. The EMPTY button carries a note too and gets no selection, since
// it is not a row in the list.
export function selectBinItem(el) {
  const status = document.getElementById('bin-status');
  if (status && el.dataset.note) status.textContent = el.dataset.note;
  if (!el.classList.contains('bin-item')) return;
  document.querySelectorAll('.bin-item.is-selected').forEach((item) => item.classList.remove('is-selected'));
  el.classList.add('is-selected');
}
