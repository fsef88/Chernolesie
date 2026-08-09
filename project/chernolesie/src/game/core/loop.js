let last=performance.now(),acc=0,loopStarted=false,lastDraw=0,miniTimer=0;
// v7.36: состояние привязки к развёртке — см. длинный комментарий в frame().
// __vsPeriod — измеренный период развёртки (8.3мс на 120Гц, 16.7 на 60Гц),
// __vsStride — через сколько развёрток рисуем, __vsBase — минимум для этого экрана.
let __vsPrev=0,__vsP=[],__vsPi=0,__vsPeriod=0,__vsBase=1,__vsStride=1,__vsN=0,__vsMiss=0,__vsOk=0;
// ИНТЕРПОЛЯЦИЯ АНИМАЦИЙ — для плавного движения врагов между кадрами физики
let animAccumulator=0;
let lastFrameTime=performance.now();
const PHYSICS_DT=1/60;
// Сколько стоила последняя отрисовка. Стартовое значение заведомо большое:
// пока не измерили, ведём себя осторожно и держим половинную частоту.
let _lastFrameCost=99;
let interpFactor=0;
let _drawDt=1/60;   // v6.16: реальное время последнего кадра отрисовки
// v6.17: сетка для разведения врагов. Ячейка 48px — чуть больше максимального
// радиуса взаимодействия (r+r+6 у крупных типов), поэтому хватает 3x3 ячеек.
const _SEP_CELL=48;
// v9.0 COMMERCIAL ENGINE ARCHITECTURE (Flat O(1) Spatial Hash Grid):
// Заменяем Map с битовыми XOR-хешами на плоский одномерный массив (O(1) без хеширования, коллизий и GC).
const _SEP_N=Math.ceil(WORLD/_SEP_CELL)+2;
const _sepGridArr=new Array(_SEP_N*_SEP_N);
let _sepUsedCells=[];
function _sepClear(){
 for(let i=0;i<_sepUsedCells.length;i++){const a=_sepGridArr[_sepUsedCells[i]];if(a)a.length=0;}
 _sepUsedCells.length=0;
}
const _sepBuf=[];
function _sepNear(x,y){
 _sepBuf.length=0;
 const cx=(x/_SEP_CELL)|0,cy=(y/_SEP_CELL)|0;
 for(let gx=cx-1;gx<=cx+1;gx++){
  if(gx<0||gx>=_SEP_N)continue;
  for(let gy=cy-1;gy<=cy+1;gy++){
   if(gy<0||gy>=_SEP_N)continue;
   const cell=_sepGridArr[gy*_SEP_N+gx];
   if(cell)for(let i=0;i<cell.length;i++)_sepBuf.push(cell[i]);
  }
 }
 return _sepBuf;
}
function frame(now){
 if(!window.__yaGameRendered){window.__yaGameRendered=1;try{window.__yaReady&&window.__yaReady();}catch(e){}}
 try{
  // v11.6 VAMPIRE SURVIVORS 60-144Hz BUTTER-SMOOTH TIMING ENGINE:
  // Естественный непрерывный таймер rAF без искусственных пропусков и квантования
  let _rdt = (now - last) / 1000;
  last = now;
  if(_rdt > 0.08) _rdt = 0.08;
  if(_rdt < 0.001) _rdt = 0.001;

  const d = _rdt * GAME_SPEED;
  acc += d;

  let steps = 0;
  while(acc >= PHYSICS_DT && steps < 4){
   update(PHYSICS_DT);
   acc -= PHYSICS_DT;
   steps++;
  }
  // Защита от спирали отставания без потери остатка интерполяции
  if(acc > PHYSICS_DT) acc = PHYSICS_DT;

  // Идеальная непрерывная субкадровая интерполяция
  interpFactor = Math.max(0, Math.min(1, acc / PHYSICS_DT));

  // Отрисовка каждого кадра на нативной частоте монитора/дисплея (60/75/90/120/144 Гц)
  draw();

  if(zoomPunch > 1.001) zoomPunch = 1 + (zoomPunch - 1) * Math.exp(-_rdt * 8);
  else zoomPunch = 1;

  if(now - miniTimer > 200){
   drawMinimap();
   miniTimer = now;
  }
 }catch(e){
  const _now = performance.now();
  if(!frame._errT || _now - frame._errT > 1000){frame._errT = _now; console.error('FRAME:', e);}
 }
 requestAnimationFrame(frame);
}
// Запускаем loop на первом user input (tap/click/keypress)
// Chrome тротлит setInterval/rAF в фоновых вкладках/iframe — но rAF даёт V-Sync
function startLoop(){
 if(loopStarted)return;
 loopStarted=true;
 // console.log removed v6.16
 // Рекурсивный rAF — V-Sync с монитором, нет tearing.
 // Если tab уходит в фон, rAF тротлится Chrome, но игра не падает.
 lastDraw=performance.now();
 requestAnimationFrame(frame);
}
// Сразу пытаемся запустить (сработает если tab в фокусе)
setTimeout(()=>{if(!loopStarted){startLoop();}},50);
// Запускаем на любом user input
addEventListener('touchstart',()=>startLoop(),{passive:true});
addEventListener('pointerdown',()=>startLoop(),{passive:true});
addEventListener('keydown',()=>startLoop(),{passive:true});
addEventListener('click',()=>startLoop(),{passive:true});
// Также подписываемся на visibility — когда tab становится видимым
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){
  // (#6) вместо мёртвого #wakeup — авто-пауза при уходе в фон.
  // Без неё на мобильном аккумулятор времени накапливал секунды, и после
  // возврата игра «прыгала» вперёд (враги телепортировались к игроку).
  if(!paused&&!over&&!runEnded)togglePause();
 }else{
  startLoop();
 }
});
// v1.0 Яндекс: пауза при потере фокуса + отключение контекстного меню (требования 1.3, 1.6.1.8)
window.addEventListener('blur',()=>{if(started&&!paused&&!over&&!runEnded)togglePause();});
addEventListener('contextmenu',e=>e.preventDefault());
// Дополнительный watchdog: если loop не запущен, запустить через 1с
setTimeout(()=>{if(!loopStarted)startLoop();},1000);


// ============================================================
//  v6.18  РЕЦЕПТЫ ЭВОЛЮЦИЙ, ТЕЛЕГРАФ, МОМЕНТ, ЖУРНАЛ, ВЕТКА ОТКРЫТИЙ
//  Основание — документ «Чернолесье: психология удержания».
//  Коротко, что было не так:
//   * эволюция происходила сама (сундук брал старшее оружие 5 ур.) — игрок
//     не выбирал, не планировал и часто не замечал кульминацию забега;
//   * мета-дерево состояло только из чисел, а «+48% против +60%» не ощущается;
//   * экран смерти сообщал ФАКТ поражения, но не его причину;
//   * 27 новых орудий не участвовали ни в одной синергии.
//  Ниже — по одному ответу на каждый пункт.
// ============================================================

// ---------- имена орудий для интерфейса ----------
