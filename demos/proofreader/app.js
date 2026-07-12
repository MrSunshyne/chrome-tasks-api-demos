import { $, esc, say, spin, ensure } from '../../shared/ai.js';

const DRAFT_WITH_TYPOS = `Dear Sir or Madam, I am writting to complane about the new trafic lights on Harbour Road. Their is three of them and none work at the same time, wich cause chaos every mornings. My neigbour says the council have plans to fix it, but I will beleive it when I sees it. Regards, a concerned residant.`;

$('#letter-text').value = DRAFT_WITH_TYPOS;

$('#proofread-btn').addEventListener('click', async () => {
  const marked = $('#proof-marked');
  const fixed = $('#proof-fixed');
  const text = $('#letter-text').value;
  try {
    const proofreader = await ensure('Proofreader', { expectedInputLanguages: ['en'] }, marked);
    spin(marked, 'checking');
    const result = await proofreader.proofread(text);

    // corrections carry startIndex/endIndex into the ORIGINAL text
    const ranges = [...(result.corrections ?? [])].sort((a, b) => a.startIndex - b.startIndex);
    let html = '', cursor = 0;
    for (const c of ranges) {
      html += esc(text.slice(cursor, c.startIndex));
      html += `<mark>${esc(text.slice(c.startIndex, c.endIndex))}</mark>`;
      cursor = c.endIndex;
    }
    html += esc(text.slice(cursor));
    say(marked, `${html}<br><small>${ranges.length} correction(s) found</small>`);
    say(fixed, `<strong>Corrected:</strong> ${esc(result.correctedInput ?? '')}`);
  } catch (err) {
    say(marked, esc(err.message), { error: true });
    say(fixed, '');
  }
});
