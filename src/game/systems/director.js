// ============================================================
//  v6.58 ДИРЕКТОР СЛОЖНОСТИ
//  Не даёт раннему забегу превращаться в прогулку: если игрок здоров и быстро
//  косит, чаща плавно поджимает. Если HP проседает — даёт короткую передышку.
//  Важно: коэффициент меняется медленно, без ощущения, что игра «читерит».
// ============================================================
let directorP=1,directorT=0,directorLastKills=0,directorLogBand=0,directorGrace=0;
function directorSpawnMul(){return Math.max(0.78,Math.min(1.28,directorP));}
function directorCapMul(){return Math.max(0.84,Math.min(1.18,1+(directorP-1)*0.55));}
function directorHpMul(){return Math.max(0.88,Math.min(1.15,1+(directorP-1)*0.50));}
function directorFormMul(){return directorP>1?Math.max(0.74,1-(directorP-1)*0.55):Math.min(1.18,1+(1-directorP)*0.35);}
function updateDirector(dt){
 if(!started||paused||over||runEnded)return;
 directorT+=dt;
 if(directorGrace>0)directorGrace-=dt;
 if(directorT<0.55)return;
 const span=directorT;directorT=0;
 const hpFrac=P.hp/Math.max(1,P.maxhp);
 const dk=Math.max(0,kills-directorLastKills);directorLastKills=kills;
 const kps=dk/span;
 let target=1;
 // Первые секунды не давим: игрок осматривается и выбирает траекторию.
 if(time<20)target=0.96;
 else if(hpFrac<0.22){target=0.78;directorGrace=7;}
 else if(hpFrac<0.36){target=0.88;directorGrace=4;}
 else if(directorGrace>0){target=0.90;}
 else{
  // Если игрок здоров и быстро косит — поджимаем. Если темп низкий — держим базу.
  const healthy=hpFrac>0.72?1:hpFrac>0.55?0.5:0;
  const pace=Math.max(0,Math.min(1,(kps-1.0)/2.2)); // 1 kill/s уже нормально, 3.2 kill/s — легко
  target=1+0.28*Math.max(healthy,pace)*Math.max(0.35,pace);
 }
 // Плавно: вверх медленнее, вниз быстрее.
 const rate=(target>directorP)?0.045:0.11;
 directorP+=Math.max(-0.18,Math.min(0.18,target-directorP))*rate;
 directorP=Math.max(0.78,Math.min(1.28,directorP));
}

