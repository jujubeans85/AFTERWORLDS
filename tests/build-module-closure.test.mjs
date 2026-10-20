import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
async function modules(directory) {
  const result=[];
  for(const entry of await fs.readdir(directory,{withFileTypes:true})) {
    const filename=path.join(directory,entry.name);
    if(entry.isDirectory())result.push(...await modules(filename));
    else if(entry.isFile()&&/\.(?:m?js)$/.test(filename))result.push(filename);
  }
  return result;
}
function literalImports(source) {
  const values=[];
  // Built app modules use literal import specifiers. Include re-exports and
  // literal dynamic imports so lazy renderer dependencies are checked too.
  for(const pattern of [
    /^\s*(?:import\s+(?:[^;]*?\sfrom\s+)?|export\s+[^;]*?\sfrom\s+)(['"])([^'"]+)\1/gm,
    /\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g,
  ])for(const match of source.matchAll(pattern))values.push(match[2]);
  return [...new Set(values)];
}

test('every built client module resolves its literal static and lazy import dependencies',async()=>{
  const files=await modules(path.join(dist,'assets'));
  assert.ok(files.length>=10,'Expected the built application modules, not an empty directory');
  const edges=[];
  for(const filename of files) {
    const source=await fs.readFile(filename,'utf8');
    for(const specifier of literalImports(source)) {
      assert.ok(specifier.startsWith('.'),`Client module contains an unresolved non-relative import: ${filename} -> ${specifier}`);
      const target=fileURLToPath(new URL(specifier,pathToFileURL(filename)));
      assert.ok(target.startsWith(dist),`Import leaves the built site: ${filename} -> ${specifier}`);
      const stat=await fs.stat(target).catch(()=>null);
      assert.ok(stat?.isFile(),`Missing built dependency: ${path.relative(dist,filename)} -> ${specifier}`);
      edges.push([filename,target]);
    }
  }
  assert.ok(edges.some(([from,to])=>from.endsWith('/app.js')&&to.endsWith('/research-view.js')),'The lazy native renderer import must be included');
  assert.ok(edges.some(([from,to])=>from.endsWith('/research-view.js')&&to.endsWith('/research-instrument-scene.js')),'The transitive native scene import must be included');
});
