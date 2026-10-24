import { CATS } from './data/cars';
import { SERIES } from './data/series';
import { rnd, shuffle } from './util';

export interface Question {
  q: string;
  a: string;
  opts: string[];
  pic?: string; // Wikipedia title whose photo IS the question
  img?: string; // Wikipedia title for an optional illustration
}
export interface Brand { brand: string; country: string; cat: string; models: string[] }
export type Difficulty = 1 | 2 | 3;

const RAW_BRANDS: Brand[] = Object.entries(CATS).flatMap(([cat, c]) => (c.brands ?? []).map(s => {
  const i = s.indexOf(':'), [brand, country = c.country!] = s.slice(0, i).split('/');
  return {brand, country, cat, models: s.slice(i + 1).split(',')};
}));
// Drop model names used by 2+ brands so every question has exactly one right answer.
const seen = new Map<string, number>();
RAW_BRANDS.forEach(b => b.models.forEach(m => seen.set(m.toLowerCase(), (seen.get(m.toLowerCase()) ?? 0) + 1)));
export const BRANDS: Brand[] = RAW_BRANDS.map(b => ({...b, models: b.models.filter(m => seen.get(m.toLowerCase()) === 1)}));
const COUNTRIES = [...new Set(BRANDS.map(b => b.country))];

// "Brand" = all its models, "Brand:a,b" = only those, "Brand:-a,b" = all except those.
function pickBrand(p: string): Brand {
  const [name, list] = p.split(':'), b = BRANDS.find(x => x.brand === name);
  if (!b) throw new Error(`Unknown brand in pick: ${name}`);
  if (!list) return b;
  const except = list[0] === '-', ms = (except ? list.slice(1) : list).split(',');
  ms.forEach(m => { if (!b.models.includes(m)) throw new Error(`Unknown model in pick: ${name} ${m}`); });
  return {...b, models: b.models.filter(m => ms.includes(m) !== except)};
}
export const brandsOf = (cat: string): Brand[] =>
  cat === 'All' ? BRANDS : CATS[cat].pick ? CATS[cat].pick!.map(pickBrand) : BRANDS.filter(b => b.cat === cat);

const trivia = (s: string): Question => { const [q, ...opts] = s.split('|'); return {q, a: opts[0], opts}; };
const triviaOf = (cats: string[], d: 2 | 3) => cats.flatMap(c => CATS[c][d === 2 ? 't2' : 't3'].map(trivia));

export const title = (cat: string) => cat === 'All' ? 'All cars' : CATS[cat].title ?? cat + ' cars';
export const subtitle = (cat: string) => {
  const key = CATS[cat]?.series;
  if (key) { const l = SERIES[key].list; return `${new Set(l.map(c => c.name)).size} world champions · ${l[0].y}–${l.at(-1)!.y}`; }
  const bs = brandsOf(cat), models = bs.reduce((n, b) => n + b.models.length, 0);
  return `${bs.length} brands · ${models} models${cat === 'All' ? ', mixed' : ''}`;
};

// Generated champion questions; recent seasons are easy, the oldest hard.
function champPool(cat: string, d: Difficulty): Question[] {
  const {list, nat, wiki = {}, era: [easy, mid], team, champ} = SERIES[CATS[cat].series!];
  const era = (y: number) => y >= easy ? 1 : y >= mid ? 2 : 3;
  const harder = (y: number) => Math.min(3, era(y) + 1);
  const names = [...new Set(list.map(c => c.name))], teams = [...new Set(list.map(c => c.team))], countries = [...new Set(Object.values(nat))];
  const near = (y: number, not: string) => { // distractors: champions from around the same era first
    const n = shuffle([...new Set(list.filter(c => Math.abs(c.y - y) <= 12).map(c => c.name))].filter(x => x !== not));
    return [...n, ...shuffle(names.filter(x => x !== not && !n.includes(x)))].slice(0, 3);
  };
  const qs: Question[] = [];
  for (const c of list) {
    if (era(c.y) === d) qs.push({q: `Who won the ${c.y} ${champ(c.y)}?`, a: c.name, opts: [c.name, ...near(c.y, c.name)]});
    if (harder(c.y) === d) qs.push({q: `With which ${team} did ${c.name} win the ${c.y} title?`, a: c.team, opts: [c.team, ...shuffle(teams.filter(t => t !== c.team)).slice(0, 3)]});
  }
  for (const name of names) {
    const years = list.filter(c => c.name === name).map(c => c.y), y = years[0], w = wiki[name] ?? name, n = years.length;
    if (era(y) === d) qs.push({q: 'Who is this?', a: name, opts: [name, ...near(y, name)], pic: w});
    if (harder(y) !== d) continue;
    const wrong = shuffle([...Array(17)].map((_, i) => y - 8 + i).filter(x => x >= list[0].y && x <= list.at(-1)!.y && !years.includes(x))).slice(0, 3);
    qs.push({q: n > 1 ? `In which year did ${name} win their first title?` : `In which year did ${name} become World Champion?`, a: String(y), opts: [y, ...wrong].map(String), img: w});
    if (n > 1) qs.push({q: `How many world titles did ${name} win?`, a: String(n), opts: [n, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(x => x !== n)).slice(0, 3)].map(String), img: w});
    qs.push({q: `Which country is ${name} from?`, a: nat[name], opts: [nat[name], ...shuffle(countries.filter(x => x !== nat[name])).slice(0, 3)], img: w});
  }
  return d === 1 ? qs : [...qs, ...triviaOf([cat], d)];
}

export function questionPool(cat: string, d: Difficulty): Question[] {
  if (CATS[cat]?.series) return champPool(cat, d);
  const cats = cat === 'All' ? Object.keys(CATS).filter(k => !CATS[k].series) : [cat];
  const brands = brandsOf(cat);
  const others = (b: Brand) => { // distractor brands: same pool first, padded from all brands
    const same = shuffle(brands.filter(x => x.brand !== b.brand));
    return [...same, ...shuffle(BRANDS.filter(x => !same.includes(x) && x.brand !== b.brand))].slice(0, 3);
  };
  const anyModel = (b: Brand) => b.models[rnd(b.models.length)];
  if (d === 1) {
    const qs: Question[] = brands.flatMap(b => b.models.flatMap(m => [
      {q: `Which brand makes the ${m}?`, a: b.brand, opts: [b.brand, ...others(b).map(x => x.brand)], img: `${b.brand} ${m}`},
      {q: 'Which car is this?', a: `${b.brand} ${m}`, opts: [`${b.brand} ${m}`, ...others(b).map(x => `${x.brand} ${anyModel(x)}`)], pic: `${b.brand} ${m}`}]));
    if (['All', 'World', 'Sports'].includes(cat)) qs.push(...brands.map(b =>
      ({q: `Which country does ${b.brand} come from?`, a: b.country, opts: [b.country, ...shuffle(COUNTRIES.filter(c => c !== b.country)).slice(0, 3)]})));
    return qs;
  }
  const t = triviaOf(cats, d);
  if (d === 3) return t;
  return [...t, ...brands.flatMap(b => {
    const [m, ...rest] = shuffle(b.models);
    const qs: Question[] = [{q: `Which of these is a ${b.brand} model?`, a: m, opts: [m, ...others(b).map(anyModel)]}];
    // Harder picture round: tell apart models of the same brand.
    if (rest.length >= 3) qs.push({q: `Which ${b.brand} is this?`, a: m, opts: [m, ...rest.slice(0, 3)], pic: `${b.brand} ${m}`});
    return qs;
  })];
}
