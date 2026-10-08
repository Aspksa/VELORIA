'use strict';
(() => {
const W=128,H=128,T=16,KEY='veloria-save-v3',canvas=document.querySelector('#world'),ctx=canvas.getContext('2d'),stats=document.querySelector('#stats'),details=document.querySelector('#details'),log=document.querySelector('#log');
ctx.imageSmoothingEnabled=false;
let world,paused=false,speed=1,selected=null,cam={x:W/2,y:H/2,zoom:2},keys=new Set(),drag=null,last=0,acc=0,autosave=0;
const names=['Ари','Лира','Тор','Мира','Эл','Рин','Вея','Нор','Кай','Эйла','Сан','Юна','Лео','Ива'];
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function random(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296}}
function generate(seed){const r=random(seed),terrain=[];for(let y=0;y<H;y++){let row=[];for(let x=0;x<W;x++){const v=Math.sin(x*.095+seed)*.19+Math.cos(y*.083)*.20+Math.sin((x+y)*.035)*.13+(r()-.5)*.32;row.push(v<-.24?0:v<-.13?1:v>.34?4:v>.16?3:2)}terrain.push(row)}const c={x:64,y:64};for(let y=58;y<=70;y++)for(let x=58;x<=70;x++)terrain[y][x]=2;return {seed,terrain,day:1,tick:0,food:42,wood:25,homes:2,people:[],buildings:[{x:64,y:64,type:'склад'},{x:61,y:63,type:'дом'},{x:67,y:65,type:'дом'}],events:['Основана первая деревня Велории.'],nextId:1,discoveries:[],innovation:0};}
function addPerson(x=64,y=64){world.people.push({id:world.nextId++,name:names[Math.floor(Math.random()*names.length)],x,y,hunger:0,energy:100,age:18+Math.floor(Math.random()*21),job:Math.random()<.53?'лесоруб':'собиратель',target:null,carrying:0,mind:{memories:[],beliefs:{forest:0,meadow:0},ideas:[],trials:0,learning:0,goal:'исследовать',social:[]},workVisits:0});}
function newGame(){world=generate(Math.floor(Math.random()*1e8));for(let i=0;i<8;i++)addPerson(64+rnd(-4,4),64+rnd(-4,4));selected=null;cam.x=64;cam.y=64;addEvent('Первые жители начинают свою жизнь.');updateUI();}
function addEvent(t){world.events.unshift(`День ${world.day}: ${t}`);world.events=world.events.slice(0,35);}
function tile(x,y){return world.terrain[clamp(Math.floor(y),0,H-1)][clamp(Math.floor(x),0,W-1)];}
function reachable(x,y){let t=tile(x,y);return t!==0&&t!==1&&t!==4;}
const hub={x:64,y:64};
function pathTo(start,goal){
 const sx=clamp(Math.floor(start.x),0,W-1),sy=clamp(Math.floor(start.y),0,H-1);
 const gx=clamp(Math.floor(goal.x),0,W-1),gy=clamp(Math.floor(goal.y),0,H-1);
 if(!reachable(gx,gy))return null;
 if(sx===gx&&sy===gy)return [{x:goal.x,y:goal.y}];
 const from=new Int32Array(W*H).fill(-1),queue=new Int32Array(W*H);let head=0,tail=0;
 const source=sy*W+sx,destination=gy*W+gx;from[source]=source;queue[tail++]=source;
 while(head<tail){let pos=queue[head++];if(pos===destination)break;let x=pos%W,y=(pos/W)|0;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,ni=ny*W+nx;if(nx<0||nx>=W||ny<0||ny>=H||from[ni]!==-1||!reachable(nx,ny))continue;from[ni]=pos;queue[tail++]=ni;}
 }
 if(from[destination]===-1)return null;
 const result=[];let cur=destination;while(cur!==source){result.push({x:(cur%W)+.5,y:((cur/W)|0)+.5});cur=from[cur];}result.reverse();
 result.push({x:goal.x,y:goal.y});return result;
}
function findWork(p){
 const candidates=[];
 for(let radius=2;radius<=16;radius+=2){
  for(let i=0;i<28;i++){let x=clamp(Math.floor(p.x+rnd(-radius,radius)),1,W-2),y=clamp(Math.floor(p.y+rnd(-radius,radius)),1,H-2);
   if(reachable(x,y)&&(p.job==='лесоруб'?tile(x,y)===3:tile(x,y)===2||tile(x,y)===3))candidates.push({x:x+.5,y:y+.5});}
  if(candidates.length)break;
 }
 const belief=ensureMind(p).beliefs;
 candidates.sort((a,b)=>{
  const score=c=>(tile(c.x,c.y)===3?(belief.forest||0):(belief.meadow||0))*2-dist(p,c)*.3;
  return score(b)-score(a);
 });
 for(const target of candidates){let path=pathTo(p,target);if(path)return {target,path};}
 return null;
}
function setDestination(p,target,path){p.target=target;p.path=path||pathTo(p,target)||[];p.pathIndex=0;}
function movePerson(p){
 if(!p.target)return false;
 if(!Array.isArray(p.path)||p.pathIndex===undefined){p.path=pathTo(p,p.target)||[];p.pathIndex=0;}
 let next=p.path[p.pathIndex];if(!next){return dist(p,p.target)<.55;}
 let dx=next.x-p.x,dy=next.y-p.y,d=Math.hypot(dx,dy);
 if(d<=.085){p.x=next.x;p.y=next.y;p.pathIndex++;return dist(p,p.target)<.55;}
 const step=Math.min(.085,d),nx=p.x+dx/d*step,ny=p.y+dy/d*step;
 if(!reachable(nx,ny)){p.target=null;p.path=[];return false;}
 p.x=nx;p.y=ny;return dist(p,p.target)<.55;
}
function returnHome(p){if(!p.target||dist(p.target,hub)>2)setDestination(p,{x:64.5,y:64.5});}
function ensureMind(p){if(!p.mind)p.mind={memories:[],beliefs:{forest:0,meadow:0},ideas:[],trials:0,learning:0,goal:'исследовать',social:[]};return p.mind;}
function remember(p,type,message,value=0){const m=ensureMind(p);m.memories.push({day:world.day,type,message,value});if(m.memories.length>16)m.memories.shift();}
function createIdea(p){const m=ensureMind(p);if(m.ideas.some(i=>i.status==='open'))return;
 const shortage=world.food<world.people.length*2?'еда':world.wood<18?'древесина':(p.job==='лесоруб'?'древесина':'еда');
 const site=shortage==='еда'?'meadow':'forest';
 const question=shortage==='еда'?'Равнины могут обеспечить больше пищи':'Лес может обеспечить больше древесины';
 m.ideas.push({id:world.tick+'-'+p.id,question,site,resource:shortage,status:'open',started:world.tick,baseline:shortage==='еда'?world.food:world.wood});
 if(m.ideas.length>8)m.ideas.shift();m.goal='проверить гипотезу';remember(p,'идея',question);
}
function resolveExperiment(p,amount){const m=ensureMind(p),idea=m.ideas.find(i=>i.status==='open');if(!idea)return;
 const expected=idea.resource==='еда'?'собиратель':'лесоруб';const success=p.job===expected&&amount>0;
 idea.status=success?'подтверждена':'опровергнута';idea.result=amount;m.trials++;m.learning+=success?2:1;
 const habitat=idea.site;m.beliefs[habitat]=clamp((m.beliefs[habitat]||0)+(success?2:-1),-8,12);
 remember(p,'опыт',success?'Успешный сбор '+idea.resource:'Не получил ожидаемый ресурс',amount);
 if(success){world.innovation=(world.innovation||0)+1;world.discoveries ||= [];
  if(!world.discoveries.includes(idea.resource+' — проверенный сбор')){world.discoveries.push(idea.resource+' — проверенный сбор');addEvent(`${p.name} проверил(а) способ добычи: ${idea.resource}.`);}}
 m.goal=success?'поделиться опытом':'изменить подход';
}
function shareKnowledge(p){const m=ensureMind(p);if(!m.trials||world.tick%45!==p.id%45)return;
 const nearby=world.people.filter(q=>q.id!==p.id&&dist(q,p)<3);if(!nearby.length)return;
 const q=nearby[Math.floor(Math.random()*nearby.length)],other=ensureMind(q);
 for(const site of ['forest','meadow']){const a=m.beliefs[site]||0,b=other.beliefs[site]||0;if(Math.abs(a)>Math.abs(b))other.beliefs[site]=clamp(b+Math.sign(a),-8,12);}
 remember(q,'разговор',`Обмен опытом с ${p.name}`);if(!m.social.includes(q.id))m.social.push(q.id);
}
function think(p){const m=ensureMind(p);if(world.tick%120===p.id%120){
 if(!m.ideas.some(i=>i.status==='open'))createIdea(p);
 if(world.food<world.people.length*3&&p.job!=='собиратель'){p.job='собиратель';p.target=null;p.path=[];remember(p,'решение','Пища в дефиците — заняться сбором');}
 else if(world.wood<18&&world.food>world.people.length*4&&p.job!=='лесоруб'){p.job='лесоруб';p.target=null;p.path=[];remember(p,'решение','Нужна древесина — собирать лес');}
 }
 if(dist(p,{x:64.5,y:64.5})<5)shareKnowledge(p);
}
function stepPerson(p){
 think(p);p.hunger=clamp(p.hunger+.012,0,110);p.energy=clamp(p.energy-.012,0,100);
 if(p.hunger>=100){world.people=world.people.filter(q=>q.id!==p.id);addEvent(`${p.name} погиб(ла) от голода.`);return;}
 if(p.carrying>=3||p.hunger>55||p.energy<12){
  returnHome(p);movePerson(p);
  if(dist(p,{x:64.5,y:64.5})<1.1){
   if(p.carrying){const gained=p.carrying;if(p.job==='лесоруб')world.wood+=gained;else world.food+=gained;resolveExperiment(p,gained);p.carrying=0;}
   if(p.hunger>35&&world.food>0){world.food--;p.hunger=Math.max(0,p.hunger-48);}
   if(p.energy<70)p.energy=Math.min(100,p.energy+1.35);
   if(p.hunger<=55&&p.energy>=70){p.target=null;p.path=[];}
  }
  return;
 }
 if(!p.target||dist(p,p.target)<.55){
  if(p.target&&dist(p,p.target)<.55&&dist(p.target,hub)>2)p.carrying=Math.min(3,p.carrying+1);
  if(p.carrying>=3){returnHome(p);return;}
  const work=findWork(p);if(work)setDestination(p,work.target,work.path);else returnHome(p);
 }
 movePerson(p);
}
function buildHouse(){
 for(let radius=3;radius<24;radius++){
  for(let i=0;i<32;i++){
   const angle=i*Math.PI/16,x=Math.round(64+Math.cos(angle)*radius),y=Math.round(64+Math.sin(angle)*radius);
   if(!reachable(x,y)||world.buildings.some(b=>Math.abs(b.x-x)<2&&Math.abs(b.y-y)<2))continue;
   const path=pathTo({x:64.5,y:64.5},{x:x+.5,y:y+.5});if(!path)continue;
   world.buildings.push({x,y,type:'дом'});world.homes++;world.wood-=18;addEvent('Жители возвели ещё один дом.');return true;
  }
 }
 return false;
}

