// Tiny synthesized sounds (no audio files). Respects mute.
window.Sound=(function(){
  let ctx=null;
  function ac(){ if(!ctx){ try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;} } if(ctx.state==='suspended') ctx.resume(); return ctx; }
  function muted(){ return localStorage.getItem('cmas.mute')==='1'; }
  function tone(f,dur,type,vol,when,slideTo){ if(muted()) return; const c=ac(); if(!c) return; const t=c.currentTime+(when||0);
    const o=c.createOscillator(), g=c.createGain(); o.type=type||'sine'; o.frequency.setValueAtTime(f,t); if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol||0.2,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t+dur+0.05); }
  function noise(dur,vol,when,freq){ if(muted()) return; const c=ac(); if(!c) return; const t=c.currentTime+(when||0);
    const b=c.createBuffer(1,Math.floor(c.sampleRate*dur),c.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
    const s=c.createBufferSource(); s.buffer=b; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq||2000; const g=c.createGain(); g.gain.value=vol||0.3;
    s.connect(f).connect(g).connect(c.destination); s.start(t); }
  return {
    click(){ noise(0.03,0.4,0,3500); },
    correct(){ tone(660,0.12,'triangle',0.22,0); tone(880,0.12,'triangle',0.22,0.1); tone(1320,0.25,'triangle',0.2,0.2); },
    wrong(){ tone(330,0.18,'sine',0.15,0,260); },
    star(){ tone(1568,0.15,'sine',0.12,0); tone(2093,0.2,'sine',0.1,0.08); },
    door(){ noise(0.03,0.5,0.05,4000); noise(0.03,0.5,0.25,4000); noise(0.03,0.5,0.45,4000);
      tone(90,0.35,'sine',0.5,0.6,45); noise(0.08,0.4,0.6,300); noise(0.7,0.18,0.85,900); tone(520,0.2,'triangle',0.12,1.5); tone(780,0.3,'triangle',0.12,1.62); },
    pause(){ tone(440,0.25,'sine',0.12,0); tone(392,0.35,'sine',0.12,0.25); }
  };
})();
