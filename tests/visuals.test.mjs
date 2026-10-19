import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/assets/vendor/three.module.js';
import { scoreValue, scoreFor, extrapolate, outlookFor } from '../src/scoring.js';
import { informationHTML } from '../src/information.js';
import { createEffect, addEvidenceEffects, addConceptEffects } from '../dist/assets/effects.js';
const data=JSON.parse(fs.readFileSync(new URL('../data/evidence.json',import.meta.url)));
const registry=JSON.parse(fs.readFileSync(new URL('../dist/assets/registry.json',import.meta.url)));

test('scores preserve missingness, zero, monotonic order and fixed cross-refresh ceilings',()=>{
 assert.equal(scoreValue(null,100),null);assert.equal(scoreValue(undefined,100),null);
 assert.equal(scoreValue(0,100),0);assert.equal(scoreValue(.001,100),1);
 assert.equal(scoreValue(66,100),66);assert.equal(scoreValue(150,100),100);
 assert.equal(scoreValue(285.88,300),95);
 for(let i=1;i<=300;i++)assert.ok(scoreValue(i,300)>=scoreValue(i-1,300));
 for(const n of [NaN,Infinity,-1])assert.throws(()=>scoreValue(n,100));
 assert.throws(()=>scoreValue(10,0));
 const water=data.find(d=>d.id==='water');assert.equal(scoreFor(water,water.points[0]),66);
});
test('extrapolations use dates, absolute change, scope and physical bounds',()=>{
 assert.ok(Math.abs(extrapolate({past:{year:2014,value:21.2},latest:{year:2023,value:66},targetYear:2028})-90.88888888888889)<1e-9);
 assert.equal(extrapolate({past:{year:2026.25,value:17.8},latest:{year:2026.5,value:18.8},targetYear:2027.5,ceiling:100}),22.8);
 assert.equal(extrapolate({past:{year:2024,value:80},latest:{year:2025,value:95},targetYear:2027,ceiling:100}),100);
 assert.equal(extrapolate({past:{year:2024,value:20},latest:{year:2025,value:5},targetYear:2027}),0);
 assert.throws(()=>extrapolate({past:{year:2025,value:1},latest:{year:2025,value:2},targetYear:2027}));
 assert.equal(outlookFor(data.find(d=>d.id==='power')).projected,625);
 assert.equal(data.find(d=>d.id==='power').points[0].value,45);
 assert.equal(outlookFor(data.find(d=>d.id==='languages')).projected,null);
 assert.equal(data.filter(d=>d.brief.timeline?.projection).length,8);
});
test('every globe has a concise, escaped information overlay; concepts never acquire scores',()=>{
 for(const e of registry.entries){
  const html=informationHTML(e);
  assert.ok(!html.includes('undefined')&&!html.includes('NaN'),e.slug);
  assert.equal((html.match(/class="time-card/g)||[]).length,3,e.slug);
  const summary=html.match(/class="brief-summary">([\s\S]*?)<\/div>/)[1];
  const count=(summary.match(/<p>/g)||[]).length;assert.ok(count>=1&&count<=4);
  if(e.dataset){assert.ok(html.includes('SOURCES'));assert.ok(html.includes('HOW THE ANIMATION'))}
  else {assert.ok(html.includes('No measured score'));assert.ok(!html.includes('score-sample'))}
 }
 const e={...registry.entries[0],newTitle:'<img onerror="alert(1)">'};
 assert.ok(!informationHTML(e).includes('<img'));
});
test('14 sourced stories own 14 distinct animation systems with bounded finite geometry',()=>{
 assert.equal(new Set(data.map(d=>d.visual.effect)).size,14);
 for(const d of data){
  const stub={dataset:d,world:new THREE.Group(),markers:[],color:new THREE.Color('#b4eac0')};
  const update=addEvidenceEffects(stub);
  assert.equal(stub.markers.length,d.points.length,d.id);
  for(const t of [0,.016,1,10,100]){update(t);stub.world.updateMatrixWorld(true);
   stub.world.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite),d.id);
    const a=o.geometry?.attributes.position?.array;if(a)assert.ok(a.every(Number.isFinite),d.id);
   });
  }
  const bounds=new THREE.Box3().setFromObject(stub.world);
  assert.ok(Math.max(...bounds.min.toArray().map(Math.abs),...bounds.max.toArray().map(Math.abs))<1.54,d.id);
 }
 for(const d of data){const empty=createEffect(d.visual.effect,0,'#ffffff');assert.equal(empty.group.children.length,0);empty.update(10);}
});
test('all concept sculptures construct without fabricating measured marker values',()=>{
 for(const entry of registry.entries.filter(e=>!e.dataset)){
  const stub={entry,world:new THREE.Group(),markers:[],color:new THREE.Color(entry.color)};
  const update=addConceptEffects(stub);update(1);assert.ok(stub.world.children.length>0);assert.equal(stub.markers.length,0);
 }
});
