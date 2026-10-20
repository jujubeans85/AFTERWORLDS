import {researchSha256} from './research-data.js';
// Only an application-controlled accepted manifest is polled; upstream candidates never reach the scene.
const HASH=/^[a-f0-9]{64}$/;
export function validateAcceptedManifest(value) {
 if(value?.schemaVersion!==1||!value.worlds||typeof value.worlds!=='object'||Array.isArray(value.worlds)||Object.keys(value.worlds).length>73)throw Error('Invalid accepted manifest');
 for(const [id,world] of Object.entries(value.worlds)) {
  if(world.conceptId!==id||!HASH.test(world.revision||'')||!HASH.test(world.release?.sha256||'')||world.release.url!==`/assets/research/${world.release.sha256}.json`)throw Error('Invalid accepted release pointer');
 }
 if(value.history!==undefined){
  if(!value.history||typeof value.history!=='object'||Array.isArray(value.history)||Object.keys(value.history).length>73)throw Error('Invalid history pointers');
  for(const [id,ref] of Object.entries(value.history))if(!value.worlds[id]||!HASH.test(ref?.sha256||'')||ref.url!==`/assets/research/history/${ref.sha256}.json`)throw Error('Invalid history pointer');
 }
 if(value.versions!==undefined){
  if(!value.versions||typeof value.versions!=='object'||Array.isArray(value.versions))throw Error('Invalid accepted history');
  for(const [id,versions] of Object.entries(value.versions)){
   if(!versions||typeof versions!=='object'||Array.isArray(versions))throw Error('Invalid accepted history');
   for(const [revision,world] of Object.entries(versions)){if(world.revision!==revision||!HASH.test(revision))throw Error('Invalid historical revision');validateAcceptedManifest({schemaVersion:1,worlds:{[id]:world}});}
  }
 }
 return value;
}
export class AcceptedUpdateMonitor {
 constructor({fetchImpl=globalThis.fetch.bind(globalThis),now=()=>new Date().toISOString(),timeoutMs=8000}={}) {this.fetchImpl=fetchImpl;this.now=now;this.timeoutMs=timeoutMs;this.pending=null;this.etag=null;this.manifest=null;this.disposed=false;}
 check() {
  if(this.disposed)return Promise.reject(Error('Update monitor disposed'));
  if(this.pending)return this.pending;
  const controller=new AbortController();this.controller=controller;
  const timer=setTimeout(()=>controller.abort(),this.timeoutMs);
  this.pending=(async()=>{
   const response=await this.fetchImpl('/assets/research/accepted-manifest.json',{signal:controller.signal,cache:'no-cache',credentials:'same-origin',redirect:'error',headers:{Accept:'application/json',...(this.etag?{'If-None-Match':this.etag}:{})}});
   if(controller.signal.aborted||this.disposed)throw Error('Accepted manifest request cancelled');
   if(response.status===304&&this.manifest)return {manifest:this.manifest,checkedAt:this.now(),changed:false};
   if(!response.ok)throw Error(`Accepted manifest HTTP ${response.status}`);
   if(!response.body)throw Error('Missing manifest body');
   const reader=response.body.getReader();let size=0,chunks=[];
   try {for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>256000){await reader.cancel();throw Error('Accepted manifest exceeds limit');}chunks.push(value);}} finally {reader.releaseLock();}
   if(controller.signal.aborted||this.disposed)throw Error('Accepted manifest request cancelled');
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   const manifest=validateAcceptedManifest(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));
   const changed=JSON.stringify(manifest)!==JSON.stringify(this.manifest);
   this.manifest=manifest;this.etag=response.headers.get('etag');return {manifest,checkedAt:this.now(),changed};
  })().finally(()=>{clearTimeout(timer);this.pending=null;this.controller=null;});
  return this.pending;
 }
 dispose(){this.disposed=true;this.controller?.abort();}
}


export async function loadAcceptedHistory(reference,conceptId,{fetchImpl=globalThis.fetch.bind(globalThis),signal,timeoutMs=8000}={}){
 if(!HASH.test(reference?.sha256||'')||reference.url!==`/assets/research/history/${reference.sha256}.json`)throw Error('Invalid history pointer');
 const controller=new AbortController(),abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
 const timer=setTimeout(abort,timeoutMs);
 try {
  const response=await fetchImpl(reference.url,{signal:controller.signal,credentials:'same-origin',redirect:'error',cache:'force-cache'});
  if(!response.ok||!response.body)throw Error('Accepted history unavailable');
  const reader=response.body.getReader(),chunks=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>256000){await reader.cancel();throw Error('Accepted history exceeds limit');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  if(await researchSha256(bytes)!==reference.sha256)throw Error('Accepted history integrity failure');
  const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(data.schemaVersion!==1||data.conceptId!==conceptId||!data.versions||typeof data.versions!=='object'||Array.isArray(data.versions))throw Error('Accepted history scope mismatch');
  validateAcceptedManifest({schemaVersion:1,worlds:{},versions:{[conceptId]:data.versions}});
  if(controller.signal.aborted)throw Error('Accepted history request cancelled');
  return data.versions;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
