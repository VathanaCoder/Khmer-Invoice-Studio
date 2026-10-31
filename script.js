const $=(s,r=document)=>r.querySelector(s);
const root=document.documentElement;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const kh=s=>String(s).replace(/\d/g,d=>'០១២៣៤៥៦៧៨៩'[d]);

const T={
 km:{title:'វិក័យប័ត្រ',no:'លរ',goods:'ឈ្មោះទំនិញ',qty:'ចំនួន',price:'តម្លៃ',amount:'តម្លៃសរុប',total:'សរុប',buyer:'អ្នកទិញ',seller:'អ្នកលក់',date:'ថ្ងៃទី',num:'លេខ',co:'ឈ្មោះក្រុមហ៊ុន',
   months:['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ']},
 en:{title:'INVOICE',no:'No.',goods:'Name of goods',qty:'Qty',price:'Price',amount:'Amount',total:'Total',buyer:'Buyer',seller:'Seller',date:'Date',num:'No.',co:'Company name',
   months:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']}
};
const store={
 get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},
 set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}}
};
const css=n=>getComputedStyle(root).getPropertyValue(n).trim();
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),1800)}

let inv=null,dirty=false;
const blankRow=()=>({name:'',qty:'1',touched:false,price:''});
function today(){const d=new Date();return{d:d.getDate(),m:d.getMonth()+1,y:d.getFullYear()}}
function newInv(){
  const c=store.get('vk-count',0)+1; store.set('vk-count',c);
  return{id:'i'+Date.now(),type:'custom',date:today(),color:css('--sw-1'),lang:'km',wmOn:false,wm:'',
    company:'',contact:'',buyer:'',seller:'',no:String(c).padStart(6,'0'),cur:'៛',rows:Array.from({length:8},blankRow)};
}
const fmt=(n,c)=>c==='$'?'$'+n.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}):'៛'+Math.round(n).toLocaleString('en');
const rowAmt=r=>r.price===''||r.price==='.'?null:(parseFloat(r.qty)||0)*(parseFloat(r.price)||0);
const totalOf=i=>i.rows.reduce((s,r)=>s+(rowAmt(r)||0),0);
const dateStr=d=>`${d.d}/${d.m}/${d.y}`;

/* ---------- home ---------- */
function renderHome(){
  const all=store.get('vk-inv',[]),l=$('#list');
  if(!all.length){l.innerHTML='<div class="empty">No invoices yet. Tap Create to start one.</div>';return}
  l.innerHTML=all.map(i=>`<div class="item" style="--bar:${esc(i.color)}"><i></i>
    <button class="open" data-id="${i.id}"><b>${esc(i.company||('No. '+i.no))}</b><small>${esc(i.no)} · ${dateStr(i.date)}</small></button>
    <span class="amt">${fmt(totalOf(i),i.cur)}</span><button class="del" data-del="${i.id}" aria-label="Delete">×</button></div>`).join('');
}
$('#list').addEventListener('click',e=>{
  const o=e.target.closest('[data-id]'),d=e.target.closest('[data-del]');
  if(o){inv=structuredClone(store.get('vk-inv',[]).find(x=>x.id===o.dataset.id));dirty=false;openEditor()}
  if(d){confirmBox('Delete this invoice?',[['Delete',()=>{store.set('vk-inv',store.get('vk-inv',[]).filter(x=>x.id!==d.dataset.del));renderHome()},'danger'],['Cancel']])}
});
$('#create').onclick=()=>openSetup('create',newInv());

