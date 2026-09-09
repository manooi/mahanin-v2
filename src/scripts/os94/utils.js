// Mahanin OS 94 — shared utilities.

export function getWin(id) {
  return document.getElementById('win-' + id);
}

export function readVar(el, name, fallback) {
  const value = parseFloat(el.style.getPropertyValue(name));
  return Number.isNaN(value) ? fallback : value;
}

export function setVarPx(el, name, value) {
  el.style.setProperty(name, value + 'px');
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Taskbar button rendering — used by window manager and menus.
export function renderTaskbar() {
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
