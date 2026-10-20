import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { SOUND_RECIPE_IDS, soundRecipePlan, recipeEnvelope, createSoundRecipe } from "../src/sound-recipes.js";
import { SensoryDirector, soundscapeProfile } from "../src/soundscape.js";

function harness() {
  const timers=new Map();let timerId=0;
  const setTimeout=(callback)=>{timers.set(++timerId,callback);return timerId;};
  const clearTimeout=id=>timers.delete(id);
  const flushTransitions=()=>{const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());};
  const nodes = [], buffers = [], contexts = [];
  const param = () => ({
    value: 0, events: [],
    setValueAtTime(value, time) { this.value = value; this.events.push(["set", value, time]); },
    linearRampToValueAtTime(value, time) { this.events.push(["ramp", value, time]); },
    exponentialRampToValueAtTime(value, time) { this.events.push(["exp", value, time]); },
    setTargetAtTime(value, time) { this.events.push(["target", value, time]); },
    cancelScheduledValues() { this.events = []; }, cancelAndHoldAtTime() { this.events = []; },
  });
  function node(kind) {
    const result = {
      kind, gain: param(), frequency: param(), pan: param(), Q: param(), playbackRate: param(), connections: [],
      connect(target) { this.connections.push(target); },
      disconnect() { this.disconnected = true; this.connections = []; },
    };
    if (["oscillator", "buffer"].includes(kind)) Object.assign(result, {
      start() { this.started = true; },
      stop(time) { this.stopped = true; if (time === undefined) this.onended?.(); },
    });
    nodes.push(result);
    return result;
  }
  class AudioContext {
    constructor() {
      this.currentTime = 0; this.state = "suspended"; this.destination = {};
      contexts.push(this);
    }
    createGain() { return node("gain"); }
    createBiquadFilter() { return node("filter"); }
    createOscillator() { return node("oscillator"); }
    createStereoPanner() { return node("panner"); }
    createBufferSource() { return node("buffer"); }
    createBuffer(channels, samples, sampleRate) {
      if (sampleRate < 8000 || sampleRate > 96000) throw Error("Unsupported AudioBuffer sample rate");
      const data = new Float32Array(samples);
      const buffer = { channels, samples, sampleRate, data, getChannelData: () => data };
      buffers.push(buffer); return buffer;
    }
    async resume() { this.state = "running"; }
    async suspend() { this.state = "suspended"; }
    async close() { this.state = "closed"; }
  }
  return { timers, flushTransitions, nodes, buffers, contexts, AudioContext, env: { setTimeout, clearTimeout, AudioContext, performance: { now: () => 1000 } } };
}
const world = { id: "430", lens: "energy", soundRecipe: "woven-circuit" };
const hash = array => crypto.createHash("sha256").update(Buffer.from(array.buffer)).digest("hex");

test("six arrangements remain deterministic, bounded, and independent of data and title changes", () => {
  const profile = soundscapeProfile(world);
  const unchanged = soundscapeProfile({ ...world, dataset: { value: 9999 }, newTitle: "Changed" });
  assert.deepEqual(profile, unchanged);
  assert.equal(profile.id, "aw:world:430:sound:v1");
  const signatures = new Set();
  for (const recipeId of SOUND_RECIPE_IDS) {
    const plan = soundRecipePlan(profile, recipeId);
    assert.deepEqual(plan, soundRecipePlan(unchanged, recipeId));
    assert.ok(plan.voices.length <= 3);
    assert.ok(plan.voices.every(voice => voice.gain > 0 && voice.gain <= 0.018));
    signatures.add(JSON.stringify(plan.voices));
    const first = harness(), second = harness();
    const a = createSoundRecipe(new first.AudioContext(), {}, profile, recipeId);
    const b = createSoundRecipe(new second.AudioContext(), {}, profile, recipeId);
    assert.ok(a.sourceCount <= 6);
    assert.ok(a.nodes.length <= 16);
    assert.ok(a.bufferBytes <= 2_000_000);
    assert.equal(a.bufferBytes, b.bufferBytes);
    assert.deepEqual(first.buffers.map(buffer => hash(buffer.data)), second.buffers.map(buffer => hash(buffer.data)));
    assert.ok(first.buffers.every(buffer => buffer.data.every(Number.isFinite)));
    assert.ok(a.nodes.filter(node => node.start).every(node => node.started));
    assert.ok(a.nodes.filter(node => node.kind === "oscillator").length <= (recipeId === "hollow-tide" ? 1 : 3));
  }
  assert.equal(signatures.size, 6);
});

