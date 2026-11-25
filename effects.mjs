import {battleEffects,HERO_FX} from './effects-model.mjs?v=0.4.0';

// A single, bounded canvas stays outside the rerendered game UI.
// Particle randomness is cosmetic and independent of the deterministic rules.
export function createBattleEffects({statusName,statusTone}) {
  const layer=document.querySelector('#fx-layer'), canvas=layer.querySelector('canvas');
  const ctx=canvas.getContext('2d'), media=matchMedia('(prefers-reduced-motion: reduce)');
  let enabled=true, frame=0, particles=[], trails=[], animations=new Set(), width=0, height=0;
  try { enabled=localStorage.getItem('dice-throne-fx')!=='off'; } catch {}
  const colors={beneficial:'#91e3c4',resource:'#f5cf83',harmful:'#ffaaa4',special:'#d0bcff'};
  const active=()=>enabled&&!media.matches&&!document.hidden&&!!ctx;
  const point=i=>{
    const el=document.querySelector(`[data-combatant="${i}"]`);
    if(!el) return null;
    const r=el.getBoundingClientRect();
    // Keep feedback visible even when a long skill board has been scrolled.
    return {x:Math.max(40,Math.min(innerWidth-40,r.left+r.width/2)),
      y:Math.max(75,Math.min(innerHeight-70,r.top+r.height/2)),el};
  };
  function resize(){
    width=innerWidth;height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx?.setTransform(dpr,0,0,dpr,0,0);
  }
  function clear(){
    cancelAnimationFrame(frame);frame=0;particles=[];trails=[];
    animations.forEach(a=>a.cancel());animations.clear();
    layer.querySelectorAll('.fx-float,.fx-banner').forEach(el=>el.remove());
    ctx?.clearRect(0,0,width,height);layer.classList.remove('active');
  }
  function animate(el,keys,options){
    if(!active()||!el?.animate)return;
    const a=el.animate(keys,options);animations.add(a);
    a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;
  }
  function label(text,p,color,kind='float',offset=0){
    if(!p||!enabled||document.hidden)return;
    // Reduced motion still receives a short, stationary, readable result.
    const el=document.createElement('div');el.className=`fx-${kind}`;
    el.textContent=text;el.style.setProperty('--fx-color',color);
    el.style.left=`${Math.max(96,Math.min(innerWidth-96,p.x))}px`;
    el.style.top=`${Math.max(76,Math.min(innerHeight-58,p.y+offset))}px`;
    if(layer.querySelectorAll('.fx-float,.fx-banner').length>=10) layer.querySelector('.fx-float,.fx-banner')?.remove();
    layer.append(el);
    if(!active()){setTimeout(()=>el.remove(),1100);return;}
    const a=animate(el,[{opacity:0,transform:'translate(-50%,10px) scale(.88)'},
      {opacity:1,transform:'translate(-50%,-4px) scale(1)',offset:.17},
      {opacity:1,transform:'translate(-50%,-18px)',offset:.7},
      {opacity:0,transform:'translate(-50%,-32px)'}],{duration:kind==='banner'?1300:1150,easing:'ease-out',fill:'forwards'});
    a?.finished.catch(()=>{}).finally(()=>el.remove());
  }
  function spark(p,color,count=22){
    if(!p||!active())return;
    const now=performance.now();
    for(let i=0;i<count;i++){
      const angle=Math.random()*Math.PI*2,speed=25+Math.random()*90;
      particles.push({x:p.x,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-20,
        size:1+Math.random()*3,color,start:now,life:380+Math.random()*400});
    }
    particles=particles.slice(-110);start();
  }
  function trail(from,to,kind,color,ultimate=false){
    if(!from||!to||!active())return;
    const nodes=Array.from({length:11},(_,i)=>({x:from.x+(to.x-from.x)*i/10+(i&&i<10?(Math.random()-.5)*60:0),y:from.y+(to.y-from.y)*i/10}));
    trails.push({from,to,kind,color,ultimate,nodes,start:performance.now(),life:ultimate?1000:760});
    trails=trails.slice(-5);start();
  }
  function start(){if(!frame&&active()){resize();layer.classList.add('active');frame=requestAnimationFrame(draw);}}
  function line(points,color,lineWidth=2){ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
  function ring(p,r,color){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(0,r),0,Math.PI*2);ctx.stroke();}
  function draw(now){
    frame=0;if(!active()){clear();return;}ctx.clearRect(0,0,width,height);
    trails=trails.filter(t=>now-t.start<t.life);
    for(const t of trails){
      const k=(now-t.start)/t.life, p={x:t.from.x+(t.to.x-t.from.x)*Math.min(1,k*2.4),y:t.from.y+(t.to.y-t.from.y)*Math.min(1,k*2.4)};
      ctx.save();ctx.globalAlpha=Math.sin(Math.PI*k);ctx.shadowColor=t.color;ctx.shadowBlur=12;
      if(t.kind==='lightning'){
        line(t.nodes,t.color,t.ultimate?7:4);line(t.nodes,'#effcff',1.5);
      }else if(['slash','claw'].includes(t.kind)){
        for(let j=0;j<(t.kind==='claw'?3:2);j++){
          const d=j*18-18;line([{x:t.to.x-65+d,y:t.to.y-35},{x:t.to.x+55+d,y:t.to.y+40}],t.color,Math.max(1,(1-k)*9));
        }
      }else if(t.kind==='web'){
        for(let j=0;j<8;j++){const a=j*Math.PI/4;line([t.to,{x:t.to.x+Math.cos(a)*70*k,y:t.to.y+Math.sin(a)*70*k}],t.color,1.5);}
        [20,40,60].forEach(r=>ring(t.to,r*k,t.color));line([t.from,t.to],t.color,2);
      }else if(t.kind==='holy'||t.kind==='pulse'||t.kind==='arcane'||t.kind==='shield'){
        [1,.66,.35].forEach(v=>ring(t.to,(28+65*k)*v,t.color));
        if(t.kind==='holy'||t.kind==='shield'){
          line([{x:t.to.x-27,y:t.to.y-25},{x:t.to.x,y:t.to.y-36},{x:t.to.x+27,y:t.to.y-25},{x:t.to.x+23,y:t.to.y+10},{x:t.to.x,y:t.to.y+35},{x:t.to.x-23,y:t.to.y+10},{x:t.to.x-27,y:t.to.y-25}],t.color,3);
        }else{
          const star=Array.from({length:7},(_,i)=>({x:t.to.x+Math.cos(i*Math.PI/3+k)*50,y:t.to.y+Math.sin(i*Math.PI/3+k)*50}));line(star,t.color,2);
        }
      }else if(t.kind==='beam'){
        line([t.from,t.to],t.color,16*(1-k)+2);line([t.from,t.to],'#fff6d3',3);
      }else if(t.kind==='arrow'){
        line([t.from,p],t.color,2);const a=Math.atan2(t.to.y-t.from.y,t.to.x-t.from.x);
        line([{x:p.x-Math.cos(a-.5)*18,y:p.y-Math.sin(a-.5)*18},p,{x:p.x-Math.cos(a+.5)*18,y:p.y-Math.sin(a+.5)*18}],t.color,3);
      }else{
        // Fire, shadow and gunfire have distinct sizes, colours and trails.
        const fire=t.kind==='fire',bullet=['bullet','barrage'].includes(t.kind);
        line([t.from,p],t.color,fire?9:bullet?3:14);
        ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(p.x,p.y,fire?13:bullet?4:18,0,Math.PI*2);ctx.fill();
        if(t.kind==='barrage')[-18,18].forEach(dx=>line([{x:t.from.x+dx,y:t.from.y},{x:p.x+dx,y:p.y}],t.color,2));
      }
      if(k>.35)ring(t.to,(k-.35)*110,t.color);
      if(t.ultimate){ring(t.to,40+100*k,'#ffe5aa');ring(t.to,30+72*k,t.color);}
      ctx.restore();
    }
    particles=particles.filter(p=>now-p.start<p.life);
    for(const p of particles){const elapsed=(now-p.start)/1000,fade=1-(now-p.start)/p.life;ctx.globalAlpha=fade;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x+p.vx*elapsed,p.y+p.vy*elapsed+25*elapsed*elapsed,p.size*fade,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    if(particles.length||trails.length)frame=requestAnimationFrame(draw);else layer.classList.remove('active');
  }
  function play(before,after,action){
    if(!enabled||document.hidden)return;
    let offsets=[0,0];
    for(const e of battleEffects(before,after,action)){
      const p=point(e.player),target=point(e.target),[kind,color]=HERO_FX[e.hero]||['pulse','#f5cf83'];
      if(e.kind==='roll'){
        const dice=document.querySelectorAll('.dice-section .die');
        e.indices.forEach((i,j)=>animate(dice[i],[{transform:'perspective(400px) translateY(-15px) rotateX(145deg) rotateZ(-12deg)',opacity:.45},{transform:'perspective(400px) translateY(0) rotateX(0deg) rotateZ(0)',opacity:1}],{duration:480,delay:j*35,easing:'cubic-bezier(.2,.8,.3,1)'}));
      }else if(e.kind==='cast'){
        label((e.ultimate?'终极技能 · ':'')+e.name,{x:innerWidth/2,y:Math.min(p?.y||250,target?.y||250)+90},color,'banner');
        trail(p,target,kind,color,e.ultimate);spark(p,color,e.ultimate?40:16);
      }else if(e.kind==='hit'){
        trail(p,target,kind,color,e.ultimate);spark(target,color,e.ultimate?44:26);
      }else if(e.kind==='block'){
        trail(target,target,'shield','#a5d9ff');label('成功抵挡',target,'#b8e6ff','float',-32);
      }else if(e.kind==='damage'||e.kind==='heal'){
        const healing=e.kind==='heal',c=healing?'#91e3c4':'#ffb4a5';
        label(`生命 ${healing?'+':'−'}${e.amount}`,p,c,'float',offsets[e.player]);offsets[e.player]+=30;
        spark(p,c,healing?18:12);
        if(healing)trail(p,p,'pulse',c);
        else animate(p?.el,[{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:260});
      }else if(e.kind==='status'){
        label(`${statusName(e.id)} +${e.amount}`,p,colors[statusTone(e.id)]||colors.special,'float',offsets[e.player]);offsets[e.player]+=29;
        const token=document.querySelector(`[data-combatant="${e.player}"] [data-token="${e.id}"]`);
        animate(token,[{transform:'scale(1.18)',filter:'brightness(1.8)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:600});
      }else if(e.kind==='upgrade'){
        label('技能升级',p,'#f5cf83');spark(p,'#f5cf83',28);
      }else if(e.kind==='finish'&&e.player===0){spark({x:innerWidth/2,y:innerHeight/3},'#ffe7a6',75);}
    }
  }
  addEventListener('resize',()=>{if(frame)resize()},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
  media.addEventListener('change',clear);
  return {play,clear,get enabled(){return enabled},get reduced(){return media.matches},toggle(){enabled=!enabled;clear();try{localStorage.setItem('dice-throne-fx',enabled?'on':'off')}catch{}return enabled}};
}
