import {choose,pick,yesNo} from './choice-flow.mjs?v=0.4.0';
let hero,card,cardCost,cardList,status,negative,abilities,rolls,die,random,log,gain,cp,heal,hurt,context,effect,faces,canPlay,spendToken,availableTokens;
export function installInteractions(api){({hero,card,cardCost,cardList,status,negative,abilities,rolls,die,random,log,gain,cp,heal,hurt,context,effect,faces,canPlay,spendToken,availableTokens}=api)}

export const playerLabel=(s,i)=>`${i===0?'你':'电脑'} · ${hero(s.players[i].hero).name}`;
export const diceOptions=ds=>ds.map((d,i)=>({value:String(i),label:`第 ${i+1} 颗 · ${d} 点`}));
export function selectDice(s,i,ds,title,count=1,optional=false){
  return choose(s,i,title,diceOptions(ds),{min:optional?0:count,max:count,description:`当前骰子：${ds.join(' · ')}`,suggested:ds.map((d,index)=>({d,index})).sort((a,b)=>b.d-a.d).slice(0,count).map(o=>String(o.index))}).map(Number);
}
export const removable=id=>status(id).removable!==false&&!['blessing-of-divinity','cursed-doubloon','cosmic-ray'].includes(id);
export const transferable=id=>status(id).transferable!==false&&!['blessing-of-divinity','cursed-doubloon','cosmic-ray','holy-presence','illusion','spellbound','vibranium-suit','combo','invisibility'].includes(id);
export function chooseStatus(s,i,title,{players=[i],optional=false,transfer=false,exclude=[]}={}){
  const options=players.flatMap(owner=>Object.entries(s.players[owner].tokens).filter(([id,n])=>n>0&&(transfer?transferable(id):removable(id))&&!exclude.includes(id)).map(([id,n])=>({value:`${owner}:${id}`,label:`${playerLabel(s,owner)} · ${status(id).name} ×${n}`})));
  if(!options.length)return null;
  const answer=choose(s,i,title,options,{min:optional?0:1,max:1,suggested:optional?[]:[options[0].value]})[0];
  if(!answer)return null;
  const split=answer.indexOf(':');return {player:Number(answer.slice(0,split)),id:answer.slice(split+1)};
}
export function discardChoice(s,i,title,optional=false){
  const p=s.players[i];if(!p.hand.length)return null;
  const values=choose(s,i,title,p.hand.map((id,index)=>({value:String(index),label:card(p,id)?.name||id,detail:card(p,id)?.text||card(p,id)?.effects?.join(' ')||'技能升级'})),{min:optional?0:1,max:1,suggested:optional?[]:[String(p.hand.map((id,index)=>({index,cost:card(p,id)?.cost||0})).sort((a,b)=>a.cost-b.cost)[0].index)]});
  if(!values.length)return null;
  const id=p.hand.splice(Number(values[0]),1)[0];p.discard.push(id);log(s,`${hero(p.hero).name}弃掉「${card(p,id)?.name||id}」`,'card');return id;
}
export function effectChoice(c,key,fallback){
  if(/^acceptDoubloon/.test(key))return fallback??1;
  if(c.source?.id==='ransom'&&key==='die')return 0;
  if(c.choices[key]!==undefined)return c.choices[key];
  const spec=[...(c.source?.choices||[]),...(c.source?.optionChoices||[])].find(q=>q.id===key&&!q.dice);
  if(!spec)return fallback??0;
  let options=spec.options;
  if(spec.type==='number'){
    let max=spec.max??5;
    if(key==='spendFire')max=Math.min(max,c.p.tokens['fire-mastery']||0);
    if(key==='warmCP')max=Math.min(max,c.p.cp);
    if(key==='removeDoubloons')max=Math.min(max,c.p.tokens['cursed-doubloon']||0);
    options=Array.from({length:Math.max(0,max-(spec.min||0)+1)},(_,j)=>({value:j+(spec.min||0),label:String(j+(spec.min||0))}));
  }
  if(!options?.length)return fallback??0;
  const chosen=pick(c.s,c.index,spec.label||spec.name||'选择效果',options,{suggested:[String(options.some(o=>String(o.value)===String(spec.default))?spec.default:options[0].value)]});
  const original=options.find(o=>String(o.value)===chosen)?.value;
  c.choices[key]=original;return original;
}
export function grantTarget(c,id,n=1,optional=false){
  const answers=choose(c.s,c.index,`选择获得${status(id).name}的玩家`,c.s.players.map((_,i)=>({value:String(i),label:playerLabel(c.s,i)})),{min:optional?0:1,max:1,suggested:[String(c.index)]});
  if(answers.length)gain(c.s,c.s.players[Number(answers[0])],id,n);
}
export function assignSpellbound(c,n){
  const list=[...new Map(abilities(c.foe).filter(a=>a.type!=='ultimate'&&!a.blocked).map(a=>[a.slotId||a.id,a])).values()];
  const current=c.foe.data.spellbound||[];
  const remaining=list.filter(a=>!current.includes(a.slotId||a.id));
  const count=Math.min(n,Math.max(0,remaining.length-1));if(!count)return;
  const selected=choose(c.s,c.index,`封咒：选择 ${count} 个技能`,remaining.map(a=>({value:a.slotId||a.id,label:a.name,detail:(a.effects||[]).join(' ')})),{min:count,max:count,description:'至少保留一个可用的非终极进攻技能。',suggested:remaining.slice(0,count).map(a=>a.slotId||a.id)});
  c.foe.data.spellbound=[...current,...selected];gain(c.s,c.foe,'spellbound',selected.length);
}
export function distribute(c,id,n){
  for(let j=0;j<n;j++){
    const eligible=c.s.players.map((p,i)=>({p,i})).filter(({p})=>(p.tokens[id]||0)<(status(id).limit??99));
    if(!eligible.length)break;
    const target=Number(pick(c.s,c.index,`${status(id).name}：分配第 ${j+1}/${n} 枚`,eligible.map(({p,i})=>({value:String(i),label:`${playerLabel(c.s,i)} · 已有 ${p.tokens[id]||0} 枚`})),{suggested:[String(eligible.some(x=>x.i===1-c.index)?1-c.index:eligible[0].i)]}));
    c.s._tokenSource=c.index;gain(c.s,c.s.players[target],id,1);delete c.s._tokenSource;
  }
}
export function mjolnir(c,n,mode='choice'){
  for(let k=0;k<n;k++){
    const home=(c.p.data.hammer||'home')==='home';
    if((home&&mode==='retrieve')||(!home&&mode==='throw'))break;
    if(mode==='choice'&&!yesNo(c.s,c.index,home?'投掷雷锤？':'收回雷锤？',`第 ${k+1}/${n} 次机会。${home?'对手受到 1 独立伤害。':'获得 1 电能。'}`,true))break;
    if(home){c.p.data.hammer='away';hurt(c.s,c.foe,1);log(c.s,'投掷雷锤：1 独立不可防御伤害','ability')}
    else{c.p.data.hammer='home';gain(c.s,c.p,'electrokinesis',1)}
  }
}

