import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { prepareCountryGeography } from '../scripts/research-geography.mjs';
import { researchChartSVG, researchTableHTML } from '../src/research-ui.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url))).designs;
async function evidence(id) {
  const design=designs.find(record=>record.conceptId===id);
  const dataset=JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`,import.meta.url)));
  return {conceptId:id,design,dataset,rows:dataset.rows,
    ...(id==='378'?{}:{geography:await prepareCountryGeography(root,dataset,{anchors:id!=='247'})})};
}
test('recorder fallback filters only its map while retaining every supplied observation in the table',async()=>{
  const research=await evidence('378'),table=researchTableHTML(research);
  assert.equal((table.match(/data-research-row=/g)||[]).length,1587);
  for(const row of research.rows)assert.ok(table.includes(`data-research-row="${row.id}"`));
  assert.match(table,/source-randomised recorder coordinates/);
  for(const species of new Set(research.rows.map(row=>row.species))) {
    let supplied=0;
    for(let week=10;week<=30;week++) {
      const chart=researchChartSVG(research,{species,week});
      const ids=[...chart.matchAll(/data-source-row="([^"]+)"/g)].map(match=>match[1]);
      const expected=research.rows.filter(row=>row.species===species&&row.week===week);
      assert.deepEqual(new Set(ids),new Set(expected.map(row=>row.id)));
      supplied+=ids.length;
      assert.match(chart,/absent from extract, unknown/);
      assert.match(chart,/hatch: missing effort/);
      assert.match(chart,/detection is not an individual bird count/);
    }
    assert.equal(supplied,529);
    assert.equal(27*21-supplied,38);
  }
});
test('country fallback and tables retain partial map coverage and distinct count/share meanings',async()=>{
  const research=await evidence('78-4');
  assert.equal(research.rows.filter(row=>row.value===null).length,35);
  assert.equal(research.geography.coverage.mapped+research.geography.coverage.tableOnly,217);
  const table=researchTableHTML(research);
  assert.equal((table.match(/data-research-row=/g)||[]).length,217);
  for(const item of research.geography.unsupported)assert.ok(table.includes(`data-research-row="${item.rowId}"`));
  const people=researchChartSVG(research,{mapMode:'people'});
  const percent=researchChartSVG(research,{mapMode:'percent'});
  assert.match(people,/Disk AREA proportional to estimated Internet users/);
  assert.match(percent,/Internet use, 0–100% of population/);
  assert.match(people,/table-only/);assert.match(percent,/grey means missing/);
});
