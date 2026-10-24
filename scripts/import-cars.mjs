// Turns scripts/data/cars.txt ("Brand Model (variant)<TAB>count" per line) into src/data/imported.ts.
// Generations and body styles collapse into one model ("Integra II Sedan" -> "Integra"); concepts are dropped.
// Run: node scripts/import-cars.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const MULTI = ['Aston Martin', 'Alfa Romeo', 'Land Rover', 'Lynk & Co', 'De Tomaso', 'De Lorean', 'Great Wall', 'David Brown',
  'W Motors', 'Hispano Suiza', 'Sin Cars', 'Iran Khodro', 'Touring Superleggera'];
// File spelling -> the game's brand name.
const ALIAS = {Citroen: 'Citroën', Skoda: 'Škoda', Seat: 'SEAT', AUDI: 'Audi', 'De Lorean': 'DeLorean', 'Hispano Suiza': 'Hispano-Suiza',
  XPENG: 'XPeng', ChangAn: 'Changan', RAM: 'Ram', Li: 'Li Auto', KGM: 'SsangYong', Moskvich: 'Moskvitch', DongFeng: 'Dongfeng',
  IsoRivolta: 'Iso', capricorn: 'Capricorn'};
// Home country of brands the game did not have yet. Brands not listed here (unknown origin, vans only) are skipped.
const COUNTRY = {
  China: '212 AITO Aeolus Aion Aiways Arcfox Avatr BAIC BAW Baojun Bestune Bisu Bordrin Brilliance ChangFeng DFSK Deepal Denza Dongfeng Dorcen Enovate Exeed FAW Fangchengbao Farizon Firefly Forthing Foton Fulwin Geometry Haima Hawtai HiPhi HuangHai Hycan Hyper Hyptec ICH-X IM JAC JMEV Jaecoo Jetour Jetta Jiangling Kaiyi Karlmann LDV Landwind Lepas Linktour Livan Luxeed M-Hero Maextro Maxus Neta ORA Omoda Onvo Qiantu Qoros Riddara Roewe Rox SAIC SWM Seres Skywell Soueast Stelato Tank Techrules Trumpchi Voyah WEY Weltmeister Yangwang ZX Zhidou Zotye iCAR iCAUR',
  Germany: 'Apollo Artega Bitter Capricorn Elaris Isdera Melkus RUF VW-Porsche Wiesmann e.GO',
  Italy: 'Bertone Bizzarrini Cizeta Corbellati DR Dallara EVO GFG Innocenti Italdesign Kimera Pininfarina Puritalia Touring_Superleggera',
  'United Kingdom': 'BAC Bristol Carbodies Daimler David_Brown Eadon Ginetta INEOS Invicta LEVC Lister Ronart',
  USA: 'Aria DeSoto Drako Eagle Geo Hennessey Karma Panoz Polaris SCG SSC Scion Scout Vanderhall Vector',
  France: 'Aixam DS Delage Ligier Mega',
  Japan: 'Aspark Datsun FOMM Sony',
  Sweden: 'Polestar',
  'South Korea': 'Asia',
  Russia: 'Aurus Evolute Izh TagAz Tenet ZIL',
  Spain: 'Baltasar EBRO Hurtan Santana Silence Spania Tramontana',
  Switzerland: 'Micro Picasso Rinspeed Sbarro',
  Austria: 'Engler KTM PUCH',
  Australia: 'Brabham HSV',
  Mexico: 'VUHL Zacua',
  India: 'DC Premier',
  'Czech Republic': 'Praga',
  Romania: 'Aro',
  Latvia: 'Baltijas',
  Belarus: 'BelGee',
  Malaysia: 'Bufori',
  Canada: 'Campagna',
  Netherlands: 'Donkervoort',
  Brazil: 'Fittipaldi',
  Iran: 'Iran_Khodro',
  Taiwan: 'Luxgen',
  Uzbekistan: 'Ravon',
  Bulgaria: 'Sin_Cars',
  'United Arab Emirates': 'W_Motors',
  Ukraine: 'ZAZ',
  Denmark: 'Zenvo',
};
const CATEGORY = {Germany: 'German', Japan: 'Japanese', USA: 'American', Italy: 'Italian', 'United Kingdom': 'British', France: 'French',
  Sweden: 'Swedish', 'South Korea': 'Korean', China: 'Chinese'}; // anything else goes to World