/* v0.4.0: material experiments and emergent village culture.
   Objects expose physical properties; residents pick goals using shortages and local beliefs.
   No date-gated technological progression. */
const MATERIALS={
 wood:{strength:2,flexibility:3,heat:2,food:0},
 stone:{strength:5,flexibility:0,heat:0,food:0},
 clay:{strength:1,flexibility:3,heat:0,food:0},
 fiber:{strength:0,flexibility:5,heat:2,food:0},
 grain:{strength:0,flexibility:0,heat:2,food:5}
};
const EXPERIMENTS=['bind','shape','heat','stack'];
function culture(){world.culture ||= {stock:{wood:0,stone:14,clay:12,fiber:14,grain:12},patterns:{},relations:{},stories:[],structures:[],experiments:0,successful:0};return world.culture;}
function socialLink(a,b){const c=culture(),key=[a.id,b.id].sort((x,y)=>x-y).join(':');return c.relations[key] ||= {trust:0,encounters:0,exchanges:0};}
function materialOutcome(a,b,method){const A=MATERIALS[a],B=MATERIALS[b];if(!A||!B)return null;
 const strength=A.strength+B.strength,flex=A.flexibility+B.flexibility,heat=A.heat+B.heat;
 const properties={strength,flexibility:flex,heat,food:A.food+B.food};
 if(method==='bind'&&flex>=3&&strength>=2)return {kind:'composite',properties,benefit:'durability',magnitude:strength+flex};
 if(method==='stack'&&strength>=6)return {kind:'foundation',properties,benefit:'housing',magnitude:strength};
 if(method==='shape'&&flex>=5)return {kind:'container',properties,benefit:'storage',magnitude:flex};
 if(method==='heat'&&heat>=4&&strength>=1)return {kind:'hardened',properties,benefit:'durability',magnitude:heat+strength};
 if(method==='heat'&&properties.food>0)return {kind:'meal',properties,benefit:'nutrition',magnitude:properties.food+heat};
 return {kind:'failed',properties,benefit:'none',magnitude:0};
}
function concern(){const c=culture(),people=Math.max(1,world.people.length);
 if(world.food<people*3)return 'nutrition';
 if(world.homes*3<people+2)return 'housing';
 if(world.wood<18)return 'durability';
 if(c.stock.grain<5)return 'storage';
 return ['storage','durability','housing','nutrition'][Math.floor(Math.random()*4)];
}
function socialLife(){
 const people=world.people;if(people.length<2)return;
 for(const p of people){const m=ensureMind(p);m.contacts ||= {};
  let q=people.filter(q=>q.id!==p.id&&dist(q,p)<5).sort((a,b)=>dist(a,p)-dist(b,p))[0];
  if(!q)continue;const link=socialLink(p,q);link.encounters++;
  const idea=m.ideas.find(i=>i.status==='подтверждена'),other=ensureMind(q);
  if(idea&&Math.random()<.20){link.exchanges++;link.trust=Math.min(20,link.trust+1);other.beliefs[idea.site]=clamp((other.beliefs[idea.site]||0)+1,-8,12);
   remember(q,'обучение',p.name+' поделился(лась) опытом');}
  else if(Math.random()<.08){link.trust=Math.max(-10,link.trust+(world.food<people.length?-1:1));}
  m.contacts[q.id]=link.trust;
 }
}
function experimentMaterials(p){
 const c=culture(),m=ensureMind(p);m.materialIdeas ||= [];m.craftExperience ||= {};
 // Choices respond to unmet needs, not a scripted age/technology order.
 const desired=concern(),keys=Object.keys(MATERIALS);
 const available=keys.filter(k=>(c.stock[k]||0)>0||(k==='wood'&&world.wood>0));
 if(available.length<2)return;
 const ranking=[];
 for(const a of available)for(const b of available)for(const method of EXPERIMENTS){
   const signature=[a,b].sort().join('+')+':'+method;
   const known=c.patterns[signature],memory=m.craftExperience[signature]||0;
   if(known?.success&&known.benefit===desired)continue;
   let score=Math.random()*3-memory*.5+(known?.success?-.6:0);
   if(desired==='housing'&&method==='stack')score+=2;
   if(desired==='storage'&&method==='shape')score+=2;
   if(desired==='nutrition'&&method==='heat')score+=2;
   if(desired==='durability'&&method==='bind')score+=2;
   ranking.push({a,b,method,signature,score});
 }
 ranking.sort((a,b)=>b.score-a.score);const idea=ranking[0];if(!idea)return;
 const spend=k=>{if(k==='wood'&&world.wood>0)world.wood--;else c.stock[k]--;};
 const same=idea.a===idea.b;
 const count=k=>(k==='wood'?world.wood+(c.stock.wood||0):(c.stock[k]||0));
 if(same&&count(idea.a)<2)return;
 spend(idea.a);spend(idea.b);
 const outcome=materialOutcome(idea.a,idea.b,idea.method);
 c.experiments++;m.craftExperience[idea.signature]=(m.craftExperience[idea.signature]||0)+1;
 m.materialIdeas.push({day:world.day,inputs:[idea.a,idea.b],method:idea.method,outcome:outcome.kind,benefit:outcome.benefit});
 if(m.materialIdeas.length>12)m.materialIdeas.shift();
 const pattern=c.patterns[idea.signature]||{trials:0,success:false,benefit:'none',magnitude:0,discoverer:p.name};
 pattern.trials++;pattern.success=outcome.kind!=='failed';pattern.benefit=outcome.benefit;pattern.magnitude=outcome.magnitude;c.patterns[idea.signature]=pattern;
 remember(p,'материал',idea.a+' + '+idea.b+' / '+idea.method+' → '+outcome.kind);
 if(outcome.kind==='failed')return;
 c.successful++;m.learning++;const label=outcome.kind+' ('+idea.a+'+'+idea.b+')';
 world.discoveries ||= [];if(!world.discoveries.includes(label)){world.discoveries.push(label);addEvent(p.name+' обнаружил(а) '+label+'.');}
 const utility=outcome.benefit===desired ? 2 : 1;
 if(outcome.benefit==='nutrition')world.food+=utility;
 if(outcome.benefit==='storage')c.stock.grain+=utility;
 if(outcome.benefit==='durability')world.wood+=utility;
 if(outcome.benefit==='housing'&&world.wood>=18&&world.people.length>=world.homes*3)buildHouse();
 c.stories.unshift({day:world.day,by:p.name,what:label,need:desired});
 c.stories=c.stories.slice(0,24);
}
function civilizationCycle(){
 const c=culture();if(world.day%2===0)socialLife();
 // Modest replenishment models ambient gathering of raw materials, not inventions.
 for(const k of ['stone','clay','fiber','grain'])if(c.stock[k]<10)c.stock[k]+=1;
 const candidates=world.people.filter(p=>p.energy>20&&p.hunger<75);
 if(candidates.length){const p=candidates[(world.day+world.seed)%candidates.length];experimentMaterials(p);}
}