function enemyCap(t){const p=progT(t);return Math.round(Math.min(BALANCE.capMax,BALANCE.capBase+BALANCE.capPer60*Math.floor(p/60))*viewDensityMul()*directorCapMul());}
function nearCap(t){const p=progT(t);return Math.round(Math.min(BALANCE.nearMax,BALANCE.nearBase+BALANCE.nearPer60*Math.floor(p/60))*viewDensityMul()*directorCapMul());}
// v5.65: выбор типа по весам вместо цепочки if — прежняя цепочка дважды рожала
// мёртвые типы (волколак в v5.41, полуденница и упырь в v5.64): окно порога
// перекрывалось соседней ветвью и тип не выпадал никогда.
function pickEnemyType(t){
 const k=Math.min(1,t/BALANCE.bossTime);
 // v6.25: ворота типов сверяем с временем ПРОГРЕССА — иначе в коротком
 // режиме половина бестиария не успевает выйти, а с ней уходит и опыт.
 const pt=progT(t);
 let sum=0;const w=new Array(SPAWN_TABLE.length);
 for(let i=0;i<SPAWN_TABLE.length;i++){
  const e=SPAWN_TABLE[i];
  w[i]=(pt>e.gate)?(e.w0+(e.w1-e.w0)*k):0;
  sum+=w[i];
 }
 if(sum<=0)return 'leshiy';
 let r=seedRandom()*sum;                       // seedRandom — состав волны в Daily воспроизводим
 for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return SPAWN_TABLE[i].t;}
 return 'leshiy';
}
// v7.36 ЛЕТАЛЬНОСТЬ ВРАГА. Парная к enemyHpMul и главная из двух.
//
//  До неё урон врага не рос вообще: `e.dmg` — статическое число из ETYPES.
//  Замер стоячего бота: 28 минут, ни одной просадки глубже 3% полосы, ниже
//  всего HP опускалось на ШЕСТОЙ СЕКУНДЕ забега. Росло только здоровье врага,
//  то есть враг становился дольше живущим, но не более опасным.
//
//  Форма взята с эталона (docs/analysis/07-vs-numbers.md): ступень раз в
//  минуту, вчетверо-впятеро за забег. Не плавная кривая: у VS урон меняется
//  скачком вместе со сменой состава волны, и это читается как «пришли те, кто
//  бьёт больнее», а не как незаметное подкручивание.
//
//  Директор сюда НЕ вмешивается намеренно. Он уже правит спавн, кап и HP;
//  если дать ему ещё и урон, просадка HP игрока станет самоусиливающейся —
//  ранил, он снизил давление, игрок отъелся, и так по кругу.
function enemyDmgMul(t){
 const p=progT(t);
 return Math.min(BALANCE.dmgMax,1+BALANCE.dmgPerStep*Math.floor(p/BALANCE.dmgStepSec));
}
function enemyHpMul(t,diff){
 // v6.18h РАННЯЯ ПРИБАВКА. Замер: 00:50 — 374 убийства, то есть 7.5 в секунду
 // при трёх орудиях первого уровня и 96/100 HP у героя. Сопротивления не было
 // вообще. Причина: базовые HP (леший 5, русалка 4) считались под арсенал из
 // семи орудий, а их теперь 23 — выхлоп вырос кратно, кривая HP осталась прежней
 // (+6% за 30с, то есть на 50-й секунде ровно ×1.06).
 // Прибавка растёт от ×1.0 на старте до ×2.6 к двум минутам: первые секунды
 // остаются лёгкими (там у игрока одно оружие), а дальше сопротивление догоняет
 // рост арсенала. Потолок hpMax поднят с 8 до 12, иначе множитель упирался бы
 // в него уже к пятнадцатой минуте и конец забега становился бы легче середины.
 // ЭТО ПЕРВОЕ ПРИБЛИЖЕНИЕ. Крутить здесь: 1.6 — насколько жёстче станет ранняя
 // игра, 120 — за сколько секунд прибавка выходит на полную.
 // ОНБОРДИНГ. Было 1+2.0*min(1,t/110): HP врагов утраивались за 110 секунд,
 // тогда как второе оружие выпадает по удаче карт. Замер 6 прогонов на первой
 // минуте: с одним оружием — 77-133 убийства, с тремя — 389-474. Отставшие
 // билды упирались в стену и переставали убивать вообще (прогон: 176 убийств
 // на 2:00, 193 на 5:00 — три минуты без единого килла).
 // Стало мягче и растянуто вдвое: первые две минуты игрок раскатывает толпу,
 // сопротивление догоняет к третьей, когда арсенал уже собран.
 // Живой замер: за первые полторы минуты игрок получил 60 урона при 188 HP —
 // прогулка. При этом умер он на 14:35, то есть поздняя игра давит правильно.
 // Поэтому меняем только ФОРМУ разгона, не потолок: та же прибавка ×2.3, но
 // набирается за 130 секунд вместо 200. Всё, что после второй минуты, — как было.
 const early=1+1.3*Math.min(1,Math.max(0,t)/130);
 const m=(1+BALANCE.hpPerStep*Math.floor(t/BALANCE.hpStepSec))*early;
 return Math.min(BALANCE.hpMax,m)*directorHpMul()*(isFinite(diff)?diff:1);
}
// v6.25: было const — короткий режим не мог сдвинуть выход босса.
// Теперь значение задаётся applyRunMode() при старте забега.
let BOSS_TIME=BALANCE.bossTime;
let bossT=BOSS_TIME; // глобальная для отображения в draw()

