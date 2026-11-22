// Mission: CMAS Science — student app.
(function(){
const S=window.SETTINGS, D=window.CMAS_DATA, N=window.NUMBERING, ST=window.Store, IT=D.ITEMS;
const $=(s,r)=>(r||document).querySelector(s), app=$('#app');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang=ST.LS.get('cmas.lang','en'); const T=k=>(I18N[lang][k]!==undefined?I18N[lang][k]:I18N.en[k]);
const tx=o=>o==null?'':(typeof o==='string'?o:(lang==='es'&&o.es?o.es:o.en));
const both=o=>o==null?'':(lang==='es'&&o.es&&o.es!==o.en?`${esc(o.en)}<span class="es">${esc(o.es)}</span>`:esc(o.en));
let R=ST.rosterBlocks(ST.LS.get('cmas.roster',null)||ST.seedRoster()), rosterList=null;
let sess=ST.LS.get('cmas.session',null), evs=[], cfg={checkpoints:S.CHECKPOINTS};
window.App={get sess(){return sess;}, get evs(){return evs;}};

// ---------- activity tracking (inside this page only; counts, never key contents) ----------
const act={last:Date.now(),moves:0,clicks:0,keys:0,offTab:0,off:false,offSince:0,idleMs:0,qOff:0,qIdle:0,racingUntil:0,sessStart:Date.now(),sessIdle:0,sessOff:0,answers:0,current:null,clickTimes:[],mode:null,qStart:0};
function bump(){ const now=Date.now(); if(act.paused){ act.last=now; return; } const gap=now-act.last; if(gap>S.IDLE_SECONDS*1000){ act.qIdle+=gap; act.sessIdle+=gap; } act.last=now; }
let mmT=0; document.addEventListener('mousemove',()=>{const n=Date.now(); if(n-mmT>250){mmT=n; act.moves++; bump();}},{passive:true});
document.addEventListener('pointerdown',()=>{act.clicks++; act.clickTimes.push(Date.now()); act.clickTimes=act.clickTimes.slice(-20); bump();},{passive:true});
document.addEventListener('keydown',()=>{act.keys++; bump();},{passive:true});
document.addEventListener('touchstart',bump,{passive:true}); document.addEventListener('scroll',bump,{passive:true});
document.addEventListener('visibilitychange',()=>{ if(act.paused) return; if(document.hidden){act.off=true; act.offSince=Date.now(); act.offTab++; act.qOff++; act.sessOff++;} else {act.off=false; bump(); ping();} });
function liveStatus(){ const now=Date.now(); let status='working', idleSec=Math.round((now-act.last)/1000);
  if(act.paused){ status='paused'; idleSec=0; } else if(act.off) status='off'; else if(idleSec>=S.IDLE_SECONDS) status='idle'; else if(now<act.racingUntil) status='racing';
  return {sid:sess.sid,name:sess.name,block:sess.block,status,idleSec,offSec:act.off?Math.round((now-act.offSince)/1000):0,current:act.current,qSec:act.qStart?Math.round((now-act.qStart)/1000):0,
    mode:act.mode,answers:act.answers,sessionMin:Math.round((now-act.sessStart)/60000),offTabCount:act.sessOff}; }
function ping(){ if(sess) ST.sendLive(liveStatus()); }
setInterval(()=>{ if(!sess) return; ping(); idleNudgeCheck(); teacherPauseCheck(); }, S.LIVE_REFRESH_SECONDS*1000);
function endSession(extra){ if(!sess||act.sessionEnded) return; act.sessionEnded=true; const now=Date.now(); const idleTail=now-act.last>S.IDLE_SECONDS*1000?now-act.last:0;
  ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'session',mode:act.mode||'',ms:now-act.sessStart,idleMs:act.sessIdle+idleTail,offTab:act.sessOff,
    detail:{paused:!!(extra&&extra.paused),answers:act.answers,clicks:act.clicks,keys:act.keys,moves:act.moves}}); ST.flush(); }
window.addEventListener('pagehide',()=>{ if(!act.paused) endSession(); });

// ---------- work habits meter (practice only) ----------
let habit=ST.LS.get('cmas.habit',70);
function habitAdj(d){ habit=Math.max(0,Math.min(100,habit+d)); ST.LS.set('cmas.habit',habit); const b=$('#habitbar'); if(b){b.style.width=habit+'%';} }
let idleShown=false;
function idleNudgeCheck(){ if(!run||run.mode==='checkpoint'||idleShown||act.off) return; if(Date.now()-act.last>=S.IDLE_SECONDS*1000){ idleShown=true; habitAdj(-5);
  overlay(`<h2>🛰️ ${T('idle')}</h2><p>${T('idleSub')}</p><button class="btn ok" id="ovok">${T('imHere')}</button>`, o=>{ $('#ovok',o).onclick=()=>{o.remove(); idleShown=false; bump();}; }); } }

// ---------- helpers ----------
function overlay(html,init){ const o=document.createElement('div'); o.className='ov'; o.innerHTML=`<div class="box" role="dialog" aria-modal="true">${html}</div>`; document.body.appendChild(o); init&&init(o); const f=o.querySelector('button'); f&&f.focus(); return o; }
function confetti(){ if(matchMedia('(prefers-reduced-motion: reduce)').matches) return; const cs=['#ffd23f','#3b5bfd','#22c55e','#ef4444','#a855f7'];
  for(let i=0;i<40;i++){ const c=document.createElement('div'); c.className='confetti'; c.style.left=Math.random()*100+'vw'; c.style.background=cs[i%5]; c.style.animationDelay=(Math.random()*.4)+'s'; document.body.appendChild(c); setTimeout(()=>c.remove(),2200);} }
function speak(text){ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=lang==='es'?'es-MX':'en-US'; u.rate=.9;
  const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith(lang)); if(v) u.voice=v; speechSynthesis.speak(u); }
