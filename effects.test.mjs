import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {battleEffects,HERO_FX} from './effects-model.mjs';
import {HERO_ART} from './art.mjs';
import {setHeroes,createGame,dispatch,aiAction,bestAbility,needsDefense} from './engine.mjs';
const data=JSON.parse(await fs.readFile(new URL('./rules.json',import.meta.url),'utf8'));
setHeroes(data.heroes);
const state=()=>createGame('thor','loki',{seed:812});

test('all 24 official images and hero effect mappings exist; disabled heroes stay disabled',async()=>{
  assert.equal(Object.keys(HERO_ART).length,24);
  for(const h of data.heroes){
    assert.ok(HERO_FX[h.id]);assert.ok(HERO_ART[h.id]);
    const bytes=await fs.readFile(new URL(HERO_ART[h.id].file,import.meta.url));
    assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16),HERO_ART[h.id].width);
    assert.equal(bytes.readUInt32BE(20),HERO_ART[h.id].height);
  }
  assert.deepEqual(data.heroes.filter(h=>h.playable===false).map(h=>h.id).sort(),['artificer','black-widow','doctor-strange','treant','vampire-lord']);
});
test('reroll animates only unlocked dice; previews and failed activation never play an attack',()=>{
  const before=state();before.locked=[true,false,true,false,false];
  assert.deepEqual(battleEffects(before,structuredClone(before),{type:'roll'}),[{kind:'roll',indices:[1,3,4]}]);
  assert.deepEqual(battleEffects(before,structuredClone(before),{type:'declare'}),[]);
  assert.deepEqual(battleEffects(before,structuredClone(before),{type:'activate'}),[]);
});
test('cast and final impact are distinct; no damage is invented before settlement',()=>{
  const before=state(),after=structuredClone(before);
  after.pending={attacker:0,defender:1,name:'雷霆',type:'ultimate',damage:15};
  assert.deepEqual(battleEffects(before,after,{type:'activate'}),[{kind:'cast',player:0,target:1,hero:'thor',name:'雷霆',ultimate:true}]);
  const resolved=structuredClone(after);resolved.pending=null;
  resolved.lastAttack={...after.pending,actualDamage:15};resolved.players[1].hp-=15;
  assert.deepEqual(battleEffects(after,resolved,{type:'resolve'}).map(e=>e.kind),['hit','damage']);
  assert.equal(battleEffects(after,resolved,{type:'resolve'})[1].amount,15);
  assert.deepEqual(battleEffects(resolved,structuredClone(resolved),{type:'endTurn'}),[]);
});
test('blocked attacks, retaliation, healing and status gains use actual state changes',()=>{
  const before=state();before.pending={attacker:0,defender:1,damage:7,type:'normal'};
  const after=structuredClone(before);after.pending=null;after.lastAttack={...before.pending,actualDamage:0};
  after.players[0].hp-=2;after.players[1].hp+=3;after.players[1].tokens.poison=2;
  const events=battleEffects(before,after,{type:'resolve'});
  assert.deepEqual(events.map(e=>e.kind),['block','damage','heal','status']);
  assert.equal(events[1].amount,2);assert.equal(events[2].amount,3);assert.equal(events[3].amount,2);
});
test('observing every action leaves the seeded battle and AI outcome unchanged',()=>{
  let withFx=state(),withoutFx=state(),count=0;
  while(withFx.phase!=='gameover'&&count++<1500){
    const p=withFx.players[withFx.active];
    let action=aiAction(withFx);
    if(!action){
      const a=bestAbility(withFx);
      switch(withFx.phase){
        case'main1':action={type:'startRoll'};break;
        case'roll':action=withFx.rollCount<withFx.rollLimit?{type:'roll'}:a?{type:'declare',id:a.id}:{type:'pass'};break;
        case'response':action={type:'activate'};break;
        case'boost':action={type:'proceed'};break;
        case'defend':action={type:needsDefense(withFx)?'defend':'resolve'};break;
        case'resolve':case'damage':action={type:'resolve'};break;
        case'main2':action=p.hand.length>6?{type:'sell',id:p.hand[0]}:{type:'endTurn'};break;
        default:throw Error(withFx.phase);
      }
    }
    const before=withFx, snapshot=JSON.stringify(before);
    withFx=dispatch(withFx,action);const nextSnapshot=JSON.stringify(withFx);
    battleEffects(before,withFx,action);
    assert.equal(JSON.stringify(before),snapshot);assert.equal(JSON.stringify(withFx),nextSnapshot);
    withoutFx=dispatch(withoutFx,action);assert.deepEqual(withFx,withoutFx);
  }
  assert.ok(count>10,'exercised a meaningful sequence of battle actions');
  assert.equal(withFx.phase,'gameover');
});
