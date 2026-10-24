// Lead photo of a Wikipedia article; undefined if missing, offline or slow. Cached per title.
const cache = new Map<string, Promise<string | undefined>>();

export function photo(title: string) {
  if (!cache.has(title)) cache.set(title, fetchPhoto(title));
  return cache.get(title)!;
}

async function fetchPhoto(title: string): Promise<string | undefined> {
  try {
    const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')), {signal: AbortSignal.timeout(4000)});
    const j = await r.json();
    return j.type === 'standard' ? j.thumbnail?.source : undefined;
  } catch {
    return undefined;
  }
}

export const wikiUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
