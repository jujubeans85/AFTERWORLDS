import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {validateMultipleBinding} from '../src/research-multiple.js';
import {researchTableHTML,researchSourcesHTML,researchChartSVG,observationLabel} from '../src/research-ui.js';
import {researchSourceList} from '../src/research-records.js';
const canonical=value=>JSON.stringify(value);
const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url))).designs;
async function view(id){const design=designs.find(d=>d.conceptId===id),datasets=await Promise.all(design.datasetBindings.map(async binding=>({datasetId:binding.datasetId,datasetSha256:binding.sha256,dataset:JSON.parse(await fs.readFile(new URL('../'+binding.path,import.meta.url)))})));return {conceptId:id,design,datasets,dataset:datasets[0].dataset,datasetSha256:'test-binding-set',designSha256:'test-design',...validateMultipleBinding({conceptId:id,design,datasets},canonical)};}
test('multi-source tables preserve global selection indices and only exact bound rows',async()=>{
 const research=await view('217'),html=researchTableHTML(research);
 assert.equal(research.rows.length,4);assert.equal((html.match(/data-research-select=/g)||[]).length,4);
 for(let index=0;index<4;index++)assert.ok(html.includes(`data-research-select="${index}"`));
 assert.match(html,/energychange/);assert.doesNotMatch(html,/data-research-row="fullenergy"/);
 for(const entry of research.datasets){assert.ok(html.includes(entry.dataset.title));for(const source of entry.dataset.sources)assert.ok(html.includes(source.url));}
});
test('each source keeps its own dates, digest, denominator and complete citations',async()=>{
 const research=await view('394'),html=researchSourcesHTML(research),dates=observationLabel(research);
 assert.match(html,/Binding-set SHA-256/);assert.match(html,/not a single dataset-file hash/);
 for(const entry of research.datasets){assert.ok(html.includes(entry.datasetSha256));assert.ok(html.includes(entry.dataset.denominator));assert.ok(dates.includes(entry.dataset.time.observationStart));assert.ok(dates.includes(entry.dataset.time.observationEnd));}
 assert.equal(researchSourceList(research).length,new Set(research.datasets.flatMap(entry=>entry.dataset.sources.map(source=>source.sourceId))).size);
});
test('Irish share chart uses the explicit share field while global context stays separate',async()=>{
 const research=await view('56-5'),svg=researchChartSVG(research);
 for(const row of research.rows.filter(row=>row.datasetId==='physical-irish-electricity-series'))assert.ok(svg.includes(`${row.nationalMeteredSharePercent}% of national metered electricity`));
 assert.match(svg,/Separate global context/);assert.match(svg,/485/);assert.doesNotMatch(svg,/NaN|undefined/);
 const history=researchChartSVG(await view('394'));assert.match(history,/8000/);assert.match(history,/Dated policy conditions/);assert.doesNotMatch(history,/NaN|undefined/);
});
