const partQual={0:0.3,1:0.6,2:1.0};
let partMul=0.6;
// (#7) пользовательская настройка хранится отдельно (partTarget) —
// автотюнер снижает partMul при лагах и ВОССТАНАВЛИВАЕТ обратно к partTarget.
let partTarget=0.6;
document.getElementById('qpart').onchange=(e)=>{partTarget=partQual[+e.target.value];partMul=partTarget;};
// v6.23 ТАКТИЛЬНАЯ ОТДАЧА. Игра тач-first, а navigator.vibrate не использовался
// вообще. Короткий импульс на крите и косьбе стоит ноль кадров и добавляет
// больше веса удару, чем любая частица. Троттлинг 60 мс: без него плотный бой
// превращает телефон в непрерывно жужжащий кирпич.
let vibeOn=true,_vibeMs=0;
try{vibeOn=LS.get('cl_vibe')!=='0';}catch(e){swallow('vibe.flag',e);}
function vibe(ms){
 if(!vibeOn)return;
 const t=Date.now();
 if(t-_vibeMs<60)return;
 _vibeMs=t;
 try{if(navigator.vibrate)navigator.vibrate(ms);}catch(e){swallow('vibe',e);}
}
const _vibSel=document.getElementById('vibsel');
if(_vibSel)_vibSel.onchange=(e)=>{vibeOn=e.target.value==='1';LS.set('cl_vibe',vibeOn?'1':'0');};
let fpsCap=0; // v5.29: кап по умолчанию ВЫКЛ — гонка 16.67ms против vsync 16.67ms дёргала кадры
document.getElementById('fpscap').onchange=(e)=>{fpsCap=+e.target.value;};
// ================== v5.29 ХРОНОМЕТР (профайлер) ==================
// Вход только по адресу ?prof=1. Когда выключен — лишь пара проверок флага за кадр.
// Обработчика F3 в файле никогда не было, старая подсказка врала — убрана.
// v6.25: панель хронометра убрана из игры. Флаг больше НЕ поднимается из
// localStorage и не переключается из паузы — иначе однажды включённая панель
// висела на экране у игрока навсегда. Остался только вход по адресу ?prof=1
// для отладки. Заодно вычищаем старое сохранённое значение cl_prof.
let __PROF_ON=false;
try{__PROF_ON=/[?&]prof=1/.test(location.search);if(/[?&](?:boss|dev|prof)=1/.test(location.search)){const _br=document.getElementById('devBossRushWrap');if(_br)_br.style.display='block';}localStorage.removeItem('cl_prof');}catch(e){swallow('prof.flag',e);}
const PROF={acc:{},_t:{},frames:0,draws:0,jank:0,gapMax:0,_gap:0,fps:0};
// v7.36 ВЫКЛЮЧАТЕЛИ СЛОЁВ. Хронометр меряет только время записи команд в JS,
// а холст рисует их позже — поэтому три гипотезы подряд промахнулись. Ищем
// вычитанием: гасим слой, смотрим FPS. Панель появляется вместе с хронометром.
const __DBG={props:1,auras:1,enemies:1,glow:1,fx:1,dmg:1};
let __dbgEl=null;
function __dbgPanel(){
 if(!__PROF_ON||__dbgEl)return;
 __dbgEl=document.createElement('div');
 __dbgEl.style.cssText='position:fixed;top:8px;left:8px;z-index:99;display:flex;flex-wrap:wrap;gap:4px;max-width:60vw';
 const names={props:'пропсы',auras:'ауры',enemies:'враги',glow:'свет',fx:'эффекты',dmg:'цифры'};
 for(const k in __DBG){
  const b=document.createElement('button');
  b.type='button';b.textContent=names[k];
  b.style.cssText='font:10px monospace;padding:5px 8px;border-radius:5px;border:1px solid #6a5a34;background:#1a2a1a;color:#cfe0b0';
  b.onclick=(e)=>{
   e.preventDefault();e.stopPropagation();
   __DBG[k]=__DBG[k]?0:1;
   b.style.background=__DBG[k]?'#1a2a1a':'#3a1414';
   b.style.color=__DBG[k]?'#cfe0b0':'#ff9a8a';
  };
  __dbgEl.appendChild(b);
 }
 // АВТОЗАМЕР. Владелец не должен щёлкать шесть кнопок и запоминать числа.
 // Прогон гасит по одному слою за раз, держит каждый вариант около двух секунд
 // и усредняет FPS. Итог — готовая таблица: сколько кадров возвращает каждый
 // слой. Разница между «всё» и «без X» и есть цена слоя X.
 const ab=document.createElement('button');
 ab.type='button';ab.textContent='⏱ автозамер';
 ab.style.cssText='font:10px monospace;padding:5px 8px;border-radius:5px;border:1px solid #c9a04a;background:#2a2010;color:#ffcf6a';
 ab.onclick=(e)=>{e.preventDefault();e.stopPropagation();if(!__dbgBusy)__dbgSweep(ab);};
 __dbgEl.appendChild(ab);
 __dbgOut=document.createElement('pre');
 __dbgOut.style.cssText='margin:4px 0 0;font:11px/1.5 monospace;color:#ffcf6a;background:rgba(8,8,6,.9);border:1px solid #6a5a34;border-radius:5px;padding:5px 8px;white-space:pre;width:100%';
 __dbgOut.textContent='';
 __dbgEl.appendChild(__dbgOut);
 document.body.appendChild(__dbgEl);
}
let __dbgOut=null,__dbgBusy=false;
async function __dbgSweep(btn){
 __dbgBusy=true;
 const names={props:'пропсы',auras:'ауры',enemies:'враги',glow:'свет',fx:'эффекты',dmg:'цифры'};
 const keys=Object.keys(__DBG);
 const setAll=(v)=>{for(const k in __DBG)__DBG[k]=v;};
 const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
 // Усредняем по четырём окнам хронометра: одиночное значение скачет от того,
 // сколько врагов на экране прямо сейчас.
 const sample=async()=>{
  await wait(700);
  let s=0;
  for(let i=0;i<4;i++){await wait(520);s+=PROF.fps;}
  return Math.round(s/4);
 };
 const rows=[];
 const draw=()=>{if(__dbgOut)__dbgOut.textContent=rows.join('\n');};
 try{
  btn.textContent='замер…';
  setAll(1);rows.push('всё вместе   '+await sample());draw();
  for(const k of keys){
   setAll(1);__DBG[k]=0;
   btn.textContent='без '+names[k];
   rows.push(('без '+names[k]).padEnd(13)+await sample());draw();
  }
  setAll(0);rows.push('пусто        '+await sample());draw();
 }finally{
  setAll(1);btn.textContent='⏱ автозамер';__dbgBusy=false;
 }
}
let __profEl=null,__HUDW={};
function pT(k,on){if(!__PROF_ON)return;if(on){PROF._t[k]=performance.now();}else{PROF.acc[k]=(PROF.acc[k]||0)+performance.now()-(PROF._t[k]||performance.now());}}
setInterval(()=>{
 if(!__PROF_ON)return;
 __dbgPanel();
 // Два делителя, а не один. upd копится на КАЖДОМ вызове rAF (физика идёт
 // всегда), а ground/world/atmos/rtotal — только на нарисованных кадрах.
 // Общий делитель врал в обе стороны сразу: занижал отрисовку и завышал upd.
 const nfD=Math.max(1,PROF.draws), nfF=Math.max(1,PROF.frames);
 PROF.fps=Math.round(PROF.draws/0.5);          // кадры, которые игрок реально увидел
 PROF.raf=Math.round(PROF.frames/0.5);         // вызовы rAF: по ним видна развёртка экрана
 if(!__profEl){__profEl=document.createElement('div');__profEl.id='prof';__profEl.style.cssText='position:fixed;top:60px;right:8px;z-index:99;background:rgba(8,8,6,.85);border:1px solid #6a5a34;border-radius:6px;padding:6px 9px;font:10px/1.6 monospace;color:#cfe0b0;white-space:pre;pointer-events:none;text-shadow:0 1px 1px #000';document.body.appendChild(__profEl);}
 __profEl.style.display='block';
 const _jd=' joy  down '+JDBG.down+' move '+JDBG.move+' id '+JDBG.lastId+'\n'+
           ' touch '+touchMove.x.toFixed(2)+','+touchMove.y.toFixed(2)+' act '+(touchMove.active?1:0)+'\n'+
           ' move  '+JDBG.mx+','+JDBG.my+'  spd '+JDBG.spd+'  zoom '+ZOOM+'\n';
 const rows=['FPS '+String(PROF.fps).padStart(3)+'  rAF '+String(PROF.raf).padStart(3)+'  экран '+(__vsPeriod?Math.round(1000/__vsPeriod):0)+'Гц',
            'jank '+PROF.jank+'  maxgap '+PROF.gapMax.toFixed(1)+'ms'];
 for(const k of ['upd','ground','world','atmos','hud','mini','rtotal']){
  const ms=(PROF.acc[k]||0)/(k==='upd'?nfF:nfD);
  rows.push(k.padEnd(6)+' '+ms.toFixed(2)+'ms'+(ms>8?'  <<<':''));
 }
 __profEl.textContent=rows.join('\n')+'\n'+_jd;   // v6.14: строки ввода
 PROF.frames=0;PROF.draws=0;PROF.acc={};PROF.jank=0;PROF.gapMax=0;
},500);
// v6.4: переключатель хронометра прямо в настройках. Раньше он включался только
// через ?prof=1 в адресе или запись в localStorage, и флаг читался ОДИН раз при
// загрузке — на телефоне это неудобно, а перезагрузка сбрасывает забег, то есть
// замерить самый интересный момент (плотная толпа на 20-й минуте) было нельзя.
// __PROF_ON объявлен через let, а все замеры идут через if(__PROF_ON) — поэтому
// флаг можно переключать на ходу, прямо во время боя, из паузы.
(function(){
 const el=document.getElementById('zoomsel');
 if(el){
  el.value=zoomPref();
  el.onchange=()=>{LS.set('cl_zoom','far');resize();log('Обзор: Далеко','gold');};
 }
})();
// ================== /ХРОНОМЕТР ==================
document.getElementById('theme').onchange=(e)=>{theme=e.target.value;LS.set('cl_theme',theme);applyTheme();};
document.getElementById('warp').onchange=(e)=>{warpOn=e.target.value==='1';LS.set('cl_warp',e.target.value);};
function applyTheme(){
 const cv=document.getElementById('c');
 if(theme==='winter')cv.style.background='#3a4a5a';
 else if(theme==='night'||nightMode)cv.style.background='#0a0a18';
 else cv.style.background='#1a2410';
}
applyTheme();
// UI CACHE: вместо document.getElementById(...) на каждом кадре (60 раз/сек),
// кэшируем ссылки один раз. getElementById сам по себе не медленный,
// но вызовы JS-функций и поиск в DOM деревьях — лишняя нагрузка.
