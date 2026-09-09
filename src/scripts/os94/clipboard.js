// Mahanin OS 94 — clipboard copy with visual feedback.

import { setText } from './utils.js';

export function copyToClipboard(text, btn) {
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
