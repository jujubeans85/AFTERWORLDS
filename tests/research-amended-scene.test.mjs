import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { applyDesignCorrection } from "../src/research-design-amendments.js";
import { amendedInstrumentPlan } from "../src/research-amended.js";
import { createAmendedScene } from "../dist/assets/research-amended-scene.js";
const designs=JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json",import.meta.url))).designs;
async function research(id){const original=designs.find(d=>d.conceptId===id),proposal=JSON.parse(await fs.readFile(new URL(`../data-updates/design-proposals/${id==="74"?"74-two-task-selection":"156-8-rounded-percentage"}.json`,import.meta.url))),design=applyDesignCorrection(original,proposal),dataset=JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`,import.meta.url)));return{conceptId:id,design,dataset};}
const canvas=()=>({getContext:()=>({clearRect(){},fillText(){}})});
function snapshot(group){const out=[];group.traverse(o=>out.push({p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),c:o.material?.color?.getHex(),g:o.geometry?.attributes.position?Array.from(o.geometry.attributes.position.array):null,data:o.userData}));return JSON.stringify(out);}
test("corrected53 stays rounded without arrow and90 keeps its conditional denominator",async()=>{
 const data=await research("156-8"),plan=amendedInstrumentPlan(data),layer=createAmendedScene(data,{createCanvas:canvas});
 assert.deepEqual(plan.items.map(item=>item.value),[53,90]);assert.ok(plan.items.every(item=>item.kind==="bar"));
 assert.equal(plan.items[0].row.qualifier,"rounded source percentage");assert.match(plan.items[1].caption,/respondents who know client location/);
 assert.deepEqual(layer.dataObjects.map(object=>object.userData.value),[53,90]);
 const bad=structuredClone(data);bad.design.implementation.geometry=designs.find(d=>d.conceptId==="156-8").implementation.geometry;assert.throws(()=>amendedInstrumentPlan(bad),/correction/);
});
test("corrected task crossing has exactlyfour source points andconstantwidth same-model links",async()=>{
 const data=await research("74"),plan=amendedInstrumentPlan(data),layer=createAmendedScene(data,{createCanvas:canvas});
 assert.equal(data.dataset.rows.length,18);assert.deepEqual(plan.items.map(item=>item.row.id),["gemma-0-1","gemma-0-2","gemma-2-1","gemma-2-2"]);
 assert.equal(layer.points.length,4);assert.equal(layer.ribbons.length,2);
 for(const ribbon of layer.ribbons){const rows=ribbon.userData.rowIds.map(id=>plan.rows.find(row=>row.id===id));assert.equal(rows[0].name,rows[1].name);assert.notEqual(rows[0].benchmark,rows[1].benchmark);}
 assert.ok((plan.items[0].value-plan.items[1].value)*(plan.items[2].value-plan.items[3].value)<0);
 layer.points.forEach((point,index)=>assert.equal(point.position.x,-1+2*plan.items[index].value/100));
 assert.deepEqual(amendedInstrumentPlan({...data,rows:plan.rows}),plan);
});
test("both corrected scenes keep source geometryfixed throughout decorative loops",async()=>{
 for(const id of["74","156-8"]){const layer=createAmendedScene(await research(id),{createCanvas:canvas}),before=snapshot(layer.measured);for(const phase of[0,.25,.5,.75,1]){layer.animateAmbient(phase*layer.period);assert.equal(snapshot(layer.measured),before);}}
});

test("task configuration is visible on corrected74 scene labels",async()=>{
 const labels=[];createAmendedScene(await research("74"),{createCanvas:()=>({getContext:()=>({clearRect(){},fillText(text){labels.push(text);}})})});
 assert.ok(labels.some(text=>text.includes("AIME 2026")&&text.includes("no tools")));
});
