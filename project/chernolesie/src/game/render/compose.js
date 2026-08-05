function syncHud(){
 // HUD sync — кэшированные ссылки
 UI.timeEl.textContent=fmt(time);
 // v7.36 ГЛАВНАЯ ПРИЧИНА ПРОСАДКИ НА ТЕЛЕФОНЕ.
 //
 //  Здесь стоял innerHTML БЕЗ КЭША, и внутри — classTiny(), то есть тег <img>
 //  с картинкой класса. В однофайловой сборке src картинки это data-URI длиной
 //  38 755 символов. Каждый кадр собиралась строка почти в 39 КБ, парсилась как
 //  HTML, старый <img> уничтожался, создавался новый, и браузер заново разбирал
 //  data-URI. Тридцать раз в секунду — больше мегабайта строк в секунду.
 //
 //  Почему этого не было видно: присваивание innerHTML в JS мгновенно, а разбор,
 //  раскладка и декодирование происходят позже, в шаге отрисовки браузера.
 //  Хронометр показывал hud 0.55мс и rtotal 4.8мс при кадре в 30мс — вся работа
 //  шла мимо замера. И мимо холста: урезание пикселей вдвое не дало ничего.
 //
 //  Ровно этот же дефект чинили для иконок оружия ниже (#11) — там появился
 //  ключ _weaponsKey. Класс за забег не меняется вовсе, поэтому здесь хватает
 //  сравнения с прошлым значением.
 if(UI.classdisp&&__HUDW.cls!==currentClass){
  __HUDW.cls=currentClass;
  const _cc=CLASSES.find(c=>c.id===currentClass);const _cv=CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior;
  if(_cc){UI.classdisp.innerHTML=`<span style="display:inline-flex;vertical-align:middle;width:18px;height:18px;color:${_cv.color};margin-right:5px">${classTiny(currentClass)}</span>${_cc.name}`;UI.classdisp.style.color=_cv.color;}
  else UI.classdisp.textContent='';
 }
 // серия убийств — читаемый juice без нового DOM
 if(killCombo>=5){ctx.save();
   // v6.18e: счётчик был всегда 14px одного цвета — лучшие моменты забега
   // выглядели ровно так же, как посредственные. Теперь растёт вместе с серией.
   // v6.18h: рост срезан вдвое (потолок 24px вместо 36) и добавлена прозрачность —
   // на замере серия ×374 держалась постоянно, и счётчик навсегда占ил центр экрана.
   ctx.font='bold '+Math.round(14+Math.min(10,killCombo*0.05))+'px Georgia,serif';
   ctx.globalAlpha*=0.72;ctx.textAlign='center';ctx.globalAlpha=Math.min(1,killComboT);ctx.fillStyle='#ffcf6a';ctx.strokeStyle='rgba(0,0,0,.65)';ctx.lineWidth=3;const ct='×'+killCombo+' сеча';ctx.strokeText(ct,W/2,72);ctx.fillText(ct,W/2,72);ctx.restore();}
 // v5.47: телеграф Знамений (канвас, без DOM)
 if(omen.id){const oy=bossSpawned?118:92;ctx.save();
  if(omen.id==='moon'){ctx.globalAlpha=0.09+0.04*Math.sin(time*3);ctx.fillStyle='#b02020';ctx.fillRect(0,0,W,H);ctx.globalAlpha=0.85;ctx.fillStyle='#ff8a70';ctx.font='bold 12px Georgia,serif';ctx.textAlign='center';ctx.fillText('КРАСНЫЙ МЕСЯЦ · '+Math.ceil(omen.t)+'с',W/2,oy);}
  else if(omen.id==='seed'){ctx.globalAlpha=0.20+0.07*Math.sin(time*4);ctx.fillStyle='#6a5218';const bw=64;if(omen.side===0)ctx.fillRect(W-bw,0,bw,H);else if(omen.side===1)ctx.fillRect(0,H-bw,W,bw);else if(omen.side===2)ctx.fillRect(0,0,bw,H);else ctx.fillRect(0,0,W,bw);ctx.globalAlpha=0.85;ctx.fillStyle='#e8cf8a';ctx.font='bold 12px Georgia,serif';ctx.textAlign='center';ctx.fillText('ВОЛНА · '+Math.ceil(omen.t)+'с',W/2,oy);}
  else{ctx.globalAlpha=0.05+0.03*Math.sin(time*5);ctx.fillStyle='#25c9a0';ctx.fillRect(0,0,W,H);ctx.globalAlpha=0.8;ctx.fillStyle='#8affda';ctx.font='bold 12px Georgia,serif';ctx.textAlign='center';ctx.fillText('ЩЕДРАЯ РОЩА · '+Math.ceil(omen.t)+'с',W/2,oy);}
  ctx.restore();}
 UI.lvlEl.textContent=level;
 UI.killsEl.textContent=kills;
 UI.goldEl.textContent=gold;
 const _hpw=Math.round(Math.max(0,P.hp/P.maxhp*100));if(__HUDW.hp!==_hpw){__HUDW.hp=_hpw;UI.hp.style.width=_hpw+'%';}
 if(P.hp/P.maxhp<0.3)UI.hp.classList.add('hp-low');else UI.hp.classList.remove('hp-low');
 if(UI.hpNum)UI.hpNum.textContent=Math.max(0,Math.round(P.hp));
 UI.hpText.textContent=Math.max(0,Math.round(P.hp))+'/'+Math.round(P.maxhp);
 const _xpw=Math.round(xp/xpNext*100);if(__HUDW.xp!==_xpw){__HUDW.xp=_xpw;UI.xpFill.style.width=_xpw+'%';}
 // (#11) иконки оружий пересоздавались КАЖДЫЙ КАДР (innerHTML=''
 // + createElement × N при 60 FPS = 120+ DOM-мутаций/сек). Перестраиваем
 // только когда состав/эволюции/уровни реально изменились.
 let wkey=weapons.length+'|'+swordLvl+'|'+boltLvl+'|'+bowLvl;
  for(let i=0;i<weapons.length;i++) wkey+='|'+weapons[i].id+(weapons[i].evo?'+':'');
 if(wkey!==_weaponsKey){
  _weaponsKey=wkey;
  UI.weaponsEl.innerHTML='';
  for(const w of weapons){
   const el=document.createElement('span');
   el.className='wicon'+(w.evo?' evo':'');
   el.style.color=(w.id==='sword'?'#e2c07a':w.id==='bow'?'#9ac06a':'#8fd0ff');
   el.innerHTML=iconPaint(weaponIconId(w.id))+`<span class="lvl">${w.id==='sword'?swordLvl:w.id==='bow'?bowLvl:boltLvl}</span>`;
   UI.weaponsEl.appendChild(el);
  }
 }
 if(bossSpawned){UI.bosseft.style.display='none';}else{UI.bosseft.style.display='';UI.bosstimer.textContent=fmt(Math.max(0,bossT-time));}
 if(bossE&&!bossE.dead)UI.bosshp.style.width=Math.max(0,bossE.hp/bossE.maxhp*100)+'%';
 // Если главный босс ещё не явился, полосу занимают мини-боссы (приоритет Древню)
 else if(miniBossE&&!miniBossE.dead&&miniBossE.hp>0)UI.bosshp.style.width=Math.max(0,miniBossE.hp/miniBossE.maxhp*100)+'%';
 else if(mini2BossE&&!mini2BossE.dead&&mini2BossE.hp>0)UI.bosshp.style.width=Math.max(0,mini2BossE.hp/mini2BossE.maxhp*100)+'%';
 else if(mini3BossE&&!mini3BossE.dead&&mini3BossE.hp>0)UI.bosshp.style.width=Math.max(0,mini3BossE.hp/mini3BossE.maxhp*100)+'%';
 // v6.46 СУНДУКИ И АЛТАРИ УЛЕТАЛИ ЗА КРАЙ ЭКРАНА.
 // Иконка аномалии — это DOM-элемент поверх канваса, и позиция считалась как
 // (a.x-cam.x), то есть в МИРОВЫХ единицах. Но канвас масштабирован на ZOOM
 // (по умолчанию 0.4, режим «Толпа»), а CSS-пиксели — нет. Иконка уезжала
 // в 2.5 раза дальше от центра, чем её объект в мире.
 // Замер: сундук в 70 единицах слева от героя ставился на (424,1116) при
 // экране 412x915 — то есть ЗА правым нижним углом, тогда как настоящее место
 // (160,437) в середине экрана. Игрок слышал «Найден сундук!», видел отметку
 // на миникарте, приходил на место — и не находил ничего.
 // Множим на ZOOM и прячем всё, что вышло за пределы вида.
 for(const a of anomalies){
  if(a.domEl&&!a.claimed){
   const sx=(a.x-cam.x)*ZOOM, sy=(a.y-cam.y)*ZOOM;
   const off=(sx<-40||sy<-40||sx>W*ZOOM+40||sy>H*ZOOM+40);
   a.domEl.style.display=off?'none':'flex';
   if(!off){
    a.domEl.style.left=(sx-16)+'px';
    a.domEl.style.top=(sy-16)+'px';
   }
  }
 }
 // v5.72: обновляем слот-информацию
 const slotEl=document.getElementById('slotshud');
 if(slotEl&&!paused){
  slotEl.textContent=slotsLine();
 }
 renderSynergyHud();   // v5.72: полоска активных синергий
 if(!paused)renderEvoHud();   // v6.18: телеграф рецептов эволюций
}
// v6.1: сглаживание камеры вынесено из физики в отрисовку.
function camFollow(dt){
 const k=1-Math.exp(-12*Math.max(0.001,dt));
 cam.x+=(camTarget.x-cam.x)*k;
 cam.y+=(camTarget.y-cam.y)*k;
 if(Math.abs(camTarget.x-cam.x)<0.15)cam.x=camTarget.x;
 if(Math.abs(camTarget.y-cam.y)<0.15)cam.y=camTarget.y;
 cam.x=clamp(cam.x,0,camTarget.maxX);
 cam.y=clamp(cam.y,0,camTarget.maxY);
 // v6.5: ВТОРОЙ дефект подачи. Земля рисуется тайлами 768px по координатам
 // sx=_cx*768-cam.x, то есть по ДРОБНЫМ. Сглаживание canvas включено по умолчанию,
 // поэтому каждый кадр вся текстура пересэмплируется с новым сдвигом внутри пикселя.
 // На мелкой высокочастотной текстуре (сосновые иглы) это даёт «кипение» деталей:
 // FPS честные, а картинка выглядит нестабильной. Классическая проблема 2D-скролла.
 // Лечится привязкой камеры к сетке ФИЗИЧЕСКИХ пикселей: земля и спрайты остаются
 // на одной сетке, поэтому взаимного дрожания нет, а шаг привязки — 1/DPR
 // логического пикселя (на этом телефоне полпикселя), что глазу незаметно.
 const _q=DPR||1;
 cam.x=Math.round(cam.x*_q)/_q;
 cam.y=Math.round(cam.y*_q)/_q;
}
function draw(){ // v6.16
 if(__PROF_ON)pT('ground',1);
 // ЗАЩИТА: если canvas не инициализирован (W=0,H=0), не рисовать
 if(W===0||H===0){return;}
 const frameStart=performance.now();
 // v6.1: камера сглаживается здесь, по РЕАЛЬНОМУ времени кадра, а не шагами физики.
 _drawDt=Math.min(0.05,(frameStart-(draw._t||frameStart))/1000)||1/60;   // v6.16: время кадра нужно и анимации врагов
 camFollow(_drawDt);
 draw._t=frameStart;
 // v6.1: игрок рисуется по интерполированной позиции — тем же interpFactor, что и враги.
 // v6.1: null здесь значит «была телепортация, не интерполировать».
 const _pix=P._prevX!=null?P._prevX+(P.x-P._prevX)*interpFactor:P.x;
 const _piy=P._prevY!=null?P._prevY+(P.y-P._prevY)*interpFactor:P.y;
 const px=_pix-cam.x,py=_piy-cam.y;
 drawGround();
 drawCombatGroundVeil(px,py);   // v6.57: приглушаем только фон, не врагов/эффекты
 if(__PROF_ON){pT('ground',0);pT('world',1);}
 // v6.1: тряска бралась из Math.random КАЖДЫЙ кадр — на 60+ Гц это не «удар»,
 // а высокочастотный дребезг всей картинки, который читается как потеря плавности.
 // Делаем колебание по времени: та же амплитуда, но движение непрерывное.
 const _sh=shake, _st=frameStart/1000;
 ctx.save();
 // v6.61: zoom-punch — лёгкое приближение вокруг центра экрана (внутри save/restore тряски)
 if(zoomPunch!==1){ctx.translate(W/2,H/2);ctx.scale(zoomPunch,zoomPunch);ctx.translate(-W/2,-H/2);}
 ctx.translate(Math.sin(_st*47)*_sh*0.8,Math.cos(_st*61)*_sh*0.5);
 // groundBlobs удалены (#15) — фон полностью покрывает тайлинг GT выше.
 ctx.globalAlpha=1;
 drawProps();
 drawAnomalies();   // v6.46: находки рисуются в мире, а не DOM-кружком
  drawPermanentAuras(px,py); // v7.5: ПОСТОЯННЫЕ АУРЫ ОРУЖИЯ НА ЗЕМЛЕ
 drawEnemiesLayer();
 drawGlowLayer();   // v6.50: свет ПОД эффектами — заливает сцену, как в VS
 drawFxLayer();
 drawCoins();   // v6.62: монеты
 drawPlayerLayer(px,py);
 drawDmgNumbers(px,py);
 // v5.97: парный ctx.restore() к save() выше лежал в САМОМ КОНЦЕ drawDmgNumbers,
 // после цикла тумана войны, который к цифрам урона отношения не имеет. Баланс
 // по файлу сходился (45/45), поэтому матрица не накапливалась и игра работала,
 // но ловушка была реальная: любой ранний return в drawDmgNumbers или перестановка
 // вызовов — и трансформация тряски утекает, весь мир уезжает с экрана навсегда.
 // Возвращаем restore туда, где стоит save. Порядок отрисовки не меняется:
 // кромка мира и атмосфера как и раньше рисуются БЕЗ тряски.
 ctx.restore();
 drawWorldEdge();
 // v5.20: атмосфера и свет вынесены в drawAtmosphere (объявлена выше draw)
 if(__PROF_ON){pT('world',0);pT('atmos',1);}
 drawAtmosphere(px,py);
 // v6.22: вспышка косьбы — свет по краям экрана, центр чистый,
 // чтобы не перекрывать героя в момент, когда игрок на него смотрит
 if(mkFlash>0){
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.18,W/2,H/2,Math.max(W,H)*0.72);
  g.addColorStop(0,'rgba(255,190,110,0)');
  g.addColorStop(1,'rgba(255,170,80,'+(mkFlash*0.55).toFixed(3)+')');
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle=g;
  ctx.fillRect(0,0,W,H);
  ctx.restore();
 }
 if(__PROF_ON){pT('atmos',0);pT('hud',1);}
 syncHud();
 // (#8) FPS-отладчик (div#fpsDebug) удалён из продакшна — он был
 // виден игроку и стоил ~0.5мс каждый кадр (performance.now + getElementById).
 // АВТОТЮНЕР ЧАСТИЦ: просадка кадра → снижаем partMul; стабилизировалось →
 // ВОССТАНАВЛИВАЕМ к пользовательской partTarget (#7). Раньше потолок
 // восстановления был жёстко 0.6 — одна просадка на «Высоком» качестве
 // навсегда резала эффекты до 60%.
 const dt=performance.now()-frameStart;
 if(dt>20)partMul=Math.max(0.3,partMul*0.9);
 else if(partMul<partTarget)partMul=Math.min(partTarget,partMul*1.01+0.002);
 if(__PROF_ON)pT('hud',0);
}
function drawMinimap(){
 if(currentCurse==='blind')return;
 const mm=miniCv.parentElement;
 const mw=mm.clientWidth,mh=mm.clientHeight;
 miniCtx.fillStyle='rgba(10,14,8,.75)';
 miniCtx.fillRect(0,0,mw,mh);
 const scale=Math.min(mw/W,mh/H)*0.6;
 const cx=mw/2,cy=mh/2;
 for(const g of ACTIVE.gems){miniCtx.fillStyle=g.col;miniCtx.fillRect(cx+(g.x-P.x)*scale-1,cy+(g.y-P.y)*scale-1,2,2);}
 for(const e of enemies){
  if(Math.abs(e.x-P.x)>1500||Math.abs(e.y-P.y)>1500)continue; // #16: box-cull — дешевле dist2
  miniCtx.fillStyle=e.boss?'#c95a3c':e.mini?(e.type==='naviya'?'#a8ffd0':'#e2a04a'):e.elite?'#b478ff':'#5a4030';
  miniCtx.beginPath();miniCtx.arc(cx+(e.x-P.x)*scale,cy+(e.y-P.y)*scale,e.boss?3:e.mini?2.5:1.5,0,7);miniCtx.fill();
 }
 for(const a of anomalies){miniCtx.fillStyle='#ffcf6a';miniCtx.beginPath();miniCtx.arc(cx+(a.x-P.x)*scale,cy+(a.y-P.y)*scale,2.5,0,7);miniCtx.fill();}
 miniCtx.fillStyle='#ffcf6a';
 miniCtx.beginPath();miniCtx.arc(cx,cy,3,0,7);miniCtx.fill();
}

// ============================================================
//  LOOP — setInterval гарантирует работу даже при тротлинге rAF
// ============================================================
