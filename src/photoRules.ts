// Photo lookup rules shared by the browser (live lookups) and scripts/photos.ts (build-time cache).
export const API = 'https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&formatversion=2&redirects=1&prop=pageimages|pageprops&piprop=thumbnail&pithumbsize=330&ppprop=disambiguation&';

export interface Page { title: string; missing?: boolean; index?: number; thumbnail?: { source: string }; pageprops?: object }

// A search hit only counts if it is more than a bare brand, names the same brand/first name and one
// title contains the other ("BMW 3/15" for "BMW 3/15 Dixi"), so a search never swaps in a different car.
const base = (s: string) => s.replace(/\(.*?\)/g, '').trim().toLowerCase();
export const matches = (query: string, found: string) => {
  const q = base(query), f = base(found);
  return f.includes(' ') && f.startsWith(q.split(' ')[0]) && (q.includes(f) || f.includes(q));
};
// Brand pages lead with a logo, not a car: skip SVGs and files named "logo".
export const usable = (p: Page) => !!p.thumbnail && !p.pageprops && !/\.svg\/|logo/i.test(p.thumbnail.source);
// Search only for titles with no article; a "may refer to" page means the name is ambiguous.
export const shouldSearch = (title: string, page: Page | undefined) => (!page || !!page.missing) && !title.includes('(');
export const searchParams = (title: string) => 'generator=search&gsrlimit=3&gsrsearch=' + encodeURIComponent(title);
export const bestHit = (title: string, hits: Page[]) =>
  [...hits].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)).find(p => usable(p) && matches(title, p.title))?.thumbnail?.source;

// photos.json stores thumbnails compactly: no common prefix, no tracking query, and the usual
// ".../e/e5/File.jpg/330px-File.jpg" shape as just "e/e5/File.jpg".
export const THUMB = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/';
export const pack = (url: string) => {
  const path = url.split('?')[0].replace(THUMB, '');
  return path.match(/^([0-9a-f]\/[0-9a-f]{2}\/([^/]+))\/330px-\2$/)?.[1] ?? path;
};
export const unpack = (s: string) => {
  if (s.startsWith('https://')) return s;
  if (s.split('/').length > 3) return THUMB + s; // stored as-is: not the usual shape
  return `${THUMB}${s}/330px-${s.slice(s.lastIndexOf('/') + 1)}`;
};
