// AMBIENT — тихий фоновый слой леса
// v7.8: вместо массива всех когда-либо взведённых таймеров — по одному id на цепочку.
// Массив чистился только в stopAmbient и за забег набирал ~1200 мёртвых записей.
let _ambientRunning=false, _ambientGain=null, _ambientWind=null, _crackleT=null, _birdT=null;
function startAmbient(){
 if(!AC||_ambientRunning)return;
 _ambientRunning=true;
 _ambientGain=AC.createGain();
 _ambientGain.gain.value=0.025;
 _ambientGain.connect(master);
 if(!_noiseBuf){const b=AC.createBuffer(1,AC.sampleRate,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;_noiseBuf=b;}
 const wind=AC.createBufferSource();wind.buffer=_noiseBuf;wind.loop=true;
 const windF=AC.createBiquadFilter();windF.type='lowpass';windF.frequency.value=400;windF.Q.value=0.3;
 const windG=AC.createGain();windG.gain.value=0.6;
 wind.connect(windF);windF.connect(windG);windG.connect(_ambientGain);
 wind.start();
 _ambientWind=wind;   // v7.8: без ссылки источник было нечем остановить — см. stopAmbient
 // v7.8: раньше выход по paused/over стоял ДО перепланирования, и цепочка обрывалась
 // навсегда: _ambientRunning оставался true, поэтому startAmbient() её не воскрешал.
 // Окно выбора карт ставит paused=true, значит первый же левелап глушил треск и птиц
 // до конца сессии. Теперь на паузе пропускается только звук, сама цепочка живёт.
 function crackle(){
  if(!_ambientRunning||!AC)return;
  if(!paused&&!over)try{
   const t=AC.currentTime,n=AC.createBufferSource();n.buffer=_noiseBuf;
   const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=2000+Math.random()*3000;f.Q.value=8;
   const g=AC.createGain();g.gain.setValueAtTime(0.0001,t);
   g.gain.exponentialRampToValueAtTime(0.3+Math.random()*0.2,t+0.002);
   g.gain.exponentialRampToValueAtTime(0.0001,t+0.02+Math.random()*0.02);
   n.connect(f);f.connect(g);g.connect(_ambientGain);n.start(t);n.stop(t+0.05);
  }catch(e){}
  _crackleT=setTimeout(crackle,800+Math.random()*2500);
 }
 crackle();
 function bird(){
  if(!_ambientRunning||!AC)return;
  if(!paused&&!over)try{
   const t=AC.currentTime,f=1800+Math.random()*2400;
   const o=AC.createOscillator(),g=AC.createGain();
   o.type='sine';o.frequency.setValueAtTime(f,t);
   o.frequency.exponentialRampToValueAtTime(f*1.3,t+0.06);
   o.frequency.exponentialRampToValueAtTime(f*0.9,t+0.12);
   g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.08,t+0.01);
   g.gain.exponentialRampToValueAtTime(0.0001,t+0.15);
   o.connect(g);g.connect(_ambientGain);o.start(t);o.stop(t+0.2);
   if(Math.random()<0.4){
    const o2=AC.createOscillator(),g2=AC.createGain();
    o2.type='sine';o2.frequency.value=f*1.15;
    g2.gain.setValueAtTime(0.0001,t+0.08);g2.gain.exponentialRampToValueAtTime(0.05,t+0.09);
    g2.gain.exponentialRampToValueAtTime(0.0001,t+0.2);
    o2.connect(g2);g2.connect(_ambientGain);o2.start(t+0.08);o2.stop(t+0.25);
   }
  }catch(e){}
  _birdT=setTimeout(bird,4000+Math.random()*6000);
 }
 _birdT=setTimeout(bird,2000);
}
function stopAmbient(){
 _ambientRunning=false;
 if(_crackleT){clearTimeout(_crackleT);_crackleT=null;}
 if(_birdT){clearTimeout(_birdT);_birdT=null;}
 // v7.8: здесь была ТОЛЬКО громкость в ноль. Сам зацикленный источник ветра
 // продолжал работать в графе, а ссылки на него не оставалось — она была локальной
 // const внутри startAmbient. Каждый новый забег заводил ещё один такой источник,
 // и они копились навсегда: десять забегов — десять живых генераторов шума.
 // Останавливаем после того, как отработает спад громкости, иначе будет щелчок.
 const g=_ambientGain,w=_ambientWind;
 _ambientGain=null;_ambientWind=null;
 if(g&&AC){try{g.gain.linearRampToValueAtTime(0,AC.currentTime+0.5);}catch(e){}}
 if(w&&AC){try{w.stop(AC.currentTime+0.6);}catch(e){}}
 setTimeout(()=>{try{w&&w.disconnect();}catch(e){}try{g&&g.disconnect();}catch(e){}},900);
}

