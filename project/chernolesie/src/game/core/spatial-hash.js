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
  const cx=(e.x/CELL)|0,cy=(e.y/CELL)|0;
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
// v10.0 COMMERCIAL ENGINE ARCHITECTURE (Zero-GC Spatial Query Pool & Inline Euclidean):
// Заменяем аллокацию новых массивов const out = [] при каждом боевом запросе на статический пул переиспользуемых буферов.
const _nearPool = [ [], [], [], [], [], [], [], [] ];
let _nearPoolIdx = 0;
function _getNearBuf(){
 const buf = _nearPool[(_nearPoolIdx++) & 7];
 buf.length = 0;
 return buf;
}
function aliveNear(x,y,r){
 const out=_getNearBuf();const r2=r*r;
 let minCx=((x-r)/CELL)|0,maxCx=((x+r)/CELL)|0;
 let minCy=((y-r)/CELL)|0,maxCy=((y+r)/CELL)|0;
 if(minCx<0)minCx=0; if(minCy<0)minCy=0;
 if(maxCx>=GRID_N)maxCx=GRID_N-1; if(maxCy>=GRID_N)maxCy=GRID_N-1;
 for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
  const arr=gridArr[cy*GRID_N+cx];if(!arr||arr.length===0)continue;
  for(let i=0;i<arr.length;i++){
   const e=arr[i];
   if(e.hp<=0||e.dying>0)continue;
   const dx=e.x-x,dy=e.y-y;if(dx*dx+dy*dy<=r2)out.push(e);
  }
 }
 return out;
}
function findClosestEnemy(x,y,r,ignoreList){
 const r2=r*r;
 let minCx=((x-r)/CELL)|0,maxCx=((x+r)/CELL)|0;
 let minCy=((y-r)/CELL)|0,maxCy=((y+r)/CELL)|0;
 if(minCx<0)minCx=0; if(minCy<0)minCy=0;
 if(maxCx>=GRID_N)maxCx=GRID_N-1; if(maxCy>=GRID_N)maxCy=GRID_N-1;
 let best=null, bestD=r2;
 for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
  const arr=gridArr[cy*GRID_N+cx];if(!arr||arr.length===0)continue;
  for(let i=0;i<arr.length;i++){
   const e=arr[i];
   if(e.hp<=0||e.dying>0)continue;
   if(ignoreList&&ignoreList.indexOf(e)>=0)continue;
   const dx=e.x-x,dy=e.y-y,d=dx*dx+dy*dy;
   if(d<bestD){bestD=d;best=e;}
  }
 }
 return best;
}
function enemiesNear(x,y,r,predicate){
 const out=_getNearBuf();const r2=r*r;
 let minCx=((x-r)/CELL)|0,maxCx=((x+r)/CELL)|0;
 let minCy=((y-r)/CELL)|0,maxCy=((y+r)/CELL)|0;
 if(minCx<0)minCx=0; if(minCy<0)minCy=0;
 if(maxCx>=GRID_N)maxCx=GRID_N-1; if(maxCy>=GRID_N)maxCy=GRID_N-1;
 for(let cy=minCy;cy<=maxCy;cy++)for(let cx=minCx;cx<=maxCx;cx++){
  const arr=gridArr[cy*GRID_N+cx];if(!arr||arr.length===0)continue;
  for(let i=0;i<arr.length;i++){
   const e=arr[i];
   const dx=e.x-x,dy=e.y-y;
   if(dx*dx+dy*dy<=r2&&(!predicate||predicate(e)))out.push(e);
  }
 }
 return out;
}

