// Builds <flow>/<variant>/review.html: every screenshot next to its prompt,
// grades and the judge's reasons, for a person to check the grading by eye.
// Usage: node evals/review.mjs evals/scene-quality baseline [--blind]
// --blind hides the judge's grades (for collecting independent human ratings).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [flow, variant = 'baseline', flag] = process.argv.slice(2);
const blind = flag === '--blind';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const rows = readFileSync(join(flow, variant, 'results.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
rows.sort((a, b) => a.prompt_id.localeCompare(b.prompt_id));

const LABELS = { prompt_match: 'Matches prompt', explicit: 'Explicit asks', not_broken: 'Not broken', overall: 'Overall', valid_first: 'Valid 1st try' };
const cards = rows.map((r, i) => {
  const img = `out/${r.prompt_id}_rep${r.rep}.png`;
  const grades = blind ? '' : Object.entries(r.grade).map(([k, v]) => {
    const good = k === 'overall' ? v >= 4 : v === 1;
    const bad = k === 'overall' ? v <= 2 : v === 0;
    const reason = r.explanation?.[k] ? `<p class="why">${esc(r.explanation[k])}</p>` : '';
    return `<li class="${good ? 'good' : bad ? 'bad' : 'mid'}"><b>${esc(LABELS[k] ?? k)}: ${k === 'overall' ? `${v}/5` : v ? 'yes' : 'no'}</b>${reason}</li>`;
  }).join('');
  return `<article><img src="${esc(img)}" alt="" loading="lazy"><div>
    <div class="id">#${i + 1} · ${esc(r.prompt_id)} · ${esc((r.tags ?? []).join(' · '))}</div>
    <h2>“${esc(r.prompt)}”</h2>
    ${blind ? '<p class="ask">Your rating: Overall 1–5, and does it match the prompt (yes/no)?</p>' : `<ul>${grades}</ul>`}
  </div></article>`;
}).join('\n');

writeFileSync(join(flow, variant, 'review.html'), `<!doctype html><meta charset="utf-8">
<title>Scene review (${esc(variant)})</title>
<style>
  body { margin: 0; padding: 24px 16px 64px; background: #10131c; color: #e6e9f2; font: 17px/1.55 system-ui, sans-serif; }
  main { max-width: 1100px; margin: 0 auto; display: grid; gap: 28px; }
  h1 { margin: 0; font-size: 26px; } .lede { color: #98a2b8; margin: 0; }
  article { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 20px; background: #171c2a; border: 1px solid #262e45; border-radius: 12px; padding: 16px; }
  @media (max-width: 760px) { article { grid-template-columns: 1fr; } }
  img { width: 100%; border-radius: 8px; display: block; }
  .id { font: 13px ui-monospace, Menlo, monospace; color: #98a2b8; }
  h2 { margin: 4px 0 12px; font-size: 21px; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  li { border-left: 4px solid #59627a; padding-left: 10px; } li.good { border-color: #4fbf7a; } li.bad { border-color: #ff7a7a; } li.mid { border-color: #e2b33a; }
  .why { margin: 2px 0 0; color: #b9c0d3; font-size: 15px; } .ask { color: #e2b33a; }
</style>
<main><h1>Scene review: ${esc(variant)}</h1>
<p class="lede">${rows.length} scenes. ${blind ? 'Judge grades hidden. Rate each one yourself.' : 'Green = good, red = bad, yellow = in between.'}</p>
${cards}</main>`);
console.log(join(flow, variant, 'review.html'));
