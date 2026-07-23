// ── Projectile & FX Agent (ses tarafı) ───────────────────────────
// WebAudio ile üretilen retro bip/patlama sesleri. Harici dosya yok.

let ctx: AudioContext | null = null;
let muted = false;

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

export function isMuted() {
  return muted;
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined' || muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext
        || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function beep(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) osc.frequency.linearRampToValueAtTime(Math.max(40, freq + slide), c.currentTime + dur);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

function noise(dur: number, vol: number) {
  const c = ac();
  if (!c) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
}

export const sfxShoot = () => beep(900, 0.07, 'square', 0.025, -500);
export const sfxHit = () => beep(200, 0.09, 'square', 0.03, -80);
export const sfxExplode = (big: boolean) => noise(big ? 0.5 : 0.22, big ? 0.12 : 0.07);
export const sfxPower = () => {
  beep(660, 0.09, 'square', 0.03);
  setTimeout(() => beep(880, 0.09, 'square', 0.03), 90);
  setTimeout(() => beep(1320, 0.12, 'square', 0.03), 180);
};
