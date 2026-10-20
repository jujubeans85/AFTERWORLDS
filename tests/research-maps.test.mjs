import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { geographyInstrumentPlan, mapPaintPlan, MAP_CONCEPTS } from "../src/research-maps.js";
import { prepareCountryGeography } from "../scripts/research-geography.mjs";
import { createMapScene } from "../dist/assets/research-map-scene.js";
const root=fileURLToPath(new URL("..",import.meta.url));
const designs=JSON.parse(await fs.readFile(new URL("../research/designs/design-registry.json",import.meta.url))).designs;
async function research(id){
 const design=designs.find(d=>d.conceptId===id),dataset=JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`,import.meta.url)));
 return {conceptId:id,design,dataset,rows:dataset.rows,...(id==="378"?{}:{geography:await prepareCountryGeography(root,dataset,{anchors:id!=="247"})})};
}
const canvas=()=>({getContext:()=>({fillRect(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},save(){},restore(){},clip(){},stroke(){}})});
function snapshot(group){const out=[];group.traverse(o=>out.push({p:o.position.toArray(),q:o.quaternion.toArray(),s:o.scale.toArray(),v:o.visible,c:o.material?.color?.getHex(),g:o.geometry?.attributes.position?Array.from(o.geometry.attributes.position.array):null,data:o.userData}));return JSON.stringify(out);}
test("country summaries use only audited geometry and interior anchors with exact stems and disk areas",async()=>{
 for(const id of ["375","247","78-4"]){const data=await research(id),plan=geographyInstrumentPlan(data);
  assert.equal(plan.coverage.mapped+plan.coverage.tableOnly,data.rows.length);
  for(const c of plan.countries){
   if(id==="375")assert.equal(c.length,.45*c.row.value/40000);
   if(id==="78-4")assert.equal(c.radius,c.row.value===null?null:.12*Math.sqrt(c.row.value/plan.maxValue));
   assert.equal(c.row.lat,null);assert.equal(c.row.lon,null);
  }
  if(id!=="247"){const broken=structuredClone(data);broken.geography.countries[0].displayAnchor={lat:-89,lon:0};assert.throws(()=>geographyInstrumentPlan(broken),/interior/);}
 }
});
test("all recorder observations retain published positions and distinguish absent from missing effort",async()=>{
 const data=await research("378"),plan=geographyInstrumentPlan(data),layer=createMapScene(data,{createCanvas:canvas});
 assert.equal(plan.sites.length,27);assert.equal(plan.items.length,1587);
 for(const species of plan.species){let absent=0,unknown=0;
  for(const week of plan.weeks){layer.setObservation(species,week);assert.equal(layer.siteGroups.length,27);
   for(const slot of layer.siteGroups){const state=slot.group.userData;
    if(state.absentCombination){absent++;assert.equal(state.sourceRowId,null);assert.equal(slot.absent.visible,true);assert.equal(slot.hatch.visible,false);}
    else{const row=data.rows.find(r=>r.id===state.sourceRowId);assert.equal(row.species,species);assert.equal(row.week,week);
     const marker=layer.markers.find(m=>m.row.id===row.id);assert.equal(marker.hidden,false);
     if(row.value===null){unknown++;assert.equal(slot.hatch.visible,true);assert.equal(slot.effort.visible,false);}
     else assert.equal(state.effortAngle,2*Math.PI*row.uptimeFraction);
    }
   }
  }
  assert.equal(absent,38);assert.equal(unknown,260);
 }
});
test("connectivity mode switches preserve input nulls, native disk area and independently available percentages",async()=>{
 const data=await research("78-4"),plan=geographyInstrumentPlan(data),layer=createMapScene(data,{createCanvas:canvas});
 assert.equal(layer.diskGroup.children.length,plan.countries.filter(c=>c.row.value!==null).length);
 const before=snapshot(layer.diskGroup);
 layer.setMapMode("percent");assert.equal(layer.diskGroup.visible,false);assert.equal(layer.useCountryPicking,true);
 layer.setMapMode("people");assert.equal(snapshot(layer.diskGroup),before);
 const percentage=mapPaintPlan(plan,"percent");
 percentage.countries.forEach(c=>assert.equal(c.row.value,data.rows[c.index].internetPercent));
});
test("geographic decorative phases never move source coordinates, extents, colours or effort",async()=>{
 for(const id of MAP_CONCEPTS){const layer=createMapScene(await research(id),{createCanvas:canvas}),before=snapshot(layer.measured);
  assert.ok(layer.ambient.children.length<=2);
  for(const phase of [0,.25,.5,.75,1]){layer.animateAmbient(phase*layer.period);assert.equal(snapshot(layer.measured),before,id);}
 }
});
