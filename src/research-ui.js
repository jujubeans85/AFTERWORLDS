import {COMPARISON_CONCEPTS,comparisonInstrumentPlan} from './research-comparisons.js';
import {ARCHITECTURE_CONCEPTS,architectureInstrumentPlan} from './research-architecture.js';
import {PERCENTAGE_CONCEPTS,percentageInstrumentPlan} from './research-percentages.js';
import {accessColor} from './research-geography.js';
import { escapeHTML as esc } from './math.js';

export function nativeValue(row) {
  if (row.value === null) return Number.isFinite(row.lower) && Number.isFinite(row.upper) ? `${row.lower}–${row.upper}` : 'No observation';
  const prefix=['<','>','≤','≥','≈'].includes(row.qualifier) ? row.qualifier : ['approximately','up to','about','nearly'].includes(row.qualifier) ? row.qualifier+' ' : '';
  return `${prefix}${row.value}`;
}

const semanticLabels={measureType:'Account',buyer:'Buyer',kind:'Capacity type',responseMethod:'Response method',metricDefinition:'Score definition',territoryCount:'Territories',incrementalMW:'Included uprate (MW)',statistic:'Statistic',timeBasis:'Time denominator',denominator:'Denominator',leadMonths:'Lead time (months)',targetMonth:'Target month',consortiumCountries:'Consortium members',hostCountry:'Host country',announcementDate:'Announcement date',country:'Country',component:'Workflow component',finalDecision:'Final decision',measurement:'Measurement definition',amountQualifier:'Amount definition',caseStatusAtPublication:'Case status at publication',reportedAt:'Reported at',laterStatusSourceId:'Later status source',feedsInto:'Feeds into',receivesFrom:'Receives from',mechanism:'Mechanism',fromEntity:'From organisation',toEntity:'To organisation',archiveHost:'Archive host',archiveName:'Archive name',hostStar:'Host star',exclusions:'Exclusions'};
Object.assign(semanticLabels,{sex:'Sex',exposureCategory:'Exposure category',sampleScope:'Sample scope',ageRange:'Age range',model:'Model',metric:'Metric',growthStage:'Growth stage',field:'Field',standardDeviation:'Standard deviation',nationalMeteredSharePercent:'National metered share (%)',testSampleN:'Test sample N',lower:'Published lower endpoint',upper:'Published upper endpoint',species:'Species',week:'Week',uptimeFraction:'Recorder uptime fraction',automatedDetectionCount:'Automated detections',rank:'Source rank',qualityScore:'Quality score',wineType:'Wine type',sampleDenominator:'Sample denominator',comparison:'Comparator',namedCountries:'Named countries',trialLocation:'Trial location',outcome:'Outcome',sampleSizeApprox:'Approximate sample size',target:'Target',benchmark:'Benchmark',configuration:'Configuration',boundary:'Measurement boundary',cohort:'Cohort',ciLower:'Confidence interval lower endpoint',ciUpper:'Confidence interval upper endpoint',confidenceLevel:'Confidence level (fraction)',waymoCrashCount:'Waymo crash count',randomizedN:'Randomized N',numerator:'Numerator',analyzedN:'Analyzed N',ci95:'95% confidence interval',followupMonths:'Follow-up (months)',definition:'Definition',settlement:'Settlement category',population:'Population',internetPercent:'Internet use (%)',populationSourceId:'Population source',publishedParentheticalUncertainty:'Published parenthetical uncertainty',organization:'Organisation',organizationCountries:'Organisation countries',estimateConfidence:'Estimate confidence',estimateNotes:'Estimate notes',primaryReference:'Primary reference',denominatorAccounts:'Account denominator',publishedPercent:'Published percentage'});
function semanticDetailsHTML(row) {
  return Object.entries(semanticLabels).filter(([key])=>row[key]!==undefined).map(([key,label])=>`<span class="table-note">${label}: ${esc(row[key]===null?'Not supplied':Array.isArray(row[key])?row[key].join(key==='ci95'?'–':'; '):row[key])}${key==='incrementalMW'?' · included in the contract quantity, not additional':''}</span>`).join('');
}

export function researchScaleHTML(research){
 const scale=research.design.scale;
 if(scale.type==='log10-position')return `<strong>10²⁵ — 10²⁶ — 10²⁷</strong><br>Logarithmic position · ${esc(scale.unit)}`;
 if(Array.isArray(scale.domain)&&scale.domain.length===2&&scale.domain.every(Number.isFinite))return `<strong>${scale.domain.join(' — ')}</strong><br>${esc(scale.unit)}`;
 return `<strong>${scale.type==='none'?'Equal evidence panels · no common quantity scale':'Categories · equal-size marks'}</strong><br>${esc(scale.unit)}`;
}

