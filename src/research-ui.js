import { escapeHTML as esc } from './math.js';

export function nativeValue(row) {
  return row.value === null ? 'No observation' : `${row.qualifier || ''}${row.value}`;
}

export function researchSelectionHTML(row) {
  if (!row) return '<p>Choose a region to read its annual grid factor and separate carbon-free energy matching figure.</p>';
  return `<span class="eyebrow">SELECTED REGION</span><h2>${esc(row.name)}</h2><p class="research-row-id">${esc(row.id)}</p><p class="native-value">${esc(nativeValue(row))} <small>${esc(row.unit)}</small></p><p>${esc(row.period)} · ${esc(row.status)}${row.qualifier ? ` · ${esc(row.qualifier)}` : ''}</p><p class="cfe-badge">CFE matching <strong>${esc(row.cfePercent)}%</strong></p><p class="tiny">CFE includes attributed procurement. It is a separate measure, not the inverse of grid carbon.</p><p class="tiny">${esc(row.notes)}</p>`;
}

export function researchTableHTML(research) {
  const sources = new Map(research.dataset.sources.map(source => [source.sourceId, source]));
  return `<div class="data-table-wrap research-table" tabindex="0" role="region" aria-label="All region observations; scroll horizontally for provenance"><table class="data-table"><caption>All ${research.rows.length} source regions · ${esc(research.design.scale.unit)} · ${esc(research.dataset.time.observationStart)}. CFE matching is a separate percentage.</caption><thead><tr><th scope="col">Region / ID</th><th scope="col">Grid factor<br>g CO2eq/kWh</th><th scope="col">CFE matching %</th><th scope="col">Period / status / qualifier</th><th scope="col">Source / locator</th><th scope="col">Notes / geography ID</th><th scope="col">Inspect</th></tr></thead><tbody>${research.rows.map((row,index)=>`<tr data-research-row="${esc(row.id)}"><th scope="row">${esc(row.name)}<span class="table-note">${esc(row.id)}</span></th><td>${esc(nativeValue(row))}</td><td>${esc(row.cfePercent)}</td><td>${esc(row.period)}<br>${esc(row.status)}<br>${esc(row.qualifier || 'No qualifier')}</td><td><a href="${esc(sources.get(row.sourceId).url)}" target="_blank" rel="noopener noreferrer">${esc(sources.get(row.sourceId).publisher)} ↗</a><span class="table-note">${esc(row.sourceId)} · ${esc(row.sourceLocator)}</span></td><td>${esc(row.notes)}<span class="table-note">${esc(row.geographicId)} · No observed coordinates</span></td><td><button data-research-select="${index}" aria-label="Select ${esc(row.name)}, ${esc(row.id)}">SELECT</button></td></tr>`).join('')}</tbody></table></div>`;
}

export function researchSourcesHTML(research) {
  const {dataset, design, revision} = research;
  return `<h3>What the evidence supports</h3><p>${esc(design.legend)}</p><p><strong>Denominator:</strong> ${esc(dataset.denominator)}</p><h4>Limits of this comparison</h4><ul>${design.limitations.map(text=>`<li>${esc(text)}</li>`).join('')}</ul><h4>Source and reuse</h4><ol class="sources">${dataset.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a><p>${esc(source.locator)}</p><p>${esc(source.reuse.attribution)} · <a href="${esc(source.reuse.termsUrl)}" target="_blank" rel="noopener noreferrer">${esc(source.reuse.basis)}</a></p></li>`).join('')}</ol><p class="tiny">Observation: ${esc(dataset.time.observationStart)} · Source publication: ${esc(dataset.time.publishedAt || 'Not supplied')} · Source retrieved: ${esc(dataset.time.retrievedAt)}. Frozen reviewed snapshot; no automatic source check or update service is active.</p><details class="revision-details"><summary>Reproduce this view</summary><p>Original frozen dataset file SHA-256 (not the combined download): <code>${esc(research.datasetSha256)}</code></p><p>Design SHA-256: <code>${esc(research.designSha256)}</code></p><p>Accepted research revision: <code>${esc(revision)}</code></p></details>`;
}

export function researchChartSVG(research) {
  const rowHeight=24, top=48, width=940, height=top + rowHeight*research.rows.length + 32;
  return `<svg class="research-chart" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="research-chart-title"><title id="research-chart-title">Annual 2025 grid emission factors, fixed scale zero to 700 g CO2eq/kWh. The table provides every value and source.</title><rect width="${width}" height="${height}" fill="#111a24"/><g fill="#edf4fa" font-family="monospace" font-size="12"><text x="16" y="22">REGION ID</text><text x="280" y="22">0</text><text x="740" y="22">700 g CO2eq/kWh</text>${research.rows.map((row,index)=>{const y=top+index*rowHeight; return `<text x="16" y="${y+12}">${esc(row.id)}</text>${row.value===null?`<text x="280" y="${y+12}">No observation</text>`:`<rect x="280" y="${y}" width="${480*row.value/700}" height="14" fill="#f2ba68"/><text x="${290+480*row.value/700}" y="${y+12}">${esc(nativeValue(row))}</text>`}`;}).join('')}</g></svg>`;
}

export function resolveResearchShare(search, research) {
    const params = new URLSearchParams(search);
  const version = params.get('v'), selected = params.get('row');
  if (version && version !== research.revision) return {index:-1, notice:'The shared revision is unavailable in this build. The displayed values are the frozen accepted revision shown below; they may differ from the shared evidence.'};
  const index = selected ? research.rows.findIndex(row => row.id === selected) : -1;
  return {index, notice:selected && index < 0 ? 'The shared region is unavailable. All regions in this accepted revision remain below.' : ''};
}
