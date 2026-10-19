// Editorial atmosphere, never a sonification of measured data. No autoplay.
export const SOUNDSCAPE_VERSION = 1;
const FAMILIES = {
  energy: ['power hum', 98, 740], water: ['water glass', 146, 1250],
  work: ['quiet mechanisms', 110, 870], capital: ['distant exchange', 130, 960],
  models: ['computational chamber', 164, 1150], language: ['vocal air', 174, 1400],
  access: ['open signal', 196, 1500], chips: ['silicon resonance', 220, 1800],
  trust: ['soft interference', 123, 900], biosphere: ['organic chamber', 147, 1100],
  science: ['discovery tones', 185, 1600], oceans: ['deep water', 82, 600],
  mobility: ['distant transit', 104, 800], borders: ['thresholds', 156, 1200],
};
function seedOf(text) {
  let n = 2166136261;
  for (const c of text) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
export function soundscapeProfile(entry) {
  if (!entry || typeof entry.id !== 'string' || !entry.id) throw new TypeError('Stable world ID required');
  const seed = seedOf(entry.id), family = FAMILIES[entry.lens] || FAMILIES.science;
  return Object.freeze({ id: `aw:world:${entry.id}:sound:v${SOUNDSCAPE_VERSION}`, worldId: entry.id,
    family: family[0], seed, frequency: family[1] * (1 + (seed % 113) / 1000),
    cutoff: family[2] + (seed % 127),
    role: 'editorial-atmosphere-not-data' });
}

export class SensoryDirector {
  constructor(env = globalThis, onChange = () => {}) {
    this.env = env; this.onChange = onChange; this.context = null; this.profile = null;
    this.enabled = { ambience: false, effects: false, haptics: false };
    this.visible = true; this.narrating = false; this.nodes = []; this.lastCue = -Infinity;
    this.effects = new Set(); this.disposed = false;
  }
  get audioSupported() { return !!(this.env.AudioContext || this.env.webkitAudioContext); }
  get hapticsSupported() { return typeof this.env.navigator?.vibrate === 'function'; }
  async setEnabled(kind, value) {
    if (!(kind in this.enabled) || this.disposed) return false;
    if (value && (kind === 'haptics' ? !this.hapticsSupported : !this.audioSupported)) return false;
    this.enabled[kind] = !!value;
    try {
      if (value && kind !== 'haptics') {
        if (!this.context) {
          const Audio = this.env.AudioContext || this.env.webkitAudioContext;
          this.context = new Audio();
          this.ambientBus = this.context.createGain();
          this.ambientBus.gain.value = 0;
          this.ambientBus.connect(this.context.destination);
        }
        if (this.visible) await this.context.resume();
      }
    } catch { this.enabled[kind] = false; }
    if (!this.visible && this.context?.state === 'running') await this.context.suspend().catch(() => {});
    if (this.disposed) return false;
    if (kind === 'haptics' && !value) this.env.navigator?.vibrate?.(0);
    if (kind === 'effects' && !value) this.stopEffects();
    this.syncAmbient(); this.onChange(); return this.enabled[kind] === !!value;
  }
  setWorld(entry) {
    this.stopAmbient(); this.stopEffects();
    this.profile = entry ? soundscapeProfile(entry) : null;
    this.syncAmbient();
  }
  setNarrating(active) {
    this.narrating = !!active;
    if (this.ambientBus) {
      const gain = this.ambientBus.gain, now = this.context.currentTime;
      if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
      else { gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now); }
      gain.setTargetAtTime(active ? .18 : 1, now, .12);
    }
  }
  async setVisible(visible) {
    this.visible = !!visible;
    if (!visible) { this.stopAmbient(); this.stopEffects(); this.env.navigator?.vibrate?.(0); }
    if (this.context && !this.disposed) {
      try {
        if (visible && (this.enabled.ambience || this.enabled.effects)) await this.context.resume();
        else await this.context.suspend();
      } catch { this.enabled.ambience = false; this.enabled.effects = false; }
    }
    this.syncAmbient(); this.onChange();
  }
  syncAmbient() {
    if (!this.enabled.ambience || !this.profile || !this.visible || this.disposed || this.context?.state !== 'running') {
      this.stopAmbient(); return;
    }
    if (this.nodes.length) return;
    const c = this.context, p = this.profile;
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = p.cutoff;
    filter.connect(this.ambientBus);
    this.nodes.push(filter);
    for (const ratio of [1, 1.5, 2.002 + (p.seed % 7) / 1000]) {
      const osc = c.createOscillator(), gain = c.createGain();
      osc.type = 'sine'; osc.frequency.value = p.frequency * ratio;
      gain.gain.value = .018 / ratio; osc.connect(gain); gain.connect(filter); osc.start();
      this.nodes.push(osc, gain);
    }
    this.ambientBus.gain.cancelScheduledValues(c.currentTime);
    this.ambientBus.gain.setValueAtTime(0, c.currentTime);
    this.ambientBus.gain.linearRampToValueAtTime(this.narrating ? .18 : 1, c.currentTime + .6);
  }
  stopAmbient() {
    // Disconnect immediately on route/unmount; no orphaned oscillators or timers.
    for (const node of this.nodes) { try { node.stop?.(); } catch {} node.disconnect(); }
    this.nodes = [];
  }
  stopEffects() {
    for (const voice of [...this.effects]) { try { voice.osc.stop(); } catch {} voice.cleanup(); }
  }
  cue(kind = 'tap') {
    const now = this.env.performance?.now() ?? Date.now();
    if (this.disposed || !this.visible || now - this.lastCue < 180) return;
    this.lastCue = now;
    if (this.enabled.haptics) this.env.navigator?.vibrate?.(kind === 'select' ? 12 : 8);
    const c = this.context;
    if (!this.enabled.effects || c?.state !== 'running' || this.effects.size >= 3) return;
    const osc = c.createOscillator(), gain = c.createGain(), t = c.currentTime;
    osc.frequency.setValueAtTime(kind === 'select' ? 620 : 440, t);
    osc.frequency.exponentialRampToValueAtTime(kind === 'select' ? 930 : 660, t + .07);
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(this.narrating ? .004 : .012, t + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, t + .09);
    osc.connect(gain); gain.connect(c.destination);
    const voice = { osc, cleanup: () => { osc.disconnect(); gain.disconnect(); this.effects.delete(voice); } };
    this.effects.add(voice); osc.onended = voice.cleanup; osc.start(); osc.stop(t + .1);
  }
  muteAll() {
    this.enabled = { ambience: false, effects: false, haptics: false };
    this.stopAmbient(); this.stopEffects(); this.env.navigator?.vibrate?.(0);
    this.context?.suspend().catch(() => {}); this.onChange();
  }
  async dispose() { this.muteAll(); this.disposed = true; await this.context?.close(); }
}
