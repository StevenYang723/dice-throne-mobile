// Pure presentation events: never consume the battle RNG or modify rule state.
export const HERO_FX = {
  barbarian:['slash','#ffc28a'], 'moon-elf':['arrow','#b6e5ff'],
  pyromancer:['fire','#ff9c53'], 'shadow-thief':['shadow','#bc96ff'],
  monk:['pulse','#88ebcb'], paladin:['holy','#ffe7a1'], ninja:['slash','#c7adff'],
  treant:['pulse','#9add91'], gunslinger:['bullet','#ffd599'],
  samurai:['slash','#ff9d9d'], tactician:['barrage','#f3dd99'],
  huntress:['claw','#8ae5c9'], 'cursed-pirate':['barrage','#77e3cd'],
  artificer:['beam','#ffd28a'], seraph:['holy','#ffebbc'],
  'vampire-lord':['shadow','#ee92af'], thor:['lightning','#a1e8ff'],
  loki:['arcane','#b7ef8b'], 'black-panther':['claw','#ca9bff'],
  'black-widow':['bullet','#ff9a90'], 'captain-marvel':['beam','#ffe49a'],
  'spider-man':['web','#deedff'], 'scarlet-witch':['arcane','#ff82ac'],
  'doctor-strange':['arcane','#ffb66e']
};

export function battleEffects(before, after, action) {
  if (!before || !after) return [];
  const events = [], actor = before.active;
  if (action.type === 'roll') {
    events.push({kind:'roll', indices:before.locked.flatMap((locked,i)=>locked?[]:[i])});
  }
  if (action.type === 'defend' && after.pending?.defenseDice?.length) {
    events.push({kind:'roll', indices:after.pending.defenseDice.map((_,i)=>i)});
  }
  // A failed blind check or a changed dice pattern never produces a cast.
  if ((action.type === 'activate' || before.decision?.action.type === 'activate') && after.pending && !before.pending) {
    events.push({kind:'cast', player:actor, target:1-actor, hero:before.players[actor].hero,
      name:after.pending.name, ultimate:after.pending.type==='ultimate'});
  }
  const resolved = before.pending && !after.pending && after.lastAttack;
  if (resolved) {
    const attack = after.lastAttack;
    events.push({kind:attack.actualDamage>0?'hit':'block', player:attack.attacker,
      target:attack.defender, hero:before.players[attack.attacker].hero,
      ultimate:attack.type==='ultimate'});
  }
  after.players.forEach((p,i)=>{
    const prev=before.players[i], delta=p.hp-prev.hp;
    if (delta) events.push({kind:delta>0?'heal':'damage', player:i, amount:Math.abs(delta)});
    for (const [id,count] of Object.entries(p.tokens)) {
      const change=count-(prev.tokens[id]||0);
      if (change>0) events.push({kind:'status', player:i, id, amount:change});
    }
    if (JSON.stringify(prev.upgrades)!==JSON.stringify(p.upgrades)) events.push({kind:'upgrade',player:i});
  });
  if (before.phase!=='gameover' && after.phase==='gameover') events.push({kind:'finish',player:after.winner});
  return events;
}
