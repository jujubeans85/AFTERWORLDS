import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildCandidate, canonical, sha256, fetchJson, fetchCollection, writeCandidate, INDICATOR, TITLE, UNIT } from '../scripts/refresh-wdi.mjs';

const bytes = await fs.readFile(new URL('../research/datasets/society-electricity-access.json', import.meta.url));
const baseline = JSON.parse(bytes);
const countryPayload = JSON.parse(await fs.readFile(new URL('../research/sources/society-wdi-countries.json', import.meta.url)));
const observationPayload = JSON.parse(await fs.readFile(new URL('../research/sources/society-wdi-electricity.json', import.meta.url)));
const indicator = [{ id: INDICATOR, name: TITLE, unit: '', source: { id: '2' } }];
function input() { return { baseline: structuredClone(baseline), baselineBytes: bytes, expectedBaselineSha256: sha256(bytes), countries: structuredClone(countryPayload[1]), observations: structuredClone(observationPayload[1]), indicator: structuredClone(indicator), retrievedAt: '2026-10-19T23:00:00.000Z' }; }
const jsonResponse = value => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });

test('frozen source reproduction is a semantic no-op; explicit nulls are preserved', () => {
  const candidate = buildCandidate(input());
  assert.equal(candidate.status, 'no-semantic-change');
  assert.equal(candidate.content.rows.length, 217);
  assert.equal(candidate.diff.missingRows.length, 2);
  assert.equal(candidate.content.aiRelationship, 'context');
  assert.equal(candidate.content.period, '2024');
  assert.equal(candidate.normalizedSha256, candidate.baselineContentSha256);
});

test('valid zero is distinct from null and creates a precisely scoped revision', () => {
  const data = input(); data.observations.find(r => r.countryiso3code === 'AFG').value = 0;
  const result = buildCandidate(data);
  assert.equal(result.status, 'pending-independent-review');
  assert.equal(result.diff.changedRows.length, 1);
  assert.equal(result.diff.changedRows[0].after.value, 0);
  assert.equal(result.diff.changedRows[0].after.status, 'estimated');
  assert.equal(result.content.rows.find(r => r.geographicId === 'AFG').unit, UNIT);
  assert.equal(JSON.parse(bytes).rows.find(r => r.geographicId === 'AFG').value, 87.8);
});

test('absent country observation fails instead of turning into a fabricated null', () => {
  const data = input(); data.observations = data.observations.filter(r => r.countryiso3code !== 'ASM');
  assert.throws(() => buildCandidate(data), /Absent observation ASM/);
});

test('a changed country universe is quarantined and never silently added to rendering', () => {
  const data = input(); data.countries.push({ id: 'ZZZ', name: 'Fixture economy', region: { id: 'TEST' } });
  data.observations.push({ ...data.observations.find(r => r.countryiso3code === 'AFG'), countryiso3code: 'ZZZ' });
  const result = buildCandidate(data);
  assert.deepEqual(result.diff.addedEconomiesNotIncluded, ['ZZZ']);
  assert.equal(result.content.rows.length, 217);
  assert.equal(result.automaticPromotionAllowed, false);
});

test('wrong year, indicator, unit, status, range and duplicates fail closed', () => {
  for (const patch of [{date:'2025'},{indicator:{id:'SP.POP.TOTL',value:TITLE}},{unit:'people'},{obs_status:'F'},{value:101},{value:'87.8'}]) {
    const data=input(); Object.assign(data.observations.find(r=>r.countryiso3code==='AFG'),patch);
    assert.throws(()=>buildCandidate(data));
  }
  const duplicate=input(); duplicate.observations.push(duplicate.observations[0]);
  assert.throws(()=>buildCandidate(duplicate),/Duplicate observation/);
});

test('baseline integrity, geography and indicator metadata are independently enforced', () => {
  const hash=input(); hash.expectedBaselineSha256='0'.repeat(64);
  assert.throws(()=>buildCandidate(hash),/hash mismatch/);
  const geography=input(); geography.countries.find(r=>r.id==='AFG').region.id='NA';
  assert.throws(()=>buildCandidate(geography),/geography changed/);
  const meta=input(); meta.indicator[0].name='Different definition';
  assert.throws(()=>buildCandidate(meta),/metadata/);
});

