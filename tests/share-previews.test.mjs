import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import {previewPNG,canonicalOrigin} from '../scripts/share-previews.mjs';
const registry=JSON.parse(await fs.readFile(new URL('../dist/assets/registry.json',import.meta.url)));
test('canonical origin accepts only explicit HTTPS roots',()=>{
 assert.equal(canonicalOrigin('https://example.com/'),'https://example.com');
 for(const value of ['http://example.com','https://user:pass@example.com','https://example.com/path','https://example.com/?tracking=x','https://example.com/#hash'])assert.throws(()=>canonicalOrigin(value));
});
test('share cards are deterministic1200x630 RGB PNGs with complete scanlines',()=>{
 const entry=registry.entries.find(e=>e.id==='408'),png=previewPNG(entry);
 assert.deepEqual(png,previewPNG(entry));assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),630);
 let offset=8,compressed=[];while(offset<png.length){const length=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);if(type==='IDAT')compressed.push(png.subarray(offset+8,offset+8+length));offset+=length+12;}
 assert.equal(inflateSync(Buffer.concat(compressed)).length,(1200*3+1)*630);
});
test('all routes have absolute server-rendered canonical/PNG preview metadata',async()=>{
 for(const entry of registry.entries){
  const html=await fs.readFile(new URL(`../dist/globe/${entry.slug}/index.html`,import.meta.url),'utf8');
  const canonical=`${registry.publicOrigin}/globe/${entry.slug}/`,image=`${registry.publicOrigin}/assets/previews/${entry.slug}.png`;
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
  assert.ok(html.includes(`<meta property="og:image" content="${image}">`));
  assert.ok((await fs.stat(new URL(`../dist/assets/previews/${entry.slug}.png`,import.meta.url))).size>1000);
 }
});
