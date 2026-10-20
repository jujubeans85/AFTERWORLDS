import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const DATASET_ID = 'society-electricity-access';
export const SOURCE_ID = 'wdi-electricity';
export const INDICATOR = 'EG.ELC.ACCS.ZS';
export const YEAR = '2024';
export const TITLE = 'Access to electricity (% of population)';
export const UNIT = 'percent of population';
export const ENDPOINTS = {
  countries: 'https://api.worldbank.org/v2/country?format=json&per_page=400',
  observations: `https://api.worldbank.org/v2/country/all/indicator/${INDICATOR}?date=${YEAR}&source=2&format=json&per_page=20000&footnote=y`,
  indicator: `https://api.worldbank.org/v2/indicator/${INDICATOR}?source=2&format=json`,
};
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const fail = message => { throw new Error(message); };
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  if (typeof value === 'number' && !Number.isFinite(value)) fail('Nonfinite value');
  if (value === undefined) fail('Undefined canonical value');
  return JSON.stringify(value);
}
const positiveInt = (v, name, zero = false) => {
  if (!/^[0-9]+$/.test(String(v)) || !Number.isSafeInteger(Number(v)) || Number(v) < (zero ? 0 : 1)) fail(`Invalid ${name}`);
  return Number(v);
};

// The timeout remains active through body consumption, and the stream is bounded.
export async function fetchJson(url, { fetchImpl = fetch, timeoutMs = 30000, maxBytes = 20000000, rateState = null, minimumIntervalMs = 1000 } = {}) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'api.worldbank.org' || parsed.port || parsed.username || parsed.password || !parsed.pathname.startsWith('/v2/')) fail('Endpoint outside allowlist');
  if (rateState) {
    const delay = minimumIntervalMs - (Date.now() - rateState.lastStarted);
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
    rateState.lastStarted = Date.now();
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('WDI request timed out')), timeoutMs);
  try {
    const response = await fetchImpl(url, { signal: controller.signal, redirect: 'error', headers: { Accept: 'application/json' } });
    if (!response.ok) fail(`WDI HTTP ${response.status}; no candidate written`);
    if (!/^application\/json(?:;|$)/i.test(response.headers.get('content-type') || '')) fail('Expected JSON response');
    const length = response.headers.get('content-length');
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) fail('Response size exceeds limit');
    if (!response.body) fail('Empty response body');
    const reader = response.body.getReader();
    let size = 0; const chunks = [];
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) { await reader.cancel(); fail('Response size exceeds limit'); }
        chunks.push(Buffer.from(value));
      }
    } finally { reader.releaseLock(); }
    const raw = Buffer.concat(chunks);
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
    return { value, raw, attestation: { url, fetchedAt: new Date().toISOString(), httpStatus: response.status, contentType: response.headers.get('content-type'), etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified'), bytes: size, sha256: sha256(raw) } };
  } finally { clearTimeout(timeout); }
}

export async function fetchCollection(baseUrl, options = {}) {
  const rateState = options.rateState ?? { lastStarted: 0 };
  const pages = []; let byteTotal = 0; let total = null, expectedPages = null, sourceUpdated = null;
  for (let page = 1; page <= (expectedPages ?? 1); page++) {
    const url = new URL(baseUrl); url.searchParams.set('page', String(page));
    const result = await fetchJson(url.href, { ...options, rateState });
    byteTotal += result.raw.length;
    if (byteTotal > (options.maxBytes ?? 20000000)) fail('Collection byte limit exceeded');
    if (!Array.isArray(result.value) || result.value.length !== 2 || !result.value[0] || !Array.isArray(result.value[1])) fail('Invalid API envelope');
    const [meta, rows] = result.value;
    if (positiveInt(meta.page, 'page') !== page) fail('Pagination page mismatch');
    const count = positiveInt(meta.pages, 'pages'), rowTotal = positiveInt(meta.total, 'total', true);
    if (count > 20 || rowTotal > 100000) fail('Collection exceeds limits');
    if (page === 1) { expectedPages = count; total = rowTotal; sourceUpdated = meta.lastupdated ?? null; }
    if (count !== expectedPages || rowTotal !== total || (meta.lastupdated ?? null) !== sourceUpdated) fail('Collection changed during pagination');
    if (meta.lastupdated !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(meta.lastupdated)) fail('Invalid source update date');
    if (meta.sourceid !== undefined && String(meta.sourceid) !== '2') fail('Unexpected WDI source');
    pages.push({ ...result, rows, metadata: meta });
  }
  const rows = pages.flatMap(p => p.rows);
  if (rows.length !== total) fail('Incomplete pagination');
  return { rows, pages, sourceUpdated };
}

