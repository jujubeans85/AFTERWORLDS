// These profiles validate source meaning only. They do not assign visual size,
// coordinates or activation. Exact source bytes remain bound by reviewed hashes.
export const CATEGORICAL_BINDINGS = Object.freeze({
  '417': {
    datasetId: 'governance-eurohpc-cooperation', primitive: 'consortium-membership-facets',
    unit: 'selection status', datasetUnit: 'selection status', domain: ['selected'],
    ids: ['lumi', 'hammerhai', 'pharos', 'it4lia', 'l-ai', 'bsc-ai-factory', 'mimer'],
    period: '2024-12-10', geographicIds: ['FIN', 'DEU', 'GRC', 'ITA', 'LUX', 'ESP', 'SWE'],
    extras: { hostCountry: 'string', consortiumCountries: 'string' },
  },
  '415': {
    datasetId: 'society-ai-growth-zones', primitive: 'announced-zone-date-facets',
    unit: 'announcement status', datasetUnit: 'announcement status', domain: ['announced'],
    ids: ['zone-1', 'zone-2', 'zone-3', 'zone-4', 'zone-5'],
    periods: ['2026-01-29', '2025-11-20', '2025-11-13', '2025-09-16', '2025-04-30'],
    extras: { announcementDate: 'string', country: 'string' },
  },
  '397': {
    datasetId: 'governance-canada-immigration', primitive: 'jurisdiction-workflow-double-facet',
    unit: 'documented workflow component', datasetUnit: 'decision-system category',
    domain: ['sponsorship', 'principal applicant'], domainField: 'component',
    ids: ['ircc-sponsor', 'ircc-applicant'], period: '2024-05-30', geographicIds: ['CAN', 'CAN'],
    values: ['ML rules and officer rules; no automated refusal'],
    extras: { finalDecision: 'string', component: 'string' },
  },
  '382': {
    datasetId: 'physical-announced-land', primitive: 'footprint-definition-double-facet', type: 'none',
    unit: 'acres of announced site; square feet of announced floorspace, separately', datasetUnit: 'mixed, row-specific',
    ids: ['richland-site', 'richland-floor'], rowUnits: ['acres', 'square feet'],
    period: '2024-12-04 announcement', statuses: ['observed', 'observed'], geographicIds: ['US-LA-Richland', 'US-LA-Richland'],
    extras: { measurement: 'string' },
  },
  '371': {
    datasetId: 'governance-deepfake-fraud-cases', primitive: 'fraud-amount-meaning-facets', type: 'none',
    unit: 'case-specific monetary amounts displayed as text', datasetUnit: 'HKD; row-specific amount type must be displayed',
    ids: ['hk-loan-case', 'hk-video-jan', 'hk-video-may'], rowUnits: ['HKD involved', 'HKD reported loss', 'HKD instructed transfer'],
    periods: ['2022-09/2023-07', '2024-01', '2024-05-20'], statuses: ['estimated', 'estimated', 'estimated'],
    qualifiers: ['reported amount', 'about', 'nearly'], geographicIds: ['HKG', 'HKG', 'HKG'],
    extras: { amountQualifier: 'string', reportedAt: 'string', caseStatusAtPublication: 'string' },
  },
  '368': {
    datasetId: 'physical-chip-rule-events', primitive: 'licence-rule-product-gates',
    unit: 'dated policy category', datasetUnit: 'category',
    domain: ['Case-by-case export licence review', 'A stated qualifying condition'],
    ids: ['h200', 'mi325x', 'testcondition'], period: '2026-01-13 announcement', geographicIds: ['CHN', 'CHN', 'USA'],
  },
  '358': {
    datasetId: 'physical-autonomous-voyages', primitive: 'voyage-supervision-ledger',
    unit: 'documented project milestone', datasetUnit: 'category', domain: 'source supervision statements',
    ids: ['mas', 'yara-first', 'yara-crew'], periods: ['2022-06-05 arrival', '2023-03', 'Undated current article snapshot'],
    geographicIds: ['CAN-Halifax', 'NOR-Porsgrunn-Brevik', 'NOR-Porsgrunn-Brevik'],
    values: ['No onboard captain or crew', 'Autonomous voyage under human supervision', 'Three supervising crew reported onboard'],
  },
  '356': {
    datasetId: 'governance-uk-asylum-roles', primitive: 'assistance-and-oversight-four-facets',
    unit: 'documented system/oversight description', datasetUnit: 'reported system role', domain: 'dated roles and oversight statements',
    ids: ['acs-role', 'aps-role', 'asylum-notification', 'asylum-audit'],
    rowUnits: ['reported system role', 'reported system role', 'reported oversight category', 'reported oversight category'],
    periods: ['2024-05/2024-12', '2024-05/2024-12', '2026-08-07', '2026-06-22'], geographicIds: ['GBR', 'GBR', 'GBR', 'GBR'],
    values: ['AI summarises interview transcripts for caseworkers', 'AI finds and summarises country policy information', 'Applicants not specifically told AI was used in their claim', 'No independent audit planned at that stage'],
  },
  '348': {
    datasetId: 'planet-ai-science-comparisons', primitive: 'bibliometric-definition-five-facets', type: 'none',
    unit: 'five separately defined study measures; native-unit text', datasetUnit: 'mixed comparative metrics',
    ids: ['science-papers', 'science-citations', 'science-leadership', 'science-breadth', 'science-engagement'],
    rowUnits: ['ratio of average annual papers per researcher', 'ratio of average annual citations per researcher', 'years earlier in modelled transition', 'percent lower median knowledge extent', 'percent lower follow-on citation engagement'],
    period: '1980–2025 corpus', statuses: ['estimated', 'estimated', 'modelled', 'estimated', 'estimated'],
  },
  '321': {
    datasetId: 'physical-flexible-workloads', primitive: 'demand-response-schedule-facets',
    unit: 'documented demand-response participation', datasetUnit: 'category', domain: 'source programme and schedule descriptions',
    ids: ['flex-nld', 'flex-bel', 'flex-irl', 'flex-fin', 'flex-dnk', 'flex-taiwan', 'flex-oregon'],
    periods: [...Array(5).fill('2022-12/2023-03'), '2022/2023 summers', '2023-10 disclosure'],
    geographicIds: ['NLD', 'BEL', 'IRL', 'FIN', 'DNK', 'TWN', 'US-OR-TheDalles'],
    values: ['Daily 17:00–21:00 reductions', 'Summer peak-demand reductions', 'Utility demand-response pilot'],
  },
  '314': {
    datasetId: 'physical-zero-evaporation-design', primitive: 'cooling-design-tradeoff-triptych',
    unit: 'design disclosure status', datasetUnit: 'category', domain: 'source plans and caveat',
    ids: ['phoenix-pilot', 'mountpleasant-pilot', 'tradeoff'], period: '2024-12-09',
    geographicIds: ['USA-Phoenix', 'US-WI-MountPleasant', null], values: ['Pilot planned for 2026', 'Potential increase in PUE'],
  },
  '305': {
    datasetId: 'physical-euv-dependencies', primitive: 'euv-role-three-way-assembly',
    unit: 'engineering role', datasetUnit: 'category', domain: 'documented supplier roles',
    ids: ['euv-nl', 'euv-us', 'euv-de'], period: '2022 disclosure', geographicIds: ['NLD', 'USA', 'DEU'],
    values: ['EUV system integration', 'Droplet generators, sensors and stages', 'ZEISS optics and TRUMPF lasers'],
  },
  '259': {
    datasetId: 'governance-un-mandate-handoff', primitive: 'mandate-handoff-double-node',
    unit: 'source-defined mandate', datasetUnit: 'institutional mandate', domain: 'institutional mandate',
    ids: ['un-scientific-panel', 'un-global-dialogue'], period: '2025-08-26',
    values: ['Scientific synthesis; annual non-prescriptive report', 'Government and stakeholder discussion; annual meeting and co-chair summary'],
    extras: { mechanism: 'string' },
  },
  '256': {
    datasetId: 'governance-orbital-app-ledger', primitive: 'onboard-app-status-shell',
    unit: 'app status at launch', datasetUnit: 'onboard-app status', domain: ['reported onboard at launch', 'planned later upload'],
    ids: ['phisat-0', 'phisat-1', 'phisat-2', 'phisat-3', 'phisat-4', 'phisat-5'], period: '2024-08-17',
  },
  '250': {
    datasetId: 'governance-newsroom-disclosure', primitive: 'editorial-rule-pages',
    unit: 'editorial-policy category', datasetUnit: 'editorial-policy category',
    domain: ['allowed with journalist review', 'prohibited', 'disclosure standard required', 'identify and contextualise'],
    ids: ['ap-text', 'ap-photography', 'ap-material', 'ap-manipulated'], period: '2026-07-23',
  },
  '107': {
    datasetId: 'planet-ocean-data-policies', primitive: 'repository-rule-three-portfolios',
    unit: 'published access and reuse rule', datasetUnit: 'policy case', domain: 'source-defined repository policy',
    ids: ['ocean-rights-gebco', 'ocean-rights-argo', 'ocean-rights-cchdo'],
    periods: ['Terms observed 2026-10-19', 'Policy observed 2026-10-19', 'Policy observed 2026-10-19'],
    values: ['public domain with attribution and use conditions', 'freely available without restriction; acknowledgement requested', 'CC0 by default; CC BY available by prior request'],
  },
  '150-5': {
    datasetId: 'physical-aviation-automation', primitive: 'investigation-mechanism-three-facets',
    unit: 'documented automation description', datasetUnit: 'category', domain: 'investigation-record mechanisms',
    ids: ['lion610', 'et302', 'mcas-trigger'], periods: ['2018-10-29', '2019-03-10', '2019 report'],
    geographicIds: ['IDN-JavaSea', 'ETH-Ejere', null], values: ['MCAS operation examined', 'Threshold-based stability augmentation described'],
  },
  '155-17': {
    datasetId: 'society-platform-partnerships', primitive: 'partnership-knot',
    unit: 'documented organisational relationship', datasetUnit: 'documented organisational relationship', domain: ['studied partnership'],
    ids: ['partnership-1', 'partnership-2', 'partnership-3'], period: '2025-01 report snapshot',
    extras: { fromEntity: 'string', toEntity: 'string' },
  },
  '170-3': {
    datasetId: 'planet-ai-planets', primitive: 'confirmed-discovery-two-sided-orb',
    unit: 'named confirmed discovery case', datasetUnit: 'categorical case', domain: ['confirmed ML-assisted discovery'],
    ids: ['kepler-90i', 'kepler-80g'], period: '2017 discovery announcement; archive confirmation checked 2026-10-19',
    extras: { hostStar: 'string', archiveName: 'string', archiveHost: 'string' },
  },
  '178': {
    datasetId: 'governance-monitoring-mechanisms', primitive: 'legal-mechanism-double-shell',
    unit: 'instrument category', datasetUnit: 'instrument category', domain: ['treaty with follow-up mechanism', 'voluntary reporting'],
    ids: ['cets225', 'haip2'], periods: ['2024-09-05', '2026-05-28'],
    extras: { mechanism: 'string', exclusions: 'string' },
  },
});

