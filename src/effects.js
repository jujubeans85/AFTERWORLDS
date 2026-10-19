import * as THREE from './vendor/three.module.js';
import { xyz, hash } from './math.js';
import { scoreFor } from './scoring.js';

const TAU = Math.PI * 2;
const vec = (x, y, z) => new THREE.Vector3(x, y, z);
const at = (lat, lon, r = 1.015) => new THREE.Vector3(...xyz(lat, lon, r));
const material = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity === 1 });
const line = (points, color, opacity = 0.7) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
const circle = (r, y, color, opacity = .7) => line(Array.from({length: 65}, (_, k) => vec(Math.cos(k / 64 * TAU) * r, y, Math.sin(k / 64 * TAU) * r)), color, opacity);
function mesh(parent, geometry, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z); parent.add(m); return m;
}
function boxes(parent, transforms, color) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material(color), transforms.length);
  const o = new THREE.Object3D();
  transforms.forEach(([x,y,z,sx,sy,sz,ry=0], i) => {o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(0,ry,0);o.updateMatrix();m.setMatrixAt(i,o.matrix);});
  m.instanceMatrix.needsUpdate = true; parent.add(m); return m;
}
function glyphCloud(parent, count, radius, color, q, seed, letters = false) {
  const positions=[], phases=[], digits=[];
  for(let i=0;i<count;i++) {
    const a=i*2.399963, r=radius*Math.sqrt((i+.5)/count);
    positions.push(Math.cos(a)*(letters?radius:r),letters?.025+i/count*.18:.025 + ((i*17+seed)%23)/23*.13,Math.sin(a)*(letters?radius:r));
    phases.push(((i*37+seed)%101)/16);digits.push((i+seed)%2);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('phase',new THREE.Float32BufferAttribute(phases,1));
  g.setAttribute('digit',new THREE.Float32BufferAttribute(digits,1));
  const mat=new THREE.ShaderMaterial({
    uniforms:{ time:{value:0}, color:{value:new THREE.Color(color)}, speed:{value:.35+q*1.1}, letters:{value:letters?1:0} },
    vertexShader:`attribute float phase; attribute float digit; varying float vPhase; varying float vDigit; void main(){vPhase=phase;vDigit=digit;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(30./max(.5,-p.z),5.,17.);}`,
    fragmentShader:`uniform float time;uniform vec3 color;uniform float speed;uniform int letters;varying float vPhase;varying float vDigit;
      float seg(vec2 p,vec2 a,vec2 b){vec2 ab=b-a;return 1.-smoothstep(.055,.09,length(p-a-ab*clamp(dot(p-a,ab)/dot(ab,ab),0.,1.)));}
      void main(){vec2 p=gl_PointCoord;float ink;
      if(letters==1){ink=max(max(seg(p,vec2(.2,.8),vec2(.5,.2)),seg(p,vec2(.5,.2),vec2(.8,.8))),seg(p,vec2(.32,.57),vec2(.68,.57)));}
      else if(vDigit>.5){ink=max(seg(p,vec2(.52,.2),vec2(.52,.8)),max(seg(p,vec2(.3,.8),vec2(.75,.8)),seg(p,vec2(.3,.38),vec2(.52,.2))));}
      else {vec2 z=(p-.5)/vec2(.26,.34);ink=1.-smoothstep(.13,.24,abs(length(z)-1.));}
      float flicker=.65+.25*sin(time*speed*6.283+vPhase);if(ink<.05)discard;gl_FragColor=vec4(color,ink*flicker);}`,
    transparent:true,depthWrite:false
  });
  const cloud=new THREE.Points(g,mat);parent.add(cloud);
  return t=>{mat.uniforms.time.value=t;};
}

// Bounded, story-specific sculptures. Every animated magnitude comes from q=score/100.
export function createEffect(kind, q, color, seed = 0) {
  const group = new THREE.Group(), updates=[];
  const speed=.25+1.2*q, r=.07+.18*q, n=Math.max(1,Math.round(q*30));
  if(q===0) return {group,update:()=>{}};
  if (kind === 'flood') {
    const buildings=[];
    for(let i=0;i<36;i++) {
      const x=((i%6)-2.5)*.055,z=(Math.floor(i/6)-2.5)*.055;
      const h=.045+((i*17+3)%23)/23*.18;
      buildings.push([x,h/2,z,.032,h,.032]);
    }
    boxes(group,buildings,0x587785);
    const depth=.015+.15*q, radius=.18+.13*q;
    const water=mesh(group,new THREE.CylinderGeometry(radius,radius,depth,64),material(new THREE.Color('#71d6e6').lerp(new THREE.Color('#084a78'),q),.78),0,depth/2,0);
    for(let j=0;j<4;j++){
      const foam=circle(radius,depth+.005,0x91e5f1,.75); group.add(foam);
      updates.push(t=>{const f=(t*speed*.22+j/4)%1;foam.scale.setScalar(.3+f*.7);foam.position.y=Math.sin(t*speed*3+j)*.006*q;foam.material.opacity=(1-f)*.8;});
    }
    updates.push(t=>{water.position.y=depth/2+Math.sin(t*speed*3)*.003*q;});
  } else if (kind === 'binary' || kind === 'letters') {
    updates.push(glyphCloud(group,Math.max(3,Math.round(160*q)),r,color,q,seed,kind==='letters'));
    const rim=circle(r+.02,.006,color,.25); group.add(rim);
    if(kind==='letters')updates.push(t=>group.rotation.y=t*speed*.2);
  } else if (kind === 'arcs') {
    for(let j=0;j<2+Math.round(7*q);j++) {
      const a=j*2.399,pts=[];
      for(let k=0;k<=12;k++){const f=k/12;pts.push(vec(Math.cos(a)*r*f+Math.sin(k*2+j)*.02*q,f*(.1+.32*q),Math.sin(a)*r*f));}
      const bolt=line(pts,color,.7); group.add(bolt);
      const spark=mesh(group,new THREE.SphereGeometry(.009,6,4),material(0xf2ffc6));
      updates.push(t=>{const f=(t*speed*.5+j*.17)%1,k=Math.floor(f*12);spark.position.lerpVectors(pts[k],pts[Math.min(12,k+1)],f*12-k);bolt.material.opacity=.45+.3*Math.sin(t*speed*2+j)**2;});
    }
  } else if(kind==='coins') {
    const gold=material(0xd9c98b),count=Math.max(1,Math.round(20*q));
    for(let i=0;i<count;i++) mesh(group,new THREE.CylinderGeometry(.045,.045,.012,20),gold,0,.015+i*.015,0);
    for(let i=0;i<2+Math.round(8*q);i++){
      const coin=mesh(group,new THREE.CylinderGeometry(.018,.018,.006,12),gold);
      updates.push(t=>{const a=i*2.399+t*speed;coin.position.set(Math.cos(a)*r,.035+(i%4)*.032,Math.sin(a)*r);coin.rotation.z=t*speed;});
    }
  } else if(kind==='neurons') {
    const points=[];
    for(let i=0;i<3+n;i++){
      const a=i*2.399,y=.04+(i%(4+Math.round(q*4)))*.04;
      const p=vec(Math.cos(a)*r,y,Math.sin(a)*r);points.push(p);
      group.add(line([i?points[Math.floor((i-1)/2)]:vec(0,0,0),p],color,.55));
      const dot=mesh(group,new THREE.SphereGeometry(.009+.004*q,6,4),material(color),p.x,p.y,p.z);
      updates.push(t=>dot.scale.setScalar(.75+.25*Math.sin(t*speed*3+i)));
    }
  } else if(kind==='gears') {
    const cog=new THREE.Group();group.add(cog);cog.position.y=.07;
    const count=8+Math.round(16*q),teeth=[];
    for(let i=0;i<count;i++){const a=i/count*TAU;teeth.push([Math.cos(a)*r,0,Math.sin(a)*r,.026,.038,.04,-a]);}
    boxes(cog,teeth,color);mesh(cog,new THREE.CylinderGeometry(r*.86,r*.86,.025,32),material(color,.7));
    const arm=new THREE.Group();arm.position.y=.11;group.add(arm);
    mesh(arm,new THREE.BoxGeometry(.025,.17+.16*q,.025),material(0xc3d6db),0,.085+.08*q,0);
    updates.push(t=>{cog.rotation.y=t*speed;arm.rotation.z=Math.sin(t*speed)*.5;});
  } else if(kind==='gates' || kind==='tiles') {
    const active=Math.round(q*100), transforms=[];
    for(let i=0;i<100;i++) {
      const x=((i%10)-4.5)*.025,z=(Math.floor(i/10)-4.5)*.025;
      transforms.push([x,.005,z,.018,.009,.018]);
    }
    boxes(group,transforms,0x273c43);
    const g=new THREE.Group();group.add(g);
    const bright=boxes(g,transforms.slice(0,Math.max(1,active)).map(p=>[p[0],.025,p[2],.014,.025+q*.05,.014]),color);
    if(!active) bright.visible=false;
    updates.push(t=>{g.position.y=(.008+.03*q)*(.5+.5*Math.sin(t*speed*2));if(kind==='tiles')g.rotation.y=Math.sin(t*speed)*q*.22;});
    if(kind==='gates'){const rim=circle(.21,.015,color,.5);group.add(rim);}
  } else if(kind==='signals') {
    mesh(group,new THREE.CylinderGeometry(.008,.012,.18+.12*q,8),material(color),0,.09+.06*q,0);
    for(let i=0;i<2+Math.round(q*5);i++) {
      const halo=circle(r,.18+.12*q,color,.7);group.add(halo);
      updates.push(t=>{const f=(t*speed*.24+i/(2+Math.round(q*5)))%1;halo.scale.setScalar(.2+f*1.3);halo.position.y=f*.08;halo.material.opacity=.8*(1-f);});
    }
  } else if(kind==='citadels') {
    const blocks=[],floors=1+Math.round(q*14);
    for(let i=0;i<floors;i++)for(let k=0;k<4;k++)blocks.push([(k%2-.5)*.07,.02+i*.022,(Math.floor(k/2)-.5)*.07,.047,.016,.047]);
    boxes(group,blocks,color);
    const scan=circle(.14,.02,color);group.add(scan);
    updates.push(t=>scan.position.y=((t*speed*.15)%1)*floors*.022);
  } else if(kind==='fences') {
    const bars=[],count=6+Math.round(34*q),h=.03+.24*q;
    for(let i=0;i<count;i++){const a=i/count*TAU;bars.push([Math.cos(a)*r,h/2,Math.sin(a)*r,.008,h,.008]);}
    boxes(group,bars,color);group.add(circle(r,h,color),circle(r,.015,color));
    const gate=mesh(group,new THREE.SphereGeometry(.016,8,6),material(0xf2e9ff));
    updates.push(t=>gate.position.set(Math.cos(t*speed)*r,h,Math.sin(t*speed)*r));
  } else if(kind==='throat') {
    const throat=.13*(1-q)+.012;
    for(let i=0;i<9;i++){const f=i/8;group.add(circle(throat+Math.abs(f-.5)*.4,.03+f*.35,color,.6));}
    for(let i=0;i<2+n;i++){
      const dot=mesh(group,new THREE.SphereGeometry(.006,6,4),material(color));
      updates.push(t=>{const f=(i/(2+n)+t*speed*.12)%1,a=i*2.399+t*.25,rr=(throat+Math.abs(f-.5)*.4)*.8;dot.position.set(Math.cos(a)*rr,.03+f*.35,Math.sin(a)*rr);});
    }
  } else if(kind==='folds') {
    for(let j=0;j<2+Math.round(q*9);j++){
      const pts=[];
      for(let i=0;i<=100;i++){const t=i/100*TAU;pts.push(vec(Math.sin(t*3+j)*r, .15+Math.cos(t*2+j)*.12,Math.sin(t*(2+q)+j)*r));}
      const fold=line(pts,color,.65);group.add(fold);
      updates.push(t=>{fold.rotation.y=t*speed*.09+j;fold.scale.setScalar(.94+.06*Math.sin(t*speed+j));});
    }
  }
  return {group, update:t=>updates.forEach(fn=>fn(t))};
}

export function addEvidenceEffects(globe) {
  const d=globe.dataset, updates=[];
  d.points.forEach((p,i)=>{
    const q=scoreFor(d,p)/100,global=d.geographyMode==='global';
    const lat=d.geographyMode==='geographic'?p.lat:(global?0:-52+i*104/Math.max(1,d.points.length-1));
    const lon=d.geographyMode==='geographic'?p.lon:(global?0:i*137.508);
    const effect=createEffect(d.visual.effect,q,globe.color,hash(p.name));
    const anchor=new THREE.Group();anchor.position.copy(at(lat,lon));anchor.quaternion.setFromUnitVectors(vec(0,1,0),at(lat,lon).normalize());
    anchor.add(effect.group);globe.world.add(anchor);updates.push(effect.update);
    // A global fold is distributed all over the abstract globe, not placed on a map.
    if(global){
      for(let k=1;k<14;k++){
        const copy=createEffect(d.visual.effect,q,globe.color,k);const node=new THREE.Group();
        const v=at(-66+k*132/14,k*137.508);node.position.copy(v);node.quaternion.setFromUnitVectors(vec(0,1,0),v.clone().normalize());node.add(copy.group);globe.world.add(node);updates.push(copy.update);
      }
    }
    const ring=new THREE.Mesh(new THREE.RingGeometry(.025,.031,24),material(globe.color,.7));ring.rotation.x=-Math.PI/2;ring.position.y=.012;anchor.add(ring);
    const hit=mesh(anchor,new THREE.SphereGeometry(Math.max(.07,.1+.13*q),12,8),new THREE.MeshBasicMaterial({visible:false}),0,.09,0);hit.userData.index=i;
    globe.markers.push({group:anchor,hit,ring,point:p,index:i,chartLat:lat,chartLon:lon});
  });
  return t=>updates.forEach(fn=>fn(t));
}

export function addConceptEffects(globe) {
  const seed=hash(globe.entry.id), modes={energy:'arcs',water:'flood',work:'tiles',capital:'coins',models:'neurons',language:'letters',access:'gates',chips:'throat',trust:'binary',biosphere:'folds',science:'citadels',oceans:'signals',mobility:'gears',borders:'fences'};
  const updates=[],count=3+seed%6;
  for(let i=0;i<count;i++) {
    // Explicitly illustrative parameters. No measured score is attached to a concept.
    const e=createEffect(modes[globe.entry.lens]||'folds',.25+((seed+i*31)%65)/100,globe.color,seed+i);
    const g=new THREE.Group(),v=at(-55+(i+.5)*110/count,(seed%360)+i*137.508);
    g.position.copy(v);g.quaternion.setFromUnitVectors(vec(0,1,0),v.clone().normalize());g.add(e.group);globe.world.add(g);updates.push(e.update);
  }
  return t=>updates.forEach(fn=>fn(t));
}
