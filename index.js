/* The availability board: one chip per API, grouped by which model backs it,
   with user-activated downloads and live progress. */

import { $, esc, say, APIS, GROUPS, stateOf } from './shared/ai.js';

function chipHtml(api, state) {
  const wake = state === 'downloadable'
    ? `<button data-wake="${api.key}">download model</button>` : '';
  const bar = state === 'downloading' || state === 'downloadable'
    ? `<div class="progress" data-progress="${api.key}" hidden><i></i></div>` : '';
  const why = state === 'missing' && api.missingHint
    ? `<small class="why">origin trial ended — see README</small>` : '';
  return `<div class="chip" data-state="${state}" data-chip="${api.key}"${
    state === 'missing' && api.missingHint ? ` title="${esc(api.missingHint)}"` : ''}>
    <span class="name">${api.name}</span>
    <span class="state">${state}</span>
    ${wake}${bar}${why}
  </div>`;
}

let statusTimer;

async function renderStatusBoard() {
  const states = await Promise.all(APIS.map(stateOf));
  $('#chips').innerHTML = GROUPS.map((g) => `
    <div class="chip-group">
      <h3 class="group-label">${g.label}</h3>
      <p class="group-note">${g.note}</p>
      <div class="chip-row">
        ${APIS.map((api, i) => (api.group === g.id ? chipHtml(api, states[i]) : '')).join('')}
      </div>
    </div>`).join('');
  if (states.every((s) => s === 'missing')) {
    say($('#status-note'),
      `These APIs don't exist in this browser. They need Chrome 138 or newer on
       desktop; Firefox and Safari don't ship them.`);
  } else if (states.includes('unavailable')) {
    say($('#status-note'),
      `Some APIs are unavailable. Either the machine doesn't meet the hardware bar
       (about 22 GB of free disk, plus a 4 GB GPU or 16 GB of RAM), or the API needs
       a flag in this Chrome channel. The README has the details.`);
  } else if (states.includes('downloading')) {
    say($('#status-note'),
      `A model is downloading in the background (the foundation model is ~4 GB, so
       this takes a while). This board refreshes itself — detailed progress lives at
       chrome://on-device-internals.`);
  }

  // live-refresh while a background download is in flight
  clearTimeout(statusTimer);
  if (states.includes('downloading')) {
    statusTimer = setTimeout(renderStatusBoard, 4000);
  }
}

// wake buttons: create() from a click so the download is user-activated
$('#chips').addEventListener('click', async (e) => {
  const key = e.target.dataset.wake;
  if (!key) return;
  const api = APIS.find((a) => a.key === key);
  const chip = $(`[data-chip="${key}"]`);
  const bar = chip.querySelector('[data-progress] > i');
  chip.querySelector('[data-progress]').hidden = false;
  chip.dataset.state = 'downloading';
  chip.querySelector('.state').textContent = 'downloading';
  e.target.remove();
  try {
    await self[api.global].create({
      ...api.createArgs,
      monitor(m) {
        m.addEventListener('downloadprogress', (ev) => {
          bar.style.width = `${Math.round(ev.loaded * 100)}%`; // loaded is a 0–1 fraction
        });
      },
    });
    renderStatusBoard();
  } catch (err) {
    chip.dataset.state = 'unavailable';
    chip.querySelector('.state').textContent = 'unavailable';
    console.error(err);
  }
});

document.addEventListener('model-downloaded', renderStatusBoard);

renderStatusBoard();
