import './style.css';
import { CATS } from './data/cars';
import { questionPool, subtitle, title, type Difficulty, type Question } from './questions';
import { photo, wikiUrl } from './photos';
import { SFX } from './sound';
import { OPT, STATS, load, save, type Options } from './storage';
import { $, PRIZES, SAFE, euro, rnd, shuffle } from './util';

type Lifeline = 'l50' | 'laud' | 'lphone';
interface Game {
  cat: string;
  level: number;
  used: Set<string>;
  life: Record<Lifeline, boolean>;
  cur: Question | null;
  sel: HTMLButtonElement | null;
  busy: boolean;
  time: number;
}

let S: Game;
let tick: number | undefined;
const dlg = $<HTMLDialogElement>('dlg');
const cur = () => S.cur!;

for (const k of ['sound', 'confirm', 'timer'] as (keyof Options)[]) {
  const el = $<HTMLInputElement>('opt' + k[0].toUpperCase() + k.slice(1));
  el.checked = OPT[k];
  el.onchange = () => { OPT[k] = el.checked; save('carOpts', OPT); };
}

const safeAmount = () => { const i = [...SAFE].reverse().find(i => i < S.level); return i === undefined ? 0 : PRIZES[i]; };

function start(cat: string) {
  S = {cat, level: 0, used: new Set(), life: {l50: true, laud: true, lphone: true}, cur: null, sel: null, busy: false, time: 0};
  (['l50', 'laud', 'lphone'] as const).forEach(id => $(id).classList.remove('used'));
  $('sub').textContent = title(cat);
  show('play');
  lock(true);
  next().then(() => lock(false));
}

// true = shimmer placeholder, string = show photo, falsy = hide.
function setPhoto(src: string | boolean | undefined) {
  $('photo').hidden = !src;
  $('photo').classList.toggle('loading', !!src);
  if (typeof src === 'string') $<HTMLImageElement>('pic').src = src;
}
$('pic').onload = () => $('photo').classList.remove('loading');
$('pic').onerror = () => setPhoto(false);

async function next() {
  const d = (S.level < 5 ? 1 : S.level < 10 ? 2 : 3) as Difficulty;
  const key = (x: Question) => x.q + '|' + x.a;
  // Fall back to easier pools if a hard pool runs dry.
  let pool: Question[] = [];
  for (let k = d; k >= 1 && !pool.length; k--) pool = questionPool(S.cat, k as Difficulty).filter(x => !S.used.has(key(x)));
  $('q').textContent = 'Loading…'; $('answers').innerHTML = ''; setPhoto(true);
  let q = pool[rnd(pool.length)], src: string | undefined;
  for (let tries = 0; tries < 4; tries++) { // picture questions need a photo; else try another
    q = pool[rnd(pool.length)];
    if (!q.pic || (src = await photo(q.pic))) break;
  }
  if (q.pic && !src) q = pool.find(x => !x.pic) ?? q;
  S.used.add(key(q));
  q = {...q, opts: shuffle(q.opts)};
  console.assert(new Set(q.opts).size === 4 && q.opts.includes(q.a), 'bad question', q);
  S.cur = q; S.busy = false; S.sel = null;
  if (src) setPhoto(src);
  else if (q.img) photo(q.img).then(s => { if (S.cur === q) setPhoto(s); });
  else setPhoto(false);
  $('q').textContent = q.q;
  q.opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.className = 'ans';
    b.innerHTML = `<b>${'ABCD'[i]}</b>`;
    b.append(Object.assign(document.createElement('span'), {textContent: o}));
    b.onclick = () => pick(b);
    $('answers').append(b);
  });
  $('qlabel').innerHTML = `Question ${S.level + 1} of 15 &nbsp;·&nbsp; <b>${euro(PRIZES[S.level])}</b>`;
  $('status').textContent = '';
  $('prog').style.width = S.level / 15 * 100 + '%';
  renderLadder();
  startTimer();
}

function renderLadder() {
  $('ladder').innerHTML = PRIZES.map((p, i) =>
    `<li class="${SAFE.includes(i) ? 'safe' : ''} ${i === S.level ? 'cur' : ''} ${i < S.level ? 'done' : ''}"><span>${i + 1}</span><span>${euro(p)}</span></li>`).join('');
}

