import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from '../dist/assets/vendor/three.module.js';
import { createCategoryScene } from '../dist/assets/research-category-scene.js';

const designs=JSON.parse(await fs.readFile(new URL('../research/designs/design-registry.json',import.meta.url),'utf8')).designs;
async function evidence(id) {
  const design=designs.find(record=>record.conceptId===id);
  const dataset=JSON.parse(await fs.readFile(new URL(`../${design.datasetBindings[0].path}`,import.meta.url),'utf8'));
  return {conceptId:id,design,dataset,rows:dataset.rows};
}
const canvas=()=>({getContext:()=>({clearRect(){},fillText(){}})});

test('reverse evidence is the nearest outward-facing text surface, not an occluded inward panel',async()=>{
  for(const id of ['397','382','259','170-3','178','107']) {
    const layer=createCategoryScene(await evidence(id),{createCanvas:canvas});
    const positions=layer.panels.map(panel=>panel.position.toArray());
    layer.setReverseEvidence(true);
    layer.world.updateMatrixWorld(true);
    for(const panel of layer.panels) {
      const outward=panel.position.clone().normalize();
      const ray=new THREE.Raycaster(panel.position.clone().addScaledVector(outward,3),outward.clone().negate());
      const hits=ray.intersectObjects(layer.panels,true).filter(hit=>hit.object.isMesh);
      const back=panel.children.find(child=>child.material?.map&&Math.abs(child.rotation.y-Math.PI)<1e-12);
      assert.ok(back,`${id}: reverse text plane exists`);
      assert.equal(hits[0]?.object.uuid,back.uuid,`${id}: reverse text must precede opaque geometry and opposite facets`);
    }
    assert.deepEqual(layer.panels.map(panel=>panel.position.toArray()),positions);
    layer.setReverseEvidence(false);
    layer.panels.forEach(panel=>assert.equal(panel.rotation.y,panel.userData.sourceFace));
  }
});
