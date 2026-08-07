function showTitleScreen(){
 try{
  const ts=document.getElementById('titlescreen');
  const row=document.getElementById('tsRow');
  if(!ts||!row)return;
  row.innerHTML='';
  // Данные накладываются на нарисованную UI-пластину главного экрана.
  // У каждого пути свой короткий коммерческий "паспорт", чтобы выбор
  // читался до старта, а не только по портрету.
  const heroCards={
   warrior:['УРОН: ВЫСОКИЙ','ЗАЩИТА: ВЫСОКАЯ','ТЕМП: СРЕДНИЙ'],
   druid:['УРОН: СРЕДНИЙ','ЗАЩИТА: ВЫСОКАЯ','КОНТРОЛЬ: ВЫСОКИЙ'],
   shaman:['УРОН: ВЫСОКИЙ','ЗАЩИТА: СРЕДНЯЯ','ДАЛЬНОСТЬ: ВЫСОКАЯ'],
   rogue:['УРОН: ВЫСОКИЙ','ЗАЩИТА: НИЗКАЯ','ТЕМП: ВЫСОКИЙ'],
   archer:['УРОН: ВЫСОКИЙ','ЗАЩИТА: СРЕДНЯЯ','ДАЛЬНОСТЬ: ВЫСОКАЯ'],
   ognevik:['УРОН: ВЫСОКИЙ','ЗАЩИТА: НИЗКАЯ','ОБЛАСТЬ: ВЫСОКАЯ'],
   groznik:['УРОН: ВЫСОКИЙ','ЗАЩИТА: СРЕДНЯЯ','ГРОЗА: ВЫСОКАЯ']
  };
  const titleScenes={
   warrior:'@@A:ui/title-final-mobile.webp@@',
   druid:'@@A:ui/title-scene-druid.webp@@',
   shaman:'@@A:ui/title-scene-shaman.webp@@',
   archer:'@@A:ui/title-scene-archer.webp@@',
   rogue:'@@A:ui/title-scene-rogue.webp@@',
   ognevik:'@@A:ui/title-scene-ognevik.webp@@',
   groznik:'@@A:ui/title-scene-groznik.webp@@'
  };
  const renderHeroPassport=(c)=>{
   // У каждого доступного пути свой нарисованный главный экран: выбор меняет
   // не только цифры справа, но и героя на самой сцене.
   if(titleScenes[c.id]&&window.matchMedia&&window.matchMedia('(max-width:760px)').matches){
    ts.style.setProperty('background-image','url("'+titleScenes[c.id]+'")','important');
   }
   const featured=document.getElementById('tsFeaturedHero');
   const featuredArt=CLASS_ART[c.id]&&CLASS_ART[c.id].src;
   if(featured)featured.innerHTML=featuredArt?'<img src="'+featuredArt+'" alt="">':'';
   const name=document.getElementById('tsHeroName');
   const arch=document.getElementById('tsHeroArch');
   const desc=document.getElementById('tsHeroDesc');
   const stats=document.getElementById('tsHeroStats');
   if(name)name.textContent=c.name;
   if(arch)arch.textContent=c.arch;
   if(desc)desc.textContent=c.desc;
   if(stats)stats.innerHTML=(heroCards[c.id]||heroCards.warrior).map((s,i)=>'<span><b>'+['⚔','◈','✦'][i]+'</b>'+s+'</span>').join('');
  };
  const selectTitleClass=(c,d)=>{
   if(!classUnlocked(c.id))return;
   currentClass=c.id;
   row.querySelectorAll('.classcard').forEach(x=>x.classList.remove('sel'));
   d.classList.add('sel');
   renderHeroPassport(c);
   // После каждого выбора центрируем текущий класс между соседями.
   if(typeof paintDeck==='function')paintDeck();
   try{sfxFlip();}catch(e){}
  };
  CLASSES.forEach(c=>{
   const d=document.createElement('div');
   d.dataset.titleClass=c.id;
   // v6.26: закрытый класс показываем, но приглушённым и с условием —
   // спрятать его совсем значило бы лишить игрока цели.
   const open_=classUnlocked(c.id);
   d.className='classcard'+(currentClass===c.id&&open_?' sel':'')+(open_?'':' locked');
   const cv=CLASS_VISUALS[c.id]||CLASS_VISUALS.warrior;
   d.style.setProperty('--class-color',cv.color);
   const portrait=CLASS_ART[c.id]&&CLASS_ART[c.id].src?`<img class="classportrait" src="${CLASS_ART[c.id].src}" alt="">`:'';
   if(open_){
    d.innerHTML=`${portrait}<h3>${c.name}</h3><p class="arch">${c.arch}</p><p>${c.desc}</p><span class="fxRunes"></span><span class="fxEdge"></span><span class="fxDust"></span>`;
    d.onclick=()=>selectTitleClass(c,d);
    // На мобильном WebView pointerup надёжнее синтезированного click.
    d.addEventListener('pointerup',ev=>{ev.preventDefault();selectTitleClass(c,d);},{passive:false});
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
  renderHeroPassport(CLASSES.find(c=>c.id===currentClass)||CLASSES[0]);
  // На телефоне герои перелистываются кнопками по три — без нативного
  // горизонтального скролла и без спрятанных свайпом карточек.
  let deckPage=0;
  const deckPages=Math.ceil(CLASSES.length/3);
  const paintDeck=()=>{
   const mobile=window.matchMedia&&window.matchMedia('(max-width:760px)').matches;
   const opened=CLASSES.filter(x=>classUnlocked(x.id));
   let active=opened.findIndex(x=>x.id===currentClass);
   if(active<0)active=0;
   const visible=opened.length>2
    ? [opened[(active+opened.length-1)%opened.length],opened[active],opened[(active+1)%opened.length]]
    : opened;
   Array.from(row.children).forEach(card=>{
    const pos=visible.findIndex(x=>x.id===card.dataset.titleClass);
    card.style.display=(!mobile||pos>=0)?'flex':'none';
    card.style.order=pos>=0?String(pos):'9';
    card.classList.toggle('sel',card.dataset.titleClass===currentClass);
   });
   const dots=document.getElementById('tsDeckPages');
   if(dots)dots.innerHTML='';
  };
  const prev=document.getElementById('tsDeckPrev'),next=document.getElementById('tsDeckNext');
  if(prev)prev.onclick=()=>{deckPage=(deckPage+deckPages-1)%deckPages;paintDeck();try{sfxFlip();}catch(e){}};
  if(next)next.onclick=()=>{deckPage=(deckPage+1)%deckPages;paintDeck();try{sfxFlip();}catch(e){}};
  paintDeck();
  // Свайп по нижней колоде листает доступных защитников. Это отдельный
  // touch-обработчик, поэтому на телефоне не зависит от маленьких стрелок.
  let swipeX=0;
  row.addEventListener('touchstart',ev=>{swipeX=ev.changedTouches[0].clientX;},{passive:true});
  row.addEventListener('touchend',ev=>{
   const dx=ev.changedTouches[0].clientX-swipeX;
   if(Math.abs(dx)<36)return;
   const opened=CLASSES.filter(x=>classUnlocked(x.id));
   if(!opened.length)return;
   let idx=opened.findIndex(x=>x.id===currentClass);
   if(idx<0)idx=0;
   idx=(idx+(dx<0?1:-1)+opened.length)%opened.length;
   const chosen=opened[idx];
   const tile=row.querySelector('[data-title-class="'+chosen.id+'"]');
   if(tile)selectTitleClass(chosen,tile);
  },{passive:true});

  // Независимая нижняя колода. В отличие от нарисованного задника, она
  // действительно листает все семь путей и не зависит от фона сцены.
  const liveDeck=document.getElementById('tsLiveDeck');
  let liveIndex=Math.max(0,CLASSES.findIndex(x=>x.id===currentClass));
  const showDeckClass=(idx)=>{
   liveIndex=(idx+CLASSES.length)%CLASSES.length;
   const c=CLASSES[liveIndex];
   if(classUnlocked(c.id)){
    const tile=row.querySelector('[data-title-class="'+c.id+'"]');
    if(tile)selectTitleClass(c,tile);
   }else{
    // Закрытый путь тоже получает свой арт-превью, но не становится игровым классом.
    if(titleScenes[c.id]&&window.matchMedia&&window.matchMedia('(max-width:760px)').matches){
     ts.style.setProperty('background-image','url("'+titleScenes[c.id]+'")','important');
    }
    const name=document.getElementById('tsHeroName');
    const arch=document.getElementById('tsHeroArch');
    const desc=document.getElementById('tsHeroDesc');
    const stats=document.getElementById('tsHeroStats');
    if(name)name.textContent=c.name;
    if(arch)arch.textContent='ПУТЬ ЕЩЁ ЗАКРЫТ';
    if(desc)desc.textContent=classLockHint(c.id);
    if(stats)stats.innerHTML='<span><b>✦</b>'+classLockHint(c.id)+'</span>';
    try{sfxFlip();}catch(e){}
   }
   renderLiveDeck();
  };
  const renderLiveDeck=()=>{
   if(!liveDeck)return;
   liveDeck.innerHTML='';
   // Метка выбора остаётся на том пути, которым игрок реально пойдёт в бой.
   // Центр колоды — это только просмотр: на закрытом пути он подсвечивает
   // карточку, но выбранным классом её не делает, иначе экран обещал бы
   // героя, которого «В БОЙ» всё равно не запустит.
   const selId=currentClass||(CLASSES[0]&&CLASSES[0].id);
   [-1,0,1].forEach(offset=>{
    const i=(liveIndex+offset+CLASSES.length)%CLASSES.length;
    const c=CLASSES[i],open_=classUnlocked(c.id);
    const b=document.createElement('button');
    b.type='button';b.className='liveHero'+(c.id===selId?' current':'')+(offset===0?' focus':'')+(open_?'':' locked');
    b.dataset.hero=c.id;
    const source=CLASS_ART[c.id]&&CLASS_ART[c.id].src;
    const art=source?`<img src="${source}" alt="">`:'';
    b.innerHTML=art+'<span>'+c.name+'</span>'+(open_?'':'<i>🔒</i>');
    b.onclick=()=>showDeckClass(i);
    liveDeck.appendChild(b);
   });
  };
  if(liveDeck){
   let deckStart=0;
   liveDeck.addEventListener('touchstart',ev=>{deckStart=ev.changedTouches[0].clientX;},{passive:true});
   liveDeck.addEventListener('touchend',ev=>{
    const dx=ev.changedTouches[0].clientX-deckStart;
    if(Math.abs(dx)>=36)showDeckClass(liveIndex+(dx<0?1:-1));
   },{passive:true});
   renderLiveDeck();
  }
  // Строка-приманка: сколько ещё осталось открыть.
  {const sub=document.getElementById('tsSub');
   // На мобильном титульнике оставляем короткую центрированную подпись.
   if(sub)sub.textContent='Защитник Заставы';}
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
  // Вторичные пункты главного меню используют уже существующие игровые окна.
  // Обработчик назначается при каждом показе титульника, поэтому не хранит
  // устаревших ссылок после возврата из забега.
  ts.querySelectorAll('[data-title-action]').forEach(menuBtn=>{
   menuBtn.onclick=()=>{
    const action=menuBtn.dataset.titleAction;
    if(action==='stats'&&typeof openStats==='function')openStats();
    if(action==='achievements'&&typeof openAch==='function')openAch();
    if(action==='journal'&&typeof openJournal==='function')openJournal();
    if(action==='tree'&&typeof openTree==='function')openTree();
    try{sfxFlip();}catch(e){}
   };
  });
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
    if(__BOSS_RUSH&&typeof devBossRush==='function')devBossRush();   // v7.36: ?boss=1 — сразу к Горынычу
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
  // v7.36 ОТЛАДКА: та же кнопка старта, но со взведённым флагом боя. Через
  // адрес ?boss=1 это не работало у владельца: скачанный файл открывается
  // двойным щелчком, и параметра в адресе просто нет.
  const bbtn=document.getElementById('btnBossRush');
  if(bbtn){const go=(ev)=>{__BOSS_RUSH=true;startTitleRun(ev);};
   bbtn.onclick=go;bbtn.addEventListener('touchend',go,{passive:false});}
  btn.addEventListener('touchend',startTitleRun,{passive:false});
  btn.addEventListener('pointerup',(ev)=>{if(!ev.pointerType||ev.pointerType==='touch')startTitleRun(ev);},{passive:false});
 }catch(e){console.error('showTitleScreen:',e);}
}
// ============================================================