function content(baseline, rows, annotations = {}) {
  return { datasetId: DATASET_ID, indicator: INDICATOR, period: YEAR, unit: UNIT, aiRelationship: baseline.aiRelationship, geography: baseline.geography, rows: [...rows].sort((a,b) => a.id.localeCompare(b.id)), annotations };
}

export function buildCandidate({ baseline, baselineBytes, expectedBaselineSha256, countries, observations, indicator, retrievedAt = new Date().toISOString(), rawSources = [], comparison = null }) {
  const baselineSha256 = sha256(baselineBytes);
  if (baselineSha256 !== expectedBaselineSha256) fail('Frozen baseline hash mismatch');
  if (canonical(JSON.parse(Buffer.from(baselineBytes).toString('utf8'))) !== canonical(baseline)) fail('Baseline object differs from attested bytes');
  if (baseline.datasetId !== DATASET_ID || baseline.aiRelationship !== 'context' || baseline.geography?.unit !== 'country/economy' || baseline.unit !== UNIT) fail('Baseline semantic contract changed');
  const metadata = indicator.filter(r => r.id === INDICATOR);
  if (indicator.length !== 1 || metadata.length !== 1 || metadata[0].name !== TITLE || String(metadata[0].source?.id) !== '2' || !['', '%'].includes(metadata[0].unit)) fail('Indicator metadata/units changed');
  const countryMap = new Map();
  for (const row of countries) {
    if (!/^[A-Z0-9]{3}$/.test(row.id) || !row.region || typeof row.region.id !== 'string' || !row.region.id || typeof row.name !== 'string') fail('Invalid country metadata');
    if (countryMap.has(row.id)) fail('Duplicate country metadata');
    countryMap.set(row.id, row);
  }
  const sourceMap = new Map();
  for (const row of observations) {
    let iso = row.countryiso3code;
    // WDI omits ISO3 on some income-group aggregates. Resolve only an exact
    // metadata ISO2 match explicitly classified as aggregate; never infer a country.
    if (iso === '') {
      const matches = countries.filter(c => c.iso2Code === row.country?.id && c.region.id === 'NA');
      if (matches.length !== 1) fail('Unresolved aggregate geography');
      iso = matches[0].id;
    }
    if (row.indicator?.id !== INDICATOR || row.indicator?.value !== TITLE || row.date !== YEAR) fail('Indicator or year mismatch');
    if (!['', '%'].includes(row.unit) || row.obs_status !== '') fail('Observation unit/status requires review');
    if (!Object.hasOwn(row, 'value') || (row.value !== null && (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 || row.value > 100))) fail('Invalid percentage or absent value field');
    if (!countryMap.has(iso)) fail(`Unknown source geography ${iso}`);
    if (sourceMap.has(iso)) fail(`Duplicate observation ${iso}`);
    sourceMap.set(iso, row);
  }
  const ids = new Set(), annotations = {}, changes = [];
  const rows = baseline.rows.map(old => {
    const iso = old.geographicId;
    if (ids.has(iso) || old.id !== `electricity-${iso}` || old.entityId !== old.id || old.period !== YEAR || old.unit !== UNIT || old.sourceId !== SOURCE_ID || old.lat !== null || old.lon !== null || !['estimated','missing'].includes(old.status) || ((old.value === null) !== (old.status === 'missing'))) fail('Invalid baseline row contract');
    ids.add(iso);
    if (!countryMap.has(iso) || countryMap.get(iso).region.id === 'NA') fail(`Baseline geography changed ${iso}`);
    if (!sourceMap.has(iso)) fail(`Absent observation ${iso}; absence is not an explicit null`);
    const incoming = sourceMap.get(iso);
    if (incoming.footnote !== undefined && typeof incoming.footnote !== 'string') fail('Invalid footnote');
    if (incoming.footnote) annotations[iso] = { footnote: incoming.footnote };
    if (countryMap.get(iso).name !== old.name) annotations[iso] = { ...annotations[iso], sourceName: countryMap.get(iso).name };
    const next = { ...old, value: incoming.value, status: incoming.value === null ? 'missing' : 'estimated' };
    if (old.value !== next.value || old.status !== next.status) changes.push({ id: old.id, geographicId: iso, before: { value: old.value, status: old.status }, after: { value: next.value, status: next.status } });
    return next;
  });
  const newEconomies = [...sourceMap.keys()].filter(id => countryMap.get(id).region.id !== 'NA' && !ids.has(id)).sort();
  const normalized = content(baseline, rows, annotations), baselineContent = content(baseline, baseline.rows);
  const normalizedSha256 = sha256(canonical(normalized));
  const baselineContentSha256 = sha256(canonical(baselineContent));
  if (comparison && (!/^[0-9TZ]+-[a-f0-9]{12}$/.test(comparison.versionId) || !/^[a-f0-9]{64}$/.test(comparison.normalizedSha256))) fail('Invalid accepted comparison reference');
  const status = normalizedSha256 === (comparison?.normalizedSha256 || baselineContentSha256) && !newEconomies.length ? 'no-semantic-change' : 'pending-independent-review';
  return { schemaVersion: 1, datasetId: DATASET_ID, status, versionId: `${retrievedAt.replace(/[^0-9TZ]/g,'')}-${normalizedSha256.slice(0,12)}`, parentVersionId: comparison?.versionId || `frozen-${baselineSha256.slice(0,12)}`, comparisonContentSha256: comparison?.normalizedSha256 || baselineContentSha256, baselineSha256, baselineContentSha256, normalizedSha256, retrievedAt, adapterVersion: 'wdi-fixed-year-electricity-v1', sourceReleases: [{ sourceId: SOURCE_ID, indicator: INDICATOR, observationYear: YEAR }], rawSources, content: normalized, diff: { changedRows: changes, addedEconomiesNotIncluded: newEconomies, annotationsRequireReview: Object.keys(annotations), missingRows: rows.filter(r => r.value === null).map(r => r.id) }, validation: { baselineIntegrity: 'pass', schema: 'pass', indicatorUnitAndYear: 'pass', geography: 'baseline universe preserved', absencePolicy: 'fail; never create a null from absence' }, review: { status: 'not-reviewed', reviewer: null, acceptedAt: null, blockers: ['Independent source/terms and semantic review required.', ...(newEconomies.length ? ['New source economies require universe/design review.'] : [])] }, designBinding: null, automaticPromotionAllowed: false };
}

