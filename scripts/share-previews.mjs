import {COMPARISON_CONCEPTS,comparisonInstrumentPlan} from '../src/research-comparisons.js';
import {ARCHITECTURE_CONCEPTS,architectureInstrumentPlan} from '../src/research-architecture.js';
import {PERCENTAGE_CONCEPTS,percentageInstrumentPlan} from '../src/research-percentages.js';
import {nativeValue} from '../src/research-ui.js';
import {COUNT_CONCEPTS,countInstrumentPlan} from '../src/research-counts.js';
import {RAIL_CONCEPTS,railInstrumentPlan} from '../src/research-rails.js';
import {intervalInstrumentPlan,intervalValueLabel} from '../src/research-intervals.js';
import {accessPaintPlan} from '../src/research-geography.js';
// Dependency-free PNG cards. Typography and neutral rings are editorial, not data marks.
import { deflateSync } from 'node:zlib';
const glyphs = {
 ',':['0','0','0','0','0','1','1'], '(':['001','010','100','100','100','010','001'],')':['100','010','001','001','001','010','100'],
 '<':['0001','0010','0100','1000','0100','0010','0001'],'>':['1000','0100','0010','0001','0010','0100','1000'],
 '~':['00000','00000','01001','10110','00000','00000','00000'],'+':['000','010','010','111','010','010','000'], '%':['11001','11010','00100','01000','10110','00110','00000'],'&':['01100','10010','10100','01000','10101','10010','01101'],
 A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['111','010','010','010','010','010','111'],J:['00111','00010','00010','00010','10010','10010','01100'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','10101','10011','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111'],
 '0':['01110','10001','10011','10101','11001','10001','01110'],'1':['010','110','010','010','010','010','111'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],
 '-':['000','000','000','111','000','000','000'],'.':['0','0','0','0','0','1','1'],"'":['1','1','0','0','0','0','0'],'?':['1110','0001','0001','0010','0100','0000','0100'],':':['0','1','1','0','1','1','0'],'/':['00001','00001','00010','00100','01000','10000','10000'],' ':['000','000','000','000','000','000','000']
};
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(bytes){let n=0xffffffff;for(const byte of bytes)n=crcTable[(n^byte)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),check=Buffer.alloc(4);length.writeUInt32BE(data.length);check.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([length,name,data,check]);}
export function previewPNG(entry, bundle) {
 const width=1200,height=630,pixels=Buffer.alloc(width*height*3);
 const put=(x,y,c)=>{if(x<0||y<0||x>=width||y>=height)return;const p=(Math.floor(y)*width+Math.floor(x))*3;for(let k=0;k<3;k++)pixels[p+k]=c[k];};
 const rect=(x,y,w,h,c)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,c);};
 rect(0,0,width,height,[8,13,16]);
 const accent=entry?.id==='408'?[98,196,189]:[197,244,134];
 for(let y=70;y<560;y++)for(let x=800;x<1200;x++){const dx=x-1030,dy=y-315,r=Math.hypot(dx,dy);if(Math.abs(r-176)<1.6 || Math.abs(Math.hypot(dx/0.4,dy)-176)<1.2 || Math.abs(Math.hypot(dx,dy/0.36)-176)<1.2)put(x,y,[40,61,57]);}
 const normalize=text=>text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[’‘]/g,"'").replace(/[—–]/g,'-').replace(/[·;]/g,'.').replace(/_/g,' ').replace(/±/g,'+/-').replace(/≈/g,'~').toUpperCase();
 const textWidth=(text,size)=>[...normalize(text)].reduce((n,c)=>n+((glyphs[c]||glyphs['?'])[0].length+1)*size,0);
 const text=(value,x,y,size,color)=>{for(const c of normalize(value)){const glyph=glyphs[c]||glyphs['?'];for(let yy=0;yy<7;yy++)for(let xx=0;xx<glyph[yy].length;xx++)if(glyph[yy][xx]==='1')rect(x+xx*size,y+yy*size,size,size,color);x+=(glyph[0].length+1)*size;}};
 text('AFTERWORLD',64,54,4,accent);rect(64,105,1072,1,[52,70,70]);
 text(entry?`SOURCE WORLD ${entry.id}`:'AN ATLAS OF THE MACHINE AGE',64,152,3,[142,165,168]);
 const title=entry?.newTitle||'A stranger world is already here.'; let size=7,lines=[];
 for(;size>=3;size--){lines=[''];for(const word of title.split(/\s+/)){const last=lines.length-1,trial=lines[last]?lines[last]+' '+word:word;if(textWidth(trial,size)>710&&lines[last])lines.push(word);else lines[last]=trial;}if(lines.length<=3)break;}
 lines.forEach((line,index)=>text(line,64,222+index*size*10,size,[237,244,250]));
 const status=entry?.research?'REVIEWED NATIVE-UNIT EVIDENCE':entry?.dataset?'SOURCED STORY':entry?'RESEARCH CONCEPT':'146 INDEPENDENTLY INDEXED WORLDS';
 const period=(entry?.research ? [entry.research.observationPeriod.observationStart,entry.research.observationPeriod.observationEnd].filter((v,i,a)=>v&&(i===0||v!==a[0])).join("-") : entry?.dataset?.dataYear);
 const observation=period ? `OBSERVATION: ${period}` : entry ? 'NO MEASURED DATA CLAIM' : 'SOURCE DATES ON EACH WORLD';
 const observationLines=[''];for(const word of observation.split(/\s+/)){const last=observationLines.length-1,trial=observationLines[last]?observationLines[last]+' '+word:word;if(textWidth(trial,2)>710&&observationLines[last])observationLines.push(word);else observationLines[last]=trial;}
 observationLines.forEach((line,index)=>text(line,64,438+index*21,2,[142,165,168]));
 text(status,64,507,3,accent);text('EXPLORE THE EVIDENCE. TURN IT OVER.',64,560,2,[142,165,168]);
 const hslToRGB=value=>{const l=(12+0.62*value)/100,s=.5,h=174/60,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2;return [m,c+m,x+m].map(n=>Math.round(n*255));};
 // Polygon scan conversion uses the same unwrapped audited geography as the native map.
 const paintPolygon=(polygon,color)=>{for(let y=0;y<190;y++){const lat=90-(y+.5)*180/190,intersections=[];for(const ring of polygon)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if((a[1]>lat)!==(b[1]>lat))intersections.push(a[0]+(lat-a[1])*(b[0]-a[0])/(b[1]-a[1]));}intersections.sort((a,b)=>a-b);for(let i=0;i+1<intersections.length;i+=2){const x0=Math.max(0,Math.ceil((intersections[i]+180)*380/360-.5)),x1=Math.min(380,Math.ceil((intersections[i+1]+180)*380/360-.5));for(let x=x0;x<x1;x++)put(790+x,250+y,color);}}};
 if(bundle?.conceptId==='408') {
  rect(780,220,400,246,[12,21,27]);const plan=accessPaintPlan(bundle);
  for(const country of plan.background)for(const polygon of country.polygons)for(const shift of [-360,0,360])paintPolygon(polygon.map(ring=>ring.map(([x,y])=>[x+shift,y])),[52,62,73]);
  for(const country of plan.countries)for(const polygon of country.polygons)for(const shift of [-360,0,360])paintPolygon(polygon.map(ring=>ring.map(([x,y])=>[x+shift,y])),country.row.value===null?[102,113,126]:hslToRGB(country.row.value));
  text('ACCESS 0-100%',800,229,2,accent);text(`${plan.coverage.mapped}/${plan.coverage.total} MAPPED`,800,448,2,[142,165,168]);
 } else if(bundle?.conceptId==='430') {
  rect(780,220,400,246,[12,21,27]);text('0-700 G CO2EQ/KWH',800,229,2,accent);
  const rows=[...bundle.dataset.rows].sort((a,b)=>a.id.localeCompare(b.id));for(const [index,row] of rows.entries())if(row.value!==null){const h=Math.round(row.value/700*175);rect(802+index*8,430-h,5,h,[242,186,104]);}text('44 ABSTRACT REGIONS',800,448,2,[142,165,168]);
 }
 const arc=(cx,cy,r,angle,color,open=false)=>{for(let y=-r-3;y<=r+3;y++)for(let x=-r-3;x<=r+3;x++){const radius=Math.hypot(x,y),theta=(Math.atan2(y,x)+Math.PI/2+2*Math.PI)%(2*Math.PI);if(radius>=r-4&&radius<=r&&theta<=angle&&(!open||Math.floor(theta*28)%2===0))put(cx+x,cy+y,color);}};
 const colors=[[87,213,196],[136,189,244]];
 if(['5-6','63'].includes(bundle?.conceptId)){
  rect(780,220,400,246,[12,21,27]);const rows=bundle.dataset.rows;
  rows.forEach((row,index)=>{const cx=875+index*195;arc(cx,330,48,Math.PI*2,[52,62,73]);arc(cx,330,48,Math.PI*2*row.value/100,colors[index]);text(`${row.value}%`,cx-36,397,2,colors[index]);text(bundle.conceptId==='5-6'?row.id.slice(-4):row.name.split(' ')[0],cx-40,245,2,[237,244,250]);});text('EQUAL 100% REFERENCE RINGS',800,448,2,[142,165,168]);
 }
 if(['388','330','406','193-5'].includes(bundle?.conceptId)){
  const plan=intervalInstrumentPlan(bundle);rect(780,210,400,256,[12,21,27]);
  if(plan.kind==='qualified-rings')plan.items.forEach((item,index)=>{const cx=872+(index%2)*196,cy=270+Math.floor(index/2)*115;arc(cx,cy,30,Math.PI*2,[52,62,73]);arc(cx,cy,30,item.angle,colors[index%2],item.qualifier==='<');text(item.row.name,cx-52,cy+42,2,[237,244,250]);text(intervalValueLabel(item.row,bundle.conceptId).replace('≈','~'),cx-40,cy-7,2,colors[index%2]);});
  else {
   const panel=plan.panels[0],map=value=>800+value/panel.domain[1]*340;
   text(bundle.conceptId==='330'?'0-0.4 SD. WHISKERS: 1 SE':bundle.conceptId==='388'?'PUBLISHED RANGES':'0-600 KWH/PERSON/YEAR',800,224,2,[142,165,168]);
   panel.items.forEach((item,index)=>{const y=285+index*72;if(bundle.conceptId==='330')text(index===0?'COMPOSITE OUTCOME':'ENGLISH OUTCOME',800,y-22,2,[142,165,168]);rect(800,y,340,1,[52,62,73]);if(item.kind==='range'||item.kind==='whisker'){rect(Math.round(map(item.lower)),y-3,Math.max(1,Math.round(map(item.upper)-map(item.lower))),7,colors[index%2]);if(item.point!==null)rect(Math.round(map(item.point))-2,y-8,4,16,[237,244,250]);}else if(item.row.qualifier==='<'){const bx=Math.round(map(item.boundary));for(let xx=800;xx<bx;xx+=4)rect(xx,y,Math.min(2,bx-xx),1,colors[index%2]);arc(bx,y,6,Math.PI*2,colors[index%2]);}else{rect(800,y-3,Math.max(1,Math.round(map(item.boundary??item.point)-800)),6,colors[index%2]);}text(intervalValueLabel(item.row,bundle.conceptId).replace('≈','~').replace('±','+/-'),800,y+15,2,colors[index%2]);});
   text(bundle.conceptId==='388'?'FRONT: TWO ACTIVITY CATEGORIES':bundle.conceptId==='330'?'ONE EDO STATE TRIAL. N 654.':'COUNTRY VS CONTINENT',800,448,2,[142,165,168]);
  }
 }
 if(RAIL_CONCEPTS.includes(bundle?.conceptId)){
  const plan=railInstrumentPlan(bundle);rect(780,210,400,256,[12,21,27]);
  const separate=['369','385'].includes(bundle.conceptId),available=separate?plan.panels[0].items:plan.items,items=available.slice(0,2);
  const heading={'385':'FOUR YEARS FROM JAN 2025','369':'CORPORATE REVENUE. USD','324':'CONTRACT CAPACITY. MW','409':'ARCHIVED CONSISTENCY SCORE','232':'PARTICIPANT ENTRY SHARES (%)','276':'PERCENT OF GNI PER CAPITA','372':'REPORTING CHANNELS. CLIPS'}[bundle.conceptId];
  text(heading,800,224,2,[142,165,168]);
  items.forEach((item,index)=>{const y=295+index*98,extent=Math.round(item.fraction*340);
    const label=item.row.name.length>30?item.row.name.slice(0,27)+'...':item.row.name;
    text(label,800,y-27,2,[237,244,250]);
    rect(800,y,340,1,[52,62,73]);
    if(item.kind==='marker')rect(800+extent-3,y-4,6,9,[136,189,244]);else if(item.kind==='outline'){rect(800,y-4,extent,1,[242,186,104]);rect(800,y+4,extent,1,[242,186,104]);rect(800,y-4,1,9,[242,186,104]);rect(800+extent,y-4,1,9,[242,186,104]);}else rect(800,y-3,extent,6,[98,196,189]);
    const value=item.row.value>=1000000000?`${item.row.value/1000000000} BILLION USD`:item.label.replace('≈','~');
    text(value,800,y+10,2,[237,244,250]);
    if(bundle.conceptId==='369')text(item.row.period,800,y+30,2,[142,165,168]);
    if(bundle.conceptId==='324')text(item.row.kind,800,y+30,2,[142,165,168]);
  });
  const scale=plan.domain[1]>=1e9?`${plan.domain[1]/1e9}B USD`:plan.domain[1];
  text(available.length>2?`2 OF ${available.length} ROWS. SCALE 0-${scale}`:`FIXED SCALE 0-${scale}`,800,448,2,[142,165,168]);
 }
 if(COUNT_CONCEPTS.includes(bundle?.conceptId)){
  const plan=countInstrumentPlan(bundle);rect(780,210,400,256,[12,21,27]);
  text(plan.kind==='counterweights'?'INCLUDING UNPAID TIME. USD/HOUR':plan.kind==='counters'?'HIGHER ACCURACY. 9 YEARS':bundle.conceptId==='333'?'ONE TILE PER RECORDED VOTE':'ONE TILE PER LANGUAGE VERSION',800,224,2,[142,165,168]);
  let y=264;const items=plan.kind==='counterweights'?plan.items.filter(item=>item.row.timeBasis==='paid and unpaid hours'):plan.items;
  for(const item of items){const label=plan.kind==='counterweights'?item.row.statistic:item.row.name;
   text((label.length>26?label.slice(0,23)+'...':label)+': '+item.row.value,800,y,2,[237,244,250]);y+=20;
   if(plan.kind==='counterweights'){rect(800,y,340,1,[52,62,73]);rect(Math.round(800+340*item.fraction)-3,y-5,6,11,item.row.statistic==='mean'?[242,186,104]:[98,196,189]);y+=58;}
   else{const count=plan.kind==='counters'?9:item.row.value;for(let i=0;i<count;i++){const xx=800+i%34*10,yy=y+Math.floor(i/34)*10;rect(xx,yy,7,7,i<item.row.value?[98,196,189]:[52,62,73]);}y+=Math.ceil(count/34)*10+18;}
  }
  if(plan.kind==='counters')text('3-MONTH LEAD. SEPTEMBER TARGET',800,448,2,[142,165,168]);
  if(plan.kind==='counterweights')text('FIXED SCALE 0-10 USD/HOUR',800,448,2,[142,165,168]);
 }
 if(COMPARISON_CONCEPTS.includes(bundle?.conceptId)){
  const plan=comparisonInstrumentPlan(bundle),items=plan.panels[0].items.slice(0,2);rect(780,210,400,256,[12,21,27]);
  text({'402':'MARIDA. SOURCE METRIC FRACTIONS','398':'WATER DEFICIT INDEX. SD NOT CI','392':'MODEL METRICS. SHARED TEST N12','323':'PHYSICAL ELECTRICITY SHARES (%)','218':'DEVELOPER BENCHMARK SCORES (%)','214':'ROBOTS/YEAR. SOURCE DEFINITIONS','115-2':'PRODUCER / USER ACCURACY (%)','211-4':'ATLANTA. CRASHED VEHICLES'}[bundle.conceptId],794,224,2,[142,165,168]);
  text(bundle.conceptId==='211-4'?'PER MILLION VEHICLE-MILES. 95% CI':plan.panels[0].key.slice(0,31),794,250,2,[237,244,250]);
  items.forEach((item,index)=>{const y=301+index*90,row=item.row,color=item.color.slice(1).match(/../g).map(n=>parseInt(n,16)),x=v=>Math.round(800+340*v/plan.domain[1]);
   const label=item.label.length>29?item.label.slice(0,26)+'...':item.label;text(label,800,y-21,2,[237,244,250]);rect(800,y,340,1,[52,62,73]);
   if(item.interval){rect(x(item.interval[0]),y-2,Math.max(1,x(item.interval[1])-x(item.interval[0])),4,color);rect(x(row.value)-2,y-5,5,11,color);}
   else if(['bar','stem','open-lower-bar'].includes(item.kind)){rect(x(item.stackStart||0),y-3,Math.round(340*item.fraction),6,color);if(item.kind==='open-lower-bar')arc(x(row.value),y,6,Math.PI*2,color);}
   else rect(x(row.value)-2,y-5,5,11,color);
   const value=nativeValue(row);text(value,800,y+12,2,[237,244,250]);
   if(item.supportingText)text(bundle.conceptId==='115-2'?`(${row.publishedParentheticalUncertainty}) PUBLISHED. TYPE UNKNOWN`:item.supportingText,800,y+32,2,[142,165,168]);
   if(bundle.conceptId==='211-4')text(row.cohort==='Waymo'?'WAYMO 2020-09/2026-06':'HUMAN 2022; WEIGHTED TO 2026-06',800,y+32,2,[142,165,168]);
  });
  if(bundle.conceptId==='392')text('2 OF 28. SCALE 0-1',800,428,2,[142,165,168]);
  text(bundle.conceptId==='392'?'OVERLAPPING YEARS. DATE CONFLICT':`${items.length} OF ${plan.items.length} ROWS. SCALE 0-${plan.domain[1]}`,794,448,2,[142,165,168]);
 }
 if(ARCHITECTURE_CONCEPTS.includes(bundle?.conceptId)){
  const plan=architectureInstrumentPlan(bundle),items=plan.items.slice(0,2),log=bundle.conceptId==='117';rect(780,210,400,256,[12,21,27]);
  text({'428':'THROUGHPUT. MILLION BARRELS/DAY','407':'AI MAKES ME NERVOUS. AGREE (%)','284':'SIMPLE PATENT FAMILIES','202':'MILLION RIDER-ONLY MILES','117':'ESTIMATED TRAINING FLOP. LOG10'}[bundle.conceptId],794,224,2,[142,165,168]);
  items.forEach((item,index)=>{const y=296+index*92,row=item.row;let name=row.name.length>29?row.name.slice(0,26)+'...':row.name;text(name,800,y-28,2,[237,244,250]);rect(800,y,340,1,[52,62,73]);
   const extent=Math.round(340*(log?(Math.log10(row.value)-25)/2:row.value/plan.domain[1]));
   if(log){arc(800+extent,y,6,Math.PI*2,[98,196,189],row.estimateConfidence==='Speculative');if(row.estimateConfidence==='Confident')rect(798+extent,y-2,5,5,[98,196,189]);}
   else if(bundle.conceptId==='407'){rect(800,y-4,extent,1,[242,186,104]);rect(800,y+4,extent,1,[242,186,104]);rect(800+extent,y-4,1,9,[242,186,104]);}
   else rect(800,y-3,extent,6,[98,196,189]);
   text(log?row.value.toExponential()+' FLOP':nativeValue(row),800,y+14,2,[237,244,250]);
   if(log)text(row.estimateConfidence+' ESTIMATE',800,y+34,2,[142,165,168]);else if(bundle.conceptId==='428')text(row.period,800,y+34,2,[142,165,168]);
  });
  if(log){text('1E25',800,254,2,[142,165,168]);text('1E26',954,254,2,[142,165,168]);text('1E27',1095,254,2,[142,165,168]);}
  text(log?'2 OF 20. LOG SCALE 1E25-1E27':`2 OF ${plan.items.length}. SCALE 0-${plan.domain[1]}`,800,448,2,[142,165,168]);
 }
 if(PERCENTAGE_CONCEPTS.includes(bundle?.conceptId)){
  const plan=percentageInstrumentPlan(bundle),items=plan.items.slice(0,2);rect(780,210,400,256,[12,21,27]);
  const heading={'255':'SELECTED ALTERNATIVE WATER (%)','233-2':'GRID CELLS WITH SKILL GAINS (%)','422-2':'ANY EXPOSURE. OCCUPATIONS (%)','138-8':'OVERLAPPING ACCOUNT SHARES (%)','8-6':'EXAM COMPLETION. 95% CI'}[bundle.conceptId];text(heading,794,224,2,[142,165,168]);
  items.forEach((item,index)=>{const cx=875+index*195,color=item.color.slice(1).match(/../g).map(hex=>parseInt(hex,16));let name=item.row.name;
   if(bundle.conceptId==='422-2')name=item.row.sex.toUpperCase()+' DOMINATED';
   else if(bundle.conceptId==='233-2')name=index?'QUINTILES':'EXTREMES';
   else if(bundle.conceptId==='138-8')name=index?'LATERAL MOVEMENT':'MALWARE';
   else if(bundle.conceptId==='8-6')name=index?'REFERRAL':'AI ON SITE';
   else name=name.split(',')[0];
   text(name.length>16?name.slice(0,13)+'...':name,cx-80,258,2,[237,244,250]);
   const reference=bundle.conceptId==='422-2'?Math.PI:2*Math.PI;arc(cx,320,36,reference,[52,62,73]);arc(cx,320,36,item.angle,color);text(item.label,cx-40,371,2,color);
   if(bundle.conceptId==='138-8')text(`${item.row.value}/832 ACCOUNTS`,cx-80,402,2,[237,244,250]);
   if(bundle.conceptId==='8-6'){
    text(`${item.row.numerator}/${item.row.analyzedN} ANALYZED`,cx-80,399,2,[237,244,250]);text(`${item.row.randomizedN} RANDOMIZED`,cx-80,420,2,[142,165,168]);
    const x0=cx-76;rect(x0,389,152,1,[52,62,73]);rect(Math.round(x0+1.52*item.ci95[0]),387,Math.max(1,Math.round(1.52*(item.ci95[1]-item.ci95[0]))),4,color);
   }
  });
  text(bundle.conceptId==='255'?'2 OF 3 SELECTED EXAMPLES':bundle.conceptId==='233-2'?'2016/2024 TESTS. NOT A FORECAST':bundle.conceptId==='422-2'?'HIGH EXPOSURE IS INCLUDED':bundle.conceptId==='138-8'?'832 SELECTED BANNED ACCOUNTS':'CI RULERS: 0-100%. NOT VISION GAINS',794,448,2,[142,165,168]);
 }
 if(['categorical','none'].includes(bundle?.design?.scale?.type)){
  rect(780,210,400,256,[12,21,27]);text('EQUAL SOURCE RECORDS',800,224,2,[142,165,168]);
  bundle.dataset.rows.slice(0,2).forEach((row,index)=>{const y=264+index*82,name=row.name.length>29?row.name.slice(0,26)+'...':row.name;const value=nativeValue(row);text(name,800,y,2,[237,244,250]);text(value.length>29?value.slice(0,26)+'...':value,800,y+23,2,[98,196,189]);const unit=row.unit.length>29?row.unit.slice(0,26)+'...':row.unit;text(unit,800,y+43,2,[142,165,168]);});
  text(`${Math.min(2,bundle.dataset.rows.length)} OF ${bundle.dataset.rows.length} RECORDS. NO SIZE SCALE`,800,448,2,[142,165,168]);
 }
 const scan=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)pixels.copy(scan,y*(width*3+1)+1,y*width*3,(y+1)*width*3);
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
}
export function canonicalOrigin(value) {
 const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('PUBLIC_ORIGIN must be an HTTPS origin with no path, credentials, query or hash');return url.origin;
}
