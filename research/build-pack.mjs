import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack } from './validate.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const result = await validatePack();
if (result.errors.length) throw new Error(`Research pack cannot be published:\n${result.errors.join('\n')}`);
const baseline = JSON.parse(await fs.readFile(path.join(root, 'baseline.json'), 'utf8'));
const inventory = JSON.parse(await fs.readFile(path.join(root, 'concepts-132.json'), 'utf8'));
const originals = new Map(inventory.map(c => [c.id, c]));
const accepted = result.reviews.filter(c => c.verdict.endsWith('-ready'));
const used = new Set(accepted.flatMap(c => c.datasetIds));
const tally = {};
for (const c of result.reviews) tally[c.verdict] = (tally[c.verdict] || 0) + 1;
const manifest = {
  schemaVersion: 1,
  title: 'AFTERWORLDS — reviewed research implementation pack',
  asOf: baseline.research_as_of,
  baseline,
  scope: 'The 132 previously labelled research concepts. Accepted research is not deployed runtime code.',
  minimumReadiness: 92,
  productQualityRating: null,
  counts: { ...result.counts, acceptedUniqueDatasets: used.size, ...tally },
  concepts: result.reviews.map(c => ({
    conceptId: c.conceptId, sourceTitle: originals.get(c.conceptId).title,
    originalTitle: originals.get(c.conceptId).newTitle, proposedTitle: c.proposedTitle,
    verdict: c.verdict, claim: c.claim, aiRelationship: c.aiRelationship.class,
    datasetIds: c.datasetIds, designId: c.designId,
    researchReadinessScore: c.review.score, blockers: c.blockers,
    fullReview: `research/audits/final-review.json#${c.conceptId}`,
  })),
  datasets: [...result.datasets].map(([id, { file, data }]) => ({
    datasetId: id, path: file, sha256: result.hashes.get(id), rows: data.rows.length,
    title: data.title, unit: data.unit, denominator: data.denominator,
    geography: data.geography, time: data.time,
    sourceUrls: data.sources.map(s => s.url),
    acceptedForImplementation: used.has(id),
    acceptedConceptIds: accepted.filter(c => c.datasetIds.includes(id)).map(c => c.conceptId),
  })),
  implementationQueue: accepted.map(c => ({
    conceptId: c.conceptId, slug: originals.get(c.conceptId).slug,
    title: c.proposedTitle, claim: c.claim, verdict: c.verdict,
    datasets: c.datasetIds.map(id => ({ datasetId: id, path: result.datasets.get(id).file, sha256: result.hashes.get(id) })),
    designId: c.designId, designRegistry: 'research/designs/design-registry.json',
    scoring: c.scoring, forecast: c.forecast, limitations: c.limitations,
    promotionRequires: 'Implement the accepted design and pass browser, device, accessibility, animation, and performance release gates.',
  })),
};
await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const safe = s => String(s ?? '—').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const rows = result.reviews.map(c => `| ${safe(c.conceptId)} | ${safe(c.proposedTitle)} | ${c.verdict} | ${c.review.score ?? 'Unscored'} | ${c.datasetIds.length} | ${safe(c.blockers.join('; ') || c.claim)} |`).join('\n');
await fs.writeFile(path.join(root, 'CONCEPT_RESULTS.md'), `# Results for all 132 research concepts\n\nAs of ${baseline.research_as_of}. Each ready result passed all ten research gates and scored at least 92/100 in the independent review. This is a research acceptance rule, not a 9.2/10 product rating. Read [the full review](audits/final-review.json) for the score evidence, exact claim, source references and file digests. A reframe is accepted only for its revised question.\n\n${accepted.length} accepted concepts, ${used.size} accepted unique datasets, ${result.counts.datasets} total populated datasets, ${result.counts.observations} normalized observations (including explicitly marked missing and interval-only rows). Linked source archives are counted separately. Shared datasets are counted once. Unaccepted files remain research material.\n\n| Source ID | Proposed globe | Verdict | Readiness /100 | Datasets | Claim or blocking evidence needed |\n| --- | --- | --- | ---: | ---: | --- |\n${rows}\n`);
console.log(JSON.stringify({ counts: manifest.counts, manifest: 'research/manifest.json', results: 'research/CONCEPT_RESULTS.md' }, null, 2));
