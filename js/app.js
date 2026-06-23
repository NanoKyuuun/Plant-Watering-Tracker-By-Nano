const SK='pwt-v1',UK='pwt-u1';
const EMOJIS=['🌱','🌿','🪴','🌺','🌸','🌻','🌼','🌹','🌷','🌵','🎋','🎍','🍀','🍃','🌾','🌴','🌲','🌳','🪷','🪻','🎑','🌙'];
const ICONS=['potted_plant','local_florist','yard','spa','park','grass','nature','eco'];

const load=()=>{try{return JSON.parse(localStorage.getItem(SK))||[];}catch{return[];}};
const save=p=>localStorage.setItem(SK,JSON.stringify(p));
const loadU=()=>{try{return JSON.parse(localStorage.getItem(UK))||{};}catch{return{};}};
const saveU=u=>localStorage.setItem(UK,JSON.stringify(u));
const genId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>{const d=document.createElement('div');d.textContent=s;return d.innerHTML;};
const todayIso=()=>new Date().toISOString().slice(0,10);

function daysUntil(lw,iv){
  const a=new Date(lw);a.setHours(0,0,0,0);
  const b=new Date();b.setHours(0,0,0,0);
  const n=new Date(a);n.setDate(n.getDate()+iv);
  return Math.ceil((n-b)/86400000);
}
const status=d=>d<0?'ov':d===0?'due':'ok';
const label=s=>({ov:'Overdue',due:'Due Today',ok:'OK'})[s];
const aria=s=>({ov:'overdue',due:'due-today',ok:'ok'})[s];
const cdText=(d,s)=>s==='ov'?`${Math.abs(d)} day${Math.abs(d)!==1?'s':''} overdue`:s==='due'?'Due today!':`Water in ${d} day${d!==1?'s':''}`;

const sortPlants=p=>[...p].sort((a,b)=>daysUntil(a.lastWatered,a.interval)-daysUntil(b.lastWatered,b.interval));

