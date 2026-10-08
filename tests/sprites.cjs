'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const context={window:{document:{createElement(type){assert.equal(type,'canvas');return {width:0,height:0,getContext(){return {fillRect(){},set fillStyle(v){}}}}}}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('sprite-art.js','utf8'),context);
const art=context.window.VELORIA_ART;
assert.ok(art&&art.draw); 
for(const name of ['tree','pine','flower','rock','cottage','warehouse','villager','foundation','frame','walls','roof']){
 const sprite=art.make(name);assert.equal(sprite.width,16,name);assert.equal(sprite.height,16,name);
 assert.equal(art.sprites[name].length,16,name);
 for(const row of art.sprites[name])assert.ok(row.length>=16,name+' short sprite row');
}
const ctx={imageSmoothingEnabled:true,drawImage(){this.calls=(this.calls||0)+1}};
assert.equal(art.draw(ctx,'tree',0,0,32),true);assert.equal(ctx.calls,1);
assert.equal(art.draw(ctx,'missing',0,0,32),false);
console.log('PASS: reusable pixel atlas sprites and rendering');
