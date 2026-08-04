//  КОНЕЦ ЗАБЕГА
// ============================================================
let runStats={kills:0,level:0,won:false,time:0,hpPct:1,gold:0,swordEvo:false,boltEvo:false,bowEvo:false,relics:0,treant:0,mglist:0,warlord:0,maxCombo:0,bowDouble:0};
// v6.18: КТО именно добил. Документ: «Тебя добил Волколак, когда HP было 4/118» —
// конкретика превращает поражение в урок, факт смерти не превращает ни во что.
// Пишем источник последнего урона: имя, сколько снял, сколько оставалось.
let lastKiller={name:'',dmg:0,hpAfter:0,t:-99};
function enemyName(e){
 if(!e)return 'Чаща';
 if(e.boss)return 'ЗМЕЙ ГОРЫНЫЧ';
 if(e.mini||e.elite){const d0=(ETYPES[e.type]||{}).desc||'';return (d0.split(' \u2014 ')[0]||'Хозяин чащи');}
 const d=(ETYPES[e.type]||{}).desc||'';
 return d.split(' \u2014 ')[0]||'Чаща';
}
function noteHurt(src,dmg){
 if(!(dmg>0))return;
 // v6.18h: серия рвалась только при 2.4с БЕЗ убийств — при семи убийствах в
 // секунду это недостижимо, и «сеча» была вторым счётчиком убийств, а не серией.
 // Теперь полученный урон режет её вдвое: серия снова про то, КАК ты играешь,
 // а не сколько прошло времени. Половина, а не ноль — чтобы случайная царапина
 // в толпе не обнуляла десять минут аккуратной игры.
 if(typeof killCombo!=='undefined'&&killCombo>0)killCombo=Math.floor(killCombo*0.5);
 lastKiller.name=(typeof src==='string')?src:enemyName(src);
 lastKiller.dmg=dmg;lastKiller.hpAfter=Math.max(0,P.hp);lastKiller.t=time;
}
let runDmgTaken=0; // v5.41 (Б2): история урона за забег — кормит ачивку «Неуязвимый» (Б3)

// ============================================================
//  v6.31 ПОЖИЗНЕННАЯ СТАТИСТИКА
//  Условия открытия классов раньше проверялись внутри ОДНОГО забега:
//  удачная сессия открывала класс сразу, и крючок возвращения не работал.
//  Теперь ключевые цели копятся между забегами — открыть класс можно
//  только за несколько вечеров, и каждый забег виден как вклад в прогресс.
// ============================================================
let life={kills:0,runs:0,wins:0,best:0,treant:0,mglist:0,warlord:0,minis:0,bosses:0,noDmg:0};
try{
  const raw=LS.get('cl_life');
  if(raw){const q=JSON.parse(raw);
    if(q&&typeof q==='object'&&!Array.isArray(q))
      for(const k of Object.keys(life))
        if(typeof q[k]==='number'&&isFinite(q[k]))life[k]=Math.max(0,q[k]|0);}
}catch(e){swallow('save.life',e);}
function saveLife(){try{LS.set('cl_life',JSON.stringify(life));}catch(e){}}
// Вызывается один раз в конце забега — до проверки достижений.
function commitLife(victory){
  life.runs++;
  life.kills   += Math.max(0,kills|0);
  if(victory)life.wins++;
  if(time>life.best)life.best=Math.round(time);
  life.treant  += Math.max(0,treantKills|0);
  life.mglist  += Math.max(0,mglistKills|0);
  life.warlord += Math.max(0,warlordKills|0);
  life.minis   += Math.max(0,(treantKills|0)+(mglistKills|0)+(warlordKills|0));
  if(victory)life.bosses++;
  if(runDmgTaken<=0&&time>=120)life.noDmg++;
  saveLife();
}

// ============================================================
// ВОЗРОЖДЕНИЕ ЗА РЕКЛАМУ (v5.66)
// Платформенный SDK подключается в одном месте — AD.show. Ни игровой код,
// ни UI про конкретную платформу не знают.
// Яндекс.Игры:   ysdk.adv.showRewardedVideo({callbacks:{onRewarded,onClose,onError}})
// Другие сети:   вызвать onReward() при фактическом просмотре, иначе onFail().
// ============================================================
