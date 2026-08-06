function updateEnemies(dt){
 // spatial hash
 const thornR=thorn.on?(68+16*thorn.lvl):0;
 const thornR2=thornR*thornR;
 const frostR=(frost.on?(88+16*frost.lvl):0)*(P.frostR||1);
 const frostR2=frostR*frostR;
 // Мягкий лимит плотности: если врагов слишком много РЯДОМ — замедляем их подход
 // Радиус "плотной зоны" = 70% от половины минимальной стороны экрана
 const DENSITY_R=Math.min(W,H)*0.35;
 const DENSITY_R2=DENSITY_R*DENSITY_R;
 // v6.17: ПРОСТРАНСТВЕННАЯ СЕТКА. Разведение и подсчёт плотности — это два обхода
 // всех врагов внутри обхода всех врагов, то есть O(n²): при 109 врагах на экране
 // ~24 000 проверок на КАЖДЫЙ шаг физики. Шагов до 5 за кадр, и когда update()
 // перестаёт укладываться в 16.7 мс, цикл упирается в лимит steps<5 — игровое время
 // начинает отставать от реального, и вся толпа наглядно едет в замедлении.
 // Раскладываем врагов по ячейкам размером с радиус взаимодействия: каждому нужны
 // только 9 соседних ячеек, сложность падает до линейной.
 // v6.74: очищаем сетку БЕЗ пересоздания массивов (иначе GC фризит каждый кадр)
 // v7.8: и одновременно выбрасываем осиротевшие ячейки — см. _sepClear в core/loop.js
 _sepClear();
 for(const e of enemies){
  if(!e.alive||e.hp<=0||e.dying>0)continue;
  const cx=(e.x/_SEP_CELL)|0,cy=(e.y/_SEP_CELL)|0;
  if(cx>=0&&cy>=0&&cx<_SEP_N&&cy<_SEP_N){
   const k=cy*_SEP_N+cx;
   let cell=_sepGridArr[k];
   if(!cell){cell=[];_sepGridArr[k]=cell;}
   if(cell.length===0)_sepUsedCells.push(k);
   cell.push(e);
  }
 }
 for(const e of enemies)updateOneEnemy(e,dt,thornR,thornR2,frostR,frostR2,DENSITY_R2);
 markExplored(P.x,P.y);
 for(let i=0;i<3;i++)markExplored(P.x+rnd(-180,180),P.y+rnd(-180,180));
 for(const a of anomalies)tryClaimAnomaly(a);
}
