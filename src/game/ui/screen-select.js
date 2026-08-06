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
let boonShown=false;
function maybeShowBoonSelect(){
 if(boonShown||currentBoon)return;
 boonShown=true;
 paused=true;
 sfxFlip();
 const row=document.getElementById('boonrow');row.innerHTML='';
 BOONS.forEach(b=>{
  const d=document.createElement('div');
  d.className='booncard';
  d.style.setProperty('--class-color',BOON_COLORS[b.id]||'#c9a04a');
  d.innerHTML=`${boonArt(b.id)}<h3 style="text-align:center">${b.name}</h3><p>${b.desc}</p><span class="fxRunes"></span><span class="fxEdge"></span><span class="fxDust"></span>`;
  d.onclick=()=>{
   currentBoon=b.id;
   document.getElementById('boondisp').innerHTML=`<span class="boon-badge">${boonMini(b.id)}${b.name}</span>`;
   document.getElementById('boonov').style.display='none';
   b.apply();
   // проклятие (40%, кроме друида)
   if(seedRandom()<0.4&&currentClass!=='druid'){
    const c=CURSES[Math.floor(seedRandom()*CURSES.length)];
    currentCurse=c.id;
    // v5.84: минус 60 с от 1680 — это 3.5%, проклятие перестало ощущаться
    // (при старом трёхминутном забеге те же 60 с были −33%). Делаем долей.
    bossT=c.id==='time'?Math.max(60,Math.round(BOSS_TIME*0.85)):BOSS_TIME;
    miniIdx=0;
    if(c.id==='glass'){P.dmgMul*=2;P.maxhp*=0.4;P.hp=Math.min(P.maxhp,P.hp);}
    const cIcon=document.createElement('div');
    cIcon.className='curse-icon';cIcon.id='curseBadge';
    // v5.93: у проклятия «Время» ДВА описания в разных местах — в CURSES и здесь,
    // на экранной плашке. В v5.84 эффект стал долей от длины забега, в CURSES
    // текст поправлен в v5.86, а плашка так и осталась «Босс -1мин».
    // Считаем от той же формулы, что применена выше, чтобы больше не разъезжалось.
    const timeCut=BOSS_TIME-Math.max(60,Math.round(BOSS_TIME*0.85));
    const desc=c.id==='blind'?'Без карты':c.id==='famine'?'Золото ×0.5':c.id==='glass'?'Урон×2 HP×0.4':('Босс на '+fmt(timeCut)+' раньше');
    cIcon.innerHTML=`${curseMini(c.id)}${c.name}<span class="desc">${desc}</span>`;
    document.body.appendChild(cIcon);
   }
   paused=false;
   resumeAudio();
   log(`${b.icon} ${b.name} благословляет тебя!`, 'gold');
  };
  row.appendChild(d);
 });
 document.getElementById('boonov').style.display='flex';
}


// ============================================================
//  ТИТУЛЬНЫЙ ЭКРАН ВЫБОРА ГЕРОЯ (v5.34, аудит C1)
//  Показывается при первой загрузке. Бой НЕ идёт, пока не нажата «В бой».
//  Игрок выбирает класс здесь, а не в попапе поверх уже идущего боя.
// ============================================================
