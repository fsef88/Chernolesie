// ============================================================
//  СОСТОЯНИЕ
// ============================================================
let P={x:1000,y:1000,r:14,hp:100,maxhp:100,spd:200,fx:1,fy:0,pickup:105,dmgMul:1,rateMul:1,areaMul:1,animT:0,atk:0,moving:false,specialRate:1,regen:0,armor:0,crit:0,luck:0,bossMul:1,goldMul:1,xpMul:1,maxRelics:3,specialBuffT:0,lifesteal:0,frostR:1,swordRate:1,boltRateMul:1,boltDmgMul:1,bowRate:1,bowRange:0,bowDouble:0,arrowPoison:0,arrowFrost:0,_metaStartBow:0,_metaStartBolt:0,slowT:0,shieldT:0,shadowOrbT:0,shadowOrbMul:1,_shadowOrbBase:null,_orbBase:null,evoSwordBleed:0,evoBoltStorm:0,evoBowRain:0,synergyMark:0,invuln:0,cdMul:1,pierceMul:1}; // v6.19 (C1): оси кулдаун/пробитие // v5.36 (C2): invuln — таймер i-frames после получения урона
let cam={x:0,y:0};
let camTarget={x:0,y:0,maxX:0,maxY:0};   // v6.1: цель камеры; сглаживание идёт в draw() по времени кадра
let enemies=[],slashes=[],bolts=[],arrows=[],aimLines=[],zones=[],hazards=[],anomalies=[],relics=[];
// v6.42 ПОДБОР КРИСТАЛЛА. Самое частое событие игры — за забег их сотни, —
// и до сих пор оно происходило БЕЗ единого пикселя эффекта: гем просто исчезал.
// В играх жанра именно поток подбираемого лута даёт ощущение «я гребу добро».
// Через общий пул частиц это делать нельзя (MAX_PARTICLES=200 выбьется за
// полсекунды и погасит взрывы), поэтому свой лёгкий пул: одна запись = одно
// схлопывающееся кольцо, рисуется примитивами, без аллокаций в устоявшемся виде.
// v6.50: пул поднят с 28 — теперь на нём и подбор кристаллов, и ударные
// волны от КАЖДОЙ смерти. При 100+ врагах старый потолок вытеснял кольца
// раньше, чем они дорисовывались, и волна смерти мигала.
const MAX_GEM_POPS=72;
let gemPops=[];
let coinDrops=[];   // v6.62: монеты с боссов — летят веером и подбираются
let absorbGlow=0,absorbCol='#5adcff';   // накопительное сияние героя: чем гуще поток, тем ярче
function gemPop(x,y,col,sc,out){
 if(gemPops.length>=MAX_GEM_POPS)gemPops.shift();
 // out=1 — кольцо расходится НАРУЖУ (ударная волна смерти),
 // иначе схлопывается внутрь (поглощение кристалла). Направление несёт
 // смысл: внутрь = «забрал», наружу = «разнесло».
 gemPops.push({x,y,col:col||'#5adcff',sc:sc||1,t:0.24,max:0.24,out:out?1:0});
 if(!out){
  absorbGlow=Math.min(1.25,absorbGlow+0.16*(sc||1));
  absorbCol=col||absorbCol;
 }
}
function spawnCoins(x,y,n){
 if(coinDrops.length>80)return;
 for(let i=0;i<n;i++){
  const a=rnd(0,6.283),sp=rnd(60,240);
  coinDrops.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-60,t:0.9,max:0.9,val:n>=10?3:2});
 }
}
let shake=0,hitstop=0,timeScale=1;
// v6.61: СЛОУ-МО + ZOOM-PUNCH. slowmo — секунды (реальное время) замедления мира,
// zoomPunch — множитель приближения камеры, плавно возвращается к 1.
let slowmo=0,zoomPunch=1;
const SLOWMO_SCALE=0.32;
function slowmoHit(t,zp){slowmo=Math.max(slowmo,t);zoomPunch=Math.max(zoomPunch,zp||1.05);}
// v6.22 МУЛЬТИ-КИЛЛ. Каждая смерть обрабатывалась поштучно: убил одного или
// двадцать — структура фидбэка одинаковая, и косьба толпы ничем не отличалась
// от размена с одиночкой. Копим смерти за шаг физики и выдаём ОДИН жирный
// ответ: вспышка по краям, тряска, восходящий тон, счётчик ×N.
let mkN=0,mkX=0,mkY=0,mkFlash=0,mkBest=0,_clutchArmed=false;
const GAME_SPEED=0.65; // v6.16: глобальный множитель скорости ВСЕЙ игры (бег/враги/спавн/снаряды).
 // 1.0 = оригинал, <1 = медленнее. 0.65 = -35% (чуть медленнее комфортного темпа).
let achCheckT=0; // таймер для периодической проверки достижений
let time=0,kills=0,gold=0,level=1,xp=0,xpNext=6,paused=false,over=false,won=false,runEnded=false,runStart=0,runSeed=0,prngState=0;
let pendingLevelUps=0; // v6.74: очередь окон прокачки (несколько лвл за кадр)
let started=false; // v5.34 (C1): true только после нажатия «В бой» на титульнике — бой не идёт до старта
let spawnTimer=0;let tutTimers=[];   // v5.77: все id шагов туториала, а не только первый
const weapons=[{id:'sword',cd:0.8,t:0,evo:false}];
// v5.90: ПОТОЛОК ОРБИТЫ В ОДНОМ МЕСТЕ. Было восемь независимых мутаций orbCount
// с двумя разными правилами: карты «Воронья стая» (+2) и «Стая Велеса» (+1)
// добавляли БЕЗ потолка (до 5 уровней каждая → до +15 воронов), а четыре
// синергии, классовая карта «Шёпот стаи» и ульта Воронника делали
// Math.min(8, orbCount+1). Итог: собрав 13-18 воронов картами, игрок брал
// карту с текстом «+1 ворон» и НАВСЕГДА терял всё сверх восьми. Ульта Воронника
// так же срезала стаю до 8 на время действия. Теперь любое добавление идёт
// через addOrbs() и только вверх.
const ORB_MAX=12;
function addOrbs(n){hasOrbit=true;orbCount=Math.min(ORB_MAX,(orbCount||0)+n);}
let hasOrbit=false,orbAngle=0,orbCount=0;
let hasBolt=false; // (#17) boltCd/boltT были объявлены, но НИГДЕ не использовались — удалены
let swordLvl=1,boltLvl=1,bowLvl=1;
let killCombo=0,killComboT=0;
let magnetT=0,slowMoT=0,spawnSideBias=-1;
let magnetSoftT=0;   // v6.61: слабый магнит левелапа (радиус ×2.4 подбора)
let omen={id:null,t:0,next:75,side:1,seedT:0,roshaT:0,count:0};
let poison={on:false,lvl:1,t:0,evo:false},thorn={on:false,lvl:1,evo:false},frost={on:false,lvl:1,evo:false};
let bossE=null,bossSpawned=false,eliteT=32;
let specialE={t:75};   // v6.63: таймер сюрпризов (курьер/маяк/шаман)   // v6.56: первая элита раньше, чтобы старт не был учебной прогулкой