// ЗВУКИ ВСПЛЕСКОВ
function sfxSurgeBlackNoon(){if(!AC)return;layer('sine',55,41,1.2,0.28,0.008,_busLow||audioBus());[660,880,1100,1320].forEach((f,i)=>setTimeout(()=>{layer('sine',f,f,0.35,0.06,0.003);},i*60));nlayer(0.8,0.06,3000,0.4,0.04);}
function sfxSurgeRage(){if(!AC)return;layer('sawtooth',110,82,0.5,0.14,0.004);layer('sine',82,55,0.6,0.22,0.003,_busLow||audioBus());nlayer(0.12,0.18,1800,1.2,0.002);setTimeout(()=>tone(440,0.15,'triangle',0.10,880),100);}
function sfxSurgeVein(){if(!AC)return;[523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>{layer('sine',f,f,0.4,0.08,0.004);layer('triangle',f*2,f*2,0.25,0.03,0.003);},i*70));layer('sine',131,98,0.6,0.12,0.005,_busLow||audioBus());}
function sfxSurgeHarvest(){if(!AC)return;layer('sine',49,33,1.5,0.30,0.006,_busLow||audioBus());nlayer(0.3,0.14,600,0.8,0.003);layer('sawtooth',220,55,0.8,0.08,0.005);setTimeout(()=>{layer('triangle',440,110,0.6,0.06,0.004);nlayer(0.4,0.08,200,0.5,0.01);},200);}
function sfxSurgeAncestors(){if(!AC)return;layer('sine',65,49,1.0,0.25,0.006,_busLow||audioBus());[196,262,330,392,523].forEach((f,i)=>setTimeout(()=>{layer('triangle',f,f,0.6,0.10,0.008);layer('sine',f*1.5,f*1.5,0.4,0.04,0.006);},i*110));}

// ЗВУК МОНЕТЫ
function sfxCoin(){if(!AC)return;const k=det(0.8);layer('sine',1400*k,1800*k,0.06,0.05,0.002);layer('triangle',2800*k,2800*k,0.04,0.02,0.002);nlayer(0.02,0.04,4000,2.0,0.001);}

// ЗВУК СУНДУКА
function sfxChest(){if(!AC)return;nlayer(0.15,0.08,800,0.6,0.003);setTimeout(()=>{layer('triangle',330,440,0.3,0.10,0.005);layer('sine',660,880,0.25,0.06,0.004);layer('sine',990,1320,0.2,0.04,0.004);},120);}

// ЗВУК ЗАМОРОЗКИ
function sfxFreeze(){if(!AC)return;const k=det(0.5);nlayer(0.08,0.10,4500*k,2.5,0.001);layer('sine',2200*k,1100*k,0.12,0.05,0.002);layer('triangle',3300*k,1650*k,0.08,0.03,0.002);}