function startTimer() {
  clearInterval(tick);
  $('timer').hidden = !OPT.timer;
  if (!OPT.timer) return;
  S.time = 30;
  const draw = () => { $('timer').textContent = String(S.time); $('timer').classList.toggle('low', S.time <= 5); };
  draw();
  tick = setInterval(() => {
    if (S.busy || dlg.open) return; // paused during reveals and lifeline dialogs
    S.time--; draw();
    if (S.time > 0) { if (S.time <= 5) SFX.tick(); return; }
    clearInterval(tick);
    S.busy = true; lock(true); reveal(); SFX.bad();
    setTimeout(() => end(false, safeAmount(), `Time's up. The answer was <b>${cur().a}</b>.` + learn()), 1500);
  }, 1000);
}

const buttons = () => [...$('answers').children] as HTMLButtonElement[];
const text = (b: HTMLButtonElement) => b.lastChild!.textContent!;
const lock = (on: boolean) => {
  buttons().forEach(b => b.disabled = on);
  (['l50', 'laud', 'lphone', 'walk'] as const).forEach(id => ($(id) as HTMLButtonElement).disabled = on || (id !== 'walk' && !S.life[id]));
};
const reveal = () => buttons().forEach(b => { if (text(b) === cur().a) b.classList.add('ok'); });
const learn = () => {
  const t = cur().pic ?? cur().img;
  return t ? `<p><a href="${wikiUrl(t)}" target="_blank" rel="noopener">Read about the ${t} on Wikipedia →</a></p>` : '';
};

function pick(btn: HTMLButtonElement) {
  if (S.busy || btn.disabled) return;
  if (OPT.confirm && S.sel !== btn) {
    buttons().forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel'); S.sel = btn; SFX.sel();
    $('status').textContent = 'Final answer? Click it again or press Enter to lock it in.';
    return;
  }
  answer(btn);
}

function answer(btn: HTMLButtonElement) {
  if (S.busy) return;
  S.busy = true; S.sel = null;
  clearInterval(tick);
  lock(true);
  btn.classList.add('sel'); SFX.sel();
  $('status').textContent = 'Locked in…';
  setTimeout(() => {
    const right = text(btn) === cur().a;
    reveal();
    if (!right) btn.classList.add('bad');
    if (right) SFX.ok(); else SFX.bad();
    setTimeout(() => {
      if (!right) return end(false, safeAmount(), `The correct answer was <b>${cur().a}</b>.` + learn());
      if (S.level === 14) return end(true, PRIZES[14], 'You answered all 15 questions!');
      S.level++;
      next().then(() => lock(false));
    }, 1800);
  }, 1500);
}

// buttons: [returnValue, text]; first is the primary action.
function dialog(heading: string, html: string, btns: [string, string][] = [['ok', 'OK']], extra = '') {
  dlg.onclose = null; dlg.returnValue = '';
  $('dt').textContent = heading; $('db').innerHTML = html;
  $('dbtns').innerHTML = btns.map(([v, t], i) => `<button class="big${i ? ' alt' : ''}" value="${v}">${t}</button>`).join('') + extra;
  dlg.showModal();
}

function end(won: boolean, amount: number, msg: string) {
  clearInterval(tick);
  const s = STATS[S.cat] ??= {best: 0, played: 0, wins: 0};
  s.played++; s.best = Math.max(s.best, amount); if (won) s.wins++;
  save('carStats', STATS);
  if (won) { SFX.win(); $('prog').style.width = '100%'; }
  dialog(won ? 'Millionaire!' : 'Game over',
    `<p>${msg}</p><p>You leave with <span class="money">${euro(amount)}</span></p>`,
    [['again', 'Play again'], ['menu', 'Categories']], '<button type="button" class="big alt" id="share">Share</button>');
  $('share').onclick = () => {
    const msg = `I won ${euro(amount)} on Guess the Car (${title(S.cat)}). Can you beat it?`;
    if (navigator.share) navigator.share({text: msg, url: location.href}).catch(() => {});
    else navigator.clipboard?.writeText(`${msg} ${location.href}`).then(() => { $('share').textContent = 'Link copied'; }, () => {});
  };
  dlg.onclose = () => dlg.returnValue === 'again' ? start(S.cat) : show('menu');
}

const hidden = () => buttons().filter(b => b.classList.contains('hide')).map(text);
const useLife = (id: Lifeline) => { S.life[id] = false; ($(id) as HTMLButtonElement).disabled = true; $(id).classList.add('used'); SFX.life(); };

$('l50').onclick = () => {
  useLife('l50');
  shuffle(buttons().filter(b => text(b) !== cur().a)).slice(0, 2).forEach(b => {
    b.classList.add('hide'); b.disabled = true;
    if (S.sel === b) { b.classList.remove('sel'); S.sel = null; }
  });
};

