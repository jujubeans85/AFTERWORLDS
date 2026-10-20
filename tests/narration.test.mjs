import test from 'node:test';
import assert from 'node:assert/strict';
import {VoicePriority,RecordedNarrator,validateNarration,loadNarration} from '../src/narration.js';
import {researchSha256} from '../src/research-data.js';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {prepareNarration} from '../scripts/narration-runtime.mjs';

async function fixture() {
  const bytes=new Uint8Array([73,68,51,1,2,3]);
  const research={conceptId:'408',revision:'a'.repeat(64),datasetSha256:'b'.repeat(64),designSha256:'c'.repeat(64),dataset:{sources:[{sourceId:'wdi-electricity'}]}};
  const transcript='Basic electricity access is not a measure of AI use.';
  const transcriptSha256=await researchSha256(transcript),sha256=await researchSha256(bytes);
  const record={schemaVersion:1,conceptId:research.conceptId,revision:research.revision,datasetSha256:research.datasetSha256,designSha256:research.designSha256,transcript,transcriptSha256,citations:['wdi-electricity'],audio:{sha256,url:`/assets/narration/${sha256}.mp3`,voice:'Synthetic test fixture',synthetic:true,review:{status:'accepted',transcriptSha256,datasetSha256:research.datasetSha256,designSha256:research.designSha256,audioSha256:sha256,reviewer:'Test-only fixture',listeningApproved:true}}};
  const events=[],audio=[];
  const env={fetch:async()=>new Response(bytes),URL:{createObjectURL:()=>{events.push('created');return 'blob:test';},revokeObjectURL:()=>events.push('revoked')},Audio:class {
    constructor(){audio.push(this);}
    async play(){events.push('play');}
    pause(){events.push('pause');}
    removeAttribute(name){assert.equal(name,'src');events.push('source-removed');}
    load(){events.push('load');}
  }};
  return {bytes,research,record,events,audio,env};
}

test('narration rejects stale evidence, transcript edits, unresolved citations and unreviewed audio',async()=>{
  const {record,research}=await fixture();
  assert.equal(await validateNarration(record,research),record);
  for(const bad of [
    {...record,revision:'d'.repeat(64)},
    {...record,transcript:record.transcript+' Changed'},
    {...record,citations:['unknown-source']},
    {...record,audio:{...record.audio,review:{...record.audio.review,listeningApproved:false}}},
    {...record,audio:{...record.audio,url:'https://elsewhere/audio.mp3'}},
  ]) await assert.rejects(validateNarration(bad,research));
});

test('voice handoff releases the previous speaker and recorded playback cleans its URL exactly once',async()=>{
  const {record,research,env,events,audio}=await fixture();
  const changes=[],priority=new VoicePriority(active=>changes.push(active));
  let ttsStopped=0;priority.claim('tts',()=>{ttsStopped++;priority.release('tts');});
  const narrator=new RecordedNarrator({priority,env});
  await narrator.play(record,research);
  assert.equal(ttsStopped,1);assert.equal(priority.owner,'recording');assert.equal(events.filter(e=>e==='play').length,1);
  audio[0].onended();narrator.stop();
  assert.equal(priority.owner,null);assert.equal(events.filter(e=>e==='revoked').length,1);
  assert.equal(events.filter(e=>e==='source-removed').length,1);assert.equal(changes.at(-1),false);
});

test('navigation cancellation and damaged audio never begin playback',async()=>{
  const {record,research,env,events}=await fixture();
  let complete;
  env.fetch=async()=>await new Promise(resolve=>{complete=resolve;});
  const narrator=new RecordedNarrator({priority:new VoicePriority(),env});
  const pending=narrator.play(record,research);
  while(!complete)await new Promise(resolve=>setTimeout(resolve,0));
  narrator.stop();complete(new Response(new Uint8Array([73,68,51,1,2,3])));await pending;
  assert.equal(events.includes('play'),false);assert.equal(events.includes('created'),false);
  env.fetch=async()=>new Response('damaged');
  await narrator.play(record,research);assert.equal(events.includes('play'),false);
});

test('a newer device-voice request cancels a recording that is still downloading',async()=>{
  const {record,research,bytes,env,events}=await fixture();
  let complete;
  env.fetch=async()=>await new Promise(resolve=>{complete=resolve;});
  const priority=new VoicePriority(),narrator=new RecordedNarrator({priority,env});
  const pending=narrator.play(record,research);
  while(!complete)await new Promise(resolve=>setTimeout(resolve,0));
  let deviceStopped=false;
  priority.claim('reader',()=>{deviceStopped=true;priority.release('reader');});
  complete(new Response(bytes));await pending;
  assert.equal(priority.owner,'reader');assert.equal(deviceStopped,false);
  assert.equal(events.includes('play'),false);assert.equal(events.includes('created'),false);
  priority.clear();
});

test('narration build omits a stale script and never invents a reviewed recording',async t=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'afterworld-narration-'));
  t.after(()=>fs.rm(directory,{recursive:true,force:true}));
  await fs.mkdir(path.join(directory,'data/narration'),{recursive:true});
  const {research}=await fixture();
  const story={datasetSha256:research.datasetSha256,question:'A question?',observation:'An observation.',interaction:'Select a row.',boundary:'A limitation.'};
  await fs.writeFile(path.join(directory,'data/narration/stories.json'),JSON.stringify({schemaVersion:1,stories:{408:story}}));
  const summary={...research,observationPeriod:{observationStart:'2024',observationEnd:'2024'}};
  const dist=path.join(directory,'dist');
  await prepareNarration(directory,dist,{408:summary},{408:{dataset:research.dataset}});
  const bytes=await fs.readFile(path.join(dist,summary.narrationRef.url));
  assert.equal(summary.narrationRef.sha256,await researchSha256(bytes));
  const record=JSON.parse(bytes);
  assert.equal(record.audio,null);
  assert.match(record.transcript,/Observation period: 2024\./);
  assert.equal(record.transcriptSha256,await researchSha256(record.transcript));
  assert.equal(summary.narration,undefined);
  const stale={...research,datasetSha256:'e'.repeat(64),observationPeriod:summary.observationPeriod};
  await prepareNarration(directory,path.join(directory,'dist'),{408:stale},{408:{dataset:research.dataset}});
  assert.equal(stale.narrationRef,undefined);
});

test('lazy narration requires exact immutable bytes and the currently displayed evidence',async()=>{
  const {record,research}=await fixture();
  const bytes=JSON.stringify(record),sha256=await researchSha256(bytes);
  const reference={sha256,url:`/assets/narration/${sha256}.json`};
  assert.deepEqual(await loadNarration(reference,research,{fetchImpl:async()=>new Response(bytes)}),record);
  await assert.rejects(loadNarration({...reference,url:'https://elsewhere/story.json'},research),/reference/);
  await assert.rejects(loadNarration(reference,research,{fetchImpl:async()=>new Response(bytes+' ')}),/integrity/);
  await assert.rejects(loadNarration(reference,{...research,revision:'f'.repeat(64)},{fetchImpl:async()=>new Response(bytes)}),/stale/);
  await assert.rejects(loadNarration(reference,research,{fetchImpl:async()=>new Response('x'.repeat(32001))}),/size limit/);
  await assert.rejects(loadNarration(reference,research,{fetchImpl:async()=>new Response('',{status:503})}),/unavailable/);
  const abort=new AbortController();abort.abort();
  let fetched=false;
  await assert.rejects(loadNarration(reference,research,{signal:abort.signal,fetchImpl:async()=>{fetched=true;return new Response(bytes);}}),/cancelled/);
  assert.equal(fetched,false);
});
