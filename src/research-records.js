// Source collections stay explicit; a compatibility first-dataset alias is not a union.
export function sourceDatasets(research) {
  return research.datasets || [{datasetId:research.dataset.datasetId,datasetSha256:research.datasetSha256,datasetCanonicalSha256:research.datasetCanonicalSha256,dataset:research.dataset}];
}
export function researchSourceList(research) {
  return [...new Map(sourceDatasets(research).flatMap(entry=>entry.dataset.sources).map(source=>[source.sourceId,source])).values()];
}
export function sourceRows(research,entry) {
  if(research.boundRowsByDataset?.[entry.datasetId])return research.boundRowsByDataset[entry.datasetId];
  if(research.rows)return research.rows.filter(row=>row.datasetId===entry.datasetId);
  const binding=research.design.datasetBindings.find(item=>item.datasetId===entry.datasetId);
  return binding.includedRowIds.map(id=>entry.dataset.rows.find(row=>row.id===id));
}
