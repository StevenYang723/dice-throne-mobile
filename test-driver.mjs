import {dispatch as step,suggestedDecision} from './engine.mjs';
export function dispatch(s,a){
  s=step(s,a);let count=0;
  while(s.decision){if(++count>300)throw Error('Too many pending decisions');s=step(s,suggestedDecision(s));}
  if(s.responseHold)s=step(s,{type:'continueAI'});
  return s;
}
