// ============================================================
//  ТУМАН ВОЙНЫ
// ============================================================
const EXPLORED_CELL=TILE*3; // туман войны — клетки 3×3 тайла = 180px
// v6.0: туман войны переведён со Set строковых ключей на битовую сетку.
// Причина: старый код имел ЖЁСТКИЙ потолок `if(explored.size>=1400)return`, и
// комментарий рядом объяснял его тем, что при WORLD=6000 клеток физически не
// больше ~1300. После увеличения мира клеток стало (24000/180+2)² ≈ 18200, то есть
// потолок выбивался на 8% карты, и дальше туман переставал открываться: игрок
// ходил по «неисследованной» земле, тёмные квадраты накрывали его самого, а враги
// в этих клетках вообще не рисовались (см. отсечение в drawEnemiesLayer).
// Заодно ушла и другая проблема, замеченная ранее в аудите: markExplored звался
// 4 раза за кадр и на каждый вызов делал 9 конкатенаций строк для ключей Set —
// около 2000 строковых аллокаций в секунду ради косметики. Теперь это индексация
// в Uint8Array: 18 КБ памяти на всю карту и ноль аллокаций.
const EX_N=Math.ceil(WORLD/EXPLORED_CELL)+2;
let explored=new Uint8Array(EX_N*EX_N);
function markExplored(x,y){
 const cx=Math.floor(x/EXPLORED_CELL),cy=Math.floor(y/EXPLORED_CELL);
 for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
  const ix=cx+dx,iy=cy+dy;
  if(ix<0||iy<0||ix>=EX_N||iy>=EX_N)continue;
  explored[iy*EX_N+ix]=1;
 }
}
function isExplored(x,y){
 if(!warpOn)return true;
 const ix=Math.floor(x/EXPLORED_CELL),iy=Math.floor(y/EXPLORED_CELL);
 if(ix<0||iy<0||ix>=EX_N||iy>=EX_N)return true;   // за пределами сетки не туманим
 return explored[iy*EX_N+ix]===1;
}

