// Mahanin OS 94 — keyboard shortcuts.

import { topOpenWindow, closeWin } from './windowManager.js';
import { anyMenuOpen, closeMenus, toggleStart } from './menus.js';

// A tap of the Windows key (Meta, or Cmd on a Mac) toggles the start menu. It has to be
// resolved on keyup: Meta fires a keydown ahead of every Cmd+C / Cmd+T too, so acting on
// keydown would pop the menu open on any shortcut the user typed. Any other key pressed
// while Meta is held cancels the tap. Ctrl+Esc is the real Win95 binding and works
// everywhere, which matters because Windows itself swallows the Windows key.
export let metaTap = false;

export function onKeydown(e) {
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

export function onKeyup(e) {
  if ((e.key === 'Meta' || e.key === 'OS') && metaTap) {
    metaTap = false;
    const os = document.getElementById('os');
    if (os && os.classList.contains('is-booting')) return;
    toggleStart();
  }
}
