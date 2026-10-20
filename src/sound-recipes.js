// Versioned editorial arrangements over the canonical soundscape profile.
// No observation, source date, country, risk or missingness enters this module.
export const SOUND_RECIPE_VERSION = 1;
export const SOUND_RECIPE_IDS = Object.freeze([
  "glass-air", "warm-orbit", "woven-circuit", "hollow-tide", "soft-chamber", "distant-lattice",
]);
const DESCRIPTIONS = {
  "glass-air": "Quiet glass tones with long spaces",
  "warm-orbit": "A soft, slowly changing harmonic bed",
  "woven-circuit": "Muted, interweaving synthetic tones",
  "hollow-tide": "A steady tone with a quiet synthetic texture",
  "soft-chamber": "Rounded tones in a narrow, quiet space",
  "distant-lattice": "Sparse mellow tones with long pauses",
};

export function soundRecipePlan(profile, recipeId) {
  if (!SOUND_RECIPE_IDS.includes(recipeId)) return null;
  if (!Number.isFinite(profile?.frequency) || !Number.isFinite(profile?.cutoff) ||
    !Number.isInteger(profile?.seed)) throw Error("A canonical sound profile is required.");
  const ratios = [1, 1.5, 2.002 + (profile.seed % 7) / 1000];
  const count = recipeId === "hollow-tide" ? 1 : recipeId === "soft-chamber" ? 2 : 3;
  const period = 32 + profile.seed % 7;
  const voices = ratios.slice(0, count).map((ratio, index) => ({
    frequency: profile.frequency * ratio,
    wave: recipeId === "woven-circuit" && index === 2 ? "triangle" : "sine",
    gain: (recipeId === "distant-lattice" ? 0.014 : 0.018) / ratio,
    pan: recipeId === "soft-chamber" ? (index ? 0.04 : -0.04) : (index - (count - 1) / 2) * 0.14,
    phase: ((profile.seed >>> (index * 5)) % 101) / 101,
    envelope: recipeId === "hollow-tide" ? "steady" : recipeId,
  }));
  return {
    recipeId, version: SOUND_RECIPE_VERSION, description: DESCRIPTIONS[recipeId],
    period, voices, noise: recipeId === "hollow-tide", seed: profile.seed,
    cutoff: profile.cutoff,
  };
}

export function recipeEnvelope(kind, phase, voiceIndex) {
  const t = ((phase % 1) + 1) % 1;
  if (kind === "steady") return 1;
  if (kind === "warm-orbit") return 0.78 + 0.22 * (0.5 - 0.5 * Math.cos(t * Math.PI * 2));
  if (kind === "soft-chamber") return 0.62 + 0.38 * (0.5 - 0.5 * Math.cos(t * Math.PI * 2));
  if (kind === "woven-circuit") return 0.18 + 0.82 * Math.sin(t * Math.PI) ** 2;
  if (kind === "glass-air" && voiceIndex < 2) return 0.6 + 0.4 * Math.sin(t * Math.PI) ** 2;
  // Raised-cosine entrances/exits make sparse notes meet silence without a step.
  const width = kind === "distant-lattice" ? 0.3 : 0.22;
  return t < width ? Math.sin(t / width * Math.PI) ** 2 : 0;
}

/** <=6 source nodes, <=16 total nodes, <=2MB buffers; no JS playback timers. */
export function createSoundRecipe(context, output, profile, recipeId) {
  const plan = soundRecipePlan(profile, recipeId);
  if (!plan) throw Error("Unknown editorial sound recipe.");
  const nodes = [], sources = [];
  let bufferBytes = 0;
  const own = node => { nodes.push(node); return node; };
  const source = node => { sources.push(node); return own(node); };
  try {
    const filter = own(context.createBiquadFilter());
    filter.type = "lowpass";
    filter.frequency.value = plan.cutoff;
    filter.connect(output);
    plan.voices.forEach((voice, index) => {
      const oscillator = source(context.createOscillator());
      const gain = own(context.createGain());
      oscillator.type = voice.wave;
      oscillator.frequency.value = voice.frequency;
      oscillator.connect(gain);
      if (context.createStereoPanner) {
        const pan = own(context.createStereoPanner());
        pan.pan.value = voice.pan;
        gain.connect(pan); pan.connect(filter);
      } else gain.connect(filter);
      if (voice.envelope === "steady") gain.gain.value = voice.gain;
      else {
        // Web Audio guarantees support from 8kHz. Slow a one-second control
        // buffer at playback instead of requesting a nonportable sample rate.
        const samples = 8000;
        const buffer = context.createBuffer(1, samples, 8000);
        const channel = buffer.getChannelData(0);
        for (let sample = 0; sample < samples; sample++)
          channel[sample] = voice.gain * recipeEnvelope(voice.envelope, sample / samples + voice.phase, index);
        bufferBytes += channel.byteLength;
        const envelope = source(context.createBufferSource());
        envelope.buffer = buffer;
        envelope.loop = true;
        envelope.playbackRate.value = 1 / plan.period;
        gain.gain.value = 0;
        // A low-frequency control buffer modulates gain, never the output bus.
        envelope.connect(gain.gain);
      }
    });
    if (plan.noise) {
      const samples = 8 * 11025;
      const buffer = context.createBuffer(1, samples, 11025);
      const channel = buffer.getChannelData(0);
      let seed = plan.seed || 1;
      for (let i = 0; i < samples; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        // Fade the seam to zero; this is seeded synthesis, not a field recording.
        const seam = Math.min(1, i / 2048, (samples - 1 - i) / 2048);
        channel[i] = (seed / 0x100000000 * 2 - 1) * seam;
      }
      bufferBytes += channel.byteLength;
      const noise = source(context.createBufferSource());
      noise.buffer = buffer; noise.loop = true;
      const band = own(context.createBiquadFilter());
      band.type = "bandpass"; band.frequency.value = Math.min(650, profile.cutoff * 0.5);
      band.Q.value = 0.65;
      const gain = own(context.createGain());
      gain.gain.value = 0.004;
      noise.connect(band); band.connect(gain); gain.connect(filter);
    }
    if (sources.length > 6 || nodes.length > 16 || bufferBytes > 2_000_000)
      throw Error("Editorial sound recipe exceeded its resource budget.");
    for (const node of sources) node.start();
    return { nodes, plan, bufferBytes, sourceCount: sources.length };
  } catch (error) {
    for (const node of nodes) {
      try { node.stop?.(); } catch {}
      node.disconnect();
    }
    throw error;
  }
}
