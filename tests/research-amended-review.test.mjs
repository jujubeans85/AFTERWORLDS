import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {applyDesignCorrection} from '../src/research-design-amendments.js';
import {amendedInstrumentPlan} from '../src/research-amended.js';
import {researchChartSVG,researchTableHTML,researchPresentation,researchSourcesHTML} from '../src/research-ui.js';

const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url))).designs;
async function fixture(conceptId){
 const original=designs.find(design=>design.conceptId===conceptId);
 const name=conceptId==='74'?'74-two-task-selection':'156-8-rounded-percentage';
 const proposal=JSON.parse(await fs.readFile(new URL(`../data-updates/design-proposals/${name}.json`,import.meta.url)));
 const design=applyDesignCorrection(original,proposal);
 const dataset=JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`,import.meta.url)));
 const data={conceptId,design,dataset};
 return {...data,rows:amendedInstrumentPlan(data).rows};
}

test('corrected task UI exposes four exact selected observations and task configurations',async()=>{
 const data=await fixture('74'),table=researchTableHTML(data),svg=researchChartSVG(data);
 assert.equal(data.dataset.rows.length,18);
 assert.equal((table.match(/data-research-select=/g)||[]).length,4);
 assert.equal((svg.match(/data-source-row=/g)||[]).length,4);
 for(const row of data.rows){assert.ok(table.includes(row.id));assert.ok(svg.includes(row.id));assert.ok(svg.includes(row.benchmark));assert.ok(svg.includes(row.configuration));}
 assert.doesNotMatch(table,/data-research-row="gemma-0-0"/);
 assert.match(svg,/no overall ranking/);
});

test('corrected rounded53 UI retains both outcomes and separate respondent denominators',async()=>{
 const data=await fixture('156-8'),table=researchTableHTML(data),svg=researchChartSVG(data),presentation=researchPresentation(data);
 assert.equal((table.match(/data-research-select=/g)||[]).length,2);
 for(const row of data.rows){assert.ok(svg.includes(row.name));assert.ok(svg.includes(row.unit));}
 assert.match(presentation.explanation,/rounded 53%/);
 assert.match(presentation.boundary,/Do not multiply 53% and 90%/);
 assert.ok(svg.includes(`width="${920*53/100}"`));
 assert.ok(svg.includes(`width="${920*90/100}"`));
 assert.match(svg,/not a strict lower bound/);
 assert.match(svg,/respondents who know client location/);
 assert.doesNotMatch(svg,/marker-end=|&gt;53/);
 const sources=researchSourcesHTML(data);
 assert.match(sources,/rounded 53%/);
 assert.doesNotMatch(sources,/over 53% is a lower bound/);
 // Historical frozen wording stays reproducible; the current presentation must
 // apply the explicit scientific correction instead of repeating that wording.
 assert.match(data.design.legend,/over 53% is a lower bound/);
});
