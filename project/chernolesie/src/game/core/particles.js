// ============================================================
// v6.64: СПРАЙТОВЫЕ ЧАСТИЦЫ. Вместо процедурных квадратиков —
// маленькие canvas-спрайты (капля, щепка, осколок, лист, чешуя, кристалл,
// обломок), генерируются ОДИН РАЗ при старте и кэшируются по (тип,цвет).
// Рендер частицы — один drawImage с поворотом: быстрее примитивов.
// ============================================================
const PARTICLE_TYPES=['drop','chip','shard','leaf','scale','crystal','chunk'];
const _partSprCache={};
function makeDropSprite(col){
 const c=document.createElement('canvas');c.width=c.height=16;
 const g=c.getContext('2d');
 const gr=g.createRadialGradient(5,5,1,8,8,7);
 gr.addColorStop(0,'#fff');gr.addColorStop(0.25,col);gr.addColorStop(1,'rgba(0,0,0,0)');
 g.fillStyle=gr;g.beginPath();g.ellipse(8,8,6.5,4.6,-0.5,0,TAU);g.fill();
 return c;
}
function makeChipSprite(col){
 const c=document.createElement('canvas');c.width=c.height=14;
 const g=c.getContext('2d');
 g.fillStyle=col;g.strokeStyle='rgba(0,0,0,0.25)';g.lineWidth=1;
 g.beginPath();g.moveTo(2,9);g.lineTo(6,2);g.lineTo(11,5);g.lineTo(9,11);g.lineTo(3,12);g.closePath();g.fill();g.stroke();
 return c;
}
function makeShardSprite(col){
 const c=document.createElement('canvas');c.width=c.height=14;
 const g=c.getContext('2d');
 g.fillStyle=col;g.strokeStyle='rgba(255,255,255,0.5)';g.lineWidth=0.8;
 g.beginPath();g.moveTo(7,0);g.lineTo(11,8);g.lineTo(7,13);g.lineTo(3,8);g.closePath();g.fill();g.stroke();
 return c;
}
function makeLeafSprite(col){
 const c=document.createElement('canvas');c.width=c.height=12;
 const g=c.getContext('2d');
 g.fillStyle=col;
 g.beginPath();g.ellipse(6,6,5,2.4,0,0,TAU);g.fill();
 g.strokeStyle='rgba(0,0,0,0.2)';g.lineWidth=0.7;
 g.beginPath();g.moveTo(1,6);g.lineTo(11,6);g.stroke();
 return c;
}
function makeScaleSprite(col){
 const c=document.createElement('canvas');c.width=c.height=12;
 const g=c.getContext('2d');
 g.fillStyle=col;g.strokeStyle='rgba(255,255,255,0.35)';g.lineWidth=0.8;
 g.beginPath();g.arc(6,7,4.6,Math.PI,0);g.closePath();g.fill();g.stroke();
 return c;
}
function makeCrystalSprite(col){
 const c=document.createElement('canvas');c.width=c.height=16;
 const g=c.getContext('2d');
 g.fillStyle=col;
 g.beginPath();g.moveTo(8,0);g.lineTo(12,7);g.lineTo(8,15);g.lineTo(4,7);g.closePath();g.fill();
 g.fillStyle='rgba(255,255,255,0.45)';
 g.beginPath();g.moveTo(8,2);g.lineTo(10,7);g.lineTo(8,12);g.lineTo(6,7);g.closePath();g.fill();
 return c;
}
function makeChunkSprite(col){
 const c=document.createElement('canvas');c.width=c.height=12;
 const g=c.getContext('2d');
 g.fillStyle=col;g.strokeStyle='rgba(0,0,0,0.3)';g.lineWidth=1;
 g.beginPath();g.moveTo(3,9);g.lineTo(2,4);g.lineTo(7,1);g.lineTo(10,5);g.lineTo(8,10);g.closePath();g.fill();g.stroke();
 return c;
}
function particleSprite(type,col){
 const key=type+'|'+col;
 let s=_partSprCache[key];
 if(s)return s;
 if(type==='drop')s=makeDropSprite(col);
 else if(type==='chip')s=makeChipSprite(col);
 else if(type==='shard')s=makeShardSprite(col);
 else if(type==='leaf')s=makeLeafSprite(col);
 else if(type==='scale')s=makeScaleSprite(col);
 else if(type==='crystal')s=makeCrystalSprite(col);
 else s=makeChunkSprite(col);
 _partSprCache[key]=s;
 return s;
}
// Сопоставление флагов частицы -> тип спрайта
function particleTypeOf(p){
 if(p.blood)return 'drop';
 if(p.wood)return 'chip';
 if(p.bone)return 'shard';
 if(p.silt)return 'chunk';
 if(p.ice)return 'crystal';
 return 'spark';   // обычные искры/пыль — оставляем примитив ниже
}
// Инициализация: прогреваем кэш распространёнными цветами (без аллокаций в кадре)
(function(){
 for(const col of ['#7a2412','#6a4a28','#8fd06a','#1b2030','#6f5aa0','#b478ff','#405020','#9ac06a','#cfe86a','#7fb04a','#bfe08a','#ffaa44','#ffcf6a','#5adcff','#ffd94a','#fff','#ff9a3c','#c8d8e4','#5a4a30']){
  for(const t of PARTICLE_TYPES)particleSprite(t,col);
 }
})();
function resetDmg(t){t.t=0.5;t.x=t.y=0;t.v=0;t.tag='phys';t.color='#fff';t.crit=false;}
function resetGem(g){g.x=g.y=0;g.v=1;g.col='#5adcff';g.sc=1;g.vx=g.vy=0;g.pop=0;g.ms=0;g.dead=false;g._tr=null;g._ti=0;}   // v6.2: sc // v6.42: сброс хвоста
function resetFlash(f){f.t=f.max=0.16;f.x=f.y=0;f.big=0;f.w=0;f.color='#ffe6a0';}   // v6.43: w — вес удара
// v6.11: пул кристаллов был 80 на всю карту, а на скриншотах VS их на экране
// сотни — это половина ощущения лута. После тиров v6.2 один кристалл рисуется
// одним drawImage из кэша, поэтому потолок можно поднимать смело.
const MAX_GEMS=520;
// Мягкий предел: сверху него дальние кристаллы засчитываются автоматически.
// 140 подобрано по замеру — столько помещается в полтора экрана вокруг игрока,
// не превращая поле в россыпь.
const GEM_SOFT=140;
function spawnGem(x,y,v,col,vx,vy,sc){
 if(ACTIVE.gems.length>=MAX_GEMS){
  // v5.77: был просто return null — опыт ИСЧЕЗАЛ. При дожде с босса (16 гемов)
  // или плотной волне лимит выбивается, и игрок молча терял уровни.
  // Начисляем номинал напрямую, теми же множителями, что и при подборе.
  xp+=(v||1)*(P.xpMul||1)*(omen.id==='moon'?1.3:1);
  return null;
 }
 const g=poolGet(POOL.gems,resetGem);
 g.x=x;g.y=y;g.v=v;g.col=col;g.vx=vx||0;g.vy=vy||0;g.pop=0;g.ms=0;g.dead=false;g.sc=sc||1;   // v6.2: sc — визуальный размер по номиналу
 return g;
}
// v6.2: НОМИНАЛЫ КРИСТАЛЛОВ. Раньше номинал был жёстко 1 (у упыря 2), а поле xp:
// в ETYPES — авторская таблица ценности врагов (1,2,3,5,6,10,12,40) — использовалось
// ТОЛЬКО как булево `e.xp>1`. То есть Чащобный Хозяин (300 HP, xp:40) давал ровно
// столько же опыта, сколько Волколак (9 HP, xp:2): 3 гема по 1. Опыт зависел от
// ЧИСЛА убийств и никак — от их сложности.
// Теперь ценность выплачивается номиналами 1/5/25, как в Vampire Survivors:
//  • сложные враги реально окупаются (Чащобный = 40 против 1 у Лешего);
//  • сущностей на экране МЕНЬШЕ, а не больше: босс отдаёт 250 опыта десятью
//    гемами вместо 16 гемов по 2 (32 опыта) — раньше пул из 80 гемов выбивался
//    и опыт молча пропадал (см. фикс v5.77);
//  • цвет теперь читается как ценность, а не как тип врага: игрок видит красный
//    кристалл и бежит за ним. Тип врага и так понятен по спрайту.
const GEM_TIERS=[{v:25,col:'#ff7a3c',sc:1.6},{v:5,col:'#78ff8c',sc:1.25},{v:1,col:'#5adcff',sc:1}];
// Разбивает ценность на минимальное число гемов крупнейшими номиналами.
function dropXp(x,y,total,spread,vx,vy){
 let rest=Math.max(0,Math.round(total));
 for(const t of GEM_TIERS){
  let n=Math.floor(rest/t.v);
  while(n-->0){
   const sp=spread||8;
   spawnGem(x+srnd(-sp,sp),y+srnd(-sp,sp),t.v,t.col,
            vx!=null?srnd(-vx,vx):srnd(-70,70),
            vy!=null?srnd(-vy,-vy*0.3):srnd(-110,-30),t.sc);
   rest-=t.v;
  }
 }
}
const MAX_PARTICLES=200;
const MAX_FLASHES=30;
const MAX_DMG_TEXTS=30;
function spawnParticle(x,y,vx,vy,life,col,gravity,blood){
 if(ACTIVE.particles.length>=MAX_PARTICLES)return null;
 const p=poolGet(POOL.particles,resetParticle);
 p.x=x;p.y=y;p.vx=vx;p.vy=vy;p.life=life;p.max=life;p.c=col;p.g=gravity||0;p.blood=blood||0;
 return p;
}
function spawnDmgText(x,y,v,tag,crit){
 if(ACTIVE.dmgTexts.length>=MAX_DMG_TEXTS)return null;
 const t=poolGet(POOL.dmgTexts,resetDmg);t.x=x;t.y=y;t.v=v;t.tag=tag;const colMap={phys:'#fff',elec:'#8fd0ff',pois:'#9ac06a',frost:'#bfe0ff',void:'#b478ff',gold:'#ffcf6a'};t.color=colMap[tag]||'#fff';t.crit=crit;if(crit)t.color='#ffd94a';   // v6.61: крит — золотой
return t;
}
function spawnFlash(x,y,big,color){
 if(ACTIVE.flashes.length>=MAX_FLASHES)return null;
 const f=poolGet(POOL.flashes,resetFlash);f.x=x;f.y=y;
 // v6.43 БЕЛЫЕ ЯЙЦА НАД ВРАГАМИ. hitEnemy передаёт сюда ВЕС удара дробью
 // (0.2+0.8*_wt), а тут стояло big?1:0 — любое ненулевое значение становилось
 // ЕДИНИЦЕЙ. То есть КАЖДЫЙ удар, даже самый слабый, рождал «большую» вспышку
 // с белым ядром радиусом 10.6 мировых единиц. При зуме «Толпа» и FXS=2.13
 // это сплошной белый овал над каждым задетым врагом — их и видно на скриншоте.
 // Теперь вес сохраняется как есть (0..1) и плавно масштабирует вспышку.
 f.w=Math.max(0,Math.min(1,typeof big==='number'?big:(big?1:0)));
 f.big=f.w>=0.75?1:0;                      // «большой» только по-настоящему тяжёлый удар
 f.t=0.14+0.10*f.w;f.max=f.t;f.color=color||'#ffe6a0';return f;
}

