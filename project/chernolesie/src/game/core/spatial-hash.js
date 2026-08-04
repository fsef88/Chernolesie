// ============================================================
//  SPATIAL HASH
// ============================================================
const CELL=160;
// v6.3: Map со строковыми ключами больше не нужна — см. gridArr ниже.
// (#15) было grid.clear() + НОВЫЙ массив на каждую ячейку каждый
// кадр. Теперь массивы переиспользуются (обнуляем .length) — ноль аллокаций
// в устоявшемся состоянии, ключи ячеек остаются в Map.
// v6.3 ПЛАВНОСТЬ (мусор): ключом клетки была СТРОКА `cx+','+cy`. buildGrid зовётся
// каждый кадр и делал такую строку на каждого врага — при капе 72 это 4300 строк в
// секунду, плюс столько же хеширований Map. Ещё больше давал enemiesNear: он
// собирает ключ на КАЖДУЮ просматриваемую клетку, а при радиусе 420 это 36 клеток
// за вызов, и вызовов несколько за кадр. Всё это короткоживущий мусор — именно от
// него в JS-играх и берутся рывки: кадр идёт ровно, потом сборщик останавливает
// всё на 10–30 мс, и это читается как «просадка до 15 fps», хотя средний FPS высок.
// Заменяем Map<string> на плоский массив с числовым индексом клетки. Размер мира
// известен, клеток GRID_N², индекс cy*GRID_N+cx — ни строк, ни хеширования.
// Чистим только те клетки, что использовали в прошлом кадре (_gridUsed).
const GRID_N=Math.ceil(WORLD/CELL)+2;
const gridArr=new Array(GRID_N*GRID_N);
let _gridUsed=[];
function buildGrid(){
 for(let i=0;i<_gridUsed.length;i++){const a=gridArr[_gridUsed[i]];if(a)a.length=0;}
 _gridUsed.length=0;
 for(const e of enemies){
  if(e.alive===false||e.hp<=0&&!(e.dying>0))continue;
  const cx=Math.floor(e.x/CELL),cy=Math.floor(e.y/CELL);
  if(cx<0||cy<0||cx>=GRID_N||cy>=GRID_N)continue;
  const k=cy*GRID_N+cx;
  let arr=gridArr[k];
  if(!arr){arr=[];gridArr[k]=arr;}
  if(arr.length===0)_gridUsed.push(k);
  arr.push(e);
 }
}
// v5.89: enemiesNear отдаёт и умирающие туши — buildGrid держит их, пока играет
// анимация смерти. Всему, что наносит урон, толкает или накладывает эффект,
// нужен именно живой список: иначе ульты расталкивают трупы, а Морозный обет
// «замораживает» их. Раньше фильтр стоял только у Волхва, Грозника и меча,
// а у Воина, Знахарки, Огневика и Воронника его забыли.
// Быстрый поиск ближайших врагов через spatial hash (используется в doSword/doBolt/useSpecial)
// v6.3: было enemiesNear(...).filter(...) — ДВА массива и замыкание на каждый вызов.
// Пишем сразу в один массив.
function aliveNear(x,y,r){
 const out=[];const r2=r*r;
 let minCx=Math.floor((x-r)/CELL),maxCx=Math.floor((x+r)/CELL);
 let minCy=Math.floor((y-r)/CELL),maxCy=Math.floor((y+r)/CELL);
 if(minCx<0)minCx=0; if(minCy<0)minCy=0;
 if(maxCx>=GRID_N)maxCx=GRID_N-1; if(maxCy>=GRID_N)maxCy=GRID_N-1;
 for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
  const arr=gridArr[cy*GRID_N+cx];if(!arr||arr.length===0)continue;
  for(const e of arr){
   if(e.hp<=0||e.dying>0)continue;
   if(dist2(e.x-x,e.y-y)<=r2)out.push(e);
  }
 }
 return out;
}
function enemiesNear(x,y,r,predicate){
 const out=[];const r2=r*r;
 let minCx=Math.floor((x-r)/CELL),maxCx=Math.floor((x+r)/CELL);
 let minCy=Math.floor((y-r)/CELL),maxCy=Math.floor((y+r)/CELL);
 if(minCx<0)minCx=0; if(minCy<0)minCy=0;
 if(maxCx>=GRID_N)maxCx=GRID_N-1; if(maxCy>=GRID_N)maxCy=GRID_N-1;
 for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
  const arr=gridArr[cy*GRID_N+cx];if(!arr||arr.length===0)continue;   // v6.3: числовой индекс вместо строки
  for(let i=0;i<arr.length;i++){
   const e=arr[i];
   if(dist2(e.x-x,e.y-y)<=r2&&(!predicate||predicate(e)))out.push(e);
  }
 }
 return out;
}

