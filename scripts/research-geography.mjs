import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { decodeTopology } from '../src/math.js';

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export async function prepareElectricityGeography(root, dataset) {
  const auditBytes = await fs.readFile(path.join(root, 'data/geography/un-m49-world-atlas.json'));
  if (sha256(auditBytes) !== '4735f3c57f742c3ee047b08f3f33fdd650e7f7bd50b88230bc8f9c765ebc4e81') throw new Error('Geography: code-join audit digest mismatch');
  const audit = JSON.parse(auditBytes);
  const topologyBytes = await fs.readFile(path.join(root, audit.geometry.path));
  if (audit.geometry.path !== 'vendor/countries-110m.json' || sha256(topologyBytes) !== audit.geometry.sha256) throw new Error('Geography: pinned boundary digest mismatch');
  const decoded = decodeTopology(JSON.parse(topologyBytes));
  const codes = new Map();
  const numericCodes = new Set();
  for (const code of audit.codes) {
    if (!/^[A-Z]{3}$/.test(code.iso3) || !/^\d{3}$/.test(code.numeric) || codes.has(code.iso3) || numericCodes.has(code.numeric)) throw new Error('Geography: duplicate or invalid code');
    codes.set(code.iso3, code);
    numericCodes.add(code.numeric);
  }
  const polygons = new Map();
  for (const country of decoded) {
    if (!country.id) continue; // Never resolve an unkeyed territory by name.
    if (polygons.has(country.id)) throw new Error('Geography: duplicate boundary code');
    polygons.set(country.id, country);
  }
  const countries = [], unsupported = [];
  for (const row of dataset.rows) {
    const code = codes.get(row.geographicId);
    const country = code && polygons.get(code.numeric);
    const reason = audit.excludedScopes[row.geographicId] || (!code ? 'No approved numeric-code join for this source economy.' : !country ? 'No geometry for this economy in the supplied 1:110m boundary file.' : null);
    if (reason) unsupported.push({ rowId: row.id, geographicId: row.geographicId, reason });
    else countries.push({ rowId: row.id, geographicId: row.geographicId, geometryId: code.numeric, name: country.name, polygons: country.polygons });
  }
  return {
    schemaVersion: 1,
    datasetId: dataset.datasetId,
    auditSha256: sha256(auditBytes),
    boundarySha256: audit.geometry.sha256,
    source: { ...audit.source, geometry: audit.geometry.source },
    limitations: audit.limitations,
    countries,
    backgroundCountries: decoded.map(country => ({ geometryId: country.id || null, polygons: country.polygons })),
    unsupported,
    unsupportedRowIds: unsupported.map(row => row.rowId),
    coverage: { total: dataset.rows.length, mapped: countries.length, tableOnly: unsupported.length },
  };
}

// Deterministic interior display anchors are derived only from audited polygons.
// They never replace the null observed coordinates in a source row.
export async function prepareCountryGeography(root, dataset, { anchors = false } = {}) {
  const geography = await prepareElectricityGeography(root, dataset);
  if (!anchors) return geography;
  const { interiorDisplayAnchor } = await import('../src/research-geographic-anchors.js');
  for (const country of geography.countries) country.displayAnchor = interiorDisplayAnchor(country.polygons);
  geography.displayAnchorMeaning = 'Polygon-interior display anchors show country summaries; they are not observed facilities, research sites or local density.';
  return geography;
}
