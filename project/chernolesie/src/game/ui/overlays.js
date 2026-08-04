const MODAL_IDS=['cards','boonov','classov','reviveov','achov','statsov','treeov','jourov','chestov','titlescreen'];
function anyModalOpen(){
 for(const id of MODAL_IDS){
  const el=document.getElementById(id);
  if(el&&el.style.display==='flex')return true;
 }
 return false;
}
function closeOverlay(id){
 const el=document.getElementById(id);if(el)el.style.display='none';
 const pv=document.getElementById('pauseov');
 paused=!!(pv&&pv.style.display==='flex');
}
function togglePause(){
 if(over)return;
 // ЗАЩИТА: Escape НЕ ДОЛЖЕН снимать паузу, пока открыт модальный оверлей выбора
 // (карты уровня / божества / класса). Иначе игровой цикл стартует на фоне,
 // пока игрок выбирает — враги продолжают двигаться, бьют игрока, и он умирает
 // "внезапно", не понимая что произошло.
 // v5.93: в списке были только три оверлея выбора. Не хватало reviveov, achov,
 // statsov, treeov и титульника: Escape на экране достижений/рекордов/древа
 // снимал паузу, оверлей оставался на весь экран, и игрок продолжал забег
 // вслепую за картинкой — вернуть паузу можно было только вторым Escape.
 // На экране возрождения было мягче (следующий кадр звал offerRevive заново),
 // но один кадр мира всё равно успевал отработать, пока герой на 0 HP.
 if(paused){
  if(anyModalOpen()){
   return; // блокируем снятие паузы, пока открыт любой модальный оверлей
  }
  paused=false;
  document.getElementById('pauseov').style.display='none';
  // v6.16: после паузы сбрасываем сглаживание скорости — иначе frame jump даёт
  // скачок _smoothSp и дерганье анимации у 8-кадровых врагов вроде лешего.
  for(const e of enemies){if(e._smoothSp!=null)e._smoothSp=0;e._lx=undefined;e._ly=undefined;}
 }else{
  paused=true;
  document.getElementById('pauseov').style.display='flex';
  resumeAudio();
 }
}
document.getElementById('vol').oninput=(e)=>{if(master)master.gain.value=+e.target.value/100;LS.set('cl_vol',e.target.value);};
document.getElementById('mus').oninput=(e)=>{if(musicGain)musicGain.gain.value=+e.target.value/100*0.4;LS.set('cl_mus',e.target.value);};
