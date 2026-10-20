import * as THREE from "./vendor/three.module.js";
import { panelInstrumentPlan } from "./research-panels.js";
const TAU=2*Math.PI;
const mat=color=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});
const lines=(points,color="#536872",opacity=1)=>new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
function wrap(text,max=30){const out=[];for(const word of String(text).split(/\s+/)){if(!out.length||out.at(-1).length+word.length+1>max)out.push(word);else out[out.length-1]+=` ${word}`;}return out;}
export function createPanelScene(research,{createCanvas=()=>document.createElement("canvas"),plan:providedPlan}={}){
 const plan=providedPlan||panelInstrumentPlan(research),world=new THREE.Group(),measured=new THREE.Group(),ambient=new THREE.Group(),shell=new THREE.Group(),selection=new THREE.Group();
 world.add(measured,ambient,shell,selection);measured.name="measured-separate-native-panels";ambient.name="ambient-frame-not-measured-change";
 const markers=new Array(plan.items.length),textures=[],dataObjects=[],panelGroups=[];
 const radius=plan.panelRadius||(plan.panels.length>3?1.7:1.15),width=plan.panelWidth||(plan.panels.length>4?1.55:1.8),edge=width/2-.15;
 for(const panel of plan.panels){
  const group=new THREE.Group();group.position.set(Math.sin(panel.face)*radius,panel.detached?-2.2:0,Math.cos(panel.face)*radius);group.rotation.y=panel.face;measured.add(group);panelGroups.push(group);
  group.add(new THREE.Mesh(new THREE.PlaneGeometry(width,2.0),mat("#101a22")));
  const entries=wrap(panel.title,27).map((text,i)=>[text,0,.86-i*.10,36,"#edf4fa"]);
  panel.items.forEach((item,i)=>{
   const y=panel.items.length===1?.05:.32-i*.65,color=item.color;
   const prefix=item.row.qualifier===">"?">":item.row.qualifier==="approximately"?"≈":"";
   let object;
   if(item.kind==="ring"){
    const angle=TAU*item.value/100,r=.28;
    const reference=new THREE.Mesh(new THREE.RingGeometry(r-.007,r+.007,96),mat("#344b55"));reference.position.set(0,y,.015);group.add(reference);
    object=new THREE.Mesh(new THREE.RingGeometry(r-.014,r+.014,96,1,Math.PI/2-angle,angle),mat(color));object.position.set(0,y,.025);object.visible=item.value>0;
    object.userData={rowId:item.row.id,nativeAngle:angle,domain:item.domain};entries.push([`${item.value}%`,0,y-.02,64,color]);
   }else if(["bar","hazard","rib"].includes(item.kind)){
    const xAt=value=>-edge+2*edge*value/item.domain[1],x=xAt(item.value);
    group.add(lines([[-edge,y,.015],[edge,y,.015]],"#344b55"));
    if(item.kind==="hazard"){
     object=new THREE.Mesh(new THREE.RingGeometry(.021,.032,32),mat(color));object.position.set(x,y,.04);
     const [lower,upper]=item.interval;
     const whisker=lines([[xAt(lower),y,.025],[xAt(upper),y,.025],[xAt(lower),y-.04,.025],[xAt(lower),y+.04,.025],[xAt(upper),y-.04,.025],[xAt(upper),y+.04,.025]],color);
     whisker.userData={rowId:item.row.id,lower,upper};group.add(whisker);dataObjects.push(whisker);
     group.add(lines([[xAt(1),y-.12,.015],[xAt(1),y+.12,.015]],"#b5c3d0"));entries.push([`95% CI ${lower}–${upper}; null = 1`,0,y-.17,30]);
    }else{object=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(x+edge,1e-10),.04),mat(color));object.position.set((x-edge)/2,y,.025);object.visible=item.value>0;}
    object.userData={rowId:item.row.id,value:item.value,domain:item.domain};
    entries.push([`${prefix}${item.value} ${item.row.unit}`,0,y+.15,38,color],[`0–${item.domain[1]}`,0,y-.08,24]);
   }else if(item.kind==="native-text"){
    entries.push([`${prefix}${item.value}`,0,y+.12,72,color]);
    wrap(item.row.unit,33).forEach((text,j)=>entries.push([text,0,y-.07-j*.08,30,color]));
   }else wrap(item.value,25).forEach((text,j)=>entries.push([text,0,y+.22-j*.12,38,color]));
   if(object){group.add(object);dataObjects.push(object);}
   const captionStart=panel.items.length===1?-.48:y-.20;
   wrap(item.caption,40).slice(0,4).forEach((text,j)=>entries.push([text,0,captionStart-j*.065,24,"#b5c3d0"]));
   if(panel.items.length>1)entries.push([`${item.row.name} · ${item.row.period}`,0,y+.28,27,color]);
   else entries.push([item.row.period,0,-.91,22,"#b5c3d0"]);
   group.updateMatrix();const normal=new THREE.Vector3(Math.sin(panel.face),0,Math.cos(panel.face));
   markers[item.index]={row:item.row,index:item.index,normal,center:new THREE.Vector3(0,y,.06).applyMatrix4(group.matrix),
    base:new THREE.Vector3(-edge-.04,y,.06).applyMatrix4(group.matrix),focusRotation:[0,-panel.face,0],
    hitPoints:Array.from({length:12},(_,n)=>new THREE.Vector3(-edge+2*edge*n/11,y,.06).applyMatrix4(group.matrix))};
  });
  const canvas=createCanvas();canvas.width=1024;canvas.height=1280;const ctx=canvas.getContext("2d");if(!ctx)throw Error("Evidence panels require a2D canvas.");ctx.clearRect(0,0,1024,1280);
  for(const [text,x,y,size=28,color="#b5c3d0"]of entries){ctx.font=`${size}px sans-serif`;const extent=ctx.measureText?ctx.measureText(text).width:String(text).length*size*.62;if(extent>970)ctx.font=`${size*970/extent}px sans-serif`;ctx.textAlign="center";ctx.fillStyle=color;ctx.fillText(String(text),(x/width+.5)*1024,(.5-y/2)*1280);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);const label=new THREE.Mesh(new THREE.PlaneGeometry(width,2),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));label.position.z=.05;group.add(label);
 }
 const marginPoints=panelGroups.map(group=>{
  group.updateMatrix();return [[-width/2-.05,-1.03,0],[-width/2-.05,1.03,0],[-width/2-.05,1.03,0],[width/2+.05,1.03,0],[width/2+.05,1.03,0],[width/2+.05,-1.03,0],[width/2+.05,-1.03,0],[-width/2-.05,-1.03,0]].map(p=>new THREE.Vector3(...p).applyMatrix4(group.matrix).toArray());
 });
 let animateAmbient;
 if(plan.recipe==="counterframe-slide"||plan.recipe==="page-edge-parallax"){
  const frames=[0,1].map(parity=>{const object=lines(marginPoints.filter((_,i)=>i%2===parity).flat(),"#b5c3d0",.25);ambient.add(object);return object;});
  animateAmbient=time=>frames.forEach((frame,i)=>{const change=Math.sin(TAU*time/plan.period)*(i?-1:1);if(plan.recipe==="page-edge-parallax")frame.rotation.y=change*Math.PI/90;else frame.position.x=change*.012;});
 }else if(plan.recipe==="facet-seam-trace"){
  ambient.add(lines(marginPoints.flat(),"#b5c3d0",.18));const ticks=lines(panelGroups.flatMap(group=>[new THREE.Vector3(-width/2-.05,0,0).applyMatrix4(group.matrix).toArray(),new THREE.Vector3(-width/2+.02,0,0).applyMatrix4(group.matrix).toArray()]),"#b5c3d0",.3);ambient.add(ticks);
  animateAmbient=time=>{const phase=((time/plan.period)%1+1)%1,corners=[[-width/2-.05,-1.03],[-width/2-.05,1.03],[width/2+.05,1.03],[width/2+.05,-1.03]];
   const at=t=>{const q=(t%1)*4,a=corners[Math.floor(q)],b=corners[(Math.floor(q)+1)%4],f=q%1;return new THREE.Vector3(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,0);};
   ticks.geometry.attributes.position.array.set(panelGroups.flatMap(group=>[at(phase).applyMatrix4(group.matrix).toArray(),at(phase+.02).applyMatrix4(group.matrix).toArray()]).flat());ticks.geometry.attributes.position.needsUpdate=true;};
 }else{const bracket=lines([[-width/2-.12,-.75,-.04],[-width/2-.12,.75,-.04],[-width/2-.12,.75,-.04],[-width/2,.75,-.04]],"#b5c3d0",.25);bracket.position.z=radius;ambient.add(bracket);animateAmbient=time=>{bracket.position.x=Math.sin(TAU*time/plan.period)*.012;};}
 const ring=new THREE.Mesh(new THREE.RingGeometry(.035,.044,32),mat("#ffffff"));ring.visible=false;selection.add(ring);animateAmbient(0);
 return {world,measured,ambient,shell,selection,ring,markers,textures,plan,dataObjects,panelGroups,period:plan.period,animateAmbient,frameRadius:plan.panels.some(p=>p.detached)?3.2:2.15};
}
