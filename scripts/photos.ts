// Builds public/photos.json: Wikipedia thumbnail for every photo title, so players skip the live lookup.
// Run with `npm run photos` (the deploy workflow runs it before building). Safe to re-run; slow on purpose
// to stay inside Wikipedia's rate limits.
import { mkdirSync, writeFileSync } from 'node:fs';
import { API, bestHit, pack, searchParams, shouldSearch, usable, type Page } from '../src/photoRules';
import { photoTitles } from '../src/questions';

const HEADERS = {'User-Agent': 'GuessTheCar/1.0 (https://github.com/V3rkku1/Guess-the-car; photo cache build)'};
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function query(params: string) {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(API + params, {headers: HEADERS});
    if (r.ok) return (await r.json()).query ?? {};
    if (attempt === 8) throw new Error(`Wikipedia API ${r.status} after ${attempt} tries`);
    await sleep(r.status === 429 ? 15000 * attempt : 3000);
  }
}

const titles = photoTitles();
const out: Record<string, string | null> = {};
const toSearch: string[] = [];

// Exact titles, 50 per request; follow normalisation and redirects back to the asked title.
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50);
  const q = await query('titles=' + encodeURIComponent(batch.join('|')));
  const moved = new Map<string, string>([...(q.normalized ?? []), ...(q.redirects ?? [])].map((x: {from: string; to: string}) => [x.from, x.to]));
  const byTitle = new Map<string, Page>((q.pages ?? []).map((p: Page) => [p.title, p]));
  for (const t of batch) {
    let r = t;
    for (let hops = 0; moved.has(r) && hops < 5; hops++) r = moved.get(r)!;
    const page = byTitle.get(r);
    if (shouldSearch(t, page)) toSearch.push(t);
    else out[t] = page && usable(page) ? pack(page.thumbnail!.source) : null;
  }
  console.log(`exact ${Math.min(i + 50, titles.length)}/${titles.length}`);
  await sleep(500);
}

// Titles with no article: one search each.
for (const [n, t] of toSearch.entries()) {
  const hit = bestHit(t, (await query(searchParams(t))).pages ?? []);
  out[t] = hit ? pack(hit) : null;
  if (n % 25 === 0) console.log(`search ${n + 1}/${toSearch.length}`);
  await sleep(300);
}

// Models that redirect to a sibling (Golf GTI -> Golf, SEAT Mii -> VW Up!) share its photo; keep it for the
// first title only so a picture question never shows two options with the same photo.
const used = new Set<string>();
for (const t of titles) { const v = out[t]; if (v && used.has(v)) out[t] = null; else if (v) used.add(v); }

const found = Object.values(out).filter(Boolean).length;
mkdirSync('public', {recursive: true}); // git does not keep the empty folder
writeFileSync('public/photos.json', JSON.stringify(out)); // npm runs scripts from the project root
console.log(`photos.json: ${found}/${titles.length} titles have a photo (${toSearch.length} needed a search)`);
