// Explicit adapters for accepted native rulers. Availability is controlled by
// ACTIVE_RESEARCH_CONCEPTS only after the corresponding scene is implemented.
export const LINEAR_BINDINGS = Object.freeze({
  '74': {
    datasetId: 'governance-gemma-task-comparison', primitive: 'two-task-crossing-order-ribbons',
    unit: 'developer-reported benchmark percent', datasetUnit: 'benchmark percent', rowUnit: 'benchmark percent', maximum: 100, geographyMode: 'categorical',
    rowIds: ['gemma-0-1', 'gemma-0-2', 'gemma-2-1', 'gemma-2-2'],
    period: '2026 release-table snapshot', status: 'observed', geographicIds: Array(4).fill(null),
    selection: { total: 18, filter: { all: [
      { field: 'name', op: 'in', values: ['Gemma4 E2B IT Thinking', 'Gemma3 27B IT'] },
      { field: 'benchmark', op: 'in', values: ['MMLU Pro', 'AIME 2026'] },
    ] } },
  },
  '211-4': {
    datasetId: 'physical-waymo-injury-rates', primitive: 'injury-rate-confidence-pairs',
    unit: 'crashed vehicles per million vehicle-miles', datasetUnit: 'crashed vehicles per million vehicle-miles', maximum: 7, geographyMode: 'categorical',
    rowIds: ['ATL', 'LA', 'PHX', 'SF', 'AUS'].flatMap(area => ['Waymo', 'human benchmark'].map(cohort => `injury-${area}-${cohort}`)),
    periods: Array.from({ length: 5 }, () => ['2020-09/2026-06', '2022 benchmark, spatially weighted to Waymo driving through 2026-06']).flat(),
    status: 'estimated', geographicIds: ['US-GA-AtlantaArea', 'US-CA-LosAngeles', 'US-AZ-Maricopa', 'US-CA-SFBay', 'US-TX-Travis'].flatMap(area => [area, area]),
  },
  '402': {
    datasetId: 'planet-marida-benchmark', primitive: 'segmentation-metric-prism',
    unit: 'source-reported metric fraction', datasetUnit: 'fraction', rowUnit: 'fraction', maximum: 1, geographyMode: 'categorical',
    rowIds: [0, 1, 2, 3].flatMap(index => ['IoU', 'pixel_accuracy', 'F1'].map(metric => `marida-${index}-${metric}`)),
    period: '2015–2021 imagery; published 2022', status: 'modelled', geographicIds: Array(12).fill(null),
  },
  '398': {
    datasetId: 'planet-irrigation-field-comparison', primitive: 'field-stage-water-deficit-pairs',
    unit: 'satellite-derived water deficit index', datasetUnit: 'water deficit index', rowUnit: 'water deficit index', maximum: 1, geographyMode: 'categorical',
    rowIds: ['2021', '2023'].flatMap(year => ['V8–V11', 'VT–R4'].flatMap(stage => ['A', 'B'].map(field => `irrigation-${year}-${stage}-${field}`))),
    periods: [...Array(4).fill('2021'), ...Array(4).fill('2023')], status: 'modelled', geographicIds: Array(8).fill('USA'),
  },
  '392': {
    datasetId: 'planet-hypoxia-observation-test', primitive: 'hypoxia-configuration-metric-facets',
    unit: 'source-reported evaluation fraction', datasetUnit: 'fraction', rowUnit: 'fraction', maximum: 1, geographyMode: 'categorical',
    rowIds: ['Hindcast', 'AI_H_H', 'AI_H_O', 'AI_O_H', 'AI_O_O', 'AI_HO_H', 'AI_HO_O'].flatMap(name => ['accuracy', 'F1', 'precision', 'recall'].map(metric => `hypoxia-${name}-${metric}`)),
    period: '12 unshuffled summer test samples, 2007–2019 excluding 2016; source caption discrepancy disclosed',
    status: 'modelled', geographicIds: Array(28).fill(null),
  },
  '323': {
    datasetId: 'physical-electricity-fuels', primitive: 'non-normalised-fuel-comparison',
    unit: 'percent of physical data-centre electricity', datasetUnit: '%', rowUnit: '% of physical DC electricity', maximum: 100, geographyMode: 'categorical',
    rowIds: ['usgas', 'usrenew', 'usnuclear', 'uscoal', 'cncoal', 'cnrenew', 'cnnuclear'], period: '2024', status: 'estimated',
    geographicIds: ['USA', 'USA', 'USA', 'USA', 'CHN', 'CHN', 'CHN'],
  },
  '218': {
    datasetId: 'governance-gemma-task-comparison', primitive: 'six-task-model-dumbbells',
    unit: 'developer-reported benchmark percent', datasetUnit: 'benchmark percent', rowUnit: 'benchmark percent', maximum: 100, geographyMode: 'categorical',
    rowIds: [0, 1, 2, 3, 4, 5].flatMap(task => [0, 2].map(model => `gemma-${task}-${model}`)),
    period: '2026 release-table snapshot', status: 'observed', geographicIds: Array(12).fill(null),
    selection: { total: 18, filter: { all: [{ field: 'name', op: 'in', values: ['Gemma4 E4B IT Thinking', 'Gemma3 27B IT'] }] } },
  },
  '214': {
    datasetId: 'physical-japan-robot-production', primitive: 'production-versus-shipments-hinge',
    unit: 'robots per year under source definitions', datasetUnit: 'units/year', rowUnit: 'units/year', maximum: 220000, geographyMode: 'categorical',
    rowIds: ['jara-prod24', 'jara-prod25', 'jara-dom25', 'jara-exp25', 'jara-total25'],
    periods: ['2024', '2025', '2025', '2025', '2025'], status: 'observed', geographicIds: Array(5).fill('JPN'),
  },
  '115-2': {
    datasetId: 'planet-wetland-class-accuracy', primitive: 'class-error-paired-reeds',
    unit: 'percent, source-defined producer/user accuracy', datasetUnit: 'percent', rowUnit: 'percent', maximum: 100, geographyMode: 'categorical',
    rowIds: ['non-wetland', 'permanent-water', 'swamp', 'marsh', 'flooded-flat', 'saline', 'mangrove', 'salt-marsh', 'tidal-flat'].flatMap(name => ['producer_accuracy', 'user_accuracy'].map(metric => `wetland-${name}-${metric}`)),
    period: '2020 validation', status: 'estimated', geographicIds: Array(18).fill(null),
  },
  '428': {
    datasetId: 'physical-energy-chokepoints', primitive: 'seven-throughput-gates',
    unit: 'million barrels per day', datasetUnit: 'million barrels/day', rowUnit: 'million barrels/day', maximum: 25, geographyMode: 'categorical',
    rowIds: ['malacca', 'hormuz', 'suez', 'bab', 'danish', 'turkish', 'panama'],
    periods: [...Array(6).fill('2025-H1'), 'FY2025:2024-10-01/2025-09-30'], status: 'estimated',
    geographicIds: ['waterway:Malacca', 'waterway:Hormuz', 'waterway:Suez-SUMED', 'waterway:Bab-el-Mandeb', 'waterway:Danish-Straits', 'waterway:Turkish-Straits', 'waterway:Panama'],
  },
  '407': {
    datasetId: 'governance-ipsos-nervousness', primitive: 'sample-market-meridian-bars',
    unit: 'percent of surveyed adults agreeing', datasetUnit: 'percent of surveyed adults agreeing', maximum: 100, geographyMode: 'categorical',
    rowIds: ['CAN', 'AUS', 'NZL', 'USA', 'IND', 'IRL', 'GBR-GBN', 'THA', 'SGP', 'SWE', 'MYS', 'ZAF', 'ESP', 'MEX', 'HUN', 'CHL', 'FRA', 'COL', 'TUR', 'PER', 'NLD', 'BEL', 'ITA', 'ARG', 'IDN', 'BRA', 'DEU', 'KOR', 'CHN-mainland', 'POL', 'JPN', 'ISR'].map(code => `nervous-${code}`),
    period: '2026-03-20/2026-04-03', status: 'estimated',
  },
  '284': {
    datasetId: 'society-patent-applicants', primitive: 'applicant-count-radial-books',
    unit: 'simple patent families', datasetUnit: 'simple patent families', maximum: 2500, geographyMode: 'categorical',
    rowIds: Array.from({ length: 10 }, (_, index) => `applicant-${index + 1}`), period: '2014–2023', status: 'observed',
    geographicIds: Array(10).fill(null),
  },
  '202': {
    datasetId: 'physical-waymo-exposure', primitive: 'operating-exposure-five-spools',
    unit: 'million rider-only miles', datasetUnit: 'million rider-only miles', maximum: 100, geographyMode: 'categorical',
    rowIds: ['waymo-LA', 'waymo-SF', 'waymo-PHX', 'waymo-AUS', 'waymo-ATL'], period: 'Through 2026-06', status: 'observed',
    geographicIds: ['US-CA-LosAngeles', 'US-CA-SFBay', 'US-AZ-Phoenix', 'US-TX-Austin', 'US-GA-Atlanta'],
  },
  '117': {
    datasetId: 'governance-large-training', primitive: 'log-compute-lantern',
    unit: 'estimated training FLOP', datasetUnit: 'FLOP', rowUnit: 'FLOP',
    scaleType: 'log10-position', minimum: 1e25, maximum: 1e27, geographyMode: 'categorical',
    rowIds: Array.from({ length: 20 }, (_, index) => `epoch-${index}`),
    periods: ['2026-09-03', '2026-07-16', '2026-07-15', '2026-06-29', '2026-05-18', '2026-03-19', '2025-09-05', '2025-08-07', '2025-07-09', '2025-04-10', '2025-04-05', '2025-02-27', '2025-02-24', '2025-02-17', '2024-10-28', '2024-08-13', '2024-07-23', '2024-06-20', '2024-06-14', '2024-03-04'],
    status: 'estimated', geographicIds: Array(20).fill(null),
  },
  '255': {
    datasetId: 'physical-water-source-substitution', primitive: 'alternative-water-three-rings',
    unit: 'percent of disclosed water supply', datasetUnit: '%', rowUnit: '% of water', maximum: 100, geographyMode: 'categorical',
    rowIds: ['quincy', 'singapore', 'sanantonio'], period: '2026-06', status: 'estimated',
    geographicIds: ['US-WA-Quincy', 'SGP', 'US-TX-SanAntonio'],
  },
  '233-2': {
    datasetId: 'physical-rainfall-benchmark', primitive: 'benchmark-coverage-double-discs',
    unit: 'percent of evaluated grid cells with skill gains', datasetUnit: '% of evaluated grid cells',
    rowUnit: '% of evaluated grid cells with skill gains', maximum: 100, geographyMode: 'global',
    rowIds: ['rain-extreme', 'rain-quintile'], period: '2016/2024 test years', status: 'estimated', geographicIds: [null, null],
  },
  '422-2': {
    datasetId: 'society-gender-exposure', primitive: 'paired-occupation-exposure-meridians',
    unit: 'percent of occupations', datasetUnit: 'percent of occupations', maximum: 100, geographyMode: 'categorical',
    rowIds: ['gender-female-any exposure', 'gender-male-any exposure', 'gender-female-highest exposure', 'gender-male-highest exposure'],
    period: '2026 analysis', status: 'modelled', geographicIds: [null, null, null, null],
  },
  '138-8': {
    datasetId: 'governance-cyber-observed-accounts', primitive: 'overlapping-activity-rings',
    unit: 'percent of832vendor-classified accounts', datasetUnit: 'accounts', rowUnit: 'accounts',
    valueField: 'publishedPercent', maximum: 100, geographyMode: 'categorical',
    rowIds: ['cyber-malware', 'cyber-lateral'], period: '2025-03/2026-03', status: 'observed', geographicIds: [null, null],
  },
  '8-6': {
    datasetId: 'planet-access-screening-trial', primitive: 'screening-completion-arms',
    unit: 'percent completing eye exam', datasetUnit: 'percent', maximum: 100, geographyMode: 'categorical',
    rowIds: ['access-81', 'access-83'], period: 'Enrollment 2021-11-24 to 2022-06-06; follow-up through 2022-12-06',
    status: 'observed', geographicIds: ['USA', 'USA'],
  },
  '156-8': {
    datasetId: 'society-platform-crossborder', primitive: 'conditional-denominator-facets',
    unit: 'source-specific respondent percent', datasetUnit: 'mixed; each row is explicitly labelled',
    rowUnits: ['percent of surveyed workers', 'percent of respondents who know client location'],
    maximum: 100, geographyMode: 'categorical', rowIds: ['lac-client-foreign', 'lac-client-outside-region'],
    period: '2023-12-15/2024-03-31', status: 'estimated',
  },
  '320': {
    datasetId: 'society-platform-pay', primitive: 'mean-median-counterweights',
    unit: 'USD per hour', datasetUnit: 'USD per hour', maximum: 10, geographyMode: 'categorical',
    rowIds: ['lac-pay-median', 'lac-pay-mean', 'lac-pay-paid-median', 'lac-pay-paid-mean'], period: '2023-12-15/2024-03-31', status: 'estimated',
  },
  '333': {
    datasetId: 'governance-un-panel-vote', primitive: 'recorded-vote-mosaic',
    unit: 'recorded votes', datasetUnit: 'recorded votes', scaleType: 'count', maximum: 121, geographyMode: 'categorical',
    rowIds: ['un-panel-for', 'un-panel-against', 'un-panel-abstain'], period: '2026-02-12', status: 'observed',
  },
  '63-8': {
    datasetId: 'governance-globalmmlu-translation', primitive: 'translation-preparation-count-mosaic',
    unit: 'language versions', datasetUnit: 'language versions', scaleType: 'count', maximum: 42, geographyMode: 'categorical',
    rowIds: ['globalmmlu-0', 'globalmmlu-1', 'globalmmlu-2', 'globalmmlu-3'], period: '2025 archival dataset description', status: 'observed',
  },
  '364': {
    datasetId: 'planet-icenet-comparison', primitive: 'nine-year-comparison-counters',
    unit: 'reported September comparison years with higher accuracy; six validation and three test years',
    datasetUnit: 'comparison years out of 9', rowUnit: 'comparison years out of 9', scaleType: 'integer-count', maximum: 9, geographyMode: 'global',
    rowIds: ['icenet-seas5', 'icenet-linear'], period: '2012–2020', status: 'modelled',
  },
  '372': {
    datasetId: 'governance-reporting-channels', primitive: 'report-channel-counter-rails',
    unit: 'video clips', datasetUnit: 'video clips', maximum: 20, geographyMode: 'categorical',
    rowIds: ['clips-proactive', 'clips-public'], period: '2023-11-01/2024-05-31', status: 'observed',
  },
  '276': {
    datasetId: 'society-broadband-affordability', primitive: 'connection-cost-calipers',
    unit: 'percent of GNI per capita', datasetUnit: 'percent of GNI per capita', maximum: 3, geographyMode: 'global',
    rowIds: ['cost-mobile', 'cost-fixed'], period: '2025', status: 'estimated',
  },
  '409': {
    datasetId: 'governance-borderlines-consistency', primitive: 'cross-language-consistency-sextant',
    unit: 'published consistency concurrence score', datasetUnit: 'Consistency concurrence score (0–100)',
    rowUnit: 'Consistency concurrence score (0–100)', scaleType: 'source-native-linear-score', maximum: 100, geographyMode: 'categorical',
    rowIds: ['borderlines-0', 'borderlines-1', 'borderlines-2', 'borderlines-3', 'borderlines-4', 'borderlines-5'], period: '2024 archival study', status: 'observed',
  },
  '369': {
    datasetId: 'society-company-gdp', primitive: 'unlike-accounts-scale-rails',
    unit: 'current USD; account type separately labelled', datasetUnit: 'current USD', rowUnit: 'current USD', maximum: 400000000000, geographyMode: 'categorical',
    rowIds: ['microsoft-fy2025', 'microsoft-fy2026', 'gdp-GRC', 'gdp-NZL', 'gdp-FIN', 'gdp-PRT'],
    periods: ['2024-07-01/2025-06-30', '2025-07-01/2026-06-30', ...Array(4).fill('2025-01-01/2025-12-31')],
    statuses: ['observed', 'observed', ...Array(4).fill('estimated')],
    measureTypes: ['corporate revenue', 'corporate revenue', ...Array(4).fill('national GDP')],
  },
  '324': {
    datasetId: 'physical-power-contracts', primitive: 'contract-capacity-faceted-ledger',
    unit: 'MW; capacity type and status separately labelled', datasetUnit: 'MW, type-specific', maximum: 3000, geographyMode: 'categorical',
    rowIds: ['crane-ppa', 'aws-talen', 'aws-calvert', 'google-uprate', 'google-existing'],
    rowUnits: ['MW announced restart capacity', 'MW full contract quantity', 'MW contracted power', 'MW contracted incremental capacity', 'MW contracted supply'],
    periods: ['2024-09-20', '2025-06-11', '2026-09-30', '2026-10-06', '2026-10-06'], status: 'observed',
    kinds: ['restart', 'existing supply', 'existing supply plus uprate', 'uprate', 'existing supply'],
  },
  '385': {
    datasetId: 'society-stargate-scale', primitive: 'commitment-versus-annual-flow-panels',
    unit: 'USD magnitude, with incompatible flow periods explicit', datasetUnit: 'mixed; each row is explicitly labelled', maximum: 500000000000, geographyMode: 'categorical',
    rowIds: ['stargate-intention', 'stargate-gdp-CZE', 'stargate-gdp-PRT', 'stargate-gdp-FIN'],
    rowUnits: ['USD announced intention', ...Array(3).fill('current USD annual GDP')],
    periods: ['2025-01-21 announcement; next four years', '2025', '2025', '2025'],
    statuses: ['categorical', 'estimated', 'estimated', 'estimated'],
    measureTypes: ['multi-year announced intention', ...Array(3).fill('annual national GDP')],
  },
  '232': {
    datasetId: 'planet-gwas-representation', primitive: 'ancestry-entry-share-meridians',
    unit: 'percent of recorded participant entries', datasetUnit: 'percent', maximum: 100, geographyMode: 'categorical',
    rowIds: ['gwas-0', 'gwas-1', 'gwas-2', 'gwas-3', 'gwas-4', 'gwas-5'],
    period: 'Cumulative dashboard snapshot checked 2026-10-06', status: 'estimated',
  },
});