test("amplitude envelopes meet their loop seam continuously and never become negative", () => {
  for (const recipeId of SOUND_RECIPE_IDS)
    for (let voice = 0; voice < 3; voice++) {
      const kind = recipeId === "hollow-tide" ? "steady" : recipeId;
      assert.ok(Math.abs(recipeEnvelope(kind, 0, voice) - recipeEnvelope(kind, 1 - 1e-8, voice)) < 1e-5);
      for (let phase = 0; phase <= 1; phase += 0.001) {
        const gain = recipeEnvelope(kind, phase, voice);
        assert.ok(gain >= 0 && gain <= 1);
      }
    }
});

test("mono and independent volume work without autoplay and preserve narration ducking", async () => {
  const h = harness(), director = new SensoryDirector(h.env);
  director.setWorld(world);
  assert.equal(director.setVolume("ambience", 0.4), true);
  assert.equal(director.setVolume("effects", 0.2), true);
  director.setMono(true);
  assert.equal(h.contexts.length, 0);
  await director.setEnabled("ambience", true);
  assert.equal(h.contexts.length, 1);
  assert.equal(director.outputBus.channelCount, 1);
  assert.equal(director.outputBus.channelCountMode, "explicit");
  assert.equal(director.activeRecipe.recipeId, "woven-circuit");
  assert.equal(director.ambientBus.gain.events.at(-1)[1], 0.4);
  director.setNarrating(true);
  assert.equal(director.ambientBus.gain.events.at(-1)[1], 0.4 * 0.18);
  director.setVolume("ambience", 0.5);
  assert.equal(director.ambientBus.gain.events.at(-1)[1], 0.5 * 0.18);
  assert.equal(director.effectsBus.gain.value, 0.2);
  director.setMono(false);
  assert.equal(director.outputBus.channelCount, 2);
  assert.equal(director.setVolume("ambience", NaN), false);
  await director.dispose();
});

test("route, hidden-tab and global mute release every recipe source with one bounded fade and no extra contexts", async () => {
  const h = harness(), director = new SensoryDirector(h.env);
  await director.setEnabled("ambience", true);
  for (let index = 0; index < 20; index++) {
    const previous = [...director.nodes];
    director.setWorld({ ...world, id: String(430 + index), soundRecipe: SOUND_RECIPE_IDS[index % 6] });
    assert.ok(h.timers.size<=1);h.flushTransitions();
    assert.ok(previous.every(node => node.disconnected));
    assert.ok(previous.filter(node => node.start).every(node => node.stopped));
    assert.ok(director.nodes.filter(node => node.start).length <= 6);
  }
  const active = [...director.nodes];
  await director.setVisible(false);
  assert.ok(active.every(node => node.disconnected));
  assert.ok(active.filter(node => node.start).every(node => node.stopped));
  assert.equal(director.nodes.length, 0);
  assert.equal(h.contexts.length, 1);
  await director.setVisible(true);
  assert.ok(director.nodes.length > 0);
  director.muteAll();
  assert.equal(director.nodes.length, 0);
  assert.equal(h.contexts[0].state, "suspended");
  await director.dispose();
  assert.equal(h.contexts[0].state, "closed");
  assert.equal(director.outputBus.disconnected, true);
  assert.equal(director.ambientBus.disconnected, true);
  assert.equal(director.effectsBus.disconnected, true);
});

test("partial recipe construction failure stops and disconnects all owned nodes", () => {
  const h = harness(), context = new h.AudioContext();
  context.createBuffer = () => { throw Error("memory unavailable"); };
  assert.throws(() => createSoundRecipe(context, {}, soundscapeProfile(world), "woven-circuit"), /memory unavailable/);
  assert.ok(h.nodes.every(node => node.disconnected));
  assert.ok(h.nodes.filter(node => node.start).every(node => node.stopped));
});


test("rapid route replacement keeps one fading voice set and mute cancels its restart",async()=>{
 const h=harness(),d=new SensoryDirector(h.env);
 d.setWorld(world);await d.setEnabled('ambience',true);
 const initial=[...d.nodes],sourceCount=h.nodes.filter(node=>node.started).length;
 for(let index=0;index<20;index++)d.setWorld({...world,id:String(index)});
 assert.equal(h.timers.size,1);
 assert.equal(h.nodes.filter(node=>node.started).length,sourceCount);
 assert.deepEqual(d.nodes,initial);
 assert.equal(d.ambientBus.gain.events.at(-1)[1],0);
 d.muteAll();assert.equal(h.timers.size,0);h.flushTransitions();
 assert.equal(d.nodes.length,0);assert.ok(initial.every(node=>node.disconnected));
 assert.equal(h.contexts.length,1);await d.dispose();
});
