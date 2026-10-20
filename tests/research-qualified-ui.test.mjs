import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {nativeValue,researchChartSVG,researchSelectionHTML,researchTableHTML,researchPresentation,researchSceneValuesHTML,resolveResearchShare} from '../src/research-ui.js';
const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url),'utf8')).designs;
async function evidence(id) {
  const design=designs.find(record=>record.conceptId===id);
  const dataset=JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`,import.meta.url),'utf8'));
  return {conceptId:id,design,dataset,rows:design.datasetBindings[0].includedRowIds.map(id=>dataset.rows.find(row=>row.id===id)),revision:'a'.repeat(64)};
}
test('interval-only fallback keeps source endpoints and explicitly separates activity denominators',async()=>{
  const research=await evidence('388'),svg=researchChartSVG(research);
  assert.equal(nativeValue(research.rows[0]),'72–76');
  assert.equal(nativeValue(research.rows[1]),'21–30');
  assert.doesNotMatch(svg,/No observation/);
  assert.match(svg,/percent of each activity category/);
  assert.match(svg,/ALL DETECTED ACTIVITY/);
  assert.match(svg,/rounded total 99%; not normalized/);
  const table=researchTableHTML(research);
  assert.equal((table.match(/data-research-row=/g)||[]).length,8);
  for(const row of research.rows)assert.match(table,new RegExp(row.id));
  assert.match(researchSelectionHTML(research.rows[0],research),/No point estimate or midpoint/);
});
test('qualified fallback preserves standard errors and source bounds instead of exact counts or ratios',async()=>{
  const trial=await evidence('330');
  const selection=researchSelectionHTML(trial.rows[0],trial),chart=researchChartSVG(trial);
  assert.match(selection,/±0\.068 robust standard error/);
  assert.match(selection,/regression N 654/);
  assert.match(selection,/not a 95% confidence interval/);
  assert.match(chart,/robust SE; N 654/);
  const cooling=await evidence('406');
  assert.deepEqual(cooling.rows.map(nativeValue),['<5','<5','approximately 10','up to 40']);
  const demand=await evidence('193-5'),demandSVG=researchChartSVG(demand);
  assert.deepEqual(demand.rows.map(nativeValue),['approximately 540','<1']);
  assert.match(demandSVG,/magnified inset · 0–5/);
  assert.match(demandSVG,/same upper bound, different displayed scale/);
});
test('unavailable shared versions do not misidentify an accepted update as the frozen baseline',async()=>{
  const research={...await evidence('408'),acceptance:{kind:'reviewed-update'}};
  const result=resolveResearchShare('?v=unavailable&row=electricity-AFG',research);
  assert.equal(result.index,-1);assert.match(result.notice,/accepted revision/);
  assert.doesNotMatch(result.notice,/frozen/);
});
test('count equivalents preserve anonymous totals, comparative years and separate pay denominators',async()=>{
  for(const [id,total] of [['333',121],['63-8',42],['364',18]]) {
    const research=await evidence(id),svg=researchChartSVG(research);
    // One background rectangle plus the exact source count/anonymous slots.
    assert.equal((svg.match(/<rect\b/g)||[]).length,total+1);
    assert.match(svg,/No slot identifies a person, country or year/);
  }
  const votes=researchPresentation(await evidence('333'));
  assert.doesNotMatch(votes.invitation,/not voted|non.?vot|absent/i);
  const versions=researchPresentation(await evidence('63-8'));
  assert.doesNotMatch(versions.invitation,/publication.type/i);
  const comparison=researchPresentation(await evidence('364'));
  assert.doesNotMatch(comparison.invitation,/successful forecasts/i);
  assert.match(`${comparison.invitation} ${comparison.boundary}`,/compar|higher accuracy|outperform/i);
  const pay=await evidence('320');
  for(const row of pay.rows) {
    const selected=researchSelectionHTML(row,pay);
    assert.ok(selected.includes(`Statistic: ${row.statistic}`));
    assert.ok(selected.includes(`Time denominator: ${row.timeBasis}`));
  }
});
test('qualitative case amounts keep about and nearly in the immediately readable value',async()=>{
  const cases=await evidence('371'),readout=researchSceneValuesHTML(cases);
  for(const row of cases.rows.filter(row=>['about','nearly'].includes(row.qualifier))) {
    assert.ok(nativeValue(row).startsWith(`${row.qualifier} `));
    assert.ok(readout.includes(`${row.qualifier} ${row.value}`));
  }
});
test('percentage equivalents retain published rounding and clinical outcome denominators',async()=>{
  const accounts=await evidence('138-8'),accountChart=researchChartSVG(accounts),accountReadout=researchSceneValuesHTML(accounts);
  assert.match(accountChart,/67\.3%/);
  assert.match(accountChart,/6\.5%/);
  assert.doesNotMatch(accountChart,/560%|54%|67\.307/);
  assert.match(accountReadout,/Published percentage: 67\.3/);
  assert.match(accountReadout,/Account denominator: 832/);
  const trial=await evidence('8-6'),chart=researchChartSVG(trial),readout=researchSceneValuesHTML(trial);
  assert.match(chart,/95% CI 96–100/);
  assert.match(chart,/95% CI 14–32/);
  assert.match(chart,/18\/82 analyzed; 83 randomized/);
  assert.match(readout,/Analyzed N: 82/);
  assert.match(readout,/Randomized N: 83/);
  assert.match(readout,/95% confidence interval: 14–32/);
  assert.doesNotMatch(chart,/robust SE|1 SE/);
  const exposure=researchChartSVG(await evidence('422-2'));
  assert.match(exposure,/Each semicircle = 100%/);
  assert.match(exposure,/High exposure is a subset; do not add/);
});
test('comparison equivalents preserve source subsets and distinguish three uncertainty meanings',async()=>{
  const tasks=await evidence('218'),taskChart=researchChartSVG(tasks);
  assert.equal(tasks.dataset.rows.length,18);
  assert.equal((taskChart.match(/data-source-row=/g)||[]).length,12);
  assert.doesNotMatch(taskChart,/E2B/);
  for(const row of tasks.rows)assert.ok(taskChart.includes(row.id));
  const fields=await evidence('398'),fieldChart=researchChartSVG(fields);
  assert.match(fieldChart,/Descriptive SD 0\.15; not CI/);
  const wetland=await evidence('115-2'),wetlandChart=researchChartSVG(wetland);
  assert.match(wetlandChart,/Published \(0\.41\); definition not verified/);
  assert.doesNotMatch(wetlandChart,/95% CI/);
  const injury=await evidence('211-4'),injuryChart=researchChartSVG(injury);
  for(const row of injury.rows) {
    assert.ok(injuryChart.includes(`95% CI ${row.ciLower}–${row.ciUpper}`));
    assert.ok(injuryChart.includes(row.unit));
  }
  assert.match(injuryChart,/Human benchmark spatially weighted/);
  const fuel=researchChartSVG(await evidence('323'));
  assert.match(fuel,/&gt;40/);
  assert.match(fuel,/approximately 20/);
  const hypoxia=researchChartSVG(await evidence('392'));
  assert.match(hypoxia,/Shared test N=12; overlapping training years; inconsistent source dates/);
});
