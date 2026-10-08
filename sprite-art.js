'use strict';
/* Original hand-authored pixel sprites for VELORIA. No third-party asset dependencies. */
(function(global){
 const sprites={
 tree:[
 "................",
 ".....GGGG.......",
 "...GGLLLLGG.....",
 "..GLLLLLLLGG....",
 ".GLLGLLLLLLGG...",
 ".GLLLLLLLLLLG...",
 "GGLLLDLLLGLLGG..",
 "GLLLLLLLLLLLGG..",
 ".GGLLLLLLLLGG...",
 "..GGDLLLLGG.....",
 "...GGGGGGGG.....",
 "......BB........",
 "......BB........",
 "......bb........",
 "................",
 "................"],
 flower:[
 "................","................","................","................",
 "................",".......P........","......PYP.......",".......P........",
 ".......g........","......ggg.......",".......g........","................",
 "................","................","................","................"],
 pine:[
 "................",".......g........","......gLg.......",".....gLLLg......",
 "......DDD.......","....gLLLLLg.....","...gLLLLLLLg....",".....DDDD.......",
 "..gLLLLLLLLLg...","..gLLLLLLLLLg...","....DDDDDD......","......bb........",
 "......bb........","......BB........","................","................"],
 cottage:[
 "................",".......RR.......","......RRRR......",".....RRRRRR.....",
 "....RRRrrRRR....","...RRRRRRRRRR...","..RRRRRRRRRRRR..",".dddddddddddddd.",
 "..wwwwwwwwwwww..","..wYYwwwwYYwww..","..wYYwwwwYYwww..","..wwwwbbwwwwww..",
 "..wwwwbbwwwwww..","..wwwwbbwwwwww..","..ssssssssssss..","................"],
 warehouse:[
 "................",".......AA.......","......AAAA......",".....AAAAAA.....",
 "....AAAAAAAA....","...AAAAAAAAAA...","..AAAAAAAAAAAA..",".dddddddddddddd.",
 "..wwwwwwwwwwww..","..wwYYwwwwYYww..","..wwYYwwwwYYww..","..wwwwbbbbwwww..",
 "..wwwwbbbbwwww..","..wwwwbbbbwwww..","..ssssssssssss..","................"],
 villager:[
 "................","................","......hhhh......",".....hHHHhh.....",
 "......SSSS......","......SeSS......",".......SS.......",".....CCCCCC.....",
 ".....CCCCCC.....",".....CCCCCC.....","......CC........","......bb........",
 ".....bb.bb......",".....bb.bb......","................","................"],
 rock:[
 "................","................","................","................",
 "......aaaa......","....aaaaaaa.....","...aaaAAAaaa....","..aaaaAAAAaaa...","..aaAAAAAaaaa...","..aaaaaaaaaa....",
 "...ddddddddd....","....dddddd......","................","................","................","................"]
 };
 const stages={
 foundation:["................","................","................","................","................","................","................","..ssssssssssss..","..sdddddddddds..","..sdssssssssds..","..sdssssssssds..","..sdssssssssds..","..sdddddddddds..","..ssssssssssss..","................","................"],
 frame:[".......bb.......",".......bb.......","..bb...bb...bb..","..b.b..bb..b.b..","..b..b.bb.b..b..","..bbbbbbbbbbbb..","..b..b....b..b..","..b..b....b..b..","..b..b....b..b..","..b..b....b..b..","..b..b....b..b..","..b..bbbbbb..b..","..b..b....b..b..","..bbbbbbbbbbbb..","................","................"],
 walls:["................",".......bb.......",".......bb.......","..bbbbbbbbbbbb..","..bwwwwwwwwwwb..","..bwwwwwwwwwwb..","..bwwYYwwYYwwb..","..bwwYYwwYYwwb..","..bwwwwwwwwwwb..","..bwwwwbbwwwwb..","..bwwwwbbwwwwb..","..bwwwwbbwwwwb..","..bbbbbbbbbbbb..","................","................","................"],
 roof:["................",".......RR.......","......RRRR......",".....RRRRRR.....","....RRRrrRRR....","...RRRRRRRRRR...","..RRRRRRRRRRRR..",".dddddddddddddd.","..wwwwwwwwwwww..","..wYYwwwwYYwww..","..wYYwwwwYYwww..","..wwwwbbwwwwww..","..wwwwbbwwwwww..","..wwwwbbwwwwww..","..ssssssssssss..","................"]
 };
 Object.assign(sprites,stages);
 const colors={'.':null,G:'#255c3b',g:'#3d8047',L:'#6fba64',D:'#3b854a',B:'#674d37',b:'#a2744c',
 P:'#ef9cbf',Y:'#ffe3aa',y:'#f7dfa3',R:'#a24c45',r:'#cf7361',d:'#69463a',w:'#d8b178',
 s:'#867351',A:'#586d86',a:'#b5c1b6',e:'#312e38',S:'#f1c8a4',h:'#4e382f',H:'#79503b',
 C:'#75a5a0',c:'#9fbfc1'};
 const cache={};
 function make(name){
  if(cache[name])return cache[name]; const pixels=sprites[name];if(!pixels)return null;
  if(!global.document?.createElement)return null;
  let canvas;try{canvas=global.document.createElement('canvas');canvas.width=16;canvas.height=16;}catch(e){return null}
  const ctx=canvas.getContext?.('2d');if(!ctx?.fillRect)return null;
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const color=colors[pixels[y]?.[x]];if(color){ctx.fillStyle=color;ctx.fillRect(x,y,1,1)}}
  cache[name]=canvas;return canvas;
 }
 const fallback=()=>false;
 function draw(ctx,name,x,y,size){
  const sprite=make(name);if(!sprite||!ctx.drawImage)return false;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sprite,Math.round(x),Math.round(y),Math.round(size),Math.round(size));return true;
 }
 global.VELORIA_ART={draw,sprites,colors,make,version:'0.5.0'};
})(typeof window!=='undefined'?window:globalThis);
