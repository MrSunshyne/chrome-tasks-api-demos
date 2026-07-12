/* Shared machinery for the task-API demos.
   Every inference is on-device. All create() calls sit behind user clicks
   because a create() that needs a model download requires user activation. */

// ── tiny DOM helpers ───────────────────────────────────────────────────────

export const $ = (sel) => document.querySelector(sel);
export const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function say(el, html, { error = false } = {}) {
  el.classList.toggle('err', error);
  el.innerHTML = html;
}
export function spin(el, msg) { say(el, `<span class="spin">${esc(msg)}</span>`); }

// ── API metadata ───────────────────────────────────────────────────────────

// Writer/Rewriter finished their origin trial at Chrome 148, Proofreader at 145;
// none of them exist in stable Chrome by default — newer Chrome doesn't help.
export const POST_OT_HINT = 'its origin trial has ended and it is not in stable Chrome yet. '
  + 'Enable it via chrome://flags (search “gemini nano”, e.g. #writer-api-for-gemini-nano), '
  + 'relaunch, and reload this page — or use the Early Preview Program.';

export const APIS = [
  { key: 'summarizer', name: 'Summarizer', global: 'Summarizer', group: 'foundation' },
  { key: 'writer', name: 'Writer', global: 'Writer', group: 'foundation', missingHint: POST_OT_HINT },
  { key: 'rewriter', name: 'Rewriter', global: 'Rewriter', group: 'foundation', missingHint: POST_OT_HINT },
  { key: 'proofreader', name: 'Proofreader', global: 'Proofreader', group: 'foundation',
    createArgs: { expectedInputLanguages: ['en'] }, missingHint: POST_OT_HINT },
  { key: 'translator', name: 'Translator (en→fr)', global: 'Translator', group: 'task',
    availabilityArgs: { sourceLanguage: 'en', targetLanguage: 'fr' },
    createArgs: { sourceLanguage: 'en', targetLanguage: 'fr' } },
  { key: 'detector', name: 'Language Detector', global: 'LanguageDetector', group: 'task' },
];

export const GROUPS = [
  { id: 'foundation', label: 'One shared foundation model',
    note: "All four share Chrome's ~4 GB on-device model — documented as Gemini Nano, though Chrome doesn't promise which model serves which API (smaller expert models can back the task APIs on modest hardware). One download; clearing it resets all four. Inspect yours at chrome://on-device-internals." },
  { id: 'task', label: 'Own task-specific models',
    note: 'Each downloads its own small model — the Translator fetches one pack per language pair.' },
];

export async function stateOf(api) {
  if (!(api.global in self)) return 'missing';
  try {
    return await self[api.global].availability(api.availabilityArgs);
  } catch (err) {
    console.warn(`${api.global}.availability() threw: ${err.name}: ${err.message}`);
    return 'unavailable';
  }
}

// ── session machinery ──────────────────────────────────────────────────────

const sessions = new Map();

/** Get (or create) a session, surfacing download progress in `out`.
    cache:false → caller uses the session once and destroys it (on-device
    sessions hold real resources; keeping several alive causes contention).
    Fires a "model-downloaded" event on document after a download completes,
    so availability boards can refresh themselves. */
export async function ensure(globalName, createOpts, out, { cache = true } = {}) {
  if (!(globalName in self)) {
    const hint = APIS.find((a) => a.global === globalName)?.missingHint
      ?? 'it needs Chrome 138+ on desktop (Firefox/Safari don’t implement it).';
    throw new Error(`${globalName} doesn't exist in this browser — ${hint}`);
  }
  const cacheKey = globalName + JSON.stringify(createOpts ?? {});
  if (cache && sessions.has(cacheKey)) return sessions.get(cacheKey);

  const availability = await self[globalName].availability(
    createOpts?.sourceLanguage ? { sourceLanguage: createOpts.sourceLanguage, targetLanguage: createOpts.targetLanguage } : undefined,
  );
  if (availability === 'unavailable') {
    throw new Error(`${globalName} reports “unavailable” on this device/channel — see the availability board on the index and the README.`);
  }
  if (availability !== 'available') spin(out, `preparing ${globalName} — a model download may start`);

  let downloaded = false;
  const session = await self[globalName].create({
    ...createOpts,
    monitor(m) {
      m.addEventListener('downloadprogress', (ev) => {
        downloaded = true;
        spin(out, `downloading ${globalName} model… ${Math.round(ev.loaded * 100)}%`);
      });
    },
  });
  if (cache) sessions.set(cacheKey, session);
  if (downloaded) document.dispatchEvent(new CustomEvent('model-downloaded'));
  return session;
}

export async function streamInto(stream, out) {
  say(out, '');
  for await (const chunk of stream) out.textContent += chunk;
}

// ── page chrome, applied on import ─────────────────────────────────────────

// the blog's HandDrawnShape card variant; hover morph lives in the stylesheet
const CARD_PATH = 'M12 6 Q8 5 5 8 Q3 11 4 16 L4 18 Q2 50 5 80 T3 140 Q5 180 4 220 T5 270 Q3 285 5 290 Q6 294 10 295 L20 294 Q70 296 120 294 T220 296 Q280 294 340 296 T390 294 Q394 294 396 290 Q398 286 396 280 L397 270 Q395 230 397 190 T395 130 Q397 90 396 50 T397 16 Q398 10 394 7 Q390 4 385 5 L370 6 Q310 4 250 6 T130 4 Q70 6 20 5 Z';

function decorateCards() {
  document.querySelectorAll('.card').forEach((card) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'hand-drawn-shape');
    svg.setAttribute('viewBox', '0 0 400 300');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'shape-path');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('d', CARD_PATH);
    svg.append(path);
    card.prepend(svg);
  });
}

// masthead folio line: real date, and an issue “№” borrowed from the Chrome major version
function folio() {
  const el = $('#folio');
  if (!el) return;
  const chromeMajor = navigator.userAgentData?.brands
    ?.find((b) => /Chrom/.test(b.brand))?.version
    ?? (navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] ?? '—');
  const date = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  el.textContent = `Chrome ${chromeMajor} · ${date} · running on-device`;
}

decorateCards();
folio();
