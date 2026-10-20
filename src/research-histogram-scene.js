import * as THREE from "./vendor/three.module.js";
import { histogramPlan } from "./research-histogram.js";
const TAU=2*Math.PI;
export function createHistogramScene(research,{createCanvas=()=>document.createElement("canvas")}={}){
 const plan=histogramPlan(research),world=new THREE.Group(),measured=new THREE.Group(),ambient=new THREE.Group(),shell=new THREE.Group(),selection=new THREE.Group();world.add(measured,ambient,shell,selection);
 const markers=[],bars=[],textures=[];
 shell.add(new THREE.Mesh(new THREE.SphereGeometry(.99,48,32),new THREE.MeshBasicMaterial({color:"#101a22"})));
 for(const item of plan.items){
  const normal=new THREE.Vector3(Math.sin(item.angle),0,Math.cos(item.angle));
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,Math.max(item.length,1e-10),10),new THREE.MeshBasicMaterial({color:item.color}));bar.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);bar.position.copy(normal).multiplyScalar(1+item.length/2);bar.position.y=item.offset;bar.visible=item.length>0;bar.userData={rowId:item.row.id,sourceValue:item.row.value,qualityScore:item.row.qualityScore,length:item.length};measured.add(bar);bars.push(bar);
  const base=normal.clone().multiplyScalar(1.005);base.y=item.offset;
  const tick=new THREE.Mesh(new THREE.SphereGeometry(.012,12,8),new THREE.MeshBasicMaterial({color:item.color}));tick.position.copy(base);measured.add(tick);
  markers.push({row:item.row,index:item.index,normal,base:base.clone(),center:base.clone(),focusRotation:[.4,-item.angle,0]});
 }
 for(let score=0;score<=10;score++){
  const canvas=createCanvas();canvas.width=256;canvas.height=128;const ctx=canvas.getContext("2d");if(!ctx)throw Error("Histogram labels need a canvas.");ctx.clearRect(0,0,256,128);ctx.font="40px sans-serif";ctx.textAlign="center";ctx.fillStyle="#b5c3d0";ctx.fillText(`Score ${score}`,128,75);
  const texture=new THREE.CanvasTexture(canvas);textures.push(texture);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));sprite.scale.set(.33,.165,1);sprite.position.set(Math.sin(score*TAU/11)*1.07,-.22,Math.cos(score*TAU/11)*1.07);measured.add(sprite);
 }
 const hoop=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:128},(_,i)=>new THREE.Vector3(Math.cos(i*TAU/128)*2.05,Math.sin(i*TAU/128)*2.05,0))),new THREE.LineBasicMaterial({color:"#b5c3d0",transparent:true,opacity:.26}));ambient.add(hoop);
 const ring=new THREE.Mesh(new THREE.RingGeometry(.025,.034,32),new THREE.MeshBasicMaterial({color:"#ffffff",side:THREE.DoubleSide}));ring.visible=false;selection.add(ring);
 const setHistogramMode=mode=>{
  const next=histogramPlan(research,mode);
  next.items.forEach((item,index)=>{const bar=bars[index],normal=markers[index].normal;bar.geometry.dispose();bar.geometry=new THREE.CylinderGeometry(.012,.012,Math.max(item.length,1e-10),10);bar.position.copy(normal).multiplyScalar(1+item.length/2);bar.position.y=item.offset;bar.visible=item.length>0;bar.userData.length=item.length;
   markers[index].hitPoints=Array.from({length:12},(_,i)=>{const p=normal.clone().multiplyScalar(1+item.length*i/11);p.y=item.offset;return p;});
  });return true;
 };
 setHistogramMode("count");
 return {world,measured,ambient,shell,selection,ring,markers,textures,bars,plan,histogramModes:["count","share"],setHistogramMode,
  period:plan.period,frameRadius:2.08,initialRotation:[.6,0,0],animateAmbient(time){ambient.rotation.set(.3,TAU*time/plan.period,0);}};
}
