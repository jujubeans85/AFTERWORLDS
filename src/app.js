import {sourceDatasets,researchSourceList} from './research-records.js';
import {VoicePriority, RecordedNarrator, loadNarration} from './narration.js';
import {AcceptedUpdateMonitor,loadAcceptedHistory} from './accepted-updates.js';
import { scoreFor } from "./scoring.js";
import { informationHTML, visualLegend, scoreExplanation } from "./information.js";
import { createAtlasReader } from "./reader.js";
import { SensoryDirector } from "./soundscape.js";
import { shareWorld } from "./sharing.js";
import { loadResearchWorld } from './research-data.js';
import { nativeValue, researchScaleHTML, researchSceneValuesHTML, researchSelectionHTML, researchTableHTML, researchSourcesHTML, researchChartSVG, resolveResearchShare, researchPresentation, nextLowerAccessIndex, accessLegendGradient, observationLabel } from './research-ui.js';
import {
  decodeTopology,
  escapeHTML as esc,
  formatValue,
  clamp,
} from "./math.js";
const $ = (s) => document.querySelector(s);
const sensory = new SensoryDirector(window, syncSensoryControls);
const voicePriority=new VoicePriority(active=>sensory.setNarrating(active));
const narrator=new RecordedNarrator({priority:voicePriority,env:window,onStatus:message=>{const status=$('#narration-status');if(status)status.textContent=message;}});
const reader = createAtlasReader(document, window, active => {if(active)voicePriority.claim('reader',()=>reader.dismiss());else voicePriority.release('reader');});
document.addEventListener('change',event=>{if(event.target.matches('[data-auto-read]')&&!event.target.checked)narrator.stop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)narrator.stop();});
window.addEventListener('pagehide',()=>voicePriority.clear());
let registry,
  countries,
  globe,
  renderToken = 0,
  current = null,
  activeDialogTrigger = null,
  dialogGeneration=0,
  toastTimer,
  researchAbort,
  stopResearchUpdates,
  researchWorld,
  selectedResearchIndex = -1;
const state = { mode: "evidence", query: "", shown: 24 };
const value = (p) => p.displayValue ?? formatValue(p.value);
const headline = (n) =>
  n >= 1000000
    ? new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(n)
    : formatValue(n);
