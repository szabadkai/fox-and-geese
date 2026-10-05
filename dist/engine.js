export const POINTS=[];
for(let y=0;y<7;y++)for(let x=0;x<7;x++)if((x>=2&&x<=4)||(y>=2&&y<=4))POINTS.push(y*7+x);
export const coords=p=>({x:p%7,y:Math.floor(p/7)});
const valid=new Set(POINTS);
export const adjacent=Object.fromEntries(POINTS.map(p=>{const{x,y}=coords(p);return[p,POINTS.filter(q=>{const b=coords(q),dx=Math.abs(x-b.x),dy=Math.abs(y-b.y);return q!==p&&Math.max(dx,dy)===1&&(!dx||!dy||(x+y)%2===0)})]}));
export const EDGES=POINTS.flatMap(p=>adjacent[p].filter(q=>q>p).map(q=>[p,q]));
export const initial=()=>({fox:24,geese:POINTS.filter(p=>coords(p).y>=4),side:'geese',turn:1,winner:null});
export const count=s=>s.geese.filter(p=>p>=0).length;
export function moves(s,from,captureOnly=false){
 const occupied=new Set(s.geese.filter(p=>p>=0));occupied.add(s.fox);
 const isFox=from===s.fox;if(!isFox&&!s.geese.includes(from))return[];
 const result=[];
 for(const to of adjacent[from]??[]){
  if(!occupied.has(to)&&!captureOnly&&(isFox||coords(to).y<=coords(from).y))result.push({from,to,capture:null});
  if(isFox&&s.geese.includes(to)){
   const a=coords(from),b=coords(to),x=2*b.x-a.x,y=2*b.y-a.y,end=y*7+x;
   if(x>=0&&x<7&&y>=0&&y<7&&valid.has(end)&&adjacent[to].includes(end)&&!occupied.has(end))result.push({from,to:end,capture:to});
  }
 }
 return result;
}
export function segment(s,m){const n={...s,geese:[...s.geese]};if(m.from===s.fox)n.fox=m.to;else n.geese[n.geese.indexOf(m.from)]=m.to;if(m.capture!==null)n.geese[n.geese.indexOf(m.capture)]=-1;if(count(n)<=5)n.winner='fox';return n;}
export function finish(s){const n={...s,side:s.side==='fox'?'geese':'fox',turn:s.turn+1};if(!n.winner&&n.side==='fox'&&!moves(n,n.fox).length)n.winner='geese';return n;}
export function turns(s){if(s.winner)return[];if(s.side==='geese')return s.geese.filter(p=>p>=0).flatMap(p=>moves(s,p).map(m=>[m]));const out=[];
 function expand(st,path){out.push(path);if(st.winner)return;for(const m of moves(st,st.fox,true))expand(segment(st,m),[...path,m]);}
 for(const m of moves(s,s.fox)){if(m.capture===null)out.push([m]);else expand(segment(s,m),[m]);}return out;}
export function applyTurn(s,path){let n=s;for(const m of path)n=segment(n,m);return n.winner?n:finish(n);}
function evaluate(s){if(s.winner)return s.winner==='fox'?100000:-100000;const fm=moves(s,s.fox);if(!fm.length)return-100000;const f=coords(s.fox),living=s.geese.filter(p=>p>=0);let isolation=0,progress=0;for(const p of living){if(!adjacent[p].some(q=>living.includes(q)))isolation++;progress+=6-coords(p).y;}const avg=living.reduce((a,p)=>a+coords(p).y,0)/living.length;
 return (13-living.length)*160+fm.length*9+fm.filter(m=>m.capture!==null).length*22+isolation*6-progress*1.8+(f.y>avg?22:0)-Math.abs(f.x-3)*2;}
export function choose(s,level='medium'){
 const root=turns(s);if(!root.length)return null;
 if(level==='easy'){if(Math.random()<.42)return root[Math.floor(Math.random()*root.length)];return root.map(path=>({path,v:evaluate(applyTurn(s,path))+(Math.random()-.5)*60})).sort((a,b)=>s.side==='fox'?b.v-a.v:a.v-b.v)[0].path;}
 const deadline=performance.now()+(level==='hard'?900:300),maxDepth=level==='hard'?4:2;let best=root[0];const cache=new Map();
 function ordered(st){return turns(st).map(path=>({path,n:applyTurn(st,path)})).map(a=>({...a,v:evaluate(a.n)})).sort((a,b)=>st.side==='fox'?b.v-a.v:a.v-b.v).slice(0,st.side==='geese'?(level==='hard'?16:12):32);}
 function search(st,d,alpha,beta){if(performance.now()>deadline)throw Error('time');if(d===0||st.winner)return evaluate(st);const key=st.fox+'|'+st.geese.filter(p=>p>=0).sort((a,b)=>a-b).join(',')+'|'+st.side+'|'+d;if(cache.has(key))return cache.get(key);const list=ordered(st);if(!list.length)return evaluate(st);let v=st.side==='fox'?-Infinity:Infinity,cut=false;for(const a of list){const score=search(a.n,d-1,alpha,beta);v=st.side==='fox'?Math.max(v,score):Math.min(v,score);if(st.side==='fox')alpha=Math.max(alpha,v);else beta=Math.min(beta,v);if(beta<=alpha){cut=true;break;}}if(!cut)cache.set(key,v);return v;}
 const options=ordered(s);for(let depth=1;depth<=maxDepth;depth++){let candidate=best,value=s.side==='fox'?-Infinity:Infinity;try{for(const a of options){const v=search(a.n,depth-1,-Infinity,Infinity);if(s.side==='fox'?v>value:v<value){value=v;candidate=a.path;}}best=candidate;}catch{break;}}return best;
}
