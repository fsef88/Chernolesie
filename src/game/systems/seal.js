//  СПЕЦАТАКА
// ============================================================
let specialMax=1,specialCharge=0;
function useSpecial(){
 if(paused||over||runEnded)return;
 // v5.78: ГОТОВНОСТЬ ПЕЧАТИ ПО ОДНОМУ ЗАРЯДУ. Раньше условием было
 // specialCharge>=specialMax, то есть каждый «+1 макс. заряд» УДЛИНЯЛ ожидание
 // ульты: Ярило (+2) делал первую ульту втрое дальше, а перк Кузницы и карта
 // «Заряд спецатаки» были прямыми ухудшениями. Теперь specialMax — это ёмкость
 // накопления (можно придержать 2-3 ульты), а стрелять можно с одного заряда.
 if(specialCharge<1)return;
 specialCharge-=1;
 // v7.7: УЛЬТИМАТИВНЫЙ ВЗРЫВ ПЕЧАТИ — +18% к скорости бега на 4 секунды и взрывная волна!
 P.spdBoostT = 4.0;
 // v6.23: печать — самое редкое событие забега, ей положен собственный кадр
 // остановки и белая вспышка. 0.13с: заметно, но не выбивает из ритма боя.
 evoPause=Math.max(evoPause,0.13);
 flashScreen('#ffe0a8',0.5);
 vibe(60);
 P.specialFx=HERO_CLIPS.ult.dur;heroAnimPlay('ult');HA.onHit=function(){shake=7;HA.onHit=null;};sfxEvo();   // v6.19: self-clearing callback
 // v6.40 ПЕЧАТЬ — САМОЕ РЕДКОЕ ДЕЙСТВИЕ ИГРОКА, а выглядела как обычный удар:
 // одна вспышка на класс. Копится она ~15 секунд, тратится осознанно, поэтому
 // должна читаться мгновенно. Общий «взрыв печати» поверх классового эффекта:
 // расходящиеся кольца + световой столб + залп частиц цветом класса.
 try{
  const _cv=CLASS_VISUALS[currentClass||'warrior']||CLASS_VISUALS.warrior;
  for(let i=0;i<5;i++){
   const f=spawnFlash(P.x,P.y,1,i%2?_cv.color:'#ffffff');
   if(f){f.t=f.max=0.30+i*0.11;}
  }
  for(let i=0;i<30;i++){
   const a=i/30*TAU;
   spawnParticle(P.x,P.y,Math.cos(a)*(200+rnd(0,220)),Math.sin(a)*(200+rnd(0,220)),
     rnd(.45,.9),i%3?_cv.color:(_cv.accent||'#fff'),-40,0);
  }
  // световой столб: частицы летят строго вверх — видно даже в гуще боя
  for(let i=0;i<12;i++){
   spawnParticle(P.x+rnd(-14,14),P.y+rnd(-6,6),rnd(-24,24),-rnd(180,340),
     rnd(.5,.95),'#ffffff',-90,0);
  }
  if(typeof flashScreen==='function')flashScreen(_cv.color,0.30);
 }catch(e){}
 const id=currentClass||'warrior';
 const cv=CLASS_VISUALS[id]||CLASS_VISUALS.warrior;
 // v5.8 Печать Q — сбалансированные классовые ульты (пик < чем «стереть экран»)
 if(id==='archer'){
  // Залп: 7 стрел (было 9), урон чуть ниже — контроль волны, не delete key
  const base=Math.atan2(P.fy||0,P.fx||1);
  const n=7;const tipPois=P.arrowPoison||0,tipFrost=P.arrowFrost||0;
  const spd=430, dmg=25*P.dmgMul*(1+0.12*(bowLvl-1));
  for(let i=0;i<n;i++){
   const a=base+(-0.48+0.96*(n<=1?0:i/(n-1)));
   arrows.push({x:P.x,y:P.y-8,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:0.55,dmg,evo:false,pierced:0,rangeLeft:230+(P.bowRange||0)*0.5,pois:tipPois,frost:tipFrost});
  }
  spawnFlash(P.x,P.y,1,'#9ac06a');
  for(let i=0;i<20;i++){const a=randomVisual()*TAU,sp=rnd(80,200);if(!spawnParticle(P.x,P.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.25,.55),'#9ac06a',-120,0))break;}
  aimLines.push({ang:base,len:170,t:0.2});
  log('🏹 Залп дозора!','gold');
 }else if(id==='warrior'){
  // Кровавый круг: AoE + щит 2.5с (было 3) + хил
  const R=185;
  const candidates=aliveNear(P.x,P.y,R);
  for(const e of candidates){
   hitEnemy(e,72*P.dmgMul,'phys',true);
   const dd=Math.max(40,Math.hypot(e.x-P.x,e.y-P.y));
   e.kx=(e.kx||0)+(e.x-P.x)/dd*380;
   e.ky=(e.ky||0)+(e.y-P.y)/dd*380;
  }
  P.shieldT=Math.max(P.shieldT||0,2.5);
  P.hp=Math.min(P.maxhp,P.hp+10);
  spawnFlash(P.x,P.y,1,'#ffcf6a');
  for(let i=0;i<32;i++){const a=i/32*TAU,sp=rnd(90,240);spawnParticle(P.x,P.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.3,.65),'#ff8a3c',-80,1);}
  hazards.push({x:P.x,y:P.y,r:R*0.3,state:'tele',t:0.22,kind:'ring',grow:R,dmg:0,_friendly:1});
  log('⚔ Кровавый круг! Щит 2.5с','gold');
  if(P.synergyWarQ){if(P._warQBoost){P.dmgMul=Math.max(0.5,(P.dmgMul||1)-P._warQBoost);}P._warQBoost=0.12*P.synergyWarQ;P.dmgMul=(P.dmgMul||1)+P._warQBoost;P._warQT=4;}
 }else if(id==='druid'){
  // Морозный обет: контроль > сырой урон
  const R=200*(P.frostR||1);
  frost.on=true; poison.on=true;
  const candidates=aliveNear(P.x,P.y,R);
  for(const e of candidates){
   hitEnemy(e,44*P.dmgMul,'frost',false);
   e.frozen=Math.max(e.frozen||0,2.4);
   e.poisoned=Math.max(e.poisoned||0,3.2);
   e.slow=Math.min(e.slow||1,0.5);
  }
  sfxFreeze();   // v7.0: хруст заморозки
  spawnFlash(P.x,P.y,1,'#bfe0ff');
  for(let i=0;i<36;i++){const a=randomVisual()*TAU,sp=rnd(60,190);spawnParticle(P.x,P.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.35,.7),'#bfe0ff',-40,0);}
  for(let i=0;i<4;i++){
   // v5.81: был rnd (несеяный) — единственный хазард из всех, ломал детерминизм Daily
   hazards.push({x:clamp(P.x+srnd(-80,80),0,WORLD),y:clamp(P.y+srnd(-80,80),0,WORLD),r:64,state:'tele',t:0.75,kind:'root',dmg:10,_ice:1});
  }
  log('❄ Морозный обет!','gold');
 }else if(id==='shaman'){
  // Гнев Перуна: до 5 молний (было 7), урон умеренный
  hasBolt=true;
  const candidates=aliveNear(P.x,P.y,420);
  // v6.16: УДАРНАЯ ВОЛНА ПЕЧАТИ — ближние (<=120px) отбрасываются СРАЗУ,
  // дальние (120..420) — с задержкой dist/1200 (волна расходится наружу).
  const waveDmg=42*P.dmgMul*(P.boltDmgMul||1);
  for(const e of candidates){
   const ed=Math.hypot(e.x-P.x,e.y-P.y);
   const knock=(e0)=>{if(!e0.alive||e0.hp<=0)return;e0.kx=(e0.kx||0)+(e0.x-P.x)/(Math.hypot(e0.x-P.x,e0.y-P.y)||1)*420;e0.ky=(e0.ky||0)+(e0.y-P.y)/(Math.hypot(e0.x-P.x,e0.y-P.y)||1)*420;};
   if(ed<=120){knock(e);hitEnemy(e,waveDmg,'elec',false);}
   else {const delay=ed/1200;const _e=e;setTimeout(()=>{
    // Таймер живёт по реальному времени: он не должен бить во время паузы,
    // после смерти или уже в следующем забеге.
    if(!paused&&!over&&!runEnded&&enemies.includes(_e)&&_e.alive&&_e.hp>0){
     knock(_e);hitEnemy(_e,waveDmg,'elec',false);
    }
   },delay*1000);}
  }
  candidates.sort((a,b)=>dist2(a.x-P.x,a.y-P.y)-dist2(b.x-P.x,b.y-P.y));
  const n=Math.min(5,Math.max(2,candidates.length||2));
  const dmg=38*P.dmgMul*(P.boltDmgMul||1)*(1+0.14*(boltLvl-1));
  for(let i=0;i<n;i++){
   const e=candidates.length?candidates[i%candidates.length]:null;
   if(!e){
    const a=randomVisual()*TAU,rr=rnd(80,180);
    bolts.push({x:P.x+Math.cos(a)*rr,y:P.y+Math.sin(a)*rr,t:0.22});
    continue;
   }
   e.boltT=0.75;
   hitEnemy(e,dmg*(i===0?1:0.85),'elec',i===0);
   if(frost.on&&seedRandom()<0.3)e.frozen=Math.max(e.frozen||0,1.0);
   bolts.push({x:e.x,y:e.y,t:0.22});
   for(let k=0;k<4;k++){const a=Math.random()*TAU,sp=rnd(70,180);spawnParticle(e.x,e.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.2,.4),'#8fd0ff',-60,0);}
  }
  spawnFlash(P.x,P.y,1,'#8fd0ff');
  log('⚡ Гнев Перуна!','gold');
 }else if(id==='ognevik'){
  // Горнило: кольцо живого огня 195 + жар удерживает (толчок мягкий), пик умеренный
  const R=195;
  const candidates=aliveNear(P.x,P.y,R);
  for(const e of candidates){
   hitEnemy(e,60*P.dmgMul,'phys',true);
   const dd=Math.max(40,Math.hypot(e.x-P.x,e.y-P.y));
   e.kx=(e.kx||0)+(e.x-P.x)/dd*140;
   e.ky=(e.ky||0)+(e.y-P.y)/dd*140;
  }
  spawnFlash(P.x,P.y,1,'#ff8a3c');
  for(let i=0;i<40;i++){const a=randomVisual()*TAU,sp=rnd(80,230);spawnParticle(P.x,P.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.3,.7),i%3?'#ff8a3c':'#ffd9a0',-40,1);}
  hazards.push({x:P.x,y:P.y,r:R*0.3,state:'tele',t:0.22,kind:'ring',grow:R,dmg:0,_friendly:1});
  log('🔥 Горнило! Кольцо живого огня','gold');
 }else if(id==='groznik'){
  // Копьё Грозы: пронзающий бросок по линии взгляда (коридор 430×64) + всплеск в конце
  const base=Math.atan2(P.fy||0,P.fx||1);
  const R=430,hw=64;
  const ex=P.x+Math.cos(base)*R,ey=P.y+Math.sin(base)*R;
  const dx=ex-P.x,dy=ey-P.y,dd=dx*dx+dy*dy;
  // FIX v7.38: используем spatial hash вместо перебора всех врагов — O(1) вместо O(n)
  const nearLine = enemiesNear(P.x, P.y, R);
  for(const e of nearLine){
   if(!e.alive||e.hp<=0)continue;
   const t=clamp(((e.x-P.x)*dx+(e.y-P.y)*dy)/dd,0,1);
   const px=P.x+dx*t,py=P.y+dy*t;
   if((e.x-px)*(e.x-px)+(e.y-py)*(e.y-py)<hw*hw){
    hitEnemy(e,85*P.dmgMul,'bolt',true);
    e.kx=(e.kx||0)+Math.cos(base)*260;e.ky=(e.ky||0)+Math.sin(base)*260;
   }
  }
  spawnFlash(ex,ey,1,'#8fd0ff');
  for(let i=0;i<28;i++){const a=Math.random()*TAU,sp=rnd(80,240);spawnParticle(ex,ey,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.25,.6),i%3?'#8fd0ff':'#e0f0ff',-40,1);}
  hazards.push({x:ex,y:ey,r:40,state:'tele',t:0.22,kind:'ring',grow:150,dmg:0,_friendly:1});
  log('⛈ Копьё Грозы! Небо расколото','gold');
 }else if(id==='rogue'){
  // Стая Велеса: рывок + временные вороны (откат числа после баффа)
  hasOrbit=true;
  const base=Math.atan2(P.fy||0,P.fx||1);
  const dash=120;
  P.x=clamp(P.x+Math.cos(base)*dash,16,WORLD-16);
  P.y=clamp(P.y+Math.sin(base)*dash,16,WORLD-16);
  const candidates=aliveNear(P.x,P.y,150);
  for(const e of candidates){ hitEnemy(e,55*P.dmgMul,'void',true); }
  if(P._orbBase==null)P._orbBase=orbCount||3;
  // v5.90: было Math.min(8,...) — при стае больше восьми ульта её УМЕНЬШАЛА.
  // Потолок общий (ORB_MAX), и результат не может быть ниже базы.
  orbCount=Math.max(P._orbBase||3,Math.min(ORB_MAX,(P._orbBase||3)+3));
  if(P._shadowOrbBase==null)P._shadowOrbBase=(P.shadowOrbMul||1);
  P.shadowOrbT=Math.max(P.shadowOrbT||0,4.5);
  P.shadowOrbMul=Math.max(2.0, P._shadowOrbBase*2.0);
  spawnFlash(P.x,P.y,1,'#b478ff');
  for(let i=0;i<24;i++){const a=randomVisual()*TAU,sp=rnd(70,200);spawnParticle(P.x,P.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.25,.55),'#b478ff',-100,0);}
  log('☽ Стая Велеса!','gold');
 }else{
  // v5.89: тут толчок делился на РАДИУС r, а не на расстояние до врага, —
  // то есть был вывернут наизнанку: стоящего в упор почти не отбрасывало, а
  // дальнего на краю радиуса било полной силой. Во всех остальных ветках
  // нормировка правильная (dd=max(40,hypot)). Ветка недостижима, пока у всех
  // семи классов есть свои ульты, но оставлять неверную формулу нельзя.
  const r=170;
  const candidates=aliveNear(P.x,P.y,r);
  for(const e of candidates){
   hitEnemy(e,90*P.dmgMul,'void',true);
   const dd=Math.max(40,Math.hypot(e.x-P.x,e.y-P.y));
   e.kx=(e.kx||0)+(e.x-P.x)/dd*450;
   e.ky=(e.ky||0)+(e.y-P.y)/dd*450;
  }
  spawnFlash(P.x,P.y,1,cv.color||'#b478ff');
 }
 // общий бафф темпа: без богов ×1.4 / Ярило ×2.5 (было 1.5/3 — чуть мягче)
 P.specialRate=currentBoon==='yarilo'?2.5:1.4;
 P.specialBuffT=4.5;
}



// ============================================================
