import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PANEL_CONCEPTS,panelInstrumentPlan } from "../src/research-panels.js";
import { histogramPlan } from "../src/research-histogram.js";
import { createPanelScene } from "../dist/assets/research-panel-scene.js";
import { createHistogramScene } from "../dist/assets/research-histogram-scene.js";
const designs=JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json",import.meta.url))).designs;
async function research(id){const design=designs.find(d=>d.conceptId===id),dataset=JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`,import.meta.url)));return{conceptId:id,design,dataset,rows:dataset.rows};}
const canvas=()=>({getContext:()=>({clearRect(){},fillText(){}})});
function snapshot(group){const out=[];group.traverse(o=>out.push({p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible,c:o.material?.color?.getHex(),g:o.geometry?.attributes.position?Array.from(o.geometry.attributes.position.array):null,data:o.userData}));return JSON.stringify(out);}
test("mixed evidence retains exact typed quantities and independent clinical axes",async()=>{
 const trial=panelInstrumentPlan(await research("8-17"));
 assert.deepEqual(trial.items.map(item=>item.domain),[[0,5],[0,5],[0,1.2]]);
 assert.deepEqual(trial.items[2].interval,[.7,.99]);assert.equal(trial.items[2].value,.83);
 const waste=panelInstrumentPlan(await research("390"));assert.equal(waste.items.filter(item=>item.kind==="bar").length,4);assert.equal(waste.items.filter(item=>item.kind==="native-text").length,3);
 const lifecycle=panelInstrumentPlan(await research("30-8"));assert.ok(lifecycle.items.every(item=>item.kind==="native-text"&&item.domain===null));
 const shuttle=panelInstrumentPlan(await research("325"));assert.equal(shuttle.items[0].kind,"native-text");assert.equal(shuttle.items[0].row.qualifier,">");assert.equal(shuttle.items[1].row.sampleSizeApprox,900);
 const manufacturing=panelInstrumentPlan(await research("266-2"));assert.equal(manufacturing.panels.filter(panel=>panel.detached).length,1);assert.equal(manufacturing.items.at(-1).value,74);
});
test("histogram preserves all discrete zero bins, exact counts and separate within-type shares",async()=>{
 const data=await research("365"),count=histogramPlan(data),share=histogramPlan(data,"share"),layer=createHistogramScene(data,{createCanvas:canvas});
 assert.equal(layer.markers.length,22);
 count.items.forEach((item,index)=>{assert.equal(item.length,item.row.value/2500);assert.equal(share.items[index].length,item.row.value/item.row.sampleDenominator);assert.equal(share.items[index].angle,item.angle);if(item.row.value===0)assert.equal(layer.bars[index].visible,false);});
 layer.setHistogramMode("share");share.items.forEach((item,index)=>assert.equal(layer.bars[index].userData.length,item.length));
 layer.setHistogramMode("count");count.items.forEach((item,index)=>assert.equal(layer.bars[index].userData.length,item.length));
 const bad=structuredClone(data);bad.rows[0].sampleDenominator=4898;assert.throws(()=>histogramPlan(bad),/denominators/);
});
test("all mixed panels and wine histogram stay invariant through decorative loops",async()=>{
 for(const id of [...PANEL_CONCEPTS,"365"]){const data=await research(id),layer=id==="365"?createHistogramScene(data,{createCanvas:canvas}):createPanelScene(data,{createCanvas:canvas}),before=snapshot(layer.measured);
 assert.equal(layer.markers.length,data.rows.length);assert.ok(layer.ambient.children.length<=2);
 for(const phase of [0,.25,.5,.75,1]){layer.animateAmbient(phase*layer.period);assert.equal(snapshot(layer.measured),before,id);}
 }
});