function topbar(extra){ return `<div class="top"><div class="brand"><svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#ffd23f"/><ellipse cx="32" cy="32" rx="30" ry="9" fill="none" stroke="#fff" stroke-width="4" transform="rotate(-20 32 32)"/><circle cx="32" cy="32" r="14" fill="#3b5bfd"/></svg>${T('title')}</div><div class="sp"></div>
  ${extra||''}<button class="pill" id="langbtn" aria-pressed="${lang==='es'}" aria-label="Español / English">${lang==='es'?'English':'Español'}</button>
  <button class="pill" id="mutebtn" aria-pressed="${ST.LS.get('cmas.mute',0)==1}">${ST.LS.get('cmas.mute',0)==1?'🔇':'🔊'}</button>
  ${sess?`<span class="who">${T('hi')}, <b>${esc(sess.name)}</b></span><button class="pill" id="outbtn">${T('signout')}</button>`:''}</div>`; }
function wireTop(rerender){ $('#langbtn').onclick=()=>{lang=lang==='en'?'es':'en'; ST.LS.set('cmas.lang',lang); rerender();};
  $('#mutebtn').onclick=()=>{const m=ST.LS.get('cmas.mute',0)==1?0:1; localStorage.setItem('cmas.mute',m); rerender();};
  const o=$('#outbtn'); if(o) o.onclick=()=>{ endSession(); sess=null; ST.LS.set('cmas.session',null); run=null; home(); }; }
function today(){ return new Date().toLocaleDateString('en-CA'); }
function cpOpen(){ const list=(cfg.checkpoints||S.CHECKPOINTS); const t=today(); return list.filter(c=>c.opens&&c.opens<=t); }

// ---------- sign in ----------
async function refreshRoster(){ const r=await ST.getRoster(); rosterList=r.students; R=ST.rosterBlocks(rosterList); }
function home(){ act.mode=null; if(!rosterList){ refreshRoster().then(()=>{ if(!sess) home(); }); rosterList=[]; } app.innerHTML=topbar()+`<div class="hero"><h1>🚀 ${T('title')}</h1><p>${T('sub')}</p></div>
  <div class="card"><h2>${T('pickBlock')}</h2><div class="grid g4">${R.map((b,i)=>`<button class="big b${i+1}" data-b="${i}">${esc(b.label)}</button>`).join('')}</div></div>
  <p class="footer"><a href="teacher.html" style="color:#c7d2fe">${T('teacherLink')}</a></p>`;
  wireTop(home); app.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>names(R[b.dataset.b])); }
function names(b){ app.innerHTML=topbar()+`<div class="card"><div class="row"><button class="btn ghost sm" id="bk">← ${T('back')}</button><h2 style="margin:0">${esc(b.label)} · ${T('pickName')}</h2></div>
  <div class="grid g5" style="margin-top:14px">${b.students.map(s=>`<button class="name" data-s="${s.id}">${esc(s.name)}</button>`).join('')}</div></div>`;
  wireTop(()=>names(b)); $('#bk').onclick=home;
  app.querySelectorAll('[data-s]').forEach(x=>x.onclick=async()=>{ const s=b.students.find(s=>s.id===x.dataset.s); sess={sid:s.id,name:s.name,block:b.block,pretestFirst:s.pretestFirst!==false}; ST.LS.set('cmas.session',sess);
    newSession(); await enter(); }); }
async function enter(){ app.innerHTML=topbar()+`<div class="hero"><p>Loading…</p></div>`; [evs,cfg]=await Promise.all([ST.loadStudent(sess.sid),ST.getConfig()]); hub(); ping(); }

function newSession(){ Object.assign(act,{sessStart:Date.now(),sessIdle:0,sessOff:0,answers:0,clicks:0,keys:0,moves:0,last:Date.now(),paused:false,sessionEnded:false,off:false}); }

// ---------- Pause & Save (every test/mission mode) ----------
// Saves position + time used; pause time never counts toward timing, idle, off-tab, or habit data.
function pauseInfo(){ const c=window.App.cur||{}; const s=run.steps[run.i]||{}; const Q=c.Q;
  const nextQ=run.steps.slice(run.i).find(x=>x.type!=='read')||{};
  return {pos:run.i,item:(c.id&&!c.read)?c.id:(nextQ.id||''),n:s.n||nextQ.n||'',qElapsed:Q&&c.id&&!c.read?Math.max(0,Date.now()-Q.t0Orig):0,onRead:!!c.read,tries:Q&&!c.read?Q.tries:0,hint:Q&&!c.read?Q.hint:false,
    activeMs:(run.activeMs||0)+(Date.now()-run.segStart),answered:run.mode==='checkpoint'?ST.pretestState(evs,run.ctx).done.size:undefined,
    steps:(run.mode==='review'||run.mode==='skill')?run.steps.map(x=>x.id):undefined,title:typeof run.title==='string'?run.title:undefined}; }
function pauseRun(by){ if(!run||act.paused) return; const d=pauseInfo(); d.by=by||'student';
  ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'pause',mode:run.mode,ctx:run.ctx,item:d.item,n:d.n,ms:d.activeMs,detail:d});
  evs=ST.LS.get('cmas.ev.'+sess.sid,evs); endSession({paused:true}); act.paused=true; act.mode='paused'; act.current=null; act.qStart=0; const r=run; run=null; ping();
  try{ speechSynthesis.cancel(); }catch(e){} document.querySelectorAll('.ov').forEach(o=>o.remove());
  const total=r.mode==='checkpoint'?pretestSteps().filter(x=>x.type==='q').length:r.steps.filter(x=>x.type!=='read').length;
  const done=r.mode==='checkpoint'?d.answered:r.steps.slice(0,d.pos).filter(x=>x.type!=='read').length;
  app.innerHTML=topbar()+`<div class="card" id="pausedcard" style="text-align:center;max-width:720px;margin:6vh auto"><h2>⏸ ${by==='teacher'?T('pausedByTeacher'):T('pausedTitle')}</h2>
    <p>${T('pausedSaved')}</p><div class="code">${done} ${T('of')} ${total}</div><p>${T('pausedNext')} <b>${d.n?(String(d.n).startsWith('M')?d.n:'#'+d.n):esc(d.item)}</b></p>
    <div class="row" style="justify-content:center"><button class="btn ok" id="resnow">▶ ${T('resumeNow')}</button><button class="btn ghost" id="pmap">🏠 ${T('home')}</button></div></div>`;
  wireTop(()=>{}); $('#resnow').onclick=()=>{ newSession(); resumeFrom(r.mode,r.ctx); }; $('#pmap').onclick=()=>{ newSession(); hub(); };
  const so=$('#outbtn'); if(so) so.onclick=()=>{ sess=null; ST.LS.set('cmas.session',null); act.paused=false; home(); }; ST.flush(); }
