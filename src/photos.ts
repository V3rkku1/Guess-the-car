// Lead photo of a Wikipedia article, already loaded into the browser cache; undefined if none,
// offline or slow. Exact title first, then a title search. Cached per title.
const API = 'https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&formatversion=2&redirects=1&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=330&ppprop=disambiguation&';
const cache = new Map<string, Promise<string | undefined>>();

interface Page { title: string; missing?: boolean; index?: number; thumbnail?: { source: string }; pageprops?: object }

export function photo(title: string) {
  if (!cache.has(title)) {
    const p = fetchPhoto(title);
    cache.set(title, p);
    p.then(src => { if (!src) cache.delete(title); }); // a miss may be a timeout: allow a later retry
  }
  return cache.get(title)!;
}

async function pages(params: string): Promise<Page[]> {
  const r = await fetch(API + params, {signal: AbortSignal.timeout(8000)});
  return (await r.json()).query?.pages ?? [];
}

// A search hit only counts if it is more than a bare brand, names the same brand/first name and one
// title contains the other ("BMW 3/15" for "BMW 3/15 Dixi"), so a search never swaps in a different car.
const base = (s: string) => s.replace(/\(.*?\)/g, '').trim().toLowerCase();
const matches = (query: string, found: string) => {
  const q = base(query), f = base(found);
  return f.includes(' ') && f.startsWith(q.split(' ')[0]) && (q.includes(f) || f.includes(q));
};
// Brand pages lead with a logo, not a car: skip SVGs and files named "logo".
const usable = (p: Page) => !!p.thumbnail && !p.pageprops && !/\.svg\/|logo/i.test(p.thumbnail.source);

async function fetchPhoto(title: string): Promise<string | undefined> {
  try {
    const [page] = await pages('titles=' + encodeURIComponent(title));
    let src = page && usable(page) ? page.thumbnail!.source : undefined;
    // Search only for titles with no article; a "may refer to" page means the name is ambiguous.
    if ((!page || 'missing' in page) && !title.includes('(')) {
      const hits = (await pages('generator=search&gsrlimit=3&gsrsearch=' + encodeURIComponent(title))).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
      src = hits.find(p => usable(p) && matches(title, p.title))?.thumbnail?.source;
    }
    return src && await loads(src) ? src : undefined;
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
