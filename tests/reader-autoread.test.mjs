import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import '../vendor/juice-speech.js';

// Minimal DOM port for speech-policy integration, not a layout/browser test.
const source = (await fs.readFile(new URL('../src/reader.js', import.meta.url), 'utf8'))
  .replace("import './vendor/juice-speech.js';", '').replaceAll('export function ', 'function ');
function fixture(storage, { supported = true } = {}) {
  const elements = [], spoken = [], focused = [], activity = [];
  class Element {
    constructor(text = '') { this.textContent = text; this.dataset = {}; this.children = []; this.parts = new Map(); this.listeners = {}; this.isConnected = true; this.style = { setProperty() {} }; }
    querySelector(s) { if (!this.parts.has(s)) this.parts.set(s, new Element()); return this.parts.get(s); }
    querySelectorAll() { return []; }
    setAttribute() {} removeAttribute() {} replaceChildren() { this.children = []; }
    append(child) { this.children.push(child); if (typeof child === 'object') child.parentNode = this; }
    prepend(child) { this.append(child); } after() {} closest() { return null; }
    addEventListener(k, fn) { this.listeners[k] = fn; } focus() { focused.push(this); }
    remove() { this.parentNode = null; } cloneNode() { return new Element(this.textContent); }
    matches(s) { return s === '#dialog-body'; }
  }
  const doc = { body: new Element(), documentElement: new Element(), title: 'Atlas',
    createElement() { const e = new Element(); elements.push(e); return e; },
    querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {},
  };
  const win = { JuiceSpeech: globalThis.JuiceSpeech, localStorage: storage, addEventListener() {},
    getComputedStyle() { return { getPropertyValue: () => '#abc' }; },
  };
  if (supported) {
    win.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    win.speechSynthesis = { getVoices: () => [], addEventListener() {}, cancel() {}, speak(u) { spoken.push(u); u.onstart?.(); } };
  }
  const factory = vm.runInNewContext(`${source}\ncreateAtlasReader`, { console });
  const reader = factory(doc, win, a => activity.push(a));
  const panel = elements.find(e => e.id === 'juice-reader');
  const optOut = () => panel.listeners.change({ target: { checked: false, matches: s => s === '[data-auto-read]' } });
  return { reader, spoken, activity, focused, optOut, block: text => new Element(text) };
}
function memory(value) { return { value, getItem() { return this.value; }, setItem(_, v) { this.value = v; } }; }

test('opening a text panel reads by default, preserves focus, and replaces the previous queue', () => {
  const h = fixture(memory(null));
  try {
    assert.equal(h.spoken.length, 0);
    h.reader.opened(h.block('The first world.'), 'First');
    assert.equal(h.spoken[0].text, 'The first world.'); assert.equal(h.focused.length, 0);
    h.reader.dismiss(); h.reader.opened(h.block('The second world.'), 'Second');
    h.spoken[0].onend();
    assert.equal(h.spoken.length, 2); assert.equal(h.spoken[1].text, 'The second world.');
    assert.equal(h.activity.at(-1), true);
  } finally { h.reader.dismiss(); }
});

test('auto-read opt-out immediately stops reading and persists across reader instances', () => {
  const storage = memory(null), h = fixture(storage);
  try {
    h.reader.opened(h.block('This panel reads.'), 'First'); h.optOut();
    assert.equal(h.activity.at(-1), false);
    h.reader.dismiss(); h.reader.opened(h.block('This panel stays silent.'), 'Second');
    assert.equal(h.spoken.length, 1); assert.equal(JSON.parse(storage.value).autoRead, false);
    const next = fixture(storage);
    try { next.reader.opened(next.block('Still silent.'), 'Third'); assert.equal(next.spoken.length, 0); }
    finally { next.reader.dismiss(); }
  } finally { h.reader.dismiss(); }
});

test('invalid preferences and blocked storage cannot break opt-out; missing speech stays silent', () => {
  for (const value of ['null', '[]', '"oops"', '42', 'invalid']) {
    const h = fixture(memory(value));
    try { h.reader.opened(h.block('Readable.'), 'Text'); h.optOut(); assert.equal(h.activity.at(-1), false); }
    finally { h.reader.dismiss(); }
  }
  const h = fixture({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
  try { h.optOut(); h.reader.opened(h.block('Silent.'), 'Text'); assert.equal(h.spoken.length, 0); }
  finally { h.reader.dismiss(); }
  const unavailable = fixture(memory(null), { supported: false });
  unavailable.reader.opened(unavailable.block('Readable.'), 'Text'); assert.equal(unavailable.spoken.length, 0);
  unavailable.reader.dismiss();
});