function simulation(){
 world.tick++;
 for(const p of [...world.people])stepPerson(p);
 if(world.tick%120===0){
  world.day++;
  civilizationCycle();
  if(world.wood>=18&&world.people.length>=world.homes*3)buildHouse();
  if(world.people.length<world.homes*3&&world.food>=18&&Math.random()<.45){addPerson(64+rnd(-1,1),64+rnd(-1,1));world.food-=6;addEvent('В деревне появился новый житель.');}
  if(world.day%8===0)addEvent('Жители обсуждают накопленный опыт.');updateUI();
 }
}
function updateUI(){stats.innerHTML=`🌅 День: <b>${world.day}</b><br>👥 Жителей: <b>${world.people.length}</b><br>🍎 Еда: <b>${world.food}</b><br>🪵 Древесина: <b>${world.wood}</b><br>🏠 Домов: <b>${world.homes}</b><br>🧠 Проверенных опытов: <b>${world.innovation||0}</b><br>⚗️ Материальных экспериментов: <b>${culture().experiments}</b><br>🤝 Социальных связей: <b>${Object.keys(culture().relations).length}</b><br>💡 Открытий: <b>${(world.discoveries||[]).length}</b><br>🌍 Размер мира: ${W} × ${H}`;log.replaceChildren(...world.events.slice(0,16).map(s=>{let d=document.createElement('div');d.textContent=s;return d}));if(selected){if(selected.kind==='person'){let p=world.people.find(x=>x.id===selected.id);details.textContent=p?`${p.name} · ${p.job} · возраст ${p.age} · голод ${Math.round(p.hunger)}% · энергия ${Math.round(p.energy)}% · цель: ${ensureMind(p).goal} · опытов: ${ensureMind(p).trials} · память: ${ensureMind(p).memories.slice(-2).map(m=>m.message).join('; ')}`:'Житель покинул мир.';}else details.textContent=`Клетка (${selected.x}, ${selected.y}) · ${['глубокая вода','берег','равнина','лес','горы'][tile(selected.x,selected.y)]}`;}}

