import { API, bestHit, searchParams, shouldSearch, unpack, usable, type Page } from './photoRules';

// Photo for a Wikipedia title, already loaded into the browser cache; undefined if none, offline or slow.
// public/photos.json (built at deploy) answers most titles without asking Wikipedia; others are looked up live.
const cache = new Map<string, Promise<string | undefined>>();
const manifest: Promise<Record<string, string | null>> = fetch('./photos.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));

export function photo(title: string) {
  if (!cache.has(title)) {
    const p = resolve(title);
    cache.set(title, p);
    p.then(src => { if (!src) cache.delete(title); }); // a miss may be a timeout: allow a later retry
  }
  return cache.get(title)!;
}

async function resolve(title: string): Promise<string | undefined> {
  const known = (await manifest)[title];
  if (known === null) return undefined; // checked at build time: no usable photo
  const src = known ? unpack(known) : await lookup(title);
  return src && await loads(src) ? src : undefined;
}

async function pages(params: string): Promise<Page[]> {
  const r = await fetch(API + params, {signal: AbortSignal.timeout(8000)});
  return (await r.json()).query?.pages ?? [];
}

async function lookup(title: string): Promise<string | undefined> {
  try {
    const [page] = await pages('titles=' + encodeURIComponent(title));
    if (shouldSearch(title, page)) return bestHit(title, await pages(searchParams(title)));
    return page && usable(page) ? page.thumbnail!.source : undefined;
  } catch {
    return undefined;
  }
}

const loads = (src: string) => new Promise<boolean>(done => {
  const img = new Image();
  img.onload = () => done(true);
  img.onerror = () => done(false);
  setTimeout(() => done(false), 8000);
  img.src = src;
});

export const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
