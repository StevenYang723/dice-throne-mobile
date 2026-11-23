// Display-only translation. Rule IDs, dice symbols and executable operations stay unchanged.
export const SYMBOL_NAMES = {
  Sword:'剑',Life:'心',Pow:'力量',Arrow:'箭',Foot:'足迹',Moon:'月',Flame:'火焰',Blaze:'烈火','Fiery Soul':'火魂',Meteor:'陨石',Dagger:'匕首',Bag:'钱袋',Card:'卡牌',Shadow:'暗影',Fist:'拳',Palm:'掌',Zen:'禅',Lotus:'莲',Helmet:'头盔',Prayer:'祈祷',Ninjato:'忍刀',Shuriken:'手里剑',Mask:'面具',Branch:'树枝',Leaf:'树叶',Spirit:'精灵',Bullet:'子弹',Dash:'疾行',Bullseye:'靶心',Katana:'武士刀',Kabuto:'战盔','Rising Sun':'旭日',Saber:'军刀',Flag:'旗帜',Medal:'勋章',Spear:'长矛',Claw:'利爪','Bonded Soul':'羁绊之魂','Saber Tooth':'剑齿',Cutlass:'弯刀',Booty:'宝藏',Skull:'骷髅',Wrench:'扳手',Gear:'齿轮',Bolt:'闪电',Blade:'圣刃',Wings:'羽翼',Cross:'十字','Angelic Pendant':'天使吊坠',Gaze:'凝视',Droplet:'血滴',Hammer:'雷锤',Worthy:'神力',Thunder:'雷霆',Scepter:'权杖',Illusion:'幻象',Lies:'谎言',Mischief:'诡计',Slash:'爪击',Vibranium:'振金',Panther:'黑豹',Batons:'警棍',Espionage:'谍报',Widow:'寡妇',Photon:'光子',Ascend:'升空','Hala Star':'哈拉之星',Thwip:'挥拳',Web:'蛛网',Spider:'蜘蛛',Warp:'扭曲',Chaos:'混沌',Spell:'法术',Crown:'王冠',Mandala:'法阵',Tome:'法典',Mantle:'披风',Amulet:'护符'
};
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const escapeHTML = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const resource = new Set(['fire-mastery','chi','ninjutsu','tactical-advantage','synth','blood-power','electrokinesis','kinetic-energy','covert-ops','probability-manipulation']);
const harmful = new Set(['concussion','stun','blind','entangle','targeted','knockdown','burn','poison','delayed-poison','barbed-vine','bounty','shame','constrict','bleed','powder-keg','wither','parlay','nanite','blinding-light','spellbound','time-bomb','webbed','reality-warp','crimson-bands']);
const special = new Set(['cursed-doubloon','bag-of-tricks','conjure','premonition','deja-vu','mesmerize','illusion']);
export function statusTone(id){return resource.has(id)?'resource':harmful.has(id)?'harmful':special.has(id)?'special':'beneficial'}
let terms = new Map(), termPattern=null, marks=new Map(), markPattern=null;
const displayFields = new Set(['name','text','description','label','effects','rules','special','gaps','notes','summary','reason']);

export function configureLanguage(heroes){
  terms = new Map(Object.entries({...SYMBOL_NAMES,CP:'战斗点',AI:'电脑',FAQ:'常见问题解答',ReRolled:'重掷版','Quick Draw':'快速拔枪',Bushido:'武士道','Roll Attempt':'投骰机会','Roll Attempts':'投骰机会',Nyra:'奈拉',"Nyra’s Bond":'奈拉羁绊',"Nyra's Bond":'奈拉羁绊',Active:'活跃',Downed:'倒下',Stun:'眩晕',Nanobot:'纳米机器人','Shock Bot':'电击机器人','Heal Bot':'治疗机器人',On:'出现','energy-absorption':'能量吸收','red-room-training':'红房训练',tithe:'什一奉献',Carducopia:'卡牌丰收','Shadow Dance':'暗影之舞'}).map(([k,v])=>[k.toLowerCase(),v]));
  marks = new Map();
  for(const h of heroes){
    for(const t of h.statuses||[]){terms.set(t.id.toLowerCase(),t.name);marks.set(t.name,t.id)}
    for(const a of [...h.abilities,...(h.reverseAbilities||[]),h.defense,...(h.defense?.choices||[])]){
      if(a?.id&&a.name&&!/[a-z]/i.test(a.name)){terms.set(a.id.toLowerCase(),a.name);if(a.slotId)terms.set(a.slotId.toLowerCase(),a.name)}
    }
  }
  // Common Chinese aliases used across editions remain consistent in the interface.
  for(const [name,id] of Object.entries({'锁定':'targeted','净化之力':'cleanse','神恩':'blessing-of-divinity','眩目':'blinding-light','耀斑':'cosmic-flare','射线':'cosmic-ray','炸弹':'time-bomb','奈拉的羁绊':'nyras-bond'}))marks.set(name,id);
  termPattern=new RegExp('(?<![A-Za-z])('+[...terms.keys()].sort((a,b)=>b.length-a.length).map(escapeRegex).join('|')+')(?![A-Za-z])','gi');
  markPattern=new RegExp([...marks.keys()].sort((a,b)=>b.length-a.length).map(escapeRegex).join('|'),'g');
}

export function chinese(input){
  let s=String(input??'');
  if(s==='Carducopia requires real deck/hand implementation.')return '卡牌丰收需要牌库与手牌结算支持。';
  if(s==='Shadow Dance round-up derives global rounding rule; verify in official general rules.')return '暗影之舞的伤害取整需按官方通用规则核对。';
  s=s.replace(/cards\.copies=1/g,'每张牌暂按一张记录');
  if(termPattern)s=s.replace(termPattern,x=>terms.get(x.toLowerCase())??x);
  return s.replace(/ceil\(([^()]*)\)/g,'（$1，向上取整）').replace(/floor\(([^()]*)\)/g,'（$1，向下取整）')
    .replace(/\s+III\b/g,'·三级').replace(/\s+II\b/g,'·二级').replace(/\s+I\b/g,'·一级');
}

export function localizeHeroes(heroes){
  configureLanguage(heroes);
  function visit(v,key=''){
    if(typeof v==='string')return displayFields.has(key)?chinese(v):v;
    if(Array.isArray(v))return v.map(x=>visit(x,key));
    if(!v||typeof v!=='object')return v;
    return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,['ops','prepareOps','castOps','requirement','sources','specialOps','dslNotes','opsContract'].includes(k)?x:visit(x,k)]));
  }
  return heroes.map(h=>{
    const out=visit(h);
    for(const c of [...out.cards,...(out.referenceUpgrades||[])])if(c.upgrade&&c.ability){
      const base=c.ability.name||chinese(c.upgrade);
      c.name=base.replace(/·[一二三]级$/,'')+'·'+({1:'一级',2:'二级',3:'三级'}[c.level]||`等级${c.level}`);
    }
    return out;
  });
}

export function richText(input){
  const text=escapeHTML(chinese(input));
  return markPattern?text.replace(markPattern,name=>`<strong class="status-word status-${statusTone(marks.get(name))}">${name}</strong>`):text;
}
