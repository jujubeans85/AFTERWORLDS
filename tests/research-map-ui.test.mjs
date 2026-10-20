import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {prepareCountryGeography} from '../scripts/research-geography.mjs';
import {nativeValue,researchChartSVG,researchPresentation,researchSelectionHTML} from '../src/research-ui.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url))).designs;
async function view(id){const design=designs.find(d=>d.conceptId===id),dataset=JSON.parse(await fs.readFile(new URL('../'+design.datasetBindings[0].path,import.meta.url))),geography=id==='378'?null:await prepareCountryGeography(root,dataset,{anchors:['375','78-4'].includes(id)});return {conceptId:id,design,dataset,rows:dataset.rows,geography};}
test('recorder UI distinguishes zero detection, missing effort and absent source combinations',async()=>{
 const research=await view('378');
 assert.match(nativeValue(research.rows.find(row=>row.value===0)),/Not detected with recorded effort/);
 assert.match(nativeValue(research.rows.find(row=>row.value===null)),/Unknown/);
 const svg=researchChartSVG(research,{species:'Common Chiffchaff',week:20});
 assert.match(svg,/Common Chiffchaff/);assert.match(svg,/source week 20/);assert.match(svg,/X: absent from extract, unknown/);assert.doesNotMatch(svg,/NaN|undefined/);
 const selected=researchSelectionHTML(research.rows[0],research);assert.match(selected,/Published latitude/);assert.match(selected,/Published longitude/);
 assert.match(researchPresentation(research).geography,/source-randomised/);
});
test('country-count chart uses area scale and switches to a separately labelled percentage fill',async()=>{
 const research=await view('78-4'),count=researchChartSVG(research),percent=researchChartSVG(research,{mapMode:'percent'});
 assert.match(count,/Disk AREA proportional/);assert.match(count,/167\/217/);assert.match(count,/50 table-only/);
 assert.match(percent,/Internet use, 0–100% of population/);assert.doesNotMatch(percent,/fill-opacity="0.6"/);
 assert.doesNotMatch(count+percent,/NaN|undefined/);
});
test('membership and patent fallback maps retain country identity and their separate measures',async()=>{
 for(const id of ['247','375']){const research=await view(id),svg=researchChartSVG(research);for(const row of research.rows)assert.ok(svg.includes(`data-source-row="${row.id}"`));assert.match(svg,/not local sites/);assert.doesNotMatch(svg,/NaN|undefined/);}
});
