let idols=[],vervT=0,klyukaCharge=0;
Object.assign(NEWW_LVL,{kolokol:1,verv:1,idol:1,navi:1,rosa:1,vihr:1,klyuka:1,zerno:1});

// ---------- КОЛОКОЛ ЯВИ: удар по всему экрану ----------
function doKolokol(){
 // v6.19 (C3): Набат — позиционное кольцо. Звон больше не бьёт «вокруг себя»
 // (как Оберег), а оставляет РЕЗОНИРУЮЩИЙ КРУГ на месте. Он живёт несколько
 // секунд и бьёт всех внутри по таймеру — игрок ставит звоны на маршруте отхода.
 const lvl=nwLvl('kolokol'),w=weapons.find(x=>x.id==='kolokol'),evo=w&&w.evo;
 const R=(150+30*lvl)*wArea('kolokol');
 const dmg=(20+9*lvl)*wDmg('kolokol');
 const life=(evo?5.5:3.5)*wDur('kolokol');
 zones.push({x:P.x,y:P.y,r:R,t:life,max:life,dmg:dmg*(evo?1.4:1),_bell:true,_evo:!!evo});
 spawnFlash(P.x,P.y,1,'#ffd77d');
 for(let k=0;k<7;k++){const an=Math.random()*TAU,sp=rnd(70,200);
  spawnParticle(P.x,P.y,Math.cos(an)*sp,Math.sin(an)*sp,rnd(.2,.5),'#ffd77d',0,0);}
 return true;
}
// ---------- ВЕРВЬ МАРЫ: цепь между двумя врагами ----------
function doVerv(){
 const lvl=nwLvl('verv'),w=weapons.find(x=>x.id==='verv'),evo=w&&w.evo;
 // v6.39 жест: вервь: пепел натянутой цепи
 {for(let _i=0;_i<4;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*70,Math.sin(_a)*70,rnd(.3,.55),'#9aa0b0',120,0);}}
 const c=aliveNear(P.x,P.y,330);
 if(c.length<2)return false;
 c.sort((a,b)=>dist2(a.x-P.x,a.y-P.y)-dist2(b.x-P.x,b.y-P.y));
 const pairs=1;   // v6.18: пар по-прежнему одна — эволюция делает связь ДОЛГОЙ, а не двойной
 const dmg=(16+7*lvl)*wDmg('verv');
 for(let pi=0;pi<pairs&&c.length>=2*(pi+1);pi++){
  const A=c[pi*2],B=c[pi*2+1];
  // урон всем, кто лежит на отрезке A-B
  const ax=A.x,ay=A.y,bx=B.x,by=B.y;
  const vx=bx-ax,vy=by-ay,len2=vx*vx+vy*vy||1;
  const mid=enemiesNear((ax+bx)/2,(ay+by)/2,Math.sqrt(len2)/2+40);
  for(const e of mid){
   if(e.hp<=0||e.dying>0)continue;
   let t=((e.x-ax)*vx+(e.y-ay)*vy)/len2;t=Math.max(0,Math.min(1,t));
   const px=ax+vx*t,py=ay+vy*t;
   if(dist(e.x-px,e.y-py)<e.r+14){
    hitEnemy(e,dmg,'phys',false);
    if(evo)e.frozen=Math.max(e.frozen||0,0.8);
    else e.slow=Math.min(e.slow||1,0.6);
   }
  }
  aimLines.push({x1:ax,y1:ay,x2:bx,y2:by,t:0.3,_verv:true,_evo:!!evo});
  // v6.18: Двойные путы теперь не «вторая пара», а ПОСТОЯННАЯ привязь: вервь
  // остаётся натянутой 2.2с и режет всех, кто её пересекает (tickWeaponState).
  // Игрок начинает водить толпу через линию, а не ждать следующего срабатывания.
  if(evo&&vervLinks.length<4)vervLinks.push({a:A,b:B,t:2.2*wDur('verv'),hit:0.35,dmg:dmg*0.45});
 }
 return true;
}
// ---------- ИДОЛ ЧУРА: стационарный тотем ----------
function doIdol(){
 const lvl=nwLvl('idol'),w=weapons.find(x=>x.id==='idol'),evo=w&&w.evo;
 // v6.39 жест: идол: вспышка пробуждения
 {spawnFlash(P.x,P.y,1,'#c9a04a');for(let _i=0;_i<8;_i++){const _a=_i/8*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*120,Math.sin(_a)*120,rnd(.35,.6),'#ffd77d',-30,0);}}
 const cap=Math.max(1,Math.round((evo?3:2)*wAmt('idol')));
 if(idols.length>=cap)return false;
 idols.push({x:P.x,y:P.y,life:(evo?16:10)*wDur('idol'),cd:0,evo:!!evo,
  dmg:(13+6*lvl)*wDmg('idol'),r:(145+22*lvl)*wArea('idol')*(P.synIdolRope?1.35:1)}); // v7.1 шире аура идола
 return true;
}
function updateIdols(dt){
 if(!idols.length)return;
 for(let i=idols.length-1;i>=0;i--){
  const t=idols[i];
  t.life-=dt;if(t.life<=0){idols.splice(i,1);continue;}
  t.cd-=dt;
  if(t.cd<=0){
   const c=aliveNear(t.x,t.y,t.r);
   if(c.length){
    // Цель влияет на фактический урон, поэтому в Daily берём общий PRNG.
    // Math.random() оставляем только для частиц и прочего визуала.
    const tg=c[Math.floor(seedRandom()*c.length)];
    hitEnemy(tg,t.dmg,'elec',false);
    if(t.evo)tg.frozen=Math.max(tg.frozen||0,0.6);
    aimLines.push({x1:t.x,y1:t.y-18,x2:tg.x,y2:tg.y,t:0.16,_idol:true,_evo:t.evo});
    t.cd=t.evo?0.5:0.85;
   }else t.cd=0.25;
  }
  if(Math.random()<0.2)spawnParticle(t.x+rnd(-6,6),t.y-20,rnd(-8,8),-rnd(10,26),rnd(.2,.5),t.evo?'#ffd27a':'#8fd0ff',0,0);
 }
 // v6.19: Капище — эво-идолы соединяются лучом, и враги внутри их
 // выпуклой оболочки режутся. Точка-в-многоугольнике (ray casting).
 const evoIdols=idols.filter(x=>x.evo);
 if(evoIdols.length>=3){ // v6.74: нужен полигон (>=3), иначе 2 идола = отрезок, raycast даёт 0 урона
  for(let a=0;a<evoIdols.length;a++)for(let b=a+1;b<evoIdols.length;b++)
   aimLines.push({x1:evoIdols[a].x,y1:evoIdols[a].y-18,x2:evoIdols[b].x,y2:evoIdols[b].y-18,t:0.12,_idol:true,_evo:true,_link:true});
  const poly=evoIdols.map(x=>({x:x.x,y:x.y}));
  let inside=(p)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   if(((poly[i].y>p.y)!=(poly[j].y>p.y))&&(p.x<(poly[j].x-poly[i].x)*(p.y-poly[i].y)/(poly[j].y-poly[i].y)+poly[i].x))c=!c;}return c;};
  const ld=(22+4*nwLvl('idol'))*wDmg('idol')*0.5;
  for(const e of enemiesNear(poly[0].x,poly[0].y,1e9)){
   if(e.hp<=0||e.dying>0)continue;
   if(inside(e)){hitEnemy(e,ld,'elec',false);
    if(Math.random()<0.3)spawnParticle(e.x,e.y,rnd(-10,10),-rnd(10,30),rnd(.15,.35),'#ffd27a',0,0);}
  }
 }
}
// ---------- НАВИЙ ХВОСТ: бьёт за спину ----------
function doNavi(){
 const lvl=nwLvl('navi'),w=weapons.find(x=>x.id==='navi'),evo=w&&w.evo;
 const fx=-(P.fx||1),fy=-(P.fy||0);            // строго ЗА спиной
 const R=(100+15*lvl)*wArea('navi');
 const half=evo?1.0:0.65;
 const list=enemiesNear(P.x,P.y,R+20);
 let any=false;
 const dmg=(17+8*lvl)*wDmg('navi');
 for(const e of list){
  if(e.hp<=0||e.dying>0)continue;
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  if(d>R+e.r)continue;
  if((dx*fx+dy*fy)/d<Math.cos(half))continue;
  let crit=P.crit&&seedRandom()<P.crit;
  hitEnemy(e,crit?dmg*2:dmg,'void',crit);
  if(crit)sfxCrit();
  e.kx+=dx/d*(evo?280:170);e.ky+=dy/d*(evo?280:170);
  any=true;
 }
 slashes.push({ang:Math.atan2(fy,fx),reach:R,t:0.22,arc:half,evo:!!evo,_navi:true});
 return true;
}
// ---------- РОСА МОКОШИ: лечит и жжёт ----------
function doRosa(){
 // v6.18c: БЫЛО кольцо вокруг игрока — «стой в гуще, оно само». Роса ничем не
 // v6.39 жест: роса: капли вверх
 {for(let _i=0;_i<9;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*80,Math.sin(_a)*80-60,rnd(.4,.8),'#9ad06a',-60,0);} spawnFlash(P.x,P.y,0,'#9ad06a');}
 // отличалась от Оберега, Венца, Голода и Зерцала: одна и та же геометрия, разный
 // текст. СТАЛО: роса выпадает РОДНИКОМ на том месте, где ты стоял, и живёт там
 // несколько секунд. Лечит, только пока ты внутри. Это первое оружие, которое
 // требует ВОЗВРАЩАТЬСЯ в точку: игрок ставит родники по маршруту отхода и
 // выкраивает секунды на них, вместо того чтобы просто держаться в толпе.
 const lvl=nwLvl('rosa'),w=weapons.find(x=>x.id==='rosa'),evo=w&&w.evo;
 const cap=Math.max(1,Math.round((evo?3:2)*wAmt('rosa')));
 if(springs.length>=cap)return false;
 springs.push({x:P.x,y:P.y,r:(88+12*lvl)*wArea('rosa'),
  life:6.5*wDur('rosa'),tick:0,evo:!!evo,
  dmg:(9+4*lvl)*wDmg('rosa'),heal:(evo?2.4:1.3)});
 zones.push({x:P.x,y:P.y,r:(88+12*lvl)*wArea('rosa'),t:0.3,max:0.3,dmg:0,_dew:true,_evo:!!evo});
 return true;
}
// Родники живут своей жизнью: травят всех внутри и лечат хозяина, если он там.
function tickSprings(dt){
 for(let i=springs.length-1;i>=0;i--){
  const sp=springs[i];
  const inside=dist(P.x-sp.x,P.y-sp.y)<sp.r;
  // «Живая вода»: пока хозяин стоит в роднике, тот не иссякает. Эволюция даёт
  // не больше цифр, а право закрепиться на точке и держать её.
  if(!(sp.evo&&inside))sp.life-=dt;
  if(sp.life<=0){springs.splice(i,1);continue;}
  sp.tick-=dt;
  if(sp.tick>0)continue;
  sp.tick=0.5;
  const list=enemiesNear(sp.x,sp.y,sp.r);
  for(const e of list){
   if(e.hp<=0||e.dying>0)continue;
   if(dist(e.x-sp.x,e.y-sp.y)>sp.r+e.r)continue;
   hitEnemy(e,sp.dmg*0.5,'pois',false);
  }
  if(inside&&P.hp<P.maxhp){
   P.hp=Math.min(P.maxhp,P.hp+sp.heal);
   for(let k=0;k<3;k++)spawnParticle(P.x+rnd(-10,10),P.y-rnd(0,20),rnd(-10,10),-rnd(20,50),rnd(.3,.6),'#8fff8a',0,0);
  }
  zones.push({x:sp.x,y:sp.y,r:sp.r,t:0.5,max:0.5,dmg:0,_dew:true,_evo:!!sp.evo});
 }
}
// ---------- ВИХРЬ СТРИБОГА: затягивает врагов ----------
function doVihr(){
 const lvl=nwLvl('vihr'),w=weapons.find(x=>x.id==='vihr'),evo=w&&w.evo;
 // v6.39 жест: вихрь: закрученные потоки
 {for(let _i=0;_i<8;_i++){const _a=_i/8*TAU;spawnParticle(P.x+Math.cos(_a)*60,P.y+Math.sin(_a)*60,-Math.sin(_a)*220,Math.cos(_a)*220,rnd(.3,.6),'#cfe0ff',0,0);}}
 const R=(240+35*lvl)*wArea('vihr'); // v7.1 огромная воронка вихря
 const c=aliveNear(P.x,P.y,R);
 if(!c.length)return false;
 // центр воронки — в гуще врагов, а не под игроком
 let cx=0,cy=0;for(const e of c){cx+=e.x;cy+=e.y;}cx/=c.length;cy/=c.length;
 const dmg=(8+4*lvl)*wDmg('vihr');
 for(const e of c){
  const dx=cx-e.x,dy=cy-e.y,d=Math.hypot(dx,dy)||1;
  e.kx+=dx/d*(evo?420:260);e.ky+=dy/d*(evo?420:260);
  hitEnemy(e,dmg,'elec',false);
 }
 zones.push({x:cx,y:cy,r:R*0.5,t:0.55,max:0.55,dmg:0,_whirl:true,_evo:!!evo});
 // v6.18: Смерч больше не «рывок посильнее» — воронка встаёт на месте и тянет
 // 2.5с (см. tickWeaponState). Вихрь превращается в инструмент расстановки.
 if(evo){vihrStorm.x=cx;vihrStorm.y=cy;vihrStorm.r=R*0.55;vihrStorm.t=2.5*wDur('vihr');vihrStorm.hit=0;
  vihrStorm.dmg=(8+4*lvl)*wDmg('vihr')*0.5;}
 // синергия «Мёртвая воронка»: в центр стянутой толпы падает зерно
 if(P.synWindSeed){
  const zr=(80+12*nwLvl('zerno'))*wArea('vihr');
  zones.push({x:cx,y:cy,r:zr,t:1.2,max:1.2,dmg:0,_seed:true,_evo:false,_child:true,
   _boomDmg:(30+13*nwLvl('zerno'))*wDmg('vihr'),_r:zr});
 }
 // синергия «Собор ветров»: собрал — и сразу ударил звоном
 if(P.synWindBell&&typeof doKolokol==='function'&&weapons.some(x=>x.id==='kolokol')){
  const bd=(20+9*nwLvl('kolokol'))*wDmg('vihr')*0.6;
  for(const e of c){if(e.hp>0&&!(e.dying>0))hitEnemy(e,bd,'elec',false);}
  zones.push({x:cx,y:cy,r:R*0.6,t:0.35,max:0.35,dmg:0,_ring:true,_evo:true});
 }
 return true;
}
// ---------- КЛЮКА ЯГИ: контратака ----------
function doKlyuka(){
 const lvl=nwLvl('klyuka'),w=weapons.find(x=>x.id==='klyuka'),evo=w&&w.evo;
 // v6.39 жест: клюка: удар навью
 {spawnFlash(P.x,P.y,1,'#c9a0ff');for(let _i=0;_i<10;_i++){const _a=_i/10*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*200,Math.sin(_a)*200,rnd(.3,.6),'#c9a0ff',-20,0);}}
 if(klyukaCharge<=0)return false;               // копится от полученного урона
 // синергия «На краю»: на низком HP отдача копится вдвое быстрее — билд, который
 // намеренно живёт в красной зоне (см. документ, ч.6: Упырь + Клюка).
 if(P.synEdge&&P.hp<P.maxhp*0.35)klyukaCharge*=1.6;
 const R=(130+18*lvl)*wArea('klyuka');
 const list=enemiesNear(P.x,P.y,R);
 if(!list.length)return false;
 const dmg=(18+8*lvl)*wDmg('klyuka')*(1+Math.min(2,klyukaCharge*0.12));
 for(const e of list){
  if(e.hp<=0||e.dying>0)continue;
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  hitEnemy(e,dmg,'void',true);
  e.kx+=dx/d*(evo?320:200);e.ky+=dy/d*(evo?320:200);
 }
 zones.push({x:P.x,y:P.y,r:R,t:0.35,max:0.35,dmg:0,_ring:true,_evo:!!evo});
 // v6.19: Костяная клюка — эво-отдача даёт миг неуязвимости. Контратака
 // становится окном, когда толпу встречают грудью, а не из дистанции.
 if(evo)P.invuln=Math.max(P.invuln||0,0.4);
 klyukaCharge=0;
 return true;
}
// ---------- ЗЕРНО МАРЕНЫ: отложенный взрыв ----------
function doZerno(){
 const lvl=nwLvl('zerno'),w=weapons.find(x=>x.id==='zerno'),evo=w&&w.evo;
 // v6.39 жест: зерно: комья земли при посеве
 {for(let _i=0;_i<6;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*100,Math.sin(_a)*100-40,rnd(.3,.6),'#6a4a28',280,0);}}
 const R=(80+12*lvl)*wArea('zerno');
 const delay=evo?1.1:1.7;
 zones.push({x:P.x,y:P.y,r:R,t:delay,max:delay,dmg:0,_seed:true,_evo:!!evo,
  _boomDmg:(30+13*lvl)*wDmg('zerno'),_r:R});
 return true;
}
// взрыв созревших зёрен — вызывается из общего тика зон
function tickSeeds(){
 for(let i=zones.length-1;i>=0;i--){
  const z=zones[i];
  if(!z._seed||z.t>0)continue;
  const list=enemiesNear(z.x,z.y,z._r*1.5);
  for(const e of list){
   if(e.hp<=0||e.dying>0)continue;
   const dx=e.x-z.x,dy=e.y-z.y,d=Math.hypot(dx,dy)||1;
   if(d>z._r*1.5+e.r)continue;
   hitEnemy(e,z._boomDmg,'pois',false);
   e.kx+=dx/d*260;e.ky+=dy/d*260;
   if(z._evo)e.poisoned=Math.max(e.poisoned||0,2.2);
  }
  for(let k=0;k<10;k++){const an=Math.random()*TAU,sp=rnd(60,190);
   spawnParticle(z.x,z.y,Math.cos(an)*sp,Math.sin(an)*sp,rnd(.25,.6),z._evo?'#c9a0ff':'#9ad06a',0,0);}
  spawnFlash(z.x,z.y,1,z._evo?'#c9a0ff':'#9ad06a');
  // v6.18: МЁРТВАЯ ПАШНЯ — из взрыва прорастают два новых зерна. Ровно одно
  // поколение (_child), иначе одна посадка засеяла бы всю карту. Игрок теперь
  // сажает зерно не «куда попало», а туда, откуда пойдёт волна.
  if(z._evo&&!z._child){
   for(let c=0;c<2;c++){
    const an=Math.random()*TAU,rr=z._r*1.1;
    zones.push({x:z.x+Math.cos(an)*rr,y:z.y+Math.sin(an)*rr,r:z._r*0.8,t:0.9,max:0.9,dmg:0,
     _seed:true,_evo:true,_child:true,_boomDmg:z._boomDmg*0.6,_r:z._r*0.8});
   }
  }
 }
}
// ---------- отрисовка идолов ----------
function drawIdols(){
 // v7.26: 100% Арт-ориентированная отрисовка Тотемов-Идолов на земле (IDOL_WORLD_PROP_ART)
 for(let i=0;i<idols.length;i++){
  const t=idols[i],tx=t.x-cam.x,ty=t.y-cam.y;
  const fade=Math.min(1,t.life/1.5);
  ctx.save();ctx.translate(tx,ty);
  ctx.globalAlpha=0.9*fade;
  if(typeof IDOL_WORLD_PROP_ART !== 'undefined' && IDOL_WORLD_PROP_ART.complete && IDOL_WORLD_PROP_ART.naturalWidth){
   ctx.save();
   ctx.globalCompositeOperation='lighter';
   ctx.globalAlpha=0.4*fade*(0.7+0.3*Math.sin(time*3+i));
   ctx.drawImage(IDOL_WORLD_PROP_ART, -26, -26, 52, 52);
   ctx.restore();
   ctx.drawImage(IDOL_WORLD_PROP_ART, -18, -24, 36, 48);
  } else {
   ctx.fillStyle=t.evo?'#ffcf6a':'#8fd0ff';
   ctx.beginPath();ctx.arc(0,0,10,0,TAU);ctx.fill();
  }
  ctx.restore();
 }
}

// ============================================================
//  v6.17c ТРЕТЬЯ ВОЛНА — 6 орудий с механиками «состояния»
//  Отличие от прошлых волн: эти оружия НЕ статичны — их сила зависит
//  от того, что игрок делал секунду назад. Это даёт петлю обратной связи,
//  которой не было: игрок влияет на оружие, оружие влияет на решения.
//   kosti   — растёт от серии убийств, сбрасывается при простое (жадность)
//   upyr    — вытягивает жизнь, чем ниже HP игрока, тем сильнее (отчаяние)
//   zercalo — копит урон и возвращает его залпом (терпение)
//   sopel   — цепная молния по ближайшим (награда за плотность)
//   trizna  — бьёт на месте смерти врагов (использует трупы)
//   golod   — тем сильнее, чем дольше не подбирал гемы (риск)
// ============================================================
