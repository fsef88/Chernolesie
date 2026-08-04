// ============================================================
//  АУДИО: процедурная музыка + SFX
// ============================================================
let AC=null,master=null,musicGain=null,lastHit=0,lastPick=0,lastHurt=0,audioOk=true;
let musicOn=false,drumsTimer=0,bassNote=0,leadNote=0;
const BASS_NOTES=[55,55,73,82,65,55,49,65]; // A1 A1 D2 E2 C2 A1 G1 C2
const LEAD_NOTES=[220,247,277,330,294,247,220,196,220,247,277,330,392,330,277,247];
function initAudio(){if(AC||!audioOk)return;try{AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=LS.num('cl_vol',35)/100;master.connect(AC.destination);musicGain=AC.createGain();musicGain.gain.value=LS.num('cl_mus',25)/100*0.4;musicGain.connect(master);
 // v5.73: шина эффектов принадлежит КОНТЕКСТУ. Если AC пересоздан, старые узлы
 // мертвы — сбрасываем, иначе весь бой уйдёт в никуда и звук пропадёт молча.
 _bus=null;_busLow=null;audioBus();
 }catch(e){audioOk=false;AC=null;_bus=null;_busLow=null;}}
function resumeAudio(){initAudio();if(AC&&AC.state==='suspended')AC.resume();if(!musicOn&&AC){musicOn=true;tickMusic();}startAmbient();}
addEventListener('keydown',resumeAudio);addEventListener('pointerdown',resumeAudio);addEventListener('touchstart',resumeAudio);