function facetChartSVG(research){
 const line=(text,length=90)=>{const words=String(text).split(/\s+/),lines=[''];for(const word of words){const n=lines.length-1;if(lines[n].length+word.length>length)lines.push(word);else lines[n]+=(lines[n]?' ':'')+word;}return lines;};
 const texts=research.rows.map(row=>[...line(row.name),...line(`${nativeValue(row)} · ${row.unit}`),...line(`${row.period} · ${row.status}${row.qualifier?' · '+row.qualifier:''}`)]),height=40+Math.max(...texts.map(lines=>lines.length))*20;
 let y=64;const panels=texts.map(lines=>{const top=y;y+=height+16;return `<g><rect x="16" y="${top}" width="1028" height="${height}" rx="8" fill="none" stroke="#62c4bd"/><text x="32" y="${top+26}">${lines.map((value,index)=>`<tspan x="32" dy="${index?20:0}">${esc(value)}</tspan>`).join('')}</text></g>`;}).join('');
 return `<svg class="research-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 ${y+16}" role="img" aria-label="Equal evidence panels. Native labels; no common quantitative size scale."><rect width="1060" height="${y+16}" fill="#111a24"/><g fill="#edf4fa" font-family="monospace" font-size="14"><text x="16" y="30">Equal evidence panels · size has no quantitative meaning</text>${panels}</g></svg>`;
}

export function researchSelectionHTML(row, research) {
  if (research && !['430','408'].includes(research.conceptId)) {
    if (!row) return '<p>Choose an observation to inspect its native value, period and source status.</p>';
    return `<span class="eyebrow">SELECTED OBSERVATION</span><h2>${esc(row.name)}</h2><p>${esc(row.period)}</p><p class="research-row-id">${esc(row.id)}</p><p class="native-value">${esc(nativeValue(row))} <small>${esc(row.unit)}</small></p><p>${esc(row.status)}${row.qualifier ? ` · ${esc(row.qualifier)}` : ''}</p>${['5-6','63'].includes(research.conceptId) && row.value!==null ? `<p>Unfilled remainder: ${Number((100-row.value).toFixed(10))}% ${research.conceptId==='63' ? 'not using Internet' : 'not mapped to modern standards in this release'}.</p>` : ''}${Number.isFinite(row.standardError) ? `<p>±${row.standardError} robust standard error · regression N ${row.regressionN}. This is ±1 SE, not a 95% confidence interval.</p>` : ""}${row.value===null&&Number.isFinite(row.lower) ? "<p>Published range only. No point estimate or midpoint is supplied.</p>" : ""}${semanticDetailsHTML(row)}<p class="tiny">${esc(row.notes)}</p>`;
  }
  if (research?.conceptId === '408') {
    if (!row) return '<p>Choose an economy to inspect basic electricity access and its source status.</p>';
    return `<span class="eyebrow">SELECTED ECONOMY</span><h2>${esc(row.name)}</h2><p class="research-row-id">${esc(row.id)}</p><p class="native-value">${esc(nativeValue(row))} <small>${esc(row.unit)}</small></p><p>${esc(row.period)} · ${esc(row.status)}${row.qualifier ? ` · ${esc(row.qualifier)}` : ''}</p><p>${row.value === null ? 'No observation: no numerical dial.' : `The fixed 100% dial covers ${esc(row.value)}% of a full turn.`}</p><p class="tiny">Basic access does not measure outages, affordability, device ownership or AI use.</p><p class="tiny">${esc(row.notes)}</p>`;
  }
  if (!row) return '<p>Choose a region to read its annual grid factor and separate carbon-free energy matching figure.</p>';
  return `<span class="eyebrow">SELECTED REGION</span><h2>${esc(row.name)}</h2><p class="research-row-id">${esc(row.id)}</p><p class="native-value">${esc(nativeValue(row))} <small>${esc(row.unit)}</small></p><p>${esc(row.period)} · ${esc(row.status)}${row.qualifier ? ` · ${esc(row.qualifier)}` : ''}</p><p class="cfe-badge">CFE matching <strong>${esc(row.cfePercent)}%</strong></p><p class="tiny">CFE includes attributed procurement. It is a separate measure, not the inverse of grid carbon.</p><p class="tiny">${esc(row.notes)}</p>`;
}

export function researchTableHTML(research) {
  const sources = new Map(research.dataset.sources.map(source => [source.sourceId, source]));
  const unsupported = new Map(research.geography?.unsupported.map(item=>[item.rowId,item.reason]) || []);
  const grid = research.conceptId === '430';
  return `<div class="data-table-wrap research-table" tabindex="0" role="region" aria-label="All source observations; scroll horizontally for provenance"><table class="data-table"><caption>All ${research.rows.length} source observations · ${esc(research.design.scale.unit)} · ${esc(research.dataset.time.observationStart)}${grid ? '. CFE matching is a separate percentage.' : '. Missing and table-only observations remain included.'}</caption><thead><tr><th scope="col">Observation / ID</th><th scope="col">${grid ? 'Grid factor' : research.conceptId === '408' ? 'Basic electricity access' : esc(research.design.title)}<br>${esc(research.design.scale.unit)}</th>${grid ? '<th scope="col">CFE matching %</th>' : ''}<th scope="col">Period / status / qualifier</th><th scope="col">Source / locator</th><th scope="col">Notes / geography ID</th><th scope="col">Inspect</th></tr></thead><tbody>${research.rows.map((row,index)=>`<tr data-research-row="${esc(row.id)}"><th scope="row">${esc(row.name)}<span class="table-note">${esc(row.id)}</span></th><td>${esc(nativeValue(row))}<span class="table-note">${esc(row.unit)}${Number.isFinite(row.standardError) ? `<br>±${row.standardError} robust SE · N ${row.regressionN}` : ""}</span></td>${grid ? `<td>${esc(row.cfePercent)}</td>` : ''}<td>${esc(row.period)}<br>${esc(row.status)}<br>${esc(row.qualifier || 'No qualifier')}</td><td><a href="${esc(sources.get(row.sourceId).url)}" target="_blank" rel="noopener noreferrer">${esc(sources.get(row.sourceId).publisher)} ↗</a><span class="table-note">${esc(row.sourceId)} · ${esc(row.sourceLocator)}</span></td><td>${esc(row.notes)}${semanticDetailsHTML(row)}<span class="table-note">${esc(row.geographicId)} · ${grid ? 'Abstract region slot; no observed coordinates' : !research.geography ? 'Global or categorical observation; no mapped location' : unsupported.has(row.id) ? `Table only: ${unsupported.get(row.id)}` : 'Audited country polygon; uniform national summary'}</span></td><td><button data-research-select="${index}" aria-label="Select ${esc(row.name)}, ${esc(row.id)}">SELECT</button></td></tr>`).join('')}</tbody></table></div>`;
}

