import { previewPNG } from './share-previews.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { prepareDesignAmendment } from './research-design-amendments.mjs';
import { validateResearchBinding, canonicalReviewedJSON } from '../src/research-data.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export async function prepareLocalDesignReview({ projectRoot = root, output } = {}) {
  const directory = output || await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-design-review-'));
  await fs.mkdir(path.join(directory, 'assets'), { recursive: true });
  // Production build copies these source modules without transformation. The
  // fixture uses the same modules but does not copy app data or accepted pointers.
  for (const entry of await fs.readdir(path.join(projectRoot, 'src'), { withFileTypes: true })) {
    if (entry.isFile() && /\.(js|css)$/.test(entry.name)) await fs.copyFile(path.join(projectRoot, 'src', entry.name), path.join(directory, 'assets', entry.name));
  }
  await fs.cp(path.join(projectRoot, 'dist/assets/vendor'), path.join(directory, 'assets/vendor'), { recursive: true });
  const registry = JSON.parse(await fs.readFile(path.join(projectRoot, 'research/designs/design-registry.json')));
  const records = [];
  for (const conceptId of ['74', '156-8']) {
    const original = registry.designs.find(item => item.conceptId === conceptId), binding = original.datasetBindings[0];
    const bytes = await fs.readFile(path.join(projectRoot, binding.path));
    if (sha256(bytes) !== binding.sha256) throw Error('Review fixture: stale frozen source');
    const dataset = JSON.parse(bytes), amendment = await prepareDesignAmendment(projectRoot, conceptId, original, binding.sha256, directory);
    const design = amendment.design, rows = validateResearchBinding({ conceptId, design, dataset, datasetSha256: binding.sha256 });
    const fixtureId = sha256(`local-review-only:${conceptId}:${binding.sha256}:${amendment.designSha256}:${amendment.amendmentSha256}`);
    const research = { conceptId, title: design.title, question: design.question, design, dataset, rows, geography: null,
      datasetSha256: binding.sha256, datasetCanonicalSha256: sha256(canonicalReviewedJSON(dataset)), designSha256: amendment.designSha256,
      designAmendment: amendment.summary, designAmendmentEvidence: amendment.record, designAmendmentSha256: amendment.amendmentSha256,
      revision: fixtureId, fixtureOnly: true, authorizesRuntimeActivation: false,
      acceptance: { kind: 'local-review-fixture', acceptedAt: 'NOT ACTIVATED — LOCAL REVIEW FIXTURE', lastCheckedAt: 'Frozen source verification only' },
      marks: rows.map((row, index) => ({ row, index, kind: 'native-ruler', fraction: row.value / 100, value: row.value })) };
    await fs.mkdir(path.join(directory, 'fixtures'), { recursive: true });
    await fs.writeFile(path.join(directory, `fixtures/${conceptId}.json`), JSON.stringify(research));
    await fs.writeFile(path.join(directory, `fixtures/${conceptId}.png`), previewPNG({ id: conceptId, newTitle: design.title, research: { observationPeriod: dataset.time } }, research));
    records.push({ conceptId, fixtureId, amendmentSha256: amendment.amendmentSha256, datasetSha256: binding.sha256, designSha256: amendment.designSha256 });
  }
  await fs.writeFile(path.join(directory, 'fixture-manifest.json'), JSON.stringify({ schemaVersion: 1, kind: 'local-design-review-only', createdAt: new Date().toISOString(), authorizesRuntimeActivation: false, records }, null, 2));
  await fs.writeFile(path.join(directory, 'index.html'), html);
  await fs.writeFile(path.join(directory, 'review.js'), browser);
  return { directory, records };
}
export async function serveLocalReview(directory, port = 4174) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png' };
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1'), relative = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const filename = path.resolve(directory, `.${relative}`);
      if (!filename.startsWith(`${path.resolve(directory)}${path.sep}`)) { response.writeHead(403); response.end(); return; }
      const bytes = await fs.readFile(filename);
      response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(bytes);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return server;
}
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LOCAL DESIGN REVIEW — NOT ACTIVATED</title><link rel="stylesheet" href="/assets/style.css"><style>body{margin:0;padding:16px;max-width:1200px;margin:auto}#fixture-banner{padding:16px;border:3px solid #f2ba68;background:#332713;font-weight:bold}nav,.fixture-controls{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}.fixture-controls label{min-width:0;max-width:100%;width:100%}#picker{min-width:0;max-width:100%;width:100%}button,select{min-height:44px;max-width:100%}#globe-host{position:relative;width:100%;height:480px;background:#101a22;touch-action:none}#globe-host canvas{display:block}#selection{padding:16px;border:1px solid #52616b}.research-chart{width:100%;height:auto}.table-note{display:block}main{min-width:0}#status{white-space:pre-wrap}@media(max-width:500px){body{padding:8px}#globe-host{height:360px}}</style><div id="fixture-banner">LOCAL REVIEW FIXTURE — NOT ACTIVATED<br>Scientific correction staging only. No accepted release, runtime approval or production publication is created.</div><nav><a href="/?concept=74">Review 74</a><a href="/?concept=156-8">Review 156-8</a><a href="/fixture-manifest.json">Fixture identity record</a></nav><main><h1 id="title"></h1><p id="question"></p><p id="status" role="status"></p><section id="guidance"></section><div class="fixture-controls"><label>Observation <select id="picker"></select></label><button id="focus">FOCUS SELECTED</button><button id="flip">OTHER SIDE</button><button id="next">NEXT OBSERVATION</button><button id="clear">CLEAR SELECTION</button><button id="pause">PAUSE FRAME</button><button id="read">READ MODE</button><button id="static">SHOW STATIC EQUIVALENT</button></div><div id="globe-host" aria-label="Local review research globe"></div><section id="selection" aria-live="polite"></section><section id="static-chart" hidden></section><h2>Local preview PNG — not activated</h2><p>This preview is review evidence only. It is not published as an accepted release.</p><img id="preview" style="width:100%;height:auto" alt="Local review preview PNG"><h2>Native scale</h2><section id="scale"></section><h2>Exact selected source rows</h2><section id="table"></section><h2>Source and proposed correction evidence</h2><section id="sources"></section></main><script type="module" src="/review.js"></script></html>`;
const browser = `import {ResearchGlobe} from '/assets/research-view.js';
import {researchSelectionHTML,researchTableHTML,researchSourcesHTML,researchScaleHTML,researchChartSVG,researchPresentation} from '/assets/research-ui.js';
const $=selector=>document.querySelector(selector),id=new URLSearchParams(location.search).get('concept')||'74';
let globe,selected=-1,readMode=false;
try{
 if(!['74','156-8'].includes(id))throw Error('Unsupported local review fixture');
 const research=await fetch('/fixtures/'+id+'.json').then(response=>response.json());
 if(!research.fixtureOnly||research.authorizesRuntimeActivation!==false)throw Error('Not a review-only fixture');
 $('#title').textContent=research.design.title+' — '+id;$('#question').textContent=research.design.question;
 $('#status').textContent='LOCAL REVIEW ONLY · '+research.rows.length+' selected rows; '+research.dataset.rows.length+' original source rows. Fixture '+research.revision;
 const presentation=researchPresentation(research);for(const key of ['explanation','invitation','boundary']){const p=document.createElement('p');p.textContent=presentation[key]||'';$('#guidance').append(p);}
 $('#preview').src='/fixtures/'+id+'.png';
 $('#scale').innerHTML=researchScaleHTML(research);$('#table').innerHTML=researchTableHTML(research);
 $('#sources').innerHTML=researchSourcesHTML(research).replace('Accepted research revision:','Local review fixture identifier (not accepted):');
 $('#static-chart').innerHTML=researchChartSVG(research);
 for(const [index,row] of research.rows.entries()){const option=document.createElement('option');option.value=index;option.textContent=row.name+' · '+row.id;$('#picker').append(option);}
 const inspect=(row,index)=>{selected=index;$('#picker').value=String(index);$('#selection').innerHTML=researchSelectionHTML(row,research);};
 globe=new ResearchGlobe($('#globe-host'),{entry:{id,newTitle:research.design.title},research,onSelect:inspect,onMotion:paused=>{$('#pause').textContent=paused?'PLAY FRAME':'PAUSE FRAME';}});
 globe.select(0);$('#picker').onchange=()=>globe.select(Number($('#picker').value));
 $('#table').addEventListener('click',event=>{const button=event.target.closest('[data-research-select]');if(button)globe.select(Number(button.dataset.researchSelect));});
 $('#focus').onclick=()=>globe.focusSelection();$('#flip').onclick=()=>globe.flip();$('#next').onclick=()=>globe.select((selected+1)%research.rows.length);$('#clear').onclick=()=>{globe.clearSelection();selected=-1;$('#selection').innerHTML=researchSelectionHTML(null,research);};
 $('#pause').onclick=()=>globe.pause(!globe.paused);$('#read').onclick=()=>{readMode=!readMode;globe.setReadMode(readMode);$('#read').textContent=readMode?'MOVE MODE':'READ MODE';};
 $('#static').onclick=()=>{$('#static-chart').hidden=!$('#static-chart').hidden;$('#static').textContent=$('#static-chart').hidden?'SHOW STATIC EQUIVALENT':'HIDE STATIC EQUIVALENT';};
 window.addEventListener('pagehide',()=>globe?.dispose(),{once:true});
}catch(error){$('#status').textContent='REVIEW FIXTURE ERROR: '+error.message;console.error(error);}
`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareLocalDesignReview();
  if (process.argv.includes('--serve')) {
    const port = Number(process.argv.find(value => value.startsWith('--port='))?.split('=')[1] || 4174);
    await serveLocalReview(result.directory, port);
    console.log(JSON.stringify({ ...result, url: `http://127.0.0.1:${port}/?concept=74`, status: 'LOCAL REVIEW FIXTURE — NOT ACTIVATED' }));
  } else console.log(JSON.stringify(result));
}