test('response parsing handles complete pagination and attests raw bytes', async () => {
  let calls=0;
  const collection=await fetchCollection('https://api.worldbank.org/v2/country?format=json',{minimumIntervalMs:0,fetchImpl:async url=> {
    calls++; const page=Number(new URL(url).searchParams.get('page'));
    return jsonResponse([{page,pages:2,total:2},[{id:page}]]);
  }});
  assert.equal(calls,2); assert.equal(collection.rows.length,2);
  assert.equal(collection.pages[0].attestation.sha256,sha256(collection.pages[0].raw));
});

test('incomplete or changing pagination and API-error envelopes fail', async () => {
  for (const payload of [[{page:1,pages:1,total:2},[{}]],[{message:[{id:'120'}]}]]) {
    await assert.rejects(()=>fetchCollection('https://api.worldbank.org/v2/country?format=json',{minimumIntervalMs:0,fetchImpl:async()=>jsonResponse(payload)}));
  }
  await assert.rejects(()=>fetchCollection('https://api.worldbank.org/v2/country?format=json',{minimumIntervalMs:0,fetchImpl:async url=>{
    const page=Number(new URL(url).searchParams.get('page'));
    return jsonResponse([{page,pages:2,total:page===1?2:3},[{}]]);
  }}),/changed during pagination/);
});

test('fetch rejects remote host changes, HTML, HTTP failures, oversized streams and timeouts', async () => {
  await assert.rejects(()=>fetchJson('https://example.org/v2/test'),/allowlist/);
  await assert.rejects(()=>fetchJson('https://api.worldbank.org/v2/test',{fetchImpl:async()=>new Response('<html>',{headers:{'content-type':'text/html'}})}),/JSON/);
  await assert.rejects(()=>fetchJson('https://api.worldbank.org/v2/test',{fetchImpl:async()=>new Response('blocked',{status:429})}),/HTTP 429/);
  await assert.rejects(()=>fetchJson('https://api.worldbank.org/v2/test',{maxBytes:4,fetchImpl:async()=>jsonResponse({too:'large'})}),/size/);
  await assert.rejects(()=>fetchJson('https://api.worldbank.org/v2/test',{timeoutMs:5,fetchImpl:async(_,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(signal.reason)))}),/timed out/);
});

test('canonical hash ignores object key order but distinguishes zero from null', () => {
  assert.equal(canonical({b:2,a:1}),canonical({a:1,b:2}));
  assert.notEqual(sha256(canonical({value:0})),sha256(canonical({value:null})));
});

test('candidate writes are complete, atomic and cannot overwrite an existing version', async () => {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'afterworld-wdi-'));
  try {
    const raw=Buffer.from('{"fixture":true}');
    const data=input(); data.observations.find(r=>r.countryiso3code==='AFG').value=90;
    data.rawSources=[{sha256:sha256(raw),path:'raw/0.json'}];
    const candidate=buildCandidate(data);
    const result=await writeCandidate(candidate,[{raw}],root);
    const saved=JSON.parse(await fs.readFile(path.join(result.path,'candidate.json')));
    assert.equal(saved.normalizedSha256,sha256(canonical(saved.content)));
    assert.equal(sha256(await fs.readFile(path.join(result.path,'raw/0.json'))),sha256(raw));
    assert.deepEqual((await fs.readdir(path.dirname(result.path))).filter(n=>n.startsWith('.staging-')),[]);
    await assert.rejects(()=>writeCandidate(candidate,[{raw}],root),/already exists/);
    const altered=structuredClone(candidate); altered.content.rows[0].value=12;
    await assert.rejects(()=>writeCandidate(altered,[{raw}],root),/content hash/);
    await assert.rejects(()=>writeCandidate(candidate,[{raw:Buffer.from('changed')}],root),/attestation/);
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});

test('no-change checks do not mint candidate releases', async () => {
  const result=await writeCandidate(buildCandidate(input()),[],path.join(os.tmpdir(),'unused-afterworld-path'));
  assert.equal(result.written,false);
});