export function researchSourcesHTML(research) {
  const {dataset, design, revision} = research;
  const limits=[...new Set([...design.limitations,...(dataset.limitations || []),...(dataset.limits || []),dataset.uncertainty,dataset.coverage?.omitted].filter(Boolean))];
  return `<h3>What the evidence supports</h3><p>${esc(design.legend)}</p><p><strong>Denominator:</strong> ${esc(dataset.denominator)}</p><h4>Limits of this comparison</h4><ul>${limits.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>${research.geography ? `<h4>Map coverage</h4><p>${research.geography.coverage.mapped} mapped economies; ${research.geography.coverage.tableOnly} remain table-only. <a href="${esc(research.geography.source.url)}" target="_blank" rel="noopener noreferrer">UN M49 identifier join</a>; ${esc(research.geography.source.geometry)}.</p><ul>${research.geography.limitations.map(text=>`<li>${esc(text)}</li>`).join('')}</ul>` : ''}<h4>Source and reuse</h4><ol class="sources">${dataset.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p>${esc(source.locator)}</p><p>${esc(source.reuse.attribution)} · <a href="${esc(source.reuse.termsUrl)}" target="_blank" rel="noopener noreferrer">${esc(source.reuse.basis)}</a></p></li>`).join('')}</ol><p class="tiny">Observation: ${esc(observationLabel(research))} · Source publication: ${esc(dataset.time.publishedAt || 'Not supplied')} · Source retrieved: ${esc(dataset.time.retrievedAt)}. Accepted ${esc(research.acceptance?.acceptedAt || "2026-10-19")}${research.acceptance?.originalResearchAcceptedAt?` · Original research accepted ${esc(research.acceptance.originalResearchAcceptedAt)}`:""} · Source last checked: ${esc(research.acceptance?.lastCheckedAt || "Not checked by an active source service")}. The browser checks accepted application releases; it does not poll the source directly.</p><details class="revision-details"><summary>Reproduce this view</summary><p>${research.acceptance?.kind === "reviewed-update" ? "Accepted update dataset" : "Original frozen dataset file"} SHA-256 (not the combined download): <code>${esc(research.datasetSha256)}</code></p><p>Design SHA-256: <code>${esc(research.designSha256)}</code></p>${research.designAmendment ? `<p>Reviewed design correction: <a href="${esc(research.designAmendment.url)}">amendment evidence</a> · <a href="${esc(research.designAmendment.proposal.url)}">proposal</a> · <a href="${esc(research.designAmendment.review.url)}">independent factual review</a>. The frozen original remains preserved.${research.designAmendment.runtimeApproval?` <a href="${esc(research.designAmendment.runtimeApproval.url)}">Runtime review</a> dated ${esc(research.designAmendment.runtimeApproval.reviewedAt)}.`:""}</p><p>Original design SHA-256: <code>${esc(research.designAmendment.originalDesignSha256)}</code></p><p>Amendment SHA-256: <code>${esc(research.designAmendment.sha256)}</code></p>` : ''}<p>Accepted research revision: <code>${esc(revision)}</code></p></details>`;
}

function countChartSVG(research){
 let y=70;const counters=research.conceptId==='364',rows=research.rows;
 const groups=rows.map(row=>{const top=y,slots=counters?9:row.value,columns=60,lines=Math.ceil(slots/columns);y+=58+lines*14;
 return `<text x="16" y="${top}">${esc(row.name)} · ${row.value}${counters?' of 9 anonymous comparison years':' '+esc(row.unit)}</text>${Array.from({length:slots},(_,index)=>`<rect x="${16+index%columns*16}" y="${top+16+Math.floor(index/columns)*14}" width="10" height="10" fill="${index<row.value?'#62c4bd':'none'}" stroke="#62c4bd"/>`).join('')}`;}).join('');
 return `<svg class="research-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 ${y}" role="img" aria-label="Exact anonymous count tiles. No slot identifies a person, country or year."><rect width="1060" height="${y}" fill="#111a24"/><g fill="#edf4fa" font-family="monospace" font-size="14"><text x="16" y="28">${counters?'Nine comparison years; three-month lead; September target':'One equal tile per counted source item'}</text>${groups}</g></svg>`;
}

function percentageChartSVG(research){
 const plan=percentageInstrumentPlan(research),height=60+plan.items.length*174;
 const arc=(cx,cy,r,angle)=>{const end=[cx+r*Math.sin(angle),cy-r*Math.cos(angle)];return `M ${cx} ${cy-r} A ${r} ${r} 0 ${angle>Math.PI?1:0} 1 ${end.join(' ')}`;};
 const groups=plan.items.map(item=>{const y=110+item.index*174,angle=item.angle,reference=research.conceptId==='422-2'?Math.PI:Math.PI*2;
 const track=reference===Math.PI*2?`<circle cx="90" cy="${y}" r="42" fill="none" stroke="#52616b" stroke-width="8"/>`:`<path d="${arc(90,y,42,reference)}" fill="none" stroke="#52616b" stroke-width="8"/>`;
 const mark=angle>=Math.PI*2?`<circle cx="90" cy="${y}" r="42" fill="none" stroke="${item.color}" stroke-width="8"/>`:`<path d="${arc(90,y,42,angle)}" fill="none" stroke="${item.color}" stroke-width="8"${item.high?' stroke-dasharray="5 3"':''}/>`;
 const ci=item.ci95?`<line x1="220" x2="700" y1="${y+55}" y2="${y+55}" stroke="#52616b"/><line x1="${220+4.8*item.ci95[0]}" x2="${220+4.8*item.ci95[1]}" y1="${y+55}" y2="${y+55}" stroke="${item.color}" stroke-width="4"/><text x="180" y="${y+80}">95% CI ${item.ci95.join('–')} · separate 0–100% ruler</text>`:'';
 return `<g data-source-row="${esc(item.row.id)}">${track}${mark}<text x="180" y="${y-34}">${esc(item.row.name)}</text><text x="180" y="${y-8}">${item.percent}% · ${esc(research.design.scale.unit)}</text><text x="180" y="${y+20}">${esc(item.denominatorLabel||item.row.status)}</text>${ci}</g>`;}).join('');
 return `<svg class="research-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 ${height}" role="img" aria-label="Source percentage arcs on equal 100-percent reference shapes; qualifiers and denominators remain distinct"><rect width="1060" height="${height}" fill="#111a24"/><g fill="#edf4fa" font-family="monospace" font-size="14"><text x="16" y="30">${research.conceptId==='422-2'?'Each semicircle = 100%. High exposure is a subset; do not add.':'Each equal reference ring = 100%. No cross-category sum implied.'}</text>${groups}</g></svg>`;
}

function logComputeChartSVG(research){
 const plan=architectureInstrumentPlan(research),height=110+plan.items.length*70,x=value=>280+240*(Math.log10(value)-25);
 const marks=plan.items.map(({row},index)=>{const y=86+index*70;return `<g data-source-row="${esc(row.id)}"><text x="16" y="${y}">${esc(row.id)}</text><line x1="280" x2="760" y1="${y}" y2="${y}" stroke="#52616b"/><circle cx="${x(row.value)}" cy="${y}" r="5" fill="${row.estimateConfidence==='Confident'?'#62c4bd':'#111a24'}" stroke="#62c4bd" ${row.estimateConfidence==='Speculative'?'stroke-dasharray="2 2"':''}/><text x="280" y="${y+24}">${esc(row.value)} FLOP · ${esc(row.estimateConfidence)} estimate</text><text x="280" y="${y+44}">${esc(row.period)} · publication date, not training date</text></g>`;}).join('');
 return `<svg class="research-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 ${height}" role="img" aria-label="Estimated training FLOP. Logarithmic position, fixed-size markers; confidence labels are categories, not probabilities."><rect width="1060" height="${height}" fill="#111a24"/><g fill="#edf4fa" font-family="monospace" font-size="13"><text x="16" y="24">ESTIMATED TRAINING COMPUTE · logarithmic position</text>${plan.domain.concat(1e26).sort((a,b)=>a-b).map(value=>`<text x="${x(value)-16}" y="50">${value.toExponential(0)}</text>`).join('')}${marks}</g></svg>`;
}

function comparisonChartSVG(research){
 const plan=comparisonInstrumentPlan(research),x=v=>280+480*v/plan.domain[1];let y=80;
 const wrap=value=>{const result=[''];for(const word of String(value).split(/\s+/)){const i=result.length-1;if(result[i].length+word.length>87)result.push(word);else result[i]+=(result[i]?' ':'')+word;}return result;};
 const panels=plan.panels.map(panel=>{let svg=`<text x="16" y="${y}">${esc(panel.key)}</text>`;y+=30;
  for(const item of panel.items){const row=item.row,cy=y;let mark='';
   if(item.interval)mark+=`<line x1="${x(item.interval[0])}" x2="${x(item.interval[1])}" y1="${cy}" y2="${cy}" stroke="${item.color}" stroke-width="3"/>`;
   if(['bar','stem','open-lower-bar'].includes(item.kind)){const start=item.stackStart||0;mark+=`<rect x="${x(start)}" y="${cy-4}" width="${480*row.value/plan.domain[1]}" height="8" fill="${item.color}"/>`;if(item.kind==='open-lower-bar')mark+=`<circle cx="${x(row.value)}" cy="${cy}" r="5" fill="#111a24" stroke="${item.color}"/><path d="M ${x(row.value)+9} ${cy-5} l 7 5 l -7 5" fill="none" stroke="${item.color}"/>`;}
   else mark+=`<circle cx="${x(row.value)}" cy="${cy}" r="5" fill="${item.kind==='reported-total'?'#111a24':item.color}" stroke="${item.color}"/>`;
   const details=[`${row.name} · ${item.label}: ${nativeValue(row)} ${row.unit}`,row.period,item.supportingText,item.interval?`95% CI ${row.ciLower}–${row.ciUpper}. Human benchmark spatially weighted; 2022 benchmark versus provider operating period.`:null].filter(Boolean).flatMap(wrap);
   svg+=`<g data-source-row="${esc(row.id)}"><line x1="280" x2="760" y1="${cy}" y2="${cy}" stroke="#52616b"/>${mark}<text x="16" y="${cy+24}">${details.map((line,i)=>`<tspan x="16" dy="${i?18:0}">${esc(line)}</tspan>`).join('')}</text></g>`;y+=48+details.length*18;
  }y+=14;return svg;}).join('');
 return `<svg class="research-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 ${y+20}" role="img" aria-label="Grouped native source comparisons. Exact periods, qualifiers and uncertainty preserved."><rect width="1060" height="${y+20}" fill="#111a24"/><g fill="#edf4fa" font-family="monospace" font-size="14"><text x="16" y="24">${esc(plan.warning||research.design.scale.unit)}</text><text x="280" y="50">0</text><text x="740" y="50">${plan.domain[1]}</text>${panels}</g></svg>`;
}

export function researchChartSVG(research) {
  if(COMPARISON_CONCEPTS.includes(research.conceptId))return comparisonChartSVG(research);
  if(research.conceptId==='117')return logComputeChartSVG(research);
  if(PERCENTAGE_CONCEPTS.includes(research.conceptId))return percentageChartSVG(research);
  if(['categorical','none'].includes(research.design.scale.type))return facetChartSVG(research);
  if(['333','63-8','364'].includes(research.conceptId))return countChartSVG(research);
  const maximum=research.design.scale.domain[1], unit=research.design.scale.unit;
  const grouped=research.conceptId==='388', accounts=['369','385'].includes(research.conceptId), breakAt=research.conceptId==='385'?1:2;
  const rowHeight=['211-4','398','115-2'].includes(research.conceptId)?74:48, top=grouped||accounts?98:70, width=1060, extra=(research.conceptId==='193-5'?95:0)+(grouped||accounts?52:0), height=top+rowHeight*research.rows.length+extra+32;
  const x=value=>280+480*value/maximum;
  const label=row=>`${nativeValue(row)} ${row.unit}${row.metric?` · ${row.metric}`:''}${row.growthStage?` · ${row.growthStage}; field ${row.field}; ${row.period}`:''}${row.timeBasis?` · ${row.statistic}; ${row.timeBasis}`:''}${row.measureType?` · ${row.period}`:''}${Number.isFinite(row.standardError)?` · ±${row.standardError} robust SE; N ${row.regressionN}`:''}`;
  const marks=research.rows.map((row,index)=>{
    const y=top+index*rowHeight+((grouped&&index>=2)||(accounts&&index>=breakAt)?52:0);
    const isRange=row.value===null&&Number.isFinite(row.lower)&&Number.isFinite(row.upper);
    let mark;
    if(Number.isFinite(row.ciLower)&&Number.isFinite(row.ciUpper))mark=`<line x1="${x(row.ciLower)}" x2="${x(row.ciUpper)}" y1="${y+7}" y2="${y+7}" stroke="#62c4bd" stroke-width="3"/><circle cx="${x(row.value)}" cy="${y+7}" r="5" fill="#edf4fa"/>`;
    else if(isRange)mark=`<rect x="${x(row.lower)}" y="${y}" width="${x(row.upper)-x(row.lower)}" height="14" fill="#62c4bd"/>`;
    else if(row.value===null)mark=`<text x="280" y="${y+12}">No observation</text>`;
    else if(Number.isFinite(row.standardError))mark=`<line x1="${x(row.value-row.standardError)}" x2="${x(row.value+row.standardError)}" y1="${y+7}" y2="${y+7}" stroke="#62c4bd" stroke-width="3"/><circle cx="${x(row.value)}" cy="${y+7}" r="5" fill="#edf4fa"/>`;
    else if(['409','398'].includes(research.conceptId))mark=`<circle cx="${x(row.value)}" cy="${y+7}" r="5" fill="#88bdf4"/>`;
    else if(research.conceptId==='385'&&index===0)mark=`<rect x="280" y="${y}" width="${480*row.value/maximum}" height="14" fill="none" stroke="#f2ba68" stroke-dasharray="5 3"/>`;
    else if(row.qualifier==='<')mark=`<line x1="280" x2="${x(row.value)}" y1="${y+7}" y2="${y+7}" stroke="#62c4bd" stroke-dasharray="4 3"/><circle cx="${x(row.value)}" cy="${y+7}" r="5" stroke="#62c4bd" fill="#111a24"/>`;
    else mark=`<rect x="280" y="${y}" width="${480*row.value/maximum}" height="14" fill="${research.conceptId==='430'?'#f2ba68':'#62c4bd'}"/>`;
    return `<text x="16" y="${y+12}">${esc(row.id)}</text><line x1="280" x2="760" y1="${y+7}" y2="${y+7}" stroke="#52616b"/>${mark}<text x="280" y="${y+34}">${esc(label(row))}</text>${Number.isFinite(row.standardDeviation)?`<text x="280" y="${y+54}">Descriptive SD: ${row.standardDeviation} · not a confidence interval</text>`:Number.isFinite(row.ciLower)?`<text x="280" y="${y+54}">95% CI: ${row.ciLower}–${row.ciUpper} · ${esc(row.period)}</text>`:Number.isFinite(row.publishedParentheticalUncertainty)?`<text x="280" y="${y+54}">Published parenthetical uncertainty: ${row.publishedParentheticalUncertainty} · confidence level unspecified</text>`:''}`;
  }).join('');
  const groups=grouped?`<text x="16" y="76">NOT PUBLICLY TRACKED · percent of each activity category · published ranges</text><text x="16" y="${top+2*rowHeight+20}">ALL DETECTED ACTIVITY · continental shares · rounded total 99%; not normalized</text>`:accounts?`<text x="16" y="76">${research.conceptId==='385'?'MULTI-YEAR ANNOUNCED INTENTION · not money spent':'CORPORATE REVENUE · fiscal periods shown per row'}</text><text x="16" y="${top+breakAt*rowHeight+20}">ANNUAL NATIONAL GDP · distinct account and period; no economic equivalence</text>`:'';
  const inset=research.conceptId==='193-5'?`<text x="16" y="${height-84}">Africa · magnified inset · 0–5 kWh/person/year</text><line x1="280" x2="760" y1="${height-58}" y2="${height-58}" stroke="#52616b"/><line x1="280" x2="376" y1="${height-58}" y2="${height-58}" stroke="#62c4bd" stroke-dasharray="4 3"/><circle cx="376" cy="${height-58}" r="5" fill="#111a24" stroke="#62c4bd"/><text x="280" y="${height-28}">&lt;1 · same upper bound, different displayed scale</text>`:'';
  return `<svg class="research-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="research-chart-title"><title id="research-chart-title">${esc(research.design.title)}, ${esc(observationLabel(research))}, fixed scale zero to ${maximum} ${esc(unit)}. The table provides every value, qualifier and source.</title><rect width="${width}" height="${height}" fill="#111a24"/><g fill="#edf4fa" font-family="monospace" font-size="12"><text x="16" y="22">OBSERVATION</text><text x="280" y="22">0</text><text x="740" y="22">${maximum}</text><text x="280" y="44">${esc(unit)}</text>${groups}${marks}${inset}</g></svg>`;
}

