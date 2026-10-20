import * as THREE from "./vendor/three.module.js";
import { geographyInstrumentPlan, mapPaintPlan } from "./research-maps.js";
import { paintAccessTexture, accessCountryAt } from "./research-geography.js";
const TAU = 2 * Math.PI;
const xyz = (lat, lon, radius = 1) => new THREE.Vector3(Math.sin(lon * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * radius,
  Math.sin(lat * Math.PI / 180) * radius, Math.cos(lon * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * radius);
const material = color => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
function line(points, color = "#b5c3d0", opacity = 1) {
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false }));
}
function orient(mesh, normal, radius = 1.006) {
  mesh.position.copy(normal).multiplyScalar(radius);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
}
function boundary(country, radius = 1.004) {
  return country.polygons.flatMap(polygon => polygon.flatMap(ring => ring.slice(1).flatMap(([lon, lat], i) =>
    [xyz(ring[i][1], ring[i][0], radius), xyz(lat, lon, radius)])));
}
export function createMapScene(research, { createCanvas = () => document.createElement("canvas") } = {}) {
  const plan = geographyInstrumentPlan(research), world = new THREE.Group(), measured = new THREE.Group(),
    ambient = new THREE.Group(), shell = new THREE.Group(), selection = new THREE.Group();
  world.add(measured, ambient, shell, selection);
  measured.name = "measured-source-geography"; ambient.name = "ambient-frame-not-measured-change";
  const textures = [], rows = research.rows || research.dataset.rows;
  const ring = new THREE.Mesh(new THREE.RingGeometry(.022, .026, 48), material("#ffffff"));
  ring.visible = false; selection.add(ring);
  const surface = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), material("#101a22"));
  surface.rotation.y = -Math.PI / 2; measured.add(surface);
  const hoop = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:128}, (_,i) =>
    new THREE.Vector3(Math.cos(i * TAU / 128) * 1.17, Math.sin(i * TAU / 128) * 1.17, 0))),
    new THREE.LineBasicMaterial({ color: "#b5c3d0", transparent: true, opacity:.26, depthWrite:false }));
  ambient.add(hoop);
  const markers = rows.map((row, index) => ({ row, index, hidden: true, center: new THREE.Vector3(), base:new THREE.Vector3(), normal:new THREE.Vector3(0,0,1) }));
  const layer = { world, measured, ambient, shell, selection, surface, textures, markers, ring, plan,
    frameRadius: 1.48, period:plan.period, animateAmbient(time) { ambient.rotation.set(.35, TAU * time / plan.period, 0); } };
  if (plan.conceptId === "378") {
    const states = { detected: material("#57d5c4"), "not-detected":material("#88bdf4"), unknown:material("#66717e") };
    const siteGroups = plan.sites.map(site => {
      const normal = xyz(site.lat, site.lon), group = new THREE.Group(); orient(group, normal, 1.002); measured.add(group);
      const filled = new THREE.Mesh(new THREE.CircleGeometry(.0035, 24), states.detected);
      const open = new THREE.Mesh(new THREE.RingGeometry(.0027,.0035,24),states["not-detected"]);
      const unknown = new THREE.Mesh(new THREE.CircleGeometry(.0035,24),states.unknown);
      const hatch = line([new THREE.Vector3(-.0025,-.0015,.0001),new THREE.Vector3(.0015,.0025,.0001),
        new THREE.Vector3(-.0015,-.0025,.0001),new THREE.Vector3(.0025,.0015,.0001)],"#b5c3d0");
      const reference = new THREE.Mesh(new THREE.RingGeometry(.0055,.0058,32),material("#344b55"));
      const effort = new THREE.Mesh(new THREE.BufferGeometry(),material("#b5c3d0"));
      const absent = line([new THREE.Vector3(-.0025,-.0025,.0001),new THREE.Vector3(.0025,.0025,.0001),
        new THREE.Vector3(-.0025,.0025,.0001),new THREE.Vector3(.0025,-.0025,.0001)],"#b5c3d0");
      group.add(filled,open,unknown,hatch,reference,effort,absent);
      return {site,normal,group,filled,open,unknown,hatch,reference,effort,absent};
    });
    for (const item of plan.items) {
      const normal = xyz(item.lat,item.lon), marker = markers[item.index];
      Object.assign(marker,{normal,center:normal.clone().multiplyScalar(1.003),base:normal.clone().multiplyScalar(1.009),
        focusRotation:[item.lat*Math.PI/180,-item.lon*Math.PI/180,0],site:item.row.name});
    }
    layer.species=plan.species;layer.weeks=plan.weeks;layer.siteGroups=siteGroups;
    layer.setObservation = (species,week) => {
      if (!plan.species.includes(species)||!plan.weeks.includes(week)) return false;
      markers.forEach(marker=>{marker.hidden=true;});
      const selected=plan.items.filter(item=>item.row.species===species&&item.row.week===week);
      for(const slot of siteGroups){
        const item=selected.find(item=>item.row.name===slot.site.name), state=item?.state||"not-recorded";
        slot.filled.visible=state==="detected";slot.open.visible=state==="not-detected";
        slot.unknown.visible=slot.hatch.visible=state==="unknown";
        slot.absent.visible=state==="not-recorded";
        slot.reference.visible=slot.effort.visible=Boolean(item&&item.effortAngle!==null);
        slot.effort.geometry.dispose();
        slot.effort.geometry=new THREE.RingGeometry(.0059,.0065,48,1,Math.PI/2-(item?.effortAngle||0),item?.effortAngle||0);
        slot.effort.visible=slot.effort.visible&&item.effortAngle>0;
        slot.group.userData={site:slot.site.name,sourceRowId:item?.row.id||null,state,effortAngle:item?.effortAngle??null,
          species,week,absentCombination:!item};
        if(item)markers[item.index].hidden=false;
      }
      return true;
    };
    layer.setObservation(plan.species[0],plan.weeks[0]);
    layer.initialRotation=[64*Math.PI/180,-12*Math.PI/180,0];
    layer.cameraDistance=1.65; layer.minimumCameraDistance=1.08;
    // The crop is only a viewpoint on the source-positioned marks, not relocated geography.
    return layer;
  }
  if (plan.conceptId === "375") {
    const notches = line([new THREE.Vector3(1.155,0,0),new THREE.Vector3(1.185,0,0),
      new THREE.Vector3(-1.155,0,0),new THREE.Vector3(-1.185,0,0)],"#b5c3d0",.28);
    ambient.add(notches);
    layer.animateAmbient = time => { notches.rotation.z = TAU * time / plan.period; };
  }
  const countriesByRow = new Map(plan.countries.map(country=>[country.rowId,country]));
  const diskGroup=new THREE.Group(); measured.add(diskGroup);
  const canvases = ["people", ...(plan.conceptId==="78-4"?["percent"]:[])].map(mode=>{
    const canvas=createCanvas();canvas.width=2048;canvas.height=1024;
    paintAccessTexture(canvas,mapPaintPlan(plan,mode));
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearFilter;texture.generateMipmaps=false;textures.push(texture);return texture;
  });
  surface.material.map=canvases[0];surface.material.needsUpdate=true;
  const outlinePoints = plan.countries.flatMap(country=>boundary(country));
  if (["375","247"].includes(plan.conceptId)) measured.add(line(outlinePoints,"#57d5c4"));
  const selectedOutline=line([],"#ffffff");selection.add(selectedOutline);
  for(const marker of markers){
    const country=countriesByRow.get(marker.row.id); marker.country=country||null;
    if(!country)continue;
    const [lon,lat]=country.polygons[0][0][0], anchor=country.displayAnchor||{lat,lon};
    const normal=xyz(anchor.lat,anchor.lon);Object.assign(marker,{hidden:false,normal,center:normal.clone().multiplyScalar(1.009),
      base:normal.clone().multiplyScalar(1.013),focusRotation:[anchor.lat*Math.PI/180,-anchor.lon*Math.PI/180,0]});
    if(plan.conceptId==="375"){
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,Math.max(country.length,1e-10),12),material("#57d5c4"));
      stem.position.copy(normal).multiplyScalar(1+country.length/2);stem.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);
      stem.userData={rowId:marker.row.id,length:country.length,value:marker.row.value,displayAnchor:anchor};measured.add(stem);
      marker.center.copy(normal).multiplyScalar(1+country.length/2);marker.hitPoints=Array.from({length:12},(_,i)=>normal.clone().multiplyScalar(1+country.length*i/11));
    }
    if(plan.conceptId==="78-4"&&country.radius!==null){
      const disk=new THREE.Mesh(new THREE.CircleGeometry(Math.max(country.radius,1e-10),48),material("#57d5c4"));orient(disk,normal,1.01);
      disk.visible=country.radius>0;disk.userData={rowId:marker.row.id,radius:country.radius,value:marker.row.value,displayAnchor:anchor};diskGroup.add(disk);
    }
  }
  layer.countryAt=(lon,lat)=>accessCountryAt(plan,lon,lat);
  layer.useCountryPicking=plan.conceptId==="247";
  layer.onSelect=index=>{
    const country=markers[index]?.country;selectedOutline.geometry.dispose();
    selectedOutline.geometry=new THREE.BufferGeometry().setFromPoints(country?boundary(country,1.006):[]);
    selectedOutline.visible=Boolean(country);
  };
  layer.mapModes=plan.conceptId==="78-4"?["people","percent"]:[];
  layer.setMapMode=mode=>{
    if(!layer.mapModes.includes(mode))return false;
    surface.material.map=canvases[mode==="people"?0:1];diskGroup.visible=mode==="people";layer.useCountryPicking=mode==="percent";return true;
  };
  layer.diskGroup=diskGroup;
  layer.initialRotation=plan.conceptId==="247"?[.15,-.2,0]:plan.conceptId==="375"?[.35,-1.4,0]:[.16,0,0];
  return layer;
}
