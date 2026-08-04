function endRun(victory){
 if(runEnded)return;runEnded=true;over=true;paused=false;timeScale=1;
 stopAmbient();   // v7.0: глушим ambient
 // БОСС ТАЙМЕР СБРАСЫВАЕТСЯ в конце забега — проклятие времени не должно переноситься
 bossT=BOSS_TIME;miniIdx=0;
 // Музыка плавно уходит в 0 — но в resetRun() восстанавливается обратно
 // защита от null. Если AC не успел инициализироваться
 // (блокировка автоплея, мобильный браузер без user-gesture), AC=null
 // и обращение к AC.currentTime упадёт с TypeError.
 // Проверяем ОБА: и musicGain (gain-узел), и AC (контекст).
 // Раньше проверялся только musicGain — если AC был null, а musicGain был
 // создан в initAudio(), обращение к AC.currentTime кидало TypeError.
 if(musicGain&&AC){
  try{musicGain.gain.cancelScheduledValues(AC.currentTime);musicGain.gain.linearRampToValueAtTime(0,AC.currentTime+0.5);}catch(e){swallow('music.fadeout',e);}
 }
 document.getElementById('pauseov').style.display='none';
 if(UI.spechud)UI.spechud.style.opacity='0.35';

 document.getElementById('bossbar').style.display='none';
 document.getElementById('lowHpVignette').style.opacity='0';
 for(const a of anomalies)if(a.domEl)a.domEl.remove();
 const streakGoldMul=1+Math.min(0.40,(winStreak|0)*0.12);
 const goldMul=(P.goldMul||1)*(currentCurse==='famine'?0.5:1)*streakGoldMul;
 // ============================================================
 // КУРС ЗОЛОТА ЗАСТАВЫ
 // За убийство начисляется 1 золото (gold++ в killEnemy). Когда-то забег давал
 // несколько сотен убийств, и цены Кузницы (база 30-80, рост ×1.42) под это и
 // считались: всё дерево перков стоит 7163.
 // Живой замер: забег на 14:35 дал 15 636 убийств → 17 350 золота. Этого хватает
 // на ДВЕ С ПОЛОВИНОЙ полных Кузницы за один заход. Игрок вышел с максимумом по
 // всем девяти перкам и 10 187 золота сдачи — межзабеговый прогресс кончился,
 // не начавшись, а «удвоить золото за рекламу» потеряло смысл.
 // Курс 0.05 (1 золото за 20 убийств) растягивает Кузницу примерно на 8-10
 // длинных забегов или 25 коротких. Внутризабеговое золото (реролл карт за 5)
 // не трогаем — оно живёт по своим правилам и на витрину не влияет.
 // v7.31: 0.05 -> 0.018. Замер полного забега после привязки золота к ценности
 // врага: 56 444 внутризабегового золота, при курсе 0.05 это 2 822 Заставе,
 // тогда как ВСЯ мета стоит около 17 200 (Кузница ≈ 7 200 + Древо ≈ 10 000) —
 // шесть забегов на всё. Курс 0.018 даёт ≈ 1 000 за полный забег, то есть
 // примерно 17 забегов на полную витрину. Это и есть канон жанра: мета копится
 // неделями, а не закрывается в первый вечер.
 const META_RATE=0.018;
 const finalGold=Math.max(1,Math.round(gold*goldMul*META_RATE));
 metaGold+=finalGold;
 lastRunGold=finalGold;goldDoubled=false;x2Busy=false;   // v5.67: база для удвоения
 runStats={kills,level,won:victory,time,hpPct:P.hp/P.maxhp,gold:finalGold,swordEvo:!!weapons.find(w=>w.id==='sword'&&w.evo),boltEvo:!!weapons.find(w=>w.id==='bolt'&&w.evo),bowEvo:!!weapons.find(w=>w.id==='bow'&&w.evo),relics:relics.length,treant:treantKills,mglist:mglistKills,warlord:warlordKills,maxCombo:runStats.maxCombo||0,bowDouble:runStats.bowDouble||(P.bowDouble>0?1:0),revived:runStats.revived||false}; // v6.74: сохраняем метку возрождения
 // метa-прогресс
 const cm=CLASSES.find(c=>c.id===currentClass);
 if(cm){achData.progress.classes=achData.progress.classes||{};achData.progress.classes[cm.id]=1;if(Object.keys(achData.progress.classes).length>=CLASSES.length)unlockAch(ACHIEVEMENTS.find(a=>a.id==='all_classes'));}
 if(currentBoon){achData.progress.boons=achData.progress.boons||{};achData.progress.boons[currentBoon]=1;if(Object.keys(achData.progress.boons).length>=5)unlockAch(ACHIEVEMENTS.find(a=>a.id==='all_boons'));}
 if(currentCurse){achData.progress.curses=achData.progress.curses||{};achData.progress.curses[currentCurse]=1;if(Object.keys(achData.progress.curses).length>=4)unlockAch(ACHIEVEMENTS.find(a=>a.id==='all_curses'));}
 if(victory){
  const _shw = document.getElementById('victoryshieldwrap');
  const _rays = document.getElementById('overrays');
  if(_shw && typeof VICTORY_SHIELD_ART !== 'undefined' && VICTORY_SHIELD_ART.src){
    _shw.style.display='flex';
    _shw.innerHTML = `<img src="${VICTORY_SHIELD_ART.src}" alt="Победа">`;
  }
  if(_rays) _rays.style.display='block';
  if(!currentCurse){achData.progress.noCurseWins=(achData.progress.noCurseWins||0)+1;}
  else{achData.progress.curseWins=(achData.progress.curseWins||0)+1;}
 }else{achData.progress.noCurseWins=0;}
 if(runSeed>0&&runSeed===LS.num('cl_daily_seed',-1)){
  // ЗАЩИТА ОТ ЭКСПЛОЙТА: считаем серию по КАЛЕНДАРНЫМ ДНЯМ, не по миллисекундам.
  // Иначе игрок мог 3 раза за 2 минуты нажать "Daily" → три забега за "один день" → streak=3.
  const last=LS.num('cl_daily_last',0);
  const lastDay=last?dailyDayAt(last):0;
  const currentDay=dailyDay();
  if(currentDay>lastDay){
   if(currentDay-lastDay===1){
    // Новый день подряд — продолжаем серию
    achData.progress.dailyStreak=(achData.progress.dailyStreak||0)+1;
   }else{
    // Пропустили день — серия прервана, начинаем заново
    achData.progress.dailyStreak=1;
   }
   LS.set('cl_daily_last',Date.now());
  }
  // Если currentDay==lastDay (тот же день) — ничего не делаем, серия не растёт
 }
 LS.set('cl_ach',JSON.stringify(achData));
 // v6.26: плашка об открытых классах — на итогах, а не в бою
 setTimeout(showClassUnlockToast,900);
 if(victory){
  winStreak++;loseStreak=0;
  // v6.26: адаптивная сложность крутится по БАЗОВОМУ значению, без Порчи,
  // иначе множитель Порчи попал бы в сохранение и удвоился на следующем забеге.
  {const base=clamp(LS.num('cl_diff',1),0.5,1.5);
   if(winStreak>=3){LS.set('cl_diff',String(Math.min(1.5,base+0.1)));winStreak=0;}}
  // Победа открывает следующую ступень Порчи.
  if(corruption>=corruptionUnlocked&&corruptionUnlocked<CORRUPTION_MAX){
   corruptionUnlocked=corruption+1;
   LS.set('cl_corr_max',String(corruptionUnlocked));
   try{pendingClassUnlocks.push('Порча '+corruptionUnlocked+' \u2014 Чаща злее');}catch(e){}
  }
  // Рекорд по текущей ступени
  if(corrBest(corruption)===0||time<corrBest(corruption)||corrBest(corruption)===0)setCorrBest(corruption,time);
 }
 else{loseStreak++;winStreak=0;
  {const base=clamp(LS.num('cl_diff',1),0.5,1.5);
   if(loseStreak>=2){LS.set('cl_diff',String(Math.max(0.5,base-0.1)));loseStreak=0;}}
 }
 LS.set('cl_wstreak',String(winStreak));LS.set('cl_lstreak',String(loseStreak));
 // v6.18: рекорд нужен ДО записи текущего забега, иначе «не хватило» всегда 0.
 const prevBest=stats.length?Math.max.apply(null,stats.map(x=>x.time)):0;
 const prevKills=stats.length?Math.max.apply(null,stats.map(x=>x.kills)):0;
 const prevLevel=stats.length?Math.max.apply(null,stats.map(x=>x.level)):0;
 stats.push({time,kills,level,gold:finalGold,won:victory,class:currentClass,boon:currentBoon,date:Date.now()});
 if(stats.length>50)stats=stats.slice(-50);
 LS.set('cl_stats',JSON.stringify(stats));
 LS.set('cl_gold',metaGold);
 // v6.31: пожизненные счётчики — ДО проверки открытий, чтобы класс,
 // открытый этим забегом, был виден уже на экране итогов.
 {const before=CLASSES.filter(c=>classUnlocked(c.id)).length;
  commitLife(victory);
  const after=CLASSES.filter(c=>classUnlocked(c.id));
  if(after.length>before){
   // нашли, какой именно открылся
   for(const c of after){
    const u=CLASS_UNLOCKS[c.id];
    if(u&&u.have()>=u.need&&u.have()-1<u.need)pendingClassUnlocks.push(c.name);
   }
  }}
 checkAch();
 const ot=document.getElementById('otitle');
 // v6.18: «Не тот богатырь…» — оценка игрока. Поражение здесь часть цикла,
 // а не неудача, поэтому формулировка про лес, а не про героя (документ, ч.4 п.5).
 ot.textContent=victory?'⚜ ПОБЕДА! Змей Горыныч повержен!':'Чаща оказалась сильнее';
 ot.className=victory?'win':'';
 document.getElementById('ostat').textContent=`Время: ${fmt(time)} · Убийств: ${kills} · Ур: ${level} · Золото: ${finalGold}`+(streakGoldMul>1?` (серия ×${streakGoldMul.toFixed(2)})`:'');
 document.getElementById('oclass').innerHTML=`Класс: ${cm?classTiny(cm.id)+' '+cm.name:'?'} · Божество: ${currentBoon?boonMini(currentBoon)+((BOONS.find(x=>x.id===currentBoon)||{}).name||currentBoon):'нет'}${currentCurse?' · Проклятие: '+curseMini(currentCurse)+((CURSES.find(c=>c.id===currentCurse)||{}).name||currentCurse):''}`;
 // ============ v6.18: ЭКРАН СМЕРТИ (документ, ч.4) ============
 // 1) причина, а не факт: «Тебя добил Волколак, когда HP было 4/118».
 //    Конкретика превращает поражение в урок — игрок думает «в следующий раз
 //    отойду», а не «игра сложная».
 {const od=document.getElementById('odeath');
  if(od){
   if(victory)od.textContent='Змей Горыныч пал. Чаща отступила — до следующего рассвета.';
   else if(lastKiller.name&&(time-lastKiller.t)<6){
    const was=Math.max(1,Math.round(lastKiller.hpAfter+lastKiller.dmg));
    od.textContent='Тебя добил '+lastKiller.name+' на '+fmt(time)+' — оставалось '+was+'/'+Math.round(P.maxhp)+' HP.';
   }else od.textContent='Чаща сомкнулась на '+fmt(time)+'.';
  }}
 // v7.0: совет на экране смерти
 {try{
  const _advice=deathAdvice();
  const _aw=document.getElementById('deathadvice-wrap');
  const _ae=document.getElementById('deathadvice');
  const _at=document.getElementById('deathtype');
  if(_aw&&_ae&&_advice.tip){
   _aw.style.display='block';
   _ae.textContent=_advice.tip;
   if(_at)_at.textContent=_advice.tipType==='weapon'?'⚔ Оружие':_advice.tipType==='passive'?'🛡 Пассивка':_advice.tipType==='aura'?'❄ Аура':_advice.tipType==='evo'?'✦ Пробуждение':_advice.tipType==='meta'?'🏆 Прогресс':'💡 Совет';
  }
 }catch(e){}}
 // 2) близкий промах — сильнейший мотиватор перезапуска. Если до рекорда далеко,
 //    показываем метрику, где игрок БЫЛ близок (убийства или уровень).
 {const orec=document.getElementById('orecord');
  if(orec){
   let t='';
   if(prevBest<=0)t='Первый забег записан. Рекорд: '+fmt(time)+' — теперь его есть чем бить.';
   else if(time>prevBest)t='🏆 Новый рекорд! Прошлый — '+fmt(prevBest)+'.';
   else{
    const short=prevBest-time;
    if(short<=prevBest*0.35)t='Рекорд: '+fmt(prevBest)+'. Не хватило '+fmt(short)+'.';
    else if(kills>prevKills)t='Рекорд по времени далёк, зато убийств больше, чем когда-либо: '+kills+'.';
    else if(level>prevLevel)t='Рекорд по времени далёк, зато уровень выше прежнего: '+level+'.';
    else t='Рекорд: '+fmt(prevBest)+'. Не хватило '+fmt(short)+'.';
   }
   orec.textContent=t;
  }}
 // 3) причина начать ПРЯМО СЕЙЧАС: ровно одна ближайшая цель, а не всё дерево.
 {const onx=document.getElementById('onext');
  if(onx){
   const g=nextGoal();
   if(!g)onx.textContent='';
   else if(g.afford)onx.textContent='◆ Хватает на «'+g.g.name+'» — забери перед следующим забегом.';
   else onx.textContent='Ещё '+g.need+' золота — откроется «'+g.g.name+'»'+(g.g.hint?' ('+g.g.hint+')':'')+'.';
  }}
 // v6.26: ближайший закрытый класс — самая наглядная причина сыграть ещё раз.
 // Показываем ОДНУ цель (ту, к которой игрок ближе всего), иначе список
 // читается как список задач, а не как приманка.
 {const oc=document.getElementById('oclassunlock');
  if(oc){
   // Показываем ОДНУ цель — ту, к которой игрок ближе всего.
   // Список задач отпугивает, одна близкая цель — зовёт.
   let best=null;
   for(const c of CLASSES){
    const u=CLASS_UNLOCKS[c.id];
    if(!u||classUnlocked(c.id))continue;
    const f=classLockFrac(c.id);
    if(!best||f>best.f)best={c,f,txt:classLockHint(c.id)};
   }
   if(!best)oc.textContent='';
   else{
    const left=CLASS_UNLOCKS[best.c.id].need-CLASS_UNLOCKS[best.c.id].have();
    oc.textContent=(best.f>=0.7?'\u2726 Почти: ':'\u2716 ')+best.c.name+
      ' \u2014 '+best.txt+(left>0&&best.f>=0.7?(' (осталось '+left+')'):'');
   }
  }}
 document.getElementById('diffmul').textContent=diffMul.toFixed(1);
 const best=stats.length?Math.max(...stats.map(s=>s.time)):0;
 document.getElementById('besttime').textContent=fmt(best);
 refreshX2();                                  // v5.67: кнопка ×2 после подсчёта золота
 renderShop();
 document.getElementById('over').style.display='flex';
 // v6.18: одна кнопка — крупная, по центру, фокус по умолчанию (документ, ч.4 п.4).
 {const br=document.getElementById('btnreset');if(br)setTimeout(()=>{try{br.focus();}catch(e){}},60);}
 try{if(window.YA_SAVE)YA_SAVE();}catch(e){}   // Яндекс: облачный сейв после забега
 try{if(window.YA_LB&&window.YA_LB.submit)window.YA_LB.submit(kills);}catch(e){}   // Яндекс: рекорд убийств
 setTimeout(()=>{try{maybeInterstitial();}catch(e){}},700);   // Яндекс: межстраничная после результата
}

// ============================================================
//  ВЫБОР КЛАССА — на 2:30 в забеге (или сразу если первый раз)
// ============================================================