/* ---------- sheets ---------- */
const layer=$('#layer');
function closeLayer(){layer.innerHTML=''}
function confirmBox(msg,btns){
  layer.innerHTML=`<div class="scrim"><div class="sheet c"><h3>${esc(msg)}</h3><div class="acts"></div></div></div>`;
  const a=$('.acts',layer);
  btns.forEach(([label,fn,cls])=>{const b=document.createElement('button');b.className='btn '+(cls||'ghost');b.textContent=label;b.onclick=()=>{closeLayer();fn&&fn()};a.append(b)});
}
function openSetup(mode,d){
  const draft=structuredClone(d);
  const sheet=()=>{
    const sw=[1,2,3,4,5,6].map(n=>css('--sw-'+n));
    layer.innerHTML=`<div class="scrim" id="sc"><div class="sheet" role="dialog">
      <h3>${mode==='create'?'Create':'Edit'}</h3>
      <div class="f"><span class="l">Type</span><span class="chip">Custom</span></div>
      <div class="f"><span class="l">Date</span><button class="fld" id="fd"><span>${dateStr(draft.date)}</span><span>▾</span></button></div>
      <div class="f"><span class="l">Color</span><div class="sws">
        ${sw.map(c=>`<button class="sw ${c.toLowerCase()===draft.color.toLowerCase()?'on':''}" style="--c:${c}" data-c="${c}" aria-label="${c}"></button>`).join('')}
        <label class="sw cu" aria-label="Custom color"><input type="color" id="cc" value="${draft.color}"></label></div></div>
      <div class="f"><span class="l">Language</span><div class="seg"><button data-l="km" class="${draft.lang==='km'?'on':''}">ខ្មែរ</button><button data-l="en" class="${draft.lang==='en'?'on':''}">English</button></div></div>
      <div class="f"><div class="row2"><span class="l" style="margin:0">Watermark</span><button class="sw-t ${draft.wmOn?'on':''}" id="wt" role="switch" aria-checked="${draft.wmOn}" aria-label="Watermark"></button></div>
        ${draft.wmOn?`<input class="fld" id="wm" style="margin-top:10px" placeholder="Watermark word" value="${esc(draft.wm)}">`:''}</div>
      ${mode==='edit'?`
      <div class="f"><label for="e1">${T[draft.lang].co}</label><input class="fld" id="e1" value="${esc(draft.company)}"></div>
      <div class="f"><label for="e2">Address / phone</label><input class="fld" id="e2" value="${esc(draft.contact)}"></div>
      <div class="f"><label for="e3">${T[draft.lang].buyer}</label><input class="fld" id="e3" value="${esc(draft.buyer)}"></div>
      <div class="f"><label for="e4">${T[draft.lang].seller}</label><input class="fld" id="e4" value="${esc(draft.seller)}"></div>
      <div class="f"><label for="e5">${T[draft.lang].num}</label><input class="fld" id="e5" value="${esc(draft.no)}"></div>`:''}
      <div class="acts"><button class="btn" id="ok">${mode==='create'?'Create':'Save changes'}</button><button class="btn ghost" id="no">Cancel</button></div></div></div>`;
    const sync=()=>{ // keep typed text when the sheet re-renders
      const g=id=>$('#'+id,layer);
      if(g('wm'))draft.wm=g('wm').value;
      if(mode==='edit'){draft.company=g('e1').value;draft.contact=g('e2').value;draft.buyer=g('e3').value;draft.seller=g('e4').value;draft.no=g('e5').value}
    };
    $('#sc').onclick=e=>{if(e.target.id==='sc')closeLayer()};
    $('#no').onclick=closeLayer;
    $('#fd').onclick=()=>{sync();openDate(draft,sheet)};
    layer.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{sync();draft.color=b.dataset.c;sheet()});
    $('#cc').onchange=e=>{sync();draft.color=e.target.value;sheet()};
    layer.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{sync();draft.lang=b.dataset.l;sheet()});
    $('#wt').onclick=()=>{sync();draft.wmOn=!draft.wmOn;sheet()};
    $('#ok').onclick=()=>{
      sync();
      if(draft.wmOn&&!draft.wm.trim())draft.wmOn=false;
      closeLayer();
      if(mode==='create'){inv=draft;dirty=true;openEditor()}
      else{Object.assign(inv,{date:draft.date,color:draft.color,lang:draft.lang,wmOn:draft.wmOn,wm:draft.wm,company:draft.company,contact:draft.contact,buyer:draft.buyer,seller:draft.seller,no:draft.no});dirty=true;renderPaper()}
    };
  };
  sheet();
}
function openDate(draft,back){
  const y0=new Date().getFullYear(),lang=draft.lang,ms=T[lang].months;
  layer.innerHTML=`<div class="scrim" id="sc"><div class="sheet"><h3>Date</h3>
    <div class="dp"><div id="cd">${Array.from({length:31},(_,i)=>`<button data-k="d" data-v="${i+1}">${i+1}</button>`).join('')}</div>
    <div id="cm">${ms.map((m,i)=>`<button data-k="m" data-v="${i+1}">${m}</button>`).join('')}</div>
    <div id="cy">${Array.from({length:11},(_,i)=>`<button data-k="y" data-v="${y0-5+i}">${y0-5+i}</button>`).join('')}</div></div>
    <div class="acts"><button class="btn" id="dok">Done</button></div></div></div>`;
  const mark=()=>layer.querySelectorAll('.dp button').forEach(b=>b.classList.toggle('on',+b.dataset.v===draft.date[b.dataset.k]));
  mark();
  layer.querySelectorAll('.dp div').forEach(c=>{const o=c.querySelector('.on');if(o)c.scrollTop=o.offsetTop-c.offsetTop-88});
  layer.querySelectorAll('.dp button').forEach(b=>b.onclick=()=>{draft.date[b.dataset.k]=+b.dataset.v;mark()});
  $('#dok').onclick=()=>{
    const max=new Date(draft.date.y,draft.date.m,0).getDate();
    if(draft.date.d>max)draft.date.d=max;
    back();
  };
  $('#sc').onclick=e=>{if(e.target.id==='sc')back()};
}

