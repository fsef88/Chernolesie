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
try{__PROF_ON=/[?&]prof=1/.test(location.search);localStorage.removeItem('cl_prof');}catch(e){swallow('prof.flag',e);}
const PROF={acc:{},_t:{},frames:0,jank:0,gapMax:0,_gap:0,fps:0};
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
 document.body.appendChild(__dbgEl);
}
let __profEl=null,__HUDW={};
function pT(k,on){if(!__PROF_ON)return;if(on){PROF._t[k]=performance.now();}else{PROF.acc[k]=(PROF.acc[k]||0)+performance.now()-(PROF._t[k]||performance.now());}}
setInterval(()=>{
 if(!__PROF_ON)return;
 __dbgPanel();
 const nf=Math.max(1,PROF.frames);
 PROF.fps=Math.round(PROF.frames/0.5);
 if(!__profEl){__profEl=document.createElement('div');__profEl.id='prof';__profEl.style.cssText='position:fixed;top:60px;right:8px;z-index:99;background:rgba(8,8,6,.85);border:1px solid #6a5a34;border-radius:6px;padding:6px 9px;font:10px/1.6 monospace;color:#cfe0b0;white-space:pre;pointer-events:none;text-shadow:0 1px 1px #000';document.body.appendChild(__profEl);}
 __profEl.style.display='block';
 const _jd=' joy  down '+JDBG.down+' move '+JDBG.move+' id '+JDBG.lastId+'\n'+
           ' touch '+touchMove.x.toFixed(2)+','+touchMove.y.toFixed(2)+' act '+(touchMove.active?1:0)+'\n'+
           ' move  '+JDBG.mx+','+JDBG.my+'  spd '+JDBG.spd+'  zoom '+ZOOM+'\n';
 const rows=['FPS '+String(PROF.fps).padStart(3)+'  jank '+PROF.jank+'  maxgap '+PROF.gapMax.toFixed(1)+'ms'];
 for(const k of ['upd','ground','world','atmos','hud','mini','rtotal']){
  const ms=(PROF.acc[k]||0)/nf;
  rows.push(k.padEnd(6)+' '+ms.toFixed(2)+'ms'+(ms>8?'  <<<':''));
 }
 __profEl.textContent=rows.join('\n')+'\n'+_jd;   // v6.14: строки ввода
 PROF.frames=0;PROF.acc={};PROF.jank=0;PROF.gapMax=0;
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
