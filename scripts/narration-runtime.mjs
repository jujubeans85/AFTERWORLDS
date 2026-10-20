import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {validateNarration} from '../src/narration.js';
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
export async function prepareNarration(root,dist,summaries,bundles) {
 const stories=JSON.parse(await fs.readFile(path.join(root,'data/narration/stories.json'),'utf8')).stories;
 for(const [id,summary] of Object.entries(summaries)){
  const story=stories[id];if(!story || story.datasetSha256!==summary.datasetSha256)continue;
  const transcript=[story.question,story.observation,`Observation period: ${summary.observationPeriod.observationStart}${summary.observationPeriod.observationEnd!==summary.observationPeriod.observationStart ? " to "+summary.observationPeriod.observationEnd : ""}.`,story.interaction,story.boundary].join('\n\n');
  const record={schemaVersion:1,conceptId:id,revision:summary.revision,datasetSha256:summary.datasetSha256,designSha256:summary.designSha256,transcript,transcriptSha256:digest(transcript),citations:bundles[id].dataset.sources.map(source=>source.sourceId),audio:null};
  // Optional reviewed audio is deliberately independent of the old, unapproved audition.
  const reviewPath=path.join(root,'data/narration',`${id}.recording.json`);
  try {
   record.audio=JSON.parse(await fs.readFile(reviewPath,'utf8'));
  }catch(error){if(error.code!=='ENOENT')throw error;record.audio=null;}
  if(record.audio){
   await validateNarration(record,{...summary,dataset:bundles[id].dataset});
   const bytes=await fs.readFile(path.join(root,'assets/audio/narration',`${record.audio.sha256}.mp3`));
   if(digest(bytes)!==record.audio.sha256)throw Error('Narration audio digest mismatch');
   await fs.mkdir(path.join(dist,'assets/narration'),{recursive:true});await fs.writeFile(path.join(dist,record.audio.url),bytes);
  }
  await validateNarration(record,{...summary,dataset:bundles[id].dataset});
  const serialized=JSON.stringify(record),sha256=digest(serialized);
  const directory=path.join(dist,'assets/narration');await fs.mkdir(directory,{recursive:true});
  const file=path.join(directory,`${sha256}.json`);
  try{await fs.writeFile(file,serialized,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;if(digest(await fs.readFile(file))!==sha256)throw Error('Immutable narration collision');}
  summary.narrationRef={url:`/assets/narration/${sha256}.json`,sha256};
 }
}
