function showTitleScreen(){
 try{
  const ts=document.getElementById('titlescreen');
  const row=document.getElementById('tsRow');
  if(!ts||!row)return;
  row.innerHTML='';
  CLASSES.forEach(c=>{
   const d=document.createElement('div');
   // v6.26: закрытый класс показываем, но приглушённым и с условием —
   // спрятать его совсем значило бы лишить игрока цели.
   const open_=classUnlocked(c.id);
   d.className='classcard'+(currentClass===c.id&&open_?' sel':'')+(open_?'':' locked');
   const cv=CLASS_VISUALS[c.id]||CLASS_VISUALS.warrior;
   d.style.setProperty('--class-color',cv.color);
   const portrait=CLASS_ART[c.id]&&CLASS_ART[c.id].src?`<img class="classportrait" src="${CLASS_ART[c.id].src}" alt="">`:'';
   if(open_){
    d.innerHTML=`${portrait}<h3>${c.name}</h3><p class="arch">${c.arch}</p><p>${c.desc}</p><span class="fxRunes"></span><span class="fxEdge"></span><span class="fxDust"></span>`;
    d.onclick=()=>{currentClass=c.id;document.querySelectorAll('#tsRow .classcard').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');sfxFlip();};
   }else{
    const _f=Math.round(classLockFrac(c.id)*100);
    const _u=CLASS_UNLOCKS[c.id];
    d.innerHTML=`${portrait}<h3>${c.name}</h3><p class="arch">${c.arch}</p>`+
      `<p class="lockreq">${_u?_u.hint:''}</p>`+
      `<div class="lockbar"><i style="width:${_f}%"></i></div>`+
      `<p class="lockprog">${classLockHint(c.id)}</p>`+
      `<span class="lockseal">\u2716</span><span class="fxEdge"></span>`;
    d.title='Закрыто: '+classLockHint(c.id);
    d.onclick=()=>{
     // Лёгкая обратная связь вместо молчания: игрок должен понять,
     // что карточка не сломана, а именно закрыта.
     d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake');
     try{log('\u2716 '+c.name+' \u2014 '+classLockHint(c.id),'warn');}catch(e){}
    };
   }
   row.appendChild(d);
  });
  // Строка-приманка: сколько ещё осталось открыть.
  {const sub=document.getElementById('tsSub');
   if(sub){const n=lockedClassCount();
    sub.textContent=n?('Защитник Заставы \u2014 открыто '+(CLASSES.length-n)+' из '+CLASSES.length+' путей')
                     :'Защитник Заставы \u2014 выбери свой путь';}}
  // v6.25: переключатель длительности. Рисуем здесь же, чтобы состояние
  // подхватывалось при каждом показе титульника (в т.ч. после забега).
  const mrow=document.getElementById('tsMode');
  if(mrow){
   mrow.innerHTML='';
   Object.values(RUN_MODES).forEach(M=>{
    const d=document.createElement('div');
    d.className='modebtn'+(runMode===M.id?' sel':'');
    d.innerHTML='<span class="mico">'+(M.icon||'')+'</span>'+M.name+'<small>'+M.sub+'</small>';
    d.onclick=()=>{
     runMode=M.id;
     mrow.querySelectorAll('.modebtn').forEach(x=>x.classList.remove('sel'));
     d.classList.add('sel');
     try{sfxFlip();}catch(e){}
    };
    mrow.appendChild(d);
   });
  }
  // v6.26: строка Порчи. До первой победы её нет вовсе — новичку она
  // ничего не говорит и только загромождает экран.
  {const crow=document.getElementById('tsCorr');
   if(crow){
    if(corruptionUnlocked<=0){crow.style.display='none';crow.innerHTML='';}
    else{
     crow.style.display='flex';
     crow.innerHTML='<span class="clbl">Порча Чащи</span>';
     for(let n=0;n<=CORRUPTION_MAX;n++){
      const av=n<=corruptionUnlocked;
      const d=document.createElement('div');
      d.className='corrbtn'+(corruption===n?' sel':'')+(av?'':' off');
      d.textContent=n;
      const bt=corrBest(n);
      d.title=av?('Порча '+n+': враги +'+Math.round(CORRUPTION_STEP*n*100)+'% HP'
                  +(bt?' \u00b7 рекорд '+fmt(bt):' \u00b7 не пройдена'))
                : 'Победи на Порче '+(n-1)+', чтобы открыть';
      if(av)d.onclick=()=>{
       corruption=n;try{LS.set('cl_corr',String(n));}catch(e){}
       crow.querySelectorAll('.corrbtn').forEach(x=>x.classList.remove('sel'));
       d.classList.add('sel');try{sfxFlip();}catch(e){}
       const h=document.getElementById('corrHint');
       if(h)h.textContent=n?('враги +'+Math.round(CORRUPTION_STEP*n*100)+'% здоровья'):'обычная сложность';
      };
      crow.appendChild(d);
     }
     const hint=document.createElement('span');
     hint.className='chint';hint.id='corrHint';
     hint.textContent=corruption?('враги +'+Math.round(CORRUPTION_STEP*corruption*100)+'% здоровья'):'обычная сложность';
     crow.appendChild(hint);
    }
   }}
  const btn=document.getElementById('btnStartPoohd');
  // v5.93: ts и row проверены выше, а btn — нет. Титульник показывается строкой
  // ниже, поэтому при отсутствии кнопки игрок увидел бы экран без работающего
  // «В бой» и застрял бы: исключение поглощает catch в конце функции.
  if(!btn){console.error('showTitleScreen: нет кнопки btnStartPoohd');return;}
  ts.style.display='flex';
  // Запуск забега: применяем класс, прячем титульник, показываем интро.
  // v6.52 iOS: одного onclick оказалось мало — на iPhone Safari tap по sticky
  // footer с blur может не породить click. Запускаем и с touchend/pointerup,
  // но с замком, чтобы один tap не стартовал два забега подряд.
  let _titleStartLock=false;
  const startTitleRun=(ev)=>{
   if(ev&&ev.cancelable)ev.preventDefault();
   if(_titleStartLock||started)return;
   _titleStartLock=true;
   try{
    if(Array.isArray(stats)&&stats.length>0){try{maybeInterstitial();}catch(e){}}   // Яндекс: между забегами (после хотя бы одного забега)
    // v6.26: страховка — если в currentClass остался закрытый класс
    // (например, из сохранения прошлой версии), откатываемся на воина.
    if(!currentClass||!classUnlocked(currentClass))currentClass='warrior';
    applyRunMode(runMode);   // v6.25: тайминги забега до resetRun()
    ts.style.display='none';
    started=true;
    // Класс применится внутри resetRun() к свежему P (защита от двойного применения там же).
    resetRun(false);
    if(typeof showRunIntro==='function')showRunIntro();
    log(`${currentClass.toUpperCase()} — твой путь начат!`,'gold');
   }catch(err){
    _titleStartLock=false;
    started=false;
    ts.style.display='flex';
    console.error('title start:',err);
   }
  };
  btn.onclick=startTitleRun;
  btn.addEventListener('touchend',startTitleRun,{passive:false});
  btn.addEventListener('pointerup',(ev)=>{if(!ev.pointerType||ev.pointerType==='touch')startTitleRun(ev);},{passive:false});
 }catch(e){console.error('showTitleScreen:',e);}
}
// ============================================================