$('laud').onclick = () => {
  useLife('laud');
  const gone = hidden();
  const accuracy = 0.95 - S.level * 0.04; // audience gets less sure as questions get harder
  const w = cur().opts.map(o => gone.includes(o) ? 0 : (o === cur().a && Math.random() < accuracy ? 40 + rnd(40) : 5 + rnd(30)));
  const sum = w.reduce((a, b) => a + b, 0);
  const pct = w.map(x => Math.round(x / sum * 100));
  dialog('Ask the audience', `<div class="bars">${pct.map((p, i) => `<div class="bar"><span>${p}%</span><i style="height:${p}%"></i><b>${'ABCD'[i]}</b></div>`).join('')}</div>`);
};

$('lphone').onclick = () => {
  useLife('lphone');
  const left = cur().opts.filter(o => !hidden().includes(o));
  const knows = Math.random() < 0.95 - S.level * 0.045;
  const guess = knows ? cur().a : left[rnd(left.length)];
  const letter = 'ABCD'[cur().opts.indexOf(guess)];
  const line = knows && S.level < 10 ? `Oh, I know this one. It's <b>${letter}, ${guess}</b>. Definitely.`
    : knows ? `I think it's <b>${letter}, ${guess}</b>. Pretty sure, but don't quote me.`
    : `Honestly, no idea. If I had to guess, <b>${letter}, ${guess}</b>? Sorry.`;
  dialog('Phone a friend', `<p>“${line}”</p>`);
};

$('walk').onclick = () => {
  const amount = S.level ? PRIZES[S.level - 1] : 0;
  dialog('Walk away?', `<p>Stop here and keep <span class="money">${euro(amount)}</span>?</p>`, [['no', 'Keep playing'], ['yes', 'Take the money']]);
  dlg.onclose = () => { if (dlg.returnValue === 'yes') end(false, amount, `You walked away. The answer was <b>${cur().a}</b>.` + learn()); };
};

document.onkeydown = e => {
  if (dlg.open || !$('play').classList.contains('on') || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  const i = k.length === 1 ? Math.max('abcd'.indexOf(k), '1234'.indexOf(k)) : -1;
  const life = ({f: 'l50', h: 'laud', p: 'lphone', w: 'walk'} as Record<string, string>)[k];
  if (i >= 0 && buttons()[i]) pick(buttons()[i]);
  else if (k === 'enter' && S.sel) answer(S.sel);
  else if (life && !($(life) as HTMLButtonElement).disabled) $(life).click();
  else return;
  e.preventDefault();
};

function show(id: 'menu' | 'play') {
  clearInterval(tick);
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  if (id !== 'menu') return;
  $('sub').textContent = 'A millionaire-style quiz for car people';
  const all = Object.values(STATS);
  const best = Math.max(load('carBest', 0), ...all.map(s => s.best));
  const played = all.reduce((n, s) => n + s.played, 0);
  $('best').textContent = played ? `Best win ${euro(best)} · ${played} games played` : '';
  const keys = Object.keys(CATS);
  const groups: [string, string[]][] = [
    ['Mixed', ['All', ...keys.filter(k => !CATS[k].brands && !CATS[k].series)]],
    ['By country', keys.filter(k => CATS[k].brands)],
    ['Motorsport', keys.filter(k => CATS[k].series)],
  ];
  const tile = (k: string) => {
    const s = STATS[k];
    return `<button class="cat${CATS[k]?.series ? ' series' : ''}" data-cat="${k}"><span class="code">${k === 'All' ? 'ALL' : CATS[k].code}</span>`
      + `<span class="name">${title(k)}</span><span class="meta">${subtitle(k)}</span>`
      + (s ? `<span class="score">Best ${euro(s.best)} · ${s.played} played${s.wins ? ` · won ${s.wins}×` : ''}</span>` : '') + '</button>';
  };
  $('cats').innerHTML = groups.map(([name, ks]) => `<h3 class="group">${name}</h3><div class="tiles">${ks.map(tile).join('')}</div>`).join('');
}
$('cats').onclick = e => { const b = (e.target as Element).closest<HTMLElement>('.cat'); if (b) start(b.dataset.cat!); };
show('menu');

// Test hook for the Playwright smoke tests (dev server only).
if (import.meta.env.DEV) Object.assign(window, {game: {start, questionPool, get S() { return S; }}});
