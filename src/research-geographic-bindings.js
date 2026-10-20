export const GEOGRAPHIC_BINDINGS = Object.freeze({
  '378': { datasetId: 'planet-bird-weekly-detections', sha256: '0bb91ffa890a27c9558f314463677b663ff091522d6eda4f47e6dfc476a8eabf', primitive: 'recorder-detection-and-effort-map', count: 1587, unit: 'binary detection', scale: { type: 'categorical-with-separate-effort', domain: [0, 1, null], units: { value: 'binary acoustic detection', uptimeFraction: 'fraction of source week with recording effort' } } },
  '375': { datasetId: 'society-patent-inventors', sha256: 'f29ee04a278ffbdd9312c4515bf52ea90f54d4a32927038eee687f98831b3a88', primitive: 'five-location-count-stems', count: 5, unit: 'simple patent families', scale: { type: 'linear', domain: [0, 40000], unit: 'simple patent families' } },
  '247': { datasetId: 'society-ai-development-partners', sha256: 'e6b13e0515d733bf9495cde5c585242fdcb51db2e85f1308a3c29bc22ac4c161', primitive: 'programme-membership-country-outlines', count: 14, unit: 'programme membership', scale: { type: 'categorical', domain: ['named partner', 'not included in this source'], unit: 'programme membership' } },
  '78-4': { datasetId: 'society-population-connectivity', sha256: '36f0f24a3a21541d98cb2e9f63eacbda19c7bfdd7cda50cc780bc75a8c7b4655', primitive: 'country-count-percentage-switch', count: 217, unit: 'estimated people using Internet', scale: { type: 'switchable', domains: { people: [0, 'max nonnull value'], percent: [0, 100] }, units: { people: 'estimated people using Internet', percent: 'percent of population' } } },
});
export const COUNTRY_JOIN_CONCEPTS = Object.freeze(['408', '375', '247', '78-4']);
export function validateGeographicBinding({ conceptId, design, dataset, binding, sources, datasetSha256 }, canonical, fail) {
  const contract = GEOGRAPHIC_BINDINGS[conceptId];
  if (dataset.datasetId !== contract.datasetId || datasetSha256 !== contract.sha256 || design.implementation?.primitive !== contract.primitive ||
      design.geographyMode !== 'geographic' || dataset.unit !== contract.unit || dataset.rows.length !== contract.count ||
      canonical(design.scale) !== canonical(contract.scale) || canonical(binding.observationPeriod) !== canonical(dataset.time) ||
      canonical(binding.includedRowIds) !== canonical(dataset.rows.map(row => row.id))) fail('changed geographic source binding or scale');
  const seen = new Set(), sites = new Map(), sourceWeeks = new Set(), statistics = new Map();
  const species = ['Willow Warbler', 'Common Chiffchaff', 'Spotted Flycatcher'];
  for (const [index, row] of dataset.rows.entries()) {
    if (!row.id || seen.has(row.id) || binding.fields.some(field => !Object.hasOwn(row, field)) || !sources.has(row.sourceId) || !row.sourceLocator) fail('missing geographic fields or provenance');
    seen.add(row.id);
    if (conceptId === '378') {
      const speciesIndex = Math.floor(index / 529), name = species[speciesIndex];
      if (row.species !== name || row.id !== `bird-${name.toLowerCase().replaceAll(' ', '-')}-${index % 529}` || row.unit !== 'binary acoustic detection' ||
          row.geographicId !== 'NOR' || !Number.isFinite(row.lat) || !Number.isFinite(row.lon) || row.lat < 57 || row.lat > 72 || row.lon < 4 || row.lon > 32 ||
          !Number.isInteger(row.week) || row.week < 10 || row.week > 30 || row.period !== `2022, source week ${row.week}`) fail('changed recorder, species, source week or published coordinates');
      const key = `${row.species}:${row.week}:${row.name}`;
      if (sourceWeeks.has(key)) fail('duplicate source site-week observation'); sourceWeeks.add(key);
      const coordinates = [row.lat, row.lon];
      if (sites.has(row.name) && canonical(sites.get(row.name)) !== canonical(coordinates)) fail('source site coordinates vary between records'); sites.set(row.name, coordinates);
      const counts = statistics.get(name) || [0, 0, 0];
      if (row.uptimeFraction === null) {
        if (row.value !== null || row.automatedDetectionCount !== null || row.status !== 'missing' || row.qualifier !== 'Missing recorder effort: detection status unknown') fail('missing recorder effort must remain unknown'); counts[0]++;
      } else {
        if (!Number.isFinite(row.uptimeFraction) || row.uptimeFraction < 0 || row.uptimeFraction > 1 || !Number.isInteger(row.automatedDetectionCount) || row.automatedDetectionCount < 0 ||
            row.value !== (row.automatedDetectionCount > 0 ? 1 : 0) || row.status !== 'modelled' || row.qualifier !== 'At least one above-threshold BirdNET detection; not an individual bird count') fail('changed binary detection or effort fraction'); counts[row.value === 0 ? 1 : 2]++;
      }
      statistics.set(name, counts);
    } else {
      if (row.lat !== null || row.lon !== null || !/^[A-Z]{3}$/.test(row.geographicId) || row.unit !== contract.unit || row.qualifier !== null) fail('invented geographic point or changed native unit');
      if (conceptId === '375' && (row.geographicId !== ['CHN', 'USA', 'KOR', 'JPN', 'IND'][index] || row.id !== `patent-${row.geographicId}` || row.rank !== index + 1 || !Number.isInteger(row.value) || row.value < 0 || row.value > 40000 || row.period !== '2014–2023' || row.status !== 'observed')) fail('changed inventor-location count or rank');
      if (conceptId === '247' && (row.geographicId !== ['DZA', 'AGO', 'EGY', 'ETH', 'GHA', 'CIV', 'KEN', 'MRT', 'MAR', 'MOZ', 'COG', 'SEN', 'TZA', 'TUN'][index] || row.id !== `hub-${row.geographicId}` || row.value !== 'named partner' || row.period !== '2025-06-20' || row.status !== 'categorical')) fail('changed programme membership');
      if (conceptId === '78-4') {
        if (row.id !== `connected-${row.geographicId}` || row.period !== '2024' || !sources.has(row.populationSourceId) ||
            (row.population !== null && (!Number.isInteger(row.population) || row.population < 0)) ||
            (row.internetPercent !== null && (!Number.isFinite(row.internetPercent) || row.internetPercent < 0 || row.internetPercent > 100))) fail('changed country/economy population or Internet percentage');
        const missing = row.population === null || row.internetPercent === null;
        if (missing ? row.value !== null || row.status !== 'missing' : !Number.isFinite(row.value) || Math.abs(row.value - row.population * row.internetPercent / 100) > 1e-6 || row.status !== 'estimated') fail('derived count differs from available same-year source inputs');
      }
    }
  }
  if (conceptId === '378' && (sites.size !== 27 || canonical([...statistics.values()]) !== canonical([[260, 174, 95], [260, 239, 30], [260, 243, 26]]))) fail('changed bird source coverage');
  if (conceptId === '78-4' && (new Set(dataset.rows.map(row => row.geographicId)).size !== 217 || dataset.rows.filter(row => row.value === null).length !== 35)) fail('changed paired economy coverage');
  return dataset.rows;
}
