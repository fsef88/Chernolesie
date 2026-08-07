let classChosen=false;
function maybeShowClassSelect(){
 if(classChosen)return;
 if(currentClass){classChosen=true;return;}
 classChosen=true;
 paused=true;
 sfxFlip();
 const row=document.getElementById('classrow');row.innerHTML='';
 CLASSES.forEach(c=>{
  const d=document.createElement('div');
  d.className='classcard'+(currentClass===c.id?' sel':'');
  const cv=CLASS_VISUALS[c.id]||CLASS_VISUALS.warrior;
  d.style.setProperty('--class-color',cv.color);
  const portrait=CLASS_ART[c.id]&&CLASS_ART[c.id].src?`<img class="classportrait" src="${CLASS_ART[c.id].src}" alt="">`:'';
  d.innerHTML=`${portrait}<h3>${c.name}</h3><p class="arch">${c.arch}</p><p>${c.desc}</p><span class="fxRunes"></span><span class="fxEdge"></span><span class="fxDust"></span>`;
  // (#5) passive() больше НЕ вызывается на клике по карточке
  // (каждый клик стакал пассивку!). Только выбираем класс — пассивка применится
  // ОДИН раз при нажатии «В бой» через applyClassPassive().
  d.onclick=()=>{currentClass=c.id;document.querySelectorAll('.classcard').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');};
  row.appendChild(d);
 });
 const ov=document.getElementById('classov');
 ov.style.display='flex';
 ov.style.zIndex='999';
 // кнопка "В бой"
 let btn=document.getElementById('btnClassStart');
 if(btn)btn.onclick=()=>{if(!currentClass)currentClass='warrior';applyClassPassive(currentClass);ov.style.display='none';paused=false;if(typeof showRunIntro==='function')showRunIntro();log(`${currentClass.toUpperCase()} — твой путь начат!`,'gold');};
}

// ============================================================
//  ВЫБОР БОЖЕСТВА — показывается в забеге на ~1:30
// ============================================================
// v7.39: выбор божества — полноразмерный режим с пятью большими медальонами
// и навигацией ←/→, 1-5, Enter. Старые .booncard/.boonrow использовались в мини-режиме;
// теперь разметка другая, логика вынесена в эту функцию.
let boonShown=false;
let _boonIdx=0;
function maybeShowBoonSelect(){
 if(boonShown||currentBoon)return;
 boonShown=true;
 paused=true;
 sfxFlip();
 const row=document.getElementById('boonrow');row.innerHTML='';
 _boonIdx=0;
 const setActive=i=>{
  _boonIdx=((i%BOONS.length)+BOONS.length)%BOONS.length;
  row.querySelectorAll('.booncard-full').forEach((el,idx)=>el.classList.toggle('active',idx===_boonIdx));
 };
 const pick=i=>{
  const b=BOONS[_boonIdx];
  currentBoon=b.id;
  document.getElementById('boondisp').innerHTML=`<span class="boon-badge">${boonMini(b.id)}${b.name}</span>`;
  document.getElementById('boonov').style.display='none';
  b.apply();
  // проклятие (40%, кроме друида)
  if(seedRandom()<0.4&&currentClass!=='druid'){
   const c=CURSES[Math.floor(seedRandom()*CURSES.length)];
   currentCurse=c.id;
   bossT=c.id==='time'?Math.max(60,Math.round(BOSS_TIME*0.85)):BOSS_TIME;
   miniIdx=0;
   if(c.id==='glass'){P.dmgMul*=2;P.maxhp*=0.4;P.hp=Math.min(P.maxhp,P.hp);}
   const cIcon=document.createElement('div');
   cIcon.className='curse-icon';cIcon.id='curseBadge';
   const timeCut=BOSS_TIME-Math.max(60,Math.round(BOSS_TIME*0.85));
   const desc=c.id==='blind'?'Без карты':c.id==='famine'?'Золото ×0.5':c.id==='glass'?'Урон×2 HP×0.4':('Босс на '+fmt(timeCut)+' раньше');
   cIcon.innerHTML=`${curseMini(c.id)}${c.name}<span class="desc">${desc}</span>`;
   document.body.appendChild(cIcon);
  }
  paused=false;
  resumeAudio();
  log(`${b.icon} ${b.name} благословляет тебя!`, 'gold');
  // Снимем временный слушатель клавиатуры (если он был)
  document.removeEventListener('keydown',_boonKeys);
 };
 const _boonKeys=function(e){
  // не реагируем, если открыт другой оверлей (например, пауза)
  const ov=document.getElementById('boonov');
  if(!ov||ov.style.display==='none')return;
  if(e.key==='ArrowRight'||e.key==='d'||e.key==='в'||e.key==='В'){setActive(_boonIdx+1);e.preventDefault();}
  else if(e.key==='ArrowLeft'||e.key==='a'||e.key==='ф'||e.key==='Ф'){setActive(_boonIdx-1);e.preventDefault();}
  else if(e.key==='Enter'||e.key===' '){pick();e.preventDefault();}
  else if(/^[1-5]$/.test(e.key)){setActive(parseInt(e.key,10)-1);e.preventDefault();}
 };
 BOONS.forEach((b,i)=>{
  const d=document.createElement('div');
  d.className='booncard-full';
  const col=BOON_COLORS[b.id]||'#c9a04a';
  d.style.setProperty('--boon-glow',col);
  d.innerHTML=`<img class="boonmed-full" src="${PAINTED_BOONS[b.id]}" alt="${b.name}"><div class="boon-name-full">${b.name}</div>`;
  d.onclick=()=>{setActive(i);pick();};
  d.onmouseenter=()=>setActive(i);
  row.appendChild(d);
 });
 document.addEventListener('keydown',_boonKeys);
 document.getElementById('boonov').style.display='flex';
 setActive(0);
}


// ============================================================
//  ТИТУЛЬНЫЙ ЭКРАН ВЫБОРА ГЕРОЯ (v5.34, аудит C1)
//  Показывается при первой загрузке. Бой НЕ идёт, пока не нажата «В бой».
//  Игрок выбирает класс здесь, а не в попапе поверх уже идущего боя.
// ============================================================
