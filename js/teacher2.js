// Teacher dashboard (part 2): Checkpoints & Growth, Groups, MAP RIT & Goals, Roster, Settings, Code Key, CSV Export.
window.TExtra=(function(){
const S=window.SETTINGS, D=window.CMAS_DATA, ST=window.Store, IT=D.ITEMS, $=(s,r)=>(r||document).querySelector(s);
const X={};
const refresh=C=>{ C.evs=ST.merge(C.evs,ST.LS.get('cmas.ev.TEACHER',[])); C.analyze(); };
function cps(C){ return (C.cfg.checkpoints||S.CHECKPOINTS); }

// ---------- Checkpoints & Growth ----------
X.growth=(p,C)=>{ const vs=C.visible(), list=cps(C), esc=C.esc;
  const rows=vs.map(s=>{ const sc=list.map(c=>C.cpScore(s,c.id)); const base=sc[0];
    const lastDone=[...sc].reverse().find(x=>x&&x.finished); const goal=C.tdata.cmasGoal[s.id]||'';
    return `<tr><td>${esc(s.name)}</td><td>${s.block}</td>${sc.map((x,i)=>`<td>${x?`${x.pct}%${x.finished?'':` <span class="flag f-pause">PARTIAL ${x.answered}/${C.cpOrder.length}</span>`}<br><span class="small">CMAS items ${x.cmasPct}%${x.finished?` · potential ${x.potential}%`:' (answered items only)'}</span>${i&&base&&x.finished?`<br><b>${x.pct-base.pct>=0?'+':''}${x.pct-base.pct}</b> vs baseline`:''}`:'—'}</td>`).join('')}
      <td>${lastDone?`<b>${esc(ST.band(lastDone.cmasPct))}</b><br><span class="small">ESTIMATE from ${lastDone.cmasPct}% on official CMAS items</span>`:'—'}</td>
      <td><select data-goal="${s.id}" aria-label="Spring CMAS goal for ${esc(s.name)}"><option value="">—</option>${S.CMAS_BANDS.map(b=>`<option ${goal===b.label?'selected':''}>${esc(b.label)}</option>`).join('')}</select></td></tr>`; });
  // most-missed topics on the baseline
  const pre=list[0]; const tops={}; vs.forEach(s=>{ const x=C.cpScore(s,pre.id); if(!x) return; Object.entries(x.byTopic).forEach(([t,v])=>{ tops[t]=tops[t]||{e:0,p:0}; tops[t].e+=v.e; tops[t].p+=v.p; }); });
  const tl=Object.entries(tops).sort((a,b)=>a[1].e/a[1].p-b[1].e/b[1].p).slice(0,6);
  const cpSel=C.cpSel||list[0].id;
  const stRows=vs.map(s=>{ const t=C.cpStatus(s,cpSel); return `<tr data-row="${s.id}"><td>${esc(s.name)}</td><td>${s.block}</td><td><span class="flag ${t.cls}">${esc(t.label)}</span>${t.key==='paused'?`<br><span class="small">paused by ${t.by} · ${new Date(t.at).toLocaleString()}</span>`:''}</td>
    <td>${t.key==='progress'?`<button class="btn sm warn" data-act="teacher_pause" data-sid="${s.id}">⏸ Pause</button>`:''}${t.key==='complete'?`<button class="btn sm ghost" data-act="cp_reopen" data-sid="${s.id}">↩ Reopen (resume)</button>`:''}
    ${t.key!=='none'?` <button class="btn sm ghost" data-act="cp_reset" data-sid="${s.id}">⟲ Reset test</button>`:''}</td></tr>`; });
  const counts={}; vs.forEach(s=>{ const k=C.cpStatus(s,cpSel).key; counts[k]=(counts[k]||0)+1; });
  p.innerHTML=C.card(`<h3>🧪 Test status <select id="cpsel" aria-label="Checkpoint">${list.map(c=>`<option value="${esc(c.id)}" ${c.id===cpSel?'selected':''}>${esc(c.name)}</option>`).join('')}</select></h3>
     <p class="small">✅ Complete ${counts.complete||0} · ⏸ Paused ${counts.paused||0} · ✏️ In progress ${counts.progress||0} · Not started ${counts.none||0}.
     Partial tests are scored only on the questions answered (unanswered questions are never counted as misses), get no CMAS estimate, and are labeled PARTIAL until complete.
     <b>Pause</b> stops and saves the student's test (right away on the same Chromebook; within about a minute through the shared Sheet). <b>Reopen</b> lets a finished student continue (answered questions stay locked). <b>Reset test</b> clears this checkpoint so the student starts over — only for test accounts or an invalid sitting.</p>
     ${C.table(['Student','Blk','Status','Actions'],stRows)}`)+C.card(`<h3>📅 Checkpoint schedule <span class="small muted">same one-sitting test mode as the Launch Check; opens for students on its date</span></h3>
     ${list.map((c,i)=>`<div class="row"><input data-cpn="${i}" value="${esc(c.name)}" aria-label="Checkpoint name" style="width:220px"> opens <input type="date" data-cpd="${i}" value="${esc(c.opens||'')}"> <span class="small muted">id: ${esc(c.id)}</span></div>`).join('')}
     <div class="row"><button class="btn sm" id="addcp">+ Add checkpoint</button><button class="btn sm ok" id="savecp">Save schedule</button><span id="cpmsg" class="small"></span></div>`)+
    C.card(`<h3>📈 Baseline → checkpoints</h3><p class="small muted">CMAS level = classroom ESTIMATE from % correct on the official CMAS practice items (bands in settings.js: ${S.CMAS_BANDS.map(b=>b.label+' ≥'+b.min+'%').join(', ')}). These are not CDE cut scores.</p>
     ${C.table(['Student','Blk',...list.map(c=>esc(c.name)),'Projected CMAS level (ESTIMATE)','Spring CMAS goal'],rows)}`)+
    C.card(`<h3>🔻 Most-missed topics on ${esc(pre.name)}</h3>${tl.map(([t,v])=>`<p>${D.TOPICS[t].en}: ${C.pct(v.e,v.p)}% of points ${C.bar(C.pct(v.e,v.p),'warn')} → ${C.daysFor(t)}</p>`).join('')||'No checkpoint data yet.'}<p class="small">Mini-lesson groups: see the Groups tab.</p>`);
  $('#cpsel').onchange=e=>{ C.cpSel=e.target.value; X.growth(p,C); };
  p.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{ const s=C.stu[b.dataset.sid].s, a=b.dataset.act;
    if(a==='cp_reset'&&!confirm(`Reset ${s.name}'s ${cpSel} test? Their answers on this checkpoint will no longer count and they start over. (Practice data is kept.)`)) return;
    C.studentAction(s,a,cpSel); X.growth(p,C); });
  p.querySelectorAll('[data-goal]').forEach(sel=>sel.onchange=()=>{ const sid=sel.dataset.goal, s=C.stu[sid].s;
    C.logT({kind:'cmasGoal',sid,value:sel.value}); ST.log({sid,name:s.name,block:s.block,type:'teacher',mode:'teacher',detail:{kind:'cmasGoal',value:sel.value}}); refresh(C); });
  const getList=()=>list.map((c,i)=>Object.assign({},c,{name:$(`[data-cpn="${i}"]`).value,opens:$(`[data-cpd="${i}"]`).value}));
  $('#addcp').onclick=()=>{ C.cfg.checkpoints=[...getList(),{id:'cp'+Date.now().toString(36),name:'New checkpoint',opens:''}]; X.growth(p,C); };
  $('#savecp').onclick=async()=>{ C.cfg.checkpoints=getList(); const ok=await ST.setConfig(C.cfg,C.pin); $('#cpmsg').textContent=ok?'Saved ✓':'Could not save to the Google Sheet (saved on this device).'; }; };

// ---------- Groups ----------
X.groups=(p,C)=>{ const vs=C.visible(), esc=C.esc, maj=S.GROUP_MAJORITY; const src=C.groupSrc||'first';
  const missedBy=(id)=>vs.filter(s=>{ const f=src==='pre'?C.stu[s.id].evs.find(e=>e.type==='answer'&&e.item===id&&e.mode==='checkpoint'&&e.ctx==='pre'):C.stu[s.id].first[id]; return f&&!f.correct; });
  const tried=(id)=>vs.filter(s=>src==='pre'?C.stu[s.id].evs.some(e=>e.type==='answer'&&e.item===id&&e.ctx==='pre'):C.stu[s.id].first[id]).length;
  const groups=[];
  Object.keys(IT).filter(id=>IT[id].src!=='strategy').forEach(id=>{ const m=missedBy(id), n=tried(id); if(!m.length) return; groups.push({key:'q:'+id,title:`${C.label(id)} (${id}) · ${D.TOPICS[IT[id].topic].en} · ${IT[id].std.pe||''}`,where:C.where(id),m,n,items:[id]}); });
  Object.keys(D.TOPICS).filter(t=>t!=='test_strategies').forEach(t=>{ const ids=Object.keys(IT).filter(id=>IT[id].src!=='strategy'&&ST.topicsOf(id).includes(t)); const set=new Map(); let n=0;
    vs.forEach(s=>{ let any=false, miss=false; ids.forEach(id=>{ const f=C.stu[s.id].first[id]; if(f){any=true; if(!f.correct) miss=true;} }); if(any) n++; if(miss) set.set(s.id,s); });
    if(set.size) groups.push({key:'t:'+t,title:`Topic: ${D.TOPICS[t].en}`,where:C.daysFor(t)+' · pages '+[...new Set(ids.map(id=>(ST.WHERE[id]||{}).page).filter(Boolean))].join(', '),m:[...set.values()],n,items:ids,topic:true}); });
  const kind=g=>g.n&&g.m.length/g.n>maj?'whole':'small';
  const growthAfter=g=>{ const met=C.tdata.met[g.key+'|'+C.block]; if(!met) return ''; const after=new Date(met.date);
    let fixed=0,tot=0; (met.sids||[]).forEach(sid=>{ const st=C.stu[sid]; if(!st) return; g.items.forEach(id=>{ const f=st.first[id]; if(!f||f.correct) return; tot++; if(st.evs.some(e=>e.type==='answer'&&e.item===id&&e.correct&&new Date(e.ts)>=after)) fixed++; }); });
    return `<div class="small">✅ Met ${esc(met.date)} with ${(met.sids||[]).length} students · since then ${fixed}/${tot} missed items answered correctly</div>`; };
  const show=g=>`<div class="grp ${kind(g)}"><div><b>${kind(g)==='whole'?'🏫 Whole-group lesson':'🧑‍🏫 Meet with teacher'}</b> · ${esc(g.title)}<br><span class="small">${esc(g.where)} · missed ${g.m.length}/${g.n} (${C.pct(g.m.length,g.n)}%)</span></div>
     <div>${g.m.map(s=>`<span class="chip">${esc(s.name)} <small>B${s.block}</small></span>`).join(' ')}</div>${growthAfter(g)}
     <div class="row noprint"><input type="date" data-md="${esc(g.key)}" value="${new Date().toLocaleDateString('en-CA')}" aria-label="Date met"><button class="btn sm" data-met="${esc(g.key)}">Mark met</button></div></div>`;
  const qs=groups.filter(g=>!g.topic).sort((a,b)=>b.m.length/b.n-a.m.length/a.n), ts=groups.filter(g=>g.topic).sort((a,b)=>b.m.length-a.m.length);
  p.innerHTML=C.card(`<h3>🧑‍🤝‍🧑 Auto groups <span class="small muted">${C.block==='all'?'whole class':'Block '+C.block} · "Whole-group lesson" when more than ${Math.round(maj*100)}% missed</span></h3>
    <div class="row noprint"><label>Based on <select id="gsrc"><option value="first" ${src==='first'?'selected':''}>first try (any mode)</option><option value="pre" ${src==='pre'?'selected':''}>Launch Check only</option></select></label>
    <label>Show <select id="gk"><option value="q">by question</option><option value="t" ${C.groupKind==='t'?'selected':''}>by topic</option></select></label><button class="btn sm" onclick="print()">🖨️ Print groups</button></div>
    ${(C.groupKind==='t'?ts:qs).map(show).join('')||'<p>No misses yet.</p>'}`);
  $('#gsrc').onchange=e=>{C.groupSrc=e.target.value; X.groups(p,C);}; $('#gk').onchange=e=>{C.groupKind=e.target.value; X.groups(p,C);};
  p.querySelectorAll('[data-met]').forEach(b=>b.onclick=()=>{ const g=groups.find(x=>x.key===b.dataset.met); const date=p.querySelector(`[data-md="${CSS.escape(g.key)}"]`).value;
    C.logT({kind:'groupMet',key:g.key+'|'+C.block,date,sids:g.m.map(s=>s.id)}); refresh(C); X.groups(p,C); }); };

// ---------- MAP RIT & goals ----------
const SUBJ=['Math','Reading','Science'], SEAS=['Fall','Winter','Spring','GoalWinter','GoalEOY'];
X.rit=(p,C)=>{ const vs=C.visible(), esc=C.esc, R=C.tdata.rit; const v=(sid,sub,sea)=>R[`${sid}|${sub}|${sea}`]||'';
  const g=(a,b)=>a&&b?(b-a>=0?'+':'')+(b-a):'—';
  const rows=vs.map(s=>`<tr><td>${esc(s.name)}</td><td>${s.block}</td>${SUBJ.map(sub=>SEAS.map(sea=>`<td><input class="rit" data-r="${s.id}|${sub}|${sea}" value="${esc(v(s.id,sub,sea))}" inputmode="numeric" size="3" aria-label="${sub} ${sea} ${esc(s.name)}"></td>`).join('')+
    `<td class="small">F→W ${g(+v(s.id,sub,'Fall'),+v(s.id,sub,'Winter'))}<br>F→S ${g(+v(s.id,sub,'Fall'),+v(s.id,sub,'Spring'))}${v(s.id,sub,'GoalEOY')&&v(s.id,sub,'Spring')?`<br>${+v(s.id,sub,'Spring')>=+v(s.id,sub,'GoalEOY')?'✅ met EOY goal':'EOY goal not met yet'}`:''}</td>`).join('')}</tr>`);
  p.innerHTML=C.card(`<h3>📏 MAP Growth RIT scores & goals <span class="small muted">teacher-entered · goals are yours to set (no NWEA norms are built in)</span></h3>
    <p class="small">Students ${S.SHOW_RIT_TO_STUDENTS?'<b>can</b>':'cannot'} see their RIT on My Data (SHOW_RIT_TO_STUDENTS in settings.js).</p>
    <div class="row"><button class="btn ok sm" id="saverit">Save changes</button><span id="rmsg" class="small"></span></div>
    ${C.table(['Student','Blk',...SUBJ.flatMap(sub=>[...SEAS.map(sea=>`${sub} ${sea.replace('Goal','Goal ')}`),`${sub} growth`])],rows)}`)+
    C.card(`<h3>⬆️ Import RIT CSV</h3><p class="small">Columns (header row required): <code>name</code> or <code>id</code>, then any of ${SUBJ.flatMap(s=>SEAS.map(e=>`<code>${s.toLowerCase()}_${e.toLowerCase()}</code>`)).join(', ')}. Names match "First L." on the roster.</p>
    <input type="file" id="ritf" accept=".csv,text/csv"> <span id="imsg" class="small"></span>`);
  $('#saverit').onclick=()=>{ let n=0; p.querySelectorAll('[data-r]').forEach(i=>{ const [sid,subject,season]=i.dataset.r.split('|'); const val=i.value.trim(); if(val===(R[i.dataset.r]||'')) return;
      if(val&&!/^\d{2,3}$/.test(val)){ i.style.outline='3px solid red'; return; } C.logT({kind:'rit',sid,subject,season,value:val}); n++;
      if(S.SHOW_RIT_TO_STUDENTS){ const s=C.stu[sid].s; ST.log({sid,name:s.name,block:s.block,type:'teacher',mode:'teacher',detail:{kind:season.startsWith('Goal')?'ritGoal':'rit',subject,season,value:val}}); } });
    refresh(C); $('#rmsg').textContent=`Saved ${n} value(s).`; };
  $('#ritf').onchange=async e=>{ const f=e.target.files[0]; if(!f) return; const rows=parseCSV(await f.text()); const head=rows.shift().map(h=>h.trim().toLowerCase()); let n=0, miss=[];
    rows.forEach(r=>{ const o={}; head.forEach((h,i)=>o[h]=(r[i]||'').trim()); const s=C.students.find(x=>x.id===o.id||x.name.toLowerCase()===(o.name||'').toLowerCase()); if(!s){ if(o.name||o.id) miss.push(o.name||o.id); return; }
      SUBJ.forEach(sub=>SEAS.forEach(sea=>{ const k=`${sub.toLowerCase()}_${sea.toLowerCase()}`; if(o[k]&&/^\d{2,3}$/.test(o[k])){ C.logT({kind:'rit',sid:s.id,subject:sub,season:sea,value:o[k]}); n++; } })); });
    refresh(C); X.rit(p,C); $('#imsg').textContent=`Imported ${n} values.${miss.length?' Not matched: '+miss.join(', '):''}`; }; };
function parseCSV(t){ const out=[]; let row=[],f='',q=false; for(let i=0;i<t.length;i++){ const c=t[i]; if(q){ if(c==='"'){ if(t[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
  else if(c==='"') q=true; else if(c===','){row.push(f);f='';} else if(c==='\n'||c==='\r'){ if(c==='\r'&&t[i+1]==='\n') i++; row.push(f); if(row.some(x=>x!=='')) out.push(row); row=[]; f=''; } else f+=c; }
  row.push(f); if(row.some(x=>x!=='')) out.push(row); return out; }

// ---------- Roster ----------
X.roster=(p,C)=>{ const esc=C.esc; const list=C.roster.slice().sort((a,b)=>a.block-b.block||a.name.localeCompare(b.name));
  const vis=list.filter(s=>(C.showArchived||!s.archived)&&(C.block==='all'||String(s.block)===String(C.block)));
  p.innerHTML=C.card(`<h3>🧾 Roster <span class="small muted">saved in the shared Google Sheet (Roster tab) · ${list.filter(s=>!s.archived).length} active · ${list.filter(s=>s.archived).length} archived</span></h3>
    <p class="small">New students must take the Launch Check first (practice stays locked until they finish). Archiving keeps all data but hides the name from sign-in. Changing a name or block keeps the same data (the hidden id never changes).</p>
    <label class="small"><input type="checkbox" id="sa" ${C.showArchived?'checked':''}> show archived</label>
    ${C.table(['Name (first + last initial)','Block','Status','Launch Check first','Added',''],vis.map(s=>`<tr class="${s.archived?'dim':''}"><td><input data-name="${s.id}" value="${esc(s.name)}" aria-label="Name"></td>
      <td><select data-blk="${s.id}">${ST.BLOCKS.map(b=>`<option value="${b.block}" ${b.block==s.block?'selected':''}>Block ${b.block} ${b.teacher}</option>`).join('')}</select></td>
      <td>${s.archived?'Archived':'Active'}</td><td><input type="checkbox" data-pf="${s.id}" ${s.pretestFirst!==false?'checked':''} aria-label="Require Launch Check first"></td><td class="small">${esc(s.added||'')}</td>
      <td><button class="btn sm ghost" data-arch="${s.id}">${s.archived?'Restore':'Archive'}</button></td></tr>`))}
    <div class="row"><button class="btn ok" id="saveR">Save roster</button><span id="rmsg2" class="small"></span></div>`)+
   C.card(`<h3>➕ Add students</h3><p class="small">Paste one name per line (e.g. <code>Maria G.</code>). A first name and last name will be shortened to first name + last initial.</p>
    <div class="row"><select id="nb">${ST.BLOCKS.map(b=>`<option value="${b.block}" ${String(C.block)===String(b.block)?'selected':''}>Block ${b.block} ${b.teacher}</option>`).join('')}</select></div>
    <textarea id="paste" rows="6" style="width:100%;font-size:18px" placeholder="Maria G.&#10;Sam Lee"></textarea><div class="row"><button class="btn" id="addR">Add to roster</button><span id="amsg" class="small"></span></div>`);
  $('#sa').onchange=e=>{C.showArchived=e.target.checked; X.roster(p,C);};
  const collect=()=>{ C.roster.forEach(s=>{ const n=p.querySelector(`[data-name="${CSS.escape(s.id)}"]`); if(!n) return; s.name=n.value.trim()||s.name; s.block=Number(p.querySelector(`[data-blk="${CSS.escape(s.id)}"]`).value); s.pretestFirst=p.querySelector(`[data-pf="${CSS.escape(s.id)}"]`).checked; }); };
  p.querySelectorAll('[data-arch]').forEach(b=>b.onclick=()=>{ collect(); const s=C.roster.find(x=>x.id===b.dataset.arch); s.archived=!s.archived; X.roster(p,C); $('#rmsg2').textContent='Not saved yet — click Save roster.'; });
  $('#addR').onclick=()=>{ collect(); const blk=Number($('#nb').value); const names=$('#paste').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); const added=[];
    names.forEach(raw=>{ let nm=raw.replace(/\s+/g,' '); const parts=nm.split(' '); if(parts.length>=2&&!/\.$/.test(parts[parts.length-1])) nm=parts[0]+' '+parts[parts.length-1][0].toUpperCase()+'.';
      if(C.roster.some(s=>!s.archived&&s.block===blk&&s.name.toLowerCase()===nm.toLowerCase())) return; const id=ST.slug(nm,blk,C.roster);
      C.roster.push({id,name:nm,block:blk,archived:false,added:new Date().toLocaleDateString('en-CA'),pretestFirst:true}); added.push(nm); });
    X.roster(p,C); $('#amsg').textContent=''; $('#rmsg2').textContent=`Added ${added.length}: ${added.join(', ')} — click Save roster.`; };
  $('#saveR').onclick=async()=>{ collect(); const r=await ST.saveRoster(C.roster,C.pin); $('#rmsg2').textContent=r.ok?(r.local?'Saved on this device (no SHEET_URL yet).':`Saved ${r.saved} students to the shared store ✓`):'Could not save: '+(r.error||'error'); C.analyze(); }; };

// ---------- Settings ----------
X.settings=(p,C)=>{ const P=S.PACE, R=S.RUSH;
  const f=(k,label,val,step)=>`<label class="setrow"><span>${label}</span><input data-set="${k}" type="number" step="${step||1}" value="${val}"></label>`;
  p.innerHTML=C.card(`<h3>⚙️ Thresholds <span class="small muted">saved to the shared store; Chromebooks pick them up next sign-in</span></h3><div class="grid g2"><div>
    <h4>Pace flags (teacher only)</h4>${f('PACE.MIN_RESPONSES','Responses before using class median',P.MIN_RESPONSES)}${f('PACE.FAST_RATIO','"Fast" = under this × median',P.FAST_RATIO,0.05)}${f('PACE.SLOW_RATIO','"Slow" = over this × median',P.SLOW_RATIO,0.5)}
    ${f('PACE.FALLBACK_WORDS_PER_SEC','Tentative estimate: words per second',P.FALLBACK_WORDS_PER_SEC,0.5)}${f('PACE.PATTERN_MIN_EVIDENCE','Pattern needs this many items',P.PATTERN_MIN_EVIDENCE)}${f('PACE.PATTERN_MIN_SESSIONS','…across this many days',P.PATTERN_MIN_SESSIONS)}${f('PACE.NO_PROGRESS_MINUTES','"No progress" after minutes signed in',P.NO_PROGRESS_MINUTES)}</div><div>
    <h4>Practice nudges (students see these in practice only)</h4>${f('RUSH.WORDS_PER_SECOND','"Slow down" if faster than words/sec',R.WORDS_PER_SECOND,0.5)}${f('RUSH.MIN_SECONDS','…but never under (s)',R.MIN_SECONDS)}${f('RUSH.MAX_SECONDS','…and never over (s)',R.MAX_SECONDS)}
    ${f('RUSH.RAPID_CLICKS','Rapid answer changes',R.RAPID_CLICKS)}${f('RUSH.RAPID_WINDOW_SEC','…within seconds',R.RAPID_WINDOW_SEC)}${f('RUSH.PAUSE_SECONDS','Pause length (s)',R.PAUSE_SECONDS)}
    <h4>Other</h4>${f('IDLE_SECONDS','Idle after seconds',S.IDLE_SECONDS)}${f('GROUP_MAJORITY','Whole-group lesson when more than (0–1)',S.GROUP_MAJORITY,0.05)}${f('DAILY_GOAL_MINUTES','Daily goal minutes',S.DAILY_GOAL_MINUTES)}${f('STD_GETTING_THERE','"Getting there" from mastery score',S.STD_GETTING_THERE)}</div></div>
    <div class="row"><button class="btn ok" id="saveS">Save settings</button><span id="smsg" class="small"></span></div>`);
  $('#saveS').onclick=async()=>{ const o=Object.assign({},C.cfg.settings||{}); p.querySelectorAll('[data-set]').forEach(i=>{ const v=Number(i.value); if(isNaN(v)) return; const [a,b]=i.dataset.set.split('.'); if(b){ o[a]=Object.assign({},o[a]||{}); o[a][b]=v; } else o[a]=v; });
    C.cfg.settings=o; ST.applySettings(C.cfg); const ok=await ST.setConfig(C.cfg,C.pin); C.analyze(); $('#smsg').textContent=ok?'Saved ✓':'Saved on this device only.'; }; };

// ---------- Code Key ----------
X.codes=(p,C)=>{ const N=window.NUMBERING; const rows=[];
  N.days.forEach(d=>d.steps.forEach(s=>{ const id=s.type==='strategy'?s.id:s.id; if(!id||!IT[id]) return; rows.push(`<tr><td>Day ${d.day}</td><td>${s.type==='strategy'?'Strategy '+id:'#'+s.n}</td><td>${id}</td><td>${s.page?'p.'+s.page+' / slide '+s.page:'—'}</td><td class="code-ok">${IT[id].code.ok}</td><td class="code-no">${IT[id].code.no}</td></tr>`); }));
  N.map.forEach(m=>m.steps.forEach(s=>rows.push(`<tr><td>MAP ${m.set}</td><td>${s.n}</td><td>${s.id}</td><td>—</td><td class="code-ok">${IT[s.id].code.ok}</td><td class="code-no">${IT[s.id].code.no}</td></tr>`)));
  p.innerHTML=C.card(`<h3>🔑 Code key <span class="small muted">CORRECT code = right answer (1st or 2nd try). Wrong code = shown after each miss. Same word list for both, so kids can't tell from the word alone.</span></h3><button class="btn sm" onclick="print()">🖨️ Print</button>${C.table(['Day','Question','Item','Workbook page / slide','CORRECT code','Wrong code'],rows)}`); };

// ---------- CSV ----------
function csv(rows){ return rows.map(r=>r.map(v=>{ v=v==null?'':String(v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }).join(',')).join('\n'); }
function download(name,rows){ const b=new Blob(['\ufeff'+csv(rows)],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; document.body.appendChild(a); a.click(); a.remove(); }
X.csv=csv;
X.export=(p,C)=>{ const vs=C.visible(); const day=new Date().toLocaleDateString('en-CA');
  const attemptRows=(which)=>{ const out=[['student','block','item','question_no','source','category','topic','standard_PE','SEP','CCC','correct','tries','hint','seconds','ref_seconds','ref_tentative','rush','idle_seconds','off_tab','mode','checkpoint_or_day','lang','answer','time']];
    vs.forEach(s=>{ const st=C.stu[s.id]; Object.values(st[which]).forEach(e=>{ const it=IT[e.item], r=C.ref(e.item,s.block); out.push([s.name,s.block,e.item,e.n||'',it.src,D.CATS[it.cat].en,D.TOPICS[it.topic].en,it.std.pe,it.std.sep,it.std.ccc,e.correct?1:0,e.tries,e.hint?1:0,Math.round((e.ms||0)/1000),Math.round(r.ms/1000),r.tentative?1:0,e.rush?1:0,Math.round((e.idleMs||0)/1000),e.offTab||0,e.mode,e.ctx,e.lang,(e.detail||{}).answer||'',e.ts]); }); }); return out; };
  const B=[
    ['first_attempts','First attempts (permanent) with time data',()=>attemptRows('first')],
    ['latest_attempts','Latest attempts with time data',()=>attemptRows('latest')],
    ['first_vs_latest','First vs latest per student & item',()=>{ const o=[['student','block','item','first_correct','latest_correct','grew']]; vs.forEach(s=>{ const st=C.stu[s.id]; Object.keys(st.first).forEach(id=>o.push([s.name,s.block,id,st.first[id].correct?1:0,st.latest[id].correct?1:0,!st.first[id].correct&&st.latest[id].correct?1:0])); }); return o; }],
    ['sessions','Sessions: minutes, idle minutes, off-tab counts',()=>{ const o=[['student','block','start','minutes','idle_minutes','off_tab_count','answers','clicks','keys','mouse_moves','mode']]; vs.forEach(s=>C.stu[s.id].evs.filter(e=>e.type==='session').forEach(e=>{ const d=e.detail||{}; o.push([s.name,s.block,e.ts,((e.ms||0)/60000).toFixed(1),((e.idleMs||0)/60000).toFixed(1),e.offTab||0,d.answers||0,d.clicks||0,d.keys||0,d.moves||0,e.mode]); })); return o; }],
    ['students','Student summary (usage, growth, flags, standards)',()=>{ const pes=Object.keys(D.STANDARDS.PE).filter(k=>D.STANDARDS.PE[k].grade5); const o=[['student','block','archived','launch_pct','launch_cmas_pct','cmas_estimate','cmas_goal','first_pct','latest_pct','minutes_total','idle_minutes','off_tab','rush_pauses','flags',...pes.map(k=>k+'_mastery')]];
      vs.forEach(s=>{ const st=C.stu[s.id], ids=Object.keys(st.first).filter(id=>IT[id].src!=='strategy'), pre=C.cpScore(s,'pre'), ses=C.sessions(s);
        o.push([s.name,s.block,s.archived?1:0,pre?pre.pct:'',pre?pre.cmasPct:'',pre?ST.band(pre.cmasPct):'',C.tdata.cmasGoal[s.id]||'',C.pct(ids.filter(i=>st.first[i].correct).length,ids.length),C.pct(ids.filter(i=>st.latest[i].correct).length,ids.length),
          Math.round(Object.values(st.usage).reduce((a,b)=>a+b,0)/60000),Math.round(ses.idleMs/60000),ses.offTab,st.evs.filter(e=>e.type==='rush').length,C.flags(s).filter(f=>!f.dismissed).map(f=>f.kind).join('; '),...pes.map(k=>st.std['PE:'+k].score)]); }); return o; }],
    ['standards','Standards mastery (PE/SEP/CCC) per student',()=>{ const keys=Object.keys(ST.stdMastery([])); const o=[['student','block',...keys]]; vs.forEach(s=>o.push([s.name,s.block,...keys.map(k=>C.stu[s.id].std[k].score+' '+C.stu[s.id].std[k].group)])); return o; }],
    ['checkpoints','Checkpoint scores & growth',()=>{ const list=cps(C); const o=[['student','block',...list.flatMap(c=>[c.id+'_status',c.id+'_answered',c.id+'_pct_of_answered',c.id+'_cmas_pct',c.id+'_estimate'])]]; vs.forEach(s=>o.push([s.name,s.block,...list.flatMap(c=>{ const x=C.cpScore(s,c.id), t=C.cpStatus(s,c.id); return x?[t.label,x.answered,x.pct,x.cmasPct,x.finished?ST.band(x.cmasPct):'partial — no estimate']:[t.label,0,'','','']; })])); return o; }],
    ['rit','MAP RIT & goals',()=>{ const o=[['id','name','block',...SUBJ.flatMap(s=>SEAS.map(e=>`${s.toLowerCase()}_${e.toLowerCase()}`))]]; vs.forEach(s=>o.push([s.id,s.name,s.block,...SUBJ.flatMap(sub=>SEAS.map(sea=>C.tdata.rit[`${s.id}|${sub}|${sea}`]||''))])); return o; }],
    ['all_events','All raw events',()=>{ const o=[['ts','sid','name','block','type','mode','ctx','item','n','correct','tries','hint','ms','rush','idleMs','offTab','lang','detail']]; C.evs.filter(e=>e.sid==='TEACHER'||vs.some(s=>s.id===e.sid)).forEach(e=>o.push([e.ts,e.sid,e.name,e.block,e.type,e.mode,e.ctx,e.item,e.n,e.correct===undefined?'':(e.correct?1:0),e.tries,e.hint?1:0,e.ms,e.rush?1:0,e.idleMs,e.offTab,e.lang,JSON.stringify(e.detail||{})])); return o; }]];
  p.innerHTML=C.card(`<h3>⬇️ CSV export <span class="small muted">${C.block==='all'?'all blocks':'Block '+C.block}</span></h3>${B.map(([k,l])=>`<p><button class="btn sm" data-csv="${k}">⬇ ${l}</button></p>`).join('')}`);
  p.querySelectorAll('[data-csv]').forEach(b=>b.onclick=()=>{ const x=B.find(y=>y[0]===b.dataset.csv); download(`cmas_${x[0]}_${C.block==='all'?'all':'block'+C.block}_${day}.csv`,x[2]()); }); };
return X;
})();
