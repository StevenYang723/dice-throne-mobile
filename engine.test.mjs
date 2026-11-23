import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {setHeroes,HEROES,hero,createGame,dispatch,matches,abilities,bestAbility,chooseLocks,needsDefense,card,context,effect,value,canPlay,defenseOptions,aiAction} from './engine.mjs';
setHeroes(JSON.parse(fs.readFileSync(new URL('./rules.json',import.meta.url))).heroes);
function fixture(a='barbarian',b='moon-elf'){const s=createGame(a,b,{seed:123456});s.active=0;s.phase='roll';s.rollCount=1;s.dice=[1,1,1,4,6];return s}
function next(s){const p=s.players[s.active];switch(s.phase){case'main1':return{type:'startRoll'};case'roll':{if(!s.rollCount)return{type:'roll'};if(s.rollCount<s.rollLimit&&!(p.tokens.constrict&&p.cp<1)){const keep=chooseLocks(s);if(!keep.every(Boolean)){if(s.locked.some((x,i)=>x!==keep[i]))return{type:'locks',values:keep};return{type:'roll'}}}const a=bestAbility(s);return a?{type:'declare',id:a.id}:{type:'pass'}}case'response':return{type:'activate'};case'defend':return{type:needsDefense(s)?'defend':'resolve'};case'boost':return{type:'proceed'};case'damage':case'resolve':return{type:'resolve'};case'main2':return p.hand.length>6?{type:'sell',id:p.hand[0]}:{type:'endTurn'};default:throw Error(s.phase)}}
test('setup: 50 HP, maximum 60, 2 CP, four distinct opening cards',()=>{const s=createGame('barbarian','moon-elf',{seed:10});for(const p of s.players){assert.equal(p.hp,50);assert.equal(p.maxHp,60);assert.equal(p.cp,2);assert.equal(p.hand.length,4);assert.equal(new Set(p.hand).size,4)}});
test('straight requires consecutive distinct numbers; symbols differ from matching numbers',()=>{const p=fixture().players[0];assert.equal(matches(p,[1,2,3,4,4],{straight:4}),true);assert.equal(matches(p,[1,2,3,5,6],{straight:4}),false);assert.equal(matches(p,[1,2,3,4,5],{straight:5}),true);assert.equal(matches(p,[1,2,3,1,2],{symbols:{Sword:5}}),true);const c=context(fixture(),0,[1,2,3,1,2]);assert.equal(value(c,['kind',4]),false)});
test('locked dice stay fixed and a fourth roll is rejected atomically',()=>{let s=fixture();s.dice=[6,2,3,4,5];s=dispatch(s,{type:'lock',index:0});s=dispatch(s,{type:'roll'});assert.equal(s.dice[0],6);s=dispatch(s,{type:'roll'});const before=JSON.stringify(s);assert.throws(()=>dispatch(s,{type:'roll'}));assert.equal(JSON.stringify(s),before)});
test('ultimate ignores avoidance and defense; stun grants another offensive phase',()=>{let s=fixture();s.dice=[6,6,6,6,6];s.players[1].tokens.shadows=1;s=dispatch(s,{type:'declare',id:'rage'});s=dispatch(s,{type:'activate'});s=dispatch(s,{type:'proceed'});assert.equal(s.players[1].hp,35);assert.equal(s.phase,'roll');assert.equal(s.rollCount,0)});
test('concussion skips income and is consumed',()=>{let s=fixture();s.phase='main2';s.players[1].tokens.concussion=1;const hand=s.players[1].hand.length;s=dispatch(s,{type:'endTurn'});assert.equal(s.players[1].cp,2);assert.equal(s.players[1].hand.length,hand);assert.equal(s.players[1].tokens.concussion,0)});
test('healing caps at starting HP plus ten',()=>{const s=fixture();effect(context(s),[['heal',25]]);assert.equal(s.players[0].hp,60)});
test('every advertised base ability and defense executes with legal dice',()=>{for(const h of HEROES.filter(h=>h.playable!==false)){for(const a of h.abilities.filter(a=>!a.blocked)){let dice;if(a.requirement.straight)dice=[1,2,3,4,a.requirement.straight===5?5:1];else{dice=Object.entries(a.requirement.symbols).flatMap(([k,n])=>Array(n).fill(h.faces.indexOf(k)+1));while(dice.length<5)dice.push(1)}let s=fixture(h.id,'barbarian');s.dice=dice;s.players[0].tokens={};for(const t of h.statuses)s.players[0].tokens[t.id]=2;s=dispatch(s,{type:'declare',id:a.id});try{s=dispatch(s,{type:'activate'});if(s.phase==='boost')s=dispatch(s,{type:'proceed'});if(s.phase==='defend')s=dispatch(s,{type:needsDefense(s)?'defend':'resolve'});if(s.phase==='resolve')s=dispatch(s,{type:'resolve'});if(s.phase==='damage')s=dispatch(s,{type:'resolve'})}catch(e){throw Error(h.id+'/'+a.id+': '+e.message)}assert(s.players.every(p=>Number.isFinite(p.hp)&&p.hp>=0&&p.hp<=60))}const s=fixture('barbarian',h.id),c=context(s,1,[1,2,3,4,5].slice(0,h.defense.dice));effect(c,h.defense.ops)}});
test('all enabled hero matchups finish without invalid resource state',()=>{const list=HEROES.filter(h=>h.playable!==false);let runs=0;for(let i=0;i<list.length;i++){for(let j=0;j<list.length;j++){let s=createGame(list[i].id,list[j].id,{seed:1000+i*121+j});let steps=0;while(s.phase!=='gameover'&&steps++<2500){s=dispatch(s,next(s));assert(s.players.every(p=>p.hp>=0&&p.hp<=60&&p.cp>=0&&p.cp<=15));}assert.equal(s.phase,'gameover',`${list[i].id} vs ${list[j].id} stalled at ${s.phase} turn ${s.turn}`);runs++}}console.log('Finished matchups:',runs)});

