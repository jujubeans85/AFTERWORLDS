import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { prepareLocalUpdateReview } from './review-updates.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function prepareAppUpdateReview({ projectRoot = root, output } = {}) {
  const directory = output || await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-app-update-review-'));
  await fs.cp(path.join(projectRoot, 'dist'), directory, { recursive: true });
  const modular = await prepareLocalUpdateReview({ projectRoot });
  try {
    await fs.cp(path.join(modular.directory, 'fixtures'), path.join(directory, 'fixtures'), { recursive: true });
    // Copy synthetic assets only: the actual application modules remain the
    // byte-for-byte built application, not a reconstruction of its handlers.
    await fs.cp(path.join(modular.directory, 'assets/research'), path.join(directory, 'assets/research'), { recursive: true });
    await fs.copyFile(path.join(modular.directory, 'fixture-manifest.json'), path.join(directory, 'fixture-manifest.json'));
    const registryPath = path.join(directory, 'assets/registry.json');
    const registry = JSON.parse(await fs.readFile(registryPath));
    const baseline = JSON.parse(await fs.readFile(path.join(directory, 'fixtures/manifest-baseline.json')));
    registry.entries.find(entry => entry.id === '430').research = baseline.worlds['430'];
    // Sharing stays on this isolated origin; it cannot create a production URL.
    registry.publicOrigin = '';
    await fs.writeFile(registryPath, JSON.stringify(registry));
    await fs.writeFile(path.join(directory, 'review.html'), html);
    await fs.writeFile(path.join(directory, 'fixture-controls.js'), controls.replaceAll('__BASELINE_REVISION__', modular.record.baselineRevision));
    return { directory, record: modular.record };
  } finally { await fs.rm(modular.directory, { recursive: true, force: true }); }
}
export async function serveAppUpdateReview(directory, port = 4176) {
  let stage = 'baseline', delayNextRelease = false;
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      if (url.pathname === '/__fixture/stage' && request.method === 'POST') {
        const next = url.searchParams.get('stage');
        if (!['baseline', 'update', 'corrupt', 'delayed'].includes(next)) throw Error('Unknown fixture stage');
        stage = next === 'delayed' ? 'update' : next; delayNextRelease = next === 'delayed';
        response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        response.end(JSON.stringify({ fixtureOnly: true, stage, delayNextRelease })); return;
      }
      let relative = decodeURIComponent(url.pathname);
      if (relative === '/assets/research/accepted-manifest.json') relative = `/fixtures/manifest-${stage}.json`;
      if (relative === '/') relative = '/review.html';
      if (relative.startsWith('/globe/') || relative === '/app') relative = '/index.html';
      const filename = path.resolve(directory, `.${relative}`);
      if (!filename.startsWith(`${path.resolve(directory)}${path.sep}`)) { response.writeHead(403); response.end(); return; }
      const bytes = await fs.readFile(filename);
      if (delayNextRelease && /^\/assets\/research\/[a-f0-9]{64}\.json$/.test(relative)) {
        delayNextRelease = false;
        await new Promise(resolve => setTimeout(resolve, 5000));
        if (response.destroyed) return;
      }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
      response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(bytes);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return server;
}
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ACTUAL APP — SYNTHETIC UPDATE REVIEW</title><style>body{margin:0;background:#10151b;color:#fff;font:14px system-ui}header{padding:12px;border:3px solid #f2ba68}button{min-height:40px;margin:4px}iframe{width:100%;height:80vh;border:0}#status,#location{overflow-wrap:anywhere}</style><header><strong>LOCAL SYNTHETIC FIXTURE — ACTUAL BUILT APP, NO PRODUCTION ACCEPTANCE</strong><p>Only local registry and manifest responses are staged. Application code is unchanged. First-row carbon value changes 641→642 for testing only. Wait at least 30 seconds between checks: the real application throttles them.</p><button data-stage="baseline">STAGE BASELINE</button><button data-stage="update">STAGE SYNTHETIC UPDATE</button><button data-stage="corrupt">STAGE CORRUPT RELEASE</button><button data-stage="delayed">STAGE DELAYED UPDATE (5s)</button><button id="check">FOCUS APP / CHECK</button><button id="home">NAVIGATE APP HOME</button><button id="world">OPEN BASELINE WORLD</button><button id="historical">OPEN HISTORICAL BASELINE</button><button id="location-button">READ APP URL</button><p id="status" role="status">Baseline staged. Apply the offer using the real application's own button.</p><p id="location"></p></header><iframe id="app" title="Actual application with synthetic local data" src="/globe/the-carbon-clock?fixture=preserve-me&amp;row=africa-south1"></iframe><script src="/fixture-controls.js"></script></html>`;
const controls = `const frame=document.querySelector('#app'),status=document.querySelector('#status');
for(const button of document.querySelectorAll('[data-stage]'))button.onclick=async()=>{const result=await fetch('/__fixture/stage?stage='+button.dataset.stage,{method:'POST'}).then(response=>response.json());status.textContent='Local fixture stage: '+result.stage+(result.delayNextRelease?' (next release delayed five seconds)':'')+'. Wait until 30 seconds since last app check, then FOCUS APP / CHECK. No displayed view was changed.';};
document.querySelector('#check').onclick=()=>{frame.contentWindow.focus();frame.contentWindow.dispatchEvent(new Event('focus'));status.textContent='Focused actual app and delivered its normal focus event. Its real 30-second throttle applies; observe the app status and apply button.';};
document.querySelector('#home').onclick=()=>{frame.src='/app';};
document.querySelector('#world').onclick=()=>{frame.src='/globe/the-carbon-clock?fixture=preserve-me&row=africa-south1';};
document.querySelector('#historical').onclick=()=>{frame.src='/globe/the-carbon-clock?fixture=preserve-me&v=__BASELINE_REVISION__&row=africa-south1';};
document.querySelector('#location-button').onclick=()=>{document.querySelector('#location').textContent=frame.contentWindow.location.href;};
`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareAppUpdateReview();
  if (process.argv.includes('--serve')) {
    const port = Number(process.argv.find(value => value.startsWith('--port='))?.split('=')[1] || 4176);
    await serveAppUpdateReview(result.directory, port);
    console.log(JSON.stringify({ ...result, url: `http://127.0.0.1:${port}/` }));
  } else console.log(JSON.stringify(result));
}
