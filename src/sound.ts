import { OPT } from './storage';

// Tiny WebAudio synth instead of shipping sound files. Notes: [frequency Hz, start s, length s].
let ac: AudioContext | undefined;
function beep(notes: [number, number, number?][], type: OscillatorType = 'sine') {
  if (!OPT.sound) return;
  try {
    ac ??= new AudioContext();
    for (const [f, t, d = .15] of notes) {
      const o = ac.createOscillator(), g = ac.createGain(), at = ac.currentTime + t;
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(.15, at); g.gain.exponentialRampToValueAtTime(.001, at + d);
      o.connect(g).connect(ac.destination); o.start(at); o.stop(at + d);
    }
  } catch { /* no audio */ }
}

export const SFX = {
  sel: () => beep([[440, 0, .25]], 'triangle'),
  ok: () => beep([[523, 0], [659, .12], [784, .24, .4]]),
  bad: () => beep([[196, 0, .5], [147, .25, .6]], 'sawtooth'),
  tick: () => beep([[880, 0, .05]], 'square'),
  life: () => beep([[660, 0, .1], [990, .1, .15]]),
  win: () => beep([[523, 0], [659, .15], [784, .3], [1047, .45, .8]]),
};