const palette={water:'#237d9c',shore:'#d0bc7a',grass:'#82ae60',forest:'#548f52',mountain:'#7d8d81'};
function noise(x,y,n=0){let q=Math.imul(x+13,374761393)+Math.imul(y+71,668265263)+n*1442695041;q=Math.imul(q^(q>>>13),1274126177);return ((q^(q>>>16))>>>0)/4294967296;}
function square(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function terrainArt(x,y,px,py,s,t){
 const v=noise(x,y),n=noise(x,y,2),bs=Math.max(1,s/16);
 square(px,py,s+1,s+1,[palette.water,palette.shore,palette.grass,palette.forest,palette.mountain][t]);
 if(t===0){square(px,py+s*.10,s,s*.07,'#2d91ad');if(v>.55){square(px+s*.15,py+s*.54,s*.28,bs,'#77c5ce');square(px+s*.6,py+s*.27,s*.24,bs,'#8dd6d9')}}
 if(t===1){square(px,py+s*.7,s,s*.18,'#acc275');if(v>.35)square(px+s*.35,py+s*.33,s*.13,s*.12,'#e5d795')}
 if(t===2||t===3){
  square(px+s*.13,py+s*.78,s*.22,bs,'#609047');square(px+s*.61,py+s*.44,s*.10,bs,'#b4cb75');
  if(v>.76){if(window.VELORIA_ART?.draw(ctx,'flower',px,py,s))return;square(px+s*.64,py+s*.64,bs*2,bs*2,'#f9dded');square(px+s*.7,py+s*.65,bs,bs,'#e5a5ce');}
  if(n>.78){square(px+s*.21,py+s*.22,bs*2,bs,'#365f3a');square(px+s*.25,py+s*.26,bs,bs,'#dbe9a5');}
 }
 if(t===3){
  if(window.VELORIA_ART?.draw(ctx,noise(x,y,6)>.72?'pine':'tree',px,py,s)){return;}
  square(px+s*.44,py+s*.44,s*.17,s*.43,'#684d37');
  square(px+s*.25,py+s*.29,s*.58,s*.40,'#235c3b');
  square(px+s*.19,py+s*.16,s*.57,s*.35,'#367c46');
  square(px+s*.37,py+s*.09,s*.37,s*.20,'#5eab5d');
  square(px+s*.22,py+s*.23,s*.17,s*.12,'#71bb6a');
  square(px+s*.65,py+s*.36,s*.12,s*.09,'#204d37');
 }
 if(t===4){
  if(window.VELORIA_ART?.draw(ctx,'rock',px,py,s))return;
  square(px+s*.1,py+s*.67,s*.76,s*.2,'#5b716b');
  square(px+s*.21,py+s*.37,s*.64,s*.36,'#a8afa0');
  square(px+s*.34,py+s*.2,s*.37,s*.25,'#cbd0b6');
  square(px+s*.43,py+s*.28,s*.13,s*.1,'#e3e5cb');
 }
}
function buildingArt(b,px,py,s){
 if(window.VELORIA_ART?.draw(ctx,b.type==='склад'?'warehouse':'cottage',px,py,s))return;
 const warehouse=b.type==='склад',roof=warehouse?'#53647b':'#a6574a';
 square(px+s*.05,py+s*.55,s*.9,s*.45,'#523c30');
 square(px+s*.11,py+s*.47,s*.78,s*.44,'#ddb77d');
 square(px+s*.18,py+s*.65,s*.22,s*.2,'#b8d9ce');
 square(px+s*.22,py+s*.66,s*.13,s*.11,'#f1d28c');
 square(px+s*.61,py+s*.63,s*.2,s*.29,'#523d30');
 square(px+s*.66,py+s*.68,s*.11,s*.23,'#785036');
 ctx.fillStyle='#382f34';ctx.beginPath();ctx.moveTo(px-s*.07,py+s*.47);ctx.lineTo(px+s*.5,py+s*.07);ctx.lineTo(px+s*1.07,py+s*.47);ctx.fill();
 ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(px-s*.02,py+s*.44);ctx.lineTo(px+s*.5,py+s*.12);ctx.lineTo(px+s*1.02,py+s*.44);ctx.fill();
 square(px+s*.14,py+s*.39,s*.72,s*.08,warehouse?'#697d95':'#ca7761');
 for(let i=0;i<4;i++)square(px+s*(.19+i*.17),py+s*.32,s*.095,s*.045,warehouse?'#8091a2':'#df9a78');
 square(px+s*.55,py+s*.08,s*.09,s*.18,'#715b52');
 if(warehouse){square(px+s*.88,py+s*.71,s*.24,s*.2,'#a47c4e');square(px+s*.91,py+s*.75,s*.15,s*.04,'#d1a76a')}
}
function citizenArt(p,px,py,s){
 if(window.VELORIA_ART?.draw(ctx,'villager',px-s*.5,py-s*.5+Math.sin(world.tick*.18+p.id)*s*.025,s))return;
 const bob=Math.sin(world.tick*.18+p.id)*Math.max(1,s*.025);
 square(px-s*.12,py+s*.05+bob,s*.25,s*.13,'#34404c');
 square(px-s*.11,py-s*.19+bob,s*.22,s*.3,p.job==='лесоруб'?'#d0a56e':'#8ebcb4');
 square(px-s*.11,py-s*.34+bob,s*.22,s*.2,'#f1c39c');
 square(px-s*.15,py-s*.36+bob,s*.30,s*.08,noise(p.id,3)>.5?'#744f3b':'#423b42');
 square(px-s*.06,py-s*.24+bob,s*.04,s*.04,'#35323a');
 if(p.carrying){square(px+s*.13,py-s*.12+bob,s*.24,s*.09,p.job==='лесоруб'?'#81563d':'#e2b868');}
}
function render(){
 const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1;
 if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
 square(0,0,width,height,'#274d59');
 const size=T*cam.zoom,ox=width/2-cam.x*size,oy=height/2-cam.y*size;
 const xmin=clamp(Math.floor(-ox/size)-1,0,W-1),xmax=clamp(Math.ceil((width-ox)/size)+1,0,W-1),ymin=clamp(Math.floor(-oy/size)-1,0,H-1),ymax=clamp(Math.ceil((height-oy)/size)+1,0,H-1);
 for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++){terrainArt(x,y,ox+x*size,oy+y*size,size,world.terrain[y][x]);}
 // Village paths are visualized next to constructed buildings and don't alter the navigation graph.
 for(const b of world.buildings){const bx=ox+(b.x+.5)*size,by=oy+(b.y+.5)*size;
  const x0=ox+64.5*size,y0=oy+64.5*size;
  ctx.strokeStyle='#c1a276';ctx.lineWidth=Math.max(2,size*.27);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(bx,y0);ctx.lineTo(bx,by);ctx.stroke();
  ctx.strokeStyle='#e0bc84';ctx.lineWidth=Math.max(1,size*.12);ctx.stroke();
 }
 for(const b of world.buildings){const x=ox+b.x*size,y=oy+b.y*size;if(x>=-size*2&&y>=-size*2&&x<width+size&&y<height+size)buildingArt(b,x,y,size);}
 for(const p of world.people){const x=ox+(p.x+.5)*size,y=oy+(p.y+.5)*size;if(x>=0&&y>=0&&x<width&&y<height)citizenArt(p,x,y,size);}
}