function resumeFrom(mode,ctx){ act.paused=false; act.last=Date.now();
  if(mode==='checkpoint') return startCheckpoint(ctx);
  const p=ST.openPause(evs); if(!p) return hub(); const d=p.detail||{};
  ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'resume',mode:p.mode,ctx:p.ctx,item:p.item,detail:{pausedAt:p.ts}});
  let r=null;
  if(p.ctx&&p.ctx.startsWith('D')){ const day=N.days.find(x=>'D'+x.day===p.ctx); if(day) r={mode:p.mode,ctx:p.ctx,title:()=>`${T('day')} ${day.day}: ${tx(day.title)}`,steps:day.steps,day}; }
  else if(p.ctx&&p.ctx.startsWith('MAP')){ const m=N.map.find(x=>'MAP'+x.set===p.ctx); if(m) r={mode:p.mode,ctx:p.ctx,title:()=>tx(m.title),steps:m.steps}; }
  else if(d.steps) r={mode:p.mode,ctx:p.ctx,title:d.title||T('review'),steps:d.steps.map(id=>({type:'q',id,n:(ST.WHERE[id]||{}).n,page:(ST.WHERE[id]||{}).page}))};
  if(!r) return hub();
  evs=ST.LS.get('cmas.ev.'+sess.sid,evs);
  startRun(Object.assign(r,{start:Math.min(d.pos||0,r.steps.length),restore:d,activeMs:d.activeMs||0})); }
// Teacher "Pause" from the dashboard: checked on this device every refresh, and from the shared Sheet about once a minute.
let tpBusy=false, tpTick=0;
async function teacherPauseCheck(){ if(!run||tpBusy) return; if(ST.online()&&(tpTick++%4)) return; tpBusy=true;
  try{ let list=ST.LS.get('cmas.ev.'+sess.sid,[]); if(ST.online()) list=await ST.loadStudent(sess.sid);
    if(run&&list.some(e=>e.type==='teacher_pause'&&e.ctx===run.ctx&&String(e.ts)>String(run.startedAt))) pauseRun('teacher'); } finally { tpBusy=false; } }

// ---------- hub ----------
function dayStatus(d){ const qs=d.steps.filter(s=>s.type==='q').map(s=>s.id); const runs=ST.answers(evs).filter(e=>e.ctx==='D'+d.day&&e.mode==='practice');
  const done=qs.every(id=>runs.some(e=>e.item===id)); const latest={}; runs.forEach(e=>latest[e.item]=e);
  const stars=qs.filter(id=>latest[id]&&ST.cleanFirst(latest[id])).length; return {done,stars,total:qs.length,started:runs.length>0}; }
function hub(){ act.mode='hub'; act.current=null; run=null;
  const pre=ST.pretestState(evs,'pre'); const open=cpOpen();
  const pending=open.filter(c=>!ST.pretestState(evs,c.id).finished);
  let html=topbar(`<button class="pill" id="mdbtn">📊 ${T('mydata')}</button><button class="pill" id="stdbtn">🎯 ${T('myStandards')}</button>`);
  const cpCard=c=>{ const st=ST.pretestState(evs,c.id); const n=pretestSteps().filter(s=>s.type==='q').length; const pz=st.paused&&(st.paused.detail||{});
    if(pz||st.done.size) return `<div class="card resumecard" style="margin-top:12px"><h2>▶ ${T('resumeTest')}: ${esc(c.id==='pre'?T('launch'):c.name)}</h2>
      <p>${T('resumeSub')}</p><div class="bar" style="margin:10px 0"><i style="width:${Math.round(100*st.done.size/n)}%"></i></div><p><b>${st.done.size} ${T('of')} ${n}</b> ${T('answeredSaved')}</p>
      <p class="note">${T('launchRules')}</p><button class="btn ok big" data-cp="${c.id}">▶ ${T('resumeTest')} →</button></div>`;
    return `<div class="card" style="margin-top:12px"><h2>🛰️ ${esc(c.id==='pre'?T('launch'):c.name)}</h2><p>${T('launchSub')}</p><p class="note">${T('launchRules')}</p>
      <div class="bar" style="margin:10px 0"><i style="width:${Math.round(100*st.done.size/n)}%"></i></div><p class="small muted">${st.done.size} ${T('of')} ${n}</p>
      <button class="btn ok" data-cp="${c.id}">${st.done.size?T('resume'):T('start')} →</button></div>`; };
  if(!pre.finished&&sess.pretestFirst!==false){ html+=cpCard((cfg.checkpoints||S.CHECKPOINTS).find(c=>c.id==='pre')||{id:'pre',name:T('launch')});
    html+=`<p class="sect">🔒 ${T('locked')}</p>`; app.innerHTML=html; wireHub(); return; }
  pending.forEach(c=>html+=cpCard(c));
  const op=ST.openPause(evs); if(op){ const d=op.detail||{}; const nm=op.ctx.startsWith('D')?`${T('day')} ${op.ctx.slice(1)}`:op.ctx.startsWith('MAP')?`MAP ${op.ctx.slice(3)}`:(d.title||T('review'));
    html+=`<div class="card resumecard" style="margin-top:12px"><h2>▶ ${T('resumeMission')}: ${esc(nm)}</h2><button class="btn ok" id="resmis">▶ ${T('resumeNow')} →</button></div>`; }
  const rv=ST.reviewList(evs).filter(r=>!r.fixed);
  html+=`<div class="grid g4" style="margin-top:14px">
    <button class="mission" id="rvbtn"><span class="tag c-STRAT">🔁 ${T('review')}</span><span class="t">${T('reviewSub')}</span><span class="muted small">${rv.length} ${lang==='es'?'preguntas':'questions'}</span></button>
    <button class="mission" id="skbtn"><span class="tag c-LS">🗺️ ${T('skills')}</span><span class="t">${T('skillsSub')}</span></button>
    <button class="mission" id="md2"><span class="tag c-PS">📊 ${T('mydata')}</span><span class="t">${T('firstTry')} → ${T('latest')} · ${T('grow')}</span></button></div>`;
  html+=`<p class="sect">🪐 ${T('days')}</p><div class="grid g4">`;
  let prevDone=true;
  N.days.forEach(d=>{ const st=dayStatus(d); const lock=S.SEQUENTIAL_DAYS&&!prevDone; prevDone=st.done;
    html+=`<button class="mission ${lock?'locked':''}" data-day="${d.day}" ${lock?'aria-disabled="true"':''}><span class="tag c-${d.cat}">${T('day')} ${d.day} · ${esc(D.CATS[d.cat][lang]||D.CATS[d.cat].en)}</span>
      <span class="t">${esc(tx(d.title))}</span><span class="small muted">${d.inWorkbook?`${T('pages')} ${d.pages}`:T('bonus')}</span>
      <span class="stars" aria-label="${st.stars} ${T('stars')}">${'★'.repeat(st.stars)}${'☆'.repeat(st.total-st.stars)}</span>${st.done?`<span class="small">✅ ${T('replay')}</span>`:''}</button>`; });
  html+=`</div><p class="sect">🧪 ${T('map')}</p><p style="color:#dbe4ff" class="small">${T('mapNote')}</p><div class="grid g4">`;
  N.map.forEach(m=>{ html+=`<button class="mission" data-map="${m.set}"><span class="tag c-MAP">MAP ${m.set}</span><span class="t">${esc(tx(m.title))}</span><span class="small muted">${m.steps.length} ${lang==='es'?'preguntas':'questions'}</span></button>`; });
  html+=`</div>`; app.innerHTML=html; wireHub(); }
