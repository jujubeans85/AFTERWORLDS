import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function hashes(directory, relative = '') {
  const result = {};
  for (const entry of await fs.readdir(path.join(directory, relative), { withFileTypes: true })) {
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) Object.assign(result, await hashes(directory, name));
    else if (entry.isFile()) result[name.replaceAll(path.sep, '/')] = sha256(await fs.readFile(path.join(directory, name)));
    else throw Error('Lifecycle fixture does not copy symbolic links');
  }
  return result;
}
export async function prepareLifecycleReview({ projectRoot = root, output } = {}) {
  const directory = path.resolve(output || await fs.mkdtemp(path.join(os.tmpdir(), 'afterworld-lifecycle-review-')));
  if (directory === path.resolve(projectRoot) || directory.startsWith(`${path.resolve(projectRoot)}${path.sep}`)) throw Error('Lifecycle output must be outside the source project');
  const dist = path.join(projectRoot, 'dist'), sourceHashes = await hashes(dist);
  await fs.cp(dist, directory, { recursive: true });
  const copiedHashes = await hashes(directory);
  if (JSON.stringify(sourceHashes) !== JSON.stringify(copiedHashes)) throw Error('Built application changed during fixture copy');
  const registry = JSON.parse(await fs.readFile(path.join(directory, 'assets/registry.json')));
  const ids = ['378', '408', '117', '333', '365', '394', '74', '430'];
  const routes = ids.map(id => {
    const entry = registry.entries.find(item => item.id === id);
    if (!entry?.research) throw Error(`Missing built native route ${id}`);
    return { id, kind: 'native', path: `/globe/${entry.slug}`, releaseSha256: entry.research.release.sha256 };
  });
  for (const entry of registry.entries.filter(item => item.dataset && !item.research).slice(0, 2)) routes.push({ id: entry.id, kind: 'legacy', path: `/globe/${entry.slug}` });
  if (routes.length !== 10) throw Error('Lifecycle review needs two legacy routes');
  const original = await fs.readFile(path.join(directory, 'index.html'), 'utf8');
  const appTag = '<script type="module" src="/assets/app.js"></script>';
  if (original.split(appTag).length !== 2) throw Error('Expected exactly one built application entry');
  await fs.writeFile(path.join(directory, 'index.html'), original.replace(appTag, '<script type="module" src="/lifecycle-review.js"></script>'));
  await fs.writeFile(path.join(directory, 'lifecycle-review.js'), lifecycleBrowserSource);
  const record = { schemaVersion: 1, kind: 'local-browser-lifecycle-review', createdAt: new Date().toISOString(),
    sourceHashes, instrumentationSha256: sha256(lifecycleBrowserSource), injectedIndexSha256: sha256(await fs.readFile(path.join(directory, 'index.html'))), routes,
    limitations: 'Scheduling and renderer counters are proxies. No GPU timing, heap measurement, hardware, field, production, or listening certification. Application modules and source data are unchanged.' };
  await fs.writeFile(path.join(directory, 'lifecycle-fixture.json'), JSON.stringify(record));
  return { directory, record };
}
export async function serveLifecycleReview(directory, port = 4178) {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const relative = url.pathname === '/' || url.pathname.startsWith('/globe/') ? '/index.html' : decodeURIComponent(url.pathname);
      const filename = path.resolve(directory, `.${relative}`);
      if (!filename.startsWith(`${path.resolve(directory)}${path.sep}`)) { response.writeHead(403); response.end(); return; }
      const bytes = await fs.readFile(filename);
      response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(bytes);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return server;
}

