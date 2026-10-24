export const PRIZES = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
export const SAFE = [4, 9]; // indexes of the safe-haven prizes

export const rnd = (n: number) => Math.floor(Math.random() * n);
export const shuffle = <T>(a: readonly T[]): T[] => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
export const euro = (n: number) => '€' + n.toLocaleString('en');
export const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
