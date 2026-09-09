// Mahanin OS 94 — clock and network gauge.

import { setText, clamp } from './utils.js';

// Uptime is an exact age off the real birthday, 10 Nov 1994. The old version counted
// days from a 1 Jan 1994 epoch and split them with /365 and %365, which overshot by a
// whole year before November and drifted a day per leap year. Compare date-only UTC
// midnights so DST shifts can never round the day count off by one.
const BIRTH_YEAR = 1994;
const BIRTH_MONTH = 10; // zero-based: November
const BIRTH_DATE = 10;

export function uptimeText(now) {
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

export function tick() {
  const now = new Date();
  let hours = now.getHours();
  const ampm = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, '0');
  setText('clock', hours + ':' + minutes + ' ' + ampm);
  setText('uptime', uptimeText(now));
  netTick();
}

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

export let netDown = 300;
export let netUp = 72.4;
export let netUpBurst = 0;
export let netPing = 49;
export let netConn = 60;

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

export function netTick() {
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