function wireHub(){ wireTop(hub); const md=$('#mdbtn'); md&&(md.onclick=()=>window.MyData.show(evs,sess,lang,hub)); const sd=$('#stdbtn'); sd&&(sd.onclick=()=>window.MyData.standards(evs,lang,hub));
  app.querySelectorAll('[data-cp]').forEach(b=>b.onclick=()=>startCheckpoint(b.dataset.cp));
  const rv=$('#rvbtn'); rv&&(rv.onclick=startReview); const rm=$('#resmis'); rm&&(rm.onclick=()=>{ const p=ST.openPause(evs); resumeFrom(p.mode,p.ctx); }); const sk=$('#skbtn'); sk&&(sk.onclick=()=>window.MyData.skillMap(evs,lang,hub,startSkill)); const m2=$('#md2'); m2&&(m2.onclick=()=>window.MyData.show(evs,sess,lang,hub));
  app.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{ if(b.classList.contains('locked')) return; const d=N.days.find(x=>x.day==b.dataset.day); const st=dayStatus(d);
    startRun({mode:st.done?'replay':'practice',ctx:'D'+d.day,title:()=>`${T('day')} ${d.day}: ${tx(d.title)}`,steps:d.steps,day:d}); });
  app.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>{ const m=N.map.find(x=>x.set==b.dataset.map); startRun({mode:'practice',ctx:'MAP'+m.set,title:()=>tx(m.title),steps:m.steps}); }); }

// ---------- sequences ----------
function pretestSteps(){ const out=[]; const ids=new Set(ST.pretestItems());
  N.days.forEach(d=>d.steps.forEach(s=>{ if(s.type==='read'&&!out.some(o=>o.type==='read'&&o.stim===s.stim)) out.push(s); else if(s.type==='q'&&ids.has(s.id)) out.push(s); }));
  // stimulus pages go right before the first question that needs them
  const final=[]; const usedStim=new Set();
  out.filter(s=>s.type==='q').forEach(s=>{ const st=IT[s.id].stim; if(st&&!usedStim.has(st)){usedStim.add(st); final.push({type:'read',stim:st,pages:null});} final.push(s); });
  if(S.PRETEST_INCLUDE_MAP) N.map.forEach(m=>m.steps.forEach(s=>final.push(s)));
  return final; }
function startCheckpoint(cp){ const st=ST.pretestState(evs,cp); const steps=pretestSteps(); act.paused=false;
  if(st.paused) ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'resume',mode:'checkpoint',ctx:cp,item:st.paused.item,detail:{pausedAt:st.paused.ts}});
  const restore=st.paused&&st.paused.type==='pause'?st.paused.detail:null;
  let i=0; while(i<steps.length){ const s=steps[i]; if(s.type==='q'&&st.done.has(s.id)){i++;continue;} if(s.type==='read'){ const nxt=steps.slice(i+1).find(x=>x.type==='q'); if(nxt&&st.done.has(nxt.id)){i++;continue;} } break; }
  // Resume lands on the exact next unanswered question (skip the story page if they had already read it before pausing)
  if(restore&&!restore.onRead&&steps[i]&&steps[i].type==='read'&&steps[i+1]&&steps[i+1].id===restore.item) i++;
  const c=(cfg.checkpoints||S.CHECKPOINTS).find(x=>x.id===cp)||{name:cp};
  startRun({mode:'checkpoint',ctx:cp,title:cp==='pre'?T('launch'):c.name,steps,start:i,restore,activeMs:restore?restore.activeMs||0:0}); }
