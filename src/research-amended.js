import { ROUNDED_53_GEOMETRY } from "./research-design-amendments.js";
export const AMENDED_CONCEPTS=Object.freeze(["74","156-8"]);
export function amendedInstrumentPlan(research){
 const id=String(research.design?.conceptId);
 if(!AMENDED_CONCEPTS.includes(id))throw Error("Unsupported corrected instrument.");
 const expected=id==="74"?["gemma-0-1","gemma-0-2","gemma-2-1","gemma-2-2"]:["lac-client-foreign","lac-client-outside-region"];
 const binding=research.design.datasetBindings?.[0];
 if(JSON.stringify(binding?.includedRowIds)!==JSON.stringify(expected))throw Error("Corrected scene requires exact reviewed row IDs.");
 if(id==="156-8"&&research.design.implementation.geometry!==ROUNDED_53_GEOMETRY)throw Error("Rounded53 correction must be applied before rendering.");
 const source=research.rows||research.dataset?.rows;
 if(!Array.isArray(source))throw Error("Source rows missing.");
 const rows=expected.map(rowId=>{const matches=source.filter(row=>row.id===rowId);if(matches.length!==1)throw Error("Corrected source ID must resolve exactly once.");return matches[0];});
 if(research.rows&&(source.length!==expected.length||source.some((row,index)=>row.id!==expected[index])))throw Error("Corrected bound row order differs.");
 const items=rows.map((row,index)=>{
  if(!Number.isFinite(row.value)||row.value<0||row.value>100)throw Error("Native percentage required.");
  if(id==="156-8"&&(index===0&&(row.value!==53||row.qualifier!=="rounded source percentage")||index===1&&(row.value!==90||row.unit!=="percent of respondents who know client location")))throw Error("Rounded value and conditional denominator must stay explicit.");
  if(id==="74"&&(row.benchmark!==(index<2?"MMLU Pro":"AIME 2026")||row.name!==(index%2?"Gemma3 27B IT":"Gemma4 E2B IT Thinking")||!row.configuration))throw Error("Two exact tasks and configurations required.");
  return {row,index,value:row.value,kind:id==="74"?"crossing-point":"bar",domain:[0,100],
   color:id==="74"?index%2?"#f2ba68":"#bca3ef":index?"#bca3ef":"#57d5c4",
   caption:id==="74"?`Developer-reported; ${row.configuration}; no overall ranking`:index?"Conditional denominator: respondents who know client location. Do not multiply by53%.":"Primary-report-rounded53%; not a strict lower bound. Surveyed workers."};
 });
 const panels=id==="156-8"?items.map((item,index)=>({title:item.row.name,face:index*Math.PI,domain:[0,100],unit:item.row.unit,items:[item]})):[];
 return{conceptId:id,rows,items,panels,period:research.design.animation.decorative.periodSeconds,recipe:research.design.animation.recipe};
}