const iconArrow = "↗";
function trackLink(path, label, cls = "") {
  return `<a class="${cls}" href="${path}" data-route>${label}</a>`;
}
function header() {
  return `<header class="site-header"><a href="/" data-route class="wordmark" aria-label="AFTERWORLD home"><span class="mark" aria-hidden="true"></span>AFTERWORLD</a><span class="header-meta">AN ATLAS OF THE MACHINE AGE</span><nav class="header-nav" aria-label="Main navigation"><a href="/#index" data-route>INDEX <span aria-hidden="true">↗</span></a><button data-about>ABOUT</button><button data-sensory-open aria-haspopup="dialog" aria-label="Sound and touch settings">SOUND</button></nav></header>`;
}
function footer() {
  return `<footer class="site-footer"><span>AFTERWORLD / LIVING SCULPTURES EDITION<br>Source dates on each world · Not a live feed</span><span>Inspired by <a href="https://world-processor.com/" target="_blank" rel="noopener noreferrer">Ingo Günther’s World Processor ↗</a><br>Independent project · ${registry.entries.length} gallery-entry interpretations</span></footer>`;
}
function dialogShell() {
  return `<dialog id="modal" aria-labelledby="dialog-title"><div class="dialog-head"><h2 id="dialog-title">THE EVIDENCE</h2><button aria-label="Close dialog" data-close>×</button></div><div class="dialog-content" id="dialog-body"></div></dialog><div id="toast" class="toast" role="status" hidden></div>`;
}
function card(entry) {
  const d = entry.dataset;
  if (entry.research) return `<a href="/globe/${esc(entry.slug)}/" data-route class="world-card" style="--card-color:#f2ba68" aria-label="Explore ${esc(entry.newTitle)}, sourced research view"><div class="card-top"><span>${esc(entry.number)}</span><span>${esc(entry.lensLabel)}</span></div><div class="card-img"><img src="/assets/thumbs/${esc(entry.slug)}.svg" width="300" height="250" alt="" loading="lazy"></div><h3 class="card-title">${esc(entry.newTitle)}</h3><div class="card-bottom"><span class="card-type">${esc([entry.research.observationPeriod.observationStart,entry.research.observationPeriod.observationEnd].filter((value,index,list)=>value&&(index===0||value!==list[0])).join("–"))} · NATIVE UNITS</span><span class="arrow">↗</span></div></a>`;
  return `<a href="/globe/${esc(entry.slug)}/" data-route class="world-card" style="--card-color:${entry.color}" aria-label="Explore ${esc(entry.newTitle)}, ${d ? "sourced story" : "research concept"}"><div class="card-top"><span>${esc(entry.number)}</span><span>${esc(entry.lensLabel)}</span></div><div class="card-img"><img src="/assets/thumbs/${esc(entry.slug)}.svg" width="300" height="250" alt="" loading="lazy" decoding="async"></div><h3 class="card-title">${esc(entry.newTitle)}</h3><div class="card-bottom"><span class="card-type">${d ? `${esc(d.status.toUpperCase())} · ${esc(d.dataYear)}` : "RESEARCH CONCEPT"}</span><span class="arrow" aria-hidden="true">↗</span></div></a>`;
}
function renderCards() {
  const pool = registry.entries.filter(
    (e) => state.mode === "all" || e.dataset || e.research,
  );
  const q = state.query.toLowerCase().trim();
  const filtered = pool.filter((e) =>
    `${e.newTitle} ${e.title} ${e.lens} ${e.id} ${e.question}`
      .toLowerCase()
      .includes(q),
  );
  $("#world-grid").innerHTML = filtered.length
    ? filtered.slice(0, state.shown).map(card).join("")
    : '<div class="no-results">No worlds match that search. Try “water”, “language” or a World Processor number.</div>';
  $("#result-status").textContent =
    `${Math.min(state.shown, filtered.length)} / ${filtered.length} worlds`;
  $("#load-more").hidden = state.shown >= filtered.length;
  $("#catalogue-note").textContent =
    state.mode === "all"
      ? `${registry.entries.length} individually indexed interpretations. ${registry.evidenceCount} have sourced numerical layers; the rest are clearly labelled research concepts.`
      : `${registry.evidenceCount} sourced stories. Dates, scope and uncertainty travel with every number.`;
  document
    .querySelectorAll("[data-mode]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", b.dataset.mode === state.mode),
    );
  reader.enhance();
}
function home() {
  const featured =
    registry.entries.find((e) => e.dataset?.id === "adoption") ||
    registry.entries.find((e) => e.dataset);
  document.title = "AFTERWORLD — An atlas of the machine age";
  $("#app").innerHTML =
    `${header()}<main id="main"><section class="hero" aria-labelledby="home-title"><div class="hero-copy"><div class="eyebrow"><span class="edition-dot"></span>01 / THE MACHINE AGE</div><h1 id="home-title">A stranger<br>world is<br><em>already here.</em></h1><p>AI is redrawing the planet.<br>Follow the power, the money, the missing voices. There is always another side.</p><a class="text-link" href="#index">EXPLORE THE WORLDS <span aria-hidden="true">↓</span></a></div><div class="hero-globe-wrap"><div id="globe-host" class="hero-globe"><span class="globe-loading">ASSEMBLING A WORLD</span></div><div class="hero-orbit-label"><small>WORLD ${featured.number} / ${featured.dataset.dataYear}</small>${trackLink(`/globe/${featured.slug}/`, `${esc(featured.newTitle)} ↗`)}<p>${esc(featured.dataset.summary)}</p><button class="preview-pause" id="hero-pause" aria-label="Pause preview rotation">Ⅱ PAUSE PREVIEW</button></div></div><div class="hero-bottom"><span>${registry.evidenceCount} SOURCED STORIES / ${registry.entries.length} SOURCE WORLDS</span><span>A globe is only half a story.<br><a href="/globe/${featured.slug}/" data-route>Turn it over. ↗</a></span></div></section><section class="index-section" id="index" aria-labelledby="index-title"><div class="section-heading"><div><div class="eyebrow">THE ATLAS / SELECT A WORLD</div><h2 id="index-title">Choose your rabbit hole.</h2></div><p id="catalogue-note"></p></div><div class="index-tools"><div class="tabs" aria-label="Atlas collection"><button class="tab" data-mode="evidence" aria-pressed="true">Sourced stories <span class="count">${registry.evidenceCount}</span></button><button class="tab" data-mode="all" aria-pressed="false">Complete index <span class="count">${registry.entries.length}</span></button></div><div class="search-wrap"><label for="search" aria-label="Search worlds">⌕</label><input id="search" type="search" placeholder="Find a world…" autocomplete="off" value="${esc(state.query)}"></div></div><div class="world-grid" id="world-grid"></div><div class="index-footer"><span id="result-status" class="result-status" aria-live="polite"></span><button id="load-more" class="outline-button">MORE WORLDS <span aria-hidden="true">↓</span></button></div></section><section class="statement"><h2>The planet is real.<br>The picture is incomplete.</h2><p>This is a research atlas, inspired by Ingo Günther’s <a href="https://world-processor.com/" target="_blank" rel="noopener noreferrer">World Processor</a>. Every public gallery entry has its own interpretation. Sourced stories show published observations or estimates; research concepts ask questions that still need data. Missing data never means zero. <button class="text-link" data-about>READ THE METHOD <span aria-hidden="true">↗</span></button></p></section></main>${footer()}${dialogShell()}`;
  renderCards();
  $("#hero-pause").addEventListener("click", () => globe?.pause(!globe.paused));
  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value;
    state.shown = 24;
    renderCards();
  });
  document.querySelectorAll("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      state.mode = b.dataset.mode;
      state.shown = 24;
      renderCards();
    }),
  );
  $("#load-more").addEventListener("click", () => {
    const before = state.shown;
    state.shown += 24;
    renderCards();
    $("#world-grid").children[before]?.focus();
  });
  mountGlobe(featured, true);
  bindCommon();
}
const legend = visualLegend;
function detailsPage(entry) {
  current = entry;
  if (entry.research) { researchPage(entry); return; }
  const d = entry.dataset;
  const i = registry.entries.indexOf(entry);
  const prev =
      registry.entries[
        (i - 1 + registry.entries.length) % registry.entries.length
      ],
    next = registry.entries[(i + 1) % registry.entries.length];
  const dataLabel = d
    ? d.geographyMode === "geographic"
      ? `${d.status} · ${d.dataYear}`
      : `${d.status} · non-geographic chart`
    : "Research concept · no measured data";
  document.title = `${entry.newTitle} — AFTERWORLD`;
  $("#app").innerHTML =
    `${header()}<main id="main" class="globe-page" style="--accent:${entry.color}"><section class="globe-stage" aria-labelledby="world-title"><div class="world-intro"><a href="/#index" data-route class="back-link">← ALL WORLDS</a><div class="eyebrow">WORLD ${esc(entry.number)} / ${esc(entry.lensLabel)}</div><h1 id="world-title">${esc(entry.newTitle)}</h1><p class="world-question">${esc(d?.summary || entry.question)}</p><span class="world-status">${esc(dataLabel)}</span><button class="more-information" id="more-information" aria-haspopup="dialog">MORE INFORMATION <span aria-hidden="true">↗</span></button><div class="world-actions"><button id="world-share">SHARE WORLD ↗</button></div>${d ? `<label class="place-picker">EXPLORE ${d.geographyMode==='geographic'?'A PLACE':'A CATEGORY'}<select id="place-picker"><option value="">Select to focus…</option>${d.points.map((p,i)=>`<option value="${i}">${esc(p.name)} · ${scoreFor(d,p)}/100</option>`).join('')}</select></label>`:''}</div><div class="world-visual" id="globe-host"><span class="globe-loading">ASSEMBLING A WORLD</span></div><aside class="side-fact" aria-label="World context">${d ? `<div><div class="eyebrow">THE SIGNAL</div><div class="fact-value">${headline(d.headline.value)}</div><div class="fact-unit">${esc(d.headline.unit)}</div></div><div class="fact-label">${esc(d.headline.label)}</div><div class="fact-limit">${esc(d.scope)}${d.id === "power" ? "<br>Map: 2024 shares. Headline: 2025 estimate." : ""}</div>` : `<div><div class="eyebrow">THE QUESTION</div><div class="fact-unit">WP / ${esc(entry.id)}</div></div><div class="fact-label">${esc(entry.connection)}</div><div class="fact-limit">An original visual hypothesis. This page does not establish a measured AI effect.</div>`}</aside><div class="selection-label" id="selection" hidden aria-live="polite"></div>${
      d && d.geographyMode === "categorical"
        ? `<div class="category-readout" aria-label="Category preview">${d.points
            .slice(0, 3)
            .map(
              (p) =>
                `<div class="mini-row"><div><span>${esc(p.name)}</span><span>${value(p)}%</span></div><i style="width:${clamp(p.value, 0, 100)}%"></i></div>`,
            )
            .join(
              "",
            )}<div class="concept-label">${d.points.length > 3 ? "ALL CATEGORIES IN EVIDENCE ↗" : "NON-GEOGRAPHIC COMPARISON"}</div></div>`
        : ""
    }<p class="hint">${d?.geographyMode === "geographic" ? "DRAG TO ROTATE · TAP A MARKER · EXPLORE THE OTHER SIDE" : "DRAG TO ROTATE · AN ABSTRACT VIEW OF THE QUESTION"}</p><div class="world-controls" role="group" aria-label="Globe controls"><button class="text-control" id="pause" aria-label="Pause all animation" aria-pressed="false">Ⅱ PAUSE</button><span class="control-divider" aria-hidden="true"></span><button id="left" aria-label="Rotate globe left">←</button><button id="right" aria-label="Rotate globe right">→</button><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><span class="control-divider" aria-hidden="true"></span><button id="flip" class="text-control" aria-label="Turn globe to the other side">OTHER SIDE</button><button id="reset" aria-label="Reset globe view">↺</button></div><div class="world-bottom"><div class="legend">${legend(d)}</div><button class="evidence-open" id="evidence">${d ? "EVIDENCE & DATA" : "IDEA & INSPIRATION"} <span aria-hidden="true">↗</span></button></div></section><nav class="world-next" aria-label="Adjacent worlds">${trackLink(`/globe/${prev.slug}/`, `<small>← PREVIOUS WORLD</small><p>${esc(prev.newTitle)}</p>`)}${trackLink(`/globe/${next.slug}/`, `<small>NEXT WORLD →</small><p>${esc(next.newTitle)}</p>`)}</nav></main>${footer()}${dialogShell()}`;
  $("#world-share").addEventListener("click", () => shareCurrent(true));
  $("#pause").addEventListener("click", () => globe?.pause(!globe.paused));
  $("#left").addEventListener("click", () => globe?.rotate(0, -0.3));
  $("#right").addEventListener("click", () => globe?.rotate(0, 0.3));
  $("#zoom-in").addEventListener("click", () => globe?.zoom(-0.3));
  $("#zoom-out").addEventListener("click", () => globe?.zoom(0.3));
  $("#flip").addEventListener("click", () => globe?.flip());
  $("#reset").addEventListener("click", () => globe?.reset());
  $("#more-information").addEventListener("click", () => openInformation(entry));
  $("#place-picker")?.addEventListener("change", e => {if(e.target.value!=='') globe?.select(Number(e.target.value));});
  $("#evidence").addEventListener("click", () => openEvidence(entry));
  mountGlobe(entry, false);
  bindCommon();
}
async function researchPage(entry, restored = {}) {
  const token = renderToken;
  researchAbort = new AbortController();
  const controller = researchAbort;
  const timeout = setTimeout(() => controller.abort(new DOMException('Reviewed data request timed out','TimeoutError')),12000);
  document.title = `${entry.newTitle} — AFTERWORLD`;
  $('#app').innerHTML = `${header()}<main id="main" class="research-page" style="--accent:#f2ba68"><a href="/#index" data-route class="back-link">← ALL WORLDS</a><h1>${esc(entry.newTitle)}</h1><p>${esc(entry.question)}</p><p role="status">Checking the reviewed evidence…</p></main>${footer()}${dialogShell()}`;
  bindCommon();
  try {
    let summary=entry.research;
    const requestedVersion=new URLSearchParams(location.search).get('v');
    if(!restored.prepared && requestedVersion && requestedVersion!==summary.revision) {
      const historyMonitor=new AcceptedUpdateMonitor();
      const cancel=()=>historyMonitor.dispose();controller.signal.addEventListener('abort',cancel,{once:true});
      try {const {manifest}=await historyMonitor.check();
        if(manifest.worlds[entry.id]?.revision===requestedVersion)summary=manifest.worlds[entry.id];
        else {const history=manifest.history?.[entry.id]?await loadAcceptedHistory(manifest.history[entry.id],entry.id,{signal:controller.signal}):manifest.versions?.[entry.id];summary=history?.[requestedVersion]||summary;}
      }
      catch {} finally {controller.signal.removeEventListener('abort',cancel);historyMonitor.dispose();}
    }
    const research = restored.prepared || await loadResearchWorld(summary, {signal:controller.signal});
    if (token !== renderToken) return;
    researchWorld = research;
    if(research.narrationRef)loadNarration(research.narrationRef,research,{signal:controller.signal}).then(record=>{if(token===renderToken)research.narrationData=record;}).catch(()=>{});
    const {dataset:d, design} = research;
    const presentation = researchPresentation(research);
    $('#main').style.setProperty('--accent', presentation.accent);
    const shared = resolveResearchShare(location.search, research);
    const restoreHeadingFocus = restored.focus === true || document.activeElement === $('#main h1');
    let readMode = restored.readMode || false;
    const i = registry.entries.indexOf(entry);
    const next = registry.entries[(i+1)%registry.entries.length];
    $('#main').innerHTML = `<a href="/#index" data-route class="back-link">← ALL WORLDS</a><div class="research-heading"><div><div class="eyebrow">WORLD ${esc(entry.number)} / ${esc(design.aiRelationship.class.toUpperCase())} FOR AI</div><h1>${esc(design.title)}</h1><p class="world-question">${esc(design.question)}</p></div><button class="outline-button" id="world-share">SHARE WORLD ↗</button></div>${shared.notice ? `<p class="integrity-note" role="status">${esc(shared.notice)}</p>` : ''}<p class="research-context">Observation ${esc(observationLabel(research))} · ${research.rows.length} source ${presentation.plural} · ${research.rows.filter(row=>row.status === "missing").length} missing observations${research.rows.some(row=>row.value===null&&row.status!=="missing") ? " · Published intervals remain ranges" : ""}</p><div class="research-update" data-reader-ui><p id="research-update-status" role="status">Checking accepted releases…</p><button id="research-update-apply" hidden>APPLY REVIEWED UPDATE</button></div><div class="research-layout"><section class="research-guidance" aria-label="How to read this world"><span class="eyebrow">${presentation.eyebrow}</span><p>${presentation.explanation}</p><p class="native-scale">${researchScaleHTML(research)}</p>${research.conceptId === "408" ? `<div class="access-legend" style="--access-gradient:${accessLegendGradient()}" aria-label="Teal lightness scale: 0, 25, 50, 75, 100 percent"><span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span></div>` : ""}<p>${presentation.invitation}</p><p class="research-boundary">${presentation.boundary}</p><button class="outline-button" id="research-story">READ THE STORY ↗</button><button class="outline-button" id="research-information">READ THE EVIDENCE ↗</button></section><section class="research-viewport" aria-label="${esc(presentation.geography)}"><p class="research-geography">${presentation.geography}</p><p id="research-coverage" class="tiny"></p><div id="globe-host" class="research-globe"><span class="globe-loading">ASSEMBLING REVIEWED MARKS</span></div><p class="research-motion">Ambient frame motion — not measured change</p><div class="research-controls" role="group" aria-label="Research globe controls"><button id="research-pause">PAUSE</button><button id="research-left" aria-label="Rotate left">←</button><button id="research-right" aria-label="Rotate right">→</button><button id="research-zoom-in" aria-label="Zoom in">+</button><button id="research-zoom-out" aria-label="Zoom out">−</button><button id="research-flip">OTHER SIDE</button><button id="research-reverse" hidden disabled aria-pressed="false">SHOW REVERSE EVIDENCE</button><button id="research-reset">RESET</button>${research.conceptId === "232" ? '<button id="research-inset" aria-pressed="false">SHOW 0–10% INSET</button>' : ""}<button id="research-read-mode" aria-pressed="false">READ MODE</button>${research.conceptId === "320" ? '<label class="time-basis">TIME DENOMINATOR<select id="research-time-basis"><option value="paid and unpaid hours">Include unpaid time</option><option value="paid hours only">Paid hours only</option></select></label>' : ""}<label class="time-basis" id="research-metric-label" hidden>COMPARE METRIC<select id="research-metric" disabled></select></label><label class="time-basis" id="research-species-label" hidden>SPECIES<select id="research-species" disabled></select></label><label class="time-basis" id="research-week-label" hidden>SOURCE WEEK<select id="research-week" disabled></select></label><label class="time-basis" id="research-map-mode-label" hidden>MAP MEASURE<select id="research-map-mode" disabled></select></label><label class="time-basis" id="research-histogram-mode-label" hidden>HISTOGRAM MEASURE<select id="research-histogram-mode" disabled></select></label><button id="research-table-mode" aria-pressed="false">TABLE VIEW</button></div><p class="tiny">Drag to rotate. Read mode lets touch scroll the page. The observation picker and table work without dragging.</p>${research.conceptId==="392"?'<p class="integrity-note">Shared test sample: 12 unshuffled observations. Augmented training can overlap observation years. Table 3 and Methods/Table 4 dates differ; independent unseen-year generalisation is not demonstrated.</p>':""}${research.conceptId==="378"?'<p class="integrity-note">Equal marks show automated detection, not bird counts. Filled teal: detected. Open blue: no detection with recorded effort. Hatch: source row supplied, recorder effort missing; detection unknown. X: not recorded in this extract; detection unknown. Separate rings show recording effort. Public coordinates are source-randomised by ±0.01°; they are not exact recorder locations.</p>':""}${researchSceneValuesHTML(research)}</section><section class="research-inspector" aria-label="Inspect a source ${presentation.label}"><label class="place-picker">SELECT AN OBSERVATION<select id="research-picker"><option value="">Choose an observation…</option>${research.rows.map((row,index)=>`<option value="${index}">${esc(row.name)} · ${esc(row.period)} · ${esc(nativeValue(row))} · ${esc(row.id)}</option>`).join('')}</select></label><div id="research-selection" aria-live="polite">${researchSelectionHTML(null,research)}</div><div class="research-controls"><button id="research-previous" aria-label="Previous observation">← PREVIOUS</button><button id="research-next">NEXT OBSERVATION →</button>${research.conceptId === "408" ? '<button id="research-lacking">NEXT LACKING ACCESS</button>' : ""}<button id="research-focus" disabled>${research.conceptId === "408" ? "FOCUS ON MAP" : research.conceptId === "430" ? "FOCUS REGION" : "FOCUS OBSERVATION"}</button><button id="research-clear" disabled>CLEAR</button></div></section></div><section id="research-static" hidden><h2>Every source observation</h2><p>The static chart and table retain the same reviewed observations.</p><div class="research-chart-wrap" tabindex="0" role="region" aria-label="Native-unit chart; scroll horizontally to see the full scale">${researchChartSVG(research)}</div></section><section class="research-evidence" aria-labelledby="research-table-title"><div class="research-table-heading"><h2 id="research-table-title">The complete comparison</h2><button class="outline-button" id="research-download">DOWNLOAD DATA & DESIGN ↓</button></div>${researchTableHTML(research)}${researchSourcesHTML(research)}</section><nav class="research-next">${trackLink(`/globe/${next.slug}/`, `EXPLORE ANOTHER WORLD · ${esc(next.newTitle)} ↗`)}</nav>`;
    if (research.conceptId==='408'&&research.geography) $('#research-coverage').textContent = `${research.geography.coverage.mapped} of ${research.rows.length} economies mapped; ${research.geography.coverage.tableOnly} table-only. Grey land has no mapped value. Missing observations have no numerical fill.`;
    if (['375','247','78-4'].includes(research.conceptId)&&research.geography)$('#research-coverage').textContent=`${research.geography.coverage.mapped} of ${research.rows.length} country/economy records mapped; ${research.geography.coverage.tableOnly} remain table-only. Display anchors show country summaries, not local sites. Missing values stay missing.`;
    if (restoreHeadingFocus) { const heading=$('#main h1'); heading.tabIndex=-1; heading.focus({preventScroll:true}); }
    $('#world-share').onclick = () => shareCurrent(true);
    $('#research-story').onclick = () => openResearchStory(research);
    $('#research-information').onclick = () => openDialog(design.title.toUpperCase(), `${researchSourcesHTML(research)}${sourceSection(entry)}`);
    const inspect = (row,index) => {
      selectedResearchIndex = index;
      syncGeographicControls();
      $('#research-selection').innerHTML = researchSelectionHTML(row,research);
      $('#research-picker').value = row ? String(index) : '';
      $('#research-focus').disabled = !row || !globe || (globe.canFocus && !globe.canFocus(index));
      $('#research-clear').disabled = !row;
      document.querySelectorAll('[data-research-row]').forEach(tr => tr.classList.toggle('selected-row', tr.dataset.researchRow === row?.id));
      reader.enhance($('#research-selection'));
      if (row) sensory.cue('select');
    };
    const select = index => {
      if (globe) globe.select(index);
      else inspect(research.rows[index],index);
    };
    $('#research-picker').onchange = e => e.target.value !== '' ? select(Number(e.target.value)) : clear();
    const clear = () => globe ? globe.clearSelection() : inspect(null,-1);
    $('#research-clear').onclick = clear;
    $('#research-previous').onclick = () => select((selectedResearchIndex < 0 ? research.rows.length - 1 : selectedResearchIndex - 1 + research.rows.length) % research.rows.length);
    $('#research-next').onclick = () => select((selectedResearchIndex+1)%research.rows.length);
    if ($('#research-lacking')) $('#research-lacking').onclick = () => { const index=nextLowerAccessIndex(research,selectedResearchIndex); if (index>=0) select(index); };
    $('#research-focus').onclick = () => globe?.focusSelection();
    document.querySelectorAll('[data-research-select]').forEach(button => button.onclick = () => select(Number(button.dataset.researchSelect)));
    $('#research-pause').onclick = () => globe?.pause(!globe.paused);
    $('#research-left').onclick = () => globe?.rotate(0,-0.3);
    $('#research-right').onclick = () => globe?.rotate(0,0.3);
    $('#research-zoom-in').onclick = () => globe?.zoom(-0.3);
    $('#research-zoom-out').onclick = () => globe?.zoom(0.3);
    $('#research-flip').onclick = () => globe?.flip();
    const syncGeographicControls=()=>{
      for(const [id,values,currentValue] of [['species',globe?.species||[],globe?.speciesSelection],['week',globe?.weeks||[],globe?.weekSelection],['map-mode',globe?.mapModes||[],globe?.mapMode],['histogram-mode',globe?.histogramModes||[],globe?.histogramMode]]){
        const control=$('#research-'+id);$('#research-'+id+'-label').hidden=!values.length;
        control.innerHTML=values.map(value=>`<option value="${esc(value)}">${esc(id==='map-mode'?value==='people'?'Estimated people using Internet':'Percent of population':id==='histogram-mode'?value==='count'?'Sample counts':'Share within each wine type':value)}</option>`).join('');control.value=currentValue??values[0]??'';
      }
      if(['378','78-4','365'].includes(research.conceptId)&&globe)$('#research-static .research-chart-wrap').innerHTML=researchChartSVG(research,{species:globe.speciesSelection,week:globe.weekSelection,mapMode:globe.mapMode,histogramMode:globe.histogramMode});
    };
    for(const id of ['species','week'])$('#research-'+id).onchange=()=>{globe?.setObservation($('#research-species').value,Number($('#research-week').value));syncGeographicControls();};
    $('#research-map-mode').onchange=e=>{globe?.setMapMode(e.target.value);syncGeographicControls();};
    $('#research-histogram-mode').onchange=e=>{globe?.setHistogramMode(e.target.value);syncGeographicControls();};
    const syncMetric=()=>{const select=$('#research-metric'),metrics=globe?.metrics||[];$('#research-metric-label').hidden=!metrics.length;select.innerHTML=metrics.map(metric=>`<option value="${esc(metric)}">${esc(metric)}</option>`).join('');select.value=globe?.metric||metrics[0]||'';};
    $('#research-metric').onchange=e=>globe?.setMetric?.(e.target.value);
    const syncReverse=()=>{const button=$('#research-reverse');button.hidden=!globe?.hasReverseEvidence;button.setAttribute('aria-pressed',String(Boolean(globe?.reverseEvidence)));button.textContent=globe?.reverseEvidence?'SHOW FRONT EVIDENCE':'SHOW REVERSE EVIDENCE';};
    $('#research-reverse').onclick=()=>{globe?.setReverseEvidence(!globe.reverseEvidence);syncReverse();};
    const resetInset=()=>{const button=$('#research-inset');if(button){button.setAttribute('aria-pressed','false');button.textContent='SHOW 0–10% INSET';globe?.setDetailInset(false);}};
    $('#research-reset').onclick = () => {globe?.reset();if(globe?.species?.length)globe.setObservation(globe.species[0],globe.weeks[0]);if(globe?.mapModes?.length)globe.setMapMode(globe.mapModes[0]);if(globe?.histogramModes?.length)globe.setHistogramMode(globe.histogramModes[0]);syncGeographicControls();if(globe?.metrics?.length)globe.setMetric(globe.metrics[0]);syncMetric();globe?.setReverseEvidence?.(false);syncReverse();resetInset();if($('#research-time-basis')){$('#research-time-basis').value='paid and unpaid hours';globe?.setTimeBasis('paid and unpaid hours');}};
    if($('#research-inset'))$('#research-inset').onclick=e=>{const shown=e.currentTarget.getAttribute('aria-pressed')!=='true';globe?.setDetailInset(shown);e.currentTarget.setAttribute('aria-pressed',String(shown));e.currentTarget.textContent=shown?'SHOW 0–100% MAIN SCALE':'SHOW 0–10% INSET';};
    if($('#research-time-basis'))$('#research-time-basis').onchange=e=>globe?.setTimeBasis(e.target.value);
    $('#research-read-mode').onclick = e => {
      const read = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      readMode = read;
      e.currentTarget.setAttribute('aria-pressed',String(read));
      e.currentTarget.textContent = read ? 'MOVE MODE' : 'READ MODE';
      globe?.setReadMode(read);
    };
    $('#research-table-mode').onclick = e => {
      const table = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed',String(table));
      e.currentTarget.textContent = table ? 'GLOBE VIEW' : 'TABLE VIEW';
      globe?.pause(true);
      $('#globe-host').hidden = table;
      $('#research-static').hidden = !table;
      if (table) $('#research-static').scrollIntoView({block:'start'});
    };
    $('#research-download').onclick = () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify({revision:research.revision,schemaVersion:research.schemaVersion||1,conceptId:research.conceptId,datasetBindingKind:research.datasetBindingKind,datasets:research.datasets,boundRowIdsByDataset:research.boundRowsByDataset?Object.fromEntries(Object.entries(research.boundRowsByDataset).map(([id,rows])=>[id,rows.map(row=>row.id)])):undefined,datasetSha256:research.datasetSha256,designSha256:research.designSha256,datasetCanonicalSha256:research.datasetCanonicalSha256,geographySha256:research.geographySha256,geography:research.geography,designAmendment:research.designAmendmentEvidence,designAmendmentSha256:research.designAmendmentSha256,runtimeApprovalText:research.runtimeApprovalText,runtimeApprovalSha256:research.runtimeApprovalSha256,dataset:research.datasets?undefined:d,design,release:research.release},null,2)], {type:'application/json'}));
      const a=document.createElement('a'); a.href=url; a.download=`afterworld-${research.conceptId}-${research.revision.slice(0,12)}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    };
    reader.enhance();
    const initialIndex = restored.rowId ? research.rows.findIndex(row=>row.id===restored.rowId) : shared.index;
    if (initialIndex >= 0) select(initialIndex);
    const sceneButtons = '#research-pause,#research-left,#research-right,#research-zoom-in,#research-zoom-out,#research-flip,#research-reset,#research-inset,#research-time-basis,#research-reverse,#research-metric,#research-species,#research-week,#research-map-mode,#research-histogram-mode';
    document.querySelectorAll(sceneButtons).forEach(button=>button.disabled=true);
    try {
      const {ResearchGlobe} = await import('./research-view.js');
      if (token !== renderToken) return;
      globe = new ResearchGlobe($('#globe-host'), {entry,research,onSelect:inspect,onMotion:paused=>{
        const button=$('#research-pause'); if (!button) return;
        button.textContent=paused?'PLAY FRAME':'PAUSE'; button.setAttribute('aria-pressed',String(paused));
        button.setAttribute('aria-label',paused?'Play ambient frame motion':'Pause ambient frame motion');
      }});
      document.querySelectorAll(sceneButtons).forEach(button=>button.disabled=false);
      if (readMode) { globe.setReadMode(true); $('#research-read-mode').setAttribute('aria-pressed','true'); $('#research-read-mode').textContent='MOVE MODE'; }
      if (restored.camera) globe.restoreCamera(restored.camera);
      syncReverse();
      if($('#research-inset')){const inset=Boolean(globe.detailInset);$('#research-inset').setAttribute('aria-pressed',String(inset));$('#research-inset').textContent=inset?'SHOW 0–100% MAIN SCALE':'SHOW 0–10% INSET';}
      if($('#research-time-basis'))$('#research-time-basis').value=globe.timeBasis;
      syncMetric();syncGeographicControls();
      if (selectedResearchIndex >= 0) globe.select(selectedResearchIndex);
      $('#globe-host .globe-loading')?.remove();
      $('#globe-host').addEventListener('globe-error', () => researchFallback());
    } catch(error) {
      if (token !== renderToken) return;
      researchFallback();
      console.error('Research graphics unavailable',error);
    }
    if (token === renderToken) monitorResearchUpdates(entry,research,()=>readMode);
  } catch(error) {
    if (token !== renderToken) return;
    $('#main').insertAdjacentHTML('beforeend','<div class="integrity-note" role="alert">The reviewed data could not be loaded or verified. No substitute measurements are shown. Reload to retry.</div>');
    $('#main [role="status"]')?.remove();
    console.error('Research evidence unavailable',error);
  } finally { clearTimeout(timeout); }
}

function monitorResearchUpdates(entry, research, getReadMode) {
  const monitor=new AcceptedUpdateMonitor(), token=renderToken;
  let lastAttempt=0, offered=null, checking=false;
  const status=()=>$('#research-update-status');
  const check=async()=>{
    if(document.hidden || checking || Date.now()-lastAttempt<30000) return;
    lastAttempt=Date.now(); checking=true;
    try {
      const result=await monitor.check();
      if(token!==renderToken)return;
      const next=result.manifest.worlds[entry.id];
      if(!next)throw Error('No accepted pointer for this world');
      if(next.revision===research.revision){
        offered=null; $('#research-update-apply').hidden=true;
        status().textContent=`Accepted manifest checked ${result.checkedAt}. This is the current accepted revision; this is not a new source observation.`;
        return;
      }
      offered=null; $('#research-update-apply').hidden=true;
      const updateAbort=new AbortController(), parentSignal=researchAbort.signal;
      const cancel=()=>updateAbort.abort();parentSignal.addEventListener('abort',cancel,{once:true});
      const timeout=setTimeout(cancel,12000);
      let prepared;
      try {prepared=await loadResearchWorld(next,{signal:updateAbort.signal});}
      finally {clearTimeout(timeout);parentSignal.removeEventListener('abort',cancel);}
      if(token!==renderToken)return;
      offered=prepared; status().textContent='Updated data available. The current view stays unchanged until you apply the reviewed revision.';
      $('#research-update-apply').hidden=false;
    } catch(error) {
      if(token===renderToken){offered=null;$('#research-update-apply').hidden=true;status().textContent='Accepted-release check unavailable. The displayed accepted revision is retained.';console.warn('Accepted-release check failed',error);}
    } finally {checking=false;}
  };
  $('#research-update-apply').onclick=()=>{
    if(!offered)return;
    const restored={focus:true,prepared:offered,rowId:research.rows[selectedResearchIndex]?.id,camera:globe?.snapshotCamera(),readMode:getReadMode()};
    const nextEntry={...entry,research:offered,newTitle:offered.title,question:offered.question};
    stopResearchUpdates?.(); stopResearchUpdates=null; researchAbort?.abort();
    voicePriority.clear();reader.dismiss();globe?.dispose();globe=null;selectedResearchIndex=-1;renderToken++;
    const index=registry.entries.findIndex(item=>item.id===entry.id);registry.entries[index]=nextEntry;current=nextEntry;
    const url=new URL(location.href);url.searchParams.set('v',offered.revision);if(restored.rowId)url.searchParams.set('row',restored.rowId);else url.searchParams.delete('row');history.replaceState({},'',url);
    researchPage(nextEntry,restored);
  };
  const visible=()=>{if(!document.hidden)check();};
  window.addEventListener('focus',check);document.addEventListener('visibilitychange',visible);
  const interval=setInterval(check,300000);
  stopResearchUpdates=()=>{clearInterval(interval);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',visible);monitor.dispose();};
  check();
}

function researchFallback() {
  globe?.dispose(); globe=null;
  $('#globe-host').innerHTML='<p class="integrity-note">Interactive graphics are unavailable. The complete static chart and source table are available below.</p>';
  $('#research-static').hidden=false;
  $('#research-table-mode').disabled=true;
  document.querySelectorAll('#research-pause,#research-left,#research-right,#research-zoom-in,#research-zoom-out,#research-flip,#research-reset,#research-read-mode,#research-focus,#research-inset,#research-time-basis,#research-reverse,#research-metric,#research-species,#research-week,#research-map-mode,#research-histogram-mode').forEach(button=>button.disabled=true);
}
async function mountGlobe(entry, hero) {
  const token = renderToken;
  const host = $("#globe-host");
  try {
    const { Globe } = await import("./globe.js");
    if (token !== renderToken) return;
    globe = new Globe(host, {
      countries,
      entry,
      dataset: entry.dataset,
      hero,
      onSelect: (p, index) => {
        sensory.cue("select");
        if ($("#place-picker")) $("#place-picker").value = String(index);
        const el = $("#selection");
        if (el) {
          el.hidden = false;
          el.innerHTML = `<div class="selected-name">${esc(p.name)}</div><div class="selected-value">${esc(value(p))} <small>${esc(entry.dataset.unit)}</small></div><div class="selected-score"><strong>${scoreFor(entry.dataset,p)}</strong><span>/100 · VISUAL SCORE</span></div><div class="score-rail" aria-hidden="true"><i style="width:${scoreFor(entry.dataset,p)}%"></i></div><div class="selected-note">${esc(entry.dataset.dataYear)} · ${esc(p.note)}</div>`;
          reader.enhance(el);
        }
      },
      onMotion: (paused) => {
        const b = $("#pause") || $("#hero-pause");
        if (b) {
          b.textContent = paused ? "▷ PLAY" : "Ⅱ PAUSE";
          b.setAttribute(
            "aria-label",
            paused ? "Start animation" : "Pause all animation",
          );
          b.setAttribute("aria-pressed", String(paused));
        }
      },
    });
    host.querySelector(".globe-loading")?.remove();
    host.addEventListener("globe-error", (e) =>
      showFallback(host, entry, e.detail),
    );
  } catch (error) {
    if (token === renderToken)
      showFallback(
        host,
        entry,
        "Interactive 3D is unavailable on this device. The static view and complete evidence remain available.",
      );
    console.error("Globe unavailable", error);
  }
}
function showFallback(host, entry, message) {
  host.querySelector(".globe-loading")?.remove();
  host.insertAdjacentHTML(
    "beforeend",
    `<div class="fallback"><img src="/assets/thumbs/${esc(entry.slug)}.svg" alt="Static illustration of ${esc(entry.newTitle)}"><p>${esc(message)}</p></div>`,
  );
  document
    .querySelectorAll(".world-controls button")
    .forEach((b) => (b.disabled = true));
  reader.enhance(host);
}
function openResearchStory(research) {
  const record=research.narrationData;
  const transcript=record?.transcript || [research.design.question,research.conceptId==='156-8'?researchPresentation(research).explanation:research.design.legend,research.conceptId==='156-8'?researchPresentation(research).invitation:research.design.backsideDiscovery,...sourceDatasets(research).map(entry=>entry.dataset.uncertainty),...research.design.limitations].filter(Boolean).join('\n\n');
  const citations=researchSourceList(research).filter(source=>!record || record.citations.includes(source.sourceId));
  openDialog(research.design.title.toUpperCase(),`${transcript.split(/\n+/).map(text=>`<p>${esc(text)}</p>`).join('')}<p class="tiny">${record?.audio ? 'Reviewed synthetic narration. The transcript remains available below.' : 'Read aloud uses a device voice. A reviewed recorded story is not available for this revision.'}</p>${record?.audio ? '<button id="recorded-story">LISTEN TO RECORDED STORY</button><button id="stop-recorded-story">STOP RECORDING</button><p id="narration-status" role="status" data-reader-ui></p>' : ''}<ol class="sources">${citations.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a></li>`).join('')}</ol>`);
  if(record?.audio){$('#recorded-story').onclick=()=>narrator.play(record,research);$('#stop-recorded-story').onclick=()=>narrator.stop();}
}