function startReview(){ const rv=ST.reviewList(evs).filter(r=>!r.fixed); if(!rv.length){ overlay(`<h2>🌟</h2><p>${T('noReview')}</p><button class="btn">OK</button>`,o=>$('button',o).onclick=()=>o.remove()); return; }
  startRun({mode:'review',ctx:'review',title:T('review'),steps:rv.map(r=>({type:'q',id:r.item,n:(ST.WHERE[r.item]||{}).n,page:(ST.WHERE[r.item]||{}).page}))}); }
function startSkill(topic){ const first=ST.firstAttempts(evs); const pool=Object.keys(IT).filter(id=>ST.topicsOf(id).includes(topic)&&(topic==='test_strategies'||IT[id].src!=='strategy'));
  const practiced=new Set(ST.answers(evs).filter(e=>e.mode!=='checkpoint').map(e=>e.item));
  const score=id=>(first[id]&&!ST.cleanFirst(first[id])?0:1)+(practiced.has(id)?2:0)+Math.random();
  const pick=pool.sort((a,b)=>score(a)-score(b)).slice(0,5);
  startRun({mode:'skill',ctx:'skill:'+topic,title:`${T('skills')}: ${tx(D.TOPICS[topic])}`,steps:pick.map(id=>({type:'q',id,n:(ST.WHERE[id]||{}).n,page:(ST.WHERE[id]||{}).page}))}); }

// ---------- runner ----------
let run=null;
function startRun(r){ run=Object.assign({i:r.start||0,results:[],segStart:Date.now(),startedAt:new Date().toISOString(),activeMs:0},r); if(typeof r.title==='function'){ const f=r.title; Object.defineProperty(run,'title',{get:f}); } act.mode=r.mode; step(); }
function step(){ speechSynthesis&&speechSynthesis.cancel&&speechSynthesis.cancel();
  if(run.i>=run.steps.length) return finish();
  const s=run.steps[run.i];
  if(s.type==='read') return readStep(s);
  if(s.type==='strategy') return question({type:'q',id:s.id,n:null,page:null});
  return question(s); }
function header(s,it){ const total=run.steps.length, pct=Math.round(100*run.i/total);
  const isStrat=it&&it.src==='strategy';
  let lab=run.mode==='checkpoint'?`${esc(run.title)} · ${run.i+1} ${T('of')} ${total}`:esc(run.title);
  let q=''; if(it){ q=isStrat?`🧭 ${T('strategy')} ${it.id}`:(String(s.n||'').startsWith('M')?`${T('q')} ${s.n}`:`${T('q')} #${s.n||'?'}`);
    if(s.page) q+=` · ${T('page')} ${s.page}`; }
  return `<div class="qhead"><span class="lab">${lab}</span>${q?`<span class="chip">${q}</span>`:''}
    ${it?`<span class="chip src-${it.src}" title="${esc(it.srcLabel)}">${it.src==='cmas'?'Official CMAS':it.src==='nwea_sample'?'NWEA sample':it.src==='original'?'MAP-style (original)':T('strategy')}</span>`:''}
    <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
    ${run.mode!=='checkpoint'?`<span class="chip" title="${T('habits')}">🧑‍🚀 ${T('habits')} <span class="bar" style="display:inline-block;width:90px;vertical-align:middle"><i id="habitbar" style="width:${habit}%"></i></span></span>`:''}
    <button class="btn warn sm pausebtn" id="homebtn" aria-label="${T('pauseSave')}">⏸ ${T('pauseSave')}</button></div>`; }
function readStep(s){ window.App.cur={read:s.stim}; const st=D.STIMS[s.stim]; act.current={label:'read:'+s.stim}; act.qStart=Date.now(); const t0=Date.now();
  app.innerHTML=topbar()+header(s,null)+`<div class="card"><h2>📡 ${T('read')}: ${esc(tx(st.title))}</h2>${s.pages?`<p class="muted">${T('pages')} ${s.pages}</p>`:''}
   <div class="langtabs"><button class="pill" id="te" aria-pressed="${lang!=='es'}" style="color:#14203d;background:#eef1ff">${T('officialEn')}</button><button class="pill" id="ts" aria-pressed="${lang==='es'}" style="color:#14203d;background:#eef1ff">${T('officialEs')}</button></div>
   <div id="pg" class="official" style="max-height:none"></div><div class="row" style="margin-top:12px"><button class="btn ok" id="rd">${T('readBtn')} →</button></div></div>`;
  const show=l=>{$('#pg').innerHTML=st.pages.map((p,i)=>`<img src="${p[l]}" alt="${esc(st.title.en)} page ${i+1} (${l==='es'?'Spanish':'English'} official CMAS practice resource)" loading="lazy" style="margin-bottom:12px">`).join('');};
  show(lang==='es'?'es':'en'); $('#te').onclick=()=>show('en'); $('#ts').onclick=()=>show('es');
  wireTop(()=>readStep(s)); $('#homebtn').onclick=()=>pauseRun('student');
  $('#rd').onclick=()=>{ ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'read',mode:run.mode,ctx:run.ctx,item:'stim:'+s.stim,ms:Date.now()-t0}); run.i++; step(); }; }