/* ---------- editor ---------- */
function fit(el,max=14,min=8){
  let s=max;el.style.fontSize=s+'px';
  while(el.scrollWidth>el.clientWidth+1&&s>min){s-=.5;el.style.fontSize=s+'px'}
}
function openEditor(){
  $('#home').hidden=true;$('#editor').hidden=false;window.scrollTo(0,0);renderPaper();
}
function renderPaper(){
  const t=T[inv.lang];
  root.style.setProperty('--color-accent',inv.color);
  root.lang=inv.lang==='km'?'km':'en';
  const num=n=>inv.lang==='km'?kh(n):n;
  $('#paper').innerHTML=`
    ${inv.wmOn&&inv.wm?`<div class="wm"><span>${esc(inv.wm)}</span></div>`:''}
    <div class="ph"><div><div class="co">${esc(inv.company)||`<span style="color:var(--color-mute);font-weight:500">${t.co}</span>`}</div><div class="ct">${esc(inv.contact)}</div></div><h2>${t.title}</h2></div>
    <div class="meta"><span>${t.num} <b>${esc(inv.no)}</b></span><span>${t.date} <b>${dateStr(inv.date)}</b></span></div>
    <div class="tbl"><div class="g h"><div>${t.no}</div><div>${t.goods}</div><div>${t.qty}</div>
      <button class="cur" id="cur" aria-label="Currency">${t.price}<b>${inv.cur}</b></button><div>${t.amount}</div></div>
      <div id="rows">${inv.rows.map((r,i)=>rowHtml(r,i,num)).join('')}</div></div>
    <div class="sum"><div><span>${t.total}</span><span id="tot"></span></div></div>
    <div class="sig"><div>${esc(inv.buyer)}<small>${t.buyer}</small></div><div>${esc(inv.seller)}<small>${t.seller}</small></div></div>`;
  $('#cur').onclick=()=>{inv.cur=inv.cur==='៛'?'$':'៛';dirty=true;renderPaper()};
  inv.rows.forEach((_,i)=>calc(i));calcTotal();
  document.fonts&&document.fonts.ready.then(()=>document.querySelectorAll('#rows .nm').forEach(el=>fit(el)));
}
const rowHtml=(r,i,num)=>`<div class="g" data-i="${i}"><div class="n">${num(i+1)}</div>
  <input class="nm" type="text" value="${esc(r.name)}" autocomplete="off" aria-label="Name of goods">
  <input class="nu qt" inputmode="numeric" value="${esc(r.qty)}" autocomplete="off" aria-label="Quantity">
  <input class="nu pr" inputmode="decimal" value="${esc(r.price)}" autocomplete="off" aria-label="Price">
  <div class="am"></div></div>`;