export function validateCategoricalScope({ conceptId, design, dataset, binding, sources }, fail) {
  const contract = CATEGORICAL_BINDINGS[conceptId], numericText = contract.type === 'none';
  if (dataset.datasetId !== contract.datasetId || dataset.unit !== contract.datasetUnit ||
      design.implementation?.primitive !== contract.primitive || design.geographyMode !== 'categorical' ||
      design.scale?.type !== (contract.type || 'categorical') || design.scale.unit !== contract.unit ||
      JSON.stringify(design.scale.domain) !== JSON.stringify(contract.domain) ||
      JSON.stringify(binding.includedRowIds) !== JSON.stringify(contract.ids)) fail('changed categorical primitive, scale or scope');
  const map = new Map();
  for (const row of dataset.rows) {
    if (!row.id || map.has(row.id)) fail('duplicate or missing categorical row ID');
    for (const field of binding.fields) if (!Object.hasOwn(row, field)) fail(`missing categorical field ${field}`);
    if (!sources.has(row.sourceId) || typeof row.sourceLocator !== 'string' || !row.sourceLocator) fail('unresolved categorical provenance');
    map.set(row.id, row);
  }
  const rows = contract.ids.map(id => map.get(id) || fail(`missing categorical row ${id}`));
  if (map.size !== rows.length) fail('unbound categorical rows');
  for (const [index, row] of rows.entries()) {
    if (row.lat !== null || row.lon !== null || row.geographicId !== (contract.geographicIds?.[index] ?? null) ||
        row.unit !== (contract.rowUnits?.[index] ?? contract.datasetUnit) ||
        row.period !== (contract.periods?.[index] ?? contract.period) ||
        row.status !== (contract.statuses?.[index] ?? 'categorical') ||
        row.qualifier !== (contract.qualifiers?.[index] ?? null)) fail('changed categorical unit, period, qualifier or geography');
    if (numericText ? typeof row.value !== 'number' || !Number.isFinite(row.value) || row.value < 0 : typeof row.value !== 'string' || !row.value) fail('invalid typed categorical or text-only value');
    const allowedValues = contract.values || (Array.isArray(contract.domain) && !contract.domainField ? contract.domain : null);
    if (allowedValues && !allowedValues.includes(row.value)) fail('unreviewed category value');
    if (contract.domainField && row[contract.domainField] !== contract.domain[index]) fail('changed workflow component');
    for (const [field, type] of Object.entries(contract.extras || {})) if (typeof row[field] !== type || (type === 'string' && !row[field])) fail(`invalid categorical metadata ${field}`);
    if (conceptId === '415' && (row.announcementDate !== row.period || row.country !== 'GBR')) fail('changed announcement chronology or jurisdiction');
    if (conceptId === '397' && row.finalDecision !== 'IRCC officer') fail('changed human decision responsibility');
    if (conceptId === '371' && row.amountQualifier !== row.qualifier) fail('changed case amount qualifier');
    if (conceptId === '382' && row.measurement !== ['announced land', 'announced floorspace'][index]) fail('changed land versus floor definition');
    if (conceptId === '356' && index < 2 && (!sources.has(row.laterStatusSourceId) || row.laterStatusSourceId !== 'uk-asylum-letter-aug')) fail('missing later oversight source');
    if (conceptId === '256' && row.value !== (index < 4 ? 'reported onboard at launch' : 'planned later upload')) fail('planned upload confused with reported onboard app');
    if (conceptId === '155-17' && (row.fromEntity !== ['Microsoft', 'Amazon', 'Google'][index] || row.toEntity !== ['OpenAI', 'Anthropic', 'Anthropic'][index])) fail('changed partnership endpoint');
    if (conceptId === '259' && (index === 0 ? row.feedsInto !== 'Global Dialogue on AI Governance' : row.receivesFrom !== 'Independent International Scientific Panel on AI')) fail('changed mandate handoff');
  }
  return rows;
}
