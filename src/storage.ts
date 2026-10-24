export interface Options { sound: boolean; confirm: boolean; timer: boolean }
export interface CatStats { best: number; played: number; wins: number }

// localStorage can throw (private mode, blocked storage); the game works without it.
export const load = <T>(key: string, fallback: T): T => { try { return JSON.parse(localStorage[key]) ?? fallback; } catch { return fallback; } };
export const save = (key: string, value: unknown) => { try { localStorage[key] = JSON.stringify(value); } catch { /* not saved */ } };

export const OPT: Options = {sound: true, confirm: false, timer: false, ...load<Partial<Options>>('carOpts', {})};
export const STATS: Record<string, CatStats> = load('carStats', {});
