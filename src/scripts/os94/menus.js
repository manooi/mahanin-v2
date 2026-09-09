// Mahanin OS 94 — menus, refresh, start menu.

import { readVar, setVarPx, renderTaskbar } from './utils.js';

export function closeMenus() {
  document.querySelectorAll('[data-menu].is-visible').forEach((menu) => menu.classList.remove('is-visible'));
}

export function anyMenuOpen() {
  return document.querySelector('[data-menu].is-visible') !== null;
}

// Right-click menus open at the cursor, clamped into the viewport — for the taskbar,
// which sits at the bottom, that clamp is what flips the menu up above the pointer.
export function openContextMenu(id, e) {
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
export function refreshDesktop() {
  closeMenus();
  const icons = document.getElementById('icons');
  if (icons) {
    icons.classList.remove('is-refreshing');
    void icons.offsetWidth;
    icons.classList.add('is-refreshing');
  }
  renderTaskbar();
}

export function toggleStart() {
  const startMenu = document.getElementById('start-menu');
  if (!startMenu) return;
  const wasOpen = startMenu.classList.contains('is-visible');
  closeMenus();
  if (!wasOpen) startMenu.classList.add('is-visible');
}