function parseDate(s){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);}
const fmtDate=s=>s?parseDate(s).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}):'—';
function nextDate(lw,iv){const d=parseDate(lw);d.setDate(d.getDate()+iv);return d.toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'});}

function defIcon(id){let h=0;for(let i=0;i<id.length;i++){h=((h<<5)-h)+id.charCodeAt(i);h|=0;}return ICONS[Math.abs(h)%ICONS.length];}
function avInner(av,id){
  if(!av||av.t==='icon')return`<span class="ms">${av?av.v:defIcon(id)}</span>`;
  if(av.t==='emoji')return`<span class="ae">${av.v}</span>`;
  return`<span class="ms">${defIcon(id)}</span>`;
}

function toast(msg,t='s'){
  const ico={s:'check_circle',e:'delete_forever',i:'info'}[t]||'info';
  const el=document.createElement('div');
  el.className=`toast t${t}`;
  el.innerHTML=`<span class="ms">${ico}</span>${msg}`;
  document.getElementById('tc').appendChild(el);
  setTimeout(()=>el.remove(),2600);
}

function render(){
  const plants=load(),sorted=sortPlants(plants);
  const grid=document.getElementById('pg');
  const badge=document.getElementById('badge');
  badge.textContent=`${plants.length} plant${plants.length!==1?'s':''}`;
  if(!plants.length){grid.innerHTML='';document.getElementById('es').classList.add('vis');return;}
  document.getElementById('es').classList.remove('vis');
  grid.innerHTML=sorted.map((p,i)=>{
    const d=daysUntil(p.lastWatered,p.interval),s=status(d),lb=label(s),ar=aria(s);
    const cdIcon=s==='ov'?'warning_amber':s==='due'?'water_drop':'schedule';
    const wIcon=s==='ov'?'water_drop':'done',wTxt=(s==='ov'||s==='due')?'Water Now':'Mark Watered';
    const wCls=s==='ov'?'bwov':s==='due'?'bwd':'bwok';
    const nick=p.nickname?`<p class="tbmd cnk">"${esc(p.nickname)}"</p>`:'';
    return`<article class="pc pc--${s}" role="listitem" aria-label="${esc(p.name)} — ${lb}" style="animation-delay:${i*.05}s">
<div class="ca"></div>
<div class="ch">
  <div class="pav pav--${s}" onclick="openAvPlant('${p.id}')" title="Change avatar" role="button" tabindex="0">${avInner(p.avatar,p.id)}</div>
  <div class="sb tlsm sb--${s}"><span class="sd"></span>${lb}</div>
</div>
<div style="display:flex;flex-direction:column;flex:1">
  <div style="flex:1">
    <h3 class="thmd cpn">${esc(p.name)}</h3>${nick}
  </div>
  <div class="cm">
    <div class="cmr"><span class="ms">water_drop</span><span class="mt">Last watered&nbsp;</span><span class="mv">${fmtDate(p.lastWatered)}</span></div>
    <div class="cmr"><span class="ms">event_repeat</span><span class="mt">Every&nbsp;</span><span class="mv">${p.interval} day${p.interval!==1?'s':''}</span><span class="mt" style="margin-left:2px">· Next&nbsp;</span><span class="mv">${nextDate(p.lastWatered,p.interval)}</span></div>
  </div>
</div>
<div class="cdiv"></div>
<div class="cdr cd--${s}"><span class="ms">${cdIcon}</span><span class="tbmd">${cdText(d,s)}</span></div>
<div class="ca2">
  <button class="btn ${wCls}" onclick="doWater('${p.id}')" aria-label="Water ${esc(p.name)}"><span class="ms">${wIcon}</span>${wTxt}</button>
  <button class="bdel" onclick="doDelete('${p.id}')" aria-label="Remove ${esc(p.name)}"><span class="ms">delete</span></button>
</div>
</article>`;
  }).join('');
}

function doWater(id){
  const p=load(),pl=p.find(x=>x.id===id);
  if(!pl)return;
  pl.lastWatered=todayIso();save(p);render();
  toast(`💧 ${pl.name} watered!`);
}
function doDelete(id){
  const p=load(),pl=p.find(x=>x.id===id);
  if(!pl)return;
  openDelModal(id,pl.name);
}

const delM=document.getElementById('dm'),delSub=document.getElementById('dsub'),delCan=document.getElementById('dcan'),delCon=document.getElementById('dcon');
let _did=null;
function openDelModal(id,name){_did=id;delSub.textContent=`"${name}" will be removed. This cannot be undone.`;delM.classList.add('open');delCon.focus();}
function closeDelModal(){delM.classList.remove('open');_did=null;}
delCan.addEventListener('click',closeDelModal);
delM.addEventListener('click',e=>{if(e.target===delM)closeDelModal();});
delCon.addEventListener('click',()=>{
  if(!_did)return;
  const iid=_did,plants=load(),pl=plants.find(x=>x.id===iid);
  closeDelModal();if(!pl)return;
  save(plants.filter(x=>x.id!==iid));render();
  toast(`${pl.name} removed`,'e');
});

const avM=document.getElementById('am'),avG=document.getElementById('ag'),avCls=document.getElementById('ac');
let _avcb=null;
function buildGrid(cur){
  avG.innerHTML=EMOJIS.map(em=>{
    const sel=cur&&cur.t==='emoji'&&cur.v===em;
    return`<button type="button" class="eo${sel?' sel':''}" data-e="${em}" aria-label="${em}">${em}</button>`;
  }).join('');
  avG.querySelectorAll('.eo').forEach(b=>b.addEventListener('click',()=>{
    avG.querySelectorAll('.eo').forEach(x=>x.classList.remove('sel'));
    b.classList.add('sel');
    applyAv({t:'emoji',v:b.dataset.e});
  }));
}
function applyAv(av){if(_avcb)_avcb(av);closeAv();}
function openAv(cur,cb){_avcb=cb;buildGrid(cur);avM.classList.add('open');}
function closeAv(){avM.classList.remove('open');_avcb=null;}
avCls.addEventListener('click',closeAv);
avM.addEventListener('click',e=>{if(e.target===avM)closeAv();});

function openAvPlant(id){
  const p=load(),pl=p.find(x=>x.id===id);if(!pl)return;
  openAv(pl.avatar,(av)=>{pl.avatar=av;save(p);render();toast('Avatar updated 🎨','i');});
}
function openAvUser(){
  const u=loadU();
  openAv(u.avatar,(av)=>{u.avatar=av;saveU(u);renderUserAv();toast('Profile updated ✨','i');});
}
function renderUserAv(){
  const u=loadU(),d=document.getElementById('uad');
  const av=u.avatar;
  d.innerHTML=av&&av.t==='emoji'?av.v:'🌿';
}
document.getElementById('uab').addEventListener('click',openAvUser);

document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  if(delM.classList.contains('open'))closeDelModal();
  if(avM.classList.contains('open'))closeAv();
});

const form=document.getElementById('form'),iName=document.getElementById('pn'),iNick=document.getElementById('pnk'),iInt=document.getElementById('pi'),iLw=document.getElementById('plw');
const fAvPre=document.getElementById('fab'); // visible preview circle button
const fAvBtn2=document.getElementById('fab2');
let _fav=null;
iLw.value=todayIso();
function updateFavPre(){
  fAvPre.innerHTML=(_fav&&_fav.t==='emoji')?`<span class="ae">${_fav.v}</span>`:'<span class="ms">potted_plant</span>';
}
function openFav(){openAv(_fav,av=>{_fav=av;updateFavPre();});}
fAvPre.addEventListener('click',openFav);
fAvBtn2.addEventListener('click',openFav);
form.addEventListener('submit',e=>{
  e.preventDefault();
  const name=iName.value.trim(),nick=iNick.value.trim(),iv=parseInt(iInt.value,10),lw=iLw.value||todayIso();
  if(!name){toast('Enter a plant name.','i');return iName.focus();}
  if(!iv||iv<1){toast('Enter a valid interval (≥1).','i');return iInt.focus();}
  const p=load();p.push({id:genId(),name,nickname:nick,interval:iv,lastWatered:lw,avatar:_fav});
  save(p);render();toast(`🌿 ${name} added!`);
  iName.value=iNick.value=iInt.value='';iLw.value=todayIso();_fav=null;updateFavPre();iName.focus();
});

renderUserAv();render();