export function resolveResearchShare(search, research) {
    const params = new URLSearchParams(search);
  const version = params.get('v'), selected = params.get('row');
  if (version && version !== research.revision) return {index:-1, notice:'The shared revision is unavailable in this build. The displayed values are the accepted revision shown below; they may differ from the shared evidence.'};
  const index = selected ? research.rows.findIndex(row => row.id === selected) : -1;
  return {index, notice:selected && index < 0 ? 'The shared region is unavailable. All regions in this accepted revision remain below.' : ''};
}

export function researchSceneValuesHTML(research) {
  if (['430','408'].includes(research.conceptId) || research.rows.length>12) return '';
  const grouped=research.conceptId==='388';
  return `<div class="research-scene-values" aria-label="Readable instrument values"><h3>Read the instrument</h3><ul>${research.rows.map((row,index)=>`${grouped&&(index===0||index===2)?`<li class="instrument-group">${index===0?'Not publicly tracked · ranges within each activity category':'All detected activity · continental shares; rounded total 99%'}</li>`:''}<li><span>${esc(row.name)}</span><strong>${esc(nativeValue(row))} ${esc(row.unit)}</strong>${semanticDetailsHTML(row)}${row.qualifier?`<span>Qualifier: ${esc(row.qualifier)}</span>`:''}${Number.isFinite(row.standardError)?`<span>±${row.standardError} robust SE · N ${row.regressionN}</span>`:''}</li>`).join('')}</ul></div>`;
}

