import test from 'node:test';
import assert from 'node:assert/strict';
import '../vendor/juice-speech.js';
import fs from 'node:fs/promises';

const { Reader } = globalThis.JuiceSpeech;
function harness() {
  const spoken = [];
  const engine = new Reader({ cancel() {}, speak(u) { spoken.push(u); u.onstart(); } }, class { constructor(text) { this.text = text; } });
  return { engine, spoken };
}

test('reader only speaks after a gesture and ignores cancelled overlay callbacks', () => {
  const { engine, spoken } = harness();
  try {
    engine.setText('The first world.\nThe second passage.');
    assert.equal(spoken.length, 0);
    engine.play();
    const previous = spoken.at(-1);
    previous.onboundary({ charIndex: 4 });
    engine.pause();
    previous.onend();
    assert.equal(engine.index, 0);
    engine.play();
    assert.equal(spoken.at(-1).text, 'first world.');
    const resumed = spoken.at(-1);
    engine.stop();
    resumed.onend();
    resumed.onerror({ error: 'cancelled' });
    assert.equal(engine.status, 'ready');
    assert.equal(engine.index, 0);
    engine.setText('Another world.');
    previous.onend();
    assert.equal(engine.snapshot().passage, 'Another world.');
    assert.equal(engine.status, 'ready');
  } finally { engine.stop(); }
});

test('voice and speed changes keep position; passage navigation and replay remain bounded', () => {
  const { engine, spoken } = harness();
  try {
    engine.setText('First passage.\nSecond passage.\nThird passage.');
    engine.play();
    spoken.at(-1).onboundary({ charIndex: 6 });
    const voice = { voiceURI: 'au', lang: 'en-AU' };
    engine.options(1.25, voice);
    assert.equal(spoken.at(-1).text, 'passage.');
    assert.equal(spoken.at(-1).rate, 1.25);
    assert.equal(spoken.at(-1).voice, voice);
    engine.move(1);
    assert.equal(spoken.at(-1).text, 'Second passage.');
    engine.move(-1);
    assert.equal(spoken.at(-1).text, 'First passage.');
    engine.move(50);
    assert.equal(engine.index, 2);
    spoken.at(-1).onend();
    assert.equal(engine.snapshot().progress, 100);
    engine.play();
    assert.equal(spoken.at(-1).text, 'First passage.');
  } finally { engine.stop(); }
});

test('speech failure is recoverable and a missing speech API stays idle', () => {
  const engine = new Reader({ cancel() {}, speak() { throw Error('unavailable'); } }, class {});
  try { engine.setText('Water consumption.'); engine.play(); assert.equal(engine.status, 'error'); engine.stop(); assert.equal(engine.status, 'ready'); }
  finally { engine.stop(); }
  const unavailable = new Reader(null, null);
  unavailable.setText('Water consumption.'); unavailable.play();
  assert.equal(unavailable.status, 'ready');
});

function luminance(hex) {
  const [r, g, b] = hex.match(/[a-f0-9]{2}/gi).map(x => parseInt(x, 16) / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
  return r * .2126 + g * .7152 + b * .0722;
}
function contrast(a, b) { const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (high + .05) / (low + .05); }
test('each globe accent and the core text palette remain readable on every dark surface', async () => {
  const { entries } = JSON.parse(await fs.readFile(new URL('../dist/assets/registry.json', import.meta.url)));
  const accents = [...new Set(entries.map(e => e.color))];
  for (const foreground of [...accents, '#edf5f4', '#b2c1c7', '#c6d4d8', '#d0dce0']) {
    for (const surface of ['#080d10', '#11191d', '#101c23', '#1b2a31']) {
      assert.ok(contrast(foreground, surface) >= 4.5, `${foreground} on ${surface}: ${contrast(foreground, surface).toFixed(2)}`);
    }
  }
  for (const accent of accents) assert.ok(contrast('#080d10', accent) >= 4.5);
});