function openDialog(title, html) {
  dialogGeneration++;
  const modal = $("#modal");
  narrator.stop();
  reader.dismiss();
  if (!modal.open) activeDialogTrigger = document.activeElement;
  $("#dialog-title").textContent = title;
  $("#dialog-body").innerHTML = html;
  modal.style.setProperty("--accent", current?.color || "#c5f486");
  if (!modal.open) modal.showModal();
  reader.enhance($("#dialog-body"));
  modal.scrollTop = 0;
  modal.querySelector("[data-close]").focus();
  reader.opened($("#dialog-body"), title);
}
function closeDialog() {
  const modal = $("#modal");
  if (modal?.open) modal.close();
  activeDialogTrigger?.focus();
}
function openInformation(e) {
  openDialog("MORE INFORMATION", informationHTML(e));
  $("[data-full-evidence]").onclick = () => openEvidence(e);
  $("[data-back-globe]")?.addEventListener("click", closeDialog);
}
function sourceSection(e) {
  if (e.research && researchWorld?.conceptId === e.id) e = {...e, connection:researchWorld.design.sourceInspiration.connection};
  return `<h4>THE ORIGINAL QUESTION</h4><p><a href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">World Processor [${esc(e.id)}] · ${esc(e.title)} ↗</a></p><p>${esc(e.sourceConcept)}</p><p>${esc(e.connection)}</p><p class="tiny">Inspiration: Ingo Günther. AFTERWORLD is an independent interpretation; original artwork is not reproduced. A source gallery entry can contain multiple historical versions.</p>`;
}
function openEvidence(e) {
  const d = e.dataset;
  if (!d) {
    openDialog(
      "IDEA & INSPIRATION",
      `<h3>${esc(e.newTitle)}</h3><div class="integrity-note">RESEARCH CONCEPT · The animated sculpture is not a dataset. No numerical AI effect is asserted.</div><h4>RESEARCH QUESTION</h4><p>${esc(e.question)}</p>${sourceSection(e)}<h4>WHAT WOULD MAKE THIS AN EVIDENCE MAP?</h4><p>A comparable geographic dataset, a documented relationship to AI, a clear time period, and an auditable scale. Until those exist, this world stays a question.</p><div class="dialog-actions"><button class="outline-button" id="share">COPY WORLD LINK ↗</button></div>`,
    );
    $("#share").onclick = copyLink;
    return;
  }
  const metric = d.metric;
  openDialog(
    "EVIDENCE & DATA",
    `<h3>${esc(e.newTitle)}</h3><p>${esc(metric)}</p><div class="evidence-meta"><span>${esc(d.status.toUpperCase())}</span><span>DATA: ${esc(d.dataYear)}</span><span>REVIEWED: 20 OCT 2026</span></div><div class="integrity-note">${esc(d.limitations)}</div><h4>HOW TO READ THIS WORLD</h4><p>${legend(d)}</p><p>${esc(d.coordinateMeaning)} ${esc(d.scope)}</p><p class="tiny">${esc(scoreExplanation(d))} Animation speed repeats magnitude; it is not a measured trend rate. Any colour modulation belongs to the same score, not a separate measurement.</p><div class="data-table-wrap"><table class="data-table"><caption>${esc(metric)} · ${esc(d.unit)}</caption><thead><tr><th scope="col">${d.geographyMode === "geographic" ? "PLACE / REGION" : "CATEGORY"}</th><th scope="col">VALUE</th><th scope="col">SCORE</th><th scope="col">VIEW</th></tr></thead><tbody>${d.points.map((p, i) => `<tr><td>${esc(p.name)}<span class="table-note">${esc(p.note)}</span></td><td>${esc(value(p))}</td><td class="score-cell">${scoreFor(d,p)}/100</td><td>${d.geographyMode !== "global" ? `<button data-point="${i}" aria-label="View ${esc(p.name)} on globe">VIEW ↗</button>` : "—"}</td></tr>`).join("")}</tbody></table></div>${d.forecast ? `<h4>SEPARATE FORECAST · NOT ON THE MAP</h4><p><strong>${formatValue(d.forecast.value)} ${esc(d.forecast.unit)} in ${esc(d.forecast.year)}</strong> — ${esc(d.forecast.label)}. This is a projection, not an observation.</p>` : ""}${d.history ? `<h4>HISTORICAL COMPARISON</h4><p>${d.history.map((p) => `${p.year}: ${formatValue(p.value)} ${esc(p.unit)}`).join(" · ")}. Same source and scope; no values between these dates are asserted.</p>` : ""}<h4>PRIMARY SOURCES</h4><ol class="sources">${d.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a></li>`).join("")}</ol><p class="tiny">Publication: ${esc(d.published)} · Retrieved: ${esc(d.retrieved)}. This edition is a versioned snapshot; updates require a new source review.</p>${sourceSection(e)}<div class="dialog-actions"><button class="outline-button" id="download-data">DOWNLOAD SOURCE DATA ↓</button><button class="outline-button" id="share">COPY WORLD LINK ↗</button></div>`,
  );
  document.querySelectorAll("[data-point]").forEach((b) =>
    b.addEventListener("click", () => {
      closeDialog();
      globe?.select(Number(b.dataset.point));
    }),
  );
  $("#share").onclick = copyLink;
  $("#download-data").onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(d, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `afterworld-${d.id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}