function calc(i){
  const row=$(`#rows [data-i="${i}"]`);if(!row)return;
  const a=rowAmt(inv.rows[i]),el=$('.am',row);
  el.textContent=a===null?'':fmt(a,inv.cur);fit(el,13,7);
}
function calcTotal(){const el=$('#tot');el.textContent=fmt(totalOf(inv),inv.cur)}
const paper=$('#paper');
paper.addEventListener('focusin',e=>{
  const el=e.target,row=el.closest('[data-i]');if(!row)return;
  const r=inv.rows[+row.dataset.i];
  if(el.classList.contains('qt')&&!r.touched){r.touched=true;r.qty='';el.value='';calc(+row.dataset.i);calcTotal()}
});
paper.addEventListener('input',e=>{
  const el=e.target,row=el.closest('[data-i]');if(!row)return;
  const i=+row.dataset.i,r=inv.rows[i];dirty=true;
  if(el.classList.contains('nm')){r.name=el.value;fit(el)}
  else{
    let v=el.value.replace(/[^0-9.]/g,'');
    const p=v.indexOf('.');if(p>-1)v=v.slice(0,p+1)+v.slice(p+1).replace(/\./g,'');
    el.value=v;
    if(el.classList.contains('qt')){r.qty=v;r.touched=true}else r.price=v;
    calc(i);calcTotal();
  }
});
$('#addrow').onclick=()=>{
  inv.rows.push(blankRow());dirty=true;
  const i=inv.rows.length-1,wrap=document.createElement('div');
  wrap.innerHTML=rowHtml(inv.rows[i],i,n=>inv.lang==='km'?kh(n):n);
  $('#rows').append(wrap.firstElementChild);$('.nm',$('#rows').lastElementChild).focus();
};
$('#edit').onclick=()=>openSetup('edit',inv);
function save(){
  const all=store.get('vk-inv',[]),k=all.findIndex(x=>x.id===inv.id);
  if(k>-1)all[k]=inv;else all.unshift(inv);
  if(store.set('vk-inv',all)){dirty=false;return true}
  toast('Could not save. Storage is full or blocked.');return false;
}
$('#save').onclick=()=>{if(save())toast('Saved')};
function goHome(){$('#editor').hidden=true;$('#home').hidden=false;root.style.setProperty('--color-accent',css('--sw-1'));root.lang='km';inv=null;renderHome();window.scrollTo(0,0)}
$('#back').onclick=()=>{
  if(!dirty)return goHome();
  confirmBox('Leave this invoice?',[['Exit and save',()=>{if(save())goHome()}],['Exit without save',goHome,'danger'],['Keep editing']]);
};
/* top bar: shows when scrolling up */
let lastY=0;
addEventListener('scroll',()=>{
  const y=scrollY,b=$('#bar');
  b.classList.toggle('off',y>lastY&&y>70);lastY=y;
},{passive:true});

