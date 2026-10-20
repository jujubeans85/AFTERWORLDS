export const MULTI_CONCEPTS=Object.freeze(["217","394","56-5"]);
const PRIMITIVES={"217":"incompatible-scale-reading-panels","394":"metered-history-and-policy-hinge","56-5":"national-share-history-with-global-context"};
export function multiSourceRows(research){
 if(!Array.isArray(research.datasets)||research.datasets.length!==2)throw Error("Two explicit complete source datasets required.");
 const rows=[];
 for(const binding of research.design.datasetBindings){
  const entry=research.datasets.find(entry=>entry.datasetId===binding.datasetId);
  if(!entry||!Array.isArray(binding.includedRowIds)||new Set(binding.includedRowIds).size!==binding.includedRowIds.length)throw Error("Invalid multi-source selection.");
  for(const id of binding.includedRowIds){const matches=entry.dataset.rows.filter(row=>row.id===id);if(matches.length!==1)throw Error("Multi-source IDs must resolve exactly once.");rows.push({...matches[0],datasetId:entry.datasetId});}
 }
 if(research.rows&&(research.rows.length!==rows.length||research.rows.some((row,index)=>row.id!==rows[index].id||row.datasetId!==rows[index].datasetId)))throw Error("Bound multi-source row order differs from source selection.");
 return rows;
}
export function multiInstrumentPlan(research){
 const id=String(research.design?.conceptId);if(!MULTI_CONCEPTS.includes(id)||research.design.implementation?.primitive!==PRIMITIVES[id])throw Error("Unsupported multi-source instrument.");
 const rows=multiSourceRows(research);
 const items=rows.map((row,index)=>{
  const history=row.datasetId==="physical-irish-electricity-series";
  const kind=history?(id==="394"?"chronological-rib":"dated-share-ring"):typeof row.value==="number"?"native-text":"qualitative";
  const value=kind==="dated-share-ring"?row.nationalMeteredSharePercent:row.value;
  const domain=history?[0,id==="394"?8000:100]:null;
  if(history&&(!Number.isFinite(value)||value<0||value>domain[1]))throw Error("Native Irish history outside declared domain.");
  return{row,index,history,kind,value,domain,key:history?row.period:row.name,
   color:history?"#57d5c4":id==="394"?"#f2ba68":row.id==="energychange"?"#88bdf4":id==="217"?"#f2ba68":"#edf4fa",
   caption:history?(id==="394"?"Irish metered data-centre electricity; GWh/year":"Share of national metered electricity; Ireland, not global or AI share"):
    id==="394"?`Date of rule: ${row.period}. ${row.notes}`:id==="217"?row.id==="energychange"?"Median-prompt efficiency; different population from aggregate demand":`Global context; ${row.notes}`:`Scope: global. ${row.notes}`};
 });
 const context=items.filter(item=>!item.history);
 const panels=context.map((item,i)=>({title:id==="394"?`Connection condition ${i+1}`:item.row.name,
  face:id==="217"?i*2*Math.PI/context.length:Math.PI+(i-(context.length-1)/2)*1.1,
  items:[item],domain:null,unit:item.row.unit}));
 return{conceptId:id,panelRadius:id==="217"?1.7:1.7,panelWidth:id==="217"?1.8:1.4,rows,items,history:items.filter(item=>item.history),context,panels,
  period:research.design.animation.decorative.periodSeconds,recipe:research.design.animation.recipe};
}
