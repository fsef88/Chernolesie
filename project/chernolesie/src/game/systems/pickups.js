function updateParticles(dt){
 // Обратный обход: poolRelease делает swap-and-pop, for...of вперёд пропускал
 // бы элемент, вставленный на место удалённого (лагорили частицы на 1 кадр).
 for(let pi=ACTIVE.particles.length-1;pi>=0;pi--){const p=ACTIVE.particles[pi];p.life-=dt;p.vy+=(p.g||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.9;if(p.life<=0)poolRelease(POOL.particles,p);}
 shake=Math.max(0,shake-dt*32);   // v6.17: затухание 14->22, толчок короче и суше
 // v6.42: хлопки подбора и сияние насыщения
 for(let i=gemPops.length-1;i>=0;i--){const q=gemPops[i];q.t-=dt;if(q.t<=0)gemPops.splice(i,1);}
 absorbGlow=Math.max(0,absorbGlow-dt*2.2);
 for(let fi=ACTIVE.flashes.length-1;fi>=0;fi--){const f=ACTIVE.flashes[fi];f.t-=dt;if(f.t<=0)poolRelease(POOL.flashes,f);}
 for(const h of hazards){
  h.t-=dt;
  if(h.kind==='ring'){
    // растущее кольцо: урон в annule, не в центре
    // v5.82: активная фаза длится 1.15 с, а age считался от 1.3 — на первом же
    // кадре после телеграфа выражение давало age>1, и кольцо МГНОВЕННО прыгало
    // на полный радиус вместо роста. Прочитать атаку было невозможно.
    const maxR=h.grow||220;
    const TELE=0.85, ACT=1.15;
    const frac=h.state==='tele'
     ? 0.35*Math.min(1,Math.max(0,(TELE-h.t)/TELE))                  // телеграф: до 35%
     : 0.35+0.65*Math.min(1,Math.max(0,(ACT-h.t)/ACT));              // рост до края
    h.r=Math.min(maxR,40+maxR*frac);
    if(h.state==='tele'&&h.t<=0){h.state='active';h.t=ACT;}
    if(h.state==='active'){
      const dd=Math.hypot(P.x-h.x,P.y-h.y);
      const band=18;
      if(!h._friendly&&(h.dmg||0)>0&&Math.abs(dd-h.r)<band){if(P.invuln<=0){const _hd=(h.dmg||28)*dt*armorMul();P.hp-=_hd;runDmgTaken+=_hd;sfxHurtSoft();noteHurt('Ловушка чащи',_hd);}} // v5.36 (C2): i-frames блокирует урон хазарда
    }
  }else{
    if(h.state==='tele'&&h.t<=0){h.state='active';h.t=1.3;}
    else if(h.state==='active'&&!h._friendly&&(h.dmg||0)>0&&dist2(P.x-h.x,P.y-h.y)<h.r*h.r){if(P.invuln<=0){const _hd=(h.dmg||24)*dt*armorMul();P.hp-=_hd;runDmgTaken+=_hd;sfxHurtSoft();noteHurt('Ловушка чащи',_hd);}} // v5.36 (C2): i-frames блокирует урон хазарда
  }
}
 prune(hazards,h=>!(h.state==='active'&&h.t<=0)); // #12: in-place
}
function updatePickups(dt){
 // Подбор кристаллов: копим XP и сразу раздаём все levelUp'ы,
 // прежде чем помечать драгоценность мёртвой — без этого при 5 крупных кристаллах
 // на одном кадре лишние levelUp'ы теряются (был bug).
 // xpMul всегда задан в P (Велес умножает его при выборе) — fallback удалён
 const xpMul=P.xpMul||1;
 // ============================================================
 // СХЛОПЫВАНИЕ БРОШЕННЫХ КРИСТАЛЛОВ
 // Замер живого забега: 520 гемов на поле против 129 врагов — вчетверо больше
 // кристаллов, чем противников, и так треть забега (295 секунд у потолка).
 // Цена: при 300+ гемах средний FPS 67 против 75 при сотне.
 //
 // Логика переполнения была вывернута наизнанку: по достижении MAX_GEMS
 // spawnGem начислял опыт за НОВЫЕ гемы и не создавал их, а 520 старых
 // продолжали лежать и рисоваться вечно. То есть игра вакуумировала свежую
 // добычу под ногами и берегла хлам за три экрана.
 //
 // Теперь наоборот: пока кристаллов больше мягкого предела, самые ДАЛЬНИЕ
 // засчитываются напрямую (тем же множителем, что и при подборе) и убираются
 // с поля. Опыт не теряется ни одной единицей — меняется только то, какие
 // гемы доживают до подбора руками.
 // Радиус отсева СЖИМАЕТСЯ, пока не уложимся в мягкий предел. Фиксированная
 // лестница радиусов не работала: у медленного героя кристаллы копятся вплотную,
 // дальше трёх экранов не улетает ничего, и отсев не срабатывал вовсе — замер
 // показал 514 гемов при пределе 140. Нижняя граница — полтора радиуса подбора:
 // ближе игрок и так соберёт руками.
 if(ACTIVE.gems.length>GEM_SOFT){
  let _fr=Math.max(W,H)*0.75;
  const _minR=Math.max(60,P.pickup*1.5);
  let _guard=0;
  while(ACTIVE.gems.length>GEM_SOFT&&_fr>_minR&&_guard++<8){
   const _fr2=_fr*_fr;
   for(let gi=ACTIVE.gems.length-1;gi>=0&&ACTIVE.gems.length>GEM_SOFT;gi--){
    const g=ACTIVE.gems[gi];
    if(dist2(P.x-g.x,P.y-g.y)<_fr2)continue;
    xp+=g.v*xpMul*(omen.id==='moon'?1.3:1);
    poolRelease(POOL.gems,g);
   }
   _fr*=0.6;
  }
 }
 let _pickedTier=0; // v6.16: крупнейший номинал гемов, подобранных за этот кадр
 for(let gi=ACTIVE.gems.length-1;gi>=0;gi--){ // обратный обход (poolRelease swap-and-pop)
  const g=ACTIVE.gems[gi];
  g.pop=(g.pop||0)+dt;
  if(g.vx){g.x+=g.vx*dt;g.y+=g.vy*dt;g.vx*=0.86;g.vy*=0.86;}
  const gdx=P.x-g.x,gdy=P.y-g.y;
  const gd2=dist2(gdx,gdy);
  // v6.61: три режима магнита: полный (знамение Велеса — magnetT),
  // слабый (левелап — magnetSoftT, радиус ×2.4 подбора) и обычный подбор.
  const _magR=magnetT>0?1e9:(magnetSoftT>0?(P.pickup*3.5)*(P.pickup*3.5):P.pickup*P.pickup); // v7.1 шире радиус подбора
  if(gd2<_magR){ // v5.47: магнит сечи
   const gd=Math.sqrt(gd2)||1;
   g.ms=(g.ms||(magnetT>0?900:(magnetSoftT>0?550:240)))+1800*dt;const _mg=magnetT>0?3.0:(magnetSoftT>0?2.0:1.2);
    g.x+=gdx/gd*g.ms*dt*_mg;g.y+=gdy/gd*g.ms*dt*_mg;
   // v6.42: хвост кометы у притянутого кристалла. Копим прошлые позиции в самом
   // объекте гема (кольцевой буфер на 4 точки) — рисуем полосу в drawFxLayer.
   // Без него полёт читался как телепорт: гем прыгает 700+ ед/с, на 60 fps это
   // 12 пикселей между кадрами.
   g._tr=g._tr||[g.x,g.y,g.x,g.y,g.x,g.y,g.x,g.y];
   g._ti=((g._ti|0)+1)&3;g._tr[g._ti*2]=g.x;g._tr[g._ti*2+1]=g.y;
  }
  if(gd2<(P.r+8)*(P.r+8)){
   gemPop(g.x,g.y,g.col,g.sc||1);   // v6.42: хлопок поглощения
   poolRelease(POOL.gems,g);
   xp+=g.v*xpMul*(omen.id==='moon'?1.3:1); // v5.47: Красный месяц
   onGemPickedW();   // v6.17c: голод сбрасывается
   if(g.v>_pickedTier)_pickedTier=g.v; // запоминаем самый ценный за кадр
  }
 }
 // v6.16: звук подбора по номиналу (один раз за кадр — защита в sfxPick от спама).
 if(_pickedTier>=25)sfxPick(0.6,1.0);        // оранжевый (25) — низко/громко
 else if(_pickedTier>=5)sfxPick(1.0,0.7);    // зелёный (5)  — средне
 else if(_pickedTier>0)sfxPick(1.4,0.4);     // голубой (1)  — высоко/тихо
 // v6.62: монеты — движение, оседание и подбор
 for(let ci=coinDrops.length-1;ci>=0;ci--){
  const c=coinDrops[ci];
  c.t-=dt;
  if(c.t<=0){coinDrops.splice(ci,1);continue;}
  c.x+=c.vx*dt;c.y+=c.vy*dt;c.vx*=0.88;c.vy*=0.88;
  const cdx=P.x-c.x,cdy=P.y-c.y;
  if(dist2(cdx,cdy)<(P.r+14)*(P.r+14)){
   gold+=c.val;
   gemPop(c.x,c.y,'#ffcf6a',0.55);
   sfxCoin();   // v7.0: отдельный звук монеты
   spawnDmgText(P.x,P.y-P.r-14,'+'+c.val,'gold');
   coinDrops.splice(ci,1);
  }
 }
}
function updateLeveling(dt){
 // САМОРЕГУЛИРУЮЩАЯСЯ ОЧЕРЕДЬ ЛЕВЕЛОВ: если хватает XP — поднимаем уровень.
 // levelUp() сам ставит paused=true и вызывает showCards(), который
 // перерисовывает cardrow. Пока карты на экране — update(dt) не вызывается
 // (paused=true), и следующий levelUp не случится. Игрок видит каждое меню.
 // pendingLevelUps больше не нужен — опыт сам "дозреет" после закрытия карт.
 // v5.14.1: несколько уровней за кадр (редко), с потолком от вечного цикла
 let _lu=0;while(xp>=xpNext&&_lu<8){levelUp();_lu++;}
 // v6.18e: два-три уровня разом — это маленький праздник, а подавалось как один
 // обычный левелап. Теперь всплеск виден, и игрок понимает, что произошло.
 if(_lu>=2){surgeBanner('×'+_lu+' УРОВНЯ РАЗОМ','опыт хлынул через край','#8fd0ff');
  flashScreen('#8fd0ff',0.4);}
 slashes.forEach(s=>s.t-=dt);prune(slashes,s=>s.t>0); // #12: in-place
 for(let ti=ACTIVE.dmgTexts.length-1;ti>=0;ti--){const t=ACTIVE.dmgTexts[ti];t.t-=dt;t.y-=30*dt;if(t.t<=0)poolRelease(POOL.dmgTexts,t);}
 bolts.forEach(b=>b.t-=dt);prune(bolts,b=>b.t>0); // #12: in-place
}
function updateDespawn(dt){
 // ДЕСПАВН: удаляем мёртвых ИЛИ слишком далеких врагов за один проход.
 // радиус деспавна ДИНАМИЧЕСКИ = макс. возможная дистанция спавна + запас.
 // Раньше было жёстко 1200, что на мобильном (H=WORLD) было МЕНЬШЕ радиуса спавна (2150).
 // В итоге враг спавнился за экраном и в том же кадре удалялся фильтром.
 // Формула спавна: max(W,H)/2 + 250 (база) + 700 (forceDistant) = max+950 макс.
 // Берём с запасом +200 для деспавна.
 const maxSpawnDist=Math.max(W,H)/2+950;
 const despawnR2=(maxSpawnDist+200)*(maxSpawnDist+200);
 prune(enemies,e=>{ // #12 + v5.12 release в пул
  if(e.dying>0)return true;
  if(!isFinite(e.hp)||e.hp<=0){releaseEnemy(e);return false;}
  if(e.boss||e.elite||e.mini)return true;
  const keep=dist2(e.x-P.x,e.y-P.y)<despawnR2;
  if(!keep)releaseEnemy(e);
  return keep;
 });
}
function updateHud(dt){
 // HP проверка
 // v6.18: узел древа «Второе дыхание» — одно воскрешение за забег без рекламы.
 // Проверяется ДО платного возрождения: бесплатное право игрок уже купил.
 if(P.hp<=0&&!over&&!won&&P._metaSecondWind&&!secondWindUsed){secondWind();}
 else if(P.hp<=0&&!over&&!won){if(canRevive())offerRevive();else endRun(false);}   // v5.66
 // low HP vignette — кэшированная ссылка
 UI.lowHpV.style.opacity=(P.hp/P.maxhp<0.3)?'1':'0';
 // ПЕРИОДИЧЕСКАЯ ПРОВЕРКА ДОСТИЖЕНИЙ — раз в 1 секунду (для time-bound наград)
 achCheckT-=dt;
 if(achCheckT<=0){
  achCheckT=1;
  checkAch();
 }
 // Границы камеры: центрируем на игроке, но не выходим за пределы мира
 // camMaxX/Y — насколько можно сдвинуть камеру, чтобы край экрана = краю мира
 // Если W > world (маленький мир), то max=0; если W < world, то max = world - W
 const camMaxX=Math.max(0,WORLD-W);
 const camMaxY=Math.max(0,WORLD-H);
 // v5.7 Feel: exp-lerp камера (стабильна на 30/60 FPS) + лёгкий look-ahead.
 // Hard-follow дёргал картинку при смене WASD; спавн по-прежнему от cam.
 const look=0;
 const tx=clamp(P.x-W/2+(P.fx||0)*look,0,camMaxX);
 const ty=clamp(P.y-H/2+(P.fy||0)*look,0,camMaxY);
 // v6.1: камера догоняла цель ШАГАМИ ФИЗИКИ (60 раз в секунду), а рисовалась
 // каждый кадр. Весь мир поэтому двигался ступеньками по 60 Гц независимо от
 // частоты дисплея — самый заметный источник «дёрганности», потому что при
 // движении смещается вся картинка, а не отдельный спрайт.
 // Теперь здесь только ЦЕЛЬ камеры, а само сглаживание — в draw() по реальному
 // времени кадра (см. camFollow). Экспоненциальный лерп для этого и годится:
 // он не зависит от размера шага.
 camTarget.x=tx;camTarget.y=ty;
 camTarget.maxX=camMaxX;camTarget.maxY=camMaxY;

}

