// Editorial atmosphere, never a sonification of measured data. No autoplay.
import { createSoundRecipe, soundRecipePlan } from "./sound-recipes.js";
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
    this.effects = new Set(); this.disposed = false; this.transitionTimer = null;
    this.schedule=(env.setTimeout || globalThis.setTimeout).bind(env); this.cancelTimer=(env.clearTimeout || globalThis.clearTimeout).bind(env);
    this.volumes = { ambience: 1, effects: 1 }; this.mono = false;
    this.recipeId = null; this.recipeDescription = "Three restrained tonal layers";
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
          this.outputBus = this.context.createGain();
          this.outputBus.channelCount = this.mono ? 1 : 2;
          this.outputBus.channelCountMode = 'explicit';
          this.outputBus.connect(this.context.destination);
          this.ambientBus = this.context.createGain();
          this.ambientBus.gain.value = 0;
          this.ambientBus.connect(this.outputBus);
          this.effectsBus = this.context.createGain();
          this.effectsBus.gain.value = this.volumes.effects;
          this.effectsBus.connect(this.outputBus);
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
    this.stopEffects();
    this.profile = entry ? soundscapeProfile(entry) : null;
    const recipe = this.profile ? soundRecipePlan(this.profile, entry.soundRecipe) : null;
    this.recipeId = recipe?.recipeId || null;
    this.recipeDescription = recipe?.description || "Three restrained tonal layers";
    if (this.nodes.length && this.profile && this.enabled.ambience && this.visible && !this.disposed && this.context?.state === 'running') {
      if (this.transitionTimer !== null) this.cancelTimer(this.transitionTimer);
      const now=this.context.currentTime, gain=this.ambientBus.gain;
      if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);
      else {gain.cancelScheduledValues(now);gain.setValueAtTime(gain.value,now);}
      gain.linearRampToValueAtTime(0,now+.12);
      this.transitionTimer=this.schedule(()=>{
        this.transitionTimer=null;
        this.stopAmbient();
        this.syncAmbient();
      },130);
    } else { this.stopAmbient(); this.syncAmbient(); }
  }
  setVolume(kind, value) {
    if (!(kind in this.volumes) || !Number.isFinite(value) || this.disposed) return false;
    this.volumes[kind] = Math.max(0, Math.min(1, value));
    const bus = kind === 'ambience' ? this.ambientBus : this.effectsBus;
    if (bus && this.context) {
      const now = this.context.currentTime;
      const target = kind === 'ambience' && this.transitionTimer !== null ? 0 : this.volumes[kind] * (kind === 'ambience' && this.narrating ? .18 : 1);
      bus.gain.cancelScheduledValues(now);
      bus.gain.setTargetAtTime(target, now, .05);
    }
    this.onChange(); return true;
  }
  setMono(value) {
    if (this.disposed) return false;
    this.mono = !!value;
    if (this.outputBus) {
      this.outputBus.channelCountMode = 'explicit';
      this.outputBus.channelCount = this.mono ? 1 : 2;
    }
    this.onChange(); return true;
  }
  setNarrating(active) {
    this.narrating = !!active;
    if (this.ambientBus && this.transitionTimer === null) {
      const gain = this.ambientBus.gain, now = this.context.currentTime;
      if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
      else { gain.cancelScheduledValues(now); gain.setValueAtTime(gain.value, now); }
      gain.setTargetAtTime(this.volumes.ambience * (active ? .18 : 1), now, .12);
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
    if (this.nodes.length || this.transitionTimer !== null) return;
    const c = this.context, p = this.profile;
    if (this.recipeId && c.createBuffer && c.createBufferSource) {
      try {
        const recipe = createSoundRecipe(c, this.ambientBus, p, this.recipeId);
        this.nodes = recipe.nodes;
        this.activeRecipe = recipe.plan;
        this.recipeBufferBytes = recipe.bufferBytes;
      } catch {
        // A partial recipe cleans itself up. Preserve the working low-cost fallback.
        this.activeRecipe = null;
      }
    }
    if (!this.nodes.length) {
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = p.cutoff;
    filter.connect(this.ambientBus);
    this.nodes.push(filter);
    for (const ratio of [1, 1.5, 2.002 + (p.seed % 7) / 1000]) {
      const osc = c.createOscillator(), gain = c.createGain();
      osc.type = 'sine'; osc.frequency.value = p.frequency * ratio;
      gain.gain.value = .018 / ratio; osc.connect(gain); gain.connect(filter); osc.start();
      this.nodes.push(osc, gain);
    }
    }
    this.ambientBus.gain.cancelScheduledValues(c.currentTime);
    this.ambientBus.gain.setValueAtTime(0, c.currentTime);
    this.ambientBus.gain.linearRampToValueAtTime(this.volumes.ambience * (this.narrating ? .18 : 1), c.currentTime + .6);
  }
  stopAmbient() {
    // Mute, hiding and disposal interrupt the bounded route fade immediately.
    if (this.transitionTimer !== null) this.cancelTimer(this.transitionTimer);
    this.transitionTimer=null;
    for (const node of this.nodes) { try { node.stop?.(); } catch {} node.disconnect(); }
    this.nodes = [];
    this.activeRecipe = null; this.recipeBufferBytes = 0;
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
    osc.connect(gain); gain.connect(this.effectsBus);
    const voice = { osc, cleanup: () => { osc.disconnect(); gain.disconnect(); this.effects.delete(voice); } };
    this.effects.add(voice); osc.onended = voice.cleanup; osc.start(); osc.stop(t + .1);
  }
  muteAll() {
    this.enabled = { ambience: false, effects: false, haptics: false };
    this.stopAmbient(); this.stopEffects(); this.env.navigator?.vibrate?.(0);
    this.context?.suspend().catch(() => {}); this.onChange();
  }
  async dispose() {
    if (this.disposed) return;
    this.muteAll(); this.disposed = true;
    this.ambientBus?.disconnect(); this.effectsBus?.disconnect(); this.outputBus?.disconnect();
    await this.context?.close();
  }
}
