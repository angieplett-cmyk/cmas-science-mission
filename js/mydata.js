// My Data, My Skill Map, My Standards (student views).
window.MyData=(function(){
const S=window.SETTINGS, D=window.CMAS_DATA, ST=window.Store, IT=D.ITEMS, $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lang='en'; const T=k=>(I18N[lang][k]!==undefined?I18N[lang][k]:I18N.en[k]); const tx=o=>o==null?'':(typeof o==='string'?o:(lang==='es'&&o.es?o.es:o.en));
const L=(en,es)=>lang==='es'?es:en;
function shell(title,body,back){ const app=$('#app'); app.innerHTML=`<div class="top"><button class="pill" id="bk">← ${T('home')}</button><div class="sp"></div><div class="brand">${title}</div><div class="sp"></div><button class="pill" id="pr" title="Print">🖨️</button></div>${body}`;
  $('#bk').onclick=back; $('#pr').onclick=()=>print(); window.scrollTo(0,0); }
function bar(score,cls){ return `<div class="bar ${cls||''}" role="meter" aria-valuenow="${score}" aria-valuemin="0" aria-valuemax="100"><i style="width:${score}%"></i></div>`; }
const LVL=o=>T('lv')[o.level]||'';
function checkpointsDone(evs){ const cps=(ST.LS.get('cmas.config',null)||{}).checkpoints||S.CHECKPOINTS;
  return cps.map(c=>({c,st:ST.pretestState(evs,c.id)})).filter(x=>x.st.finished||x.st.done.size).map(x=>Object.assign({c:x.c,finished:x.st.finished},ST.pretestScore(evs,x.c.id))); }
function lineChart(points,label){ // points: [{x:label,y:pct}]
  if(!points.length) return `<p class="muted">${L('Your chart starts after your first checkpoint.','Tu gráfica empieza después de tu primera prueba.')}</p>`;
  const W=520,H=200,P=34, n=points.length, xs=i=>P+(n===1?(W-2*P)/2:i*(W-2*P)/(n-1)), ys=v=>H-P-(v/100)*(H-2*P);
  let g=`<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(label)}">`;
  [0,50,100].forEach(v=>g+=`<line x1="${P}" x2="${W-P}" y1="${ys(v)}" y2="${ys(v)}" stroke="#c7d2fe" stroke-dasharray="4"/><text x="4" y="${ys(v)+4}" font-size="12" fill="#475569">${v}%</text>`);
  g+=`<polyline fill="none" stroke="#3b5bfd" stroke-width="4" points="${points.map((p,i)=>xs(i)+','+ys(p.y)).join(' ')}"/>`;
  points.forEach((p,i)=>g+=`<circle cx="${xs(i)}" cy="${ys(p.y)}" r="7" fill="#ffd23f" stroke="#14203d" stroke-width="2"/><text x="${xs(i)}" y="${ys(p.y)-12}" text-anchor="middle" font-size="14" font-weight="700">${p.y}%</text><text x="${xs(i)}" y="${H-8}" text-anchor="middle" font-size="12">${esc(p.x)}</text>`);
  return g+'</svg>'; }
function pairBars(rows){ // rows: [{label,first,latest}]
  return `<div class="pairs">${rows.map(r=>`<div class="pairrow"><div class="pl">${esc(r.label)}</div><div class="pb"><div class="b1" style="width:${r.first}%"></div><span>${T('firstTry')} ${r.first}%</span></div><div class="pb"><div class="b2" style="width:${r.latest}%"></div><span>${T('latest')} ${r.latest}%</span></div></div>`).join('')}</div>`; }
function teacherNotes(evs){ const o={goal:null,rit:{}}; evs.filter(e=>e.type==='teacher').forEach(e=>{ const d=e.detail||{}; if(d.kind==='cmasGoal') o.goal=d.value; if(d.kind==='rit'&&S.SHOW_RIT_TO_STUDENTS) o.rit[d.subject+'|'+d.season]=d.value; if(d.kind==='ritGoal'&&S.SHOW_RIT_TO_STUDENTS) o.rit[d.subject+'|goal'+d.season]=d.value; }); return o; }
function badges(evs){ const ans=ST.answers(evs), out=[]; const rv=ST.reviewList(evs); const fixed=rv.filter(r=>r.fixed).length;
  if(fixed) out.push(['🛠️',L(`Fixer ×${fixed}`,`Reparador ×${fixed}`),L('You fixed questions you missed the first time.','Arreglaste preguntas que fallaste la primera vez.')]);
  if(fixed>=5) out.push(['🔧',L('Master Mechanic','Mecánico experto'),L('5+ misses fixed!','¡Arreglaste 5 o más!')]);
  const prac=ans.filter(e=>e.mode!=='checkpoint'); let run=0,best=0; prac.forEach(e=>{ run=e.rush?0:run+1; best=Math.max(best,run); });
  if(best>=5) out.push(['🔎',L('Careful reader','Lector cuidadoso'),L(`${best} answers in a row taking your time.`,`${best} respuestas seguidas con calma.`)]);
  if(best>=20) out.push(['🧐',L('Super careful reader','Lector súper cuidadoso'),L('20 careful answers in a row!','¡20 respuestas cuidadosas seguidas!')]);
  let s=0,bs=0; prac.forEach(e=>{ s=ST.cleanFirst(e)?s+1:0; bs=Math.max(bs,s); }); if(bs>=3) out.push(['🔥',L(`Streak ${bs}`,`Racha ${bs}`),L('Right on the first try in a row.','Correctas al primer intento seguidas.')]);
  const days=new Set(evs.filter(e=>e.type==='day_done').map(e=>e.ctx)); if(days.size) out.push(['🪐',L(`${days.size} Days done`,`${days.size} días completos`),'']);
  const sm=ST.stdMastery(evs); const got=Object.keys(sm).filter(k=>k.startsWith('PE:')&&sm[k].group==='got').length; if(got) out.push(['🎯',L(`${got} standards: got it`,`${got} estándares dominados`),'']);
  const mins=Object.values(ST.usage(evs)).filter(ms=>ms>=S.DAILY_GOAL_MINUTES*60000).length; if(mins) out.push(['⏱️',L(`20-minute goal ×${mins}`,`Meta de 20 minutos ×${mins}`),'']);
  return out; }
function show(evs,sess,lg,back){ lang=lg; const first=ST.firstAttempts(evs), latest=ST.latestAttempts(evs), ms=ST.mastery(evs);
  const cps=checkpointsDone(evs), tn=teacherNotes(evs);
  const ids=Object.keys(first).filter(id=>IT[id].src!=='strategy');
  const pct=(arr,f)=>arr.length?Math.round(100*arr.filter(f).length/arr.length):0;
  const firstPct=pct(ids,id=>first[id].correct), latestPct=pct(ids,id=>latest[id].correct);
  const today=ST.usage(evs)[new Date().toLocaleDateString('en-CA')]||0, todayMin=Math.round(today/60000);
  const topicRows=Object.entries(ms).filter(([t,o])=>o.n>0&&t!=='test_strategies').sort((a,b)=>b[1].score-a[1].score);
  const strong=topicRows.filter(([t,o])=>o.score>=S.MASTERY.PROFICIENT).slice(0,3), low=topicRows.filter(([t,o])=>o.score<S.MASTERY.PROFICIENT).slice(-3).reverse();
  let means=[];
  if(ids.length){ means.push(L(`On your first tries you got ${firstPct}% right. Now your latest answers are ${latestPct}% right.`,`En tus primeros intentos acertaste ${firstPct}%. Ahora tus últimas respuestas tienen ${latestPct}% correctas.`));
    if(latestPct>firstPct) means.push(L(`That means you grew ${latestPct-firstPct} points by fixing mistakes. Your brain is growing!`,`Eso significa que creciste ${latestPct-firstPct} puntos al corregir errores. ¡Tu cerebro está creciendo!`)); }
  low.forEach(([t])=>means.push(L(`${tx(D.TOPICS[t])} is a tricky spot for you. Practice it next.`,`${tx(D.TOPICS[t])} es un punto difícil para ti. Practícalo después.`)));
  strong.forEach(([t])=>means.push(L(`${tx(D.TOPICS[t])} is a strong spot for you!`,`¡${tx(D.TOPICS[t])} es un punto fuerte para ti!`)));
  if(cps.length>1) { const a=cps[0], b=cps[cps.length-1]; means.push(L(`From ${a.c.name} to ${b.c.name}, your score went from ${a.pct}% to ${b.pct}%.`,`De ${a.c.name} a ${b.c.name}, tu puntaje pasó de ${a.pct}% a ${b.pct}%.`)); }
  const lastCp=cps.filter(c=>c.finished).pop();
  const sug=ST.suggestions(evs);
  let h=`<div class="card"><h2>📊 ${T('mydata')} · ${esc(sess.name)}</h2>
    <div class="grid g4 stats"><div class="stat"><b>${firstPct}%</b><span>${T('firstTry')}</span></div><div class="stat"><b>${latestPct}%</b><span>${T('latest')}</span></div>
    <div class="stat"><b>${latestPct-firstPct>=0?'+':''}${latestPct-firstPct}</b><span>${T('grow')}</span></div><div class="stat"><b>${todayMin}/${S.DAILY_GOAL_MINUTES}</b><span>${T('minutes')}</span>${bar(Math.min(100,Math.round(100*todayMin/S.DAILY_GOAL_MINUTES)),'gold')}</div></div>
    <h3>💬 ${L('What this means','Qué significa')}</h3><ul class="means">${(means.length?means:[L('Start a mission and your data will show up here.','Empieza una misión y tus datos aparecerán aquí.')]).map(m=>`<li>${esc(m)}</li>`).join('')}</ul></div>`;
  h+=`<div class="grid g2"><div class="card"><h3>📈 ${L('My checkpoints over the year','Mis pruebas durante el año')}</h3>${lineChart(cps.filter(c=>c.finished).map(c=>({x:c.c.id==='pre'?L('Launch','Inicio'):c.c.name,y:c.pct})),'checkpoint scores')}
     ${lastCp?`<p>${L('CMAS level ESTIMATE (practice only, not an official score)','ESTIMADO de nivel CMAS (solo práctica, no es oficial)')}: <b>${esc(ST.band(lastCp.cmasPct))}</b></p>`:''}
     ${tn.goal?`<p>🎯 ${L('My spring CMAS goal','Mi meta de CMAS en primavera')}: <b>${esc(tn.goal)}</b></p>`:''}
     ${Object.keys(tn.rit).length?`<p class="small">MAP RIT: ${Object.entries(tn.rit).map(([k,v])=>esc(k.replace('|',' ')+': '+v)).join(' · ')}</p>`:''}</div>
   <div class="card"><h3>🏅 ${L('My badges','Mis insignias')}</h3><div class="badges">${badges(evs).map(b=>`<div class="badgebig" title="${esc(b[2])}"><span>${b[0]}</span><b>${esc(b[1])}</b><small>${esc(b[2])}</small></div>`).join('')||`<p class="muted">${L('Badges show up as you work.','Las insignias aparecen mientras trabajas.')}</p>`}</div></div></div>`;
  h+=`<div class="grid g2"><div class="card"><h3>💪 ${T('strengths')}</h3>${strong.map(([t,o])=>`<p>${esc(tx(D.TOPICS[t]))} ${bar(o.score)}</p>`).join('')||'<p class="muted">—</p>'}</div>
   <div class="card"><h3>🧩 ${T('lows')}</h3>${low.map(([t,o])=>`<p>${esc(tx(D.TOPICS[t]))} ${bar(o.score,'warn')}</p>`).join('')||'<p class="muted">—</p>'}</div></div>`;
  h+=`<div class="card"><h3>🧭 ${T('nextSteps')}</h3><ol class="means">${sug.map(s=>s.type==='review'?`<li>🔁 ${T('review')}: ${s.count} ${L('questions','preguntas')}</li>`:
     `<li>${esc(tx(D.TOPICS[s.topic]))}: ${s.days.length?`${T('day')} ${s.days.join(', ')}`:`🗺️ ${T('skills')}`}${s.pages.length?` · ${s.pages.join(', ')}`:''} · 🧭 ${L('Strategy','Estrategia')} ${s.strat.join(', ')}</li>`).join('')||`<li>${L('Keep going on your next Day!','¡Sigue con tu próximo día!')}</li>`}</ol></div>`;
  // first vs latest per standard category + per question
  const cats={}; ids.forEach(id=>{ const c=IT[id].cat; (cats[c]=cats[c]||[]).push(id); });
  h+=`<div class="card"><h3>🆚 ${T('firstTry')} vs ${T('latest')}</h3>${pairBars(Object.entries(cats).map(([c,arr])=>({label:tx(D.CATS[c]),first:pct(arr,id=>first[id].correct),latest:pct(arr,id=>latest[id].correct)})))}
    <div class="qgrid">${ids.map(id=>{ const f=first[id],l=latest[id], w=ST.WHERE[id]||{}; return `<div class="qc" title="${esc(IT[id].srcLabel)}"><b>${w.n?('#'+w.n):id}</b><span class="${ST.cleanFirst(f)?'g':f.correct?'y':'r'}">${f.correct?'✓':'✗'}</span><span class="${l.correct?'g':'r'}">${l.correct?'✓':'✗'}</span></div>`; }).join('')}</div>
    <p class="small muted">${L('Left mark = first try (it never changes). Right mark = latest try. Yellow = right with help.','Marca izquierda = primer intento (no cambia). Derecha = último intento. Amarillo = correcto con ayuda.')}</p></div>`;
  h+=`<div class="row" style="justify-content:center;margin:16px"><button class="btn" id="tosk">🗺️ ${T('skills')}</button><button class="btn" id="tostd">🎯 ${T('myStandards')}</button></div>`;
  shell('📊 '+T('mydata'),h,back); $('#tosk').onclick=()=>skillMap(evs,lang,()=>show(evs,sess,lang,back),window.App.startSkill); $('#tostd').onclick=()=>standards(evs,lang,()=>show(evs,sess,lang,back)); }
function skillMap(evs,lg,back,start){ lang=lg; const ms=ST.mastery(evs);
  const rows=Object.entries(ms).sort((a,b)=>(a[1].n===0)-(b[1].n===0)||a[1].score-b[1].score);
  const h=`<div class="card"><h2>🗺️ ${T('skills')}</h2><p>${T('skillsSub')}</p><p class="small muted">${T('stdMeans')}</p><div class="skillmap">${rows.map(([t,o],i)=>`<button class="skill lv-${o.level}" data-t="${t}">
     <span class="sk-n">${i+1}</span><span class="sk-t">${esc(tx(D.TOPICS[t]))}</span>${bar(o.score,o.level==='m'?'gold':'')}<span class="sk-l">${esc(LVL(o))}${o.n?` · ${o.right}/${o.n}`:''}</span></button>`).join('')}</div></div>`;
  shell('🗺️ '+T('skills'),h,back); document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>start&&start(b.dataset.t)); }
function standards(evs,lg,back){ lang=lg; const sm=ST.stdMastery(evs), C=D.STANDARDS;
  const card=(k,o)=>{ const [kind,code]=[k.slice(0,k.indexOf(':')),k.slice(k.indexOf(':')+1)]; const meta=C[kind][code]||{kid:{en:code}};
    return `<div class="stdcard g-${o.group}"><div class="stdcode">${kind==='PE'?esc(code):kind==='SEP'?L('Practice','Práctica'):L('Big idea','Gran idea')}</div><div class="stdkid">${esc(tx(meta.kid))}</div>
      ${kind!=='PE'?`<div class="small muted">${esc(code)}</div>`:`<div class="small muted">${esc(meta.eo||'')}</div>`}${bar(o.score,o.group==='got'?'gold':o.group==='notyet'?'warn':'')}
      <div class="small">${o.n?`${o.right}/${o.n} ${L('right','correctas')}`:T('notStarted')}</div>${kind==='PE'&&o.group!=='got'?`<button class="btn sm" data-std="${esc(k)}">▶ ${T('practiceThis')}</button>`:''}</div>`; };
  let h=`<div class="card"><h2>🎯 ${T('myStandards')}</h2><p>${T('stdSub')}</p><p class="small muted">${T('stdMeans')}</p></div>`;
  [['PE',T('pes')],['SEP',T('seps')],['CCC',T('cccs')]].forEach(([kind,title])=>{
    const keys=Object.keys(sm).filter(k=>k.startsWith(kind+':')&&(kind!=='PE'||(C.PE[k.slice(3)]||{}).grade5));
    h+=`<div class="card"><h3>${title}</h3><div class="grid g3">`;
    [['got','✅ '+T('gotIt')],['getting','🚀 '+T('gettingThere')],['notyet','🌱 '+T('notYet')]].forEach(([g,lab])=>{
      const ks=keys.filter(k=>sm[k].group===g); h+=`<div class="stdcol"><h4>${lab} (${ks.length})</h4>${ks.map(k=>card(k,sm[k])).join('')||'<p class="muted small">—</p>'}</div>`; });
    h+=`</div></div>`; });
  h+=`<p class="small" style="color:#dbe4ff;text-align:center">${L('Codes are from the Colorado Academic Standards for Science (2020) and the CMAS Grade 5 Science Framework.','Los códigos vienen de los Estándares Académicos de Colorado para Ciencias (2020) y el marco de CMAS de 5.º grado.')}</p>`;
  shell('🎯 '+T('myStandards'),h,back); document.querySelectorAll('[data-std]').forEach(b=>b.onclick=()=>window.App.practiceStd(b.dataset.std)); }
return {show,skillMap,standards,badges,checkpointsDone,lineChart};
})();
