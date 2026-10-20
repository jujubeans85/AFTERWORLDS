import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { MULTI_CONCEPTS,multiInstrumentPlan } from "../src/research-multi-plan.js";
import { createMultiScene } from "../dist/assets/research-multi-scene.js";
const designs=JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json",import.meta.url))).designs;
async function research(id){const design=designs.find(d=>d.conceptId===id),datasets=await Promise.all(design.datasetBindings.map(async b=>({datasetId:b.datasetId,dataset:JSON.parse(await fs.readFile(new URL(`../${b.path}`,import.meta.url)))})));return{conceptId:id,design,datasets};}
const canvas=()=>({getContext:()=>({clearRect(){},fillText(){}})});
function snapshot(group){const out=[];group.traverse(o=>out.push({p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible,c:o.material?.color?.getHex(),g:o.geometry?.attributes.position?Array.from(o.geometry.attributes.position.array):null,data:o.userData}));return JSON.stringify(out);}
test("multi-source raw and bound paths select identical records and preserve complete source datasets",async()=>{
 for(const id of MULTI_CONCEPTS){const raw=await research(id),plan=multiInstrumentPlan(raw),bound={...raw,rows:plan.rows};assert.deepEqual(multiInstrumentPlan(bound),plan);assert.ok(plan.items.every(item=>item.row.datasetId));}
 const raw=await research("217"),plan=multiInstrumentPlan(raw);assert.equal(raw.datasets[0].dataset.rows.length,5);assert.equal(plan.rows.length,4);assert.equal(plan.rows[0].id,"energychange");assert.ok(plan.items.every(item=>item.kind==="native-text"&&item.domain===null));
 const bad=structuredClone(raw);bad.datasets[0].dataset.rows.push(bad.datasets[0].dataset.rows.at(-1));assert.throws(()=>multiInstrumentPlan(bad),/exactly once/);
});
test("Irish annual ribs and equal share rings use distinct exact source fields",async()=>{
 const ribs=createMultiScene(await research("394"),{createCanvas:canvas});assert.equal(ribs.historyObjects.length,11);
 ribs.historyObjects.forEach((object,index)=>assert.equal(object.userData.length,ribs.plan.history[index].row.value/8000));
 const rings=createMultiScene(await research("56-5"),{createCanvas:canvas});assert.equal(rings.historyObjects.length,11);
 rings.historyObjects.forEach((object,index)=>{assert.equal(object.userData.nativeAngle,2*Math.PI*rings.plan.history[index].row.nationalMeteredSharePercent/100);assert.ok(Math.abs(object.geometry.parameters.innerRadius-.122)<1e-12);});
});
test("source rows remain selectable and all multi-source measurements stay fixed through ambient phases",async()=>{
 for(const id of MULTI_CONCEPTS){const raw=await research(id),layer=createMultiScene(raw,{createCanvas:canvas}),before=snapshot(layer.measured);assert.deepEqual(layer.markers.map(marker=>marker.row.id),layer.plan.rows.map(row=>row.id));assert.ok(layer.ambient.children.length<=2);
 for(const phase of [0,.25,.5,.75,1]){layer.animateAmbient(phase*layer.period);assert.equal(snapshot(layer.measured),before,id);}}
});
