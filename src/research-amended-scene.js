import * as THREE from "./vendor/three.module.js";
import { amendedInstrumentPlan } from "./research-amended.js";
import { createPanelScene } from "./research-panel-scene.js";
const TAU=2*Math.PI;
export function createAmendedScene(research,{createCanvas=()=>document.createElement("canvas")}={}){
 const plan=amendedInstrumentPlan(research);
 if(plan.conceptId==="156-8")return createPanelScene(research,{createCanvas,plan});
 const world=new THREE.Group(),measured=new THREE.Group(),ambient=new THREE.Group(),shell=new THREE.Group(),selection=new THREE.Group();world.add(measured,ambient,shell,selection);
 const markers=[],points=[],ribbons=[],textures=[];
 const line=(positions,color)=>new THREE.Line(new THREE.BufferGeometry().setFromPoints(positions),new THREE.LineBasicMaterial({color}));
 measured.add(new THREE.Mesh(new THREE.PlaneGeometry(2.5,2.1),new THREE.MeshBasicMaterial({color:"#101a22",side:THREE.DoubleSide})));
 for(const y of [.42,-.42])measured.add(line([new THREE.Vector3(-1,y,.02),new THREE.Vector3(1,y,.02)],"#344b55"));
 for(const item of plan.items){
  const p=new THREE.Vector3(-1+2*item.value/100,item.index<2?.42:-.42,.04);
  const point=new THREE.Mesh(new THREE.RingGeometry(.023,.032,32),new THREE.MeshBasicMaterial({color:item.color,side:THREE.DoubleSide}));point.position.copy(p);point.userData={rowId:item.row.id,value:item.value,benchmark:item.row.benchmark};measured.add(point);points.push(point);
  markers.push({row:item.row,index:item.index,normal:new THREE.Vector3(0,0,1),base:p.clone(),center:p.clone(),focusRotation:[0,0,0]});
 }
 for(const pair of [[0,2],[1,3]]){
  const ribbon=line(pair.map(index=>points[index].position.clone()),plan.items[pair[0]].color);
  ribbon.userData={rowIds:pair.map(index=>plan.items[index].row.id),meaning:"constant-width same-model observation link; no quantitative width"};measured.add(ribbon);ribbons.push(ribbon);
 }
 const canvas=createCanvas();canvas.width=1280;canvas.height=1024;const ctx=canvas.getContext("2d");if(!ctx)throw Error("Corrected task labels need a canvas.");ctx.clearRect(0,0,1280,1024);ctx.textAlign="center";
 const entries=[[`MMLU Pro · ${plan.items[0].row.configuration}`,0,.78,34,"#edf4fa"],[`AIME 2026 · ${plan.items[2].row.configuration}`,0,-.17,34,"#edf4fa"],
  ["0–100 developer-reported benchmark percent",0,-.78,30,"#b5c3d0"],["Same-model links; no overall ranking or time trend",0,-.91,27,"#b5c3d0"]];
 plan.items.forEach(item=>{const point=points[item.index].position;entries.push([`${item.row.name}: ${item.value}%`,0,item.index<2?.64-item.index*.10:-.57-(item.index-2)*.10,29,item.color]);});
 entries.push(["Task-specific configurations · developer snapshot",0,.01,25,"#b5c3d0"]);
 for(const[text,x,y,size,color]of entries){ctx.font=`${size}px sans-serif`;ctx.fillStyle=color;ctx.fillText(text,(x/2.5+.5)*1280,(.5-y/2.1)*1024);}
 const texture=new THREE.CanvasTexture(canvas);textures.push(texture);const labels=new THREE.Mesh(new THREE.PlaneGeometry(2.5,2.1),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));labels.position.z=.055;measured.add(labels);
 const cagePoints=[];for(let axis=0;axis<3;axis++)for(let i=0;i<128;i++){for(const step of[i,i+1]){const a=step*TAU/128,p=[Math.cos(a)*1.7,Math.sin(a)*1.7,0];if(axis===1)[p[0],p[2]]=[p[2],p[0]];if(axis===2)[p[1],p[2]]=[p[2],p[1]];cagePoints.push(new THREE.Vector3(...p));}}
 ambient.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cagePoints),new THREE.LineBasicMaterial({color:"#b5c3d0",opacity:.25,transparent:true})));
 const ring=new THREE.Mesh(new THREE.RingGeometry(.04,.048,32),new THREE.MeshBasicMaterial({color:"#fff",side:THREE.DoubleSide}));ring.visible=false;selection.add(ring);
 return{world,measured,ambient,shell,selection,ring,markers,textures,plan,points,ribbons,period:plan.period,frameRadius:1.75,
  animateAmbient(time){ambient.rotation.set(.28,TAU*time/plan.period,.18);}};
}
