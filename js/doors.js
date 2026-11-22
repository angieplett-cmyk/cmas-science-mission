// Unlock animations: 7 original space-station doors + an original astronaut crew. About 1.8 s. SVG + Web Animations.
window.Doors=(function(){
  const NS='http://www.w3.org/2000/svg';
  const COLORS=['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#14b8a6','#f97316','#eab308','#64748b'];
  let last=-1;
  const reduce=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function svg(w,h,inner){const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox',`0 0 ${w} ${h}`);s.setAttribute('width','100%');s.setAttribute('height','100%');s.innerHTML=inner;return s;}
  // Original astronaut design: bubble helmet with smiling visor, boxy suit, chunky boots, star antenna.
  function astronaut(color){ const d=document.createElement('div'); d.className='astro';
    d.appendChild(svg(70,84,`<line x1="35" y1="4" x2="35" y2="14" stroke="#cbd5e1" stroke-width="3"/><polygon points="35,0 37,4 41,4 38,7 39,11 35,9 31,11 32,7 29,4 33,4" fill="#ffd23f"/>
      <rect x="14" y="40" width="42" height="30" rx="12" fill="#f8fafc" stroke="#334155" stroke-width="3"/><rect x="14" y="50" width="42" height="9" fill="${color}"/>
      <rect x="6" y="44" width="10" height="20" rx="5" fill="#f8fafc" stroke="#334155" stroke-width="3"/><rect x="54" y="44" width="10" height="20" rx="5" fill="#f8fafc" stroke="#334155" stroke-width="3"/>
      <rect x="18" y="68" width="13" height="12" rx="4" fill="${color}" stroke="#334155" stroke-width="3"/><rect x="39" y="68" width="13" height="12" rx="4" fill="${color}" stroke="#334155" stroke-width="3"/>
      <circle cx="35" cy="28" r="18" fill="#e2e8f0" stroke="#334155" stroke-width="3"/><circle cx="35" cy="28" r="12" fill="#1e3a8a"/><ellipse cx="30" cy="23" rx="4" ry="3" fill="#93c5fd"/>
      <circle cx="30" cy="31" r="1.8" fill="#fff"/><circle cx="40" cy="31" r="1.8" fill="#fff"/><path d="M30 35 Q35 39 40 35" stroke="#fff" stroke-width="2" fill="none"/>`));
    return d; }
  const steel='#9aa7b8', dark='#475569';
  function A(el,frames,o){ el.style.transformBox='view-box'; return el.animate(frames,Object.assign({fill:'forwards'},o)); }
  const DOORS=[
    {name:'Vault hatch', build(){
      const el=svg(400,400,`<circle cx="200" cy="200" r="195" fill="#1f2937"/><g id="sw"><circle cx="200" cy="200" r="180" fill="${steel}" stroke="${dark}" stroke-width="10"/>
        ${[...Array(12)].map((_,i)=>`<circle cx="${(200+160*Math.cos(i*Math.PI/6)).toFixed(1)}" cy="${(200+160*Math.sin(i*Math.PI/6)).toFixed(1)}" r="7" fill="${dark}"/>`).join('')}
        <g id="hdl"><rect x="190" y="70" width="20" height="260" rx="10" fill="#64748b"/><rect x="70" y="190" width="260" height="20" rx="10" fill="#64748b"/></g>
        <g id="dial"><circle cx="200" cy="200" r="70" fill="#cbd5e1" stroke="${dark}" stroke-width="6"/>${[...Array(24)].map((_,i)=>`<line x1="200" y1="135" x2="200" y2="${i%2?146:152}" stroke="${dark}" stroke-width="3" transform="rotate(${i*15} 200 200)"/>`).join('')}<circle cx="200" cy="200" r="16" fill="${dark}"/></g></g>`);
      return {el, run(){ const sw=el.querySelector('#sw'),dial=el.querySelector('#dial'),h=el.querySelector('#hdl');
        dial.style.transformOrigin='200px 200px'; h.style.transformOrigin='200px 200px'; sw.style.transformOrigin='10px 200px';
        A(dial,[{transform:'rotate(0deg)'},{transform:'rotate(-300deg)'},{transform:'rotate(-220deg)'}],{duration:600,easing:'ease-in-out'});
        A(h,[{transform:'rotate(0)'},{transform:'rotate(90deg)'}],{delay:550,duration:350,easing:'ease-in'});
        A(sw,[{transform:'perspective(900px) rotateY(0)'},{transform:'perspective(900px) rotateY(-100deg)',opacity:.15}],{delay:950,duration:750,easing:'cubic-bezier(.5,0,.3,1)'}); }}; }},
    {name:'Blast doors', build(){ const el=svg(400,400,`<rect width="400" height="400" rx="20" fill="#111827"/>
        <g id="L"><rect x="10" y="10" width="190" height="380" fill="#6b7280"/>${[...Array(8)].map((_,i)=>`<polygon points="10,${30+i*45} 60,${30+i*45} 30,${55+i*45} 10,${55+i*45}" fill="#facc15"/>`).join('')}<rect x="185" y="10" width="15" height="380" fill="#374151"/></g>
        <g id="R"><rect x="200" y="10" width="190" height="380" fill="#6b7280"/>${[...Array(8)].map((_,i)=>`<polygon points="390,${30+i*45} 340,${30+i*45} 370,${55+i*45} 390,${55+i*45}" fill="#facc15"/>`).join('')}<rect x="200" y="10" width="15" height="380" fill="#374151"/></g>
        <circle id="lamp" cx="200" cy="30" r="12" fill="#ef4444"/>`);
      return {el, run(){ A(el.querySelector('#lamp'),[{fill:'#ef4444'},{fill:'#22c55e'}],{delay:500,duration:60});
        A(el.querySelector('#L'),[{transform:'translateX(0)'},{transform:'translateX(4px)',offset:.15},{transform:'translateX(-205px)'}],{delay:600,duration:900,easing:'ease-in'});
        A(el.querySelector('#R'),[{transform:'translateX(0)'},{transform:'translateX(-4px)',offset:.15},{transform:'translateX(205px)'}],{delay:600,duration:900,easing:'ease-in'}); }}; }},
    {name:'Iris portal', build(){ const blades=[...Array(8)].map((_,i)=>`<g class="bl"><path d="M200 200 L200 15 A185 185 0 0 1 331 69 Z" fill="${i%2?'#7c8ba1':'#94a3b8'}" stroke="#334155" stroke-width="3" transform="rotate(${i*45} 200 200)"/></g>`).join('');
        const el=svg(400,400,`<circle cx="200" cy="200" r="198" fill="#0f172a"/><circle cx="200" cy="200" r="150" fill="#22d3ee" opacity=".35"/><g id="ir">${blades}</g><circle cx="200" cy="200" r="190" fill="none" stroke="#e2e8f0" stroke-width="10"/>`);
        return {el, run(){ const ir=el.querySelector('#ir'); ir.style.transformOrigin='200px 200px';
          A(ir,[{transform:'rotate(0) scale(1)'},{transform:'rotate(50deg) scale(1)',offset:.45},{transform:'rotate(160deg) scale(2.6)',opacity:0}],{delay:100,duration:1500,easing:'ease-in'}); }}; }},
    {name:'Cargo bay', build(){ const el=svg(400,400,`<defs><pattern id="hz" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="20" fill="#facc15"/><polygon points="0,20 20,0 40,0 20,20" fill="#111"/></pattern></defs>
        <rect width="400" height="400" rx="16" fill="#1f2937"/><g id="up">${[...Array(8)].map((_,i)=>`<rect x="20" y="${20+i*45}" width="360" height="42" fill="${i%2?'#9ca3af':'#a8b3c2'}" stroke="#4b5563" stroke-width="3"/>`).join('')}
        <rect x="20" y="360" width="360" height="20" fill="url(#hz)"/><text x="200" y="210" text-anchor="middle" font-size="44" font-weight="900" fill="#374151" font-family="Arial">BAY 5</text></g>`);
      return {el, run(){ A(el.querySelector('#up'),[{transform:'translateY(0)'},{transform:'translateY(6px)',offset:.12},{transform:'translateY(-400px)'}],{delay:500,duration:1100,easing:'ease-in'}); }}; }},
    {name:'Escape pod', build(){ const el=svg(400,400,`<rect width="400" height="400" rx="200" fill="#0b1224"/><g id="pod"><circle cx="200" cy="200" r="180" fill="#f1f5f9" stroke="#f97316" stroke-width="14"/>
        <circle cx="200" cy="170" r="70" fill="#1e3a8a" stroke="#64748b" stroke-width="10"/><ellipse cx="180" cy="150" rx="20" ry="12" fill="#93c5fd"/><text x="200" y="300" text-anchor="middle" font-size="30" font-weight="900" fill="#f97316" font-family="Arial">POD 3</text></g>`);
      return {el, run(){ const p=el.querySelector('#pod'); p.style.transformOrigin='200px 385px';
        A(p,[{transform:'perspective(900px) rotateX(0)'},{transform:'perspective(900px) rotateX(10deg)',offset:.2},{transform:'perspective(900px) rotateX(-95deg)',opacity:.1}],{delay:500,duration:1100,easing:'ease-in'}); }}; }},
    {name:'Reactor door', build(){ const el=svg(400,400,`<rect width="400" height="400" rx="20" fill="#0f172a"/><circle cx="200" cy="200" r="60" fill="#22d3ee"/><circle id="core" cx="200" cy="200" r="90" fill="#22d3ee" opacity=".35"/>
        <g id="T"><polygon points="10,10 390,10 390,170 230,200 170,200 10,170" fill="#475569" stroke="#94a3b8" stroke-width="6"/><text x="200" y="110" text-anchor="middle" font-size="34" font-weight="900" fill="#facc15" font-family="Arial">REACTOR</text></g>
        <g id="B"><polygon points="10,390 390,390 390,230 230,200 170,200 10,230" fill="#475569" stroke="#94a3b8" stroke-width="6"/></g>`);
      return {el, run(){ el.querySelector('#core').animate([{opacity:.2},{opacity:.85},{opacity:.3}],{duration:700,iterations:2});
        A(el.querySelector('#T'),[{transform:'translateY(0)'},{transform:'translateY(-235px)'}],{delay:650,duration:900,easing:'ease-in'});
        A(el.querySelector('#B'),[{transform:'translateY(0)'},{transform:'translateY(235px)'}],{delay:650,duration:900,easing:'ease-in'}); }}; }},
    {name:'Airlock', build(){ const el=svg(400,400,`<rect width="400" height="400" rx="30" fill="#334155"/><g id="door"><rect x="40" y="30" width="320" height="340" rx="40" fill="#cbd5e1" stroke="#64748b" stroke-width="8"/>
        <g id="wh"><circle cx="200" cy="210" r="80" fill="none" stroke="#ef4444" stroke-width="14"/>${[0,60,120].map(a=>`<rect x="195" y="130" width="10" height="160" fill="#ef4444" transform="rotate(${a} 200 210)"/>`).join('')}<circle cx="200" cy="210" r="20" fill="#7f1d1d"/></g>
        <rect x="150" y="60" width="100" height="40" rx="10" fill="#1e3a8a"/><text x="200" y="88" text-anchor="middle" font-size="20" font-weight="900" fill="#bfdbfe" font-family="Arial">AIRLOCK</text></g>`);
      return {el, run(){ const w=el.querySelector('#wh'), d=el.querySelector('#door'); w.style.transformOrigin='200px 210px'; d.style.transformOrigin='200px 200px';
        A(w,[{transform:'rotate(0)'},{transform:'rotate(270deg)'}],{duration:800,easing:'ease-in-out'});
        A(d,[{transform:'scale(1)',opacity:1},{transform:'scale(1.03)',offset:.2},{transform:'scale(2.4)',opacity:0}],{delay:800,duration:800,easing:'ease-in'}); }}; }}
  ];
  function play(opts){ opts=opts||{}; return new Promise(res=>{
    const stage=document.createElement('div'); stage.className='doorstage'; stage.setAttribute('role','status'); stage.setAttribute('aria-label',opts.label||'Door opening');
    const st=document.createElement('div'); st.className='stars2'; stage.appendChild(st);
    if(reduce()){ document.body.appendChild(stage); stage.animate([{opacity:0},{opacity:1},{opacity:0}],{duration:450}); setTimeout(()=>{stage.remove();res('fade');},460); return; }
    let i; do{ i=Math.floor(Math.random()*DOORS.length);}while(i===last && DOORS.length>1); last=i;
    if(opts.force!=null) i=opts.force;
    const d=DOORS[i].build(); const wrap=document.createElement('div'); wrap.className='door'; wrap.appendChild(d.el); stage.appendChild(wrap);
    const tc=document.createElement('div'); tc.className='tc'; tc.innerHTML=`${opts.bar||'MISSION STEP COMPLETE'}<div class="fill"></div>`; stage.appendChild(tc);
    const n=3+Math.floor(Math.random()*3);
    for(let k=0;k<n;k++){ const a=astronaut(COLORS[Math.floor(Math.random()*COLORS.length)]); stage.appendChild(a);
      if(k%2){ a.style.left='-80px'; a.style.top=(10+Math.random()*55)+'%'; a.animate([{transform:'translateX(0) rotate(-20deg)'},{transform:`translateX(${window.innerWidth+160}px) rotate(${200+Math.random()*200}deg)`}],{duration:1700+Math.random()*400,easing:'linear',fill:'forwards'}); }
      else { a.style.left=(8+k*20)+'%'; a.style.bottom='16%'; a.animate([{transform:'translateY(0)'},{transform:'translateY(-40px)'},{transform:'translateY(0)'}],{duration:500,iterations:3,delay:k*80}); } }
    document.body.appendChild(stage); window.Sound&&Sound.door();
    requestAnimationFrame(()=>d.run());
    const total=opts.duration||1850;
    setTimeout(()=>{ stage.animate([{opacity:1},{opacity:0}],{duration:220,fill:'forwards'}); setTimeout(()=>{stage.remove();res(DOORS[i].name);},230); }, total);
  });}
  return {play, count:DOORS.length, names:DOORS.map(d=>d.name), astronaut};
})();
