import test from 'node:test';import assert from 'node:assert/strict';
import {AcceptedUpdateMonitor,validateAcceptedManifest} from '../src/accepted-updates.js';
const world={conceptId:'408',revision:'a'.repeat(64),release:{sha256:'b'.repeat(64),url:`/assets/research/${'b'.repeat(64)}.json`}},manifest={schemaVersion:1,worlds:{408:world}};
test('accepted monitor deduplicates and validates conditional requests without mutating observations',async()=>{
 let finish,calls=0;const monitor=new AcceptedUpdateMonitor({fetchImpl:async(url,options)=>{calls++;assert.equal(url,'/assets/research/accepted-manifest.json');if(calls===1){await new Promise(r=>finish=r);return new Response(JSON.stringify(manifest),{headers:{etag:'"v1"'}});}assert.equal(options.headers['If-None-Match'],'"v1"');return new Response(null,{status:304});}});
 const a=monitor.check(),b=monitor.check();assert.equal(a,b);finish();assert.equal((await a).changed,true);assert.equal((await monitor.check()).changed,false);assert.equal(calls,2);monitor.dispose();
});
test('invalid and oversized pointers fail closed while prior accepted manifest survives',async()=>{
 let n=0;const monitor=new AcceptedUpdateMonitor({fetchImpl:async()=>new Response(++n===1?JSON.stringify(manifest):'x'.repeat(256001))});await monitor.check();await assert.rejects(monitor.check(),/exceeds/);assert.deepEqual(monitor.manifest,manifest);monitor.dispose();
 for(const bad of [{schemaVersion:1,worlds:1},{schemaVersion:1,worlds:true},{schemaVersion:2,worlds:{}},{schemaVersion:1,worlds:{408:{...world,release:{...world.release,url:'https://upstream/candidate'}}}}])assert.throws(()=>validateAcceptedManifest(bad));
});
test('timeout and disposal cancel pending manifest requests',async()=>{
 const fetchImpl=(url,{signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')),{once:true}));
 const monitor=new AcceptedUpdateMonitor({fetchImpl,timeoutMs:5});await assert.rejects(monitor.check(),/aborted/);monitor.dispose();await assert.rejects(monitor.check(),/disposed/);
 const another=new AcceptedUpdateMonitor({fetchImpl});const pending=another.check();another.dispose();await assert.rejects(pending,/aborted/);
});

test('a cached304 cannot complete after disposal',async()=>{
 const monitor=new AcceptedUpdateMonitor({fetchImpl:async()=>new Response(null,{status:304})});monitor.manifest=manifest;const pending=monitor.check();monitor.dispose();await assert.rejects(pending,/cancelled/);
});

test('default fetch retains its global receiver as required by browser host functions',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 globalThis.fetch=async function(){assert.equal(this,globalThis);return new Response(JSON.stringify(manifest));};
 const monitor=new AcceptedUpdateMonitor();
 assert.deepEqual((await monitor.check()).manifest,manifest);
 monitor.dispose();
});