export function rollWindow(c,ds,title='额外骰',owner=c.index){
  if(!c.s._choiceRun)return ds;
  let passes=0,who=owner,steps=0;
  while(passes<2&&steps++<40){
    const p=c.s.players[who],options=[{value:'done',label:'保留结果，继续结算'}];
    const rollPhase=['roll','response','boost','defend','resolve','damage'].includes(c.s.phase);
    const forbidden=p.tokens.stun||((c.s.pending?.type==='ultimate'||c.s._resolvingUltimate)&&who!==c.s.active);
    if(!forbidden){
      for(const id of p.hand){const ca=card(p,id);
        if((!ca?.targetDice&&ca?.id!=='ransom')||ca.defenseOnly||p.cp<cardCost(p,ca)||ca.upgrade)continue;
        if(ca.phase!=='instant'&&!(ca.phase==='roll'&&rollPhase))continue;
        if(ca.opponentDice||ca.id==='ransom'?owner===who:!ca.anyDice&&owner!==who)continue;
        if((ca.secondDice||ca.copyDice)&&ds.length<2)continue;
        options.push({value:'card:'+id,label:`打出「${ca.name}」 · ${cardCost(p,ca)} 战斗点`,detail:ca.text||ca.effects?.join(' ')});
      }
      if(who===owner){
        if(p.tokens['probability-manipulation']&&ds.some(d=>d%2===0))options.push({value:'probability',label:'消耗概率操纵：偶数骰 ±1'});
        if(p.hero==='paladin'&&p.cp>=1)options.push({value:'tithe',label:'什一奉献：支付 1 战斗点重掷一骰'});
        if(p.tokens['tactical-advantage'])options.push({value:'tactical',label:'消耗战术优势：重掷一骰'});
      }
    }
    if(options.length===1){passes++;who=1-who;continue;}
    const action=pick(c.s,who,`${title}：响应掷骰结果`,options,{description:`${playerLabel(c.s,owner)}的骰子：${ds.join(' · ')}。选择合法改骰效果，或保留结果。`,suggested:['done']});
    if(action==='done'){passes++;who=1-who;continue;}
    passes=0;
    if(action==='probability'){
      const i=Number(pick(c.s,who,'概率操纵：选择偶数骰',diceOptions(ds).filter(o=>ds[Number(o.value)]%2===0)));
      const delta=Number(pick(c.s,who,'选择调整方向',[{value:-1,label:`减为 ${ds[i]-1}`},...(ds[i]<6?[{value:1,label:`加为 ${ds[i]+1}`}]:[])]));
      gain(c.s,p,'probability-manipulation',-1);ds[i]+=delta;
    }else if(action==='tithe'||action==='tactical'){
      const [i]=selectDice(c.s,who,ds,'选择要重掷的骰子');
      if(action==='tithe')cp(p,-1);else gain(c.s,p,'tactical-advantage',-1);
      ds[i]=die(c.s);
    }else{
      const ca=card(p,action.slice(5));
      cp(p,-cardCost(p,ca));p.hand.splice(p.hand.indexOf(ca.id),1);p.discard.push(ca.id);
      const cc=context(c.s,who,ds);cc.choices={};cc.source=ca;cc.diceOwner=owner;
      prepareDiceCard(cc,ca);
      effect(cc,ca.ops);log(c.s,`${hero(p.hero).name}对额外骰使用「${ca.name}」`,'card');
    }
    log(c.s,`${title}调整为：${ds.join(' · ')}`,'roll');who=1-who;
  }
  return ds;
}
export function rollExtra(c,n,title='额外骰',owner=c.index){
  const ds=rolls(c.s,n);log(c.s,`${playerLabel(c.s,owner)}${title}：${ds.join(' · ')}`,'roll');
  return rollWindow(c,ds,title,owner);
}
export function prepareDiceCard(c,ca){
  if(!ca.targetDice||ca.rerollTwice||ca.rerollMany||ca.id==='helping-hand')return;
  const ds=c.dice,[index]=selectDice(c.s,c.index,ds,'选择要修改的骰子');c.choices.die=index;
  if(ca.secondDice||ca.copyDice){c.choices.die2=Number(pick(c.s,c.index,ca.copyDice?'选择来源骰':'选择第二颗骰子',diceOptions(ds).filter(o=>Number(o.value)!==index)));}
  if(ca.chooseValue)c.choices.value=Number(pick(c.s,c.index,'选择目标点数',[1,2,3,4,5,6],{suggested:['6']}));
  if(ca.secondDice)c.choices.value2=Number(pick(c.s,c.index,'选择第二颗的目标点数',[1,2,3,4,5,6],{suggested:['6']}));
  if(ca.chooseDelta)c.choices.delta=Number(pick(c.s,c.index,'选择调整方向',[...(ds[index]>1?[{value:-1,label:`减为 ${ds[index]-1}`}]:[]),...(ds[index]<6?[{value:1,label:`加为 ${ds[index]+1}`}]:[])]));
}
export function sequentialReroll(c,max=2){
  for(let j=0;j<max;j++){
    const selected=choose(c.s,c.index,`选择第 ${j+1} 次重掷的骰子`,diceOptions(c.dice),{min:j?0:1,max:1,description:j?`第一次结果：${c.dice.join(' · ')}。可选择同一颗、另一颗，或不再重掷。`:'先选择一颗骰子，看到结果后再决定下一次。',suggested:j?[]:['0']});
    if(!selected.length)break;
    c.dice[Number(selected[0])]=die(c.s);log(c.s,`重掷结果：${c.dice.join(' · ')}`,'roll');
  }
}
export function spiderReroll(c){
  const pd=c.s.pending;if(!pd||!c.p.tokens.invisibility)return;
  if(!yesNo(c.s,c.index,'蜘蛛感应：消耗隐形追加投骰？',`防御骰：${c.dice.join(' · ')}。追加一次投骰机会，可保留任意骰。`,!c.dice.some(d=>faces(c.p)[d-1]==='Spider')))return;
  const selected=choose(c.s,c.index,'选择蜘蛛感应重掷的骰子',diceOptions(c.dice),{min:0,max:c.dice.length,suggested:c.dice.map((d,i)=>({d,i})).filter(o=>faces(c.p)[o.d-1]!=='Spider').map(o=>String(o.i))});
  gain(c.s,c.p,'invisibility',-1);selected.forEach(i=>c.dice[Number(i)]=die(c.s));
  rollWindow(c,c.dice,'蜘蛛感应追加防御骰');log(c.s,`蜘蛛感应最终防御骰：${c.dice.join(' · ')}`,'roll');
}
export function illusionChoice(c,pd){
  const order=choose(c.s,c.index,'幻象：秘密排列三张牌',[{value:'avoid',label:'避免全部伤害'},{value:'half',label:'防止一半伤害'},{value:'trick',label:'攻击者获得诡计袋'}],{min:3,max:3,description:'按点击顺序放在第一、第二、第三张；攻击者只能看到牌背。',suggested:['avoid','half','trick'].sort(()=>0)});
  // Shuffle the AI arrangement before asking the human attacker; never reveal it in the question.
  if(c.index===1)for(let i=order.length-1;i>0;i--){const j=Math.floor(random(c.s)*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const selected=Number(pick(c.s,pd.attacker,'选择一张幻象牌',[{value:0,label:'第一张 · 牌背'},{value:1,label:'第二张 · 牌背'},{value:2,label:'第三张 · 牌背'}],{description:'对方已暗排三张幻象牌，选定后翻开结算。',suggested:[String(Math.floor(random(c.s)*3))]}));
  const result=order[selected];if(result==='avoid')pd.extraAvoid=true;else if(result==='half')pd.extraHalves++;else {c.s._tokenSource=c.index;gain(c.s,c.s.players[pd.attacker],'bag-of-tricks',1);delete c.s._tokenSource;}
  log(c.s,`幻象翻开：${{avoid:'避免全部伤害',half:'防止一半伤害',trick:'攻击者获得诡计袋'}[result]}`,'ability');
}
export function conjure(c){
  const mode=pick(c.s,c.index,'召唤：选择效果',[{value:'copy',label:'获得一枚正面状态',detail:'从任一在场英雄的说明板选择，对手可以弃一张手牌阻止。'},{value:'warp',label:'对手获得现实扭曲'}],{suggested:['warp']});
  if(mode==='warp'){gain(c.s,c.foe,'reality-warp',1);return;}
  const positives=[...new Map(c.s.players.flatMap(p=>hero(p.hero).statuses).filter(t=>t.kind?t.kind==='positive':!negative.has(t.id)&&!['reality-warp','wither','blinding-light','cursed-doubloon','cosmic-ray','holy-presence','parlay','powder-keg','fire-mastery'].includes(t.id)).map(t=>[t.id,t])).values()];
  const id=pick(c.s,c.index,'召唤：选择正面状态',positives.map(t=>({value:t.id,label:t.name,detail:t.rules})));
  if(!id)return;
  const blocked=discardChoice(c.s,1-c.index,`弃一张手牌阻止召唤「${status(id).name}」？`,true);
  if(!blocked)gain(c.s,c.p,id,1);else log(c.s,'对手弃牌阻止了召唤','ability');
}
export function nyraAllocation(s,pd,damage){
  const p=s.players[pd.defender];if(p.hero!=='huntress'||p.data.nyraDown||p.tokens.stun||pd.type==='ultimate'||damage<=0)return damage;
  const options=[{value:'hunter',label:`猎手承受全部 ${damage} 伤害`},{value:'nyra',label:`奈拉承受全部 ${damage} 伤害`,detail:`奈拉当前 ${p.data.nyra} 生命；溢出伤害不会传给猎手。`}];
  if(p.tokens['nyras-bond'])options.push({value:'split',label:'消耗奈拉羁绊，自选分摊数量'});
  const mode=pick(s,pd.defender,'选择本次攻击的伤害分配',options,{description:'防御和伤害修正已结算，按最终伤害分配。',suggested:[p.hp<=damage?'nyra':'hunter']});
  let taken=0;
  if(mode==='nyra')taken=damage;
  if(mode==='split'){
    taken=Number(pick(s,pd.defender,'奈拉承受多少伤害？',Array.from({length:damage+1},(_,n)=>({value:n,label:`奈拉 ${n} · 猎手 ${damage-n}`})),{suggested:[String(Math.max(0,damage-p.hp+1))]}));
    gain(s,p,'nyras-bond',-1);
  }
  if(taken){p.data.nyra=Math.max(0,p.data.nyra-taken);p.data.nyraDown=p.data.nyra===0;log(s,`奈拉承受 ${taken} 伤害，猎手承受 ${damage-taken} 伤害`,'damage');}
  return damage-taken;
}

export function instantWindow(s,first,title='即时响应'){
  if(!s._choiceRun||s._instantDepth)return;
  s._instantDepth=true;
  try{
    let passes=0,i=first,steps=0;
    while(passes<2&&steps++<60){
      const p=s.players[i],locked=p.tokens.stun||((s.pending?.type==='ultimate'||s._resolvingUltimate)&&i!==s.active);
      const options=[{value:'done',label:'不再响应，继续结算'}];
      if(!locked){
        for(const id of p.hand){const ca=card(p,id);if(ca?.phase==='instant'&&!ca.targetDice&&canPlay(s,i,ca))options.push({value:'card:'+id,label:`${ca.name} · ${cardCost(p,ca)} 战斗点`,detail:ca.text||ca.effects?.join(' ')});}
        if(p.tokens.cleanse&&Object.entries(p.tokens).some(([id,n])=>n>(id==='cleanse'?1:0)&&removable(id)))options.push({value:'cleanse',label:'使用净化，移除自身状态'});
        if(p.hero==='paladin'&&p.cp>=(p.upgrades.tithe?2:3))options.push({value:'tithe',label:`什一奉献：支付 ${p.upgrades.tithe?2:3} 战斗点抽牌`});
      }
      if(options.length===1){passes++;i=1-i;continue;}
      const action=pick(s,i,title,options,{description:'当前效果暂停，完成合法即时响应后继续。',suggested:['done']});
      if(action==='done'){passes++;i=1-i;continue;}passes=0;
      if(action==='cleanse')spendToken(s,i,'cleanse');
      else if(action==='tithe'){cp(p,p.upgrades.tithe?-2:-3);const cc=context(s,i);effect(cc,[['draw',1]]);}
      else{
        const ca=card(p,action.slice(5));cp(p,-cardCost(p,ca));p.hand.splice(p.hand.indexOf(ca.id),1);p.discard.push(ca.id);
        const cc=context(s,i);cc.source=ca;cc.choices={};effect(cc,ca.ops);
        if(s.pending){s.pending.extraPrevent+=cc.out.prevent;s.pending.extraHalves+=cc.out.halves;s.pending.extraAvoid||=cc.out.avoid;s.pending.extraDamage+=cc.out.damage;}
        log(s,`${hero(p.hero).name}即时打出「${ca.name}」`,'card');
      }
      i=1-i;
    }
  }finally{delete s._instantDepth;}
}
export function independentDamage(s,p,amount){
  if(!s._choiceRun||!amount||p.tokens.stun||s._resolvingUltimate||s.pending?.type==='ultimate')return amount;
  const i=s.players.indexOf(p),c=context(s,i);let damage=amount,steps=0;
  while(damage>0&&steps++<40){
    const options=[{value:'take',label:`承受 ${damage} 点伤害`}];
    for(const id of ['chi','evasive','smoke-bomb','protect','vibranium-suit'])if(p.tokens[id])options.push({value:id,label:`消耗${status(id).name} · 现有 ${p.tokens[id]} 枚`});
    for(const id of p.hand){const ca=card(p,id);if((ca?.window==='incomingDamage'||ca?.id==='not-this-time')&&!ca.targetDice&&p.cp>=cardCost(p,ca)&&(ca.phase==='instant'||['roll','defense'].includes(ca.phase)&&['roll','response','boost','defend','resolve','damage'].includes(s.phase)))options.push({value:'card:'+id,label:'打出「'+ca.name+'」',detail:ca.text});}
    if(options.length===1)break;
    const id=pick(s,i,'选择如何处理传入伤害',options,{description:'这次伤害单独结算；可以保留状态，或选择合法的减伤效果。',suggested:['take']});
    if(id==='take')break;
    if(id.startsWith('card:')){
      const ca=card(p,id.slice(5));cp(p,-cardCost(p,ca));p.hand.splice(p.hand.indexOf(ca.id),1);p.discard.push(ca.id);
      const cc=context(s,i);cc.source=ca;cc.choices={};effect(cc,ca.ops);damage=cc.out.avoid?0:Math.max(0,damage-cc.out.prevent-Math.ceil(amount/2)*cc.out.halves);log(s,`${hero(p.hero).name}使用「${ca.name}」响应伤害`,'card');
    }else if(id==='chi'){
      const n=Number(pick(s,i,'选择消耗的气数量',Array.from({length:Math.min(p.tokens.chi,damage)},(_,j)=>j+1)));
      gain(s,p,id,-n);damage-=n;
    }else{
      gain(s,p,id,-1);
      if(id==='protect')damage=Math.max(0,damage-Math.ceil(amount/2));
      else if(id==='vibranium-suit')damage=Math.max(0,damage-3);
      else if(rollExtra(c,1,status(id).name+'检定')[0]<=(id==='evasive'?2:3))damage=0;
    }
  }
  return Math.max(0,damage);
}
export function beforeGain(s,p,id,n){
  if(!s._choiceRun||n<=0||p.tokens.stun||s._resolvingUltimate&&s.players.indexOf(p)!==s.active)return;
  const cap=p.data[id+'Limit']??status(id).limit??99;
  if((p.tokens[id]||0)+n<=cap)return;
  const i=s.players.indexOf(p);
  if(id==='tactical-advantage'){
    while((p.tokens[id]||0)+n>cap&&p.tokens[id]){
      const options=[{value:'keep',label:'不使用，超出上限的部分丢弃'},{value:'cp',label:'消耗 1：获得 1 战斗点'}];
      if(p.tokens[id]>=3)options.push({value:'draw',label:'消耗 3：抽一张牌'},{value:'target',label:'消耗 3：对手获得瞄准'});
      if(p.tokens[id]>=4)options.push({value:'protect',label:'消耗 4：指定玩家获得保护'});
      const action=pick(s,i,'战术优势将超过上限：先使用已有标记？',options,{description:`将获得 ${n} 枚，上限 ${cap}。`,suggested:['keep']});
      if(action==='keep')break;
      gain(s,p,id,-(action==='cp'?1:action==='protect'?4:3));
      if(action==='cp')cp(p,1);else if(action==='draw')effect(context(s,i),[['draw',1]]);else if(action==='target')gain(s,s.players[1-i],'targeted',1);else grantTarget(context(s,i),'protect');
    }
    return;
  }
  if(s.pending&&['chi','ninjutsu','smoke-bomb'].includes(id)){
    // Reuse the same legal token action; no new use window is invented.
    const defending=s.pending.defender===i&&['defend','resolve','damage'].includes(s.phase);
    const attacking=s.pending.attacker===i&&['boost','defend','resolve','damage'].includes(s.phase);
    if((defending&&['chi','smoke-bomb'].includes(id))||(attacking&&['chi','ninjutsu'].includes(id))){
      while((p.tokens[id]||0)+n>cap&&availableTokens(s,i).includes(id)){
        if(!yesNo(s,i,`${status(id).name}将超过上限，先使用已有标记？`,`本次将获得 ${n} 枚，上限 ${cap}。跳过后超出部分丢弃。`))break;
        spendToken(s,i,id);
      }
    }
  }else if(s._cast?.owner===i&&!['pure','collateral'].includes(s._cast.type)&&['chi','ninjutsu'].includes(id)&&p.tokens[id]){
    if(id==='chi'&&(p.data.chiAtStart||0)>0){
      const count=Number(pick(s,i,'获得气之前，消耗多少旧气增伤？',Array.from({length:Math.min(p.tokens.chi,p.data.chiAtStart)+1},(_,j)=>j),{suggested:['0']}));
      gain(s,p,id,-count);p.data.chiAtStart-=count;s._cast.out.damage+=count;
    }else if(id==='ninjutsu'&&yesNo(s,i,'获得忍术前先使用一枚已有忍术？','可在获得新标记前腾出位置。')){
      gain(s,p,id,-1);const c=context(s,i),d=rollExtra(c,1,'忍术检定')[0];
      if(d<6)s._cast.out.damage+=d<=3?1:2;
      else{const mode=pick(s,i,'忍术 6 点：选择效果',[{value:'damage',label:'伤害 +2'},{value:'poison',label:'对手获得延时毒'},{value:'type',label:'攻击不可防御'}]);if(mode==='damage')s._cast.out.damage+=2;else if(mode==='poison')gain(s,s.players[1-i],'delayed-poison',1);else s._cast.out.type='undefendable';}
    }
  }
}
export function upkeepChoices(s,first=false){
  const i=s.active,p=s.players[i];s.phase='upkeep';p.used={};p.data.freshRay=0;p.data.useCombo=false;p.data.webbedTriggered=!!p.tokens.webbed;
  p.data.shadowsAtStart=!!p.tokens.shadows;p.data.vineDamage=0;
  const tasks=[];const add=(id,label,ok)=>{if(ok)tasks.push({value:id,label})};
  add('nyra','奈拉恢复',p.hero==='huntress'&&p.data.nyraDown);
  add('pirate','诅咒形态：4 伤害',p.hero==='cursed-pirate'&&p.data.flipped);
  add('reload','快速拔枪：获得装填',p.hero==='gunslinger');
  for(const id of ['cosmic-flare','cursed-doubloon','powder-keg','bag-of-tricks','holy-presence','burn','poison','fire-mastery','bleed'])add(id,`${status(id).name} · ${p.tokens[id]||0} 枚`,p.tokens[id]&&(id!=='cursed-doubloon'||p.hero!=='cursed-pirate'));
  s._upkeepCollect=[0,0];
  while(tasks.length){
    instantWindow(s,i,'维持阶段：即时响应');
    const id=tasks.length===1?tasks[0].value:pick(s,i,'选择下一项维持效果',tasks,{description:'所有仍适用的维持效果都必须结算；你决定顺序，阶段伤害最后合并。'});
    tasks.splice(tasks.findIndex(t=>t.value===id),1);const c=context(s,i),n=p.tokens[id]||0;
    if(id==='nyra'){if(p.data.nyra>=5)p.data.nyraDown=false;else p.data.nyra++;}
    else if(id==='pirate')hurt(s,p,4);
    else if(id==='reload')gain(s,p,'reload',1);
    else if(id==='cosmic-flare'&&n){hurt(s,s.players[1-i],n);gain(s,p,id,-1);}
    else if(id==='cursed-doubloon'&&n)hurt(s,p,n);
    else if(id==='holy-presence'&&n)hurt(s,s.players[1-i],n);
    else if(id==='burn'&&n)hurt(s,p,2);
    else if(id==='poison'&&n)hurt(s,p,n);
    else if(id==='fire-mastery'&&n)gain(s,p,id,-1);
    else if(id==='bleed')for(let j=0;j<n;j++){if(rollExtra(c,1,'流血检定')[0]<=4)hurt(s,p,1);else gain(s,p,id,-1);}
    else if(id==='powder-keg'&&n){
      const d=rollExtra(c,1,'火药桶检定')[0];
      if(d<=2){gain(s,p,id,-1);const collect=s._upkeepCollect;delete s._upkeepCollect;hurt(s,p,3);s._upkeepCollect=collect;}
      else if(d===6){const targets=choose(s,i,'火药桶：选择转移目标',s.players.map((_,j)=>({value:j,label:playerLabel(s,j)})),{min:0,max:1,description:'可以保留火药桶，也可以选择一名玩家。',suggested:[String(1-i)]});if(targets.length&&Number(targets[0])!==i){gain(s,p,id,-1);gain(s,s.players[Number(targets[0])],id,1);}}
    }else if(id==='bag-of-tricks')for(let j=0;j<n;j++){
      const source=p.data.trickSources?.[0]??(p.hero==='loki'?i:1-i);gain(s,p,id,-1);const d=rollExtra(c,1,'诡计袋检定')[0];
      if(d===1)cp(p,-1);else if(d===6)cp(p,2);else{
        const choice=pick(s,source,'诡计袋：选择持有者受到的效果',[{value:'heal',label:`${playerLabel(s,i)}治疗 2`},{value:'cp',label:`${playerLabel(s,i)}获得 1 战斗点`},{value:'damage',label:`${playerLabel(s,i)}受到 2 伤害`}],{suggested:[source===i?'heal':'damage']});
        if(choice==='heal')heal(s,p,2);else if(choice==='cp')cp(p,1);else hurt(s,p,2);
      }
    }
    log(s,`维持效果已结算：${id==='nyra'?'奈拉恢复':id==='pirate'?'诅咒形态':status(id).name}`);
  }
  const damage=s._upkeepCollect;delete s._upkeepCollect;
  for(let j=0;j<2;j++)if(damage[j])hurt(s,s.players[j],damage[j]);
  if(s.players.some(p=>p.hp===0))return;
  p.data.chiAtStart=p.tokens.chi||0;
  if(!first){if(p.tokens.concussion){gain(s,p,'concussion',-1);log(s,'脑震荡：跳过本次收入阶段');}else{cp(p,1);effect(context(s,i),[['draw',1]]);log(s,`${hero(p.hero).name}收入：+1 战斗点，抽 1 牌`);}}
}
