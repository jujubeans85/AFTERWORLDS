import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { prepareLifecycleReview, lifecycleBrowserSource } from '../scripts/review-lifecycle.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

test('lifecycle staging preserves every built asset and accepted pointer, injecting only an independent HTML entry', async t => {
  const pointer = path.join(root, 'dist/assets/research/accepted-manifest.json');
  const before = await fs.readFile(pointer);
  const { directory, record } = await prepareLifecycleReview();
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  assert.deepEqual(await fs.readFile(pointer), before);
  for (const [relative, expected] of Object.entries(record.sourceHashes)) {
    assert.equal(sha256(await fs.readFile(path.join(root, 'dist', relative))), expected);
    if (relative !== 'index.html') assert.equal(sha256(await fs.readFile(path.join(directory, relative))), expected, relative);
  }
  assert.equal(record.instrumentationSha256, sha256(lifecycleBrowserSource));
  const html = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
  assert.equal(html.includes('<script type="module" src="/assets/app.js"></script>'), false);
  assert.match(html, /src="\/lifecycle-review.js"/);
  assert.equal(record.routes.length, 10);
  assert.equal(record.routes.filter(route => route.kind === 'legacy').length, 2);
  assert.equal(record.routes.filter(route => route.kind === 'native').length, 8);
  assert.ok(lifecycleBrowserSource.indexOf('Class.prototype[name]=') < lifecycleBrowserSource.indexOf("await import('/assets/app.js')"));
  assert.match(lifecycleBrowserSource, /for\(let index=0;index<50;index\+\+\)/);
  assert.match(lifecycleBrowserSource, /renderer\.forceContextLoss\(\)/);
  assert.match(lifecycleBrowserSource, /webglcontextlost/);
  await assert.rejects(prepareLifecycleReview({ output: path.join(root, 'dist') }), /outside the source project/);
});

test('observing wrappers preserve original behavior, count actual frames and release all strong instance references on disposal', () => {
  class Base {
    constructor() {
      this.disposed = false; this.raf = 7; this.cleanup = [() => {}];
      this.canvas = { isConnected: true };
      this.renderer = { info: { render: { frame: 0, calls: 2, triangles: 12 }, memory: { geometries: 3, textures: 1 }, programs: [{}] } };
    }
    wake(value) { this.wakeArgument = value; return 'original-wake'; }
    frame(value) { this.renderer.info.render.frame++; return value; }
    dispose(throws = false) { this.disposed = true; this.canvas.isConnected = false; if (throws) throw Error('original failure'); return 'original-dispose'; }
  }
  class Globe extends Base {}
  class ResearchGlobe extends Base {}
  const start = lifecycleBrowserSource.indexOf('const active=');
  const end = lifecycleBrowserSource.indexOf("const fixture=await fetch(");
  const observer = vm.runInNewContext(lifecycleBrowserSource.slice(start, end) + '\n({active,metadata,report,snapshot});', {
    Globe, ResearchGlobe, navigator: { userAgent: 'unit-test' }, innerWidth: 320, innerHeight: 640, devicePixelRatio: 1,
    matchMedia: () => ({ matches: true }), performance: { now: () => 10 }, location: { pathname: '/globe/test' },
    window: { addEventListener() {} }, document: { addEventListener() {}, querySelectorAll: () => [1] }
  });
  const instance = new ResearchGlobe();
  assert.equal(instance.wake('argument'), 'original-wake');
  assert.equal(instance.wakeArgument, 'argument');
  assert.equal(instance.frame(20), 20);
  assert.equal(observer.active.size, 1);
  assert.equal(observer.snapshot(instance).renderer.frame, 1);
  assert.equal(observer.snapshot(instance).frames, 1);
  assert.equal(instance.dispose(), 'original-dispose');
  assert.equal(observer.active.size, 0);
  assert.equal(observer.metadata.has(instance), false);
  assert.equal(observer.report.disposals[0].after.canvasConnected, false);
  assert.equal(observer.report.disposals[0].before.cleanupLength, 1);
  assert.equal(observer.report.disposals[0].after.rafHandleNonzero, true, 'raw stale handle is reported honestly, not treated as a live callback');
  assert.doesNotThrow(() => JSON.stringify(observer.report));
  const broken = new Globe(); broken.wake();
  assert.throws(() => broken.dispose(true), /original failure/);
  assert.equal(observer.active.size, 0);
  assert.equal(observer.metadata.has(broken), false);
  assert.equal(observer.report.errors.length, 1);
});
