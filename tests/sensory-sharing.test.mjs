import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { SensoryDirector, soundscapeProfile } from '../src/soundscape.js';
import { shareWorld, worldShareURL } from '../src/sharing.js';

function harness() {
  const contexts = [], nodes = [], vibrations = []; let clock = 0;
  const param = () => ({ value: 0, events: [],
    setValueAtTime(value, at) { this.value = value; this.events.push(['set', value, at]); },
    linearRampToValueAtTime(value, at) { this.events.push(['ramp', value, at]); },
    exponentialRampToValueAtTime(value, at) { this.events.push(['exp', value, at]); },
    cancelScheduledValues(at) { this.events = this.events.filter(e => e[2] < at); },
    cancelAndHoldAtTime(at) { this.events = this.events.filter(e => e[2] < at); },
    setTargetAtTime(value, at) { this.events.push(['target', value, at]); },
  });
  const node = (osc = false) => {
    const n = { gain: param(), frequency: param(), connect() {}, disconnect() { this.disconnected = true; } };
    if (osc) Object.assign(n, { start() { this.started = true; }, stop(at) { this.stopped = true; if (at === undefined) this.onended?.(); } });
    nodes.push(n); return n;
  };
  class AudioContext {
    constructor() { contexts.push(this); this.currentTime = 0; this.state = 'suspended'; this.destination = {}; }
    createGain() { return node(); } createBiquadFilter() { return node(); } createOscillator() { return node(true); }
    async resume() { this.state = 'running'; } async suspend() { this.state = 'suspended'; } async close() { this.state = 'closed'; }
  }
  const env = { AudioContext, navigator: { vibrate: v => vibrations.push(v) }, performance: { now: () => clock } };
  return { director: new SensoryDirector(env), contexts, nodes, vibrations, tick: () => { clock += 200; } };
}
const world = { id: '82', lens: 'water', slug: 'quiet-water', newTitle: 'Quiet water', question: 'Where does it go?' };

test('all world sound identities are deterministic and independent of sorting and title edits', async () => {
  const registry = JSON.parse(await fs.readFile(new URL('../dist/assets/registry.json', import.meta.url)));
  const profiles = registry.entries.map(soundscapeProfile);
  assert.equal(new Set(profiles.map(p => p.id)).size, 146);
  for (const entry of registry.entries) assert.deepEqual(soundscapeProfile(entry), soundscapeProfile({ ...entry, newTitle: 'Changed', number: '999' }));
  assert.throws(() => soundscapeProfile({ lens: 'water' }));
});

test('silent startup, explicit enabling, narration ducking cancels fade, and route cleanup', async () => {
  const h = harness(), d = h.director;
  d.setWorld(world); d.cue(); assert.equal(h.contexts.length, 0);
  await d.setEnabled('ambience', true);
  assert.equal(h.contexts.length, 1); assert.equal(d.nodes.filter(n => n.started).length, 3);
  d.setNarrating(true);
  assert.deepEqual(d.ambientBus.gain.events.map(e => e.slice(0, 2)), [['target', .18]]);
  const old = [...d.nodes]; d.setWorld({ ...world, id: '83' });
  assert(old.every(n => n.disconnected)); assert(old.filter(n => n.started).every(n => n.stopped));
  assert.equal(d.ambientBus.gain.events.at(-1)[1], .18);
  await d.dispose(); assert.equal(h.contexts[0].state, 'closed'); assert.equal(d.nodes.length, 0);
});

test('background, mute and effect-disable stop voices; haptics are opt-in and throttled', async () => {
  const h = harness(), d = h.director;
  d.setWorld(world); await d.setEnabled('effects', true); h.tick(); d.cue();
  assert.equal(d.effects.size, 1); assert.deepEqual(h.vibrations, []);
  await d.setEnabled('effects', false); assert.equal(d.effects.size, 0);
  await d.setEnabled('haptics', true); h.tick(); d.cue('select'); d.cue('select');
  assert.deepEqual(h.vibrations, [12]);
  await d.setEnabled('ambience', true); await d.setVisible(false);
  assert.equal(d.nodes.length, 0); assert.equal(h.contexts[0].state, 'suspended');
  h.tick(); d.cue(); assert.equal(h.vibrations.at(-1), 0);
  await d.setVisible(true); assert(d.nodes.length > 0);
  d.muteAll(); assert.equal(d.nodes.length, 0); assert(Object.values(d.enabled).every(v => !v));
});

test('unsupported audio/haptics fail closed without creating side effects', async () => {
  const d = new SensoryDirector({});
  assert.equal(await d.setEnabled('ambience', true), false);
  assert.equal(await d.setEnabled('haptics', true), false);
  d.setWorld(world); d.cue(); d.muteAll(); await d.dispose();
});

test('native share starts synchronously; cancellation never copies; failures provide a usable fallback', async () => {
  let native = 0, copied = null;
  const nav = { share: data => { native++; assert.equal(data.url, 'https://atlas.example/globe/quiet-water/'); return Promise.resolve(); }, clipboard: { writeText: async url => { copied = url; } } };
  const pending = shareWorld(world, 'https://atlas.example/other?tracking=x#hidden', nav);
  assert.equal(native, 1); assert.equal((await pending).status, 'shared');
  nav.share = async () => { throw Object.assign(new Error(), { name: 'AbortError' }); };
  assert.equal((await shareWorld(world, 'https://atlas.example', nav)).status, 'cancelled'); assert.equal(copied, null);
  nav.share = async () => { throw new Error('blocked'); };
  assert.equal((await shareWorld(world, 'https://atlas.example', nav)).status, 'copied'); assert(copied.endsWith('/quiet-water/'));
  assert.equal((await shareWorld(world, 'https://atlas.example', {})).status, 'manual');
  assert.throws(() => worldShareURL({ slug: '../unsafe' }, 'https://atlas.example'));
});
