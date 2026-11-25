// Serializable, deterministic pauses. Resume replays one atomic action from its
// original seed with an answer tape, so costs, draws and dice never run twice.
class NeedChoice extends Error {
  constructor(question){super('等待选择');this.question=question;}
}
const copy=x=>JSON.parse(JSON.stringify(x));
export function choose(s,player,title,options,config={}){
  options=options.map(o=>typeof o==='object'?{...o,value:String(o.value)}:{value:String(o),label:String(o)});
  const min=config.min??1,max=config.max??1;
  if(!options.length)return [];
  const suggested=(config.suggested??options.slice(0,min).map(o=>o.value)).map(String);
  if(!s._choiceRun)return suggested; // Pure rule helpers used outside a dispatched action.
  const run=s._choiceRun,id=String(run.cursor++);
  const question={id,player,title,options,min,max,description:config.description||'',suggested};
  if(!run.answers[Number(id)])throw new NeedChoice(question);
  const answer=run.answers[Number(id)];
  if(answer.id!==id)throw Error('选择顺序已改变，请重新加载对局');
  const values=answer.values;
  if(!Array.isArray(values)||new Set(values).size!==values.length||values.length<min||values.length>max||values.some(v=>!options.some(o=>o.value===v)))throw Error(`请选择 ${min===max?min:min+'–'+max} 项合法选项`);
  return values;
}
export const pick=(s,player,title,options,config={})=>choose(s,player,title,options,config)[0];
export const yesNo=(s,player,title,description='',prefer=false)=>pick(s,player,title,[{value:'yes',label:'使用'},{value:'no',label:'跳过'}],{description,suggested:[prefer?'yes':'no']})==='yes';
export function suggestedDecision(s){
  const q=s.decision?.question;
  return q?{type:'decide',player:q.player,id:q.id,values:q.suggested}:null;
}
export function runAction(state,action,resolve){
  let base,original,answers;
  if(state.decision){
    if(action.type!=='decide')throw Error('请先完成当前选择，结算已暂停');
    const d=state.decision,q=d.question;
    if(String(action.id)!==q.id||(action.player??0)!==q.player)throw Error('当前选择不属于这名玩家');
    base=copy(d.base);original=copy(d.action);answers=[...copy(d.answers),{id:q.id,values:(action.values||[]).map(String)}];
  }else{
    if(action.type==='decide')throw Error('当前没有待处理的选择');
    base=copy(state);original=copy(action);answers=[];
  }
  const working=copy(base);delete working.decision;
  working._choiceRun={cursor:0,answers};
  try{
    const result=resolve(working,original);
    delete result._choiceRun;delete result._resolvingUltimate;
    return result;
  }catch(e){
    if(!(e instanceof NeedChoice))throw e;
    delete working._choiceRun;delete working._resolvingUltimate;
    working.decision={base,action:original,answers,question:e.question};
    return working;
  }
}
