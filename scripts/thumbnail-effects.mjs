// Static index previews echo each live effect without opening a WebGL context.
export function motif(kind,q,color,seed=0){
 const n=Math.max(2,Math.round(q*16)),r=8+q*15,h=7+q*27;
 const dots=(fn)=>Array.from({length:n},(_,i)=>fn(i,i/n*Math.PI*2)).join('');
 let s='';
 if(kind==='flood'){
  s=Array.from({length:9},(_,i)=>`<rect x="${(i%3-1)*9-3}" y="${-10-Math.floor(i/3)*4}" width="5" height="${15+Math.floor(i/3)*4}" fill="#456574"/>`).join('');
  s+=`<ellipse cy="6" rx="${r+9}" ry="${4+q*8}" fill="#146189" fill-opacity=".8"/>`;
  for(let j=0;j<3;j++)s+=`<path d="M${-r-8},${4+j*4}q${r/2},-4 ${r},0t${r},0" stroke="#83dced" opacity=".8"/>`;
 }else if(kind==='binary'||kind==='letters'){
  s=dots((i,a)=>`<text x="${Math.cos(a)*(6+(i%4)*4)}" y="${Math.sin(a)*r}" font-family="monospace" font-size="8" fill="${color}" stroke="none">${kind==='letters'?'A':i%2}</text>`);
 }else if(kind==='arcs')s=dots((i,a)=>`<path d="M0,4l${Math.cos(a)*8},-${h*.4}l${Math.sin(a)*6},3l${Math.cos(a)*8},-${h*.6}" opacity=".75"/>`);
 else if(kind==='coins')s=dots((i)=>`<ellipse cy="${-i*1.7}" rx="7" ry="3" fill="#1b2523"/>`)+`<ellipse cy="-${n}" rx="${r+3}" ry="7" transform="rotate(-25)" opacity=".5"/>`;
 else if(kind==='gears')s=dots((i,a)=>`<path d="M${Math.cos(a)*r*.7},${Math.sin(a)*r*.7}L${Math.cos(a)*r},${Math.sin(a)*r}" stroke-width="3"/>`)+`<circle r="${r*.65}"/><circle r="4"/>`;
 else if(kind==='gates'||kind==='tiles')s=Array.from({length:25},(_,i)=>`<rect x="${i%5*6-15}" y="${Math.floor(i/5)*6-15}" width="4" height="4" fill="${color}" opacity="${i/25<q?'.9':'.12'}" transform="rotate(${kind==='tiles'?20:0})"/>`).join('');
 else if(kind==='signals')s=`<path d="M0,5V-${h}"/>`+[.4,.7,1].map(f=>`<ellipse cy="-${h*.6}" rx="${r*f}" ry="${r*f*.45}" opacity="${1.2-f}"/>`).join('');
 else if(kind==='neurons')s=dots((i,a)=>`<path d="M0,0L${Math.cos(a)*r},${Math.sin(a)*r}"/><circle cx="${Math.cos(a)*r}" cy="${Math.sin(a)*r}" r="2" fill="${color}"/>`);
 else if(kind==='citadels')s=Array.from({length:Math.max(1,Math.round(q*8))},(_,i)=>`<rect x="-9" y="${-i*4}" width="18" height="2" fill="${color}"/>`).join('');
 else if(kind==='fences')s=dots((i,a)=>`<path d="M${Math.cos(a)*r},${Math.sin(a)*r*.4}v-${h}"/>`)+`<ellipse cy="-${h}" rx="${r}" ry="${r*.4}"/>`;
 else if(kind==='throat')s=Array.from({length:7},(_,i)=>`<ellipse cy="${(i-3)*5}" rx="${2+(1-q)*7+Math.abs(i-3)*5}" ry="3"/>`).join('');
 else if(kind==='folds')s=dots((i)=>`<path d="M-18,${i-7}C-${r},-${h} ${r},${h} 18,${7-i}S-8,-14 -18,${i-7}" opacity=".5"/>`);
 return s;
}