function tone(freq,dur,type,vol,slideTo,target){if(!AC)return;try{const o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(freq,AC.currentTime);if(slideTo)o.frequency.exponentialRampToValueAtTime(Math.max(20,slideTo),AC.currentTime+dur);g.gain.setValueAtTime(vol||0.2,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.0008,AC.currentTime+dur);if(target)target.connect(g);else g.connect(master);o.connect(g);o.start();o.stop(AC.currentTime+dur+0.02);}catch(e){swallow('audio.tone',e);}}
// (#16) белый шум генерировался НА КАЖДЫЙ вызов (Float32Array в
// 44K сэмплов при каждом ударе/подборе/смерти). Один общий 1-сек буфер
// переиспользуется всеми источниками — n.stop(dur) отрезает нужный хвост.
let _noiseBuf=null;
function noise(dur,vol,ff,target){if(!AC)return;try{if(!_noiseBuf){const b=AC.createBuffer(1,AC.sampleRate,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;_noiseBuf=b;}const n=AC.createBufferSource();n.buffer=_noiseBuf;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=ff||1200;const g=AC.createGain();g.gain.setValueAtTime(vol||0.2,AC.currentTime);g.gain.exponentialRampToValueAtTime(0.0008,AC.currentTime+dur);if(target)target.connect(g);else g.connect(master);n.connect(f);f.connect(g);n.start();n.stop(AC.currentTime+dur+0.02);}catch(e){swallow('audio.noise',e);}}
// v5.18: «переворот пергамента» — шорох бумаги + лёгкий поступью тон
function sfxFlip(){if(!AC)return;try{noise(0.13,0.09,1200);tone(560,0.05,'triangle',0.040,760);setTimeout(()=>{try{tone(340,0.05,'triangle',0.028,520)}catch(e){swallow('sfx.flip',e);}},55);}catch(e){swallow('sfx.flip.echo',e);}}
function sfxCrit(){if(typeof vibe==='function')vibe(12);const k=det(0.5);
 nlayer(0.05,0.18,2800*k,1.4,0.001);
 layer('triangle',740*k,1480*k,0.10,0.10,0.003);
 layer('sine',130*k,70,0.14,0.26,0.002,_busLow||audioBus());}
// ============================================================
//  v5.73  ЗВУКОВОЙ ДВИЖОК
// ============================================================
//  Почему старые звуки «пищали»: одиночный осциллятор + экспоненциальный
//  спад от полной громкости. Ухо читает это как игрушку.
//  Что делает звук «дорогим» — три вещи, и ни одна не про источник:
//
//  1) ОГИБАЮЩАЯ. Настоящий удар: атака 2-3мс, короткий спад, тишина.
//     Без мгновенной атаки нет ощущения контакта.
//  2) СЛОИ. Удар = щелчок в верхах (контакт) + тело в середине +
//     низ 60-90Гц, который слышно телом. Один слой всегда игрушечный.
//  3) РАЗБРОС. Один и тот же звук 100 раз подряд = дятел. Случайный
//     сдвиг высоты в пределах пары процентов снимает эффект повтора.
//
//  Плюс общий компрессор: без него 30 одновременных попаданий дают клиппинг
//  и кашу, а с ним звук «склеивается» и держит громкость.
// ------------------------------------------------------------
let _bus=null,_busLow=null;
function audioBus(){
 if(_bus||!AC)return _bus;
 try{
  const comp=AC.createDynamicsCompressor();
  // v5.73 порог и степень выставлены ПО ЗАМЕРУ, а не на слух.
  // Синтез плотной рубки (3с, 14 убийств) даёт пик 0.72 при RMS 0.06 —
  // то есть клиппинга нет и близко, зато прежние -18дБ/8:1 срезали пик до 0.20,
  // и весь бой звучал вдвое тише и площе, чем задумано. Ставим мягче:
  // компрессор ловит только настоящие всплески, а не обычные удары.
  comp.threshold.value=-6;comp.knee.value=14;comp.ratio.value=3;
  comp.attack.value=0.004;comp.release.value=0.18;
  comp.connect(master);
  _bus=comp;
  // отдельная шина низа: срезаем всё выше 220Гц, чтобы «бум» не мутил середину
  const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=220;lp.Q.value=0.7;
  lp.connect(comp);_busLow=lp;
 }catch(e){swallow('audio.bus',e);_bus=master;_busLow=master;}
 return _bus;
}
// Один слой с честной огибающей. dur — полная длина, atk — время атаки.
function layer(type,f0,f1,dur,vol,atk,dest){
 if(!AC)return;
 try{
  const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type;
  o.frequency.setValueAtTime(f0,t);
  if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,vol),t+(atk||0.003));
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g);g.connect(dest||audioBus()||master);
  o.start(t);o.stop(t+dur+0.02);
 }catch(e){swallow('audio.layer',e);}
}
// Слой шума с полосовым фильтром и той же огибающей.
function nlayer(dur,vol,ff,q,atk,dest){
 if(!AC)return;
 try{
  if(!_noiseBuf){const b=AC.createBuffer(1,AC.sampleRate,AC.sampleRate),d=b.getChannelData(0);
   for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;_noiseBuf=b;}
  const t=AC.currentTime,n=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  n.buffer=_noiseBuf;n.playbackRate.value=0.8+Math.random()*0.4;   // разброс тембра
  f.type='bandpass';f.frequency.value=ff;f.Q.value=q||1.2;
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002,vol),t+(atk||0.002));
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  n.connect(f);f.connect(g);g.connect(dest||audioBus()||master);
  n.start(t);n.stop(t+dur+0.02);
 }catch(e){swallow('audio.nlayer',e);}
}
// Случайный множитель высоты: ±d полутона. Снимает эффект «дятла».
function det(d){return Math.pow(2,(Math.random()*2-1)*(d||0.35)/12);}

