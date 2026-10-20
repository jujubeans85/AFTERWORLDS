import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareLocalDesignReview } from '../scripts/review-designs.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function snapshot(relative) {
  const filename = path.join(root, relative);
  try {
    const stat = await fs.stat(filename);
    if (stat.isDirectory()) return Object.fromEntries(await Promise.all((await fs.readdir(filename)).sort().map(async name => [name, await snapshot(path.join(relative, name))])));
    return (await fs.readFile(filename)).toString('base64');
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function modules(directory) {
  const found = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await modules(filename));
    else if (entry.name.endsWith('.js')) found.push(filename);
  }
  return found;
}
test('amendment review staging changes neither activation nor accepted pointers and closes all module imports', async t => {
  const protectedPaths = ['data-updates/design-activation', 'data-updates/accepted-manifest.json', 'dist/assets/research/accepted-manifest.json'];
  const before = await Promise.all(protectedPaths.map(snapshot));
  const result = await prepareLocalDesignReview();
  t.after(() => fs.rm(result.directory, { recursive: true, force: true }));
  assert.deepEqual(await Promise.all(protectedPaths.map(snapshot)), before);
  await assert.rejects(fs.access(path.join(result.directory, 'assets/research/accepted-manifest.json')));
  await assert.rejects(fs.access(path.join(result.directory, 'data-updates/design-activation')));
  for (const [id, count, full] of [['74', 4, 18], ['156-8', 2, 2]]) {
    const fixture = JSON.parse(await fs.readFile(path.join(result.directory, `fixtures/${id}.json`)));
    assert.equal(fixture.authorizesRuntimeActivation, false); assert.equal(fixture.fixtureOnly, true);
    assert.equal(fixture.rows.length, count); assert.equal(fixture.dataset.rows.length, full);
    assert.equal(fixture.designAmendmentEvidence.authorizesRuntimeActivation, false);
    assert.equal(fixture.designAmendment.runtimeApproval, undefined);
    const png=await fs.readFile(path.join(result.directory,`fixtures/${id}.png`));assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.match(fixture.acceptance.acceptedAt, /NOT ACTIVATED/);
  }
  for (const filename of await modules(path.join(result.directory, 'assets'))) {
    const content = await fs.readFile(filename, 'utf8');
    for (const pattern of [/^\s*(?:import\s+(?:[^;]*?\sfrom\s+)?|export\s+[^;]*?\sfrom\s+)(['"])([^'"]+)\1/gm, /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g]) {
      for (const match of content.matchAll(pattern)) {
        assert.ok(match[2].startsWith('.'), `Unexpected import ${match[2]}`);
        await fs.access(path.resolve(path.dirname(filename), match[2]));
      }
    }
  }
  assert.match(await fs.readFile(path.join(result.directory, 'index.html'), 'utf8'), /LOCAL REVIEW FIXTURE — NOT ACTIVATED/);
});
