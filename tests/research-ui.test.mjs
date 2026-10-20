import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {researchTableHTML, researchSelectionHTML, researchChartSVG, resolveResearchShare} from '../src/research-ui.js';
import {worldShareURL} from '../src/sharing.js';
import {researchThumbnail} from '../scripts/research-thumbnail.mjs';
const registry=JSON.parse(await fs.readFile(new URL('../dist/assets/registry.json',import.meta.url),'utf8'));
const entry=registry.entries.find(entry=>entry.id==='430');
const bundle=JSON.parse(await fs.readFile(new URL(`../dist${entry.research.release.url}`,import.meta.url),'utf8'));
const research={...bundle,rows:bundle.dataset.rows};
test('research thumbnail is deterministic and preserves all source identities',()=>{
  const svg=researchThumbnail(bundle);
  assert.equal(svg,researchThumbnail(bundle));
  for(const row of research.rows) assert.ok(svg.includes(row.id));
  assert.doesNotMatch(svg,/NaN|undefined|VISUAL SCORE/);
  assert.match(svg,/g CO2eq\/kWh/);
});

test('every native observation has table provenance, source status and stable selection',()=>{
  const html=researchTableHTML(research);
  assert.equal((html.match(/data-research-row=/g)||[]).length,44);
  assert.equal((html.match(/data-research-select=/g)||[]).length,44);
  for(const [i,row] of research.rows.entries()) {
    assert.ok(html.includes(`data-research-row="${row.id}"`));
    assert.ok(html.includes(`data-research-select="${i}"`));
    assert.ok(html.includes(row.sourceLocator));
    assert.ok(html.includes(row.geographicId));
  }
  assert.doesNotMatch(html,/VISUAL SCORE|\/100/);
  const selected=researchSelectionHTML(research.rows[0]);
  assert.match(selected,/641/); assert.match(selected,/15%/);
  assert.match(selected,/separate measure/);
});

test('research shares round-trip the accepted revision and exact stable row',()=>{
  const url=new URL(worldShareURL(entry,'https://example.com',{revision:research.revision,selection:'us-central2'}));
  assert.equal(url.pathname,'/globe/the-carbon-clock/');
  const parsed=resolveResearchShare(url.search,research);
  assert.equal(research.rows[parsed.index].id,'us-central2');
  assert.equal(parsed.notice,'');
  assert.equal([...url.searchParams.keys()].join(','),'v,row');
});

test('unavailable versions and selections never silently claim the shared evidence',()=>{
  const unavailable=resolveResearchShare('?v=unavailable&row=us-central1',research);
  assert.equal(unavailable.index,-1); assert.match(unavailable.notice,/may differ/);
  const badRow=resolveResearchShare(`?v=${research.revision}&row=not-a-region`,research);
  assert.equal(badRow.index,-1); assert.match(badRow.notice,/region is unavailable/);
  assert.throws(()=>worldShareURL(entry,'https://example.com',{revision:'untrusted'}));
  assert.throws(()=>worldShareURL(entry,'https://example.com',{selection:'us-central1'}));
  assert.throws(()=>worldShareURL(entry,'https://example.com',{revision:research.revision,selection:'<script>'}));
});

test('static fallback retains all regions and distinguishes a missing observation from zero',()=>{
  const zero=structuredClone(research); zero.rows[0].value=0;
  const missing=structuredClone(research); missing.rows[0].value=null;
  assert.match(researchChartSVG(zero),/width="0" height="14"/);
  assert.match(researchChartSVG(missing),/No observation/);
  const html=researchChartSVG(research);
  for(const row of research.rows) assert.ok(html.includes(row.id));
  assert.match(html,/700 g CO2eq\/kWh/);
});

test('built collection separates research readiness from runtime implementation',()=>{
  assert.equal(registry.legacyEvidenceCount,14);
  assert.equal(registry.researchImplementedCount,1);
  assert.equal(registry.researchAcceptedCount,73);
  assert.equal(registry.researchHeldCount,59);
  assert.equal(registry.evidenceCount,15);
  assert.equal(registry.conceptCount,131);
  assert.deepEqual(registry.entries.filter(e=>e.research).map(e=>e.id),['430']);
});
