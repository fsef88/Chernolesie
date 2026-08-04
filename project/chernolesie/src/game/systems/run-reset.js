//  СБРОС ЗАБЕГА
// ============================================================
function resetRun(daily=false){
 P={x:1000,y:1000,r:14,hp:100,maxhp:100,spd:200,fx:1,fy:0,pickup:105,dmgMul:1,rateMul:1,areaMul:1,animT:0,atk:0,moving:false,specialRate:1,regen:0,armor:0,crit:0,luck:0,bossMul:1,goldMul:1,xpMul:1,maxRelics:3,specialBuffT:0,lifesteal:0,frostR:1,swordRate:1,boltRateMul:1,boltDmgMul:1,bowRate:1,bowRange:0,bowDouble:0,arrowPoison:0,arrowFrost:0,_metaStartBow:0,_metaStartBolt:0,slowT:0,shieldT:0,shadowOrbT:0,shadowOrbMul:1,_shadowOrbBase:null,_orbBase:null,evoSwordBleed:0,evoBoltStorm:0,evoBowRain:0,synergyMark:0,invuln:0,cdMul:1,pierceMul:1};
appliedClassFor=null; // v6.74: P пересоздаётся -> сброс блокиратора двойного применения пассивки // v6.19 (C1): оси кулдаун/пробитие // v5.36 (C2): invuln — таймер i-frames после получения урона
 // v5.98: P пересоздаётся с литералом x:1000,y:1000 — наследство прежнего, меньшего
 // мира. Сейчас WORLD=6000, то есть забег начинался в 1000 от левого и верхнего края
 // и в 5000 от правого и нижнего. Центрирование было ТОЛЬКО в init-блоке
 // (P.x=WORLD/2), а он выполняется до титульника и затирается этим литералом при
 // нажатии «В бой» — для настоящих забегов не работало ни разу.
 // Следствие: кольцо спавна (1250–2150 от игрока) четвертью упиралось в границу мира
 // и клампилось, враги сбивались к кромке вместо равномерного окружения.
 P.x=WORLD/2;P.y=WORLD/2;P._prevX=P.x;P._prevY=P.y;   // v6.1: _prev на старте, иначе первый кадр интерполирует от прошлого забега
 // v5.98: камера стартовала из (0,0) и exp-лерпом приезжала к игроку — в начале
 // каждого забега был лишний проезд от угла карты. Ставим сразу в цель.
 cam.x=clamp(P.x-W/2,0,Math.max(0,WORLD-W));
 cam.y=clamp(P.y-H/2,0,Math.max(0,WORLD-H));
 specialMax=1;specialCharge=1;
 nightMode=false; // v6.23: сбрасываем ночной режим перед applyUnlocks, чтобы флаг не пережил забег
 applyTree();
 applyPerks();
 // БАЗОВОЕ ОРУЖИЕ сначала, класс ПОСЛЕ (чтобы passive мог перезаписать).
 // Раньше порядок был обратный: сначала currentClass.passive() (Шаман → weapons=[bolt]),
 // потом weapons.length=0;push(sword) → молния затиралась, Шаман начинал с мечом.
 // СБРОС ВСЕХ ГЛОБАЛЬНЫХ МАССИВОВ И СОСТОЯНИЙ МЕЖДУ ЗАБЕГАМИ
enemies=[];for(const _e of POOL.enemies)_e.alive=false;
slashes=[];bolts=[];arrows=[];aimLines=[];zones=[];hazards=[];anomalies=[];relics=[];
volki=[];serpAng=0;idols=[];vervT=0;klyukaCharge=0;
kostiStacks=0;kostiT=0;zercaloPool=0;golodT=0;
TRIZNA_MARKS.length=0;springs.length=0;kostiRayA=0;
serpOrbs.length=0;serpOrbA=0;vervLinks.length=0;
oberegWall.t=0;vihrStorm.t=0;for(const k in NEWW_LVL)NEWW_LVL[k]=1;
kosaTrail.length=0;   // v6.19: сброс между забегами
gemPops.length=0;absorbGlow=0;   // v6.42
 for(const arr of [POOL.particles,POOL.dmgTexts,POOL.gems,POOL.flashes]){for(const o of arr)o.alive=false;arr._fd=arr.slice();arr._deadCount=arr.length;}
 // ЗАЩИТА: чистим ACTIVE списки, иначе после resetRun останутся мёртвые объекты
 // (alive=false, но всё ещё в ACTIVE.particles/etc) и будут пропускаться в циклах.
 for(const k in ACTIVE)ACTIVE[k].length=0;
 // v5.87: здесь был повторный specialCharge=1;specialMax=1 — он стоял ПОСЛЕ
 // applyPerks() и затирал перк «Заряд Ярило». Убран (см. v5.78).
 // v5.87: и здесь же вскрылась МОЯ ошибка: трейлинг-комментарий v5.78 сожрал
 // два следующих оператора (сброс _shadowOrbBase/_orbBase/_warQ* и возврат
 // прозрачности spechud). Комментарии к плотным однострочникам — только
 // отдельной строкой СВЕРХУ.
 shake=0;hitstop=0;timeScale=1;slowmo=0;zoomPunch=1;mkN=0;mkX=0;mkY=0;mkFlash=0;mkBest=0;_clutchArmed=false;_minMark=0;_hbT=0;formCd=26;form=null;waveIdx=0;zonePulses.length=0;   // v6.56: ранняя формация сохраняется после resetRun
directorP=1;directorT=0;directorLastKills=0;directorLogBand=0;directorGrace=0;   // v6.58: сброс директора между забегами
 if(UI.lowHpV)UI.lowHpV.classList.remove('crit');window._sealReadyTold=false;_thudMs=0;   // v6.19: сброс таймера низкого подслоя удара
 if(typeof P==='object'&&P){P._shadowOrbBase=null;P._orbBase=null;P._warQBoost=0;P._warQT=0;}
 if(UI.spechud)UI.spechud.style.opacity='1';
 P.specialBuffT=0;HA.px=null;HA.py=null;HA.onHit=null;   // v6.19: сброс предыдущей позиции и callback анимации
 time=0;kills=0;gold=0;level=1;xp=0;xpNext=6;paused=false;over=false;won=false;runEnded=false;pendingLevelUps=0; // v6.74: сброс очереди окон прокачки между забегами
 reviveLeft=BALANCE.reviveMax;reviveBusy=false;hideRevive();   // v5.66
 coinDrops.length=0;   // v6.62: монеты между забегами
 specialE.t=75;   // v6.63: сброс таймера сюрпризов
 spawnTimer=0;achCheckT=0;runDmgTaken=0;lastKiller={name:'',dmg:0,hpAfter:0,t:-99};secondWindUsed=false; // v5.41 (Б3) // v6.18
 // v5.77: runStats НИГДЕ не сбрасывался. endRun() перезаписывал его сводкой забега,
 // и в новый забег утекали maxCombo, bowDouble и revived: достижение на серию могло
 // открыться на первой секунде, а флаг «возрождался» висел на всех забегах после
 // первого просмотра рекламы.
 runStats={kills:0,level:0,won:false,time:0,hpPct:1,gold:0,swordEvo:false,boltEvo:false,bowEvo:false,relics:0,treant:0,mglist:0,warlord:0,maxCombo:0,bowDouble:0,revived:false};
 pendingClassUnlocks=[];   // v6.26
 // (CRITICAL) boonShown НИГДЕ не сбрасывался — init ставил true,
 // и после первой загрузки выбор божества/проклятий не появлялся НИКОГДА.
 boonShown=false;
 // таймер туториала от прошлого забега мог «выстрелить» на новом
 for(const t of tutTimers)clearTimeout(t);tutTimers.length=0;   // v5.77: снимаем ВСЕ шаги, иначе подсказки прошлого забега всплывают в новом
 // зажатые клавиши/палец на джойстике не сбрасывались — персонаж
 // начинал новый забег уже бегущим (keyup не приходит при перезагрузке ввода)
 for(const k in keys)keys[k]=0;
 touchMove.x=touchMove.y=0;touchMove.active=false;
 // БАЗОВОЕ ОРУЖИЕ — сначала меч по умолчанию
 weapons.length=0;weapons.push({id:'sword',cd:0.8,t:0,evo:false});
 hasOrbit=false;orbAngle=0;orbCount=0;
 hasBolt=false; // boltCd/boltT-глобалы удалены (#17) — кулдаун болта живёт в weapons[].t
 swordLvl=1;boltLvl=1;bowLvl=1;killCombo=0;killComboT=0;cardLv={};   // v5.69
 magnetT=0;slowMoT=0;magnetSoftT=0;spawnSideBias=-1;omen={id:null,t:0,next:75,side:1,seedT:0,roshaT:0,count:0};
 poison={on:false,lvl:1,t:0,evo:false};thorn={on:false,lvl:1,evo:false};frost={on:false,lvl:1,evo:false};
 for(const k in synTaken)delete synTaken[k];   // v5.72: синергии живут один забег
 {const _sh=document.getElementById('synhud');if(_sh){_sh.innerHTML='';_sh.dataset.k='';}}
 // ТЕПЕРЬ применяем класс — он может перезаписать оружие (Шаман: weapons.length=0;push(bolt))
 // Пассивка применяется ровно ОДИН раз на новый объект P (см. applyClassPassive, #5).
 applyClassPassive(currentClass);
 // v6.16: КЛАССОВАЯ БАЗОВАЯ СКОРОСТЬ. База бега P.spd=200 — ЭТАЛОН темпа игры
 // (см. viewSpeedMul: бег/враги/спавн масштабируются совместно, поэтому менять
 // голую базу нельзя — ломается восприятие «масштаба» мира). Классовую скорость
 // применяем как МНОЖИТЕЛЬ поверх 200: spd *= CLASS_BASE_SPD[class]/200.
 // Таблица из задания сохраняет пропорции: shaman=165 → ×0.825, rogue=185 → ×0.925 и т.д.
 P.spd*= (CLASS_BASE_SPD[currentClass]||200)/200;
 applyMetaStartWeapons();
 applyUnlocks();          // v6.18: ветка открытий (слот оружия, стартовые орудия)
 _evoHudKey='';evoPause=0;
 _surgeIdx=0;_surgeT=-999;lowHpT=0;furyT=0;_furyAdd=0;   // v6.18e/h: всплески — с чистого листа
 {const _so=document.getElementById('surgeov');if(_so)_so.classList.remove('show','fade');}
 {const _eh=document.getElementById('evohud');if(_eh)_eh.innerHTML='';}
 bossE=null;bossSpawned=false;eliteT=32;   // v6.56: первая элита раньше после resetRun
 miniBossE=null;mini2BossE=null;mini3BossE=null;warlordKills=0;treantKills=0;mglistKills=0; // сброс мини-боссов между забегами
 miniIdx=0;
 // v6.3: сетка врагов теперь плоский массив — чистим использованные клетки.
 explored.fill(0);
 for(let i=0;i<_gridUsed.length;i++){const a=gridArr[_gridUsed[i]];if(a)a.length=0;}
 _gridUsed.length=0;
 // v7.8: сетка разведения жила через ВСЕ забеги сессии — пятый забег стартовал
 // с ячейками первых четырёх. Чистим вместе с остальной геометрией.
 _sepGrid.clear();_sepFree.length=0;
 document.querySelectorAll('.anomaly').forEach(e=>e.remove());
 const cBadge=document.getElementById('curseBadge');if(cBadge)cBadge.remove();
 document.querySelectorAll('.relic-slot').forEach(s=>{
  // Чистим ВСЕ слоты включая динамически созданный rs3 (от узла древа ft3).
  // Раньше цикл был for i<3 — четвёртый слот оставался с иконкой прошлого забега.
  s.classList.remove('full');
  s.textContent='';
  s.title='';
 });
 document.getElementById('boondisp').innerHTML='';
 document.getElementById('bossbar').style.display='none';
 document.getElementById('over').style.display='none';
 document.getElementById('pauseov').style.display='none';
 document.getElementById('boonov').style.display='none';
 document.getElementById('classov').style.display='none';
 document.getElementById('cards').style.display='none';
 document.getElementById('achov').style.display='none';
 document.getElementById('statsov').style.display='none';
 document.getElementById('treeov').style.display='none';
 document.getElementById('lowHpVignette').style.opacity='0';
 currentBoon=null;currentCurse=null;
 // ВОССТАНАВЛИВАЕМ МУЗЫКУ ПОСЛЕ ENDRun: endRun() уводит gain в 0,
 // здесь мы восстанавливаем к пользовательскому значению из LS.
 if(musicGain&&AC){
  const mv=LS.num('cl_mus',25)/100*0.4;
  try{musicGain.gain.cancelScheduledValues(AC.currentTime);musicGain.gain.setValueAtTime(mv,AC.currentTime);}catch(e){swallow('music.unmute',e);}
  musicOn=true;
 }
 if(daily){
  const day=dailyDay();
  runSeed=day;
  prngState=day; // инициализация состояния PRNG (синхронно с runSeed)
  LS.set('cl_daily_seed',day);
 }else{runSeed=0; prngState=0;}
 // v5.9: пошаговый туториал (движение → гемы → печать). cl_tut_v2 — чтобы старые игроки увидели раз.
 // v7.0: добавлены подсказки про сбор кристаллов и рецепты эволюций
 if(!LS.get('cl_tut_v2')&&!daily){
  const tut=document.getElementById('tutorial');
  const steps=[
   {t:900, html:'<b>Движение</b><br><span class="tk">WASD</span> или джойстик слева'},
   {t:5500, html:'<b>Кристаллы</b><br>Подбирай ✦ — они дают опыт и золото. Чем быстрее уровень, тем сильнее.'},
   {t:10000, html:'<b>Сила заставы</b><br>Синие гемы — опыт. Карточки — выбор пути.'},
   {t:15500, html:'<b>Печать класса</b><br>Полоска под HP / кнопка справа.<br>Клавиша <span class="tk">Q</span> — когда заряжена!'},
   {t:21000, html:'<b>Пробуждение</b><br>Следи за рецептами в HUD — оружие + пассивка = эволюция!'},
   {t:27500, html:'Хранитель приходит к <span class="tk">'+fmt(BALANCE.bossTime)+'</span>. Мини-боссы — Древень и Стрыга.'}
  ];
  steps.forEach((s,i)=>{
   const id=setTimeout(()=>{
    tut.innerHTML=s.html;
    tut.classList.add('show');
    setTimeout(()=>tut.classList.remove('show'), i===steps.length-1?9000:7500); // v5.46: не мелькают
    if(i===steps.length-1){LS.set('cl_tut_v2','1');LS.set('cl_tutdone','1');}
   }, s.t);
   tutTimers.push(id);
  });
 }
 if(daily||!currentClass){currentClass=null;classChosen=false;maybeShowClassSelect();}
 bossT=BOSS_TIME; // сброс таймера босса между забегами
 miniIdx=0;
}
document.getElementById('btnreset').onclick=()=>{currentClass=null;resetRun(false);};
document.getElementById('btnDaily').onclick=()=>{currentClass=null;resetRun(true);};
document.getElementById('btnresume').onclick=togglePause;
// v5.70: закрытие вложенного оверлея НЕ должно снимать паузу, если под ним
// открыто меню паузы. Иначе мир оживал за видимым экраном паузы: враги ходили
// и били игрока, пока он читал дерево, а «Продолжить» приходилось жать дважды.
// v5.93: единый список модальных оверлеев — чтобы новый оверлей нельзя было
// добавить, забыв про Escape.