export function researchPresentation(research) {
  const railCopy={
    '428':['ENERGY THROUGH PASSAGES','Seven fixed-scale gates retain source throughput and period.','Six observations cover the first half of 2025; Panama is a separate fiscal-2025 estimate. These are energy flows, not AI cargo.'],
    '407':['A SURVEYED ATTITUDE','Turn through 32 sampled markets and inspect each sample scope and age range.','Agreement that AI makes respondents nervous is an attitude, not objective harm or a census of residents.'],
    '284':['APPLICANTS ON THE SPINE','Compare ten source-ranked GenAI patent applicants using simple patent-family counts from 2014–2023.','Applicant counts do not identify beneficial ownership, patent quality, deployed products or present market leadership.'],
    '202':['MILES OF EXPOSURE','Five spools retain cumulative rider-only miles through June 2026.','These operating exposures describe one provider. They are not vehicle counts, crash rates or safety outcomes.'],
    '117':['ORDERS OF COMPUTATION','Equal markers sit on a labelled logarithmic scale from 10²⁵ to 10²⁷ estimated training FLOP.','Confidence categories are not probabilities. Publication dates are not training dates; organisation countries do not locate the computation.'],
    '255':['A DIFFERENT WATER SOURCE','Compare three selected provider examples on equal percentage rings.','Recycled, reused and non-potable sources are combined. Water volume and the averaging period are unspecified; no avoided household withdrawal is inferred.'],
    '233-2':['BENCHMARK COVERAGE','Turn between two source-defined precipitation targets and their benchmark comparison.','Percent of evaluated grid cells with skill gains is not the probability of a correct forecast. PBC-ECMWF is compared with operationally debiased ECMWF in 2016/2024 tests: Brier skill for extremes (excluding arid zero-precipitation cells) and ranked probability skill for precipitation quintiles. This is not today’s weather.'],
    '422-2':['OCCUPATIONS, NOT JOB LOSSES','Compare any-exposure categories, then turn to the high-exposure subsets. Each semicircle uses the same 100% reference.','The denominator is classified occupations, not workers. High-exposure occupations are already included in any exposure and must not be added again.'],
    '138-8':['OVERLAPPING ACCOUNT ACTIVITIES','Two independent rings use the source-published 67.3% and 6.5%; the underlying counts remain 560 and 54 out of 832.','These are selected banned accounts classified by one vendor. Activities overlap; accounts are not confirmed intrusions.'],
    '8-6':['THE EXAM THAT HAPPENED','Compare examination completion in two trial arms, with published 95% confidence intervals and separate analysed and randomized denominators.','AI examination was offered on site at enrollment; referral completion was assessed within six months. Completion is not improved vision. Three unreachable controls counted incomplete.'],
    '333':['A RECORDED VOTE','Count 117 votes in favour, two against and two abstentions as equal tiles.','This is one recorded vote, not public opinion, treaty membership or a causal measure of AI governance.'],
    '63-8':['VERSIONS, NOT REACH','Equal tiles retain the 42 available translation versions and their translation-preparation methods.','Translation versions do not measure languages covered, readership, availability to every resident or quality.'],
    '364':['NINE TARGET YEARS','Compare nine-slot counters of years with higher September forecast accuracy than each comparator at a three-month lead.','Six validation years and three test years form each nine-year comparison. Anonymous slots do not identify particular years or show an absolute success rate or trend.'],
    '320':['THE TIME DENOMINATOR','Switch between paid hours only and paid plus unpaid work, retaining distinct mean and median estimates.','Surveyed Latin American and Caribbean web-platform workers; not an AI-only wage sample. The switch changes accounting, not the historical date.'],
    '372':['TWO REPORTING CHANNELS','Compare counts from proactive investigation and public reporting within the same dated window.','Counts of video clips are not prevalence, harm rates or detection accuracy.'],
    '276':['THE PRICE OF CONNECTION','Compare two global median broadband price baskets on the same 0–3% of GNI per capita scale.','These country medians do not measure household disposable income, AI subscription prices or local affordability.'],
    '409':['CONSISTENCY ACROSS LANGUAGES','Six model markers retain the archived study’s source-defined 0–100 concurrence score.','Consistency is not territorial truth, political legitimacy or current model performance.'],
    '369':['UNLIKE ACCOUNTS, LABELLED','Turn between corporate revenue and national GDP, with their fiscal and calendar periods retained.','Revenue is company sales; GDP is national value added. Equal USD magnitudes do not make them equivalent.'],
    '324':['CONTRACTS ARE NOT DELIVERED LOAD','Five capacity facets preserve restart, existing supply and uprate categories.','The 190 MW uprate is included in the 690 MW contract. Do not add it again or treat these announcements as current delivered power.'],
    '385':['AN INTENTION AND ANNUAL FLOWS','An outlined multi-year investment intention faces separately labelled annual GDP references.','Announced intention is not spending. The periods are incompatible; no annualisation or economic equivalence is inferred.'],
    '232':['PARTICIPANT ENTRIES','Six category meridians retain the published shares; the reverse magnifier uses a separate 0–10% scale.','Recorded participant entries are not unique people, world population shares or a map of ancestry.']
  };
  if(railCopy[research.conceptId]){const [eyebrow,invitation,boundary]=railCopy[research.conceptId];return {eyebrow,explanation:esc(research.design.legend),invitation,boundary,geography:'Source observations — abstract instrument, not a geographic map',label:'observation',plural:'observations',accent:'#62c4bd'};}
  const instruments={
    '388':{eyebrow:'RANGES WITHOUT MIDPOINTS',explanation:'Two floating bands show published ranges of activity not publicly tracked. There is no supplied point estimate.',invitation:'Turn the instrument to compare six continental shares of all detected vessel activity. Those rounded shares total 99%; they use a different denominator.',boundary:'Not publicly tracked does not mean illegal. Sampled coastal coverage, acquisition density and detection limits matter.',label:'finding',plural:'findings',accent:'#62c4bd'},
    '330':{eyebrow:'ONE TEACHER-SUPPORTED TRIAL',explanation:'Two gauges show intention-to-treat coefficients on the same 0–0.4 standard-deviation scale. Whiskers retain ±1 robust standard error.',invitation:'Compare the English and composite outcomes from the same intervention. Inspect the regression sample and study limits.',boundary:'Regression N 654. ±1 robust SE is not a 95% confidence interval. This is a bundled intervention in selected Edo State schools, not a national or AI-alone effect.',label:'outcome',plural:'outcomes',accent:'#88bdf4'},
    '406':{eyebrow:'OPERATING TIME, WITH QUALIFIERS',explanation:'Four equal rings show provider-reported bounds on evaporative-cooling operating time. Open endpoints mean less than; approximate and up-to labels remain visible.',invitation:'Compare the exact source phrases across the four selected climate examples.',boundary:'Percent of an operating year is not water volume, water saved, comparative efficiency or a map of all facilities.',label:'example',plural:'examples',accent:'#78d6e4'},
    '193-5':{eyebrow:'A BOUND, NOT A RATIO',explanation:'Separate zero-based rails compare approximately 540 with less than 1 kWh per resident per year, on a common 0–600 scale.',invitation:'Turn the instrument to inspect Africa’s bound in the explicitly magnified 0–5 inset.',boundary:'All data centres, not AI alone. The United States is a country and Africa is a continent. The upper bound cannot support an exact ratio.',label:'aggregate',plural:'aggregates',accent:'#88bdf4'}
  };
  if(instruments[research.conceptId])return {...instruments[research.conceptId],geography:'Source observations — abstract instrument, not a geographic map'};
  if (research.conceptId === '5-6') return {eyebrow:'THE UNMAPPED REMAINDER',explanation:'Two equal 100% reference rings show published coverage in the 2025 and 2026 releases. The filled arc retains each source percentage.',invitation:'Compare the two releases, then turn the rings to inspect the unfilled remainder. The latest release begins in front.',boundary:'Mapping to modern standards does not measure accuracy, newly discovered seabed, or AI’s contribution.',geography:'Global statistics — not a geographic map',label:'release',plural:'releases',accent:'#78d6e4'};
  if (research.conceptId === '63') return {eyebrow:'TWO GLOBAL GROUPS',explanation:'Equal reference rings compare global Internet use among urban and rural residents. The filled angle shows percentage using the Internet.',invitation:'Flip the comparison to foreground the other group. Both rings retain the same 100% denominator scale.',boundary:'The unfilled remainder means not using Internet. These global categories do not locate villages or measure AI adoption.',geography:'Global categories — not a geographic map',label:'group',plural:'groups',accent:'#b9a2ee'};
  if (research.conceptId === '408') return {
    eyebrow: 'BASIC ELECTRICITY ACCESS',
    explanation: 'Country fill lightness shows the share of population with basic electricity access. A selected economy has a fixed-size 100% dial.',
    invitation: 'Find an economy with lower access, then compare another country on the same scale.',
    boundary: 'Access does not measure reliability, affordability, device ownership or AI use.',
    geography: 'Country/economy polygons — unsupported geography remains table-only',
    label: 'economy', plural: 'economies', accent: '#62c4bd'
  };
  if(['categorical','none'].includes(research.design.scale.type))return {eyebrow:'READ THE SOURCE RECORDS',explanation:esc(research.design.legend),invitation:esc(research.design.backsideDiscovery),boundary:esc(research.dataset.denominator),geography:'Categorical evidence — abstract positions, no mapped locations',label:'record',plural:'records',accent:'#62c4bd'};
  if(research.conceptId!=='430')return {eyebrow:'SOURCE MEASUREMENTS',explanation:esc(research.design.legend),invitation:esc(research.design.backsideDiscovery),boundary:esc(research.dataset.denominator),geography:'Source observations — see each record’s location and scope',label:'observation',plural:'observations',accent:'#62c4bd'};
  return {eyebrow:'ONE KILOWATT-HOUR', explanation:'Each amber column shows an annual grid emission factor. Its length starts at zero on the same fixed scale.', invitation:'Compare another region’s grid factor and its separate CFE matching figure.', boundary:'Annual grid averages are not hourly signals, AI-prompt footprints or offsets.', geography:'Abstract data globe — not a geographic map', label:'region', plural:'regions', accent:'#f2ba68'};
}

export function nextLowerAccessIndex(research, selectedIndex) {
  const ranked=research.rows.map((row,index)=>({row,index})).filter(({row})=>row.value!==null && row.value<100).sort((a,b)=>a.row.value-b.row.value || a.row.id.localeCompare(b.row.id));
  if (!ranked.length) return -1;
  const position=ranked.findIndex(({index})=>index===selectedIndex);
  return ranked[(position+1)%ranked.length].index;
}

export function accessLegendGradient() { const points=[0,25,50,(50-12)/0.62,75,100];return `linear-gradient(90deg, ${points.map(value=>`${accessColor(value)} ${value}%`).join(', ')})`; }

export function observationLabel(research) {const time=research.dataset.time;return time.observationEnd && time.observationEnd!==time.observationStart ? `${time.observationStart}–${time.observationEnd}` : time.observationStart;}
