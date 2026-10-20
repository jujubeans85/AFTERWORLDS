import {ACTIVE_RESEARCH_CONCEPTS} from '../src/research-data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {researchSceneValuesHTML, researchPresentation, researchTableHTML, researchSelectionHTML, researchChartSVG, resolveResearchShare, nextLowerAccessIndex} from '../src/research-ui.js';
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
  assert.equal(registry.researchImplementedCount,ACTIVE_RESEARCH_CONCEPTS.length);
  assert.equal(registry.researchAcceptedCount,73);
  assert.equal(registry.researchHeldCount,59);
  assert.equal(registry.evidenceCount,14+ACTIVE_RESEARCH_CONCEPTS.length);
  assert.equal(registry.conceptCount,132-ACTIVE_RESEARCH_CONCEPTS.length);
  assert.deepEqual(registry.entries.filter(e=>e.research).map(e=>e.id).sort(),[...ACTIVE_RESEARCH_CONCEPTS].sort());
});

const accessEntry=registry.entries.find(entry=>entry.id==='408');
const accessBundle=JSON.parse(await fs.readFile(new URL(`../dist${accessEntry.research.release.url}`,import.meta.url),'utf8'));
const access={...accessBundle,rows:accessBundle.dataset.rows};
test('electricity table includes all217 economies, table-only reasons and two nulls',()=>{
 const html=researchTableHTML(access);
 assert.equal((html.match(/data-research-row=/g)||[]).length,217);
 assert.equal((html.match(/No observation/g)||[]).length,2);
 assert.match(html,/Table only:/); assert.doesNotMatch(html,/CFE matching/);
 const full=access.rows.find(row=>row.value===100);assert.match(researchSelectionHTML(full,access),/100% of a full turn/);
 const missing=access.rows.find(row=>row.value===null);assert.match(researchSelectionHTML(missing,access),/No observation: no numerical dial/);
});
test('next lacking access follows ascending values with exact stable source indexes',()=>{
 const seen=new Set();let index=-1,previous=-Infinity;
 const count=access.rows.filter(row=>row.value!==null&&row.value<100).length;
 for(let n=0;n<count;n++){index=nextLowerAccessIndex(access,index);const row=access.rows[index];assert.ok(row.value>=previous&&row.value<100);assert.ok(!seen.has(row.id));seen.add(row.id);previous=row.value;}
 assert.equal(access.rows[nextLowerAccessIndex(access,index)].value,5.4);
});


test('native instrument values stay readable outside canvas and accounting meanings stay separate',async()=>{
 for(const id of ['330','388','372','276','409','369','324','385','232']){
  const entry=registry.entries.find(entry=>entry.id===id);
  const bundle=JSON.parse(await fs.readFile(new URL(`../dist${entry.research.release.url}`,import.meta.url)));
  const research={...bundle,rows:bundle.dataset.rows};
  const text=researchSceneValuesHTML(research),copy=researchPresentation(research),chart=researchChartSVG(research);
  for(const row of research.rows)assert.ok(text.includes(row.name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')));
  assert.doesNotMatch(copy.explanation,/Each amber column shows an annual grid/);
  if(id==='385'){assert.match(chart,/MULTI-YEAR ANNOUNCED INTENTION/);assert.match(chart,/ANNUAL NATIONAL GDP/);assert.match(chart,/stroke-dasharray="5 3"/);}
  if(id==='369')assert.match(chart,/CORPORATE REVENUE/);
  if(id==='330')assert.match(text,/robust SE · N 654/);
  if(id==='324')assert.match(text,/Included uprate \(MW\): 190.*included in the contract quantity/);
 }
});


test('training compute fallback uses exact logarithmic positions and all confidence labels',async()=>{
 const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url))).designs;
 const design=designs.find(d=>d.conceptId==='117'),dataset=JSON.parse(await fs.readFile(new URL('../'+design.datasetBindings[0].path,import.meta.url)));
 const html=researchChartSVG({conceptId:'117',design,dataset,rows:dataset.rows});
 for(const row of dataset.rows){assert.ok(html.includes(`cx="${280+240*(Math.log10(row.value)-25)}"`));assert.ok(html.includes(String(row.value)));assert.ok(html.includes(row.estimateConfidence));}
 for(const tick of ['1e+25','1e+26','1e+27'])assert.ok(html.includes(tick));
 assert.match(html,/publication date, not training date/);assert.doesNotMatch(html,/fixed scale zero/);
});
