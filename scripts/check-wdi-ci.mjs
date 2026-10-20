import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runRefresh, sha256 } from './refresh-wdi.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function runCandidateCheck({ root = ROOT, refresh = runRefresh, now = () => new Date().toISOString() } = {}) {
  const startedAt = now();
  let report;
  try {
    const result = await refresh({ root });
    report = { schemaVersion: 1, datasetId: 'society-electricity-access', startedAt, finishedAt: now(), outcome: 'source-check-completed', acceptanceChanged: false, result };
  } catch (error) {
    report = { schemaVersion: 1, datasetId: 'society-electricity-access', startedAt, finishedAt: now(), outcome: 'source-check-failed', acceptanceChanged: false, error: { message: String(error.message || error), code: error.cause?.code || error.code || null } };
  }
  const bytes = `${JSON.stringify(report, null, 2)}\n`;
  const directory = path.join(root, 'artifacts/wdi-check');
  await fs.mkdir(directory, { recursive: true });
  const filename = path.join(directory, `${sha256(bytes)}.json`);
  try { await fs.writeFile(filename, bytes, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST' || await fs.readFile(filename, 'utf8') !== bytes) throw error;
  }
  return { report, filename };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCandidateCheck().then(({ report, filename }) => {
    console.log(JSON.stringify({ ...report, reportPath: filename }, null, 2));
    if (report.outcome === 'source-check-failed') process.exitCode = 1;
  }, error => { console.error(error.message); process.exitCode = 1; });
}
