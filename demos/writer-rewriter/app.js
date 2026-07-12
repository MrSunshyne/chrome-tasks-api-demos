import { $, esc, say, spin, ensure, streamInto } from '../../shared/ai.js';

$('#write-btn').addEventListener('click', async () => {
  const out = $('#write-out');
  try {
    const writer = await ensure('Writer', {
      tone: $('#write-tone').value,
      length: $('#write-length').value,
      format: 'plain-text',
    }, out);
    spin(out, 'writing');
    await streamInto(writer.writeStreaming(`Write ${$('#story-idea').value}`), out);
    $('#rewrite-formal-btn').disabled = $('#rewrite-casual-btn').disabled = false;
  } catch (err) {
    say(out, esc(err.message), { error: true });
  }
});

async function rewrite(tone) {
  const out = $('#rewrite-out');
  const source = $('#write-out').textContent;
  if (!source) return;
  try {
    const rewriter = await ensure('Rewriter', { tone, format: 'plain-text' }, out);
    spin(out, 'rewriting');
    const result = await rewriter.rewrite(source);
    say(out, esc(result));
  } catch (err) {
    say(out, esc(err.message), { error: true });
  }
}
$('#rewrite-formal-btn').addEventListener('click', () => rewrite('more-formal'));
$('#rewrite-casual-btn').addEventListener('click', () => rewrite('more-casual'));