function pixelAt(evt){const rect=canvas.getBoundingClientRect(),size=T*cam.zoom;return {x:(evt.clientX-rect.left-rect.width/2)/size+cam.x,y:(evt.clientY-rect.top-rect.height/2)/size+cam.y};}
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y,moved:false};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>5)drag.moved=true;cam.x=clamp(drag.cx-dx/(T*cam.zoom),0,W);cam.y=clamp(drag.cy-dy/(T*cam.zoom),0,H);});canvas.addEventListener('pointerup',e=>{if(!drag)return;if(!drag.moved){let pt=pixelAt(e),p=world.people.find(q=>dist(q,pt)<.7);selected=p?{kind:'person',id:p.id}:{kind:'tile',x:clamp(Math.floor(pt.x),0,W-1),y:clamp(Math.floor(pt.y),0,H-1)};updateUI();}drag=null;});canvas.addEventListener('wheel',e=>{e.preventDefault();cam.zoom=clamp(cam.zoom*(e.deltaY>0?.85:1.15),.6,4)},{passive:false});window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase())});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function save(){try{localStorage.setItem(KEY,JSON.stringify(world));return true}catch(e){addEvent('Не удалось сохранить мир.');updateUI();return false}}function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.terrain?.length===H&&s.terrain.every(row=>Array.isArray(row)&&row.length===W)&&Array.isArray(s.people)&&Array.isArray(s.buildings)&&Number.isFinite(s.day)&&Number.isFinite(s.nextId)){world=s;world.discoveries ||= [];world.innovation ||= 0;for(const p of world.people)ensureMind(p);return true}}catch(e){}return false}
document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'▶ Продолжить':'⏸ Пауза'};document.querySelector('#speed').onclick=()=>{speed=speed===1?2:speed===2?4:1;document.querySelector('#speed').textContent='×'+speed};document.querySelector('#save').onclick=()=>{save();updateUI()};document.querySelector('#reset').onclick=()=>{if(confirm('Создать новый мир? Текущее сохранение будет заменено.')){newGame();save();}};
if(!load())newGame();culture();updateUI();window.VELORIA_TEST={getWorld:()=>world,step:simulation,pathTo,setWorld:w=>{world=w},newGame,think,ensureMind,createIdea,resolveExperiment,materialOutcome,experimentMaterials,civilizationCycle,culture};function loop(t){const dt=Math.min((t-last)||0,100);last=t;let move=dt/(T*cam.zoom)*.3;if(keys.has('w')||keys.has('arrowup'))cam.y-=move;if(keys.has('s')||keys.has('arrowdown'))cam.y+=move;if(keys.has('a')||keys.has('arrowleft'))cam.x-=move;if(keys.has('d')||keys.has('arrowright'))cam.x+=move;cam.x=clamp(cam.x,0,W);cam.y=clamp(cam.y,0,H);if(!paused){acc+=dt*speed;let n=0;while(acc>=100&&n++<12){simulation();acc-=100}}autosave+=dt;if(autosave>=30000){autosave=0;save()}render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
})();