const home = Object.fromEntries(Object.entries(COUNTRY).flatMap(([c, bs]) => bs.split(' ').map(b => [b.replace(/_/g, ' '), c])));

const ROMAN = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)$/;
const KEEP_BEFORE_ROMAN = new Set(['Model', 'Mark', 'Type', 'Series', 'Class']); // Tesla Model X, Toyota Mark II
const BODY = ['shooting brake', 'gran coupe', 'gran coupé', 'crew cab', 'double cab', 'single cab', 'king cab', 'extended cab', 'long deck',
  'panel van', 'sports tourer', 'hatchback', 'sedan', 'saloon', 'coupe', 'coupé', 'cabriolet', 'cabrio', 'convertible', 'wagon', 'estate',
  'sportback', 'avant', 'variant', 'combi', 'kombi', 'break', 'liftback', 'van', 'pickup', 'pick-up', 'limousine', 'hardtop', 'targa',
  'touring', 'tourer', 'roadster', 'lwb', 'swb', '3-door', '5-door', '3d', '5d', '3dr', '5dr', '2-door', '4-door', 'hatch', 'long', 'touring sports',
  'activehybrid', 'active hybrid', 'plug-in hybrid', 'hybrid', 'phev', 'station wagon', 'station', 'soft top', 'hard top', 'box', 'bed',
  'cab', 'caravan', 'sw', 'turnier', 'sportwagon', 'weekend', 'supercrew', 'cargo', 'l1', 'l2', 'l1h1', 'l2h2', 'club', 'sportsman',
  'four-door', 'two-door', 'door', 'regular', 'supercab', 'super cab', 'xl', 'maxi', '/', 'mk', 'volante', 'electric', 'ev', 'extra', 'classic', 'suv', '2+2'];
const LETTER_GENERATIONS = new Set(['Opel', 'Vauxhall']); // "Astra F", "Astra G": the letter is the generation

function model(rest, brand) {
  let t = rest.replace(/\(.*?\)/g, ' ').replace(/,/g, ' / ').split(/\s+/).filter(Boolean);
  // Generation numerals anywhere after the first word: "C4 II Picasso" -> "C4 Picasso".
  t = t.filter((w, i) => i === 0 || !(ROMAN.test(w) || LETTER_GENERATIONS.has(brand) && /^[A-K]$/.test(w)) || KEEP_BEFORE_ROMAN.has(t[i - 1]));
  for (let changed = true; changed && t.length > 1;) {
    changed = false;
    for (const b of BODY) {
      const n = b.split(' ').length;
      if (t.length > n && t.slice(-n).join(' ').toLowerCase() === b) { t = t.slice(0, -n); changed = true; break; }
    }
  }
  return t.join(' ').replace(/\s*\/$/, '');
}

const out = {};
for (const line of readFileSync(new URL('./data/cars.txt', import.meta.url), 'utf8').split('\n')) {
  const name = line.split('\t')[0].trim();
  if (!name || /concept|prototype|\bvision\b/i.test(name)) continue;
  const raw = MULTI.find(m => name.startsWith(m + ' ')) ?? name.split(' ')[0];
  const brand = ALIAS[raw] ?? raw, m = model(name.slice(raw.length), brand);
  if (m.length < 2 || !/^[\p{L}\d]/u.test(m)) continue;
  (out[brand] ??= new Map()).set(m.toLowerCase(), out[brand]?.get(m.toLowerCase()) ?? m);
}

let models = 0;
const rows = Object.entries(out).sort(([a], [b]) => a.localeCompare(b)).map(([brand, ms]) => {
  models += ms.size;
  const country = home[brand];
  const meta = country ? `, cat: '${CATEGORY[country] ?? 'World'}'${CATEGORY[country] ? '' : `, country: '${country}'`}` : '';
  return `  ${JSON.stringify(brand)}: {models: ${JSON.stringify([...ms.values()].join(','))}${meta}},`;
});
writeFileSync(new URL('../src/data/imported.ts', import.meta.url), `// Generated by scripts/import-cars.mjs from scripts/data/cars.txt. Do not edit by hand.
// Brands the game already has get these models added; new brands carry their category (and country for World).
export const IMPORTED: Record<string, { models: string; cat?: string; country?: string }> = {
${rows.join('\n')}
};
`);
console.log(`${rows.length} brands, ${models} models -> src/data/imported.ts`);