function sfxSwing(){nlayer(0.05,0.05,1100,0.9,0.002);}
// v5.73 ЗВУК СМЕРТИ, РАСТУЩИЙ ПО СЕРИИ.
// В жанре главный крючок «приятно убивать» — не одиночное убийство, а РИТМ:
// каждое следующее в серии звучит выше предыдущего. Мозг слышит восходящую
// гамму и читает её как «получается», хотя механически ничего не изменилось.
// Так сделано в Vampire Survivors (сбор), в Hades (комбо), в Dead Cells (серия).
function sfxKillTone(combo){
 // ЛАД. Минорная пентатоника от соль: она консонантна в любой последовательности,
 // поэтому случайный ритм убийств всё равно звучит как музыка, а не как набор
 // сигналов. Мажор здесь был бы бодрее, но чужероден тёмному лесу.
 const SC=[0,3,5,7,10,12,15,17,19,22,24];
 const i=Math.max(0,combo-1);
 const st=SC[Math.min(SC.length-1,i)];       // выше 11-го держим потолок
 const f=196*Math.pow(2,st/12);              // соль большой октавы
 const k=det(0.12);                          // микро-расстройка: живой звук
 // колокольный тембр: чистый тон + тихая квинта сверху
 layer('triangle',f*k,f*k,0.16,0.085,0.004);
 layer('sine',f*k*3,f*k*3,0.10,0.022,0.004);
 // ПОТОЛОК СЕРИИ. Дальше 11-го нота не растёт — иначе к 30 убийствам
 // получится писк. Вместо высоты растёт «блеск»: добавляется верхняя октава.
 if(combo>=8)layer('sine',f*k*4,f*k*4,0.07,0.018,0.003);
 // Раз в 5 убийств — тихий низкий пульс. Он не осознаётся отдельно, но
 // задаёт бою метр: серия начинает ощущаться как ритмическая фигура,
 // а не как поток одиночных событий. Это и есть «затягивает».
 if(combo%5===0)layer('sine',98,74,0.20,0.16,0.004,_busLow||audioBus());
}
// v5.73 ЗВУК ПОПАДАНИЯ. Раньше удар по врагу был беззвучным: звучал только замах.
// Слух — самый быстрый канал обратной связи, и в рогаликах именно он несёт «попал».
// Строение звука взято из того, как это делают в жанре: короткий низкочастотный
// «мясной» щелчок (тело) + сухой верхний трек (контакт). Крит — то же, но ниже,
// громче и с добавленным тоном, чтобы отличался на слух, а не только цифрой.
let _sfxHitMs=0;
function sfxHit(crit){
 const ms=Date.now();
 // при 30 врагах залп попаданий сливается в кашу — ограничиваем частоту
 if(ms-_sfxHitMs<22)return; _sfxHitMs=ms; // v7.1 чаще звуки удара
 const k=det(0.6);
 if(crit){
  nlayer(0.030,0.16,3200*k,1.6,0.001);          // контакт, верх
  nlayer(0.075,0.20,430*k,1.1,0.002);           // тело
  layer('sine',110*k,58,0.13,0.30,0.002,_busLow||audioBus()); // низ — слышно телом
  layer('triangle',520*k,300,0.07,0.07,0.003);  // призвук металла
 }else{
  vibe(8);   // v7.0: лёгкая вибрация при обычном попадании
  nlayer(0.022,0.10,2600*k,1.5,0.001);
  nlayer(0.055,0.13,520*k,1.0,0.002);
  layer('sine',95*k,62,0.09,0.17,0.002,_busLow||audioBus());
 }
}
let _sfxDeathMs=0;function sfxDeath(){const ms=Date.now();if(ms-_sfxDeathMs<55)return;_sfxDeathMs=ms;
 // Смерть = глухой мясной удар. Раньше это был падающий пилообразный тон —
 // он читался как «выключили прибор», а не как «тело упало».
 const k=det(1.0);
 nlayer(0.09,0.15,240*k,0.8,0.002);                       // мясо
 layer('sine',120*k,44,0.16,0.26,0.002,_busLow||audioBus()); // низ, падение
 nlayer(0.16,0.05,90,0.5,0.01);}                          // послезвучие