// All retained report entries are scalar snapshots. The only strong instance
// references are in active, and disposal deletes them even when it throws.
export const lifecycleBrowserSource = `import {Globe} from '/assets/globe.js';
import {ResearchGlobe} from '/assets/research-view.js';
const active=new Set(),metadata=new WeakMap();
let nextId=0,running=false,sequence=0;
const report={schemaVersion:1,kind:'local-browser-lifecycle-review',startedAt:new Date().toISOString(),userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,limitations:'Renderer resource counts and RAF fields are scheduling proxies, not GPU timing, heap or hardware measurements. No field or production certification.',samples:[],disposals:[],contextEvents:[],errors:[],maxActive:0,maxCanvas:0};
const error=(kind,value)=>report.errors.push({kind,message:String(value?.message||value),stack:typeof value?.stack==='string'?value.stack:null,path:location.pathname,at:performance.now()});
window.addEventListener('error',event=>error('window-error',event.error||event.message));
window.addEventListener('unhandledrejection',event=>error('unhandled-rejection',event.reason));
for(const type of ['webglcontextlost','webglcontextrestored'])document.addEventListener(type,event=>report.contextEvents.push({type,at:performance.now(),path:location.pathname,statusMessage:event.statusMessage||'',canvasConnected:Boolean(event.target?.isConnected)}),true);
function observe(instance,kind){
 let data=metadata.get(instance);
 if(!data){data={id:++nextId,kind,wakes:0,frames:0,createdAt:performance.now(),createdPath:location.pathname};metadata.set(instance,data);}
 if(!instance.disposed)active.add(instance);
 report.maxActive=Math.max(report.maxActive,active.size);report.maxCanvas=Math.max(report.maxCanvas,document.querySelectorAll('canvas').length);
 return data;
}
function snapshot(instance){
 const data=metadata.get(instance),info=instance.renderer?.info;
 return {...data,at:performance.now(),path:location.pathname,disposed:Boolean(instance.disposed),paused:Boolean(instance.paused),visible:instance.visible??null,
  rafHandleNonzero:Boolean(instance.raf),rafField:instance.raf??null,rafMeaning:'Field proxy only; a canceled handle may remain nonzero after disposal',
  cleanupLength:instance.cleanup?.length??null,canvasConnected:Boolean(instance.canvas?.isConnected),activeCount:active.size,canvasCount:document.querySelectorAll('canvas').length,
  renderer:{frame:info?.render?.frame??null,drawCalls:info?.render?.calls??null,triangles:info?.render?.triangles??null,points:info?.render?.points??null,lines:info?.render?.lines??null,geometries:info?.memory?.geometries??null,textures:info?.memory?.textures??null,programs:info?.programs?.length??null}};
}
for(const [Class,kind] of [[Globe,'legacy'],[ResearchGlobe,'native']]){
 for(const name of ['wake','frame','dispose']){
  const original=Class.prototype[name];
  Class.prototype[name]=function(...args){
   const data=observe(this,kind);
   if(name==='wake')data.wakes++;if(name==='frame')data.frames++;
   const before=name==='dispose'?snapshot(this):null;
   try{return original.apply(this,args);}catch(caught){error(kind+'.'+name,caught);throw caught;}
   finally{if(name==='dispose'){active.delete(this);report.disposals.push({before,after:snapshot(this)});metadata.delete(this);}}
  };
 }
}
const fixture=await fetch('/lifecycle-fixture.json').then(response=>response.json());report.fixture=fixture;
const panel=document.createElement('aside');panel.id='lifecycle-review-controls';
panel.style.cssText='position:fixed;z-index:2147483647;right:8px;top:8px;max-width:min(430px,92vw);background:#18232c;color:white;border:2px solid #f2ba68;padding:10px;font:12px system-ui';
panel.innerHTML='<strong>LOCAL REVIEW — LIFECYCLE PROXIES ONLY</strong><p>50 real SPA route changes. Keep this tab visible. No source or application module changes.</p><button id="lifecycle-run">RUN 50 ROUTE CHANGES</button><button id="lifecycle-snapshot">SNAPSHOT</button><button id="lifecycle-loss">LOSE ACTIVE GRAPHICS CONTEXT</button><button id="lifecycle-home">HOME</button><button id="lifecycle-legacy">LEGACY WORLD</button><button id="lifecycle-native">NATIVE WORLD</button><button id="lifecycle-export">EXPORT JSON</button><pre id="lifecycle-status" style="white-space:pre-wrap;max-height:180px;overflow:auto"></pre>';
document.body.append(panel);
const status=text=>panel.querySelector('#lifecycle-status').textContent=text;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function ensureVisible(){if(document.hidden)throw Error('Review tab became hidden; run cannot establish visible scheduling behavior');}
async function until(predicate,timeout=8000){const start=performance.now();for(;;){ensureVisible();if(predicate())return;if(performance.now()-start>timeout)throw Error('Timed out waiting for real route/scene');await sleep(25);}}
function navigate(route){const anchor=document.createElement('a');anchor.href=route;anchor.dataset.route='';anchor.textContent='Local lifecycle route';anchor.style.display='none';document.body.append(anchor);anchor.click();anchor.remove();}
function currentFor(route){return [...active].find(instance=>!instance.disposed&&instance.canvas?.isConnected&&metadata.get(instance)?.createdPath===route);}
panel.querySelector('#lifecycle-run').onclick=async()=>{
 if(running)return;running=true;panel.querySelector('#lifecycle-run').disabled=true;
 report.runStartedAt=new Date().toISOString();report.runStart=performance.now();report.completed=false;
 try{
  for(let index=0;index<50;index++){
   ensureVisible();if(performance.now()-report.runStart>130000)throw Error('Run exceeded 130-second bounded review window');
   const route=fixture.routes[index%fixture.routes.length];status('Route '+(index+1)+'/50: '+route.path);
   const previousDisposals=report.disposals.length;const started=performance.now();
   navigate(route.path);
   await until(()=>currentFor(route.path)&&document.querySelector('#globe-host canvas'));
   document.querySelector('#globe-host').scrollIntoView({block:'center',behavior:'instant'});
   await until(()=>currentFor(route.path)?.visible===true);
   let instance=currentFor(route.path);instance.pause(false);
   await sleep(300);ensureVisible();const moving=snapshot(instance);
   instance.pause(true);await sleep(250);const pausedStart=snapshot(instance);
   await sleep(250);ensureVisible();const pausedEnd=snapshot(instance);
   const sample={sequence:++sequence,index,route,elapsedMs:performance.now()-started,moving,pausedStart,pausedEnd,
    stablePausedFrames:pausedStart.renderer.frame===pausedEnd.renderer.frame,stablePausedCallbacks:pausedStart.frames===pausedEnd.frames,
    oneCanvas:pausedEnd.canvasCount===1,oneActive:pausedEnd.activeCount===1,disposalsSinceNavigation:report.disposals.length-previousDisposals,
    viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio}};
   report.samples.push(sample);instance=null;
   if(!sample.oneCanvas||!sample.oneActive||!sample.stablePausedFrames||!sample.stablePausedCallbacks)throw Error('Lifecycle invariant failed at '+route.path);
  }
  report.completed=true;report.runEndedAt=new Date().toISOString();report.elapsedMs=performance.now()-report.runStart;
  status('Completed 50 routes in '+(report.elapsedMs/1000).toFixed(1)+'s. '+report.errors.length+' observed errors. Export JSON for scoped review.');
 }catch(caught){error('run',caught);report.runEndedAt=new Date().toISOString();status('STOPPED: '+caught.message+' — export includes partial evidence.');}
 finally{running=false;panel.querySelector('#lifecycle-run').disabled=false;}
};
panel.querySelector('#lifecycle-home').onclick=()=>navigate('/');
panel.querySelector('#lifecycle-legacy').onclick=()=>navigate(fixture.routes.find(route=>route.kind==='legacy').path);
panel.querySelector('#lifecycle-native').onclick=()=>navigate(fixture.routes.find(route=>route.kind==='native').path);
panel.querySelector('#lifecycle-loss').onclick=async()=>{
 if(running){status('Finish the route run before a deliberate context-loss check.');return;}
 const before=[...active].map(snapshot);let instance=[...active].find(item=>item.canvas?.isConnected);
 if(!instance){status('No active graphics context to lose.');return;}
 const eventCount=report.contextEvents.length;instance.renderer.forceContextLoss();instance=null;
 try{await until(()=>report.contextEvents.length>eventCount,2000);await sleep(250);}catch(caught){error('context-loss',caught);status(caught.message);return;}
 const sample={manualContextLoss:true,sequence:++sequence,before,after:[...active].map(snapshot),canvasCount:document.querySelectorAll('canvas').length,staticVisible:[...document.querySelectorAll('#research-static, #legacy-static')].some(node=>!node.hidden),visibleFallbackText:document.querySelector('#globe-host')?.innerText||'',path:location.pathname};report.samples.push(sample);status(JSON.stringify(sample,null,2));
};
panel.querySelector('#lifecycle-snapshot').onclick=()=>{const sample={manual:true,sequence:++sequence,at:performance.now(),instances:[...active].map(snapshot)};report.samples.push(sample);status(JSON.stringify(sample,null,2));};
panel.querySelector('#lifecycle-export').onclick=()=>{const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='afterworld-local-lifecycle-'+Date.now()+'.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
status('Instrumentation installed before application import. Ready after app loads.');
await import('/assets/app.js');
`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareLifecycleReview();
  if (process.argv.includes('--serve')) {
    const port = Number(process.argv.find(value => value.startsWith('--port='))?.split('=')[1] || 4178);
    await serveLifecycleReview(result.directory, port);
    console.log(JSON.stringify({ directory: result.directory, url: `http://127.0.0.1:${port}/`, routes: result.record.routes, instrumentationSha256: result.record.instrumentationSha256 }));
  } else console.log(JSON.stringify({ directory: result.directory, routes: result.record.routes, instrumentationSha256: result.record.instrumentationSha256 }));
}
