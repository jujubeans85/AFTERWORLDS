import { escapeHTML as esc, formatValue } from './math.js';
import { scoreFor, outlookFor } from './scoring.js';

const number = n => new Intl.NumberFormat('en', {maximumFractionDigits:1}).format(n);
const stamp = o => o?.label || String(o?.year || 'Not established');
export function scoreExplanation(d) {
  return `Score = round(100 × value ÷ ${formatValue(d.visual.ceiling)} ${d.visual.unit}), bounded to 1–100 for positive values. True zero = 0; missing = no score. The fixed ceiling is an editorial display scale, not a scientific threshold. ${d.visual.scoreMeaning}`;
}
export function visualLegend(d) {
  if(!d) return '<strong>CONCEPT SCULPTURE</strong> · Illustrative movement. No dataset, measured score or prediction.';
  return `<strong>${esc(d.visual.name.toUpperCase())}</strong> · ${esc(d.visual.encoding)} <span class="legend-scope">${d.geographyMode==='geographic'?'Country/region anchors, not facility sites.':'Abstract categories; positions are not geographic.'}</span>`;
}
function statCard(label, date, value, unit, status, cls='') {
  return `<article class="time-card ${cls}"><div class="time-label">${esc(label)}</div><div class="time-date">${esc(date)}</div><div class="time-value">${esc(value)}</div><div class="time-unit">${esc(unit)}</div><div class="time-status">${esc(status)}</div></article>`;
}
export function informationHTML(e) {
  const d=e.dataset;
  if(!d) return `<div class="brief-heading"><span class="eyebrow">WORLD ${esc(e.number)} / RESEARCH CONCEPT</span><h3>${esc(e.newTitle)}</h3></div><div class="brief-summary"><p>${esc(e.question)}</p><p>${esc(e.connection)}</p><p>This sculpture is an artistic hypothesis. Its movement does not encode measured data, and there is no numerical past, present or forecast to report yet.</p></div><div class="time-grid">${statCard('PAST','Research needed','—','','No verified baseline')}${statCard('PRESENT','Research concept','—','','No measured score')}${statCard('FUTURE','Not forecast','—','','A question, not a prediction','future')}</div><button class="outline-button" data-full-evidence>IDEA & INSPIRATION ↗</button>`;
  const t=outlookFor(d),latest=t?.latest;
  const future=t?.projected!==null&&t?.projected!==undefined;
  const temporalLabel=t?.label||d.headline.label;
  const past=t?.past?statCard('PAST',stamp(t.past),number(t.past.value),t.unit,t.past.status||'Published estimate'):statCard('PAST','Not established','—','','No comparable baseline');
  const present=statCard('PRESENT · LATEST AVAILABLE',latest?stamp(latest):d.dataYear,number(latest?.value??d.headline.value),t?.unit||d.headline.unit,latest?.status||d.status);
  const projection=future?statCard('FUTURE · EXTRAPOLATION',t.projection.label||String(t.projection.targetYear),'≈ '+number(t.projected),t.unit,'Linear scenario · not an observation','future'):statCard('FUTURE','Not extrapolated','—','','Insufficient comparable trend','future');
  const paragraphs=[...d.brief.paragraphs, t?.assumption||d.brief.futureNote];
  const top=[...d.points].sort((a,b)=>b.value-a.value)[0];
  return `<div class="brief-heading"><span class="eyebrow">WORLD ${esc(e.number)} / THE SHORT VERSION</span><h3>${esc(e.newTitle)}</h3></div><div class="brief-summary">${paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</div><div class="timeline-heading"><span class="eyebrow">PAST / PRESENT / POSSIBLE FUTURE</span><p>${esc(temporalLabel)}</p></div><div class="time-grid">${past}${present}${projection}</div>${!t?.past?`<p class="tiny">${esc(d.brief.pastNote)}</p>`:''}${d.forecast?`<div class="publisher-outlook"><span class="eyebrow">SEPARATE PUBLISHER FORECAST</span><strong>${formatValue(d.forecast.value)} ${esc(d.forecast.unit)} · ${esc(d.forecast.year)}</strong><span>${esc(d.forecast.label)}. This model-based outlook is distinct from the simple extrapolation above.</span></div>`:''}<details class="score-method"><summary>HOW THE ANIMATION READS THE DATA <span>1–100 ↗</span></summary><p>${esc(d.visual.encoding)}</p><div class="score-sample"><span>${esc(top.name)}</span><strong>${scoreFor(d,top)}<small>/100</small></strong></div><div class="score-rail" aria-hidden="true"><i style="width:${scoreFor(d,top)}%"></i></div><p class="tiny">${esc(scoreExplanation(d))}</p><p class="tiny">Animation speed repeats magnitude; it is not a measured change rate. Multiple effects encode the same score. Raw values remain authoritative, including bounds and rounding. Score 100 can include values above the display ceiling. Symbols do not imply a mapped footprint.</p></details><div class="brief-sources"><span class="eyebrow">SOURCES</span>${d.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')}</div><div class="dialog-actions"><button class="outline-button" data-full-evidence>FULL EVIDENCE & DATA ↗</button><button class="outline-button" data-back-globe>BACK TO THE GLOBE</button></div>`;
}