/* ---------- PNG ---------- */
async function makePNG(){
  try{await document.fonts.load('600 24px "Kantumruy Pro"','ក')}catch{}
  await document.fonts.ready;
  const t=T[inv.lang],F=css('--font-ui'),accent=inv.color,ink=css('--color-ink'),mute=css('--color-mute'),paperC=css('--color-surface'),onA=css('--color-accent-ink');
  const W=1000,P=60,RH=64,rows=inv.rows,hdr=300,thH=76;
  const H=hdr+thH+rows.length*RH+210+190;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;
  const x=cv.getContext('2d');
  const font=(s,w)=>x.font=`${w} ${s}px ${F}`;
  const fitT=(txt,mw,s,w,min=14)=>{let z=s;font(z,w);while(x.measureText(txt).width>mw&&z>min){z--;font(z,w)}};
  const lineCol=accent+'88';
  x.fillStyle=paperC;x.fillRect(0,0,W,H);
  x.textBaseline='middle';
  // watermark
  if(inv.wmOn&&inv.wm){x.save();x.globalAlpha=.09;x.fillStyle=accent;font(150,700);x.textAlign='center';x.translate(W/2,H/2);x.rotate(-.42);fitT(inv.wm,W*.95,150,700,40);x.fillText(inv.wm,0,0);x.restore()}
  // header
  x.textAlign='left';x.fillStyle=ink;fitT(inv.company||'',560,40,700);x.fillText(inv.company||'',P,P+30);
  x.fillStyle=mute;fitT(inv.contact||'',560,24,400);x.fillText(inv.contact||'',P,P+80);
  x.textAlign='right';x.fillStyle=accent;fitT(t.title,330,64,700);x.fillText(t.title,W-P,P+36);
  x.textAlign='left';x.fillStyle=mute;font(26,400);x.fillText(`${t.num}  `,P,hdr-70);
  const wN=x.measureText(`${t.num}  `).width;x.fillStyle=ink;font(26,600);x.fillText(inv.no,P+wN,hdr-70);
  const ds=dateStr(inv.date);x.textAlign='right';x.fillStyle=ink;font(26,600);x.fillText(ds,W-P,hdr-70);
  const wD=x.measureText(ds).width;x.fillStyle=mute;font(26,400);x.fillText(`${t.date}  `,W-P-wD,hdr-70);
  // table
  const TW=W-2*P,cols=[.09,.37,.12,.19,.23].map(f=>f*TW),xs=[P];cols.forEach((c,i)=>xs.push(xs[i]+c));
  const y0=hdr;
  x.fillStyle=accent;x.fillRect(P,y0,TW,thH);
  x.fillStyle=onA;x.textAlign='center';
  [t.no,t.goods,t.qty,`${t.price} (${inv.cur})`,t.amount].forEach((h,i)=>{fitT(h,cols[i]-14,24,600,13);x.fillText(h,xs[i]+cols[i]/2,y0+thH/2)});
  rows.forEach((r,i)=>{
    const y=y0+thH+i*RH,a=rowAmt(r);
    x.fillStyle=mute;font(22,400);x.textAlign='center';x.fillText(inv.lang==='km'?kh(i+1):String(i+1),xs[0]+cols[0]/2,y+RH/2);
    x.fillStyle=ink;x.textAlign='left';fitT(r.name,cols[1]-24,28,400,13);x.fillText(r.name,xs[1]+12,y+RH/2);
    x.textAlign='right';
    fitT(r.qty,cols[2]-20,28,400,13);x.fillText(r.qty,xs[3]-10,y+RH/2);
    fitT(r.price,cols[3]-20,28,400,13);x.fillText(r.price,xs[4]-10,y+RH/2);
    if(a!==null){const s=fmt(a,inv.cur);fitT(s,cols[4]-20,28,600,12);x.fillText(s,xs[5]-10,y+RH/2)}
  });
  x.strokeStyle=lineCol;x.lineWidth=2;
  const yEnd=y0+thH+rows.length*RH;
  for(let i=0;i<=rows.length;i++){const y=y0+thH+i*RH;x.beginPath();x.moveTo(P,y);x.lineTo(P+TW,y);x.stroke()}
  xs.forEach(px=>{x.beginPath();x.moveTo(px,y0+thH);x.lineTo(px,yEnd);x.stroke()});
  // total
  const bw=460,by=yEnd+36;
  x.fillStyle=accent;x.fillRect(W-P-bw,by,bw,92);
  x.fillStyle=onA;x.textAlign='left';font(34,700);x.fillText(t.total,W-P-bw+24,by+46);
  x.textAlign='right';const ts=fmt(totalOf(inv),inv.cur);fitT(ts,bw-170,36,700,16);x.fillText(ts,W-P-24,by+46);
  // signatures
  const sy=by+92+120;x.strokeStyle=mute;x.lineWidth=2;x.textAlign='center';
  [[P,P+380,inv.buyer,t.buyer],[W-P-380,W-P,inv.seller,t.seller]].forEach(([a,b,n,l])=>{
    x.beginPath();x.moveTo(a,sy);x.lineTo(b,sy);x.stroke();
    x.fillStyle=ink;fitT(n||'',360,26,500,14);x.fillText(n||'',(a+b)/2,sy-24);
    x.fillStyle=mute;font(24,400);x.fillText(l,(a+b)/2,sy+30);
  });
  return cv;
}
$('#dl').onclick=async()=>{
  try{
    const cv=await makePNG();
    cv.toBlob(b=>{
      if(!b)return toast('Could not make the PNG');
      const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`invoice-${inv.no}.png`;
      document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast('PNG downloaded');
    },'image/png');
  }catch(e){toast('Could not make the PNG')}
};

renderHome();