function minSeconds(it){ const r=S.RUSH; return Math.max(r.MIN_SECONDS,Math.min(r.MAX_SECONDS,(it.words||20)/r.WORDS_PER_SECOND)); }
function question(s){ const it=IT[s.id]; const pre=run.mode==='checkpoint';
  const Q={s,it,tries:0,hint:false,sel:{},t0:Date.now(),changes:[],phase:it.kind==='cr'?'write':'answer',crText:'',rush:false};
  act.current={label:(s.n?('#'+s.n):it.id),item:it.id}; act.qStart=Date.now(); act.qOff=0; act.qIdle=0;
  if(run.restore&&run.restore.item===it.id){ const r=run.restore; Q.t0=Date.now()-(r.qElapsed||0); if(!pre){ Q.tries=r.tries||0; Q.hint=!!r.hint; } run.restore=null; }
  window.App.cur={id:it.id,Q,mode:run.mode};
  const draftKey='cmas.cr.'+sess.sid+'.'+run.ctx+'.'+it.id; Q.crText=ST.LS.get(draftKey,'');
  function render(){ const vids=window.VIDEOS||{};
    const imgs=it.img?`<div class="official" id="off"><div class="langtabs"><button class="pill" id="te" aria-pressed="${lang!=='es'}" style="color:#14203d;background:#eef1ff">${T('officialEn')}</button>${it.img.es!==it.img.en?`<button class="pill" id="ts" aria-pressed="${lang==='es'}" style="color:#14203d;background:#eef1ff">${T('officialEs')}</button>`:''}
       <button class="pill" id="zm" style="color:#14203d;background:#eef1ff">🔍 ${T('zoom')}</button></div><img id="qimg" src="${lang==='es'?it.img.es:it.img.en}" alt="${esc(it.stem.en)}"></div>`:'';
    let p=`<div class="panel">`;
    p+=`<div class="toolbar"><button class="btn ghost sm" id="ra">🔊 ${T('readAloud')}</button>${it.stim?`<button class="btn ghost sm" id="lb">📖 ${T('lookBack')}</button>`:''}
      ${!pre&&Q.phase!=='done'?`<button class="btn warn sm" id="hb" ${Q.hint?'disabled':''}>💡 ${T('hint')}</button>`:''}</div>`;
    if(run.mode==='review'&&Q.phase!=='done') p+=videoSlot(vids[it.id],true);
    if(!it.img||it.src!=='cmas') p+=`<p class="stem"><b>${esc(tx(it.stem))}</b>${lang==='es'&&it.stem.es&&it.src!=='cmas'?`<br><span class="small muted">${esc(it.stem.en)}</span>`:''}</p>`;
    else p+=`<p class="stem">${s.n?`<b>${T('q')} #${s.n}</b> · `:''}${lang==='es'?'Lee la pregunta oficial a la izquierda y contesta aquí.':'Read the official question on the left, then answer here.'}</p>`;
    if(Q.hint) p+=`<div class="hintbox">💡 ${esc(tx(it.hint))}</div>`;
    p+=controls();
    p+=`<div id="fbx"></div></div>`;
    app.innerHTML=topbar()+header(s,it)+(imgs?`<div class="qwrap">${imgs}${p}</div>`:`<div style="max-width:820px;margin:0 auto">${p}</div>`);
    wireTop(render); $('#homebtn').onclick=()=>pauseRun('student'); wire(); }
  function opt(key,i,o,pressed){ return `<button class="opt" data-k="${key}" data-i="${i}" aria-pressed="${pressed}">${both(o)}</button>`; }
  function controls(){ let h=''; const disabled=Q.phase==='done'||Q.phase==='code';
    const mcBlock=(choices,key,multi)=>choices.map((c,i)=>{ const L='ABCDEFG'[i]; const on=(Q.sel[key]||'').includes(L);
      return `<button class="choice" data-k="${key}" data-l="${L}" data-multi="${multi?1:0}" aria-pressed="${on}" ${disabled?'disabled':''}><span class="L">${L}</span><span>${both(c)}</span></button>`; }).join('');
    if(it.kind==='write'){}
    if(it.kind==='cr'){
      if(Q.phase==='write'){ if(pre) h+=`<p><b>✏️ ${T('crPre')}</b></p><textarea class="cr" id="crt" aria-label="Written answer">${esc(Q.crText)}</textarea>`;
        else h+=`<p><b>✏️ ${T('crPractice')}</b>${s.page?` (${T('page')} ${s.page})`:''}</p>`;
        h+=`<button class="btn ok" id="wrote">${T('iWrote')} →</button>`; return h; }
      h+=`<p class="note">${T('check')}</p><p class="stem"><b>${esc(tx(it.check.q))}</b></p>`+mcBlock(it.check.choices,'main',false);
    } else if(it.kind==='mc') h+=mcBlock(it.choices,'main',false);
    else if(it.kind==='ms') h+=`<p class="note">${T('selectTwo')}</p>`+mcBlock(it.choices,'main',true);
    else if(it.kind==='parts') it.parts.forEach((pt,pi)=>{ h+=`<p class="stem"><b>${['Part A','Part B','Part C'][pi]}:</b> ${both(pt.q)}</p>`+mcBlock(pt.choices,'p'+pi,pt.kind==='ms'); });
    else if(it.kind==='inline') it.blanks.forEach((b,bi)=>{ h+=`<div class="blank"><div class="bl">${b.label?both(b.label):`${lang==='es'?'Recuadro':'Box'} ${bi+1}`}</div><div class="opts">${b.en.map((o,oi)=>opt('b'+bi,oi,{en:o,es:b.es[oi]},Q.sel['b'+bi]==oi)).join('')}</div></div>`; });
    if(Q.phase==='answer') h+=`<div class="row" style="margin-top:12px"><button class="btn" id="sub">${T('submit')} ✓</button></div>`;
    return h; }
  function wire(){ const ra=$('#ra'); ra&&(ra.onclick=()=>{ let t=tx(it.stem)+'. '; const ch=it.kind==='cr'&&Q.phase!=='write'?it.check.choices:it.choices;
      if(it.kind==='cr'&&Q.phase!=='write') t+=tx(it.check.q)+'. '; if(ch) t+=ch.map((c,i)=>'ABCDE'[i]+'. '+tx(c)).join('. ');
      if(it.blanks) t+=it.blanks.map(b=>(b.label?tx(b.label)+': ':'')+(lang==='es'?b.es:b.en).join(', o, '.replace('o',lang==='es'?'o':'or'))).join('. ');
      if(it.parts) t+=it.parts.map(p=>tx(p.q)+' '+p.choices.map((c,i)=>'ABCDE'[i]+'. '+tx(c)).join('. ')).join('. '); speak(t); });
    const lb=$('#lb'); lb&&(lb.onclick=()=>lookBack(it.stim));
    const te=$('#te'), ts=$('#ts'), zm=$('#zm'); te&&(te.onclick=()=>{$('#qimg').src=it.img.en;}); ts&&(ts.onclick=()=>{$('#qimg').src=it.img.es;}); zm&&(zm.onclick=()=>$('#off').classList.toggle('zoom'));
    const hb=$('#hb'); hb&&(hb.onclick=()=>{ Q.hint=true; Sound.click(); render(); });
    app.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{ const k=b.dataset.k, L=b.dataset.l; Sound.click(); Q.changes.push(Date.now());
      if(b.dataset.multi==='1'){ let v=Q.sel[k]||''; v=v.includes(L)?v.replace(L,''):v+L; Q.sel[k]=v.split('').sort().join(''); } else Q.sel[k]=L; render(); });
    app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{ Q.sel[b.dataset.k]=Number(b.dataset.i); Q.changes.push(Date.now()); Sound.click(); render(); });
    const crt=$('#crt'); crt&&(crt.oninput=()=>{ Q.crText=crt.value; ST.LS.set(draftKey,Q.crText); });
    const wr=$('#wrote'); wr&&(wr.onclick=()=>{ Q.phase='answer'; render(); });
    const sb=$('#sub'); sb&&(sb.onclick=submit); }
  function complete(){ if(it.kind==='mc'||it.kind==='cr') return !!Q.sel.main; if(it.kind==='ms') return (Q.sel.main||'').length>0;
    if(it.kind==='inline') return it.blanks.every((b,i)=>Q.sel['b'+i]!==undefined); if(it.kind==='parts') return it.parts.every((p,i)=>Q.sel['p'+i]); return true; }
  function isRight(){ if(it.kind==='cr') return Q.sel.main===it.check.ans; if(it.kind==='mc') return Q.sel.main===it.ans; if(it.kind==='ms') return Q.sel.main===it.ans.split('').sort().join('');
    if(it.kind==='parts') return it.parts.every((p,i)=>Q.sel['p'+i]===p.ans.split('').sort().join(''));
    if(it.kind==='inline'){ const v=it.blanks.map((b,i)=>Q.sel['b'+i]); if(it.blanks.every((b,i)=>v[i]===b.ans)) return true; return (it.accept_alt||[]).some(a=>a.every((x,i)=>x===v[i])); } return false; }
  function answerText(){ if(it.kind==='inline') return it.blanks.map((b,i)=>b.en[Q.sel['b'+i]]).join(' | '); if(it.kind==='parts') return it.parts.map((p,i)=>Q.sel['p'+i]).join(' | '); return Q.sel.main||''; }
  function rushCheck(){ const el=(Date.now()-Q.t0)/1000; const r=S.RUSH; const recent=Q.changes.filter(t=>Date.now()-t<r.RAPID_WINDOW_SEC*1000).length;
    const fast=el<minSeconds(it), rapid=recent>=r.RAPID_CLICKS; return {fast,rapid,el}; }
  function submit(){ if(!complete()){ $('#fbx').innerHTML=`<div class="fb no">${lang==='es'?'Contesta todas las partes primero.':'Answer every part first.'}</div>`; return; }
    const rc=rushCheck(); const ok=isRight();
    if(rc.fast||rc.rapid){ act.racingUntil=Date.now()+20000; Q.rush=true;
      ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'rush',mode:run.mode,ctx:run.ctx,item:it.id,ms:Date.now()-Q.t0,detail:{fast:rc.fast,rapid:rc.rapid,correct:ok,minSec:minSeconds(it)}});
      if(!pre&&!ok){ habitAdj(-15); Sound.pause(); let left=S.RUSH.PAUSE_SECONDS;
        const o=overlay(`<h2>🧑‍🚀 ${T('slow')}</h2><p>${T('slowSub')}</p><p class="code" id="cd">${left}</p>`); const iv=setInterval(()=>{left--; const c=$('#cd',o); if(c) c.textContent=left; if(left<=0){clearInterval(iv); o.remove(); Q.t0=Date.now()-minSeconds(it)*1000+2000; Q.changes=[]; } },1000);
        Q.tries++; return afterAnswer(false,true); } }
    else if(!pre) habitAdj(+3);
    Q.tries++; afterAnswer(ok,false); }
  function logAnswer(correct,extra){ act.answers++;
    ST.log(Object.assign({sid:sess.sid,name:sess.name,block:sess.block,type:'answer',mode:run.mode,ctx:run.ctx,item:it.id,n:s.n||'',correct,tries:Q.tries,hint:Q.hint,ms:Date.now()-Q.t0Orig,
      rush:Q.rush,idleMs:act.qIdle,offTab:act.qOff,lang,detail:{answer:answerText(),crText:pre&&it.kind==='cr'?Q.crText.slice(0,1500):undefined,page:s.page||null,minSec:Math.round(minSeconds(it))}},extra||{}));
    evs=ST.LS.get('cmas.ev.'+sess.sid,evs); }
  Q.t0Orig=Q.t0;
  function afterAnswer(ok,rushed){
    if(pre){ logAnswer(ok); run.i++; return step(); }
    const fb=$('#fbx');
    if(ok){ Sound.correct(); confetti(); logAnswer(true); Q.phase='code'; codeEntry(it.code.ok,`<div class="fb ok"><h3>🎉 ${T('rightTitle')}</h3><p>${T('writeCode')}</p><div class="code">${it.code.ok}</div>${whyBox()}</div>`,true); return; }
    if(Q.tries<2){ Sound.wrong(); fb.innerHTML=`<div class="fb no"><h3>${T('wrongTitle')}</h3><p>${T('wrongTry')}</p><div class="code">${it.code.no}</div>${!Q.hint?`<p class="small">💡 ${lang==='es'?'Puedes usar la pista.':'You can use the hint.'}</p>`:''}</div>`;
      Q.sel={}; setTimeout(()=>{ const keep=fb.innerHTML; render(); $('#fbx').innerHTML=keep; },rushed?S.RUSH.PAUSE_SECONDS*1000:900); return; }
    Sound.wrong(); logAnswer(false); Q.phase='code';
    codeEntry(it.code.no,`<div class="fb no"><h3>📘 ${T('explainTitle')}</h3><div class="why">${esc(tx(it.why))}</div>${videoSlot((window.VIDEOS||{})[it.id],false)}<p>${T('finalWrong')}</p><div class="code">${it.code.no}</div></div>`,false); }
  function whyBox(){ return `<div class="why small">${esc(tx(it.why))}</div>`; }
  function codeEntry(code,html,ok){ render(); const fb=$('#fbx'); fb.innerHTML=html+`<p><b>${T('enterCode')}</b></p><div class="row"><input class="codein" id="ci" autocomplete="off" aria-label="${T('enterCode')}" maxlength="12"><button class="btn ok" id="cu">🔓 ${T('unlock')}</button></div><p id="cm" class="small" role="alert"></p>`;
    const go=async()=>{ const v=$('#ci').value.trim().toUpperCase().replace(/\s+/g,''); if(v!==code.replace(/\s+/g,'')){ $('#cm').textContent=T('codeWrong'); Sound.wrong(); return; }
      ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'code',mode:run.mode,ctx:run.ctx,item:it.id,correct:ok,detail:{code}});
      if(ok){ habitAdj(+2); await Doors.play({bar:lang==='es'?'PASO COMPLETO':'MISSION STEP COMPLETE'}); } run.i++; step(); };
    $('#cu').onclick=go; $('#ci').onkeydown=e=>{ if(e.key==='Enter') go(); }; $('#ci').focus(); fb.scrollIntoView({block:'nearest'}); }
  render(); }
