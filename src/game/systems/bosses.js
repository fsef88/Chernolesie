// ============================================================
//  v7.36 ВХОД ПРЯМО В БОЙ С ГОРЫНЫЧЕМ — адрес ?boss=1
//
//  Зачем: настройка финального боя стоила получаса живой игры за одну
//  проверку. Столько времени на один замер не потратит никто, поэтому бой
//  и оставался ненастроенным.
//
//  Что делает: собирает состояние, в котором игрок ПОДХОДИТ к боссу —
//  28-я минута, шесть слотов оружия под завязку, максимальные уровни,
//  эволюции, потолок меты — и выпускает Горыныча через четыре секунды.
//
//  Это НАМЕРЕННО верхняя оценка силы игрока, а не средняя. Финальный босс
//  настраивается против хорошего билда: если он тяжёл для собранного
//  игрока, слабому он тем более не по зубам, и это правильный порядок.
//  Бот из телеметрии для этого не годится совсем — он берёт первую карту
//  подряд и приходит к боссу с тремя орудиями и +20% урона.
//
//  Числа живучести — те же, что в balance.js и docs/analysis/07-vs-numbers.md.
// ============================================================
let __BOSS_RUSH=false;
try{__BOSS_RUSH=/[?&]boss=1/.test(location.search);}catch(e){}
function devBossRush(){
 try{
  // Хронометр сразу на экране: без него «лагает» — это ощущение, а не диагноз,
  // и непонятно, что чинить. Панель наверху справа показывает разбивку кадра.
  __PROF_ON=true;
  // Полный арсенал: шесть слотов — столько же, сколько SLOTS.weapons.
  //
  // v7.36: эволюции сняты со ВСЕХ шести. Первая версия выдавала шесть
  // эволюционировавших орудий разом, и владелец справедливо получил на телефоне
  // кашу: в живом забеге столько эволюций не собрать, каждая требует сундук и
  // рецепт. Тест обязан быть тяжёлым, но достижимым, иначе меряется то, чего в
  // игре не бывает. Две эволюции — верхняя граница реального забега.
  weapons.length=0;
  const kit=[['kosa',1.5,true],['kolokol',7.0,true],['zerno',2.0,false],
             ['vihr',3.2,false],['zercalo',1.0,false],['kosti',1.1,false]];
  for(const [id,cd,evo] of kit)weapons.push({id,cd,t:0,evo});
  for(const k in NEWW_LVL)NEWW_LVL[k]=SLOTS.maxLevel;
  swordLvl=boltLvl=bowLvl=SLOTS.maxLevel;
  // Потолок игрока: множители от карт, древа и кузницы разом.
  P.dmgMul=2.4;P.rateMul=1.5;P.areaMul=1.5;P.crit=0.35;
  P.maxhp=294;P.hp=P.maxhp;P.armor=0.45;P.regen=1.2;
  level=67;
  // Босс выходит через четыре секунды — успеть увидеть, откуда он идёт.
  time=BOSS_TIME-4;bossT=BOSS_TIME;bossSpawned=false;
  log('⚙ ОТЛАДКА: вход прямо в бой с Горынычем','gold');
 }catch(e){console.error('devBossRush:',e);}
}
function spawnBoss(){
 // Та же логика — от центра камеры + clamp в мир.
 const cx=cam.x+W/2,cy=cam.y+H/2;
 // v7.36: было `b=ETYPES.dragon`, а такого типа в ETYPES нет вовсе. Спред
 // undefined в объектном литерале молча даёт пустоту, поэтому ошибки никто не
 // видел — босс собирался целиком из литерала ниже. Убрана мёртвая ссылка.
 // v7.36: радиус выхода уменьшен с 0.85+200 до 0.62+120. При спавне почти в
 // километре и скорости 34 подход занимал те самые двадцать секунд, за которые
 // забег и заканчивался: бой сводился к тому, что босс шёл, доходил и падал.
  const b=ETYPES.dragon||{};
  const a=srnd(0,TAU),rad=Math.max(W,H)*0.62+120;
 // v6.74: удалён мёртвый блок minR (minR всегда < rad → условие недостижимо)
 let sx=cx+Math.cos(a)*rad,sy=cy+Math.sin(a)*rad;
 sx=clamp(sx,0,WORLD);sy=clamp(sy,0,WORLD);
 // v7.36: HP берётся от кривой забега, а не плоской константой — см. BALANCE.bossHp.
 const bhp=safeNum(BALANCE.bossHp*enemyHpMul(time,diffMul),BALANCE.bossHp*8); // #10: защита от NaN diffMul
 bossE=acquireEnemy({...b,x:sx,y:sy,hp:bhp,maxhp:bhp,r:46,spd:44,dmg:22,type:'dragon',boss:true,drawH:210,at:0,flash:0,slow:1,kx:0,ky:0,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,slamT:3.2,phase:1,ringT:5.5,xp:0,ai:'tank',dmgMod:1.5,fireT:0,chargeT:2.5,chargeTelegraph:0,chargeDir:null,chargeDuration:0});   // v6.72: Горынычat:0,flash:0,slow:1,kx:0,ky:0,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,slamT:3.2,phase:1,ringT:5.5,xp:0,ai:'tank',dmgMod:1.5,fireT:0,chargeT:2.5,chargeTelegraph:0,chargeDir:null,chargeDuration:0});
 document.getElementById('bossbar').style.display='block';
 document.getElementById('bossbar').classList.remove('enrage');
 document.getElementById('bossname').textContent='ЗМЕЙ ГОРЫНЫЧ';   // v6.72
 const bp0=document.getElementById('bossphase'); if(bp0)bp0.textContent='фаза I · корни';
 const bhpEl0=document.getElementById('bosshp'); if(bhpEl0)bhpEl0.classList.remove('phase2','phase3');
 const intro=document.getElementById('bossintro');
 intro.querySelector('.name').textContent='ЗМЕЙ ГОРЫНЫЧ';
 intro.querySelector('.sub').textContent='Хранитель Заставы пробудился';
 intro.classList.add('show');sfxBoss();setTimeout(()=>intro.classList.remove('show'),2500);
 log('⚠ ЗМЕЙ ГОРЫНЫЧ идёт на заставу!','warn');
}
// v5.30: стартовый титр забега. Аналог bossintro, но зелёно-золотой и
// НЕ ставит паузу/не блокирует управление — бой идёт «под титром».
// Не меняет баланс, математику боя, спавн и время (time уже сброшен в resetRun).
function showRunIntro(isDaily){
 const ri=document.getElementById('runintro');if(!ri)return;
 let txt='ЧЁРНОЛЕСЬЕ',sub='Застава встречает рассвет…';
 // (v5.34) daily НЕ объявлен глобально — свободная переменная
 // бросала ReferenceError в strict mode при каждом старте забега.
 // Определяем daily-режим по runSeed>0 (Daily Run использует seed = день).
 if(isDaily||runSeed>0){txt='ЧЁРНОЛЕСЬЕ · ДЕНЬ';sub='Испытание дня открыто';}
 ri.querySelector('.name').textContent=txt;
 ri.querySelector('.sub').textContent=sub;
 ri.classList.add('show');
 if(typeof sfxEvo==='function')sfxEvo(); // мягкий «гонг» входа
 setTimeout(()=>{ri.classList.remove('show');},2800);
}
// МИНИ-БОСС «ДРЕВЕНЬ»: тот же протокол спавна, что у босса (кольцо вокруг
// центра камеры + clamp в мир), общая интро-заставка и верхняя HP-полоса
// (если она свободна — т.е. главный босс пока не явился).
function spawnMiniBoss(){
 const cx=cam.x+W/2,cy=cam.y+H/2;
 const a=srnd(0,TAU),rad=Math.max(W,H)*0.85+200,b=ETYPES.baba_yaga;
 let sx=cx+Math.cos(a)*rad,sy=cy+Math.sin(a)*rad;
 sx=clamp(sx,0,WORLD);sy=clamp(sy,0,WORLD);
 // v5.89: Древень приходит и на 5:00, и на 20:00 (ротация BALANCE.miniAt),
 // а HP были одни и те же — поздний Древень падал мгновенно. Масштабируем.
 const ehp=safeNum(b.hp*diffMul*(1+0.05*Math.floor(time/120)),520); // #10: защита от NaN diffMul
 miniBossE=acquireEnemy({...b,x:sx,y:sy,hp:ehp,maxhp:ehp,type:'baba_yaga',mini:true,at:0,flash:0,slow:1,kx:0,ky:0,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,slamT:2.2,atkT:0,dying:0,fireT:0,phase:1,ai:'tank',dmgMod:1.6,atkFrames:TREANT_ATK,dieFrames:TREANT_DIE,atkDur:0.85,dieMax:1.25});
 if(!bossE){document.getElementById('bossbar').style.display='block';document.getElementById('bossname').textContent='ДРЕВЕНЬ'; const bpM=document.getElementById('bossphase'); if(bpM)bpM.textContent='мини · корни чащи';}
 const intro=document.getElementById('bossintro');
 intro.querySelector('.name').textContent='ДРЕВЕНЬ';
 intro.querySelector('.sub').textContent='Младший Хранитель Чёрнолесья';
 intro.classList.add('show');sfxBoss();setTimeout(()=>intro.classList.remove('show'),2500);
 log('⚠ ДРЕВЕНЬ пробудился!', 'warn');
}
// МИНИ-БОСС №2 «СТРЫГА»: быстрый охотник. Рывок: захватывает точку игрока
// (e.lx/e.ly) и летит к ней — боковой уворот спасает. В рывке урон ×dmgMod.
function spawnMini2Boss(){
 const cx=cam.x+W/2,cy=cam.y+H/2;
 const a=srnd(0,TAU),rad=Math.max(W,H)*0.85+200,b=ETYPES.naviya;
 let sx=cx+Math.cos(a)*rad,sy=cy+Math.sin(a)*rad;
 sx=clamp(sx,0,WORLD);sy=clamp(sy,0,WORLD);
 // v5.89: то же для Стрыги — приходит на 10:00 и на 25:00 с одинаковыми HP.
 const ehp=safeNum(b.hp*diffMul*(1+0.05*Math.floor(time/120)),420); // #10: защита от NaN diffMul
 mini2BossE=acquireEnemy({...b,x:sx,y:sy,hp:ehp,maxhp:ehp,type:'naviya',mini:true,at:0,flash:0,slow:1,kx:0,ky:0,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,slamT:1.6,atkT:0,dying:0,fireT:0,phase:1,howlT:4,ai:'stalker',dmgMod:1.5,lx:sx,ly:sy,pounceSpd:560,atkFrames:MGLIST_ATK,dieFrames:MGLIST_DIE,atkDur:0.55,dieMax:0.95});
 if(!bossE){document.getElementById('bossbar').style.display='block';document.getElementById('bossname').textContent='СТРЫГА'; const bpS=document.getElementById('bossphase'); if(bpS)bpS.textContent='мини · ночная охота';}
 const intro=document.getElementById('bossintro');
 intro.querySelector('.name').textContent='СТРЫГА';
 intro.querySelector('.sub').textContent='Ночная охотница вышла на след';
 intro.classList.add('show');sfxBoss();setTimeout(()=>intro.classList.remove('show'),2500);
   log('⚠ СТРЫГА вышла на след!', 'warn');
}
function spawnMini3Boss(){
 // v5.11 B2: Леший-Вожак — третий мини-босс (ротация)
 const cx=cam.x+W/2,cy=cam.y+H/2;
 const a=srnd(0,TAU),rad=Math.max(W,H)*0.85+200,b=ETYPES.leshiy;
 let sx=cx+Math.cos(a)*rad,sy=cy+Math.sin(a)*rad;
 sx=clamp(sx,0,WORLD);sy=clamp(sy,0,WORLD);
 const ehp=safeNum(380*diffMul*(1+0.05*Math.floor(time/120)),380);
 mini3BossE=acquireEnemy({...b,x:sx,y:sy,hp:ehp,maxhp:ehp,r:22,spd:98,dmg:11,type:'leshiy',mini:true,miniKind:'warlord',drawH:96,at:0,flash:0,slow:1,kx:0,ky:0,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,slamT:2.0,atkT:0,dying:0,fireT:0,phase:1,ai:'chase',dmgMod:1.45,howlT:5});
 if(!bossE){document.getElementById('bossbar').style.display='block';document.getElementById('bossname').textContent='ЛЕШИЙ-ВОЖАК'; const bp=document.getElementById('bossphase'); if(bp)bp.textContent='мини · вожак чащи';}
 const intro=document.getElementById('bossintro');
 intro.querySelector('.name').textContent='ЛЕШИЙ-ВОЖАК';
 intro.querySelector('.sub').textContent='Чаща выслала вожака';
 // v5.88: два других мини-босса пишут в журнал боя, третий — нет.
 log('⚠ ЛЕШИЙ-ВОЖАК вышел из чащи!','warn');
 intro.classList.add('show');sfxBoss();setTimeout(()=>intro.classList.remove('show'),2500);
 }
// v5.83: возвращает true, если реликвия реально легла в слот. Раньше функция
// молча выходила при полных слотах, а вызывающий код уже отрапортовал игроку
// «Дар: <реликвия>» — награда объявлялась и не выдавалась.
