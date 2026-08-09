function syncHud(){
 const _fmtT = fmt(time);
 if(UI._lastTime !== _fmtT){ UI._lastTime = _fmtT; UI.timeEl.textContent = _fmtT; }
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
 if(UI._lvl !== level){ UI._lvl = level; UI.lvlEl.textContent = level; }
 if(UI._kills !== kills){ UI._kills = kills; UI.killsEl.textContent = kills; }
 if(UI._gold !== gold){ UI._gold = gold; UI.goldEl.textContent = gold; }
 const _hpw=Math.round(Math.max(0,P.hp/P.maxhp*100));if(__HUDW.hp!==_hpw){__HUDW.hp=_hpw;UI.hp.style.width=_hpw+'%';}
 // v7.42: и здесь тоже по значению. Замер MutationObserver'ом на живом бою:
 // 311 правок DOM в секунду, из них #hpnum, #hptext и #bosstimer давали по 38
 // каждый — ровно частоту отрисовки. Присваивание textContent сносит текстовый
 // узел и создаёт новый ДАЖЕ когда строка та же самая, а это метка «пересчитай
 // стиль и раскладку» на весь верхний HUD. Наш хронометр этого не видит:
 // присваивание в JS мгновенно, работа идёт позже, в шаге отрисовки браузера.
 const _hplow=P.hp/P.maxhp<0.3;
 if(__HUDW.hplow!==_hplow){__HUDW.hplow=_hplow;if(_hplow)UI.hp.classList.add('hp-low');else UI.hp.classList.remove('hp-low');}
 const _hpr=Math.max(0,Math.round(P.hp));
 if(UI.hpNum&&__HUDW.hpn!==_hpr){__HUDW.hpn=_hpr;UI.hpNum.textContent=_hpr;}
 const _hpt=_hpr+'/'+Math.round(P.maxhp);
 if(__HUDW.hpt!==_hpt){__HUDW.hpt=_hpt;UI.hpText.textContent=_hpt;}
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
 // Обратный отсчёт до босса меняется РАЗ В СЕКУНДУ, а переписывался каждый кадр.
 if(bossSpawned){if(__HUDW.bft!=='none'){__HUDW.bft='none';UI.bosseft.style.display='none';}}
 else{
  if(__HUDW.bft!==''){__HUDW.bft='';UI.bosseft.style.display='';}
  const _bt=fmt(Math.max(0,bossT-time));
  if(__HUDW.bt!==_bt){__HUDW.bt=_bt;UI.bosstimer.textContent=_bt;}
 }
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
 // v7.42: строка «Оружие 3/6 · Пассивки 2/6» меняется на подборе, то есть
 // несколько раз за забег. Считалась и переписывалась каждый кадр — вместе с
 // ownedWSlots(), который на каждый кадр собирал Set. Ссылка на элемент тоже
 // бралась getElementById'ом заново.
 if(!paused){
  if(__HUDW.slotEl===undefined)__HUDW.slotEl=document.getElementById('slotshud');
  const _sl=slotsLine();
  if(__HUDW.slotEl&&__HUDW.sl!==_sl){__HUDW.sl=_sl;__HUDW.slotEl.textContent=_sl;}
 }
 renderSynergyHud();   // v5.72: полоска активных синергий
 if(!paused)renderEvoHud();   // v6.18: телеграф рецептов эволюций
}
// v6.1: сглаживание камеры вынесено из физики в отрисовку.
function camFollow(dt){
 // v10.2 VAMPIRE SURVIVORS SMOOTHNESS (1:1 Мгновенная камера без инерции):
 cam.x=clamp(camTarget.x,0,camTarget.maxX);
 cam.y=clamp(camTarget.y,0,camTarget.maxY);
 // v6.5: ВТОРОЙ дефект подачи. Земля рисуется тайлами 768px по координатам
 // sx=_cx*768-cam.x, то есть по ДРОБНЫМ. Сглаживание canvas включено по умолчанию,
 // поэтому каждый кадр вся текстура пересэмплируется с новым сдвигом внутри пикселя.
 // На мелкой высокочастотной текстуре (сосновые иглы) это даёт «кипение» деталей:
 // FPS честные, а картинка выглядит нестабильной. Классическая проблема 2D-скролла.
 // Лечится привязкой камеры к сетке ФИЗИЧЕСКИХ пикселей: земля и спрайты остаются
 // на одной сетке, поэтому взаимного дрожания нет, а шаг привязки — 1/DPR
 // логического пикселя (на этом телефоне полпикселя), что глазу незаметно.
 // v7.36: ZOOM ЗДЕСЬ ЗАБЫЛИ, и привязка не работала ни дня.
 //
 //  Мир переводится в пиксели экрана матрицей setTransform(DPR*ZOOM, ...), то
 //  есть мировая координата wx попадает в пиксель wx*DPR*ZOOM. Чтобы земля
 //  легла на целый пиксель, целым должно быть произведение cam.x*DPR*ZOOM.
 //  Округлялось же только cam.x*DPR, и при ZOOM=0.6424 выходило
 //  «целое × 0.6424» — камера не попадала на пиксель НИКОГДА.
 //
 //  Итог был хуже, чем без округления: сдвиг внутри пикселя не исчезал, а ещё
 //  и менялся рывками по 0.64 пикселя. Отсюда «дёргано» при честных кадрах —
 //  двигается вся картина сразу, и глаз ловит именно неравномерность шага.
  const _q=(DPR||1)*(ZOOM||1)*(zoomPunch||1);
  // v11.6: Плавное непрерывное субпиксельное следование камеры без дискретных скачков округления
  cam.x=clamp(camTarget.x,0,camTarget.maxX);
  cam.y=clamp(camTarget.y,0,camTarget.maxY);
}
function draw(){ // v6.16
 if(__PROF_ON)pT('ground',1);
 // ЗАЩИТА: если canvas не инициализирован (W=0,H=0), не рисовать
 if(W===0||H===0){return;}
  const frameStart=performance.now();
  // v6.1: камера сглаживается здесь, по РЕАЛЬНОМУ времени кадра, а не шагами физики.
  _drawDt=Math.min(0.05,(frameStart-(draw._t||frameStart))/1000)||1/60;   // v6.16: время кадра нужно и анимации врагов
  draw._t=frameStart;
  // v6.1: игрок рисуется по интерполированной позиции — тем же interpFactor, что и враги.
  // v6.1: null здесь значит «была телепортация, не интерполировать».
  const _pix=P._prevX!=null?P._prevX+(P.x-P._prevX)*interpFactor:P.x;
  const _piy=P._prevY!=null?P._prevY+(P.y-P._prevY)*interpFactor:P.y;
  // v7.37: синхронизация цели камеры с интерполированной позицией игрока для идеальной плавности
  const _camMaxX=Math.max(0,WORLD-W), _camMaxY=Math.max(0,WORLD-H);
  camTarget.x=clamp(_pix-W/2,0,_camMaxX);
  camTarget.y=clamp(_piy-H/2,0,_camMaxY);
  camTarget.maxX=_camMaxX;camTarget.maxY=_camMaxY;
  camFollow(_drawDt);
  const _sh=shake, _st=frameStart/1000;
  // FIX(аудит): _q объявлена локально в camFollow() и в draw() была не видна —
  // при любой тряске (shake>0.05) draw() бросал ReferenceError и кадр не рисовался.
  const _q=(DPR||1)*(ZOOM||1)*(zoomPunch||1);
  ctx.save();
  if(zoomPunch!==1){ctx.translate(W/2,H/2);ctx.scale(zoomPunch,zoomPunch);ctx.translate(-W/2,-H/2);}
  if(_sh > 0.05){
   const _shX = Math.round(Math.sin(_st*42)*_sh*0.65*_q)/_q;
   const _shY = Math.round(Math.cos(_st*53)*_sh*0.45*_q)/_q;
   ctx.translate(_shX, _shY);
  }
 const px=_pix-cam.x,py=_piy-cam.y;
 drawGround();
 drawCombatGroundVeil(px,py);   // v6.57: приглушаем только фон, не врагов/эффекты
 if(__PROF_ON){pT('ground',0);pT('world',1);}
 // Тряска и zoomPunch применены до drawGround() для устранения микролагов
 ctx.globalAlpha=1;
 // v7.36 ВЫКЛЮЧАТЕЛИ СЛОЁВ (__DBG, панель включается вместе с хронометром).
 //
 //  Три гипотезы подряд оказались неверными, потому что хронометр меряет только
 //  время ЗАПИСИ команд в JS, а холст рисует их позже. Разрыв на телефоне
 //  владельца — десять к одному: +1.3мс замеренного JS против +14мс кадра.
 //  Найти виновника расчётом нельзя, зато можно вычитанием: гасим слой, смотрим
 //  FPS. Слой, который вернёт кадры, и есть ответ.
 if(__DBG.props){drawProps();drawAnomalies();}   // v6.46: находки рисуются в мире, а не DOM-кружком
 if(__DBG.auras)drawPermanentAuras(px,py); // v7.5: ПОСТОЯННЫЕ АУРЫ ОРУЖИЯ НА ЗЕМЛЕ
 if(__DBG.enemies)drawEnemiesLayer();
 calcFxLoad();   // нагрузка светового слоя: её же читает карман читаемости ниже
 if(__DBG.glow)drawGlowLayer();   // v6.50: свет ПОД эффектами — заливает сцену, как в VS
 if(__DBG.fx)drawFxLayer();
 drawCoins();   // v6.62: монеты
 drawHeroPocket(px,py);   // гасим засвет вокруг героя, пока он ещё не нарисован
 drawPlayerLayer(px,py);
 if(__DBG.dmg)drawDmgNumbers(px,py);   // restore к save() тряски стоит ниже, в этом же файле
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
 // v7.41: полноэкранная вспышка событий — рисуем на холсте (было DOM-градиентом).
 // Центр прозрачен до 50%, цвет на краях — тот же vignette, что и раньше.
 if(_flashT>0){
  _flashT-=Math.min(0.05,_drawDt);
  const fa=_flashA*Math.max(0,_flashT/_flashDur);
  if(fa>0.002){
   const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.5,W/2,H/2,Math.max(W,H)*0.72);
   g.addColorStop(0,flashColorToRGBA(_flashColor,0));
   g.addColorStop(0.5,flashColorToRGBA(_flashColor,0));
   g.addColorStop(1,flashColorToRGBA(_flashColor,fa));
   ctx.save();
   ctx.fillStyle=g;
   ctx.fillRect(0,0,W,H);
   ctx.restore();
  }
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
 const mw=_miniW,mh=_miniH;
 if(!mw||!mh)return;
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