function openAbout() {
  openDialog(
    "THE METHOD",
    `<p class="about-intro">One world.<br>More than one truth.</p><p>AFTERWORLD is a quiet atlas of AI’s physical footprint, uneven benefits and strange consequences. It takes the globe-as-argument idea from Ingo Günther’s World Processor into an interactive, evidence-led form.</p><h4>A COMPLETE INDEX, AN INCOMPLETE SCIENCE</h4><p>We inventoried ${registry.entries.length} entries in the three current public World Processor galleries. Each has a separate page, original research question and visual interpretation. ${registry.evidenceCount} pages currently contain sourced numerical layers. The remaining pages are explicitly labelled research concepts. Historical variants inside gallery pages are not exhaustively re-created.</p><h4>OBSERVATION ≠ CAUSATION</h4><p>Reported observations, model estimates and forecasts have separate labels. Robot installation does not mean job loss. Internet coverage does not mean AI adoption. Data-centre electricity and water include non-AI workloads. A protein prediction is not an experimentally confirmed discovery.</p><h4>THE VISUAL CONTRACT</h4><p>In the earlier sourced stories, country and region values use display anchors, not exact sites or continuous heatmaps. The cloud-grid research view uses alphabetical abstract region slots. The electricity-access view joins country identifiers to audited generalized polygons and retains unsupported economies in its table. The 14 earlier sourced stories use documented 1–100 magnitude scores. New reviewed research views use their accepted native units and fixed scales, without constructed impact scores. In those views, only a separate neutral frame moves; measured marks remain constant. In the earlier views, speed repeats magnitude; it is not a measured growth rate. Language and work categories occupy abstract sectors, and protein structures appear as global folds. Research sculptures encode no measured quantities. Missing places have no implied value.</p><h4>ACCESS & MOVEMENT</h4><p>Drag or swipe to rotate. Pinch, use +/−, or focus the globe and scroll to zoom. Arrow keys rotate; Space pauses; Home resets. The Other Side button turns 180°. Every mapped value can also be read and located from the evidence table. Reduced-motion preferences stop automatic rotation and all data effects. The Pause button also freezes both. In earlier stories, dragging stops automatic rotation while the sculpture keeps moving. In the native-unit research view, manual interaction pauses the separate ambient frame until Play is selected; the camera never autorotates.</p><h4>READ OR LISTEN</h4><p>Every information block has a Listen control. Listen to all reads an entire information overlay, including its quick statistics. JUICE Reader offers pause and resume, previous and next passages, device voices, speed and larger text. Opening a different overlay, leaving a world or closing the overlay stops its reading. Opening a text panel reads it aloud by default. Turn off Auto-read text panels to use Listen manually. Auto-read, voice and text-size preferences stay on this device. Nothing is read on initial page load.</p><h4>ORIGIN & CREDITS</h4><p><a href="https://world-processor.com/wpp" target="_blank" rel="noopener noreferrer">World Processor</a> by Ingo Günther is the artistic inspiration. This independent project is not affiliated with or endorsed by the artist. No original globe photographs are copied. Geography: Natural Earth via <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener noreferrer">world-atlas</a>. 3D: <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a>. Type: Space Grotesk and Space Mono, bundled under the SIL Open Font License. Speech: the shared JUICE Reader engine. Sources remain linked on each story.</p><h4>RELEASE STATUS</h4><p>Living sculptures edition, reviewed 20 October 2026. Static engineering and source checks are available; real-device animation, mobile usability and browser performance have not yet passed independent runtime testing. The requested 9.2/10 quality target is not certified.</p><div class="dialog-actions"><a class="outline-button" href="/assets/source-catalog.json" download>DOWNLOAD INSPIRATION INDEX ↓</a></div>`,
  );
}
async function shareCurrent(native = true) {
  if (!current) return;
  const token = renderToken;
  const state = researchWorld ? {revision:researchWorld.revision, selection:researchWorld.rows[selectedResearchIndex]?.id} : {};
  const result = await shareWorld(current, registry.publicOrigin || location.origin, navigator, native, state);
  if (token !== renderToken) return;
  if (result.status === 'copied') toast('World link copied.');
  if (result.status === 'manual') {
    openDialog('SHARE THIS WORLD', `<p>Copy this address to share a single world.</p><label class="share-link">World link<input id="manual-share-url" type="url" readonly value="${esc(result.url)}"></label>`);
    $('#manual-share-url').focus(); $('#manual-share-url').select();
  }
}
function copyLink() { return shareCurrent(false); }
function syncSensoryControls() {
  document.querySelectorAll('[data-sensory-open]').forEach(button => {
    const active = Object.values(sensory.enabled).some(Boolean);
    button.textContent = active ? 'SOUND · ON' : 'SOUND';
    button.setAttribute('aria-label', `Sound and touch settings. ${active ? 'Effects enabled' : 'Effects off'}`);
  });
  for (const kind of ['ambience', 'effects', 'haptics']) {
    const b = document.querySelector(`[data-sensory="${kind}"]`);
    if (b) {
      b.setAttribute('aria-pressed', String(sensory.enabled[kind]));
      b.querySelector('span').textContent = sensory.enabled[kind] ? 'On' : 'Off';
    }
  }
}
function openSensory() {
  const supported = sensory.audioSupported;
  openDialog('SOUND & FEEL', `<p>Give this world a quiet atmosphere. Sound and touch start off; choose what you want for this visit.</p><div class="sensory-options">${[['ambience','World atmosphere',supported],['effects','Action sounds',supported],['haptics','Subtle touch',sensory.hapticsSupported]].map(([kind,label,available])=>`<button data-sensory="${kind}" aria-pressed="false" ${available ? '' : 'disabled'}>${label}<span>Off</span></button>`).join('')}<label>Atmosphere volume<input id="ambient-volume" type="range" min="0" max="100" value="${Math.round(sensory.volumes.ambience*100)}" ${supported ? "" : "disabled"}></label><label>Action volume<input id="effects-volume" type="range" min="0" max="100" value="${Math.round(sensory.volumes.effects*100)}" ${supported ? "" : "disabled"}></label><label><input id="mono-output" type="checkbox" ${sensory.mono ? "checked" : ""}> Mono effects output</label><button id="mute-sensory">TURN EFFECTS OFF</button></div><p class="sensory-note">${sensory.hapticsSupported ? 'Touch feedback depends on your browser, device and settings.' : 'Touch feedback is unavailable in this browser.'} ${supported ? 'Atmosphere softens while JUICE Reader speaks. It is an artistic soundtrack, not a measurement.' : 'Web Audio is unavailable in this browser.'}</p><small class="soundscape-id">SOUNDSCAPE ${esc(sensory.profile?.id || 'Open a world to hear its atmosphere')}</small>`);
  document.querySelectorAll('[data-sensory]').forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    const kind = b.dataset.sensory;
    const ok = await sensory.setEnabled(kind, !sensory.enabled[kind]);
    b.disabled = false;
    if (!ok) toast('This device could not start that effect. Try again.');
  }));
  $('#mute-sensory').addEventListener('click', () => sensory.muteAll());
  $('#ambient-volume').oninput=e=>sensory.setVolume('ambience',Number(e.target.value)/100);
  $('#effects-volume').oninput=e=>sensory.setVolume('effects',Number(e.target.value)/100);
  $('#mono-output').onchange=e=>sensory.setMono(e.target.checked);
  syncSensoryControls();
}
function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => {
    if ($("#toast")) $("#toast").hidden = true;
  }, 3500);
}
function bindCommon() {
  reader.enhance();
  document.querySelectorAll('[data-sensory-open]').forEach(b => b.addEventListener('click', openSensory));
  syncSensoryControls();
  document
    .querySelectorAll("[data-about]")
    .forEach((b) => (b.onclick = openAbout));
  const modal = $("#modal");
  modal.querySelector("[data-close]").onclick = closeDialog;
  modal.addEventListener("close", () => { narrator.stop(); reader.dismiss(); activeDialogTrigger?.focus(); });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      const r = modal.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        closeDialog();
    }
  });
}
function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch {
    return "";
  }
}
function render({ focus = false } = {}) {
  voicePriority.clear();
  reader.dismiss();
  stopResearchUpdates?.(); stopResearchUpdates=null;
  researchAbort?.abort(); researchAbort=null;
  researchWorld=null; selectedResearchIndex=-1;
  renderToken++;
  globe?.dispose();
  globe = null;
  current = null;
  const match = location.pathname.match(/^\/globe\/([^/]+)\/?$/);
  const entry =
    match && registry.entries.find((e) => e.slug === safeDecode(match[1]));
  sensory.setWorld(entry || null);
  document.documentElement.style.setProperty('--accent', entry?.color || '#c5f486');
  if (entry) detailsPage(entry);
  else if (location.pathname === "/" || location.pathname === "/index.html")
    home();
  else {
    $("#app").innerHTML =
      `${header()}<main id="main" class="boot-error"><h1>This world is uncharted.</h1><p>The address doesn’t match a world in this edition.</p>${trackLink("/", "RETURN TO THE ATLAS ↗", "outline-button")}</main>${footer()}${dialogShell()}`;
    bindCommon();
  }
  if (focus) {
    const h = $("h1");
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  }
  if (location.hash === "#index")
    requestAnimationFrame(() => $("#index")?.scrollIntoView());
  else scrollTo({ top: 0, behavior: "instant" });
}
document.addEventListener('visibilitychange', () => sensory.setVisible(!document.hidden));
window.addEventListener('pagehide', () => sensory.setVisible(false));
window.addEventListener('pageshow', () => sensory.setVisible(!document.hidden));
document.addEventListener('click', e => {
  if (e.target.closest('button:not([disabled]), a[data-route]') && !e.target.closest('[data-sensory], #mute-sensory')) sensory.cue();
});
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-route]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button)
    return;
  const url = new URL(a.href);
  if (url.origin !== location.origin) return;
  e.preventDefault();
  history.pushState({}, "", url.pathname + url.search + url.hash);
  render({ focus: true });
});
window.addEventListener("popstate", () => {
  if (registry) render({ focus: true });
});
try {
  const responses = await Promise.all([
    fetch("/assets/registry.json"),
    fetch("/assets/vendor/countries-110m.json"),
  ]);
  for (const r of responses)
    if (!r.ok) throw Error(`Data request failed: ${r.status}`);
  const [r, t] = await Promise.all(responses.map((r) => r.json()));
  registry = r;
  countries = decodeTopology(t);
  render();
} catch (e) {
  console.error(e);
  $("#app").innerHTML =
    '<main class="boot-error"><h1>The atlas could not load.</h1><p>Please reload. Your connection may have interrupted the local data files.</p><button class="outline-button" id="retry">RELOAD</button></main>';
  $("#retry").onclick = () => location.reload();
}
