import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {loadAcceptedHistory,validateAcceptedManifest} from '../src/accepted-updates.js';
const hash=text=>createHash('sha256').update(text).digest('hex');
const revision='a'.repeat(64),release='b'.repeat(64);
const summary={conceptId:'408',revision,release:{sha256:release,url:`/assets/research/${release}.json`}};
const index={schemaVersion:1,conceptId:'408',versions:{[revision]:summary}};
const text=JSON.stringify(index),reference={sha256:hash(text),url:`/assets/research/history/${hash(text)}.json`};
test('historical indexes are loaded separately and bound to hash, world and release pointers',async()=>{
 let calls=0;
 const result=await loadAcceptedHistory(reference,'408',{fetchImpl:async url=>{calls++;assert.equal(url,reference.url);return new Response(text);}});
 assert.equal(calls,1);assert.deepEqual(result[revision],summary);
 const manifest={schemaVersion:1,worlds:{408:summary},history:{408:reference}};
 assert.equal(validateAcceptedManifest(manifest),manifest);
 await assert.rejects(loadAcceptedHistory(reference,'430',{fetchImpl:async()=>new Response(text)}),/scope/);
 await assert.rejects(loadAcceptedHistory(reference,'408',{fetchImpl:async()=>new Response(text+' ')}),/integrity/);
 await assert.rejects(loadAcceptedHistory({...reference,url:'https://example.com/history.json'},'408',{fetchImpl:()=>{throw Error('must not fetch');}}),/pointer/);
 const bad=JSON.stringify({...index,versions:{[revision]:{...summary,conceptId:'430'}}}),badRef={sha256:hash(bad),url:`/assets/research/history/${hash(bad)}.json`};
 await assert.rejects(loadAcceptedHistory(badRef,'408',{fetchImpl:async()=>new Response(bad)}),/pointer/);
});
test('history loading is bounded and route cancellation cannot return stale evidence',async()=>{
 await assert.rejects(loadAcceptedHistory(reference,'408',{fetchImpl:async()=>new Response('x'.repeat(256001))}),/limit/);
 const controller=new AbortController();
 await assert.rejects(loadAcceptedHistory(reference,'408',{signal:controller.signal,fetchImpl:async()=>{controller.abort();return new Response(text);}}),/cancelled/);
 await assert.rejects(loadAcceptedHistory(reference,'408',{timeoutMs:5,fetchImpl:(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted'))))}),/aborted/);
});
