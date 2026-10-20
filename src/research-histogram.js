export function histogramPlan(research,mode="count"){
 const rows=research.rows||research.dataset?.rows;
 if(String(research.design?.conceptId)!=="365"||research.design.implementation?.primitive!=="double-wine-histogram-corona"||rows?.length!==22||!["count","share"].includes(mode))throw Error("Unsupported wine histogram.");
 const keys=new Set();
 const items=rows.map((row,index)=>{
  const denominator=row.wineType==="red"?1599:row.wineType==="white"?4898:null,key=`${row.wineType}:${row.qualityScore}`;
  if(!denominator||row.sampleDenominator!==denominator||!Number.isInteger(row.qualityScore)||row.qualityScore<0||row.qualityScore>10||!Number.isInteger(row.value)||row.value<0||row.value>2500||keys.has(key))throw Error("Histogram requires exact source bins and denominators.");
  keys.add(key);return {row,index,angle:row.qualityScore*2*Math.PI/11,color:row.wineType==="red"?"#f2ba68":"#88bdf4",
   length:mode==="count"?row.value/2500:row.value/row.sampleDenominator,offset:row.wineType==="red"?-.018:.018};
 });
 for(const type of ["red","white"])if(items.filter(item=>item.row.wineType===type).reduce((sum,item)=>sum+item.row.value,0)!==(type==="red"?1599:4898))throw Error("Histogram frequencies do not equal source denominator.");
 return {conceptId:"365",items,mode,period:research.design.animation.decorative.periodSeconds};
}
