import { $, esc, say, spin, ensure } from '../../shared/ai.js';

const DISPATCHES = [
  { label: 'French',   text: `Notre correspondante à Port-Louis rapporte qu'une vague de chaleur record a transformé le marché central en concours improvisé de limonade. Les vendeurs parlent d'une affluence jamais vue depuis dix ans.` },
  { label: 'German',   text: `Das Stadtmuseum hat eine Katze eingestellt, um Besucher zu begrüßen. Die Direktorin bestätigt, dass die Besucherzahlen seitdem um vierzig Prozent gestiegen sind.` },
  { label: 'Spanish',  text: `La regata anual de pescadores terminó en empate por primera vez en su historia, después de que ambos capitanes se detuvieran a rescatar la misma boya perdida.` },
  { label: 'Japanese', text: `港町の小さなカフェがロボットのウェイターを導入したが、常連客がロボットに人生相談を始めたため、店主は困惑している。売り上げは過去最高だという。` },
  { label: 'Italian',  text: `Il festival del gelato ha battuto ogni record: la fila per il nuovo gusto al miele e rosmarino ha superato i seicento metri, bloccando il lungomare per tre ore.` },
];

$('#wire-pick').innerHTML = DISPATCHES
  .map((n, i) => `<option value="${i}">${n.label}</option>`).join('');
$('#wire-text').value = DISPATCHES[0].text;
$('#wire-pick').addEventListener('change', (e) => {
  $('#wire-text').value = DISPATCHES[+e.target.value].text;
  $('#translate-btn').disabled = true;
  say($('#detect-out'), ''); say($('#translate-out'), '');
});

let detectedLanguage = null;

$('#detect-btn').addEventListener('click', async () => {
  const out = $('#detect-out');
  try {
    const detector = await ensure('LanguageDetector', {}, out);
    const results = (await detector.detect($('#wire-text').value)).slice(0, 3);
    detectedLanguage = results[0]?.detectedLanguage ?? null;
    say(out, results.map((r) => `
      <div class="meter">
        <span>${esc(r.detectedLanguage)}</span>
        <span class="bar"><i style="width:${Math.round(r.confidence * 100)}%"></i></span>
        <span>${(r.confidence * 100).toFixed(1)}%</span>
      </div>`).join(''));
    $('#translate-btn').disabled = !detectedLanguage;
  } catch (err) {
    say(out, esc(err.message), { error: true });
  }
});

$('#translate-btn').addEventListener('click', async () => {
  const out = $('#translate-out');
  const targetLanguage = $('#target-lang').value;
  if (detectedLanguage === targetLanguage) {
    return say(out, `That message is already in “${targetLanguage}” — pick another target.`);
  }
  try {
    // each language pair is its own on-device pack; first use downloads it
    const translator = await ensure('Translator',
      { sourceLanguage: detectedLanguage, targetLanguage }, out);
    spin(out, `translating ${detectedLanguage} → ${targetLanguage}`);
    const result = await translator.translate($('#wire-text').value);
    say(out, esc(result));
  } catch (err) {
    say(out, esc(err.message), { error: true });
  }
});
