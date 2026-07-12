# Chrome Task APIs — demos

Standalone demos for every Chrome built-in AI **task API**, one folder per API, plus a
model-download and availability story on the index. Zero dependencies, zero build step,
zero network calls at inference time. Styled to match sandeep.ramgolam.com (hand-drawn
card borders, squiggle underlines, pill buttons).

## Run it

```bash
# from the repo root — any static server works (secure context = localhost is fine)
npx serve .
# or
python3 -m http.server 4173
```

Open the printed URL in **Chrome 138+ on desktop** (149+ recommended). `file://` won't work —
the APIs need a secure context.

## The demos

| Folder | API(s) | What it demonstrates | Example used |
|---|---|---|---|
| `/` (index) | all | `availability()` states, user-activated model download with `downloadprogress` | — |
| `demos/summarizer` | Summarizer | the four `type` options side by side, streaming | a long local-news story |
| `demos/translator` | Language Detector + Translator, chained | confidence scores, per-language-pair packs | short messages in five languages |
| `demos/writer-rewriter` | Writer + Rewriter | `tone`/`length` options, streaming, `more-formal`/`more-casual` | an email brief |
| `demos/proofreader` | Proofreader | corrections with `startIndex`/`endIndex` range highlighting, `correctedInput` | a draft full of typos |

Shared pieces live in `shared/`: the stylesheet and `ai.js` (session helper with download
progress, streaming helper, the hand-drawn card border).

## Expected availability (as of July 2026)

- **Summarizer, Translator, Language Detector** — stable since Chrome 138: should show
  `available` or `downloadable` on any supported machine.
- **Writer, Rewriter** — origin trial ended at Chrome 148; **Proofreader** — OT ended at 145.
  On current stable they report `missing` (the globals don't exist) — **upgrading Chrome makes
  them disappear, not appear.** Enable via `chrome://flags` (search "gemini nano", e.g.
  `#writer-api-for-gemini-nano`), relaunch, reload — or use an Early Preview Program build.
  The demos' graceful-degradation UX is intentional: availability states are part of the story.

## Hardware notes (why an API can be `unavailable`)

~22 GB free disk on the Chrome-profile volume; GPU with >4 GB VRAM **or** the CPU path
(16 GB RAM + 4 cores); unmetered network for the one-time download. Details:
[developer.chrome.com/docs/ai/get-started](https://developer.chrome.com/docs/ai/get-started)

## Resetting the model (to demo the download live)

- **Chrome Settings → System → "On-device AI" → off** — removes the ~4 GB `weights.bin`
  immediately (rolling out since ~Feb 2026). Toggle back on, or click any demo button,
  to trigger a fresh user-activated download.
- If the toggle isn't in your build: disable `chrome://flags/#optimization-guide-on-device-model`
  (and `#prompt-api-for-gemini-nano`), relaunch. Deleting files without disabling first is
  pointless — Chrome re-downloads at the next opportunity.
- **Translation packs are separate** (one per language pair) — manage them at
  `chrome://on-device-translation-internals`.
- Chrome also auto-evicts the model when free disk drops below 10 GB, and re-downloads later.
- Inspect model state and event logs at `chrome://on-device-internals`.
- **If the re-download sticks at `downloading` / 0%** (a known quirk after the settings toggle —
  the model is registered for download but the updater fetches lazily): go to
  `chrome://components` → "Optimization Guide On Device Model" → **Check for update** to force
  the fetch; failing that, fully quit and relaunch Chrome.
- **Repeatable rehearsal loop**: launch Chrome with a throwaway profile directory —
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --user-data-dir=$(mktemp -d)`
  — the model store lives in the user-data dir, so every launch starts from `downloadable`.
  (A secondary channel like Chrome Beta has its own data dir and works the same way.)
- **Stage strategy**: pre-download the ~4 GB foundation model in the greenroom; demo the
  *translation pack* download live instead — it is small, fast, and shows the same
  `downloadable → downloading → available` arc with real progress events.

## Talk-mode checklist

- Pre-download in the greenroom: trigger every download once; verify all chips are green.
- The whole page then works with **Wi-Fi off** — worth saying on stage.
- Audience participation: swap any sample text with submissions from the room.
- If an API is red on stage, that *is* the availability-states story — narrate it.

## Docs

[Built-in APIs overview](https://developer.chrome.com/docs/ai/built-in-apis) ·
[Summarizer](https://developer.chrome.com/docs/ai/summarizer-api) ·
[Translator](https://developer.chrome.com/docs/ai/translator-api) ·
[Language Detector](https://developer.chrome.com/docs/ai/language-detection) ·
[Writer](https://developer.chrome.com/docs/ai/writer-api) ·
[Rewriter](https://developer.chrome.com/docs/ai/rewriter-api) ·
[Proofreader](https://developer.chrome.com/docs/ai/proofreader-api)