function videoSlot(url,before){ const label=before?`🎬 ${T('video')} — ${T('watchFirst')}`:`🎬 ${T('video')}`;
  if(!url) return `<div class="video">${label}<br><span class="small">${T('videoSoon')}</span></div>`;
  let src=url; const y=url.match(/(?:youtu\.be\/|v=)([\w-]{6,})/); if(y) src='https://www.youtube-nocookie.com/embed/'+y[1];
  const g=url.match(/drive\.google\.com\/file\/d\/([\w-]+)/); if(g) src='https://drive.google.com/file/d/'+g[1]+'/preview';
  const l=url.match(/loom\.com\/share\/(\w+)/); if(l) src='https://www.loom.com/embed/'+l[1];
  return `<div class="video">${label}<iframe src="${esc(src)}" allowfullscreen title="${T('video')}"></iframe></div>`; }
function lookBack(stim){ const st=D.STIMS[stim]; overlay(`<h2>📖 ${esc(tx(st.title))}</h2><div style="max-height:70vh;overflow:auto;text-align:left">${st.pages.map(p=>`<img src="${lang==='es'?p.es:p.en}" style="width:100%;margin-bottom:10px" alt="">`).join('')}</div><button class="btn">${T('back')}</button>`,o=>{ o.querySelector('.box').style.maxWidth='900px'; $('button',o).onclick=()=>o.remove(); }); }
function finish(){ const mode=run.mode;
  if(mode==='checkpoint'){ ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'checkpoint_done',mode,ctx:run.ctx}); evs=ST.LS.get('cmas.ev.'+sess.sid,evs);
    const sc=ST.pretestScore(evs,run.ctx); confetti(); Sound.correct();
    app.innerHTML=topbar()+`<div class="card" style="text-align:center"><h2>🏁 ${T('done')}</h2><p>${T('score')}</p><div class="code">${sc.earned} / ${sc.possible} (${sc.pct}%)</div>
      <p>${T('potential')}: <b>${sc.potential}%</b> <span class="small muted">${T('potentialSub')}</span></p>
      <p class="small">CMAS ${lang==='es'?'estimado (no oficial)':'ESTIMATE (not an official score)'}: <b>${esc(ST.band(sc.cmasPct))}</b> · ${sc.cmasPct}% ${lang==='es'?'en preguntas oficiales CMAS':'on official CMAS items'}</p>
      ${sc.weak.length?`<p>${lang==='es'?'Practica primero':'Practice first'}: ${sc.weak.map(t=>`<span class="badge">${esc(tx(D.TOPICS[t]))}</span>`).join(' ')}</p>`:''}
      <h3>🔓 ${T('unlocked')}</h3><button class="btn ok" id="go">${T('home')} →</button></div>`; wireTop(finish); $('#go').onclick=hub; endSession(); newSession(); return; }
  if(run.ctx&&run.ctx.startsWith('D')) ST.log({sid:sess.sid,name:sess.name,block:sess.block,type:'day_done',mode,ctx:run.ctx});
  evs=ST.LS.get('cmas.ev.'+sess.sid,evs); confetti();
  app.innerHTML=topbar()+`<div class="card" style="text-align:center"><h2>🌟 ${T('done')}</h2><p>${esc(run.title)}</p><div class="row" style="justify-content:center"><button class="btn ok" id="go">${T('home')} →</button><button class="btn ghost" id="md">📊 ${T('mydata')}</button></div></div>`;
  wireTop(finish); $('#go').onclick=hub; $('#md').onclick=()=>window.MyData.show(evs,sess,lang,hub); }
window.App.go=hub; window.App.startSkill=startSkill;
window.App.practiceStd=function(key){ const practiced=new Set(ST.answers(evs).filter(e=>e.mode!=='checkpoint').map(e=>e.item)); const first=ST.firstAttempts(evs);
  const pool=Object.keys(IT).filter(id=>ST.stdKeys(id).includes(key)); const sc=id=>(first[id]&&!ST.cleanFirst(first[id])?0:1)+(practiced.has(id)?2:0)+Math.random();
  const pick=pool.sort((a,b)=>sc(a)-sc(b)).slice(0,5); startRun({mode:'skill',ctx:'std:'+key,title:`${T('myStandards')}: ${key.split(':')[1]}`,steps:pick.map(id=>({type:'q',id,n:(ST.WHERE[id]||{}).n,page:(ST.WHERE[id]||{}).page}))}); };
if(sess) enter(); else home();
})();