export async function writeCandidate(candidate, rawPages, outputRoot) {
  if (candidate.status === 'no-semantic-change') return { written: false, reason: 'No semantic change; no candidate release created.' };
  if (sha256(canonical(candidate.content)) !== candidate.normalizedSha256) fail('Candidate content hash mismatch');
  if (rawPages.length !== candidate.rawSources.length || rawPages.some((p,i) => sha256(p.raw) !== candidate.rawSources[i].sha256)) fail('Raw attestation mismatch');
  const parent = path.join(outputRoot, DATASET_ID);
  await fs.mkdir(parent, { recursive: true });
  if (!/^[0-9TZ]+-[a-f0-9]{12}$/.test(candidate.versionId)) fail('Invalid version identifier');
  const target = path.join(parent, candidate.versionId);
  try { await fs.access(target); fail('Candidate version already exists'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const staging = await fs.mkdtemp(path.join(parent, '.staging-'));
  try {
    await fs.mkdir(path.join(staging, 'raw'));
    for (let i=0;i<rawPages.length;i++) await fs.writeFile(path.join(staging,'raw',`${i}.json`),rawPages[i].raw,{flag:'wx'});
    await fs.writeFile(path.join(staging,'candidate.json'),JSON.stringify(candidate,null,2)+'\n',{flag:'wx'});
    await fs.rename(staging,target);
    return { written: true, path: target };
  } catch(e) { await fs.rm(staging,{recursive:true,force:true}); throw e; }
}

export async function writeCheckReceipt(result, root = ROOT) {
  const receipt = { schemaVersion: 1, datasetId: DATASET_ID, status: result.status, changedRows: result.changedRows, normalizedSha256: result.normalizedSha256, sourceCheck: result.sourceCheck };
  const bytes = `${JSON.stringify(receipt, null, 2)}\n`;
  const directory = path.join(root, 'data-updates/checks', DATASET_ID);
  await fs.mkdir(directory, { recursive: true });
  const filename = path.join(directory, `${sha256(bytes)}.json`);
  try { await fs.writeFile(filename, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || await fs.readFile(filename, 'utf8') !== bytes) throw error;
  }
  return filename;
}

export async function runRefresh({ root = ROOT, fetchImpl = fetch } = {}) {
  const baselineBytes = await fs.readFile(path.join(root,'research/datasets',`${DATASET_ID}.json`));
  const baseline = JSON.parse(baselineBytes);
  const policy = JSON.parse(await fs.readFile(path.join(root,'docs/next-version/update-policy.json'),'utf8'));
  const entry = policy.datasets.find(d => d.datasetId === DATASET_ID);
  if (!entry) fail('Missing update policy');
  if (sha256(baselineBytes) !== entry.baseline.sha256) fail('Frozen baseline hash mismatch');
  const acquired = {}, rateState = { lastStarted: 0 };
  for (const [kind,url] of Object.entries(ENDPOINTS)) acquired[kind] = await fetchCollection(url,{fetchImpl,rateState});
  const rawPages = Object.entries(acquired).flatMap(([kind,v]) => v.pages.map(p => ({...p,kind})));
  const rawSources = rawPages.map((p,i) => ({...p.attestation,kind:p.kind,path:`raw/${i}.json`,metadata:p.metadata}));
  const { readAcceptedWdiRelease } = await import('./review-wdi.mjs');
  const accepted = await readAcceptedWdiRelease({ root });
  const comparison = accepted ? { versionId: accepted.versionId, normalizedSha256: accepted.normalizedSha256 } : null;
  const candidate = buildCandidate({baseline,baselineBytes,expectedBaselineSha256:entry.baseline.sha256,countries:acquired.countries.rows,observations:acquired.observations.rows,indicator:acquired.indicator.rows,rawSources,comparison});
  candidate.sourceReleases[0].databaseLastUpdated = acquired.observations.sourceUpdated;
  const result = await writeCandidate(candidate,rawPages,path.join(root,'data-updates/candidates'));
  const summary = {status:candidate.status,changedRows:candidate.diff.changedRows.length,normalizedSha256:candidate.normalizedSha256,sourceCheck:{checkedAt:candidate.retrievedAt,databaseLastUpdated:acquired.observations.sourceUpdated,rawDigests:rawSources.map(s=>({url:s.url,sha256:s.sha256,bytes:s.bytes}))},...result};
  const checkReceipt = await writeCheckReceipt(summary, root);
  return { ...summary, checkReceipt };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--help')) console.log('node scripts/refresh-wdi.mjs\nFetch a fixed-2024 electricity-access candidate only; no schedules, acceptance or production mutation.');
  else if (process.argv.length > 2) { console.error('Unknown arguments; use --help'); process.exitCode=1; }
  // Do not hold module evaluation open: the optional accepted-release reader
  // imports this module's pure normalizer to reproduce the prior snapshot.
  else runRefresh().then(result => console.log(JSON.stringify(result,null,2)), error => { console.error(error.message); process.exitCode=1; });
}
