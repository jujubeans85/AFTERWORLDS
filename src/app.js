import { scoreFor } from "./scoring.js";
import { informationHTML, visualLegend, scoreExplanation } from "./information.js";
import { createAtlasReader } from "./reader.js";
import {
  decodeTopology,
  escapeHTML as esc,
  formatValue,
  clamp,
} from "./math.js";
const $ = (s) => document.querySelector(s);
const reader = createAtlasReader();
let registry,
  countries,
  globe,
  renderToken = 0,
  current = null,
  activeDialogTrigger = null,
  toastTimer;
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
  return `<header class="site-header"><a href="/" data-route class="wordmark" aria-label="AFTERWORLD home"><span class="mark" aria-hidden="true"></span>AFTERWORLD</a><span class="header-meta">AN ATLAS OF THE MACHINE AGE</span><nav class="header-nav" aria-label="Main navigation"><a href="/#index" data-route>INDEX <span aria-hidden="true">↗</span></a><button data-about>ABOUT</button></nav></header>`;
}
function footer() {
  return `<footer class="site-footer"><span>AFTERWORLD / LIVING SCULPTURES EDITION<br>Evidence reviewed 20 OCT 2026 · Not a live feed</span><span>Inspired by <a href="https://world-processor.com/" target="_blank" rel="noopener noreferrer">Ingo Günther’s World Processor ↗</a><br>Independent project · ${registry.entries.length} gallery-entry interpretations</span></footer>`;
}
function dialogShell() {
  return `<dialog id="modal" aria-labelledby="dialog-title"><div class="dialog-head"><h2 id="dialog-title">THE EVIDENCE</h2><button aria-label="Close dialog" data-close>×</button></div><div class="dialog-content" id="dialog-body"></div></dialog><div id="toast" class="toast" role="status" hidden></div>`;
}
function card(entry) {
  const d = entry.dataset;
  return `<a href="/globe/${esc(entry.slug)}/" data-route class="world-card" style="--card-color:${entry.color}" aria-label="Explore ${esc(entry.newTitle)}, ${d ? "sourced story" : "research concept"}"><div class="card-top"><span>${esc(entry.number)}</span><span>${esc(entry.lensLabel)}</span></div><div class="card-img"><img src="/assets/thumbs/${esc(entry.slug)}.svg" width="300" height="250" alt="" loading="lazy" decoding="async"></div><h3 class="card-title">${esc(entry.newTitle)}</h3><div class="card-bottom"><span class="card-type">${d ? `${esc(d.status.toUpperCase())} · ${esc(d.dataYear)}` : "RESEARCH CONCEPT"}</span><span class="arrow" aria-hidden="true">↗</span></div></a>`;
}
function renderCards() {
  const pool = registry.entries.filter(
    (e) => state.mode === "all" || e.dataset,
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
    `${header()}<main id="main" class="globe-page" style="--accent:${entry.color}"><section class="globe-stage" aria-labelledby="world-title"><div class="world-intro"><a href="/#index" data-route class="back-link">← ALL WORLDS</a><div class="eyebrow">WORLD ${esc(entry.number)} / ${esc(entry.lensLabel)}</div><h1 id="world-title">${esc(entry.newTitle)}</h1><p class="world-question">${esc(d?.summary || entry.question)}</p><span class="world-status">${esc(dataLabel)}</span><button class="more-information" id="more-information" aria-haspopup="dialog">MORE INFORMATION <span aria-hidden="true">↗</span></button>${d ? `<label class="place-picker">EXPLORE ${d.geographyMode==='geographic'?'A PLACE':'A CATEGORY'}<select id="place-picker"><option value="">Select to focus…</option>${d.points.map((p,i)=>`<option value="${i}">${esc(p.name)} · ${scoreFor(d,p)}/100</option>`).join('')}</select></label>`:''}</div><div class="world-visual" id="globe-host"><span class="globe-loading">ASSEMBLING A WORLD</span></div><aside class="side-fact" aria-label="World context">${d ? `<div><div class="eyebrow">THE SIGNAL</div><div class="fact-value">${headline(d.headline.value)}</div><div class="fact-unit">${esc(d.headline.unit)}</div></div><div class="fact-label">${esc(d.headline.label)}</div><div class="fact-limit">${esc(d.scope)}${d.id === "power" ? "<br>Map: 2024 shares. Headline: 2025 estimate." : ""}</div>` : `<div><div class="eyebrow">THE QUESTION</div><div class="fact-unit">WP / ${esc(entry.id)}</div></div><div class="fact-label">${esc(entry.connection)}</div><div class="fact-limit">An original visual hypothesis. This page does not establish a measured AI effect.</div>`}</aside><div class="selection-label" id="selection" hidden aria-live="polite"></div>${
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
function openDialog(title, html) {
  const modal = $("#modal");
  reader.dismiss();
  if (!modal.open) activeDialogTrigger = document.activeElement;
  $("#dialog-title").textContent = title;
  $("#dialog-body").innerHTML = html;
  modal.style.setProperty("--accent", current?.color || "#c5f486");
  if (!modal.open) modal.showModal();
  reader.enhance($("#dialog-body"));
  modal.scrollTop = 0;
  modal.querySelector("[data-close]").focus();
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
    `<p class="about-intro">One world.<br>More than one truth.</p><p>AFTERWORLD is a quiet atlas of AI’s physical footprint, uneven benefits and strange consequences. It takes the globe-as-argument idea from Ingo Günther’s World Processor into an interactive, evidence-led form.</p><h4>A COMPLETE INDEX, AN INCOMPLETE SCIENCE</h4><p>We inventoried ${registry.entries.length} entries in the three current public World Processor galleries. Each has a separate page, original research question and visual interpretation. ${registry.evidenceCount} pages currently contain sourced numerical layers. The remaining pages are explicitly labelled research concepts. Historical variants inside gallery pages are not exhaustively re-created.</p><h4>OBSERVATION ≠ CAUSATION</h4><p>Reported observations, model estimates and forecasts have separate labels. Robot installation does not mean job loss. Internet coverage does not mean AI adoption. Data-centre electricity and water include non-AI workloads. A protein prediction is not an experimentally confirmed discovery.</p><h4>THE VISUAL CONTRACT</h4><p>Country and region values are represented by anchors, not exact sites or continuous heatmaps. Each sourced story has a distinct sculpture driven by a documented 1–100 magnitude score. A fixed scale links the raw value to density, height, motion or colour. Speed repeats magnitude; it is not a measured growth rate. Language and work categories occupy abstract sectors, and protein structures appear as global folds. Research sculptures encode no measured quantities. Missing places have no implied value.</p><h4>ACCESS & MOVEMENT</h4><p>Drag or swipe to rotate. Pinch, use +/−, or focus the globe and scroll to zoom. Arrow keys rotate; Space pauses; Home resets. The Other Side button turns 180°. Every mapped value can also be read and located from the evidence table. Reduced-motion preferences stop automatic rotation and all data effects. The Pause button also freezes both. Dragging stops automatic rotation while the sculpture keeps moving.</p><h4>READ OR LISTEN</h4><p>Every information block has a Listen control. Listen to all reads an entire information overlay, including its quick statistics. JUICE Reader offers pause and resume, previous and next passages, device voices, speed and larger text. Opening a different overlay, leaving a world or closing the overlay stops its reading. Playback starts only after a tap; voice and text-size preferences stay on this device.</p><h4>ORIGIN & CREDITS</h4><p><a href="https://world-processor.com/wpp" target="_blank" rel="noopener noreferrer">World Processor</a> by Ingo Günther is the artistic inspiration. This independent project is not affiliated with or endorsed by the artist. No original globe photographs are copied. Geography: Natural Earth via <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener noreferrer">world-atlas</a>. 3D: <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a>. Type: Space Grotesk and Space Mono, bundled under the SIL Open Font License. Speech: the shared JUICE Reader engine. Sources remain linked on each story.</p><h4>RELEASE STATUS</h4><p>Living sculptures edition, reviewed 20 October 2026. Static engineering and source checks are available; real-device animation, mobile usability and browser performance have not yet passed independent runtime testing. The requested 9.2/10 quality target is not certified.</p><div class="dialog-actions"><a class="outline-button" href="/assets/source-catalog.json" download>DOWNLOAD INSPIRATION INDEX ↓</a></div>`,
  );
}
async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.href);
    toast("World link copied.");
  } catch {
    toast("Copy this page’s address from your browser.");
  }
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
  document
    .querySelectorAll("[data-about]")
    .forEach((b) => (b.onclick = openAbout));
  const modal = $("#modal");
  modal.querySelector("[data-close]").onclick = closeDialog;
  modal.addEventListener("close", () => { reader.dismiss(); activeDialogTrigger?.focus(); });
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
  reader.dismiss();
  renderToken++;
  globe?.dispose();
  globe = null;
  current = null;
  const match = location.pathname.match(/^\/globe\/([^/]+)\/?$/);
  const entry =
    match && registry.entries.find((e) => e.slug === safeDecode(match[1]));
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
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-route]");
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button)
    return;
  const url = new URL(a.href);
  if (url.origin !== location.origin) return;
  e.preventDefault();
  history.pushState({}, "", url.pathname + url.hash);
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
