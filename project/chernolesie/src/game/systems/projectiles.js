function updateProjectiles(dt){
 // стрелы лука + таймеры серии/магнита/знамений + орбита
 if(arrows.length)updateArrows(dt);
 if(volki.length)updateVolki(dt);   // v6.17
 if(idols.length)updateIdols(dt);   // v6.17b
 // v6.32: tickSeeds() перенесён в updatePoison() — см. комментарий там.
 tickWeaponState(dt);               // v6.17c: серии, голод, метки смерти
 if(aimLines.length){for(let i=aimLines.length-1;i>=0;i--){aimLines[i].t-=dt;if(aimLines[i].t<=0)aimLines.splice(i,1);}}
 if(killComboT>0){killComboT-=dt;if(killComboT<=0)killCombo=0;}
 if(magnetT>0)magnetT-=dt;
 if(magnetSoftT>0)magnetSoftT-=dt;   // v6.61
 tickOmen(dt);
 // орбита
 // орбита наносит ТИХИЙ урон каждый кадр (без частиц/текста),
 // а визуальные эффекты (flash + dmgText) лимитированы кулдауном 0.4с на врага.
 // Раньше hitEnemy() на каждом кадре генерил 1 flash + 6 частиц + 65% dmgText
 // = 60 раз/сек на 1 врага = 360 частик/сек. На 10 врагов = 3600 частиц/сек → freeze.
 if(hasOrbit){
  orbAngle+=dt*3;
  for(let i=0;i<orbCount;i++){
   const a=orbAngle+i*(TAU/orbCount);
   const ox=P.x+Math.cos(a)*70,oy=P.y+Math.sin(a)*70;
   for(const e of enemies){
    if(dist(e.x-ox,e.y-oy)<e.r+10){
     // Чистый урон без частиц (множитель 15 вместо 60*0.25=15 — то же значение)
     dealDamage(e,5.2*P.dmgMul*(P.shadowOrbMul||1)*dt*12);
     // Визуал только раз в 0.4с на каждого врага
     e.orbT=(e.orbT||0)-dt;
     if(e.orbT<=0){
      spawnFlash(e.x,e.y-e.r*0.6,0,'#b478ff');
      spawnDmgText(e.x+rnd(-12,12),e.y-e.r,Math.round(8*P.dmgMul*15),'void');
      e.orbT=0.4;
     }
    }
   }
  }
 }
}
function updatePoison(dt){
 // зоны яда
 if(poison.on){
  poison.t-=dt;
  if(poison.t<=0&&enemies.length){
   poison.t+=1.3;
   // ВЫБОР ЦЕЛИ: только видимые враги (spatial hash в радиусе 500), иначе яд
   // улетает за экран, т.к. массив enemies может содержать кучу мобов
   // за 1200+ пикселей (которые ещё не деспавнились).
   // Фоллбэк на enemies — если рядом никого, берём случайного, иначе 1.3 сек
   // кулдауна пропадёт впустую.
   // v5.89: выбор точки для ядовитого облака брал и умирающие туши — облако
   // могло лечь на труп и сгореть впустую. Берём только живых.
   const visibleEnemies=aliveNear(P.x,P.y,500);
   const targetList=visibleEnemies.length>0?visibleEnemies:enemies;
   const e=targetList[Math.floor(seedRandom()*targetList.length)];
   // v5.80: P.evoPoisonCloud раньше НИКТО не читал — карта «Чума земли» была пустышкой.
   const _pc=P.evoPoisonCloud||0;
   const _pt=3+1.5*_pc;
   zones.push({x:e.x,y:e.y,r:(48+12*poison.lvl)*(1+0.18*_pc),t:_pt,max:_pt,dmg:6*poison.lvl*P.dmgMul*(1+0.25*_pc)});
  }
 }
 for(const z of zones){z.t-=dt;
  if(z.dmg<=0)continue;   // v6.17: кольцо оберега урон уже нанесло, это только визуал
  // v6.34: у Набата (_bell) есть СВОЙ удар раз в 0.5 с полным уроном (ниже).
  // Постоянный тик зоны применялся к нему тоже — оружие било двумя каналами
  // и не реагировало на баланс урона (замер: 509 убийств против медианы 64).
  // Пропускаем только постоянный тик; собственный удар набата остаётся.
  if(!z._bell)
  for(const e of enemies){if(e.hp<=0||e.dying>0)continue;
   if(dist(e.x-z.x,e.y-z.y)<z.r+e.r){dealDamage(e,z.dmg*dt);
    if(z._fire&&z._evo&&seedRandom()<0.04)e.poisoned=Math.max(e.poisoned||0,1.2);}}
   // v6.19c: рост Выжженного пути ВНЕ цикла врагов — иначе след не рос,
   // пока в нём никого нет (был внутри for(e), баг). Теперь разрастается всегда.
   if(z._gr){const f=1-Math.max(0,z.t)/z.max;z.r=z._grMax*(0.35+0.65*f);}
   // v6.19 (C3): Набат — резонирующий круг бьёт всех внутри по таймеру
   if(z._bell){
    z._bt=(z._bt||0)-dt;
    if(z._bt<=0){
     z._bt=1.2;   // v6.34: было 0.5 — набат бил 2 раза/с и выкашивал экран пассивно
     const bl=enemiesNear(z.x,z.y,z.r);
     for(const e of bl){if(e.hp<=0||e.dying>0)continue;
      hitEnemy(e,z.dmg,'elec',false);
      const dx=e.x-z.x,dy=e.y-z.y,d=Math.hypot(dx,dy)||1;
      e.kx+=dx/d*(z._evo?340:200);e.ky+=dy/d*(z._evo?340:200);
      if(z._evo)e.frozen=Math.max(e.frozen||0,1.1);
     }
     spawnFlash(z.x,z.y,0.6,'#ffd77d');
    }
   }
  }
 // v6.32: зёрна взрываются ЗДЕСЬ, до очистки. Раньше tickSeeds() стоял
 // в updateProjectiles() — то есть ДО того, как у зоны уменьшится t,
 // а созревшую зону тот же кадр удалял prune ниже. Взрыв не случался
 // ни разу за забег: замер показал 9 созревших зон и 0 урона.
 tickSeeds();
 prune(zones,z=>z.t>0); // #12: in-place — без нового массива каждый кадр
 // очистка собранных аномалий. Раньше splice в tryClaimAnomaly ломал
 // for...of итератор, и соседние аномалии пропускались. Теперь они остаются в массиве
 // с флагом claimed=true, и здесь мы массово удаляем их в одном проходе.
 prune(anomalies,a=>!a.claimed); // #12: in-place
}
// ============================================================
//  v5.69 тело цикла врагов вынесено из updateEnemies (было 284 строки
//  в одном for). Внешние радиусы передаются параметрами, чтобы не
//  считать их на каждого врага. continue исходного цикла -> return.
// ============================================================
// v5.72: рефакторинг updateOneEnemy по фазам
