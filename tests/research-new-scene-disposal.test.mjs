import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {fileURLToPath} from "node:url";
import { ResearchGlobe } from "../dist/assets/research-view.js";
import { createMapScene } from "../dist/assets/research-map-scene.js";
import { createPanelScene } from "../dist/assets/research-panel-scene.js";
import { createHistogramScene } from "../dist/assets/research-histogram-scene.js";
import { createMultiScene } from "../dist/assets/research-multi-scene.js";
import { createAmendedScene } from "../dist/assets/research-amended-scene.js";
import { prepareCountryGeography } from "../scripts/research-geography.mjs";
import { applyDesignCorrection } from "../src/research-design-amendments.js";
const root=fileURLToPath(new URL("..",import.meta.url));
const designs=JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json",import.meta.url))).designs;
const canvas=()=>({getContext:()=>({clearRect(){},fillText(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},save(){},restore(){},clip(){},stroke(){}})});
async function fixture(id){
 let design=designs.find(d=>d.conceptId===id);
 if(id==="74"){const proposal=JSON.parse(await fs.readFile(new URL("../data-updates/design-proposals/74-two-task-selection.json",import.meta.url)));design=applyDesignCorrection(design,proposal);}
 const datasets=await Promise.all(design.datasetBindings.map(async binding=>({datasetId:binding.datasetId,dataset:JSON.parse(await fs.readFile(new URL(`../${binding.path}`,import.meta.url)))})));
 const data={conceptId:id,design,datasets,dataset:datasets[0].dataset};
 if(id==="78-4")data.geography=await prepareCountryGeography(root,data.dataset,{anchors:true});
 return data;
}
test("new scenes release all live geometries, materials and textures once, including after repeated teardown",async()=>{
 const factories={"378":createMapScene,"78-4":createMapScene,"390":createPanelScene,"365":createHistogramScene,"394":createMultiScene,"56-5":createMultiScene,"74":createAmendedScene};
 const prior=globalThis.cancelAnimationFrame;globalThis.cancelAnimationFrame=()=>{};
 try{for(const[id,factory]of Object.entries(factories)){
  const layer=factory(await fixture(id),{createCanvas:canvas});const resources=new Set();layer.world.traverse(object=>{if(object.geometry)resources.add(object.geometry);if(object.material)resources.add(object.material);});layer.textures.forEach(texture=>resources.add(texture));
  const counts=new Map([...resources].map(resource=>[resource,0]));for(const resource of resources)resource.addEventListener("dispose",()=>counts.set(resource,counts.get(resource)+1));
  let renderer=0,context=0,removed=0;
  const view=Object.assign(Object.create(ResearchGlobe.prototype),{layer,cleanup:[],pointers:new Map(),raf:0,renderer:{dispose(){renderer++;},forceContextLoss(){context++;}},canvas:{remove(){removed++;}}});
  view.dispose();view.dispose();assert.ok([...counts.values()].every(count=>count===1),id);assert.deepEqual([renderer,context,removed],[1,1,1]);
 }}finally{globalThis.cancelAnimationFrame=prior;}
});
test("explicit observation and histogram changes dispose replaced geometries immediately",async()=>{
 const recorders=createMapScene(await fixture("378"),{createCanvas:canvas});let recorderDisposals=0;recorders.siteGroups.forEach(slot=>slot.effort.geometry.addEventListener("dispose",()=>recorderDisposals++));recorders.setObservation(recorders.species[0],recorders.weeks[1]);assert.equal(recorderDisposals,27);
 const histogram=createHistogramScene(await fixture("365"),{createCanvas:canvas});let barDisposals=0;histogram.bars.forEach(bar=>bar.geometry.addEventListener("dispose",()=>barDisposals++));histogram.setHistogramMode("share");assert.equal(barDisposals,22);
 const map=createMapScene(await fixture("78-4"),{createCanvas:canvas});map.onSelect(1);const outlines=map.selection.children.find(object=>object.isLineSegments);let outlineDisposals=0;outlines.geometry.addEventListener("dispose",()=>outlineDisposals++);map.onSelect(2);assert.equal(outlineDisposals,1);
});
