// Mahanin OS 94 — boot sequence and shutdown.

import { closeMenus } from './menus.js';

const BOOT = [
  'MEMORY TEST ............ OK',
  'LOADING PERSONALITY .... OK',
  'MOUNTING /photos ....... OK',
  'MOUNTING /books ........ 1 IN PROGRESS',
  'COFFEE.SYS ............. FOUND',
  'RESUME.DOC ............. TIDY, FOR HR',
  'READY.'
];

export let bootTimer = null;
export let bootCount = 0;

function appendBootLine(text) {
  const container = document.getElementById('boot-lines');
  if (!container) return;
  const line = document.createElement('div');
  line.textContent = text;
  container.appendChild(line);
}

export function startBoot() {
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

export function skipBoot() {
  if (bootTimer) {
    clearInterval(bootTimer);
    bootTimer = null;
  }
  const os = document.getElementById('os');
  if (os && os.classList.contains('is-booting')) endBoot();
}

export function endBoot() {
  if (bootTimer) {
    clearInterval(bootTimer);
    bootTimer = null;
  }
  const os = document.getElementById('os');
  if (os) os.classList.remove('is-booting');
  window.removeEventListener('keydown', onBootKeydown);
}

export function onBootKeydown() {
  skipBoot();
}

export function shutdown() {
  const os = document.getElementById('os');
  if (os) os.classList.add('is-off');
  closeMenus();
}

export function poweron() {
  const os = document.getElementById('os');
  if (os) os.classList.remove('is-off');
}
