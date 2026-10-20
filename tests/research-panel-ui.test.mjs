import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {researchChartSVG,researchScaleHTML} from '../src/research-ui.js';
const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url))).designs;
async function view(id){const design=designs.find(d=>d.conceptId===id),dataset=JSON.parse(await fs.readFile(new URL('../'+design.datasetBindings[0].path,import.meta.url)));return{conceptId:id,design,dataset,rows:dataset.rows};}
test('mixed fallback retains every source row and discloses independent scales',async()=>{
 for(const id of ['325','111-3','266-2','390','30-8','8-17']){const research=await view(id),svg=researchChartSVG(research);for(const row of research.rows)assert.ok(svg.includes(`data-source-row="${row.id}"`));assert.doesNotMatch(svg,/NaN|undefined/);assert.match(researchScaleHTML(research),/Separate evidence panels/);}
 const svg=researchChartSVG(await view('8-17'));assert.match(svg,/95% CI 0.7–0.99 · null = 1/);assert.match(svg,/Separate axis: 0–5/);assert.match(svg,/Separate axis: 0–1.2/);assert.match(svg,/Randomized N=/);
 const lifecycle=researchChartSVG(await view('30-8'));assert.doesNotMatch(lifecycle,/Separate axis:/);assert.match(lifecycle,/400-token response/);assert.match(lifecycle,/18 months/);
});
test('wine fallback switches exact count and within-type share geometry without dropping zero bins',async()=>{
 const research=await view('365'),count=researchChartSVG(research),share=researchChartSVG(research,{histogramMode:'share'});
 for(const row of research.rows){assert.ok(count.includes(`data-source-row="${row.id}"`));assert.ok(share.includes(`data-source-row="${row.id}"`));assert.ok(count.includes(`${row.value} samples / ${row.sampleDenominator}`));assert.ok(share.includes(`width="${580*row.value/row.sampleDenominator}"`)||share.includes(`width="${580*(row.value/row.sampleDenominator)}"`));}
 assert.match(count,/Count · 0–2,500/);assert.match(share,/Within-type share · 0–100%/);assert.doesNotMatch(count+share,/NaN|undefined/);
});
