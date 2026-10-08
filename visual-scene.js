'use strict';
/* VELORIA world renderer v0.5.2. Deterministic, original 32px terrain and building art.
   All visuals are tied to world terrain/buildings/people, not a decorative screenshot. */
(function(g){
const P={grass:'#79aa58',grass2:'#91b966',dark:'#477a45',deep:'#25566b',water:'#3a90a0',foam:'#91d7ca',sand:'#d6c28a',stone:'#a0aa96',soil:'#a58059',wood:'#c99d66',roof:'#b65d50',roofLit:'#d48062',wall:'#e5c18b',shadow:'#314f39'};
function hash(x,y,k=0){let h=Math.imul((x|0)+1729,73856093)^Math.imul((y|0)+53,19349663)^Math.imul(k+3,83492791);h^=h>>>13;return (h>>>0)/4294967296}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function poly(c,pts,color){c.fillStyle=color;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill();}
function grass(c,x,y,s,a,b){rect(c,x,y,s+1,s+1,a);const q=hash(x/s,y/s,4);for(let i=0;i<5;i++){let sx=x+hash(x/s,y/s,i+8)*s,sy=y+hash(x/s,y/s,i+15)*s;rect(c,sx,sy,s*.11,s*.05,b)}
if(q>.86){rect(c,x+s*.57,y+s*.32,s*.10,s*.13,'#eee4b0');rect(c,x+s*.62,y+s*.25,s*.08,s*.1,'#edabc3');rect(c,x+s*.47,y+s*.35,s*.08,s*.1,'#f6b6cd')}}
function water(c,x,y,s,terrain,ix,iy,day){rect(c,x,y,s+1,s+1,P.water);
rect(c,x,y+s*.74,s,s*.10,'#358398');
const wave=((day*4+ix*7+iy*3)%29)/29;
if(hash(ix,iy,8)>.37){rect(c,x+s*(.12+wave*.12),y+s*.35,s*.32,s*.07,'#71bdc3');rect(c,x+s*.22,y+s*.41,s*.16,s*.035,P.foam)}
for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){let nx=ix+dx,ny=iy+dy;if(ny<0||ny>=terrain.length||nx<0||nx>=terrain[0].length)continue;if(terrain[ny][nx]>1){const thick=s*.16;if(dx===0&&dy===-1)rect(c,x,y,s,thick,P.foam);if(dx===0&&dy===1)rect(c,x,y+s-thick,s,thick,P.foam);if(dx===-1)rect(c,x,y,thick,s,P.foam);if(dx===1)rect(c,x+s-thick,y,thick,s,P.foam)}}}
function tree(c,x,y,s,variant){let cx=x+s*.5,cy=y+s*.7;rect(c,cx-s*.09,cy-s*.18,s*.18,s*.44,'#674933');
const shades=variant?['#244f3c','#34794c','#53a45d','#86c66c']:['#305c36','#427d42','#60a456','#97c36a'];
for(let i=0;i<4;i++){let w=s*(.76-i*.09),h=s*.28,top=cy-s*(.75-i*.2);rect(c,cx-w/2,top,w,h,shades[i])}
rect(c,cx-s*.16,cy-s*.68,s*.16,s*.12,'#b2d780');rect(c,cx+s*.15,cy-s*.40,s*.13,s*.09,'#244b38')}
function boulder(c,x,y,s){rect(c,x+s*.17,y+s*.6,s*.68,s*.21,'#5a746b');poly(c,[[x+s*.16,y+s*.65],[x+s*.31,y+s*.29],[x+s*.68,y+s*.25],[x+s*.87,y+s*.66]],'#aeb6a1');rect(c,x+s*.36,y+s*.33,s*.24,s*.12,'#dae0bf');rect(c,x+s*.73,y+s*.56,s*.12,s*.08,'#677c72')}
function building(c,b,x,y,s){const stages=['#88684e','#75563e','#c99b70','#bf7153'];const stage=b.stage===undefined?4:b.stage;
rect(c,x-s*.17,y+s*.74,s*1.34,s*.17,'#426c3d');
if(stage===0){rect(c,x+s*.03,y+s*.51,s*.97,s*.38,P.stone);rect(c,x+s*.12,y+s*.59,s*.78,s*.17,'#d5d1a4');return}
if(stage===1){for(const u of [.10,.85])rect(c,x+s*u,y+s*.26,s*.12,s*.64,'#896344');rect(c,x+s*.1,y+s*.28,s*.87,s*.1,'#b68c55');rect(c,x+s*.1,y+s*.83,s*.87,s*.1,'#b68c55');return}
rect(c,x+s*.02,y+s*.42,s*.97,s*.51,P.wall);
rect(c,x+s*.07,y+s*.46,s*.15,s*.45,'#bd9363');rect(c,x+s*.78,y+s*.46,s*.15,s*.45,'#bd9363');
rect(c,x+s*.17,y+s*.58,s*.22,s*.19,'#65564b');rect(c,x+s*.20,y+s*.60,s*.15,s*.12,'#9fd8cb');
rect(c,x+s*.62,y+s*.63,s*.24,s*.29,'#78543e');rect(c,x+s*.65,y+s*.66,s*.16,s*.24,'#9b7050');
if(stage===2)return;
const roof=b.type==='склад'?'#596c80':P.roof;
poly(c,[[x-s*.12,y+s*.47],[x+s*.47,y+s*.08],[x+s*1.12,y+s*.47]],'#593f3d');
poly(c,[[x-s*.08,y+s*.43],[x+s*.47,y+s*.13],[x+s*1.08,y+s*.43]],roof);
for(let i=0;i<5;i++)rect(c,x+s*(.1+i*.18),y+s*.35,s*.13,s*.048,b.type==='склад'?'#8fa4ab':P.roofLit);
rect(c,x+s*.73,y+s*.05,s*.13,s*.22,'#8c7964');
if(stage===3){rect(c,x+s*.39,y+s*.03,s*.14,s*.09,'#e5cc8e')}}
function person(c,p,x,y,s,tick){let by=Math.round(Math.sin(tick*.2+p.id)*Math.max(1,s*.03));rect(c,x-s*.12,y+s*.27+by,s*.24,s*.16,'#34433e');rect(c,x-s*.16,y-s*.08+by,s*.32,s*.38,p.job==='лесоруб'?'#c79a69':'#7e9fba');rect(c,x-s*.11,y-s*.33+by,s*.22,s*.26,'#f2cba3');rect(c,x-s*.14,y-s*.37+by,s*.28,s*.12,hash(p.id,4)>.5?'#795338':'#503f43');rect(c,x-s*.055,y-s*.21+by,s*.04,s*.045,'#40383a');if(p.carrying)rect(c,x+s*.12,y-s*.04+by,s*.18,s*.17,'#9a6c4d')}
function render(c,world,cam,tile,canvas){const width=canvas.clientWidth,height=canvas.clientHeight,dpr=g.devicePixelRatio||1;if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr)}
c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;rect(c,0,0,width,height,P.deep);const s=tile*cam.zoom,ox=width/2-cam.x*s,oy=height/2-cam.y*s;
const ix0=Math.max(0,Math.floor(-ox/s)-2),ix1=Math.min(127,Math.ceil((width-ox)/s)+2),iy0=Math.max(0,Math.floor(-oy/s)-2),iy1=Math.min(127,Math.ceil((height-oy)/s)+2);
for(let iy=iy0;iy<=iy1;iy++)for(let ix=ix0;ix<=ix1;ix++){const x=ox+ix*s,y=oy+iy*s,t=world.terrain[iy][ix],v=hash(ix,iy);if(t===0){water(c,x,y,s,world.terrain,ix,iy,world.tick);continue}if(t===1){grass(c,x,y,s,P.sand,'#eaddae');continue}grass(c,x,y,s,t===3?'#598c50':P.grass,P.grass2);if(t===4)boulder(c,x,y,s);if(t===3)tree(c,x,y,s,v>.45?1:0);if(t===2&&v>.88){rect(c,x+s*.35,y+s*.59,s*.1,s*.11,'#edb6cc');rect(c,x+s*.41,y+s*.53,s*.1,s*.09,'#fff1cd')}}
for(const b of world.buildings){const x=ox+b.x*s,y=oy+b.y*s;if(x<-s*2||x>width+s*2||y<-s*2||y>height+s*2)continue;building(c,b,x,y,s)}
for(const p of world.people){const x=ox+(p.x+.5)*s,y=oy+(p.y+.5)*s;if(x<-s||x>width+s||y<-s||y>height+s)continue;person(c,p,x,y,s,world.tick)}
}
g.VELORIA_SCENE={render,version:'0.5.2',palette:P};
})(window);
