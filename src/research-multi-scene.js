import * as THREE from "./vendor/three.module.js";
import { multiInstrumentPlan } from "./research-multi-plan.js";
import { createPanelScene } from "./research-panel-scene.js";
const TAU=2*Math.PI;
export function createMultiScene(research,{createCanvas=()=>document.createElement("canvas")}={}){
 const plan=multiInstrumentPlan(research);
 const layer=createPanelScene(research,{createCanvas,plan:{...plan,items:plan.context}});
 layer.plan=plan;
 if(plan.conceptId==="217")return layer;
 // Eleven chronological source ribs/rings occupy the front; dated policy/global context stays behind.
 const historyGroup=new THREE.Group();historyGroup.name="measured-irish-history";layer.measured.add(historyGroup);layer.historyGroup=historyGroup;
 const historyObjects=[];
 plan.history.forEach((item,slot)=>{
  const angle=-1.4+2.8*slot/10,normal=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle)),group=new THREE.Group();
  group.position.copy(normal).multiplyScalar(1.45);group.rotation.y=angle;historyGroup.add(group);
  if(plan.conceptId==="394"){
   const length=item.value/8000;
   const rib=new THREE.Mesh(new THREE.BoxGeometry(.025,Math.max(length,1e-10),.025),new THREE.MeshBasicMaterial({color:item.color}));rib.position.y=length/2-.45;rib.userData={rowId:item.row.id,value:item.value,length};group.add(rib);historyObjects.push(rib);
   const rail=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.45,-.025),new THREE.Vector3(0,.55,-.025)]),new THREE.LineBasicMaterial({color:"#344b55"}));group.add(rail);
  }else{
   const radius=.13,angleExtent=TAU*item.value/100;
   const reference=new THREE.Mesh(new THREE.RingGeometry(radius-.005,radius+.005,64),new THREE.MeshBasicMaterial({color:"#344b55",side:THREE.DoubleSide}));group.add(reference);
   const arc=new THREE.Mesh(new THREE.RingGeometry(radius-.008,radius+.008,64,1,Math.PI/2-angleExtent,angleExtent),new THREE.MeshBasicMaterial({color:item.color,side:THREE.DoubleSide}));arc.position.z=.002;arc.visible=item.value>0;arc.userData={rowId:item.row.id,value:item.value,nativeAngle:angleExtent,sourceField:"nationalMeteredSharePercent"};group.add(arc);historyObjects.push(arc);
  }
  const canvas=createCanvas();canvas.width=256;canvas.height=256;const ctx=canvas.getContext("2d");if(!ctx)throw Error("History labels require a canvas.");ctx.clearRect(0,0,256,256);ctx.textAlign="center";ctx.fillStyle="#b5c3d0";ctx.font="38px sans-serif";ctx.fillText(item.row.period,128,74);ctx.font="31px sans-serif";ctx.fillText(`${item.value}${plan.conceptId==="56-5"?"%":" GWh"}`,128,132);
  const texture=new THREE.CanvasTexture(canvas);layer.textures.push(texture);const label=new THREE.Mesh(new THREE.PlaneGeometry(.26,.26),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));label.position.set(0,plan.conceptId==="394"?-.62:-.3,.015);group.add(label);
  group.updateMatrix();const base=new THREE.Vector3(0,plan.conceptId==="394"?-.45:0,.04).applyMatrix4(group.matrix);
  layer.markers[item.index]={row:item.row,index:item.index,normal,base,center:base.clone(),focusRotation:[0,-angle,0],hitPoints:plan.conceptId==="394"?Array.from({length:10},(_,i)=>new THREE.Vector3(0,-.45+item.value/8000*i/9,.04).applyMatrix4(group.matrix)):[base]};
 });
 layer.historyObjects=historyObjects;
 if(plan.conceptId==="56-5"){
  // Replace generic context brackets with the accepted reference-ring treatment.
  layer.ambient.children.slice().forEach(object=>{object.geometry?.dispose();object.material?.dispose();layer.ambient.remove(object);});
  const hoop=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:128},(_,i)=>new THREE.Vector3(Math.cos(i*TAU/128)*2.1,Math.sin(i*TAU/128)*2.1,0))),new THREE.LineBasicMaterial({color:"#b5c3d0",transparent:true,opacity:.26}));layer.ambient.add(hoop);
  layer.animateAmbient=time=>{hoop.rotation.y=TAU*time/plan.period;};
 }
 layer.frameRadius=2.35;return layer;
}
