import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {setHeroes,HEROES,hero,createGame,dispatch,suggestedDecision,die,rolls,abilities,card,context,availableTokens,heroActions,aiAction,canPlay} from './engine.mjs';
setHeroes(JSON.parse(fs.readFileSync(new URL('./rules.json',import.meta.url))).heroes);
function fixture(a='barbarian',b='moon-elf'){
 const s=createGame(a,b,{seed:123456});s.active=0;s.phase='main1';s.rollCount=1;s.dice=[1,2,3,4,5];
 for(const p of s.players){p.hand=[];p.tokens={};p.cp=2;p.used={};}return s;
}
function answer(s,values){const q=s.decision?.question;assert(q,'expected an explicit choice');return dispatch(s,{type:'decide',player:q.player,id:q.id,values:Array.isArray(values)?values:[values]});}
function finishChoices(s,policy=()=>null){let n=0;while(s.decision){assert(++n<300,'choice flow stalled');const v=policy(s.decision.question,s);s=v===null?dispatch(s,suggestedDecision(s)):answer(s,v);}return s;}
function seedFor(values){for(let seed=1;seed<200000;seed++){const s={seed};if(rolls(s,values.length).every((n,i)=>n===values[i]))return seed;}throw Error('seed not found');}
function activate(s,id,dice){const a=abilities(s.players[s.active]).find(a=>a.id===id);if(!dice){dice=a.requirement.straight?[1,2,3,4,a.requirement.straight===5?5:1]:Object.entries(a.requirement.symbols).flatMap(([symbol,n])=>Array(n).fill(hero(s.players[s.active].hero).faces.indexOf(symbol)+1));while(dice.length<5)dice.push(1);}s.phase='roll';s.dice=dice;s.rollCount=1;s=dispatch(s,{type:'declare',id});return dispatch(s,{type:'activate'});}
function incoming(a='samurai',b='huntress',damage=10,phase='damage'){
 const s=fixture(a,b);s.phase=phase;s.pending={...context(s).out,attacker:0,defender:1,name:'测试攻击',damage,extraDamage:0,extraPrevent:0,extraHalves:0,extraAvoid:false,defenseDice:[],defenseIndex:0,sourceDice:[1,2,3,4,5],vars:{},choices:{}};return s;
}
test('discard choice pauses, survives JSON reload, validates ownership and pays exactly once',()=>{
 let s=fixture('thor');s.players[0].hand=['six-it','getting-paid'];const original=structuredClone(s);
 s=dispatch(s,{type:'heroAction',player:0,id:'mjolnir'});assert.equal(s.decision.question.player,0);assert.deepEqual(s.players[0].hand,original.players[0].hand);
 assert.throws(()=>dispatch(s,{type:'roll'}),/完成当前选择/);assert.throws(()=>dispatch(s,{...suggestedDecision(s),player:1}),/不属于/);
 const snapshot=JSON.stringify(s);assert.throws(()=>answer(s,['99']),/合法选项/);assert.equal(JSON.stringify(s),snapshot);
 const resumed=answer(JSON.parse(snapshot),'1'),direct=answer(s,'1');assert.deepEqual(resumed,direct);assert.deepEqual(resumed.players[0].hand,['six-it']);assert.deepEqual(resumed.players[0].discard,['getting-paid']);assert.equal(resumed.players[1].hp,49);assert.deepEqual(original.players[0].hand,['six-it','getting-paid']);
 assert.deepEqual(answer(s,[]).players[0].hand,original.players[0].hand);
});
test('knockdown offers pay or skip, with no payment option when unaffordable',()=>{
 let s=fixture();s.players[0].tokens.knockdown=1;s=dispatch(s,{type:'startRoll'});assert.equal(answer(s,'no').phase,'main2');const paid=answer(s,'yes');assert.equal(paid.phase,'roll');assert.equal(paid.players[0].cp,0);
 s=fixture();s.players[0].cp=1;s.players[0].tokens.knockdown=1;s=dispatch(s,{type:'startRoll'});assert(!s.decision);assert.equal(s.phase,'main2');
});
test('honor asks one or two tokens and remains available after defense dice',()=>{
 let s=incoming('samurai','barbarian');s.players[0].tokens.honor=2;assert(availableTokens(s,0).includes('honor'));
 s=dispatch(s,{type:'token',player:0,id:'honor'});assert.deepEqual(s.decision.question.options.map(o=>o.value),['1','2']);
 const one=answer(s,'1'),two=answer(s,'2');assert.equal(one.players[0].tokens.honor,1);assert.equal(one.pending.extraDamage,1);assert.equal(two.pending.extraDamage,3);
});
test('ninjutsu six offers all three branches before defense and two afterwards',()=>{
 let s=incoming('ninja','barbarian',7,'boost');s.players[0].tokens.ninjutsu=1;s.seed=seedFor([6]);s=dispatch(s,{type:'token',player:0,id:'ninjutsu'});
 assert.equal(s.decision.question.options.length,3);assert.equal(answer(s,'poison').players[1].tokens['delayed-poison'],1);
 let late=incoming('ninja','barbarian');late.players[0].tokens.ninjutsu=1;late.seed=seedFor([6]);late=dispatch(late,{type:'token',player:0,id:'ninjutsu'});assert.equal(late.decision.question.options.length,2);assert(!late.decision.question.options.some(o=>o.value==='type'));
});
test('extra dice can be modified, then exact two dice are chosen without duplicate indices',()=>{
 let s=fixture('thor');s.players[0].hand=['six-it'];s.seed=seedFor([1,2,3]);s=activate(s,'chain-lightning');assert.match(s.decision.question.title,/额外骰/);
 s=answer(s,'card:six-it');assert.equal(s.players[0].cp,1);s=answer(s,'0');s=finishChoices(s,q=>q.title.includes('用于结算')?['0','1']:null);assert.equal(s.pending.damage,8);assert.equal(s.players[1].hp,48);assert.equal(s.players[0].discard.filter(x=>x==='six-it').length,1);
 let t=activate(fixture('thor'),'chain-lightning');assert.throws(()=>answer(t,['0','0']),/合法选项/);assert.throws(()=>answer(t,['0']),/合法选项/);
});
test('Thor may keep hammer on each optional opportunity, including ultimate',()=>{
 let s=activate(fixture('thor'),'bottled-lightning');assert.match(s.decision.question.title,/投掷雷锤/);s=answer(s,'no');assert.equal(s.players[1].hp,50);assert.equal(s.players[0].data.hammer,'home');
 let u=activate(fixture('thor'),'for-asgard');u=answer(u,'no');assert.equal(u.pending.type,'ultimate');assert.equal(u.pending.damage,14);
});
test('normal defense can be skipped; a defense cannot be silently settled',()=>{
 let s=incoming('barbarian','moon-elf',8,'defend');assert.throws(()=>dispatch(s,{type:'resolve'}),/跳过防御/);s=dispatch(s,{type:'skipDefense'});s=dispatch(s,{type:'resolve'});assert.equal(s.players[1].hp,42);
});
test('Nyra takes all damage for free, or any final split including more than her HP',()=>{
 let s=incoming();s.players[1].data.nyra=1;s.players[1].tokens['nyras-bond']=1;s=dispatch(s,{type:'resolve'});assert.equal(s.decision.question.player,1);
 const all=answer(s,'nyra');assert.equal(all.players[1].hp,50);assert.equal(all.players[1].data.nyra,0);assert.equal(all.players[1].tokens['nyras-bond'],1);
 s=answer(s,'split');assert(s.decision.question.options.some(o=>o.value==='8'));s=answer(s,'8');assert.equal(s.players[1].hp,48);assert.equal(s.players[1].tokens['nyras-bond'],0);
});
test('independent hammer damage offers receiver their own defensive choices',()=>{
 let s=fixture('thor','monk');s.players[0].hand=['six-it'];s.players[1].tokens.chi=3;s=dispatch(s,{type:'heroAction',player:0,id:'mjolnir'});s=answer(s,'0');assert.equal(s.decision.question.player,1);s=answer(s,'chi');s=answer(s,'1');assert.equal(s.players[1].hp,50);assert.equal(s.players[1].tokens.chi,2);
});
test('two half-prevention effects add after fixed reductions',()=>{
 let s=incoming('barbarian','paladin',9);s.pending.extraPrevent=3;s.pending.extraHalves=2;s=dispatch(s,{type:'resolve'});assert.equal(s.players[1].hp,50);
});
test('cleanse can consume another cleanse and cannot remove immutable tokens',()=>{
 let s=fixture('monk');s.players[0].tokens={cleanse:2,'cursed-doubloon':1,'blessing-of-divinity':1};s=dispatch(s,{type:'token',player:0,id:'cleanse'});assert.deepEqual(s.decision.question.options.map(o=>o.value),['0:cleanse']);s=answer(s,'0:cleanse');assert.equal(s.players[0].tokens.cleanse,0);assert.equal(s.players[0].tokens['cursed-doubloon'],1);
});
test('chosen-player rewards can be granted to the opponent',()=>{
 let s=activate(fixture('paladin'),'retaliate');s=answer(s,'1');s=finishChoices(s);assert.equal(s.players[1].tokens.retribution,1);assert.equal(s.players[0].cp,5);
});
test('ninja upgraded defense chooses a subset once per defense',()=>{
 let s=incoming('barbarian','ninja',8,'resolve');s.pending.defenseDice=[1,2,3];s.players[1].upgrades['shade-shift']={level:2};
 s=dispatch(s,{type:'heroAction',player:1,id:'ninja-reroll'});assert.equal(s.decision.question.max,2);s=answer(s,['0','2']);assert(!heroActions(s,1).some(a=>a.id==='ninja-reroll'));assert.equal(s.pending.defenseDice[1],2);
});
test('conjure chooses a real positive status and opponent chooses which card blocks it',()=>{
 let s=fixture('scarlet-witch','moon-elf');s.players[0].tokens.conjure=1;s.players[1].hand=['six-it','getting-paid'];s=dispatch(s,{type:'heroAction',player:0,id:'conjure'});s=answer(s,'copy');assert(s.decision.question.options.some(o=>o.value==='evasive'));assert(!s.decision.question.options.some(o=>o.value==='reality-warp'));s=answer(s,'evasive');assert.equal(s.decision.question.player,1);s=answer(s,'1');assert.deepEqual(s.players[1].hand,['six-it']);assert(!s.players[0].tokens.evasive);
});
test('illusion is arranged by defender and selected by attacker with concealed faces',()=>{
 let s=incoming('barbarian','loki');s.players[1].tokens.illusion=1;s=dispatch(s,{type:'token',player:1,id:'illusion'});assert.equal(s.decision.question.player,1);s=answer(s,['avoid','half','trick']);assert.equal(s.decision.question.player,0);assert(s.decision.question.options.every(o=>o.label.includes('牌背')));assert(!s.decision.question.options.some(o=>/伤害|诡计/.test(o.label)));s=answer(s,'0');assert(!s.decision);assert.equal(s.players[1].tokens.illusion,0);
});
test('probability manipulation only offers even dice and never seven',()=>{
 let s=fixture('scarlet-witch');s.phase='roll';s.dice=[1,3,5,6,2];s.players[0].tokens['probability-manipulation']=1;s=dispatch(s,{type:'heroAction',player:0,id:'probability'});assert.deepEqual(s.decision.question.options.map(o=>o.value),['3','4']);s=answer(s,'3');assert.deepEqual(s.decision.question.options.map(o=>o.value),['-1']);s=answer(s,'-1');assert.equal(s.dice[3],5);
});
test('ransom is opponent-only and asks that opponent to pay or reroll',()=>{
 let s=fixture('cursed-pirate');s.players[0].hand=['ransom'];s.phase='roll';assert(!canPlay(s,0,card(s.players[0],'ransom')));s.active=1;s=dispatch(s,{type:'play',player:0,id:'ransom'});s=answer(s,'4');assert.equal(s.decision.question.player,1);const paid=answer(s,'yes');assert.equal(paid.players[0].cp,3);assert.equal(paid.players[1].cp,0);assert.equal(paid.dice[4],5);
});
test('pirate accepts any count after extra dice, including only one of two',()=>{
 let s=fixture('cursed-pirate');s.seed=seedFor([6,6,1]);s=activate(s,'x-marks-the-spot');assert.match(s.decision.question.title,/金币数量/);assert.deepEqual(s.decision.question.options.map(o=>o.value),['0','1','2']);s=answer(s,'1');assert.equal(s.players[0].tokens['cursed-doubloon'],1);
});
test('upkeep order is selectable but mandatory effects cannot be skipped',()=>{
 let s=fixture();s.phase='main2';s.players[1].tokens={burn:1,poison:2};s=dispatch(s,{type:'endTurn'});assert.equal(s.decision.question.player,1);assert.match(s.decision.question.title,/维持效果/);assert.throws(()=>answer(s,[]),/合法选项/);s=answer(s,'poison');s=finishChoices(s);assert.equal(s.players[1].hp,46);assert.equal(s.phase,'main1');
});
test('bag of tricks uses creator ownership, even in a Loki mirror',()=>{
 let s=fixture('loki','loki');s.phase='main2';s.players[1].tokens['bag-of-tricks']=1;s.players[1].data.trickSources=[0];s.seed=seedFor([2]);s=dispatch(s,{type:'endTurn'});assert.equal(s.decision.question.player,0);assert.match(s.decision.question.title,/诡计袋/);s=answer(s,'cp');assert.equal(s.players[1].cp,4);assert.equal(s.players[1].tokens['bag-of-tricks'],0);assert.deepEqual(s.players[1].data.trickSources,[]);
});
test('cosmic ray chooses either result instead of forcing the higher die',()=>{
 let s=incoming('captain-marvel','barbarian',7,'boost');s.players[0].tokens['cosmic-ray']=1;s.players[0].data.freshRay=0;s.seed=seedFor([1,6]);s=dispatch(s,{type:'token',player:0,id:'cosmic-ray'});assert.equal(s.decision.question.options.length,2);s=answer(s,'0');assert.equal(s.pending.extraDamage,1);
});
test('gunslinger wins duel before selecting damage or prevention',()=>{
 let s=incoming('barbarian','gunslinger',8,'resolve');s.pending.defenseDice=[6];s.seed=seedFor([1]);s=dispatch(s,{type:'resolve'});assert.match(s.decision.question.title,/决斗/);assert(s.log.some(x=>x.text.includes('进攻方骰')));s=answer(s,'damage');assert.equal(s.pending.defenseResult.retaliate,3);
});
test('warm up choices are constrained by CP after prior effects',()=>{
 let s=fixture('pyromancer');s.players[0].hand=['warm-up'];s.players[0].cp=2;s=dispatch(s,{type:'play',player:0,id:'warm-up'});assert.equal(s.players[0].tokens['fire-mastery'],1);assert.deepEqual(s.decision.question.options.map(o=>o.value),['0','1','2']);s=answer(s,'2');assert.equal(s.players[0].cp,0);assert.equal(s.players[0].tokens['fire-mastery'],3);
});
test('monk upgraded combo awards one independent choice per lotus',()=>{
 let s=fixture('monk');s.players[0].upgrades['combo-strike']={level:2,ability:card(s.players[0],'combo-strike-2').ability};s.seed=seedFor([6,6]);s=activate(s,'combo-strike');s=answer(s,'evasive');s=answer(s,'cleanse');assert.equal(s.players[0].tokens.evasive,1);assert.equal(s.players[0].tokens.cleanse,1);assert(!s.players[0].data.extraOffensivePhase);
});
test('upgrade cards retain every selectable subability; all expanded boards execute',()=>{
 let count=0;
 for(const h of HEROES.filter(h=>h.playable!==false))for(const ca of h.cards.filter(c=>c.abilities?.length>1)){
  const base=fixture(h.id,'barbarian');base.players[0].upgrades[ca.upgrade]={level:ca.level,ability:ca.ability,abilities:ca.abilities};
  const board=abilities(base.players[0]);for(const a of ca.abilities){assert.deepEqual(board.find(b=>b.id===a.id)?.ops,a.ops,h.id+'/'+a.id);let s=activate(structuredClone(base),a.id);s=finishChoices(s);assert(s.players.every(p=>Number.isFinite(p.hp)&&Number.isFinite(p.cp)));count++;}
 }
 assert(count>60);console.log('Expanded upgrade abilities:',count);
});
test('AI never decides a human question or advances through a human response hold',()=>{
 let s=fixture('thor');s.players[0].hand=['six-it'];s=dispatch(s,{type:'heroAction',player:0,id:'mjolnir'});assert.equal(aiAction(s),null);s=answer(s,[]);s.active=1;s.phase='roll';s.rollCount=0;s.players[0].hand=['getting-paid'];s=dispatch(s,{type:'roll'});if(aiAction(s)?.type==='locks')s=dispatch(s,aiAction(s));assert.equal(s.responseHold,true);assert.equal(aiAction(s),null);s=dispatch(s,{type:'continueAI'});assert(aiAction(s));
});
test('Tithe II only offers legal straight subsets and requires a used Prayer die',()=>{
 let s=fixture('paladin');s.players[0].upgrades.tithe={level:2};s=activate(s,'holy-attack-small',[1,2,3,4,6]);assert(!s.decision);assert.equal(s.players[0].cp,2);
 let t=fixture('paladin');t.players[0].upgrades.tithe={level:2};t=activate(t,'holy-attack-small',[2,3,4,5,6]);assert.equal(t.decision.question.options.length,2);assert.equal(answer(t,'0').players[0].cp,2);assert.equal(answer(t,'1').players[0].cp,3);
});
test('tactical advantage overflow offers repeated legal spending before the gain',()=>{
 let s=fixture('tactician');s.players[0].tokens['tactical-advantage']=5;s=activate(s,'maneuver');assert.match(s.decision.question.title,/上限/);s=answer(s,'cp');s=finishChoices(s);assert.equal(s.players[0].cp,3);assert.equal(s.players[0].tokens['tactical-advantage'],5);
});
test('Purify can remove a selected enemy status or preserve all statuses',()=>{
 let s=fixture('seraph');s.players[1].tokens={poison:2,'cursed-doubloon':1};s=activate(s,'purify');s=answer(s,'foe');assert.deepEqual(s.decision.question.options.map(o=>o.value),['1:poison']);const keep=answer(s,[]),remove=answer(s,'1:poison');assert.equal(keep.players[1].tokens.poison,2);assert.equal(remove.players[1].tokens.poison,1);
});