// АНАЛИЗ СМЕРТИ
function deathAdvice(){
 const survived=time||0;
 const hasWeapon=(id)=>weapons.some(w=>w.id===id);
 const hasPassive=(name)=>(cardLv[name]||0)>0;
 const hasEvo=weapons.some(w=>w.evo);
 const hasFrost=typeof frost!=='undefined'&&frost.on;
 const hasPoison=typeof poison!=='undefined'&&poison.on;
 let tip='',tipType='general';
 if(survived<30){
  if(!hasPassive('Сапоги-скороходы')&&!hasPassive('Медвежья хватка')){tip='Попробуй «Сапоги-скороходы» — скорость решает в первые минуты.';tipType='passive';}
  else{tip='Держись ближе к краю арены — меньше врагов обступает.';tipType='general';}
 }else if(survived<120){
  if(!hasWeapon('kolokol')&&!hasWeapon('serp')&&!hasWeapon('kosa')){tip='Возьми «Колокол Яви» или «Серп-оборотень» — нужно оружие по площади.';tipType='weapon';}
  else if(!hasFrost&&!hasPoison){tip='Ауры (Лёд/Яд) замедляют толпу — без них враги подбегают слишком быстро.';tipType='aura';}
  else if(weapons.length<3){tip='Бери больше оружий: одно оружие = одна цель, а врагов десятки.';tipType='weapon';}
  else{tip='Собирай кристаллы активнее — уровень быстрее = сила быстрее.';tipType='general';}
 }else if(survived<300){
  if(!hasEvo){
   let readyRecipe='';
   for(const w of weapons){const r=EVO_RECIPES[w.id];if(r&&wLvl(w.id)>=evoMinLvl()&&!passiveTaken(r.p)){readyRecipe=(WNAME[w.id]||w.id)+' + '+r.p;break;}}
   if(readyRecipe){tip='Оружие готово к Пробуждению, но не хватает пассивки: '+readyRecipe+'.';tipType='evo';}
   else{tip='К 5 минуте нужно хотя бы одно Пробуждение — следи за рецептами в HUD.';tipType='evo';}
  }else if(!hasPassive('Живая кора')&&!hasPassive('Ладанка')){tip='Нужна защита: «Живая кора» (+HP) или «Ладанка» (лечение).';tipType='passive';}
  else{tip='На поздней стадии следи за серией убийств — всплески дают мощные бонусы.';tipType='general';}
 }else{tip='Отличный забег! Попробуй следующую ступень Порчи для нового вызова.';tipType='meta';}
 return {tip,tipType};
}


// Процедурная музыка — ambient dark fantasy
// ЗАЩИТА ОТ ДВОЙНОГО ТАЙМЕРА: при нескольких resumeAudio() (мобильные шторки,
// пауза/снятие паузы, visibilitychange) без clearTimeout можно было получить
// 2-3 одновременных tickMusic() → ускоренная в 2-3 раза музыка, искажение ритма.
// Теперь ID таймера хранится в musicTimer, и перед установкой нового старый
// отменяется.
let musicTimer=null;
function tickMusic(){
 if(!AC||!musicOn)return;
 if(musicTimer){clearTimeout(musicTimer);musicTimer=null;}
 // v5.85: таймеры уменьшались на 1/60, а сам tickMusic переставляется на 1000/30,
 // то есть вызывается 30 раз в секунду. Игровое время музыки шло вдвое медленнее
 // реального: kick вместо каждых 0.5 с бил раз в секунду, бас вместо 2 с — раз в 4.
 // Вся процедурная музыка звучала на половинном темпе (60 BPM вместо 120).
 drumsTimer-=1/30;
 bassNote-=1/30;
 if(drumsTimer<=0){
  // kick на каждый такт
  tone(60,0.1,'sine',0.15,30,musicGain);
  noise(0.05,0.06,2000,musicGain);
  drumsTimer=0.5;
 }
 if(bassNote<=0){
  const idx=Math.floor(time/2)%BASS_NOTES.length;
  const n=BASS_NOTES[idx];
  tone(n,0.4,'triangle',0.18,n*0.95,musicGain);
  tone(n*0.5,0.4,'sine',0.1,n*0.48,musicGain);
  bassNote=2;
 }
 if(Math.random()<0.1){
  const idx=Math.floor(time*2)%LEAD_NOTES.length;
  const n=LEAD_NOTES[idx];
  tone(n*2,0.3,'triangle',0.04,n*4,musicGain);
 }
 // Сохраняем ID таймера, чтобы tickMusic() мог отменить его при следующем вызове.
 musicTimer=setTimeout(tickMusic,1000/30);
}

let _flashTimeout=null,_weaponsKey='';
// v7.41: вспышка перенесена с DOM-градиента (#hitFlash, растеризация
// полноэкранного radial-gradient в ~3.7M px каждый вызов — вне GPU и вне
// хронометра) на холст. Состояние хранится здесь и рисуется в draw()
// рядом с mkFlash. Тот же градиент на холсте стоит микросекунды.
let _flashColor='#ffffff',_flashA=0,_flashT=0,_flashDur=0.12;
function flashColorToRGBA(c,a){
 c=c.replace('#','');
 if(c.length===3)c=c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
 const r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);
 return 'rgba('+r+','+g+','+b+','+a+')';
}
function flashScreen(color,alpha){
 if(over||runEnded)return;
 _flashColor=color;_flashA=alpha;_flashT=_flashDur;
}

