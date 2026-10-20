import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { serveLocalReview } from './review-designs.mjs';
import { writeResearchHistory } from './research-runtime.mjs';
import { canonicalReviewedJSON, validateResearchBinding } from '../src/research-data.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

// This creates disposable browser-test data only. It never calls the candidate,
// review, promotion, or activation writers and never edits an accepted pointer.
export async function prepareLocalUpdateReview({ projectRoot = root, output } = {}) {
  const directory = output || await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-update-review-'));
  await fs.mkdir(path.join(directory, 'assets/research'), { recursive: true });
  await fs.mkdir(path.join(directory, 'fixtures'), { recursive: true });
  for (const entry of await fs.readdir(path.join(projectRoot, 'src'), { withFileTypes: true })) {
    if (entry.isFile() && /\.(js|css)$/.test(entry.name)) await fs.copyFile(path.join(projectRoot, 'src', entry.name), path.join(directory, 'assets', entry.name));
  }
  await fs.cp(path.join(projectRoot, 'dist/assets/vendor'), path.join(directory, 'assets/vendor'), { recursive: true });
  const accepted = JSON.parse(await fs.readFile(path.join(projectRoot, 'dist/assets/research/accepted-manifest.json')));
  const baseline = structuredClone(accepted.worlds['430']);
  const baselineBytes = await fs.readFile(path.join(projectRoot, 'dist', baseline.release.url));
  if (digest(baselineBytes) !== baseline.release.sha256) throw Error('Synthetic fixture: baseline integrity failure');
  const original = JSON.parse(baselineBytes);
  await fs.writeFile(path.join(directory, baseline.release.url), baselineBytes);
  delete baseline.narration;
  baseline.fixtureOnly = true;
  baseline.acceptance = { kind: 'local-synthetic-review-fixture', acceptedAt: 'NOT ACCEPTED — BASELINE COPY FOR TEST', lastCheckedAt: 'LOCAL TEST ONLY' };
  const synthetic = structuredClone(original);
  synthetic.dataset.rows[0].value += 1;
  synthetic.dataset.fixtureOnly = true;
  synthetic.dataset.fixtureNotice = 'SYNTHETIC TEST ONLY: first row increased by one native unit; this is not an upstream observation.';
  synthetic.datasetSha256 = digest(JSON.stringify(synthetic.dataset));
  synthetic.design.datasetBindings[0].sha256 = synthetic.datasetSha256;
  synthetic.designSha256 = digest(canonicalReviewedJSON(synthetic.design));
  synthetic.datasetCanonicalSha256 = digest(canonicalReviewedJSON(synthetic.dataset));
  synthetic.revision = digest(`430:${synthetic.datasetSha256}:${synthetic.designSha256}`);
  synthetic.fixtureOnly = true;
  synthetic.authorizesRuntimeActivation = false;
  validateResearchBinding(synthetic);
  const bytes = JSON.stringify(synthetic), hash = digest(bytes);
  const update = { ...baseline, revision: synthetic.revision, datasetSha256: synthetic.datasetSha256, designSha256: synthetic.designSha256,
    release: { url: `/assets/research/${hash}.json`, sha256: hash },
    acceptance: { kind: 'local-synthetic-review-fixture', acceptedAt: 'NOT ACCEPTED — SYNTHETIC UPDATE', lastCheckedAt: 'LOCAL TEST ONLY' } };
  await fs.writeFile(path.join(directory, update.release.url), bytes);
  const history = await writeResearchHistory(directory, '430', { [baseline.revision]: baseline, [update.revision]: update });
  const corruptHash = '0'.repeat(64);
  const corrupt = { ...update, release: { url: `/assets/research/${corruptHash}.json`, sha256: corruptHash } };
  await fs.writeFile(path.join(directory, corrupt.release.url), '{"deliberately":"invalid synthetic release bytes"}');
  for (const [stage, summary] of Object.entries({ baseline, update, corrupt })) {
    await fs.writeFile(path.join(directory, `fixtures/manifest-${stage}.json`), JSON.stringify({
      schemaVersion: 1, fixtureOnly: true, authorizesRuntimeActivation: false,
      worlds: { '430': summary }, history: { '430': history }
    }));
  }
  const record = { schemaVersion: 1, kind: 'local-synthetic-update-review-only', fixtureOnly: true, authorizesRuntimeActivation: false,
    baselineRevision: baseline.revision, syntheticRevision: update.revision, changedRowId: synthetic.dataset.rows[0].id,
    baselineValue: original.dataset.rows[0].value, syntheticValue: synthetic.dataset.rows[0].value, history };
  await fs.writeFile(path.join(directory, 'fixture-manifest.json'), JSON.stringify(record, null, 2));
  await fs.writeFile(path.join(directory, 'index.html'), html);
  await fs.writeFile(path.join(directory, 'review.js'), browser);
  return { directory, record };
}
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SYNTHETIC UPDATE REVIEW ONLY</title><link rel="stylesheet" href="/assets/style.css"><style>body{padding:12px;max-width:1100px;margin:auto}#banner{border:3px solid #f2ba68;padding:16px;background:#332713}nav,.controls{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}button,select{min-height:44px;max-width:100%}.controls label{min-width:0;width:100%}select{width:100%;min-width:0}#globe-host{position:relative;width:100%;height:420px;touch-action:none}#globe-host canvas{display:block}pre{white-space:pre-wrap;overflow-wrap:anywhere}#selection{padding:12px;border:1px solid #52616b}.research-chart{width:100%;height:auto}</style><div id="banner"><strong>LOCAL SYNTHETIC UPDATE FIXTURE — NOT ACCEPTED OR PUBLISHED</strong><p>The first carbon row is deliberately increased by one native unit. This tests browser state and integrity, not new source evidence. The production manifest and review records are untouched.</p></div><h1>Explicit update and immutable history review</h1><p id="status" role="status"></p><nav><button id="offer">OFFER SYNTHETIC UPDATE</button><button id="corrupt">OFFER CORRUPT DOWNLOAD</button><button id="check">CHECK FOR UPDATE</button><button id="apply" disabled>APPLY OFFER</button><button id="history">LOAD VERIFIED HISTORY</button></nav><label>Historical fixture revision<select id="history-picker"></select></label><button id="history-apply" disabled>APPLY HISTORICAL REVISION</button><div class="controls"><label>Observation<select id="picker"></select></label><button id="focus">FOCUS SELECTED</button><button id="flip">OTHER SIDE</button><button id="read">READ MODE</button><button id="pause">PAUSE FRAME</button></div><div id="globe-host"></div><section id="selection"></section><h2>Observable retained state</h2><pre id="state"></pre><h2>Static equivalent</h2><section id="static"></section><h2>Exact rows</h2><section id="table"></section><script type="module" src="/review.js"></script></html>`;
const browser = `import {AcceptedUpdateMonitor,loadAcceptedHistory} from '/assets/accepted-updates.js';
import {loadResearchWorld} from '/assets/research-data.js';
import {ResearchGlobe} from '/assets/research-view.js';
import {researchSelectionHTML,researchChartSVG,researchTableHTML} from '/assets/research-ui.js';
const $=selector=>document.querySelector(selector);
let stage='baseline',current,summary,globe,selectedId,readMode=false,offer,history={},latestManifest;
const fetchImpl=(url,options)=>fetch(url==='/assets/research/accepted-manifest.json'?'/fixtures/manifest-'+stage+'.json':url,options);
const monitor=new AcceptedUpdateMonitor({fetchImpl});
const status=text=>{$('#status').textContent=text;};
const showState=()=>{$('#state').textContent=JSON.stringify({fixtureOnly:true,revision:current?.revision,selectedRowId:selectedId,selectedValue:current?.rows.find(row=>row.id===selectedId)?.value,readMode,camera:globe?.snapshotCamera(),offeredRevision:offer?.revision||null},null,2);};
const inspect=(row,index)=>{selectedId=row?.id;$('#picker').value=String(index);$('#selection').innerHTML=researchSelectionHTML(row,current);showState();};
async function apply(next){
 const research=await loadResearchWorld(next,{fetchImpl});
 const camera=globe?.snapshotCamera(),priorSelected=selectedId,paused=globe?.paused;
 globe?.dispose();current=research;summary=next;
 $('#picker').replaceChildren();
 for(const [index,row] of research.rows.entries()){const option=document.createElement('option');option.value=index;option.textContent=row.name+' · '+row.id;$('#picker').append(option);}
 globe=new ResearchGlobe($('#globe-host'),{entry:{id:'430',newTitle:'SYNTHETIC UPDATE REVIEW — '+research.design.title},research,onSelect:inspect});
 if(camera)globe.restoreCamera(camera);globe.setReadMode(readMode);if(paused!==undefined)globe.pause(paused);
 globe.select(Math.max(0,research.rows.findIndex(row=>row.id===priorSelected)));
 $('#static').innerHTML=researchChartSVG(research);$('#table').innerHTML=researchTableHTML(research);
 offer=null;$('#apply').disabled=true;showState();
}
async function check(){const result=await monitor.check();latestManifest=result.manifest;const next=result.manifest.worlds['430'];offer=next.revision!==current?.revision||next.release.sha256!==summary?.release.sha256?next:null;$('#apply').disabled=!offer;status(offer?'Fixture update offered; current view remains unchanged until APPLY.':'Fixture check complete; no new revision.');showState();}
$('#offer').onclick=()=>{stage='update';status('Synthetic update staged. CHECK FOR UPDATE reads its fixture pointer.');};
$('#corrupt').onclick=()=>{stage='corrupt';status('Corrupt bytes staged. CHECK, then APPLY must fail while retaining the current view.');};
$('#check').onclick=()=>check().catch(error=>status(error.message));
$('#apply').onclick=async()=>{try{await apply(offer);status('Synthetic fixture revision applied explicitly.');}catch(error){status('APPLY FAILED — previous view retained: '+error.message);showState();}};
$('#history').onclick=async()=>{try{history=await loadAcceptedHistory(latestManifest.history['430'],'430',{fetchImpl});$('#history-picker').replaceChildren();for(const revision of Object.keys(history)){const option=document.createElement('option');option.value=revision;option.textContent=(history[revision].acceptance.acceptedAt)+' · '+revision;$('#history-picker').append(option);}$('#history-apply').disabled=false;status('Immutable fixture history verified; choose a revision then apply explicitly.');}catch(error){status(error.message);}};
$('#history-apply').onclick=async()=>{try{await apply(history[$('#history-picker').value]);status('Historical fixture revision applied explicitly.');}catch(error){status('HISTORY APPLY FAILED — previous view retained: '+error.message);}};
$('#picker').onchange=()=>globe.select(Number($('#picker').value));
$('#focus').onclick=()=>{globe.focusSelection();showState();};$('#flip').onclick=()=>{globe.flip();showState();};
$('#read').onclick=()=>{readMode=!readMode;globe.setReadMode(readMode);$('#read').textContent=readMode?'MOVE MODE':'READ MODE';showState();};
$('#pause').onclick=()=>{globe.pause(!globe.paused);$('#pause').textContent=globe.paused?'PLAY FRAME':'PAUSE FRAME';showState();};
$('#table').onclick=event=>{const button=event.target.closest('[data-research-select]');if(button)globe.select(Number(button.dataset.researchSelect));};
window.addEventListener('pagehide',()=>{monitor.dispose();globe?.dispose();},{once:true});
try{const result=await monitor.check();latestManifest=result.manifest;await apply(result.manifest.worlds['430']);status('Baseline copy loaded. All subsequent updates here are synthetic test data.');}catch(error){status('FIXTURE ERROR: '+error.message);}
`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareLocalUpdateReview();
  if (process.argv.includes('--serve')) {
    const port = Number(process.argv.find(value => value.startsWith('--port='))?.split('=')[1] || 4175);
    await serveLocalReview(result.directory, port);
    console.log(JSON.stringify({ ...result, url: `http://127.0.0.1:${port}/` }));
  } else console.log(JSON.stringify(result));
}
