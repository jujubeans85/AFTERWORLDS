import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { runCandidateCheck } from '../scripts/check-wdi-ci.mjs';
import { sha256 } from '../scripts/refresh-wdi.mjs';

test('CI source failure produces immutable diagnostics without altering acceptance', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wdi-ci-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const result = await runCandidateCheck({ root, now: () => '2026-10-20T06:00:00Z', refresh: async () => { throw new Error('HTTP 429'); } });
  assert.equal(result.report.outcome, 'source-check-failed');
  assert.equal(result.report.acceptanceChanged, false);
  assert.equal(result.report.error.message, 'HTTP 429');
  assert.equal(path.basename(result.filename), `${sha256(await fs.readFile(result.filename))}.json`);
  await assert.rejects(fs.access(path.join(root, 'data-updates/accepted-manifest.json')), { code: 'ENOENT' });
});

test('CI no-change check is reported without becoming an accepted release', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'wdi-ci-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const result = await runCandidateCheck({ root, refresh: async () => ({ status: 'no-semantic-change', changedRows: 0, written: false }) });
  assert.equal(result.report.outcome, 'source-check-completed');
  assert.equal(result.report.result.written, false);
  assert.equal(result.report.acceptanceChanged, false);
});
