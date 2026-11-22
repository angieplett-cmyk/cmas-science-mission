// Data store + shared analytics. Events are APPEND-ONLY: nothing is ever edited or deleted,
// so a student's first attempt on every question stays permanent.
window.Store=(function(){
  const S=window.SETTINGS, D=window.CMAS_DATA;
  const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const online=()=>!!(S.SHEET_URL&&/^https:\/\/script\.google(usercontent)?\.com\//.test(S.SHEET_URL));
  function evKey(sid){return 'cmas.ev.'+sid;}
  function localEvents(sid){return LS.get(evKey(sid),[]);}
  function allLocal(){const out=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('cmas.ev.'))out.push(...LS.get(k,[]));}return out;}
  function merge(a,b){const m=new Map();[...a,...b].forEach(e=>{if(e&&e.eventId&&!m.has(e.eventId))m.set(e.eventId,e);});return [...m.values()].sort((x,y)=>String(x.ts).localeCompare(String(y.ts)));}
  function log(ev){ ev.eventId=ev.eventId||uid(); ev.ts=ev.ts||new Date().toISOString();
    const arr=localEvents(ev.sid); arr.push(ev); LS.set(evKey(ev.sid),arr);
    if(online()){const q=LS.get('cmas.queue',[]); q.push(ev); LS.set('cmas.queue',q); flush();}
    return ev; }
  let flushing=false;
  async function flush(){ if(!online()||flushing) return; const q=LS.get('cmas.queue',[]); if(!q.length) return; flushing=true;
    const batch=q.slice(0,100);
    try{ const r=await fetch(S.SHEET_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'log',events:batch})});
      const j=await r.json(); if(j.ok){ const rest=LS.get('cmas.queue',[]).filter(e=>!batch.some(b=>b.eventId===e.eventId)); LS.set('cmas.queue',rest); }
    }catch(e){ /* stay queued; retry later */ }
    flushing=false; if(LS.get('cmas.queue',[]).length && navigator.onLine) setTimeout(flush,5000); }
  setInterval(flush,20000); window.addEventListener('online',flush);
  async function loadStudent(sid){ let evs=localEvents(sid);
    if(online()){ try{ const r=await fetch(S.SHEET_URL+'?action=student&stu='+encodeURIComponent(sid)); const j=await r.json(); if(j.ok){ evs=merge(evs,j.events.map(fixEv)); LS.set(evKey(sid),evs);} }catch(e){} }
    return evs; }
  function fixEv(e){ e.n=e.n===''?undefined:e.n; ['ms','tries','idleMs','offTab'].forEach(k=>{if(e[k]!==''&&e[k]!=null)e[k]=Number(e[k]);}); if(e.ts instanceof Date) e.ts=e.ts.toISOString(); return e; }
  async function loadAll(pin){ let evs=allLocal(); let source='this Chromebook only';
    if(online()){ try{ const r=await fetch(S.SHEET_URL+'?action=all&pin='+encodeURIComponent(pin)); const j=await r.json(); if(j.ok){evs=merge(evs,j.events.map(fixEv)); source='shared Google Sheet';} else if(j.error==='pin') source='PIN rejected by the Google Sheet (showing this Chromebook only)'; }catch(e){ source='Google Sheet unreachable (showing this Chromebook only)'; } }
    return {events:evs,source}; }
  async function sendLive(status){ LS.set('cmas.live.'+status.sid,Object.assign({seen:new Date().toISOString()},status));
    if(!online()) return; try{ await fetch(S.SHEET_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'live',status})}); }catch(e){} }
  async function loadLive(pin){ const local={}; for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i); if(k&&k.startsWith('cmas.live.')){const v=LS.get(k,null); if(v) local[v.sid]=v;}}
    if(online()){ try{ const r=await fetch(S.SHEET_URL+'?action=live&pin='+encodeURIComponent(pin)); const j=await r.json(); if(j.ok) return Object.assign(local,j.live); }catch(e){} }
    return local; }

  // ---------- analytics ----------
  const IT=D.ITEMS;
  // Teacher "Reset test" (type cp_reset) voids that checkpoint's earlier answers (for test accounts / invalid sittings).
  function resets(evs){ const r={}; evs.forEach(e=>{ if(e.type==='cp_reset'&&e.ctx&&(!r[e.ctx]||e.ts>r[e.ctx])) r[e.ctx]=e.ts; }); return r; }
  const answers=evs=>{ const r=resets(evs); return evs.filter(e=>e.type==='answer'&&IT[e.item]&&!(e.mode==='checkpoint'&&r[e.ctx]&&String(e.ts)<=String(r[e.ctx]))); };
  function firstAttempts(evs){const m={};answers(evs).forEach(e=>{if(!m[e.item])m[e.item]=e;});return m;}
  function latestAttempts(evs){const m={};answers(evs).forEach(e=>{m[e.item]=e;});return m;}
  const cleanFirst=e=>!!(e&&e.correct&&Number(e.tries)===1&&!e.hint);
  function topicsOf(id){const it=IT[id];return [it.topic,...(it.skills||[])];}
  function mastery(evs){ const M=S.MASTERY, out={};
    Object.keys(D.TOPICS).forEach(t=>out[t]={score:0,n:0,right:0,level:'n'});
    answers(evs).forEach(e=>topicsOf(e.item).forEach(t=>{ const o=out[t]; if(!o) return; o.n++;
      const delta=cleanFirst(e)?M.FIRST_TRY:(e.correct?M.WITH_HELP:M.MISS); if(e.correct) o.right++;
      o.score=Math.max(0,Math.min(100,o.score+delta)); }));
    Object.values(out).forEach(o=>{o.level=o.n===0?'n':(o.score>=M.MASTERED?'m':o.score>=M.PROFICIENT?'p':'pr');});
    return out; }
  function reviewList(evs){ const first=firstAttempts(evs), out=[];
    Object.values(first).forEach(f=>{ if(cleanFirst(f)) return; if(IT[f.item].src==='strategy'&&f.correct) return;
      const fixed=answers(evs).some(e=>e.item===f.item&&e.eventId!==f.eventId&&e.mode!=='checkpoint'&&cleanFirst(e));
      out.push({item:f.item,first:f,fixed}); });
    return out; }
  function pretestItems(){ const ids=[]; window.NUMBERING.days.forEach(d=>d.steps.forEach(s=>{if(s.type==='q')ids.push(s.id);}));
    if(S.PRETEST_INCLUDE_MAP) window.NUMBERING.map.forEach(m=>m.steps.forEach(s=>ids.push(s.id)));
    return ids; }
  function pretestState(evs,cp){ cp=cp||'pre'; const pre=answers(evs).filter(e=>e.mode==='checkpoint'&&e.ctx===cp); const done=new Set(pre.map(e=>e.item));
    const mine=evs.filter(e=>e.ctx===cp&&['checkpoint_done','cp_reset','cp_reopen','pause','teacher_pause','resume'].includes(e.type)).sort((a,b)=>String(a.ts).localeCompare(String(b.ts)));
    let finished=false, paused=null;
    mine.forEach(e=>{ if(e.type==='checkpoint_done'){finished=true; paused=null;} else if(e.type==='cp_reset'||e.type==='cp_reopen'){finished=false; paused=null;} else if(e.type==='pause'||e.type==='teacher_pause') paused=e; else if(e.type==='resume') paused=null; });
    if(finished) paused=null;
    return {done,finished,events:pre,paused,partial:!finished&&done.size>0}; }
  // Latest unresolved pause for a non-checkpoint mission (practice / review / skill / MAP)
  function openPause(evs){ let last=null; evs.forEach(e=>{ if(e.type==='pause'&&e.mode!=='checkpoint') last=e; else if(last&&(e.type==='resume'||e.type==='day_done')&&e.ctx===last.ctx) last=null; }); return last; }
  function points(id){return IT[id].kind==='cr'?2:1;}
  function pretestScore(evs,cpId){ const st=pretestState(evs,cpId); let earned=0,possible=0,ce=0,cp=0; const byTopic={};
    st.events.forEach(e=>{ const p=points(e.item); possible+=p; if(e.correct) earned+=p; if(IT[e.item].src==='cmas'){cp+=p; if(e.correct) ce+=p;}
      const t=IT[e.item].topic; byTopic[t]=byTopic[t]||{e:0,p:0,miss:[]}; byTopic[t].p+=p; if(e.correct) byTopic[t].e+=p; else byTopic[t].miss.push(e.item); });
    const weak=Object.entries(byTopic).filter(([t,v])=>v.miss.length).sort((a,b)=>(b[1].p-b[1].e)-(a[1].p-a[1].e)).slice(0,3);
    const gain=weak.reduce((s,[t,v])=>s+(v.p-v.e),0);
    return {earned,possible,pct:possible?Math.round(100*earned/possible):0,cmasEarned:ce,cmasPossible:cp,cmasPct:cp?Math.round(100*ce/cp):0,
      potential:possible?Math.round(100*Math.min(possible,earned+gain)/possible):0,weak:weak.map(w=>w[0]),byTopic}; }
  function dayKey(ts){ const d=new Date(ts); return d.toLocaleDateString('en-CA'); }
  function usage(evs){ const m={}; evs.forEach(e=>{ if((e.type==='answer'||e.type==='read')&&e.ms){ const k=dayKey(e.ts); m[k]=(m[k]||0)+Math.min(Number(e.ms)||0,10*60000);} }); return m; }
  // Where each item lives (Day / workbook page / slide)
  const WHERE={}; window.NUMBERING.days.forEach(d=>d.steps.forEach(s=>{ if(s.type==='q'||s.type==='strategy') WHERE[s.id]={day:d.day,n:s.n,page:s.page||null}; }));
  window.NUMBERING.map.forEach(m=>m.steps.forEach(s=>WHERE[s.id]={map:m.set,n:s.n}));
  const STRAT_FOR={data_reading:['T2','T11','T7','T19'],written_answers:['T9','T13','T15'],star_brightness:['T2','T17'],shadows_rotation:['T2','T10'],mass_conserved:['T10','T2'],test_strategies:['T12','T20']};
  function suggestions(evs){ const ms=mastery(evs); const first=firstAttempts(evs);
    const weak=Object.entries(ms).filter(([t,o])=>o.n>0&&o.level!=='m'&&t!=='test_strategies').sort((a,b)=>a[1].score-b[1].score).slice(0,3);
    const out=[]; const rv=reviewList(evs).filter(r=>!r.fixed); if(rv.length) out.push({type:'review',count:rv.length});
    weak.forEach(([t,o])=>{ const items=Object.keys(IT).filter(id=>topicsOf(id).includes(t)&&IT[id].src!=='strategy');
      const missed=items.filter(id=>first[id]&&!cleanFirst(first[id]));
      const days=[...new Set(missed.map(id=>WHERE[id]&&WHERE[id].day).filter(Boolean))];
      const pages=missed.map(id=>WHERE[id]&&WHERE[id].page?`#${WHERE[id].n} p.${WHERE[id].page}`:null).filter(Boolean);
      const kinds=new Set(missed.map(id=>IT[id].kind)); let strat=(STRAT_FOR[t]||[]).slice();
      if(kinds.has('cr')) strat.push('T9','T15'); if(kinds.has('ms')) strat.push('T4'); if(kinds.has('inline')) strat.push('T5','T14'); if(!strat.length) strat=['T12','T3'];
      out.push({type:'skill',topic:t,score:o.score,level:o.level,days,pages,strat:[...new Set(strat)].slice(0,3),missed}); });
    return out; }
  function band(pct){ let b=S.CMAS_BANDS[0].label; S.CMAS_BANDS.forEach(x=>{if(pct>=x.min)b=x.label;}); return b; }
  // Teacher config (checkpoint dates): Script Property via Apps Script, else this device.
  async function getConfig(){ let c=LS.get('cmas.config',null);
    if(online()){ try{ const r=await fetch(S.SHEET_URL+'?action=config'); const j=await r.json(); if(j.ok&&j.config){c=j.config; LS.set('cmas.config',c);} }catch(e){} }
    c=c||{checkpoints:S.CHECKPOINTS}; applySettings(c); return c; }
  // Teacher-adjusted thresholds (Settings tab) override config/settings.js defaults.
  function applySettings(c){ const o=(c&&c.settings)||{}; Object.keys(o).forEach(k=>{ if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k])) S[k]=Object.assign({},S[k],o[k]); else S[k]=o[k]; }); }
  async function setConfig(cfg,pin){ LS.set('cmas.config',cfg); if(!online()) return true;
    try{ const r=await fetch(S.SHEET_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'config',pin,config:cfg})}); const j=await r.json(); return j.ok; }catch(e){ return false; } }
  // ---------- roster (lives in the shared store; config/roster.js is only the starting list) ----------
  const BLOCKS=[{block:1,teacher:'Plett'},{block:2,teacher:'Sedinger'},{block:3,teacher:'Nelson'},{block:4,teacher:'Stonebraker'}];
  function seedRoster(){ const out=[]; (window.ROSTER||[]).forEach(b=>b.students.forEach(st=>out.push({id:st.id,name:st.name,block:b.block,archived:false,added:'seed',pretestFirst:true}))); return out; }
  async function getRoster(pin){ let list=LS.get('cmas.roster',null), source='this Chromebook';
    if(online()){ try{ const r=await fetch(S.SHEET_URL+'?action=roster'+(pin?'&pin='+encodeURIComponent(pin):'')); const j=await r.json();
      if(j.ok&&!j.empty){ list=j.students; source='shared Google Sheet'; if(!pin){ const loc=LS.get('cmas.roster',[])||[]; list=list.map(s=>Object.assign({},loc.find(x=>x.id===s.id)||{},s)); } LS.set('cmas.roster',list);} }catch(e){} }
    if(!list){ list=seedRoster(); source='starting list (config/roster.js)'; }
    return {students:list,source}; }
  async function saveRoster(list,pin){ LS.set('cmas.roster',list); if(!online()) return {ok:true,local:true};
    try{ const r=await fetch(S.SHEET_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'roster',pin,students:list})}); return await r.json(); }catch(e){ return {ok:false,error:'offline'}; } }
  function rosterBlocks(list){ return BLOCKS.map(b=>({block:b.block,teacher:b.teacher,label:`Block ${b.block} ${b.teacher}`,
    students:list.filter(s=>Number(s.block)===b.block&&!s.archived).sort((a,c)=>a.name.localeCompare(c.name))})); }
  function slug(name,block,list){ const base=`B${block}-`+name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    let id=base,i=2; while(list.some(s=>s.id===id)) id=base+'-'+(i++); return id; }

  // ---------- standards mastery (PE, SEP, CCC); each answer counts toward every standard on the item ----------
  function stdKeys(id){ const t=(IT[id]&&IT[id].std)||{}; const k=[]; if(t.pe) k.push('PE:'+t.pe); if(t.sep) k.push('SEP:'+t.sep); if(t.ccc) k.push('CCC:'+t.ccc); return k; }
  function stdMastery(evs){ const M=S.MASTERY, out={}, C=D.STANDARDS;
    Object.keys(C.PE).forEach(k=>{ if(C.PE[k].grade5) out['PE:'+k]={score:0,n:0,right:0}; });
    Object.keys(C.SEP).forEach(k=>out['SEP:'+k]={score:0,n:0,right:0}); Object.keys(C.CCC).forEach(k=>out['CCC:'+k]={score:0,n:0,right:0});
    answers(evs).forEach(e=>stdKeys(e.item).forEach(k=>{ const o=out[k]||(out[k]={score:0,n:0,right:0}); o.n++; if(e.correct) o.right++;
      o.score=Math.max(0,Math.min(100,o.score+(cleanFirst(e)?M.FIRST_TRY:e.correct?M.WITH_HELP:M.MISS))); }));
    Object.values(out).forEach(o=>{ o.group=o.score>=M.PROFICIENT?'got':(o.n>0&&o.score>=S.STD_GETTING_THERE)?'getting':'notyet'; o.level=o.n===0?'n':(o.score>=M.MASTERED?'m':o.score>=M.PROFICIENT?'p':'pr'); });
    return out; }
  return {openPause,resets,applySettings,getRoster,saveRoster,rosterBlocks,seedRoster,slug,BLOCKS,stdKeys,stdMastery,band,getConfig,setConfig,LS,log,flush,loadStudent,loadAll,sendLive,loadLive,online,firstAttempts,latestAttempts,cleanFirst,mastery,reviewList,pretestItems,pretestState,pretestScore,usage,dayKey,suggestions,WHERE,topicsOf,answers,points,uid,merge};
})();
