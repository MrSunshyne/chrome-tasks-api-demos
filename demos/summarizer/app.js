import { $, esc, say, spin, ensure, streamInto } from '../../shared/ai.js';

const WIRE_REPORT = `Traffic at the harbour roundabout stopped again on Tuesday morning because of a rooster. It was the third week in a row. The bird, which market vendors have started calling Napoleon, arrived at around 7:40 and settled on the centre island. Traffic officer M. Gopaul tried to move him twice and gave up both times. The council met on Thursday evening to discuss the matter. Three proposals were tabled: moving the rooster to the botanical garden, adopting him as the town mascot, and renaming the roundabout after him. None of the three passed. A petition at the fish market in favour of the mascot option has collected more than eight hundred signatures. The chamber of commerce says deliveries through the junction are running late. The bakery on the corner now sells a pastry named after the bird and says it cannot keep up with demand. As of Friday afternoon the rooster was still there.`;

$('#article-text').value = WIRE_REPORT;

$('#summarize-btn').addEventListener('click', async () => {
  const text = $('#article-text').value;
  // sequential on purpose: one on-device model, four cuts.
  // create → use → destroy per type: sessions hold model resources.
  for (const cell of document.querySelectorAll('[data-sum]')) {
    const type = cell.dataset.sum;
    let summarizer;
    try {
      summarizer = await ensure('Summarizer', {
        type,
        format: 'plain-text',
        length: 'short',
        sharedContext: 'A local news report.',
      }, cell, { cache: false });
      spin(cell, type === 'key-points' ? 'extracting' : 'summarizing');
      await streamInto(summarizer.summarizeStreaming(text), cell);
    } catch (err) {
      say(cell, esc(err.message), { error: true });
    } finally {
      summarizer?.destroy?.();
    }
  }
});
