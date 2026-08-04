function update(dt){

 if(paused||over||runEnded)return;
 if(!started)return; // v5.34 (C1): до нажатия «В бой» на титульнике — бой не идёт (нет спавна/времени/босса)
 // ЧАСЫ ЗАБЕГА ИДУТ В РЕАЛЬНОМ ВРЕМЕНИ.
 // Раньше здесь было time+=dt. update() зовётся 60*GAME_SPEED = 39 раз в
 // реальную секунду, поэтому таймер набегал 0.65 с за секунду: «~30 минут»
 // на титульнике превращались в 46 реальных, короткий режим — в 20 вместо 12.
 // Деление на GAME_SPEED переводит ВСЕ пороги баланса (bossTime, miniAt,
 // hpStepSec, ворота типов, разгон спавна) из «игровых» секунд в реальные.
 // Содержание забега не меняется — меняется только его длина по часам.
 time+=dt/GAME_SPEED;
 updateDirector(dt);   // v6.58: адаптивно держим давление боя
 updateMovement(dt);
 updateSpawning(dt);
 updateSpecial(dt);
 updateWeapons(dt);
 updateProjectiles(dt);
 updatePoison(dt);
 updateEnemies(dt);
 updateParticles(dt);
 updatePickups(dt);
 updateLeveling(dt);
 updateDespawn(dt);
 updateHud(dt);
 minuteMark();
 heartbeat(dt);
 flushMultiKill(dt);
}
// v6.22: разбор накопленных за шаг смертей. Порог 6 — ниже этого косьбы нет,
// это обычный размен, и лишний акцент только замылит редкие крупные волны.
function flushMultiKill(dt){
 if(mkFlash>0){mkFlash-=dt*2.4;if(mkFlash<0)mkFlash=0;}
 if(mkN<=0)return;
 if(mkN>=6){
  const cx=mkX/mkN,cy=mkY/mkN;
  shake=Math.max(shake,Math.min(9,2.5+mkN*0.16));
  mkFlash=Math.max(mkFlash,Math.min(0.6,0.16+mkN*0.014));
  sfxMultiKill(mkN);
  vibe(mkN>=18?45:22);
  // v6.23: стоп-кадр на крупной косьбе. Тот же механизм, что у эволюции
  // (evoPause), поэтому мир останавливается целиком, а не «подтормаживает».
  // Порог 14 — событие редкое, на рядовом размене не срабатывает никогда.
  if(mkN>=14)evoPause=Math.max(evoPause,0.09);
  if(mkN>=20)slowmoHit(0.28,1.06);   // v6.61: большая косьба — слоу-мо вместо полной остановки
  spawnDmgText(cx,cy-46,'×'+mkN,mkN>=18?'void':'phys',true);
  if(mkN>mkBest){
   mkBest=mkN;
   if(mkN>=14)log('☠ Скошено ×'+mkN+'!','gold');
  }
 }
 mkN=0;mkX=0;mkY=0;
}
