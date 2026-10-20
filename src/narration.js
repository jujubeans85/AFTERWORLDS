import {researchSourceList} from './research-records.js';
import {researchSha256} from './research-data.js';
export class VoicePriority {
 constructor(onChange=()=>{}){this.owner=null;this.stop=null;this.onChange=onChange;}
 claim(owner,stop){if(this.owner===owner)return;const previous=this.stop;this.owner=null;this.stop=null;previous?.();this.owner=owner;this.stop=stop;this.onChange(true);}
 release(owner){if(this.owner!==owner)return;this.owner=null;this.stop=null;this.onChange(false);}
 clear(){const stop=this.stop;this.owner=null;this.stop=null;stop?.();this.onChange(false);}
}
export async function validateNarration(record,research) {
 if(record?.schemaVersion!==1||record.conceptId!==research.conceptId||record.datasetSha256!==research.datasetSha256||record.designSha256!==research.designSha256||record.revision!==research.revision)throw Error('Narration is stale for this evidence');
 if(typeof record.transcript!=='string'||!record.transcript||record.transcript.length>12000||await researchSha256(record.transcript)!==record.transcriptSha256)throw Error('Narration transcript integrity failure');
 if(!Array.isArray(record.citations)||!record.citations.length||record.citations.some(id=>!researchSourceList(research).some(source=>source.sourceId===id)))throw Error('Narration citations do not resolve');
 if(record.audio) {
  const {sha256,url,voice,synthetic,review}=record.audio;
  if(!/^[a-f0-9]{64}$/.test(sha256)||url!==`/assets/narration/${sha256}.mp3`||!voice||synthetic!==true||review?.status!=='accepted'||review.transcriptSha256!==record.transcriptSha256||review.datasetSha256!==record.datasetSha256||review.designSha256!==record.designSha256||review.audioSha256!==sha256||!review.reviewer||review.listeningApproved!==true)throw Error('Recorded narration lacks matching listening review');
 }
 return record;
}
export class RecordedNarrator {
 constructor({priority,env=globalThis,onStatus=()=>{}}){this.priority=priority;this.env=env;this.onStatus=onStatus;this.audio=null;this.objectURL=null;this.controller=null;this.generation=0;}
 async play(record,research) {
  this.stop();const generation=this.generation;const controller=new AbortController();this.controller=controller;
  this.priority.claim('recording',()=>this.stop());
  const timer=setTimeout(()=>controller.abort(),12000);
  try {
   await validateNarration(record,research);if(!record.audio)throw Error('No reviewed recording; use Read aloud for the current transcript.');
   const response=await this.env.fetch(record.audio.url,{signal:controller.signal,credentials:'same-origin',redirect:'error'});
   if(!response.ok||!response.body)throw Error('Recording unavailable');
   const reader=response.body.getReader(),chunks=[];let size=0;
   try {for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>8000000){await reader.cancel();throw Error('Recording exceeds size limit');}chunks.push(value);}}finally{reader.releaseLock();}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
   if(await researchSha256(bytes)!==record.audio.sha256)throw Error('Recording integrity failure');
   if(generation!==this.generation||controller.signal.aborted)return;
   this.objectURL=this.env.URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));
   const audio=new this.env.Audio(this.objectURL);this.audio=audio;
   audio.onended=()=>{if(this.audio===audio)this.stop();};audio.onerror=()=>{if(this.audio===audio){this.stop();this.onStatus('Recording could not play. Use Read aloud for the current transcript.');}};
   await audio.play();if(generation!==this.generation){audio.pause();return;}this.onStatus('Playing reviewed synthetic narration.');
  } catch(error) {
   if(generation!==this.generation)return;
   this.stop();this.onStatus(error.name==='NotAllowedError'?'Playback was blocked. Select Listen again or use Read aloud.':error.message);
  }finally{clearTimeout(timer);if(this.controller===controller)this.controller=null;}
 }
 stop(){this.generation++;this.controller?.abort();this.controller=null;if(this.audio){this.audio.pause();this.audio.removeAttribute('src');this.audio.load?.();this.audio=null;}if(this.objectURL){this.env.URL.revokeObjectURL(this.objectURL);this.objectURL=null;}this.priority.release('recording');}
}

export async function loadNarration(reference,research,{fetchImpl=globalThis.fetch,signal}={}) {
 if(!reference || !/^[a-f0-9]{64}$/.test(reference.sha256 || '') || reference.url!==`/assets/narration/${reference.sha256}.json`)throw Error('Invalid narration reference');
 const controller=new AbortController(),cancel=()=>controller.abort();
 if(signal?.aborted)throw Error('Narration cancelled');
 signal?.addEventListener('abort',cancel,{once:true});const timer=setTimeout(cancel,4000);
 try {
  const response=await fetchImpl(reference.url,{signal:controller.signal,credentials:'same-origin',redirect:'error'});
  if(!response.ok||!response.body)throw Error('Narration unavailable');
  const reader=response.body.getReader();const chunks=[];let size=0;
  try {for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>32000){await reader.cancel();throw Error('Narration exceeds size limit');}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  if(controller.signal.aborted || await researchSha256(bytes)!==reference.sha256)throw Error('Narration integrity failure');
  const record=await validateNarration(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)),research);
  if(controller.signal.aborted)throw Error('Narration cancelled');
  return record;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