// Card regression coverage: pays before resolving, no duplicate upgrades, and every enabled card's DSL runs.
test('every enabled card effect executes and all defense upgrades replace their board',()=>{
 for(const h of HEROES.filter(h=>h.playable!==false))for(const ca of h.cards){
  const s=fixture(h.id,'barbarian');s.phase='main1';s.players[0].cp=15;s.players[0].hand=[ca.id];s.players[0].tokens={};for(const t of h.statuses)s.players[0].tokens[t.id]=2;s.players[0].tokens.stun=0;
  if(ca.upgrade){const after=dispatch(s,{type:'play',id:ca.id});assert.equal(after.players[0].upgrades[ca.upgrade].level,ca.level);assert.equal(canPlay(after,0,ca),false);if(ca.ability.dice)assert(defenseOptions(after.players[0]).some(d=>d.id===ca.upgrade&&d.level===ca.level));}
  const c=context(s,0,[1,2,3,4,5]);try{effect(c,ca.ability?.ops||ca.ops)}catch(e){throw Error(h.id+'/'+ca.id+': '+e.message)}assert(s.players.every(p=>Number.isFinite(p.hp)&&Number.isFinite(p.cp)));
 }
});
test('defense damage retaliates; attacker retains control during attack modifications',()=>{
 let s=fixture('barbarian','moon-elf');s.dice=[1,1,1,1,1];s=dispatch(s,{type:'declare',id:'smack'});s=dispatch(s,{type:'activate'});s.players[1].tokens.evasive=1;assert.equal(aiAction(s),null);s=dispatch(s,{type:'proceed'});s=dispatch(s,{type:'defend'});s.pending.defenseDice=[1,1,1,1,1];s=dispatch(s,{type:'resolve'});const hp=s.players[0].hp;s=dispatch(s,{type:'resolve'});assert(s.players[0].hp<hp);
});
test('real AI completes matches with upgrades and token spending',()=>{
 const hs=HEROES.filter(h=>h.playable!==false);for(let i=0;i<hs.length;i++){let s=createGame(hs[(i+1)%hs.length].id,hs[i].id,{seed:10000+i}),n=0;
 while(s.phase!=='gameover'&&n++<2500){const action=aiAction(s)||next(s);try{s=dispatch(s,action)}catch(e){throw Error(hs[i].id+' '+s.phase+' '+JSON.stringify(action)+': '+e.message)}}assert.equal(s.phase,'gameover',hs[i].id+' AI stalled')}
});


test('heroes with unverified core rules cannot start a match on either side',()=>{
 for(const h of HEROES.filter(h=>h.playable===false)){assert.throws(()=>createGame(h.id,'barbarian'),/暂不可选/);assert.throws(()=>createGame('barbarian',h.id),/暂不可选/)}
});
