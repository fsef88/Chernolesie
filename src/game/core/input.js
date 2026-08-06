// ============================================================
//  ВВОД
// ============================================================
const keys={};
const touchMove={x:0,y:0,active:false};
// v5.84: e.key может быть undefined у синтетических событий и части IME —
// toLowerCase() на undefined роняет весь обработчик, включая Esc и Q.
function setKey(e,v){if(e.key)keys[e.key.toLowerCase()]=v;if(e.code)keys[e.code]=v;}
// v5.84: КРИТИЧНО. В списке клавиш Печати стояли 'ц'/'Ц' — но на раскладке
// ЙЦУКЕН 'ц' даёт клавиша W, а не Q (Q даёт 'й'). То есть у русскоязычного
// игрока — то есть у всех — движение вперёд ОДНОВРЕМЕННО жало ульту, причём
// на автоповторе клавиши: печать срабатывала сама в тот же миг, как зарядится,
// и управлять ей было невозможно. После v5.78 (стрельба с одного заряда)
// удержание W сливало и весь накопленный запас.
// Оставляем: e.code==='KeyQ' (не зависит от раскладки) + 'q' + 'й'.
addEventListener('keydown',e=>{
 const tag=(e.target&&e.target.tagName||'').toLowerCase();
 const editing=tag==='input'||tag==='textarea'||tag==='select'||(e.target&&e.target.isContentEditable);
 if(!editing&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Spacebar'].includes(e.key))e.preventDefault();
 setKey(e,1);if(e.key==='Escape')togglePause();if(e.repeat)return;
 if(e.code==='KeyQ'||e.key==='q'||e.key==='Q'||e.key==='й'||e.key==='Й')useSpecial();
});
addEventListener('keyup',e=>setKey(e,0));

const jBase=document.getElementById('joystick');
const jStick=document.getElementById('jstick');
let jId=null,jCX=0,jCY=0;
// v6.14: ДИАГНОСТИКА ВВОДА. Я третий раз правлю «джойстик не работает» по догадкам,
// а фактов нет. Считаем события и итоговый вектор — панель хронометра покажет,
// доходят ли касания до обработчика, меняется ли touchMove и попадает ли он в
// движение. Стоит три инкремента на событие.
const JDBG={down:0,move:0,up:0,lastId:'—',mx:0,my:0,spd:0};
function updateJoyPos(){const r=jBase.getBoundingClientRect();jCX=r.left+r.width/2;jCY=r.top+r.height/2;}
jBase.addEventListener('touchstart',(e)=>{e.preventDefault();const t=e.changedTouches[0];jId=t.identifier;updateJoyPos();touchMove.active=true;JDBG.down++;JDBG.lastId=String(t.identifier);},{passive:false});
addEventListener('touchmove',(e)=>{if(jId===null)return;for(let i=0;i<e.touches.length;i++){const t=e.touches[i];if(t.identifier===jId){e.preventDefault();const dx=t.clientX-jCX,dy=t.clientY-jCY;const d=Math.hypot(dx,dy),max=45;const ang=Math.atan2(dy,dx),len=Math.min(d,max);touchMove.x=Math.cos(ang)*len/max;touchMove.y=Math.sin(ang)*len/max;JDBG.move++;jStick.style.transform=`translate(calc(-50% + ${Math.cos(ang)*len}px), calc(-50% + ${Math.sin(ang)*len}px))`;}}},{passive:false});
addEventListener('touchend',(e)=>{for(let i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===jId){jId=null;touchMove.x=touchMove.y=0;jStick.style.transform='translate(-50%,-50%)';touchMove.active=false;}});
// touchcancel — сброс джойстика если палец "улетел" (шторка уведомлений, системный жест)
addEventListener('touchcancel',(e)=>{for(let i=0;i<e.changedTouches.length;i++)if(e.changedTouches[i].identifier===jId){jId=null;touchMove.x=touchMove.y=0;jStick.style.transform='translate(-50%,-50%)';touchMove.active=false;}});
document.getElementById('tbtnPause').addEventListener('click',togglePause);
document.getElementById('tbtnSpecial').addEventListener('click',useSpecial);
const isMobile=/Android|iPhone|iPad|iPod|Mobile|Touch/i.test(navigator.userAgent)||('ontouchstart' in window)||(innerWidth<900);
if(isMobile){
 document.getElementById('joystick').classList.add('show');
 document.getElementById('touchBtns').classList.add('show');
 // v6.25: маркер для CSS — по нему полоса здоровья, миникарта и лента
 // поднимаются над зоной джойстика и кнопок (см. body.touch-ui в стилях).
 document.body.classList.add('touch-ui');
}else{
 document.getElementById('hint').style.display='block';
}

