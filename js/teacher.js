// Teacher dashboard (core): PIN gate, data load, analytics, Overview, Live, Questions, Standards & Topics, Students, Pace & Flags.
(function(){
const S=window.SETTINGS, D=window.CMAS_DATA, ST=window.Store, IT=D.ITEMS, $=(s,r)=>(r||document).querySelector(s), app=$('#app');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=(a,b)=>b?Math.round(100*a/b):0, med=a=>{ if(!a.length) return 0; const s=[...a].sort((x,y)=>x-y), m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; };
const sec=ms=>ms==null?'—':(ms<60000?Math.round(ms/1000)+'s':(ms/60000).toFixed(1)+'m');
const C={pin:null,evs:[],source:'',roster:[],cfg:{},block:'all',tab:'overview',showArchived:false};
window.TD=C; C.esc=esc; C.pct=pct; C.med=med; C.sec=sec;

// ---------- PIN ----------
function gate(msg){ app.innerHTML=`<div class="top"><div class="brand">🧑‍🚀 Teacher Dashboard</div><div class="sp"></div><a class="pill" href="index.html">Student site</a></div>
  <div class="card" style="max-width:460px;margin:8vh auto;text-align:center"><h2>🔐 Teacher PIN</h2>
  <form id="pf"><input id="pin" type="password" inputmode="numeric" autocomplete="off" class="codein" aria-label="Teacher PIN" style="width:220px"><br><br><button class="btn ok">Open dashboard</button></form>
  <p class="small" role="alert" style="color:#b00020">${esc(msg||'')}</p>
  <p class="small muted">${ST.online()?'PIN is checked by your Google Apps Script (Script Property TEACHER_PIN).':'Offline mode (no SHEET_URL yet): data is only what is saved on this Chromebook.'}</p></div>`;
  $('#pf').onsubmit=async e=>{ e.preventDefault(); const pin=$('#pin').value.trim(); if(!pin) return;
    if(!ST.online()&&pin!==String(S.TEACHER_PIN)) return gate('That PIN does not match.');
    C.pin=pin; app.innerHTML='<p style="color:#fff;text-align:center;margin-top:20vh">Loading class data…</p>'; await load();
    if(ST.online()&&/PIN rejected/.test(C.source)){ C.pin=null; return gate('That PIN was rejected by the Google Sheet.'); }
    sessionStorage.setItem('cmas.tpin',pin); render(); }; $('#pin').focus(); }
async function load(){ const [all,ro,cfg]=await Promise.all([ST.loadAll(C.pin),ST.getRoster(C.pin),ST.getConfig()]);
  C.evs=all.events; C.source=all.source; C.roster=ro.students; C.rosterSource=ro.source;
  if(ST.online()&&/^starting/.test(ro.source)&&!/rejected|unreachable/.test(all.source)){ const r=await ST.saveRoster(ro.students,C.pin); if(r.ok) C.rosterSource='shared Google Sheet (first save from config/roster.js)'; } C.cfg=cfg; analyze(); }
C.reload=async()=>{ await load(); render(); };

// ---------- analytics ----------
function analyze(){ const by={}, tev=[];
  C.evs.forEach(e=>{ if(e.sid==='TEACHER'){ tev.push(e); return; } (by[e.sid]=by[e.sid]||[]).push(e); });
  C.by=by; C.tev=tev;
  // teacher data: latest value wins
  C.tdata={cmasGoal:{},rit:{},met:{},dismissed:new Set()};
  tev.forEach(e=>{ const d=e.detail||{}; if(d.kind==='cmasGoal') C.tdata.cmasGoal[d.sid]=d.value; if(d.kind==='rit') C.tdata.rit[`${d.sid}|${d.subject}|${d.season}`]=d.value;
    if(d.kind==='groupMet') C.tdata.met[d.key]={date:d.date,sids:d.sids||[],ts:e.ts}; if(d.kind==='dismiss') C.tdata.dismissed.add(d.flag); if(d.kind==='undismiss') C.tdata.dismissed.delete(d.flag); });
  // students: roster + anyone with data
  const ids=new Map(); C.roster.forEach(s=>ids.set(s.id,Object.assign({},s)));
  Object.keys(by).forEach(sid=>{ if(!ids.has(sid)){ const e=by[sid][0]; ids.set(sid,{id:sid,name:e.name||sid,block:Number(e.block)||0,archived:false,unrostered:true}); } });
  C.students=[...ids.values()].sort((a,b)=>a.block-b.block||a.name.localeCompare(b.name));
  C.stu={}; C.students.forEach(s=>{ const evs=by[s.id]||[]; C.stu[s.id]={s,evs,first:ST.firstAttempts(evs),latest:ST.latestAttempts(evs),mastery:ST.mastery(evs),std:ST.stdMastery(evs),usage:ST.usage(evs)}; });
  // per-item timing calibration (first attempts, class + block)
  C.cal={}; Object.keys(IT).forEach(id=>{ const all=[], blk={1:[],2:[],3:[],4:[]};
    C.students.forEach(s=>{ const f=C.stu[s.id].first[id]; if(f&&f.ms>0){ all.push(f.ms); (blk[s.block]||[]).push(f.ms);} });
    const P=S.PACE, fallback=Math.max(S.RUSH.MIN_SECONDS*1000,1000*(IT[id].words||20)/P.FALLBACK_WORDS_PER_SEC);
    const enough=all.length>=P.MIN_RESPONSES;
    const bm={}; Object.keys(blk).forEach(b=>{ bm[b]=blk[b].length>=P.MIN_RESPONSES?med(blk[b]):null; });
    C.cal[id]={median:enough?med(all):fallback,tentative:!enough,n:all.length,block:bm}; });
}
C.analyze=analyze;
C.visible=()=>C.students.filter(s=>(C.showArchived||!s.archived)&&(C.block==='all'||String(s.block)===String(C.block)));
C.ref=(id,block)=>{ const c=C.cal[id]; const b=c.block[block]; return {ms:b||c.median,tentative:c.tentative&&!b,basis:b?`Block ${block} median (${sec(b)})`:c.tentative?`reading-length estimate (${sec(c.median)}, tentative — fewer than ${S.PACE.MIN_RESPONSES} responses)`:`class median (${sec(c.median)}, ${c.n} responses)`}; };
C.where=id=>{ const w=ST.WHERE[id]||{}; return w.day?`Day ${w.day} · #${w.n}${w.page?` · p.${w.page} / slide ${w.page}`:''}`:w.map?`MAP set ${w.map} · ${w.n}`:id; };
C.label=id=>{ const w=ST.WHERE[id]||{}; return IT[id].src==='strategy'?id:(w.n?(String(w.n).startsWith('M')?w.n:'#'+w.n):id); };
C.logT=(detail)=>ST.log({sid:'TEACHER',name:'Teacher',block:'',type:'teacher',mode:'teacher',detail});
// pace + pattern flags for a student (careful wording, evidence listed)
C.flags=function(s){ const st=C.stu[s.id], out=[], P=S.PACE; const ans=ST.answers(st.evs);
  const firsts=Object.values(st.first).filter(e=>e.ms>0);
  const ratios=firsts.map(e=>e.ms/C.ref(e.item,s.block).ms); const own=ratios.length>=5?med(ratios):1;
  const fastWrong=[], slowItems=[], tentativeUsed={v:false};
  firsts.forEach(e=>{ const r=C.ref(e.item,s.block); const ratio=e.ms/r.ms; if(r.tentative) tentativeUsed.v=true;
    const fastVsOwn=ratio<own*0.5;
    if(ratio<P.FAST_RATIO&&!e.correct) fastWrong.push({e,ratio,r,fastVsOwn});
    if(ratio>P.SLOW_RATIO) slowItems.push({e,ratio,r}); });
  const days=a=>new Set(a.map(x=>ST.dayKey(x.e.ts))).size;
  if(fastWrong.length>=P.PATTERN_MIN_EVIDENCE&&days(fastWrong)>=P.PATTERN_MIN_SESSIONS)
    out.push({id:s.id+'|rush',kind:'Possible rushing',level:'f-race',tentative:fastWrong.some(x=>x.r.tentative),
      evidence:fastWrong.slice(0,8).map(x=>`${C.label(x.e.item)}: ${sec(x.e.ms)} vs ${x.r.basis} → wrong${x.fastVsOwn?' (also fast for this student)':''}`),
      note:`${fastWrong.length} fast + incorrect first tries across ${days(fastWrong)} days. Fast + correct answers are NOT counted.`});
  const rushEv=st.evs.filter(e=>e.type==='rush'&&e.detail&&e.detail.rapid);
  if(rushEv.length>=P.PATTERN_MIN_EVIDENCE) out.push({id:s.id+'|guess',kind:'Possible guessing (rapid answer changes)',level:'f-race',evidence:rushEv.slice(0,8).map(e=>`${C.label(e.item)} ${new Date(e.ts).toLocaleString()}`),note:`${rushEv.length} times the student changed answers rapidly (${S.RUSH.RAPID_CLICKS}+ changes in ${S.RUSH.RAPID_WINDOW_SEC}s).`});
  const slowWrong=slowItems.filter(x=>!x.e.correct);
  if(slowWrong.length>=P.PATTERN_MIN_EVIDENCE&&days(slowWrong)>=P.PATTERN_MIN_SESSIONS) out.push({id:s.id+'|slow',kind:'Possible reading or stamina support needed',level:'f-idle',tentative:slowWrong.some(x=>x.r.tentative),
    evidence:slowWrong.slice(0,8).map(x=>`${C.label(x.e.item)}: ${sec(x.e.ms)} vs ${x.r.basis}`),note:`Much slower than the reference (>${P.SLOW_RATIO}×) and incorrect on ${slowWrong.length} items. Could be careful work, reading load, or distraction — check in.`});
  // possible copying: needs several signals together
  const peers=C.students.filter(p=>p.id!==s.id&&p.block===s.block); const matches={};
  Object.values(st.first).forEach(e=>{ if(e.correct||!e.detail||!e.detail.answer) return;
    peers.forEach(p=>{ const f=C.stu[p.id].first[e.item]; if(f&&!f.correct&&f.detail&&f.detail.answer===e.detail.answer&&Math.abs(new Date(f.ts)-new Date(e.ts))<120000){ (matches[p.id]=matches[p.id]||[]).push({e,f}); } }); });
  Object.entries(matches).forEach(([pid,m])=>{ if(m.length<P.PATTERN_MIN_EVIDENCE) return; const fastish=m.filter(x=>x.e.ms/C.ref(x.e.item,s.block).ms<own*0.6).length;
    const signals=[`same wrong answer as ${C.stu[pid].s.name} on ${m.length} items`,'answered within 2 minutes of each other']; if(fastish) signals.push(`faster than this student's usual pace on ${fastish} of them`);
    if(signals.length>=3) out.push({id:s.id+'|copy|'+pid,kind:`Possible copying — check in (with ${C.stu[pid].s.name})`,level:'f-none',evidence:m.slice(0,6).map(x=>`${C.label(x.e.item)}: both chose "${x.e.detail.answer}"`),note:'Several signals together: '+signals.join('; ')+'. Could also be sitting together, a shared misconception, or coincidence — please verify before acting.'}); });
  // no activity / not working
  if(!st.evs.length) out.push({id:s.id+'|none',kind:'No activity yet',level:'f-none',evidence:['No saved work on any device or in the shared store.'],note:''});
  else { const sess=st.evs.filter(e=>e.type==='session'); const empty=sess.filter(e=>Number(e.ms)>P.NO_PROGRESS_MINUTES*60000&&!(e.detail&&e.detail.answers));
    if(empty.length) out.push({id:s.id+'|noprog',kind:'Not working: logged in with no progress',level:'f-none',evidence:empty.slice(0,6).map(e=>`${new Date(e.ts).toLocaleString()}: ${sec(e.ms)} signed in, 0 answers, idle ${sec(e.idleMs)}, off-tab ${e.offTab||0}×`),note:''});
    const last=ans.length?new Date(ans[ans.length-1].ts):null; if(last&&Date.now()-last>5*86400000) out.push({id:s.id+'|stale',kind:'No answers in 5+ school days',level:'f-off',evidence:[`Last answer ${last.toLocaleDateString()}`],note:''}); }
  // stuck
  const stuck=Object.entries(st.mastery).filter(([t,o])=>o.n>=4&&o.score<30).map(([t])=>D.TOPICS[t].en);
  if(stuck.length) out.push({id:s.id+'|stuck',kind:'Stuck on a skill',level:'f-idle',evidence:stuck.map(t=>`${t}: 4+ tries, mastery under 30`),note:''});
  return out.map(f=>Object.assign(f,{dismissed:C.tdata.dismissed.has(f.id),tentativeAny:tentativeUsed.v})); };
C.sessions=s=>{ const ev=C.stu[s.id].evs.filter(e=>e.type==='session'); return {count:ev.length,idleMs:ev.reduce((a,e)=>a+(Number(e.idleMs)||0),0),offTab:ev.reduce((a,e)=>a+(Number(e.offTab)||0),0),ms:ev.reduce((a,e)=>a+(Number(e.ms)||0),0)}; };
C.cpScore=(s,cp)=>{ const st=ST.pretestState(C.stu[s.id].evs,cp); return st.done.size?Object.assign({finished:st.finished,answered:st.done.size},ST.pretestScore(C.stu[s.id].evs,cp)):null; };

// ---------- layout ----------
const TABS=[['overview','Overview'],['live','Live View'],['growth','Checkpoints & Growth'],['questions','Questions'],['standards','Standards & Topics'],['students','Students'],['groups','Groups'],['flags','Pace & Flags'],['rit','MAP RIT & Goals'],['roster','Roster'],['settings','Settings'],['codes','Code Key'],['export','CSV Export']];
function render(){ if(C.liveTimer){ clearInterval(C.liveTimer); C.liveTimer=null; }
  app.innerHTML=`<div class="top"><div class="brand">🧑‍🚀 Teacher Dashboard</div><div class="sp"></div>
   <label class="pill">Block <select id="blk" aria-label="Filter by block"><option value="all">All blocks</option>${ST.BLOCKS.map(b=>`<option value="${b.block}" ${String(C.block)===String(b.block)?'selected':''}>Block ${b.block} ${b.teacher}</option>`).join('')}</select></label>
   <button class="pill" id="rl">⟳ Refresh</button><button class="pill" id="pr">🖨️ Print</button><a class="pill" href="index.html">Student site</a><button class="pill" id="lo">Lock</button></div>
   <div class="card" style="padding:10px 14px"><div class="small">Data: <b>${esc(C.source)}</b> · ${C.evs.length} events · Roster: ${esc(C.rosterSource)}${String(S.TEACHER_PIN)==='0000'&&!ST.online()?' · <b style="color:#b00020">Placeholder PIN 0000 — change it (see README).</b>':''}</div>
   <div class="tabs" role="tablist">${TABS.map(([k,l])=>`<button role="tab" aria-selected="${C.tab===k}" data-tab="${k}">${l}</button>`).join('')}</div></div><div id="pane"></div>`;
  $('#blk').onchange=e=>{C.block=e.target.value; render();}; $('#rl').onclick=C.reload; $('#pr').onclick=()=>print(); $('#lo').onclick=()=>{ sessionStorage.removeItem('cmas.tpin'); C.pin=null; gate(); };
  app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{C.tab=b.dataset.tab; render();});
  const pane=$('#pane'); const fn=VIEWS[C.tab]||(window.TExtra||{})[C.tab]; fn?fn(pane,C):pane.innerHTML='<div class="card">Coming soon</div>'; }
C.render=render;
const card=(h,cls)=>`<div class="card ${cls||''}">${h}</div>`; C.card=card;
C.bar=(v,cls)=>`<div class="bar ${cls||''}" style="min-width:80px"><i style="width:${v}%"></i></div>`;
C.table=(head,rows,id)=>`<div style="overflow:auto;max-height:70vh"><table class="t" ${id?`id="${id}"`:''}><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;

// ---------- views ----------
const VIEWS={};
VIEWS.overview=(p)=>{ const vs=C.visible(); const today=new Date().toLocaleDateString('en-CA');
  const preDone=vs.filter(s=>(C.cpScore(s,'pre')||{}).finished).length, active=vs.filter(s=>C.stu[s.id].evs.length).length;
  const todayMin=vs.map(s=>(C.stu[s.id].usage[today]||0)/60000); const met=todayMin.filter(m=>m>=S.DAILY_GOAL_MINUTES).length;
  const items=itemStats(vs); const most=items.filter(x=>x.n>=1&&IT[x.id].src!=='strategy').sort((a,b)=>a.firstPct-b.firstPct).slice(0,8);
  const flags=vs.flatMap(s=>C.flags(s).filter(f=>!f.dismissed&&f.kind!=='No activity yet'));
  p.innerHTML=`<div class="grid g4 stats">${[[vs.length,'students'],[active,'have started'],[`${preDone}/${vs.length}`,'finished Launch Check'],[`${met}`,`met ${S.DAILY_GOAL_MINUTES}-min goal today`]].map(([b,l])=>`<div class="stat"><b>${b}</b><span>${l}</span></div>`).join('')}</div>`+
   card(`<h3>🔥 Most-missed questions (first try)</h3>${C.table(['Question','Where','Source','Topic','Standard','First-try right','Latest right','Avg time'],most.map(x=>`<tr class="hot"><td><b>${C.label(x.id)}</b> ${x.id}</td><td>${C.where(x.id)}</td><td>${IT[x.id].src}</td><td>${D.TOPICS[IT[x.id].topic].en}</td><td>${IT[x.id].std.pe||'—'}</td><td>${x.firstPct}% (${x.n})</td><td>${x.latestPct}%</td><td>${sec(x.avg)}</td></tr>`))}`)+
   card(`<h3>🚩 Flags needing a look (${flags.length})</h3>${flags.slice(0,10).map(f=>`<span class="flag ${f.level}">${esc(f.kind)} · ${esc(C.stu[f.id.split('|')[0]].s.name)}</span>`).join(' ')||'None right now.'} <p class="small muted">Details and evidence: Pace & Flags tab.</p>`)+
   card(`<h3>🧭 Suggested next steps by block</h3>${blockSuggestions()}`); };
function itemStats(vs){ return Object.keys(IT).map(id=>{ let n=0,fr=0,lr=0,ms=[]; vs.forEach(s=>{ const f=C.stu[s.id].first[id], l=C.stu[s.id].latest[id]; if(f){ n++; if(f.correct) fr++; if(l.correct) lr++; if(f.ms) ms.push(Number(f.ms)); } });
  return {id,n,firstPct:pct(fr,n),latestPct:pct(lr,n),avg:ms.length?ms.reduce((a,b)=>a+b,0)/ms.length:null,median:med(ms),missed:n-fr}; }); }
C.itemStats=itemStats;
function blockSuggestions(){ return ST.BLOCKS.filter(b=>C.block==='all'||String(C.block)===String(b.block)).map(b=>{ const vs=C.students.filter(s=>s.block===b.block&&!s.archived);
  const t={}; vs.forEach(s=>Object.entries(C.stu[s.id].mastery).forEach(([k,o])=>{ if(o.n&&k!=='test_strategies'){ t[k]=t[k]||{sum:0,n:0,low:[]}; t[k].sum+=o.score; t[k].n++; if(o.score<S.MASTERY.PROFICIENT) t[k].low.push(s.name);} }));
  const weak=Object.entries(t).sort((a,c)=>a[1].sum/a[1].n-c[1].sum/c[1].n).slice(0,3);
  return `<p><b>Block ${b.block} ${b.teacher}:</b> ${weak.map(([k,v])=>`${D.TOPICS[k].en} (avg ${Math.round(v.sum/v.n)}; ${v.low.length} below proficient → ${daysFor(k)})`).join(' · ')||'no data yet'}</p>`; }).join(''); }
function daysFor(topic){ const ds=new Set(); Object.keys(IT).forEach(id=>{ if(ST.topicsOf(id).includes(topic)&&ST.WHERE[id]&&ST.WHERE[id].day) ds.add(ST.WHERE[id].day); }); return ds.size?'Days '+[...ds].sort((a,b)=>a-b).join(', '):'skill path'; }
C.daysFor=daysFor;
VIEWS.live=(p)=>{ const draw=async()=>{ const live=await ST.loadLive(C.pin); const vs=C.visible(); const now=Date.now();
    const rows=vs.map(s=>{ const L=live[s.id]; const age=L?(now-new Date(L.seen))/1000:1e9; let flag;
      if(!L||age>Math.max(60,S.LIVE_REFRESH_SECONDS*4)) flag='<span class="flag f-none">Not signed in</span>';
      else if(L.status==='off') flag=`<span class="flag f-off">Off tab ${L.offSec||0}s</span>`; else if(L.status==='idle') flag=`<span class="flag f-idle">Idle ${L.idleSec}s</span>`;
      else if(L.status==='racing') flag='<span class="flag f-race">Racing</span>'; else flag='<span class="flag f-work">Working</span>';
      if(L&&age<=60&&L.sessionMin>=S.PACE.NO_PROGRESS_MINUTES&&!L.answers) flag+=' <span class="flag f-none">No progress</span>';
      return `<tr><td>${esc(s.name)}</td><td>${s.block}</td><td>${flag}</td><td>${L&&age<=60?esc((L.current&&L.current.label)||L.mode||'—'):'—'}</td><td>${L&&age<=60?L.qSec+'s':'—'}</td><td>${L&&age<=60?esc(L.mode||''):''}</td><td>${L&&age<=60?L.answers:''}</td><td>${L&&age<=60?L.offTabCount:''}</td><td class="small">${L?new Date(L.seen).toLocaleTimeString():''}</td></tr>`; });
    p.innerHTML=card(`<h3>📡 Live View <span class="small muted">refreshes every ${S.LIVE_REFRESH_SECONDS}s · teacher only · students never see these flags</span></h3>
      ${C.table(['Student','Block','Status','Current question','Time on question','Mode','Answers this session','Off-tab this session','Last ping'],rows)}`); };
  draw(); C.liveTimer=setInterval(draw,S.LIVE_REFRESH_SECONDS*1000); };
VIEWS.questions=(p)=>{ const vs=C.visible(); const st=itemStats(vs); const order=Object.keys(IT); const ranked=st.filter(x=>x.n&&IT[x.id].src!=='strategy').sort((a,b)=>a.firstPct-b.firstPct); const worst=new Set(ranked.slice(0,8).map(x=>x.id));
  p.innerHTML=card(`<h3>❓ By question <span class="small muted">red = 8 most-missed on first try · times are first attempts</span></h3>${C.table(['#','Item','Where','Source','Category','Topic','PE','SEP','CCC','Answered','First-try right','Latest right','Avg','Median','Ref. time'],
    st.map(x=>{ const it=IT[x.id], c=C.cal[x.id]; return `<tr class="${worst.has(x.id)?'hot':''}"><td><b>${C.label(x.id)}</b></td><td>${x.id}</td><td>${C.where(x.id)}</td><td>${it.src}</td><td>${D.CATS[it.cat].en}</td><td>${D.TOPICS[it.topic].en}</td><td>${it.std.pe||'—'}${it.std.sure?'':' <span title="see report: alignment note" class="small">*</span>'}</td><td class="small">${esc(it.std.sep||'—')}</td><td class="small">${esc(it.std.ccc||'—')}</td><td>${x.n}</td><td>${x.n?x.firstPct+'%':'—'} ${x.n?C.bar(x.firstPct):''}</td><td>${x.n?x.latestPct+'%':'—'}</td><td>${sec(x.avg)}</td><td>${x.n?sec(x.median):'—'}</td><td class="small">${sec(c.median)}${c.tentative?' (tentative)':''}</td></tr>`; }))}
    <p class="small muted">* NWEA sample items carry NWEA's own published alignment, some of which are Grade 4 or K PEs; M5 is our best-fit tag.</p>`); };
VIEWS.standards=(p)=>{ const vs=C.visible(); const blocks=ST.BLOCKS.filter(b=>C.block==='all'||String(C.block)===String(b.block));
  const grp=(list,key)=>{ const g={got:0,getting:0,notyet:0}; let sum=0,n=0; list.forEach(s=>{ const o=C.stu[s.id].std[key]; if(!o) return; g[o.group]++; if(o.n){sum+=o.score;n++;} }); return {g,avg:n?Math.round(sum/n):null}; };
  const keys=Object.keys(ST.stdMastery([])); const cell=r=>r.avg==null?'—':`${r.avg} ${C.bar(r.avg,r.avg>=S.MASTERY.PROFICIENT?'gold':'')}<span class="small">✅${r.g.got} 🚀${r.g.getting} 🌱${r.g.notyet}</span>`;
  const rows=keys.map(k=>{ const [kind,code]=[k.split(':')[0],k.slice(k.indexOf(':')+1)]; const meta=D.STANDARDS[kind][code]||{};
    return `<tr><td><b>${esc(kind==='PE'?code:kind)}</b>${kind!=='PE'?`<br><span class="small">${esc(code)}</span>`:''}</td><td class="small">${esc(kind==='PE'?meta.official:meta.kid.en)}</td><td>${cell(grp(vs,k))}</td>${blocks.map(b=>`<td>${cell(grp(vs.filter(s=>s.block===b.block),k))}</td>`).join('')}</tr>`; });
  // first vs latest by category / topic / SEP per block
  const fl=(list,pred)=>{ let n=0,f=0,l=0; list.forEach(s=>{ const st=C.stu[s.id]; Object.keys(st.first).forEach(id=>{ if(!pred(id)) return; n++; if(st.first[id].correct) f++; if(st.latest[id].correct) l++; }); }); return n?`${pct(f,n)}% → <b>${pct(l,n)}%</b> <span class="small">(${n})</span>`:'—'; };
  const dims=[...Object.keys(D.CATS).map(c=>['Category',D.CATS[c].en,id=>IT[id].cat===c]),...Object.keys(D.TOPICS).map(t=>['Topic',D.TOPICS[t].en,id=>ST.topicsOf(id).includes(t)]),
    ...Object.keys(D.STANDARDS.SEP).map(k=>['Practice (SEP)',k,id=>IT[id].std.sep===k])];
  p.innerHTML=card(`<h3>🎯 Standards mastery <span class="small muted">avg mastery (0–100) · ✅ got it / 🚀 getting there / 🌱 not yet (not started counts as not yet)</span></h3>${C.table(['Standard','Statement','Class',...blocks.map(b=>'Block '+b.block)],rows)}`)+
    card(`<h3>📚 First try → latest by category, topic, and practice</h3>${C.table(['Type','Name','Class',...blocks.map(b=>'Block '+b.block)],dims.map(([t,n,pred])=>`<tr><td>${t}</td><td>${esc(n)}</td><td>${fl(vs,pred)}</td>${blocks.map(b=>`<td>${fl(vs.filter(s=>s.block===b.block),pred)}</td>`).join('')}</tr>`))}`)+
    card(`<h3>🧑‍🤝‍🧑 Standard-based groups</h3><p class="small muted">Students in 🌱 Not yet or 🚀 Getting there per Grade 5 PE (students with no answers on that standard are listed separately).</p>${keys.filter(k=>k.startsWith('PE:')).map(k=>{ const code=k.slice(3);
      const ny=vs.filter(s=>C.stu[s.id].std[k].group==='notyet'&&C.stu[s.id].std[k].n), gt=vs.filter(s=>C.stu[s.id].std[k].group==='getting'), ns=vs.filter(s=>!C.stu[s.id].std[k].n);
      return `<div class="grp"><b>${code}</b> — ${esc(D.STANDARDS.PE[code].kid.en)}<br>🌱 Not yet (${ny.length}): ${ny.map(s=>esc(s.name)).join(', ')||'—'}<br>🚀 Getting there (${gt.length}): ${gt.map(s=>esc(s.name)).join(', ')||'—'}<br><span class="small muted">Not started (${ns.length})</span></div>`; }).join('')}`); };
VIEWS.students=(p)=>{ const vs=C.visible(); const today=new Date().toLocaleDateString('en-CA');
  const rows=vs.map(s=>{ const st=C.stu[s.id], ids=Object.keys(st.first).filter(id=>IT[id].src!=='strategy'); const f=ids.filter(id=>st.first[id].correct).length, l=ids.filter(id=>st.latest[id].correct).length;
    const ms=Object.values(st.first).map(e=>Number(e.ms)||0).filter(Boolean); const ses=C.sessions(s); const days=Object.values(st.usage); const avgDay=days.length?days.reduce((a,b)=>a+b,0)/days.length/60000:0;
    const mastered=Object.values(st.mastery).filter(o=>o.level==='m').length, prof=Object.values(st.mastery).filter(o=>o.level==='p').length;
    const stdGot=Object.entries(st.std).filter(([k,o])=>k.startsWith('PE:')&&o.group==='got').length; const pre=C.cpScore(s,'pre');
    const fl=C.flags(s).filter(x=>!x.dismissed); const rushN=st.evs.filter(e=>e.type==='rush').length;
    const rushTopics=[...new Set(st.evs.filter(e=>e.type==='rush'&&IT[e.item]).map(e=>D.TOPICS[IT[e.item].topic].en))].slice(0,3).join(', ');
    return `<tr><td><button class="linkbtn" data-sid="${s.id}">${esc(s.name)}</button>${s.archived?' <span class="small">(archived)</span>':''}</td><td>${s.block}</td><td>${pre?`${pre.pct}%${pre.finished?'':' (in progress)'}`:'—'}</td><td>${ids.length}</td><td>${pct(f,ids.length)}%</td><td>${pct(l,ids.length)}%</td><td>+${pct(l,ids.length)-pct(f,ids.length)}</td>
      <td>${sec(ms.length?ms.reduce((a,b)=>a+b,0)/ms.length:null)}</td><td>${rushN}${rushTopics?`<br><span class="small">${esc(rushTopics)}</span>`:''}</td><td>${sec(ses.idleMs)}</td><td>${ses.offTab}</td>
      <td>${Math.round((st.usage[today]||0)/60000)} / ${S.DAILY_GOAL_MINUTES}</td><td>${avgDay.toFixed(0)}</td><td>${mastered} mastered · ${prof} prof.</td><td>${stdGot}/13</td><td>${fl.map(x=>`<span class="flag ${x.level}">${esc(x.kind)}</span>`).join('')}</td></tr>`; });
  p.innerHTML=card(`<h3>👩‍🚀 Students <span class="small muted">click a name for details, suggestions, and standards</span></h3>${C.table(['Student','Blk','Launch Check','Answered','First-try','Latest','Growth','Avg time/q','Rush pauses (topics)','Idle total','Off-tab','Min today / goal','Avg min/day','Skills','PEs got it','Flags'],rows)}`)+'<div id="detail"></div>';
  p.querySelectorAll('[data-sid]').forEach(b=>b.onclick=()=>studentDetail($('#detail'),C.stu[b.dataset.sid].s)); };
function studentDetail(el,s){ const st=C.stu[s.id], sug=ST.suggestions(st.evs);
  const days=Object.entries(st.usage).sort().slice(-14);
  el.innerHTML=card(`<h3>${esc(s.name)} · Block ${s.block}</h3><div class="grid g2"><div><h4>Usage (last 14 days, goal ${S.DAILY_GOAL_MINUTES} min)</h4>${days.map(([d,ms])=>`<div class="row small"><span style="width:90px">${d}</span>${C.bar(Math.min(100,pct(ms/60000,S.DAILY_GOAL_MINUTES)),ms/60000>=S.DAILY_GOAL_MINUTES?'gold':'')}<span>${Math.round(ms/60000)}m</span></div>`).join('')||'—'}
    <h4>Suggested assignments</h4><ol>${sug.map(x=>x.type==='review'?`<li>Review Mission (${x.count} items)</li>`:`<li>${D.TOPICS[x.topic].en} (mastery ${x.score}): ${x.days.length?'Day '+x.days.join(', '):''} ${x.pages.join(', ')} · strategy ${x.strat.join(', ')}</li>`).join('')||'<li>On track — continue next Day</li>'}</ol></div>
    <div><h4>Skills</h4>${Object.entries(st.mastery).filter(([t,o])=>o.n).sort((a,b)=>a[1].score-b[1].score).map(([t,o])=>`<div class="row small"><span style="width:200px">${D.TOPICS[t].en}</span>${C.bar(o.score)}<span>${o.score}</span></div>`).join('')||'—'}
    <h4>Grade 5 standards</h4>${Object.entries(st.std).filter(([k])=>k.startsWith('PE:')).map(([k,o])=>`<div class="row small"><span style="width:90px">${k.slice(3)}</span>${C.bar(o.score,o.group==='got'?'gold':'')}<span>${o.group==='got'?'✅':o.group==='getting'?'🚀':'🌱'} ${o.right}/${o.n}</span></div>`).join('')}</div></div>`);
  el.scrollIntoView({behavior:'smooth'}); }
VIEWS.flags=(p)=>{ const vs=C.visible(); const P=S.PACE; let all=vs.flatMap(s=>C.flags(s).map(f=>Object.assign(f,{s})));
  const none=all.filter(f=>f.kind==='No activity yet'); all=all.filter(f=>f.kind!=='No activity yet');
  const show=C.showDismissed?all:all.filter(f=>!f.dismissed);
  p.innerHTML=card(`<h3>🚩 Pace & work-habit flags <span class="small muted">teacher only · worded as possibilities · each lists its evidence</span></h3>
    <p class="small">Timing reference per question = class median of first tries once ${P.MIN_RESPONSES}+ students answered (block median when that block has ${P.MIN_RESPONSES}+), otherwise a reading-length estimate marked <i>tentative</i>. "Fast" = under ${Math.round(P.FAST_RATIO*100)}% of the reference; "slow" = over ${P.SLOW_RATIO}×. Fast + correct is fine and never flagged. Patterns need ${P.PATTERN_MIN_EVIDENCE}+ items across ${P.PATTERN_MIN_SESSIONS}+ days. Adjust in Settings.</p>
    <label class="small"><input type="checkbox" id="sd" ${C.showDismissed?'checked':''}> show dismissed</label>
    ${none.length?`<div class="flagcard"><span class="flag f-none">No activity yet (${none.length})</span> <span class="small">${none.map(f=>esc(f.s.name)+' (B'+f.s.block+')').join(', ')}</span></div>`:''}
    ${show.map(f=>`<div class="flagcard ${f.dismissed?'dim':''}"><span class="flag ${f.level}">${esc(f.kind)}</span> <b>${esc(f.s.name)}</b> (Block ${f.s.block})${f.tentative?' <span class="small">· tentative timing</span>':''}
      <ul class="small">${f.evidence.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${f.note?`<p class="small muted">${esc(f.note)}</p>`:''}<button class="btn sm ghost" data-flag="${esc(f.id)}" data-d="${f.dismissed?1:0}">${f.dismissed?'Restore':'Dismiss'}</button></div>`).join('')||'<p>No flags. 🎉</p>'}`);
  $('#sd').onchange=e=>{C.showDismissed=e.target.checked; VIEWS.flags(p);};
  p.querySelectorAll('[data-flag]').forEach(b=>b.onclick=()=>{ C.logT({kind:b.dataset.d==='1'?'undismiss':'dismiss',flag:b.dataset.flag}); C.evs=ST.merge(C.evs,ST.LS.get('cmas.ev.TEACHER',[])); analyze(); VIEWS.flags(p); }); };

// ---------- start ----------
const saved=sessionStorage.getItem('cmas.tpin');
if(saved){ C.pin=saved; app.innerHTML='<p style="color:#fff;text-align:center;margin-top:20vh">Loading…</p>'; load().then(()=>{ if(/PIN rejected/.test(C.source)) gate('Please sign in again.'); else render(); }); } else gate();
})();