export function validateLinearScope(conceptId, rows, fail) {
  const contract = LINEAR_BINDINGS[conceptId];
  if (['333', '63-8'].includes(conceptId) && rows.reduce((sum, row) => sum + row.value, 0) !== contract.maximum) fail('count partition does not preserve source total');
  for (const [index, row] of rows.entries()) {
    if (row.lat !== null || row.lon !== null || row.value === null || row.period !== (contract.periods?.[index] ?? contract.period) || row.status !== (contract.statuses?.[index] ?? contract.status)) fail('changed native ruler scope, period or status');
    if (contract.geographicIds && row.geographicId !== contract.geographicIds[index]) fail('changed source geography scope');
    if (contract.measureTypes && row.measureType !== contract.measureTypes[index]) fail('incompatible account type changed');
    if (contract.kinds && row.kind !== contract.kinds[index]) fail('capacity type changed');
    if (conceptId === '324' && (row.qualifier !== (index === 0 ? 'approximately' : null) || (index === 2 ? row.incrementalMW !== 190 : Object.hasOwn(row, 'incrementalMW')))) fail('changed nested capacity or qualifier');
    if (!['324', '156-8', '428', '323'].includes(conceptId) && row.qualifier !== null) fail('changed native ruler qualifier');
    if (conceptId === '409' && (row.territoryCount !== 251 || row.responseMethod !== 'rank classification' || row.metricDefinition !== 'Mean pairwise cross-language concurrence, source-defined CS scoring; higher means more consistent')) fail('changed source-native score definition');
    if (['409', '276', '232'].includes(conceptId) && row.geographicId !== null) fail('nongeographic category acquired geography');
    if (conceptId === '372' && (!Number.isInteger(row.value) || row.geographicId !== 'HKG')) fail('changed report count scope');
    if (['333', '63-8', '364'].includes(conceptId) && (!Number.isInteger(row.value) || row.geographicId !== null)) fail('anonymous counts acquired fractions or geography');
    if (conceptId === '364' && (row.denominator !== 9 || row.leadMonths !== 3 || row.targetMonth !== 'September' || row.comparison !== ['SEAS5', 'Linear trend'][index])) fail('changed comparison count denominator or evaluation scope');
    if (conceptId === '333' && JSON.stringify(row.namedCountries || []) !== JSON.stringify([[], ['Paraguay', 'United States'], ['Tunisia', 'Ukraine']][index])) fail('count tiles acquired unsupported country identities');
    if (conceptId === '320' && (row.geographicId !== null || row.statistic !== ['median', 'mean', 'median', 'mean'][index] || row.timeBasis !== (index < 2 ? 'paid and unpaid hours' : 'paid hours only'))) fail('changed pay statistic or time denominator');
    if (conceptId === '156-8' && (row.geographicId !== null || row.value !== [53, 90][index] || row.qualifier !== ['rounded source percentage', null][index])) fail('changed rounded source percentage or conditional denominator');
    if (conceptId === '233-2' && row.target !== ['extreme precipitation', 'precipitation quintiles'][index]) fail('changed precipitation target denominator');
    if (conceptId === '422-2' && (row.sex !== ['female', 'male', 'female', 'male'][index] || row.exposureCategory !== (index < 2 ? 'any exposure' : 'high exposure (gradients3–4)') || (index >= 2 && row.value > rows[index - 2].value))) fail('changed occupation exposure subset');
    if (conceptId === '138-8' && (row.denominatorAccounts !== 832 || row.value !== [560, 54][index] || row.publishedPercent !== [67.3, 6.5][index])) fail('published percentage and account count must remain distinct');
    if (conceptId === '8-6' && (row.followupMonths !== 6 || row.numerator !== [81, 18][index] || row.analyzedN !== [81, 82][index] || row.randomizedN !== [81, 83][index] || row.value !== [100, 22][index] || JSON.stringify(row.ci95) !== JSON.stringify([[96, 100], [14, 32]][index]))) fail('changed source-reported clinical CI, completion or sample denominator');
    if (conceptId === '428' && row.qualifier !== (index === 6 ? 'approximately' : null)) fail('changed fiscal-period throughput qualifier');
    if (conceptId === '284' && (!Number.isInteger(row.value) || row.rank !== index + 1)) fail('changed source patent-family rank or count');
    if (conceptId === '117' && (!['Confident', 'Likely', 'Speculative'].includes(row.estimateConfidence) ||
        ['organization', 'organizationCountries', 'estimateNotes'].some(field => typeof row[field] !== 'string' || !row[field]) ||
        typeof row.primaryReference !== 'string')) fail('missing training-estimate provenance or confidence category');
    if (conceptId === '407') {
      const connected = new Set(['IND', 'IRL', 'THA', 'SGP', 'MYS', 'ZAF', 'MEX', 'CHL', 'COL', 'TUR', 'PER', 'IDN', 'BRA', 'CHN-mainland', 'ISR']);
      const ages = { CAN: '18–74', USA: '18–74', IND: '18+', IRL: '18–74', THA: '20–74', SGP: '21–74', MYS: '18–74', ZAF: '18–74', TUR: '18–74', IDN: '21–74', ISR: '18–74' };
      if (row.id !== `nervous-${row.geographicId}` || row.ageRange !== (ages[row.geographicId] || '16–74') ||
          row.sampleScope !== (connected.has(row.geographicId) ? 'More connected/urban/educated/affluent segment' : 'Adult population within age range') ||
          (row.geographicId === 'GBR-GBN' && row.name !== 'Great Britain') ||
          (row.geographicId === 'CHN-mainland' && row.name !== 'China')) fail('changed surveyed market geography or sample scope');
    }
    if (conceptId === '402' && (row.metric !== ['IoU', 'pixel_accuracy', 'F1'][index % 3] || row.model !== ['RF spectral', 'RF spectral + indices', 'RF spectral + indices + texture', 'U-Net'][Math.floor(index / 3)] || row.name !== row.model)) fail('changed segmentation model or metric');
    if (conceptId === '398' && (row.field !== ['A', 'B'][index % 2] || row.growthStage !== ['V8–V11', 'VT–R4'][Math.floor(index / 2) % 2] ||
        !Number.isFinite(row.standardDeviation) || row.standardDeviation < 0 || row.standardDeviation > 1 || ['lower', 'upper', 'ci95'].some(field => Object.hasOwn(row, field)))) fail('changed field/stage or standard deviation converted to interval');
    if (conceptId === '392' && (row.testSampleN !== 12 || row.metric !== ['accuracy', 'F1', 'precision', 'recall'][index % 4] ||
        row.name !== ['Hindcast', 'AI_H_H', 'AI_H_O', 'AI_O_H', 'AI_O_O', 'AI_HO_H', 'AI_HO_O'][Math.floor(index / 4)])) fail('changed hypoxia configuration, metric or test sample');
    if (conceptId === '323' && row.qualifier !== ['>', null, 'approximately', 'approximately', 'approximately', 'approximately', 'approximately'][index]) fail('changed physical fuel qualifier');
    if (conceptId === '74' && (row.name !== ['Gemma4 E2B IT Thinking', 'Gemma3 27B IT'][index % 2] ||
        row.benchmark !== ['MMLU Pro', 'AIME 2026'][Math.floor(index / 2)] ||
        row.configuration !== (index < 2 ? 'model-card configuration' : 'no tools'))) fail('changed two-task benchmark configuration');
    if (conceptId === '211-4' && (row.cohort !== ['Waymo', 'human benchmark'][index % 2] || row.confidenceLevel !== 0.95 ||
        !Number.isFinite(row.ciLower) || !Number.isFinite(row.ciUpper) || row.ciLower < 0 || row.ciLower > row.value || row.ciUpper < row.value || row.ciUpper > 7 ||
        !Number.isInteger(row.waymoCrashCount) || row.waymoCrashCount < 0 || row.waymoCrashCount !== rows[index - index % 2].waymoCrashCount || row.qualifier !== null)) fail('changed source rate confidence interval, cohort or paired count');
    if (conceptId === '218') {
      const benchmark = ['MMLU Pro', 'MMMU Pro', 'AIME 2026', 'LiveCodeBench v6', 'GPQA Diamond', 'Tau2 (average over 3)'][Math.floor(index / 2)];
      if (row.name !== ['Gemma4 E4B IT Thinking', 'Gemma3 27B IT'][index % 2] || row.benchmark !== benchmark ||
          row.configuration !== (benchmark === 'AIME 2026' ? 'no tools' : benchmark.startsWith('Tau2') ? 'source average over three domains' : 'model-card configuration')) fail('changed task/model benchmark configuration');
    }
    if (conceptId === '214' && (!Number.isInteger(row.value) || row.name !== ['Japan robot production', 'Japan robot production', 'Domestic shipments', 'Exports', 'Total shipments'][index])) fail('changed production versus shipment measure');
    if (conceptId === '115-2' && (row.metric !== ['producer_accuracy', 'user_accuracy'][index % 2] ||
        !Number.isFinite(row.publishedParentheticalUncertainty) || row.publishedParentheticalUncertainty < 0 ||
        ['lower', 'upper', 'ci95'].some(field => Object.hasOwn(row, field)))) fail('changed class accuracy or source parenthetical uncertainty');
  }
}
