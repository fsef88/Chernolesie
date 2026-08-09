function updateSpawning(dt){
 // СПАВН: один враг на старте (сразу даёт ощущение "игра живая") + потом непрерывный поток
 // (первый враг уже заспавнен в init-блоке, поэтому здесь только доп. поток)
 if(time>0.05){
  spawnTimer-=dt;
  // v6.56: стартовый rate 2.35/сек, рост +12% каждые 60с
  // v6.11 КЛЮЧЕВОЕ. Кап врагов растёт с видимой площадью (v6.8), а ТЕМП спавна
   // оставался 2/с. Набрать 320 врагов при 2/с — почти три минуты, то есть широкий
   // обзор показывал бы пустое поле вместо толпы. Масштабируем и поток.
   const rate=BALANCE.spawnRate0*viewDensityMul()*directorSpawnMul()*(1+BALANCE.spawnRatePer60*Math.floor(time/60))*(omen.id==='moon'?1.4:1); // v6.58: директор множит только давление спавна
  // (#19) nearCount пересчитывался на КАЖДОМ тике while-цикла
  // (при 3 тиках × 15 врагов = 45 лишних итераций/кадр). Новые враги всегда
  // спавнятся ЗА nearR (dist >= max(W,H)/2+100) — счётчик в цикле не меняется.
  const nearR=Math.max(W,H)*0.4;
  // FIX v7.38: используем spatial hash вместо перебора всех врагов — O(1) вместо O(n)
  const nearEnemies = enemiesNear(P.x, P.y, nearR);
  let nearCount=0;
  for(const e of nearEnemies){
   if(e.hp>0&&!(e.dying>0))nearCount++;
  }
  const _cap=enemyCap(time),_near=nearCap(time);   // v5.64: капы растут со временем
  while(spawnTimer<=0){
   if(liveEnemies()<_cap){
    if(nearCount<_near)spawn(false);
    else spawn(true);
   }
   spawnTimer+=1/rate;
  }
 }
 // На 1:30 — выбор божества (в забеге)
 if(time>=90&&!boonShown)maybeShowBoonSelect();
 // На 2:30 — выбор класса (если не выбран)
 if(time>=150&&!classChosen)maybeShowClassSelect();
 updateFormations(dt);
 updateSpecialEvents(dt);   // v6.63: сюрпризы
 eliteT-=dt;if(eliteT<=0&&!bossSpawned){eliteT=(time>=BALANCE.eliteLateAt?BALANCE.eliteEveryLate:BALANCE.eliteEvery);spawnElite();}
 // Мини-боссы: раз в 180с, по очереди Древень/Стрыга (просьба: не так часто)
 if(miniIdx<BALANCE.miniAt.length&&time>=BALANCE.miniAt[miniIdx]){   // v5.65: расписание вместо шага 180 с
  const r=miniIdx%3;
  if(r===0)spawnMiniBoss();else if(r===1)spawnMini2Boss();else spawnMini3Boss();
  miniIdx++;
 }
 if(!bossSpawned&&time>=bossT){bossSpawned=true;spawnBoss();}
}
function updateSpecial(dt){
 // заряд спецатаки
 // v6.21: база ~59с на заряд (0.017/с). Раньше было 0.065/с плюс жирная
 // подпитка с убийств — на плотной волне печать копилась за 10-12 секунд
 // и переставала быть событием. Теперь кровь ускоряет, но не заменяет время.
if(specialCharge<specialMax){const add=dt*0.017*(P.sealChargeMul||1);specialCharge=Math.min(specialMax,specialCharge+(isFinite(add)?add:0));if(!isFinite(specialCharge))specialCharge=0;}
 // кнопка спецатаки — кэшированная ссылка
 // v5.9 UX печати: кнопка + desktop HUD-заряд + иконка класса
 {
  const si=sealInfo(currentClass);
  const ready=specialCharge>=1;
  const pct=ready?1:Math.max(0,Math.min(1,specialCharge));   // v5.78: полоса = прогресс до ОДНОГО заряда
  const banked=Math.floor(specialCharge);
  if(UI.tbtnSpecial){
   // v7.42: класс, переменная цвета и подсказка меняются раз за забег (цвет —
   // от класса, «готово» — раз в минуту). Писались же каждый шаг физики, и
   // MutationObserver считал по 38 правок в секунду на каждую из трёх. Запись
   // атрибута — метка «пересчитай стиль», даже когда значение то же самое.
   if(__HUDW.tbReady!==ready){__HUDW.tbReady=ready;if(ready)UI.tbtnSpecial.classList.add('ready');else UI.tbtnSpecial.classList.remove('ready');}
   if(__HUDW.tbColor!==si.color){__HUDW.tbColor=si.color;UI.tbtnSpecial.style.setProperty('--spec-c', si.color);}
   const _tt=(si.name||'Печать')+' (Q)';
   if(__HUDW.tbTitle!==_tt){__HUDW.tbTitle=_tt;UI.tbtnSpecial.title=_tt;}
   // v6.20: кадр медальона = pct*19; два слоя кроссфейдят соседние кадры,
   // поэтому набор выглядит непрерывным, а не 20 ступеньками
   if(UI.ultA&&UI.ultB){
    const fi=Math.max(0,Math.min(19,pct*19));
    const i0=Math.min(18,Math.floor(fi));
    const fr=Math.round((fi-i0)*100)/100;
    if(UI.ultA._i!==i0){UI.ultA._i=i0;UI.ultA.style.backgroundPosition='0 '+(i0*100/19).toFixed(3)+'%';}
    if(UI.ultB._i!==i0+1){UI.ultB._i=i0+1;UI.ultB.style.backgroundPosition='0 '+((i0+1)*100/19).toFixed(3)+'%';}
    const op=ready?1:fr;
    if(UI.ultB._o!==op){UI.ultB._o=op;UI.ultB.style.opacity=String(op);}
   }
   if(UI.tbtnSpecIcon){UI.tbtnSpecIcon.style.display='none';}
  }
  if(UI.spechud){
   // Прозрачность здесь ставится в 1 «на всякий случай» — её гасит экран смерти
   // и возвращает resetRun. Кэш сбрасывается там же, вместе с остальным HUD.
   if(__HUDW.shOp!=='1'){__HUDW.shOp='1';UI.spechud.style.opacity='1';}
   if(__HUDW.shColor!==si.color){__HUDW.shColor=si.color;UI.spechud.style.setProperty('--spec-c', si.color);}
   if(__HUDW.shReady!==ready){__HUDW.shReady=ready;if(ready)UI.spechud.classList.add('ready');else UI.spechud.classList.remove('ready');}
   if(UI.speclabel&&__HUDW.lbl!==(ready?1:0)+si.name){__HUDW.lbl=(ready?1:0)+si.name;UI.speclabel.textContent=ready?('ГОТОВО'+(banked>1?' ×'+banked:'')+' · '+si.name):('ПЕЧАТЬ · '+si.name);}
   // v7.40: иконка Печати меняется раз за забег — кэшируем по значению,
   // чтобы не пересобирать innerHTML + строку градиента 136 раз в секунду.
   if(UI.specicon&&__HUDW.ic!==si.iconId){__HUDW.ic=si.iconId;UI.specicon.style.color=si.color;UI.specicon.style.borderColor=si.color;UI.specicon.innerHTML=si.svg||ICONS.get(si.iconId);}
   if(UI.specfill){
    const _spw=Math.round(pct*100);if(__HUDW.sp!==_spw){__HUDW.sp=_spw;UI.specfill.style.width=_spw+'%';}
    const _sb=ready?('linear-gradient(90deg,'+si.color+','+(si.accent||'#fff')+')'):('linear-gradient(90deg,#4a3a18,'+si.color+')');
    if(__HUDW.sb!==_sb){__HUDW.sb=_sb;UI.specfill.style.background=_sb;}
   }
  }
  if(ready && !window._sealReadyTold){
   window._sealReadyTold=true;
   // v6.21: восходящее трезвучие в момент готовности — ухо ловит событие
   // раньше, чем глаз успевает добраться до кнопки в углу
   if(typeof sfxAch==='function')sfxAch();
   shake=Math.max(shake,3);
   vibe(35);
   log('✦ Печать готова — Q или кнопка печати','gold');
   const tut=EL('tutorial');
   if(tut && !LS.get('cl_seal_tip')){
    tut.innerHTML='Печать <span class="tk">'+si.name+'</span> заряжена!<br>Нажми <span class="tk">Q</span> или кнопку печати.';
    tut.classList.add('show');
    setTimeout(()=>tut.classList.remove('show'),7000); // v5.46
    LS.set('cl_seal_tip','1');
   }
  }
  if(!ready) window._sealReadyTold=false;
 }
}
