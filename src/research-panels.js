export const PANEL_CONCEPTS=Object.freeze(["325","111-3","266-2","390","30-8","8-17"]);
const PROFILES={"325":"pilot-uptake-feedback-facets","111-3":"water-ledger-and-dependency-facets","266-2":"manufacturing-milestone-and-revenue-ring","390":"waste-generation-collection-ledger","30-8":"footprint-boundary-four-panels","8-17":"mortality-arms-and-hazard-rail"};
export function panelInstrumentPlan(research){
 const id=String(research.design?.conceptId),rows=research.rows||research.dataset?.rows;
 if(!PANEL_CONCEPTS.includes(id)||research.design.implementation?.primitive!==PROFILES[id]||!Array.isArray(rows))throw Error("Unsupported typed evidence panels.");
 const items=rows.map((row,index)=>{
  let kind="qualitative",domain=null,color="#57d5c4",key=row.name,caption="",value=row.value,interval=null;
  if(id==="325"){
   if(row.id==="punggol-riders"){kind="native-text";color="#88bdf4";caption="Unique riders since launch; lower bound, not rides or new access";}
   if(row.id==="punggol-feedback"){kind="ring";domain=[0,100];caption=`Approx ${row.sampleSizeApprox} selected post-ride respondents; felt safe and would recommend`;}
   if(row.id==="punggol-routing"){color="#f2ba68";caption="Unresolved routing request; no numeric access-benefit score";}
  }
  if(id==="111-3"){
   if(row.id.startsWith("oregon")){kind="bar";domain=[0,300];color="#88bdf4";key="Oregon annual water ledger";caption="Company-reported total water used; no AI allocation";}
   else caption="Documented infrastructure dependency; not measured river flow";
  }
  if(id==="266-2"){
   if(row.id==="tsmc-advanced"){kind="ring";domain=[0,100];key="Global wafer revenue";caption="Global company wafer revenue; 7 nm and below. Not Taiwan output or capacity.";}
   else caption="Dated manufacturing milestone; not a capacity quantity";
  }
  if(id==="390"){
   if(row.metric){kind="bar";domain=[0,70];key=`World ${row.period}`;color=row.metric==="generated"?"#f2ba68":"#57d5c4";caption="Billion kg; generated vs formally collected/recycled";}
   else{kind="native-text";color="#b5c3d0";caption=row.notes;}
  }
  if(id==="30-8"){
   kind="native-text";key=row.id.startsWith("mistral")?`Lifecycle · ${row.unit}`:`400-token response · ${row.unit}`;
   color=row.id.includes("carbon")?"#f2ba68":"#88bdf4";
   caption=row.id.startsWith("mistral")?"Accumulated lifecycle boundary; training and 18 months of use":"Marginal 400-token response; excludes user terminals";
  }
  if(id==="8-17"){
   kind=row.id==="ecg-hr"?"hazard":"bar";domain=row.id==="ecg-hr"?[0,1.2]:[0,5];key=row.id==="ecg-hr"?"Hazard ratio · separate axis":"90-day all-cause mortality";
   color=row.id==="ecg-ai"?"#57d5c4":row.id==="ecg-control"?"#88bdf4":"#edf4fa";
   caption=row.id==="ecg-hr"?"95% CI; null = 1. Two Taiwan hospitals; not life expectancy":`Randomized N=${row.randomizedN}; rounded risk; no death counts inferred`;
   if(row.id==="ecg-hr")interval=[row.lower,row.upper];
   if(row.id==="ecg-hr"&&(!Number.isFinite(row.lower)||!Number.isFinite(row.upper)||row.lower>row.value||row.upper<row.value))throw Error("Hazard ratio requires reported source endpoints.");
  }
  if(domain&&(!Number.isFinite(value)||value<domain[0]||value>domain[1]))throw Error("Typed panel native value outside declared domain.");
  return {row,index,kind,domain,color,key,caption,value,interval};
 });
 const keys=[...new Set(items.map(item=>item.key))];
 const panels=keys.map((key,index)=>({title:key,face:index*2*Math.PI/keys.length,items:items.filter(item=>item.key===key),domain:items.find(item=>item.key===key).domain,
  unit:items.find(item=>item.key===key).row.unit}));
 if(id==="30-8")panels.forEach((panel,index)=>{panel.face=[-.55,.55,Math.PI-.55,Math.PI+.55][index];});
 if(id==="266-2")panels.forEach((panel,index)=>{panel.face=index<4?index*Math.PI/2:0;if(index===4)panel.detached=true;});
 return {conceptId:id,items,panels,period:research.design.animation.decorative.periodSeconds,recipe:research.design.animation.recipe};
}
