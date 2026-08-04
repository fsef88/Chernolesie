let kostiStacks=0,kostiT=0,zercaloPool=0,golodT=0;
let springs=[],kostiRayA=0;   // v6.18c: родники Росы и фаза лучей Венца
Object.assign(NEWW_LVL,{kosti:1,upyr:1,zercalo:1,sopel:1,trizna:1,golod:1});
const TRIZNA_MARKS=[];   // места смерти врагов

// ---------- КОСТЯНОЙ ВЕНЕЦ: растёт от серии ----------
function doKosti(){
 // v6.18c: БЫЛО ровное кольцо вокруг игрока. СТАЛО: венец выбрасывает костяные
 // v6.39 жест: венец: костяные осколки
 {for(let _i=0;_i<6;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*170,Math.sin(_a)*170,rnd(.25,.5),'#9aa0b0',260,0);}}
 // шипы ЛУЧАМИ, и между лучами остаются живые сектора. Число лучей растёт от
 // серии убийств, а сами лучи каждый раз поворачиваются — накрытие получается
 // не «всё вокруг», а решето, которое надо доводить движением. Толпа больше не
 // умирает сама от того, что игрок стоит в ней.
 const lvl=nwLvl('kosti'),w=weapons.find(x=>x.id==='kosti'),evo=w&&w.evo;
 const maxSt=evo?24:12;
 const st=Math.min(maxSt,kostiStacks);
 const rays=Math.max(3,Math.round((3+Math.floor(st/3))*wAmt('kosti')));
 const R=(80+12*lvl+st*5)*wArea('kosti');
 const list=enemiesNear(P.x,P.y,R+30);
 if(!list.length)return false;
 const dmg=(9+4*lvl)*(1+st*0.11)*wDmg('kosti');
 kostiRayA+=0.41;                                  // лучи проворачиваются каждый удар
 // v7.35: венец бьёт короной ТОНКИХ лучей, а рисовался сплошной круг радиуса R —
 // между лучами не задевает никого, и заполненный круг это скрывал. Рисуем ту же
 // корону и теми же углами: pulseZone стоит после проворота, иначе картинка
 // отставала бы от удара на один такт.
 {const ra=[];for(let k=0;k<rays;k++)ra.push(kostiRayA+k*(TAU/rays));
  pulseZone(P.x,P.y,R,'kosti',0,{rays:ra,halfW:22});}
 let any=false;
 for(let k=0;k<rays;k++){
  const a=kostiRayA+k*(TAU/rays);
  const ax=Math.cos(a),ay=Math.sin(a);
  for(const e of list){
   if(e.hp<=0||e.dying>0)continue;
   let t=((e.x-P.x)*ax+(e.y-P.y)*ay)/R;
   if(t<0||t>1)continue;
   const px=P.x+ax*R*t,py=P.y+ay*R*t;
   if(dist(e.x-px,e.y-py)>e.r+22)continue;
   hitEnemy(e,dmg,'phys',st>=maxSt*0.7);
   e.kx+=ax*90;e.ky+=ay*90;
   any=true;
  }
  aimLines.push({x1:P.x,y1:P.y-6,x2:P.x+ax*R,y2:P.y+ay*R,t:0.2,_idol:true,_evo:!!evo});
 }
 return true;
}
// ---------- УПЫРИНЫЙ ЗУБ: сильнее на низком HP ----------
function doUpyr(){
 const lvl=nwLvl('upyr'),w=weapons.find(x=>x.id==='upyr'),evo=w&&w.evo;
 const c=aliveNear(P.x,P.y,(170+18*lvl)*wArea('upyr'));
 if(!c.length)return false;
 c.sort((a,b)=>dist2(a.x-P.x,a.y-P.y)-dist2(b.x-P.x,b.y-P.y));
 const hpFrac=Math.max(0,Math.min(1,P.hp/(P.maxhp||1)));
 // чем ниже HP, тем больше урон: x1 при полном, x2.6 при почти нуле
 const rage=1+(1-hpFrac)*(evo?2.2:1.6);
 const n=Math.max(1,Math.round((evo?3:1)*wAmt('upyr')));
 const dmg=(15+7*lvl)*rage*wDmg('upyr');
 let healed=0;
 for(let i=0;i<n&&i<c.length;i++){
  const e=c[i];
  hitEnemy(e,dmg,'void',rage>1.8);
  healed+=evo?1.1:0.6;
  aimLines.push({x1:e.x,y1:e.y,x2:P.x,y2:P.y-8,t:0.22,_drain:true,_evo:!!evo});
  // v6.18: было «3 цели вместо 1». Жажда крови теперь про РИСК: убийство на краю
  // гибели исцеляет полностью. Игрок начинает намеренно держаться в красной зоне —
  // это меняет маршрут и дистанцию, а не таблицу урона.
  if(evo&&e.hp<=0&&hpFrac<0.3&&P.hp<P.maxhp){
   P.hp=P.maxhp;
   flashScreen('#c14a3a',0.4);
   for(let k=0;k<10;k++)spawnParticle(P.x+rnd(-14,14),P.y-rnd(0,24),rnd(-20,20),-rnd(30,80),rnd(.3,.7),'#ff6a6a',0,0);
   log('🩸 Жажда крови — рана затянулась целиком!','evo');
  }
 }
 if(healed>0&&P.hp<P.maxhp){P.hp=Math.min(P.maxhp,P.hp+healed);}
 return true;
}
// ---------- ЗЕРЦАЛО ПРАВДЫ: копит и возвращает ----------
function doZercalo(){
 // v6.18c: БЫЛО кольцо-выплеск — полный дубль Клюки («получил урон -> АоЕ вокруг»).
 // СТАЛО: накопленная боль уходит ЛУЧОМ по направлению взгляда и пробивает всех
 // на линии. Пул делится максимум на 4 цели вместо 10, поэтому выгодно не стоять
 // в куче, а ВЫСТРОИТЬ врагов в линию и развернуться к ним — впервые в арсенале
 // награда за угол, а не за близость.
 const lvl=nwLvl('zercalo'),w=weapons.find(x=>x.id==='zercalo'),evo=w&&w.evo;
 const need=evo?18:30;
 if(zercaloPool<need)return false;
 const R=(190+26*lvl)*wArea('zercalo');
 const fx=P.fx||1,fy=P.fy||0;
 const dirs=evo?[[fx,fy],[-fx,-fy]]:[[fx,fy]];   // «Кривда» бьёт и назад
 // v7.35: зерцало бьёт ЛУЧОМ, а рисовался полный круг радиуса R — картинка
 // обещала удар вокруг, при попадании по узкой линии (см. проверку ниже:
 // проекция на направление и отсечка по dist > e.r+30). Рисуем те же лучи.
 pulseZone(P.x,P.y,R,'zercalo',0.6,
  {rays:dirs.map(d=>Math.atan2(d[1],d[0])),halfW:30});
 const total=zercaloPool*(evo?1.5:1.0)*wDmg('zercalo');
 let hitAll=[];
 for(const d0 of dirs){
  const ex=P.x+d0[0]*R,ey=P.y+d0[1]*R;
  const mid=enemiesNear((P.x+ex)/2,(P.y+ey)/2,R/2+60);
  for(const e of mid){
   if(e.hp<=0||e.dying>0||hitAll.indexOf(e)>=0)continue;
   let t=((e.x-P.x)*d0[0]+(e.y-P.y)*d0[1])/R;
   if(t<0||t>1)continue;
   const px=P.x+d0[0]*R*t,py=P.y+d0[1]*R*t;
   if(dist(e.x-px,e.y-py)>e.r+30)continue;
   hitAll.push(e);
  }
  aimLines.push({x1:P.x,y1:P.y-8,x2:ex,y2:ey,t:0.32,_verv:true,_evo:!!evo});
 }
 if(!hitAll.length)return false;
 const per=total/Math.max(1,Math.min(hitAll.length,4));
 for(const e of hitAll){
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  hitEnemy(e,per,'elec',true);
  e.kx+=dx/d*220;e.ky+=dy/d*220;
  spawnFlash(e.x,e.y,0.6,'#cfe0ff');
 }
 zercaloPool=0;
 return true;
}
// ---------- СОПЕЛЬ ПЕРУНА: цепная молния ----------
function doSopel(){
 const lvl=nwLvl('sopel'),w=weapons.find(x=>x.id==='sopel'),evo=w&&w.evo;
 let cur=aliveNear(P.x,P.y,260)
   .sort((a,b)=>dist2(a.x-P.x,a.y-P.y)-dist2(b.x-P.x,b.y-P.y))[0];
 if(!cur)return false;
 // синергия «Венец грозы»: серия убийств удлиняет цепь
 const jumps=Math.max(1,Math.round(((evo?9:5)+Math.floor(lvl/2))*wAmt('sopel')))+(P.synBoneStorm?Math.floor(Math.min(24,kostiStacks)/6):0);
 const used=[];
 let dmg=(14+6*lvl)*wDmg('sopel');
 let px=P.x,py=P.y-8,totalDmg=0;
 for(let j=0;j<jumps&&cur;j++){
  hitEnemy(cur,dmg,'elec',false);totalDmg+=dmg;
  if(evo)cur.frozen=Math.max(cur.frozen||0,0.5);
  used.push(cur);
  aimLines.push({x1:px,y1:py,x2:cur.x,y2:cur.y,t:0.18,_idol:true,_evo:!!evo});
  px=cur.x;py=cur.y;
  dmg*=evo?0.94:0.85;
  const nx=aliveNear(px,py,170).filter(e=>used.indexOf(e)<0);
  cur=nx.length?nx.sort((a,b)=>dist2(a.x-px,a.y-py)-dist2(b.x-px,b.y-py))[0]:null;
 }
 // v6.19: Цепь небес — эволюция ЗАМЫКАЕТ цепь на игроке: последний разряд
 // бьёт от последнего врага к герою, и часть урона возвращается здоровьем.
 if(evo&&totalDmg>0){
  aimLines.push({x1:px,y1:py,x2:P.x,y2:P.y-8,t:0.22,_idol:true,_evo:true,_close:true});
  const heal=Math.min(P.maxhp-P.hp,totalDmg*0.18);
  if(heal>0){P.hp+=heal;
   for(let k=0;k<4;k++)spawnParticle(P.x+rnd(-10,10),P.y-rnd(0,18),rnd(-10,10),-rnd(20,50),rnd(.3,.6),'#8fff8a',0,0);}
 }
 return true;
}
// ---------- ТРИЗНА: бьёт на местах смерти ----------
function doTrizna(){
 const lvl=nwLvl('trizna'),w=weapons.find(x=>x.id==='trizna'),evo=w&&w.evo;
 if(!TRIZNA_MARKS.length)return false;
 // v6.18: было «5 могил вместо 2» — счёт вместо смысла. Теперь Курганы поднимают
 // из могил призраков: они дерутся сами, там, где игрока нет. Могил берём МЕНЬШЕ
 // (3 вместо 5), потому что каждая теперь даёт бойца, а не разовый удар.
 const take=Math.min(TRIZNA_MARKS.length,Math.max(1,Math.round((evo?3:2)*wAmt('trizna'))));
 const R=(64+10*lvl)*wArea('trizna');
 const dmg=(20+9*lvl)*wDmg('trizna');
 for(let i=0;i<take;i++){
  const m=TRIZNA_MARKS.shift();if(!m)break;
  const list=enemiesNear(m.x,m.y,R);
  for(const e of list){
   if(e.hp<=0||e.dying>0)continue;
   hitEnemy(e,dmg,'void',false);
   if(evo)e.poisoned=Math.max(e.poisoned||0,1.5);
  }
  zones.push({x:m.x,y:m.y,r:R,t:0.35,max:0.35,dmg:0,_grave:true,_evo:!!evo});
  if(evo&&volki.length<10){
   volki.push({x:m.x,y:m.y,vx:0,vy:0,life:8,cd:0,evo:true,ghost:true,
    dmg:(9+4*lvl)*wDmg('trizna'),tgt:null});
  }
  // синергия «Стая из курганов»: волки Велеса поднимаются вместе с призраками
  if(P.synWolfGraves&&volki.length<12){
   volki.push({x:m.x,y:m.y,vx:0,vy:0,life:7,cd:0,evo:true,ghost:true,
    dmg:(8+4*lvl)*wDmg('trizna'),tgt:null});
  }
  for(let k=0;k<6;k++){const an=Math.random()*TAU,sp=rnd(30,110);
   spawnParticle(m.x,m.y,Math.cos(an)*sp,Math.sin(an)*sp-40,rnd(.3,.7),evo?'#c9a0ff':'#9aa0b0',0,0);}
 }
 return true;
}
// ---------- ГОЛОД НАВИ: сильнее без подбора ----------
function doGolod(){
 // v6.18c: БЫЛО кольцо вокруг игрока — то же, что у Венца и Росы. СТАЛО: пасть
 // v6.39 жест: голод: воронка втягивает
 {for(let _i=0;_i<7;_i++){const _a=_i/7*TAU;spawnParticle(P.x+Math.cos(_a)*70,P.y+Math.sin(_a)*70,-Math.cos(_a)*150,-Math.sin(_a)*150,rnd(.25,.5),'#c9a0ff',0,0);}}
 // смыкается ПОЯСОМ на расстоянии, и вплотную к герою она не достаёт. Чем сильнее
 // голод, тем дальше уходит пояс: оружие само выталкивает игрока из привычного
 // «стой в гуще» и требует держать дистанцию — тем большую, чем оно сильнее.
 // Это прямая цена за силу, которую раньше давали бесплатно.
 const lvl=nwLvl('golod'),w=weapons.find(x=>x.id==='golod'),evo=w&&w.evo;
 const hunger=Math.min(evo?5:3,golodT/4);
 const inner=(58+7*lvl)*wArea('golod')*(1+hunger*0.30);
 const outer=inner+(66+9*lvl)*wArea('golod');
 const list=enemiesNear(P.x,P.y,outer);
 if(!list.length)return false;
 const dmg=(13+6*lvl)*(1+hunger*0.55)*wDmg('golod');
 let any=false;
 for(const e of list){
  if(e.hp<=0||e.dying>0)continue;
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  if(d+e.r<inner||d-e.r>outer)continue;          // вплотную пасть не достаёт
  hitEnemy(e,dmg,'pois',hunger>=2);
  e.kx+=dx/d*(90+hunger*40);e.ky+=dy/d*(90+hunger*40);
  any=true;
 }
 zones.push({x:P.x,y:P.y,r:outer,t:0.3,max:0.3,dmg:0,_hunger:true,_evo:!!evo,_h:hunger/(evo?5:3)});
 return any;
}
// ---------- тики состояния ----------
function tickWeaponState(dt){
 // серия убийств для венца
 // v6.18: Венец владыки убирает распад серии — «жадность» перестаёт быть таймером
 // и становится решением: можно спокойно отойти, накопленное не тает.
 const _kw=weapons.find(x=>x.id==='kosti');
 if(kostiT>0){kostiT-=dt;if(kostiT<=0&&!(_kw&&_kw.evo))kostiStacks=Math.max(0,kostiStacks-2);}
 // голод растёт всегда, сбрасывается при подборе гема
 golodT+=dt;
 // v6.18: цена Ненасытности — голод грызёт носителя. Урон мал (до ~2.2 HP/с на
 // максимуме) и НЕ может убить: ниже 1 HP не опускает. Это давление, а не казнь.
 {const _gw=weapons.find(x=>x.id==='golod');
  if(_gw&&_gw.evo){
   const hunger=Math.min(5,golodT/4);
   if(hunger>1&&P.hp>1)P.hp=Math.max(1,P.hp-0.45*hunger*dt);
  }}
 // v6.18: КРУГ ПРЕДКОВ — стена вместо толчка. Пока стена держится, нежить
 // физически не входит внутрь кольца: оберег перестаёт быть «отбрасыванием»
 // и становится местом, где можно стоять.
 if(oberegWall.t>0){
  oberegWall.t-=dt;
  const R=oberegWall.r;
  const near=enemiesNear(P.x,P.y,R+40);
  for(const e of near){
   if(e.hp<=0||e.dying>0||e.boss)continue;
   const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
   if(d<R){e.x=P.x+dx/d*R;e.y=P.y+dy/d*R;e.kx+=dx/d*60;e.ky+=dy/d*60;}
  }
 }
 // v6.18: СМЕРЧ — воронка остаётся на месте и тянет непрерывно, вместо разового
 // рывка. Меняется тактика: игрок ставит смерч и отходит, а не бьёт в упор.
 if(vihrStorm.t>0){
  vihrStorm.t-=dt;
  const c=aliveNear(vihrStorm.x,vihrStorm.y,vihrStorm.r);
  for(const e of c){
   const dx=vihrStorm.x-e.x,dy=vihrStorm.y-e.y,d=Math.hypot(dx,dy)||1;
   e.kx+=dx/d*220*dt*8;e.ky+=dy/d*220*dt*8;
  }
  vihrStorm.hit-=dt;
  if(vihrStorm.hit<=0){vihrStorm.hit=0.4;for(const e of c)hitEnemy(e,vihrStorm.dmg,'elec',false);}
  if(Math.random()<0.6){const an=Math.random()*TAU;
   spawnParticle(vihrStorm.x+Math.cos(an)*vihrStorm.r,vihrStorm.y+Math.sin(an)*vihrStorm.r,
    -Math.cos(an)*180,-Math.sin(an)*180,rnd(.25,.5),'#bfe8ff',0,0);}
 }
 // v6.18: ДВОЙНЫЕ ПУТЫ — вервь остаётся натянутой между жертвами и режет всех,
 // кто пересекает отрезок. Раньше это была «вторая пара» — то же самое дважды.
 for(let i=vervLinks.length-1;i>=0;i--){
  const L=vervLinks[i];
  L.t-=dt;
  if(L.t<=0||!L.a||!L.b||L.a.hp<=0||L.b.hp<=0){vervLinks.splice(i,1);continue;}
  L.hit-=dt;
  if(L.hit>0)continue;
  L.hit=0.35;
  const ax=L.a.x,ay=L.a.y,bx=L.b.x,by=L.b.y;
  const vx=bx-ax,vy=by-ay,len2=vx*vx+vy*vy||1;
  const mid=enemiesNear((ax+bx)/2,(ay+by)/2,Math.sqrt(len2)/2+40);
  for(const e of mid){
   if(e.hp<=0||e.dying>0)continue;
   let t=((e.x-ax)*vx+(e.y-ay)*vy)/len2;t=Math.max(0,Math.min(1,t));
   const px=ax+vx*t,py=ay+vy*t;
   if(dist(e.x-px,e.y-py)<e.r+14){hitEnemy(e,L.dmg,'phys',false);e.slow=Math.min(e.slow||1,0.6);}
  }
  aimLines.push({x1:ax,y1:ay,x2:bx,y2:by,t:0.36,_verv:true,_evo:true});
 }
 // v6.18: орбита серпов (эволюция «Волчий круг»)
 if(serpOrbs.length)tickSerpOrbs(dt);
 // v6.19: Коса «Жатва» — скошенные эволюцией враги стягиваются к игроку и
 // получают урон в плотной зоне у ног. Старых скошенных не трогаем (e._kosaPull).
 for(let i=kosaTrail.length-1;i>=0;i--){
  const m=kosaTrail[i];m.t=(m.t||0)+dt;
  if(m.t>1.2){kosaTrail.splice(i,1);continue;}
 }
 if(springs.length)tickSprings(dt);   // v6.18c: родники Росы
 // v6.19: притяжение помеченных Косой-эволюцией врагов к ногам + урон зоны.
 {const _kw=weapons.find(x=>x.id==='kosa');
  if(_kw&&_kw.evo){
   const R=86*wArea('kosa');const dmg=(10+5*nwLvl('kosa'))*wDmg('kosa');
   for(const e of enemiesNear(P.x,P.y,1e9)){if(!e._kosaPull||e.hp<=0||e.dying>0)continue;
    const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;
    if(d>14){e.x+=dx/d*Math.min(d,300)*dt;e.y+=dy/d*Math.min(d,300)*dt;e.kx+=dx/d*120;e.ky+=dy/d*120;}
    if(d<R)e._kosaHit=(e._kosaHit||0)+dt;
    if(e._kosaHit>0.3){e._kosaHit=0;hitEnemy(e,dmg,'phys',false);}}
  }}
 checkSurges();                       // v6.18e: ступени сечи
 tickComeback(dt);                    // v6.18e: возвращение с края + окно ярости
 // затухание меток смерти
 while(TRIZNA_MARKS.length>40)TRIZNA_MARKS.shift();
}
// ---------- v6.18: состояние новых механических эволюций ----------
