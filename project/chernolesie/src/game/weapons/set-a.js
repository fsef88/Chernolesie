let serpAng=0;                       // фаза серпов
let volki=[];                        // призванные волки
const NEWW_LVL={serp:1,kosa:1,ugli:1,kamen:1,obereg:1,zov:1};
function nwLvl(id){return NEWW_LVL[id]||1;}

// ---------- СЕРП-ОБОРОТЕНЬ: два лезвия по кругу, возвращаются ----------
function doSerp(){
 const lvl=nwLvl('serp'),w=weapons.find(x=>x.id==='serp');
 // v6.39 жест: серп: искры схода лезвия
 {for(let _i=0;_i<5;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*180,Math.sin(_a)*180,rnd(.18,.34),'#cfe0ff',40,0);} spawnFlash(P.x,P.y,0,'#ffd27a');}
 const evo=w&&w.evo, n=Math.max(1,Math.round(((evo?4:2)+Math.floor((lvl-1)/2))*wAmt('serp')));
 // v6.18: было «вдвое больше лезвий» — то есть то же самое, только чаще. Документ
 // (ч.2 шаг 4): после эволюции игрок должен ИГРАТЬ иначе. Теперь лезвия не летят
 // и не возвращаются — они остаются на орбите и превращают серп из залпового
 // оружия в постоянную зону вокруг героя. Урон за удар тот же, меняется ритм.
 if(evo){
  const R=(74+10*lvl)*wArea('serp');
  const dmg=(9+4*lvl)*wDmg('serp')*0.55;   // урон срезан: орбита бьёт непрерывно
  while(serpOrbs.length<n)serpOrbs.push({a:seedRandom()*TAU,cd:0});
  while(serpOrbs.length>n)serpOrbs.pop();
  for(const o of serpOrbs){o.R=R;o.dmg=dmg;}
  return true;
 }
 const R=(74+10*lvl)*wArea('serp'), spd=evo?420:330;
 const dmg=(9+4*lvl)*wDmg('serp');
 for(let i=0;i<n;i++){
  const a=serpAng+i*(TAU/n);
  arrows.push({x:P.x,y:P.y-8,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:2.2,dmg,
   evo:!!evo,pierced:0,rangeLeft:null,_hit:null,
   _boom:true,_bmR:R,_bmT:0,_bmHome:evo?1:0,_col:evo?'#ffd27a':'#cfe0ff'});
 }
 serpAng+=0.7;
 return true;
}
// ---------- КОСА МОРЫ: широкий конус по взгляду ----------
function doKosa(){
 const lvl=nwLvl('kosa'),w=weapons.find(x=>x.id==='kosa');
 // v6.39 жест: коса: морозная пыль по дуге
 {const _fa=Math.atan2(P.fy||0,P.fx||1);for(let _i=0;_i<7;_i++){const _a=_fa+rnd(-0.8,0.8);spawnParticle(P.x+Math.cos(_a)*40,P.y+Math.sin(_a)*40,Math.cos(_a)*140,Math.sin(_a)*140,rnd(.2,.45),'#bfe0ff',30,0);}}
 const evo=w&&w.evo;
 const R=(96+16*lvl)*wArea('kosa');
 const halfArc=(evo?1.15:0.75);
 // v7.35: зона рисуется тем же конусом, по которому идёт попадание (см. dot ниже).
 // До этого рисовался полный круг — вчетверо больше, чем коса на самом деле бьёт.
 pulseZone(P.x,P.y,R,'kosa',0,halfArc);
 const fx=P.fx||1,fy=P.fy||0;
 const list=enemiesNear(P.x,P.y,R+24);
 let hitAny=false;
 const dmg=(14+6*lvl)*wDmg('kosa');
 for(const e of list){
  if(e.hp<=0||e.dying>0)continue;
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  if(d>R+e.r)continue;
  const dot=(dx*fx+dy*fy)/d;
  if(dot<Math.cos(halfArc))continue;
  let crit=P.crit&&seedRandom()<P.crit;
  hitEnemy(e,crit?dmg*2:dmg,'phys',crit);
  if(crit)sfxCrit();
  // отбрасывание — коса «сметает» строй
  const kk=evo?260:150;
  e.kx+=dx/d*kk;e.ky+=dy/d*kk;
  // v6.19: вместо заморозки-отбрасывания ЭВО-коса СТЯГИВАЕТ скошенного к ногам.
  // Заморозка была «сильнее, чем было» — не меняла ритм. Помечаем точку,
  // а притяжение и урон делает tickWeaponState (постоянная зона под игроком).
  if(evo){if(!e._kosaPull)e._kosaPull=1;kosaTrail.push({x:e.x,y:e.y});}
  // синергия «Погребальный круг»: скошенные оставляют могилы для Тризны
  if(P.synGrave&&e.hp<=0)TRIZNA_MARKS.push({x:e.x,y:e.y});
  hitAny=true;
 }
 slashes.push({ang:Math.atan2(fy,fx),reach:R,t:0.26,arc:halfArc,evo:!!evo,_kosa:true});
 return true;
}
// ---------- УГЛИ ЧЕРНОБОГА: горящий след позади ----------
function doUgli(){
 const lvl=nwLvl('ugli'),w=weapons.find(x=>x.id==='ugli');
 // v6.39 жест: угли: тлеющие искры
 {for(let _i=0;_i<5;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*60,Math.sin(_a)*60-30,rnd(.35,.7),'#ff8a3c',-50,0);}}
 const evo=w&&w.evo;
 if(!P.moving&&!evo)return false;
 const r=(30+5*lvl)*wArea('ugli');
 const dur=(evo?5.5:2.6)*wDur('ugli');   // v6.19: эво-след дольше, чтобы успел разрастись
 const r0=(evo?18:30+5*lvl)*wArea('ugli'); // v6.19: эво стартует малым, растёт в тике
 zones.push({x:P.x,y:P.y,r:r0,t:dur,max:dur,
  dmg:(7+3*lvl)*wDmg('ugli'),_fire:true,_evo:!!evo,
  _gr:!!evo,_grMax:(evo?(30+8*lvl):0)*wArea('ugli')}); // v6.19: _gr -> рост радиуса в тике
 return true;
}
// ---------- КАМЕНЬ АЛАТЫРЬ: рикошет между врагами ----------
function doKamen(){
 const lvl=nwLvl('kamen'),w=weapons.find(x=>x.id==='kamen');
 // v6.39 жест: камень: каменная крошка
 {for(let _i=0;_i<4;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*150,Math.sin(_a)*150,rnd(.25,.5),'#d8d0c0',320,0);}}
 const evo=w&&w.evo;
 const first=aliveNear(P.x,P.y,300)
   .sort((a,b)=>dist2(a.x-P.x,a.y-P.y)-dist2(b.x-P.x,b.y-P.y))[0];
 if(!first)return false;
 const a=Math.atan2(first.y-P.y,first.x-P.x);
 const spd=380;
 arrows.push({x:P.x,y:P.y-8,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,life:3.5,
  dmg:(11+5*lvl)*wDmg('kamen'),evo:!!evo,pierced:0,rangeLeft:null,_hit:[],
  _ric:Math.max(1,Math.round(((evo?7:3)+Math.floor(lvl/2))*wAmt('kamen'))),
  _split:!!evo,_col:evo?'#ffe9a8':'#d8d0c0',_stone:true}); // v6.19: _split -> раскол на отскоке
 return true;
}
// ---------- ОБЕРЕГ РОДА: кольцо, что жжёт и толкает ----------
function doObereg(){
 const lvl=nwLvl('obereg'),w=weapons.find(x=>x.id==='obereg');
 const evo=w&&w.evo;
 const R=(70+14*lvl)*wArea('obereg');
 const list=enemiesNear(P.x,P.y,R+30);
 const dmg=(6+3*lvl)*wDmg('obereg');
 for(const e of list){
  if(e.hp<=0||e.dying>0)continue;
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  if(d>R+e.r)continue;
  hitEnemy(e,dmg,'elec',false);
  const kk=evo?300:180;
  e.kx+=dx/d*kk;e.ky+=dy/d*kk;
  if(evo&&seedRandom()<0.25)e.frozen=Math.max(e.frozen||0,0.9);
 }
 zones.push({x:P.x,y:P.y,r:R,t:0.22,max:0.22,dmg:0,_ring:true,_evo:!!evo});
 // v6.18: Круг предков держит стену (см. tickWeaponState) — эволюция даёт МЕСТО,
 // где можно стоять, а не просто более сильный толчок.
 if(evo){oberegWall.t=1.6*wDur('obereg');oberegWall.r=R;}
 // синергия «Родникова стена»: оберег лечит за каждого отброшенного
 if(P.synDewWard){
  const healed=Math.min(6,list.length)*0.5;
  if(healed>0&&P.hp<P.maxhp){P.hp=Math.min(P.maxhp,P.hp+healed);
   for(let k=0;k<3;k++)spawnParticle(P.x+rnd(-10,10),P.y-rnd(0,18),rnd(-10,10),-rnd(20,50),rnd(.3,.6),'#8fff8a',0,0);}
 }
 return true;
}
// ---------- ЗОВ ВЕЛЕСА: волки-охотники ----------
function doZov(){
 const lvl=nwLvl('zov'),w=weapons.find(x=>x.id==='zov');
 // v6.39 жест: зов: пыль из-под лап
 {for(let _i=0;_i<5;_i++){const _a=Math.random()*TAU;spawnParticle(P.x,P.y,Math.cos(_a)*90,Math.sin(_a)*90,rnd(.3,.6),'#7a6a4a',200,0);} spawnFlash(P.x,P.y,0,'#9ac06a');}
 const evo=w&&w.evo;
 const cap=Math.max(1,Math.round(((evo?6:3)+Math.floor((lvl-1)/1.5))*wAmt('zov')));   // v6.34: было (4:2)+lvl/2 —
 // зов ограничен ЧИСЛОМ волков, а не уроном, поэтому множитель урона на нём почти не работал (10 убийств за замер).
 if(volki.length>=cap)return false;
 const a=srnd(0,TAU); // v6.74: детерминизм Daily (seedRandom вместо Math.random)
 volki.push({x:P.x+Math.cos(a)*40,y:P.y+Math.sin(a)*40,vx:0,vy:0,
  life:(evo?14:9)*wDur('zov'),cd:0,evo:!!evo,dmg:(12+6*lvl)*wDmg('zov'),tgt:null});
 return true;
}
// ---------- обновление волков ----------
function updateVolki(dt){
 if(!volki.length)return;
 for(let i=volki.length-1;i>=0;i--){
  const v=volki[i];
  v.life-=dt;if(v.life<=0){volki.splice(i,1);continue;}
  if(v.cd>0)v.cd-=dt;
  if(!v.tgt||v.tgt.hp<=0||v.tgt.dying>0||dist(v.tgt.x-v.x,v.tgt.y-v.y)>420){
   const c=aliveNear(v.x,v.y,420);
   v.tgt=c.length?c.sort((a,b)=>dist2(a.x-v.x,a.y-v.y)-dist2(b.x-v.x,b.y-v.y))[0]:null;
  }
  let tx,ty;
  if(v.tgt){tx=v.tgt.x;ty=v.tgt.y;}
  else{tx=P.x;ty=P.y;}
  const dx=tx-v.x,dy=ty-v.y,d=Math.hypot(dx,dy)||1;
  const spd=(v.evo?250:200);
  if(d>16){v.x+=dx/d*spd*dt;v.y+=dy/d*spd*dt;}
  if(v.tgt&&d<v.tgt.r+18&&v.cd<=0){
   let crit=P.crit&&seedRandom()<P.crit;
   hitEnemy(v.tgt,crit?v.dmg*2:v.dmg,'phys',crit);
   if(crit)sfxCrit();
   v.tgt.kx+=dx/d*120;v.tgt.ky+=dy/d*120;
   v.cd=v.evo?0.45:0.7;
   // v6.19: Стая-тень — волк-эволюция, добивший врага, ДЕЛИТСЯ. Кап держит
   // численность (как в doZov), чтобы деление не засеяло карту за секунду.
   // v6.19: деление детерминированное (без seedRandom) — ROADMAP требует,
   // чтобы волк делился при каждом добивании; кап capZ держит численность.
   if(v.evo&&v.tgt.hp<=0){
    const capZ=Math.max(1,Math.round((2+Math.floor((nwLvl('zov')-1)/2))*wAmt('zov')));
    if(volki.length<capZ){
     volki.push({x:v.tgt.x,y:v.tgt.y,vx:0,vy:0,life:(14)*wDur('zov'),cd:0,evo:true,
      dmg:(12+6*nwLvl('zov'))*wDmg('zov'),tgt:null});
     for(let k=0;k<4;k++){const an=Math.random()*TAU,sp=rnd(30,90);
      spawnParticle(v.tgt.x,v.tgt.y,Math.cos(an)*sp,Math.sin(an)*sp,rnd(.15,.35),'#ffd27a',0,0);}
    }
   }
   for(let k=0;k<3;k++){const an=Math.random()*TAU,sp=rnd(40,110);
    spawnParticle(v.tgt.x,v.tgt.y,Math.cos(an)*sp,Math.sin(an)*sp,rnd(.12,.3),'#c9b08a',0,0);}
  }
  if(Math.random()<0.25)spawnParticle(v.x,v.y+6,rnd(-12,12),rnd(-6,6),rnd(.1,.25),v.evo?'#ffd27a':'#8a7a60',0,0);
 }
}
// ---------- отрисовка волков ----------
function drawVolki(){
 // v7.31: 100% Анимированная 8-кадровая отрисовка Призрачных Волков Велеса (WOLF_SPIRIT_SHEET)
 for(let i=0;i<volki.length;i++){
  const v=volki[i];const vx=v.x-cam.x,vy=v.y-cam.y;
  const fade=Math.min(1,v.life/1.2);
  const face=(v.tgt&&v.tgt.x<v.x)?-1:1;
  ctx.save();ctx.translate(vx,vy);ctx.globalAlpha=0.9*fade;ctx.scale(face,1);
  if(typeof WOLF_SPIRIT_SHEET !== 'undefined' && WOLF_SPIRIT_SHEET.complete && WOLF_SPIRIT_SHEET.naturalWidth){
   const prog = (time * 8.0 + i * 0.18) % 1.0;
   const fIdx = Math.floor(prog * 8) % 8;
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sw = 160, sh = 160;
   ctx.globalCompositeOperation='lighter';
   ctx.drawImage(WOLF_SPIRIT_SHEET, col*sw, row*sh, sw, sh, -24, -20, 48, 40);
  } else {
   ctx.fillStyle=v.evo?'#ffcf6a':'#8fff8a';
   ctx.beginPath();ctx.ellipse(0,0,16,8,0,0,TAU);ctx.fill();
  }
  ctx.restore();
 }
}

// ============================================================
//  v6.17b ВТОРАЯ ВОЛНА АРСЕНАЛА — ещё 8 орудий
//  Цель — закрыть РОЛИ, которых в игре не было:
//   kolokol — удар по всему экрану с редким кулдауном (панический сброс)
//   verv    — цепь между двумя врагами, режет всех на отрезке (позиционная)
//   idol    — стационарный тотем, держит точку (единственное «поставил и ушёл»)
//   navi    — бьёт ЗА спину, награда за бегство сквозь строй
//   rosa    — лечит и жжёт по кольцу, единственный источник саппорта в оружии
//   vihr    — затягивает врагов к центру (анти-разведение, собирает толпу под АоЕ)
//   klyuka  — контратака: бьёт в ответ на полученный урон
//   zerno   — отложенный взрыв, сажается заранее (планирование маршрута)
// ============================================================
