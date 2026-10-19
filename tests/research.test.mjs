import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { datasetErrors, schemaErrors } from '../research/validate.mjs';

test('research data cannot silently acquire locations, duplicate observations, or broken provenance', () => {
  const row = { id: 'one', sourceId: 'primary', value: 10, status: 'observed', lat: null, lon: null };
  const data = { geography: { mode: 'global' }, sources: [{ sourceId: 'primary' }], rows: [row] };
  assert.deepEqual(datasetErrors(data), []);
  assert.match(datasetErrors({ ...data, rows: [{ ...row, lat: 0, lon: 0 }] }).join(' '), /nongeographic/);
  assert.match(datasetErrors({ ...data, rows: [row, row] }).join(' '), /duplicate row/);
  assert.match(datasetErrors({ ...data, rows: [{ ...row, sourceId: 'unknown' }] }).join(' '), /unresolved sourceId/);
  assert.match(datasetErrors({ ...data, rows: [{ ...row, value: null }] }).join(' '), /missing status/);
  assert.match(datasetErrors({ ...data, rows: [{ ...row, value: 0, status: 'missing' }] }).join(' '), /missing row has a value/);
  assert.deepEqual(datasetErrors({ ...data, rows: [{ ...row, value: null, status: 'estimated', lower: 72, upper: 76 }] }), []);
  assert.match(datasetErrors({ ...data, rows: [{ ...row, value: null, status: 'estimated', lower: 76, upper: 72 }] }).join(' '), /invalid interval/);
});

test('readiness score cannot compensate for an unchecked research gate', async () => {
  const schema = JSON.parse(await fs.readFile(new URL('../research/audits/concept.schema.json', import.meta.url), 'utf8'));
  const c = {
    conceptId: 'fixture', originalSourceUrl: 'https://example.org', originalQuestion: 'Question',
    proposedTitle: 'Title', proposedQuestion: 'Question', claim: 'Claim', sourceConnection: 'Connection', reframeReason: null,
    aiRelationship: { class: 'direct', justification: 'Source explicitly measures AI', sourceIds: ['primary'] },
    datasetIds: ['data'], designId: 'design-fixture', verdict: 'direct-ready', blockers: [], limitations: [],
    scoring: { type: 'none' }, forecast: { type: 'none' },
    review: { score: 92, scoreBreakdown: [], reviewer: 'Independent reviewer', reviewedAt: '2026-10-20', datasetDigests: { data: 'a'.repeat(64) }, gates: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`G${i + 1}`, { status: 'pass', evidence: ['review-log'], reason: 'Checked' }])) },
  };
  assert.deepEqual(schemaErrors(c, schema), []);
  c.review.gates.G2.status = 'unchecked';
  assert.ok(schemaErrors(c, schema).length);
  c.review.gates.G2.status = 'pass'; c.review.score = 91.99;
  assert.ok(schemaErrors(c, schema).length);
  c.review.score = 92; c.blockers.push('Unresolved reuse basis');
  assert.ok(schemaErrors(c, schema).length);
});
