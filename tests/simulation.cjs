const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');
const buttons={};const canvas={clientWidth:800,clientHeight:600,width:800,height:600,getContext(){return {imageSmoothingEnabled:false,setTransform(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},fill(){}}},addEventListener(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:800,height:600}}};
const dom={world:canvas,stats:{innerHTML:''},details:{textContent:''},log:{replaceChildren(){}},pause:{},speed:{},save:{},reset:{}};
const ctx={console,Math,Date,Int32Array,JSON,devicePixelRatio:1,requestAnimationFrame(){},localStorage:{getItem(){return null},setItem(){}},confirm(){return false},document:{querySelector(s){return dom[s.slice(1)]},createElement(){return {textContent:''}}},window:{addEventListener(){}},performance:{now(){return 0}}};
ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(fs.readFileSync('game.js','utf8'),ctx,{timeout:2000});
const api=ctx.window.VELORIA_TEST;assert.ok(api,'testing API exists');
const w=api.getWorld();assert.equal(w.terrain.length,128);assert.equal(w.people.length,8);
assert.equal(api.materialOutcome('stone','wood','stack').benefit,'housing');
assert.equal(api.materialOutcome('fiber','wood','bind').benefit,'durability');
assert.equal(api.materialOutcome('grain','grain','heat').benefit,'nutrition');
assert.equal(api.materialOutcome('stone','stone','heat').kind,'failed');
const c=api.culture();assert.ok(c.stock.stone>=0);
// Force a shortage in housing, supply construction materials, and verify real building progress.
w.wood=150;w.food=180;w.homes=1;
for(const p of w.people){p.hunger=0;p.energy=100;p.carrying=0;p.x=64;p.y=64;}
assert.ok(api.constructionNeed()>0);
assert.equal(api.buildHouse(),true,'resident should propose construction');
const site=w.buildings.find(b=>b.stage===0);
assert.ok(site&&site.startedBy,'construction must have a resident proposer');
assert.ok(['timber','mixed','masonry'].includes(site.material));
const homesBefore=w.homes;
for(let i=0;i<2400;i++)api.step();
assert.ok(w.homes>homesBefore,'builders must finish at least one house');

assert.ok(Number.isFinite(w.food)&&Number.isFinite(w.wood));assert.ok(w.food>=0&&w.wood>=0);
assert.ok(c.experiments>0,'experiments occurred during sim');assert.ok(Object.keys(c.patterns).length>0);
assert.ok(w.people.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
console.log('PASS: map, material properties, simulation 2400 ticks, valid resources, experiments and NPC positions');
