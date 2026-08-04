function updateWeapons(dt){
 // оружия
 // buildGrid() вызывается ПЕРЕД doSword/doBolt, чтобы spatial hash
 // был свежим. Раньше buildGrid вызывался ПОСЛЕ оружий, и атаки
 // использовали устаревшие позиции врагов (лаг 1 кадр).
 buildGrid();
 // раньше swordRate делился на КАЖДОЕ оружие — пассивка Воина
 // (swordRate=1.3) ускоряла и молнию тоже. Теперь у каждого оружия свой
 // модификатор скорости (boltRateMul — от божества Перуна).
 for(const w of weapons){w.t-=dt;if(w.t<=0){
  const wRate=w.id==='sword'?(P.swordRate||1):(w.id==='bolt'?(P.boltRateMul||1):(w.id==='bow'?((P.bowRate||1)*(1+0.03*(bowLvl-1))):1));
  const _rr=Math.max(0.05,(P.rateMul||1)*Math.max(0.05,P.specialRate||1)*Math.max(0.05,wRate||1));let cd=w.cd*wCd(w.id)/_rr; // v6.19 (C1): ось кулдауна — P.cdMul влияет на частоту
  if(!(cd>0.02))cd=0.02; // v6.74: защита от cdMul<=0 (отрицательный cd → спам оружия каждый кадр)
  if(w.id==='sword'){
   if(doSword())w.t+=cd;else w.t=0.08; // не машем в пустоту, но быстро проверяем сближение с врагом
  }else if(w.id==='bolt'){
   const _bt=boltTarget();
   if(!_bt){w.t=0.08;}                             // v5.61: цели нет — кулдаун не тратим, переспрос через 80 мс
   else{w.t+=cd;
    if(_bt.d<=ATK_ANIM_R){                         // v5.63: враг в радиусе замаха — играем клип удара
     if(!P.moving)faceTo(_bt.e);                   // v5.62: стоим — смотрим на цель; идём — взгляд за движением
     if(heroAnimPlay('atk')){P.atk=heroAtkDur();HA.onHit=doBolt;}
     else doBolt();                                // анимация занята — бьём сразу, урон не теряем
    }else doBolt();                                // далеко: урон есть, замаха нет
   }
  }
  else if(w.id==='bow'){if(doBow())w.t+=cd;else w.t=0.06;}
  // v6.17: новый арсенал
  else if(w.id==='serp'){if(doSerp())w.t+=cd;else w.t=0.1;}
  else if(w.id==='kosa'){if(doKosa())w.t+=cd;else w.t=0.1;}
  else if(w.id==='ugli'){if(doUgli())w.t+=cd;else w.t=0.12;}
  else if(w.id==='kamen'){if(doKamen())w.t+=cd;else w.t=0.1;}
  else if(w.id==='obereg'){if(doObereg())w.t+=cd;else w.t=0.1;}
  else if(w.id==='zov'){if(doZov())w.t+=cd;else w.t=0.35;}
  // v6.17b: вторая волна
  else if(w.id==='kolokol'){if(doKolokol())w.t+=cd;else w.t=0.2;}
  else if(w.id==='verv'){if(doVerv())w.t+=cd;else w.t=0.15;}
  else if(w.id==='idol'){if(doIdol())w.t+=cd;else w.t=0.4;}
  else if(w.id==='navi'){if(doNavi())w.t+=cd;else w.t=0.1;}
  else if(w.id==='rosa'){if(doRosa())w.t+=cd;else w.t=0.12;}
  else if(w.id==='vihr'){if(doVihr())w.t+=cd;else w.t=0.15;}
  else if(w.id==='klyuka'){if(doKlyuka())w.t+=cd;else w.t=0.15;}
  else if(w.id==='zerno'){if(doZerno())w.t+=cd;else w.t=0.15;}
  // v6.17c: третья волна
  else if(w.id==='kosti'){if(doKosti())w.t+=cd;else w.t=0.12;}
  else if(w.id==='upyr'){if(doUpyr())w.t+=cd;else w.t=0.12;}
  else if(w.id==='zercalo'){if(doZercalo())w.t+=cd;else w.t=0.2;}
  else if(w.id==='sopel'){if(doSopel())w.t+=cd;else w.t=0.12;}
  else if(w.id==='trizna'){if(doTrizna())w.t+=cd;else w.t=0.2;}
  else if(w.id==='golod'){if(doGolod())w.t+=cd;else w.t=0.12;}
 }}
}
// ============================================================
//  v6.17 РАСШИРЕНИЕ АРСЕНАЛА — 6 новых видов оружия + эволюции
//  Механические паттерны жанра (возвратный снаряд, ближний конус, след,
//  рикошет, щит-отталкивание, призыв) переосмыслены в славянском сеттинге.
//  Копий чужих названий/текстов/формул нет — только общежанровая геометрия.
//  Каждое оружие отвечает на вопрос «как из-за него меняется мой маршрут»:
//   serp   — бьёт ЗА спину, награда за подпускание вплотную
//   kosa   — конус по направлению взгляда, требует держать строй перед собой
//   ugli   — след позади, награда за бег сквозь толпу
//   kamen  — рикошет между целями, сильнее в плотной куче
//   obereg — кольцо-отталкивание, меняет саму физику подхода врагов
//   zov    — автономные волки, бьют там, где игрока нет
// ============================================================