let _pickCombo=0,_lastPickTime=0; // v7.1 VS CHIME COMBO
function sfxPick(pitchMult,volMult){const t=performance.now();if(t-lastPick<20)return;lastPick=t;
 if(t-_lastPickTime<280)_pickCombo=Math.min(12,_pickCombo+1);else _pickCombo=0;
 _lastPickTime=t;
 vibe(4);
 const pm=(pitchMult||1)*Math.pow(1.045,_pickCombo), vm=(volMult!=null?volMult:1)*Math.min(1.5,1+0.04*_pickCombo);
 const k=det(1.15);
 layer('sine',1250*k*pm,1850*k*pm,0.055*vm,0.05*vm,0.002);
 layer('triangle',2400*k*pm,2600*k*pm,0.04*vm,0.02*vm,0.002);}
function sfxLevel(){if(typeof P!=='undefined'){P.levelFx=0.3;P.levelFxCls=currentClass;for(let i=0;i<8;i++){const a=Math.random()*TAU,sp=rnd(60,180);spawnParticle(P.x,P.y-10,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.25,.5),CLASS_VISUALS[currentClass]?CLASS_VISUALS[currentClass].color:'#ffcf6a',-40,0);}}
 // Восходящая фигура в том же ладу, что и серия убийств (минорная пентатоника
 // от соль). Раньше здесь был до-мажор — он не родня остальному звуку, и
 // левелап выпадал из палитры. Теперь он звучит как продолжение боя.
 const F=[392,466,523,587,784];
 F.forEach((f,i)=>setTimeout(()=>{layer('triangle',f,f,0.26,0.10,0.006);
  layer('sine',f*2,f*2,0.18,0.030,0.006);},i*55));
 layer('sine',98,78,0.5,0.13,0.01,_busLow||audioBus());}
// (#19) звук+вспышка могли «выстрелить» уже ПОСЛЕ endRun того же
// кадра (хазард-цикл продолжает тикать после смерти игрока). Глушим.
function sfxHurt(){if(over||runEnded)return;if(typeof P!=='undefined'){P.hurtT=0.24;P.invuln=Math.max(P.invuln||0,0.6);}const t=performance.now();if(t-lastHurt<400)return;lastHurt=t;tone(140,0.2,'sawtooth',0.18,40);noise(0.12,0.15,300);flashScreen('#c14a3a',0.3);}
function sfxBoss(){if(!AC)return;tone(80,0.8,'sawtooth',0.3,30);setTimeout(()=>noise(0.6,0.35,300),250);}
// v6.22: один жирный удар вместо двадцати тонких. Тон растёт с числом убитых,
// поэтому ухо само отличает косьбу восьмерых от косьбы тридцати.
function sfxMultiKill(n){
 if(!AC)return;
 const k=Math.min(1.5,Math.max(0,(n-2)/14)); // v7.1 сочная косьба пачек
 tone(90+k*70,0.20,'sawtooth',0.16+k*0.10,40);
 noise(0.16+k*0.10,0.14+k*0.08,900+k*900);
 setTimeout(()=>tone(320+k*420,0.16,'triangle',0.10+k*0.08),70);
}
function sfxEvo(){if(!AC)return;
 // Самое редкое событие в забеге — ему можно быть громким и долгим.
 // Низкий удар + разложенный аккорд вверх: ухо читает это как «открылось».
 layer('sine',65,49,0.9,0.30,0.006,_busLow||audioBus());
 nlayer(0.5,0.10,1400,0.6,0.02);
 [392,587,784,1175].forEach((f,i)=>setTimeout(()=>{
  layer('triangle',f,f,0.55,0.13,0.008);
  layer('sine',f*2,f*2,0.4,0.045,0.008);},i*90));}
function sfxAch(){if(!AC)return;tone(880,0.12,'triangle',0.22);setTimeout(()=>tone(1320,0.18,'triangle',0.22),120);setTimeout(()=>tone(1760,0.25,'triangle',0.2),240);}
function sfxAnomaly(){tone(440,0.2,'sine',0.15,880);tone(660,0.3,'sine',0.12,1320);}
function sfxUpgrade(){tone(523,0.1,'square',0.15,1047);setTimeout(()=>tone(1047,0.15,'square',0.18,1568),80);}

// ============================================================
//  v7.0 НОВЫЕ ЗВУКИ
// ============================================================

