function drawCombatGroundVeil(px,py){
 // Чем плотнее бой, тем сильнее глушим детальный ковёр из корней.
 // Враги, гемы, эффекты и герой рисуются ПОСЛЕ этого слоя и остаются яркими.
 const pressure=Math.min(1,Math.max(0,(enemies&&enemies.length?enemies.length:0)/110));
 const base=(theme==='winter')?0.03:((nightMode||theme==='night')?0.02:0.04);
 const a=base+pressure*0.035;
 ctx.save();
 ctx.globalCompositeOperation='source-over';
 ctx.fillStyle='rgba(4,7,4,'+a.toFixed(3)+')';
 ctx.fillRect(0,0,W,H);
 // Тёплое пятно около героя оставляет ориентир движения на приглушённой земле.
 const r=(120+70*pressure)*Math.max(1,Math.min(1.25,1/(ZOOM||1)*0.55));
 // v8.12: пятно было тёплым и вчетверо плотнее. На прежней пёстрой земле оно
 // терялось, на ровной холодной стало читаться как гало вокруг героя — и
 // вдобавок тёплое пятно на холодном поле. Оставляем едва заметный холодный
 // подсвет: герой и без него отделён тёмной подложкой и тенью.
 const g=ctx.createRadialGradient(px,py-4,8,px,py-4,r);
 g.addColorStop(0,'rgba(150,196,220,0.030)');
 g.addColorStop(0.48,'rgba(110,150,180,0.014)');
 g.addColorStop(1,'rgba(0,0,0,0)');
 ctx.globalCompositeOperation='lighter';
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py-4,r,0,TAU);ctx.fill();
 ctx.restore();
}
function drawHeroPocket(px,py){
 // Карман читаемости. Тёмная подложка под ногами (drawHeroFocusUnder) спасает
 // от пёстрой земли, но не от засвета: сложение 'lighter' выбивает центр кадра
 // в белое, и герой, хотя и рисуется поверх эффектов, перестаёт из него
 // выделяться. Здесь свет гасится умножением ТОЛЬКО в круге вокруг героя —
 // контраст возвращается, а кадр не заливается серым.
 //
 // Сила кармана привязана к нагрузке светового слоя: в спокойный момент его
 // нет вовсе, иначе вокруг героя всегда висело бы тёмное пятно.
 const k=(typeof fxLoad==='function')?fxLoad():0;
 if(k<0.06)return;
 const r=78*Math.max(1,Math.min(1.3,1/(ZOOM||1)*0.6));
 // v8.12: было 96 — на пёстрой земле незаметно, на ровной читалось тёмным
 // диском. Засвет теперь и так ограничен потолком светового слоя, кармана
 // хватает вдвое слабее.
 const v=Math.round(255-46*k);
 const g=ctx.createRadialGradient(px,py,r*0.2,px,py,r);
 g.addColorStop(0,'rgb('+v+','+v+','+v+')');
 g.addColorStop(1,'rgb(255,255,255)');
 ctx.save();
 ctx.globalCompositeOperation='multiply';
 ctx.fillStyle=g;
 ctx.beginPath();ctx.arc(px,py,r,0,TAU);ctx.fill();
 ctx.restore();
}
function drawHeroFocusUnder(px,py,heroY){
 const ready=typeof specialCharge!=='undefined'&&specialCharge>=1;
 const low=P.hp/Math.max(1,P.maxhp)<0.30;
 const cv=(CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior);
 ctx.save();
 // Тёмная подложка отделяет ноги героя от пёстрой земли и белых вспышек.
 ctx.globalCompositeOperation='source-over';
 ctx.globalAlpha=0.42;
 ctx.fillStyle='rgba(0,0,0,0.52)';
 ctx.beginPath();ctx.ellipse(px,heroY+14,31,9,0,0,TAU);ctx.fill();
 // Постоянный тонкий маркер у ног: не "наклейка", а ориентир центра персонажа.
 ctx.globalAlpha=0.24;
 ctx.strokeStyle=cv.accent||'#ffe6a0';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.ellipse(px,heroY+13,28,8,0,0,TAU);ctx.stroke();
 ctx.restore();
}
// v7.35: кольца состояния вокруг героя НЕТ.
//
//  Сначала я свёл семь рисованных кодом колец в одно — и это всё равно
//  осталась нарисованная кодом окружность вокруг героя, ровно то, от чего
//  договорились уходить. Владелец указал на неё на первом же скриншоте.
//
//  Состояния и без кольца видны: здоровье — в полосе сверху, готовность
//  Печати — в кнопке справа внизу, неуязвимость — миганием самого героя
//  (P.invuln уже задаёт _iframe), а цвет свечения под героем меняется по
//  состоянию в drawPlayerLayer ниже. Кольцо ничего к этому не добавляло,
//  кроме лишней геометрии в самом центре кадра.
function drawPlayerLayer(px,py){
 // player — главный визуальный центр сцены
 const _hurt=Math.max(0,P.hurtT||0);
 // Финальный герой: фиксированные ячейки 172×192, без tight-crop и без процедурной деформации.
 // После проверки на мобильном: уменьшаем «стикерность» — меньше масштаб, меньше ореол, без плавающего маркера над головой.
 const _heroY=py+9;
 drawHeroFocusUnder(px,py,_heroY);   // v6.57: герой читается на любом фоне
 // v5.10: только тень + силуэт — без рун/метки/золотого ореола («наклеек»)
 shadow(px,py+P.r*0.3+68*0.14+9,32);
 // v5.36 (C2): мигание героя во время i-frames (полупрозрачность пульсирует)
 const _iframe=P.invuln>0?0.35+0.45*(0.5+0.5*Math.sin(time*40)):1;
 ctx.save();
 ctx.globalAlpha=_iframe;
 {const _cv=(CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior);
  const _ready=(typeof specialCharge!=='undefined'&&specialCharge>=1);
  const _low=P.hp/Math.max(1,P.maxhp)<0.30;
  ctx.shadowColor=_ready?'rgba(255,220,110,.85)':(_low?'rgba(255,70,50,.75)':(_cv.color||'rgba(255,230,160,.65)'));
  ctx.shadowBlur=_ready?16:(_low?14:9);
 }
 // v6.73: GHOST-TRAIL ульты — призрачные копии позади героя (инерция)
 if(P.specialFx>0){
  const _ud=HERO_CLIPS.ult.dur,_uh=HERO_CLIPS.ult.hit||0.11;
  const _ut=1-Math.max(0,Math.min(1,P.specialFx/_ud));
  if(_ut>_uh){
   const _gv=P.fx<0?-1:1;
   for(let _gi=1;_gi<=2;_gi++){
    ctx.save();
    ctx.globalAlpha=0.18/_gi;
    heroSprDraw(px-_gv*9*_gi,_heroY+2*_gi,P.fx<0);
    ctx.restore();
   }
  }
 }
 (function(){const _hb=HERO_BATTLE[currentClass]||HERO_BATTLE.warrior;if(heroSprDraw(px,_heroY,P.fx<0)){drawClassAttackFx(px,_heroY);}else if(_hb&&_hb.complete&&_hb.naturalWidth){drawHeroMedallion(px,_heroY,P.fx<0);}else{drawClassSilhouette(px,_heroY,P.fx<0);}})();ctx.restore();
// v6.16: ВСПЫШКА ЛВЛ-АПА — кольцо + мерцание по классу при получении уровня (P.levelFx)
if(P.levelFx>0){const k=Math.min(1,P.levelFx/0.3);const cv=CLASS_VISUALS[P.levelFxCls]||CLASS_VISUALS.warrior;const col=cv?cv.color:'#ffcf6a';
 ctx.save();ctx.globalAlpha=0.35+0.5*k;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,py-4,40+18*(1-k),0,7);ctx.stroke();
 ctx.globalAlpha=0.18+0.3*k;const g=ctx.createRadialGradient(px,py-4,4,px,py-4,54);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(px,py-4,54,0,7);ctx.fill();ctx.restore();}
}
function drawCoins(){
 // v7.25: 100% Арт-ориентированная отрисовка падающих монет (Славянская Гривна COIN_DROP_ART) без примитивов из кода
 for(const c of coinDrops){
  const k=Math.min(1,c.t*3);
  const sx=c.x-cam.x,sy=c.y-cam.y;
  const bob=Math.sin((c.max-c.t)*20+c.x)*2;
  ctx.save();
  ctx.translate(sx,sy+bob);
  ctx.rotate((c.max-c.t)*6);
  ctx.globalAlpha=k;
  if(typeof COIN_DROP_ART !== 'undefined' && COIN_DROP_ART.complete && COIN_DROP_ART.naturalWidth){
   // Ореол сияния вокруг монеты
   ctx.globalCompositeOperation='lighter';
   ctx.globalAlpha=k*0.35;
   ctx.drawImage(COIN_DROP_ART, -13, -13, 26, 26);
   // Чёткое золотое тело монеты
   ctx.globalCompositeOperation='source-over';
   ctx.globalAlpha=k;
   ctx.drawImage(COIN_DROP_ART, -9, -9, 18, 18);
  } else {
   ctx.fillStyle='#ffcf6a';
   ctx.beginPath();ctx.arc(0,0,4.5,0,7);ctx.fill();
   ctx.fillStyle='#b8860b';
   ctx.beginPath();ctx.arc(0,0,2.2,0,7);ctx.fill();
  }
  ctx.restore();
 }
}
function drawDmgNumbers(px,py){
 // damage numbers — с антиперекрытием (разброс веером)
 ctx.font='bold 13px system-ui';ctx.textAlign='center';
 // v6.61: крит — крупнее и «выпрыгивает»
 // v8.9 COMMERCIAL ENGINE OPTIMIZATION: O(N) отсечение текста урона за экраном без O(N^2) перебора коллизий
 let _dmgIdx=0;for(const t of ACTIVE.dmgTexts){const sx=t.x-cam.x,sy=t.y-cam.y;if(sx<-80||sy<-80||sx>W+80||sy>H+80)continue;const k=Math.min(1,t.t*2);ctx.globalAlpha=k;ctx.fillStyle=t.color;const ox=((_dmgIdx++%5)-2)*14;if(t.crit){const _pop=1+0.6*Math.min(1,t.t*2);ctx.font='bold '+Math.round(22*_pop)+'px system-ui';ctx.strokeStyle='rgba(20,8,0,0.9)';ctx.lineWidth=4.5;ctx.strokeText(t.v+'!',sx+ox,sy-(1-k)*10);ctx.fillText(t.v+'!',sx+ox,sy-(1-k)*10);}else{ctx.font='bold 14px system-ui';ctx.strokeStyle='rgba(10,14,8,0.85)';ctx.lineWidth=2.5;ctx.strokeText(t.v,sx+ox,sy);ctx.fillText(t.v,sx+ox,sy);} }ctx.globalAlpha=1;ctx.font='bold 13px system-ui';
 // спец-индикатор (показывается только через слот кнопки)
 // туман войны — облегчённый
 if(warpOn){
  const fogSize=EXPLORED_CELL*0.8;
  for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
   const ccx=Math.floor(P.x/EXPLORED_CELL)+dx,ccy=Math.floor(P.y/EXPLORED_CELL)+dy;
   if(isExplored(ccx*EXPLORED_CELL,ccy*EXPLORED_CELL))continue;
   const sx=ccx*EXPLORED_CELL-cam.x,sy=ccy*EXPLORED_CELL-cam.y;
   if(Math.abs(sx-px)>W/2+100||Math.abs(sy-py)>H/2+100)continue;
   ctx.fillStyle='rgba(8,12,6,0.30)';
   ctx.fillRect(sx-fogSize/2,sy-fogSize/2,fogSize,fogSize);
  }
 }
 // v5.97: ctx.restore() перенесён в draw(), к своему ctx.save().
}
function drawWorldEdge(){
 // КРОМКА МИРА: тёмная «стена чащи» по краям поля 100×100 — классика рогаликов:
 // игрок видит, что уровень ограничен. Камера clamp'нута внутрь мира, поэтому
 // рисуем градиентную кромку только когда экран у границы. Локально (у краёв).
 {
  const _ed=140,_ea=0.72;
  if(cam.x<_ed){const k=1-cam.x/_ed;const g=ctx.createLinearGradient(0,0,_ed-cam.x,0);g.addColorStop(0,'rgba(4,7,3,'+(_ea*k).toFixed(3)+')');g.addColorStop(1,'rgba(4,7,3,0)');ctx.fillStyle=g;ctx.fillRect(0,0,_ed-cam.x,H);}
  const _rd=WORLD-W-cam.x;
  if(_rd<_ed){const k=1-_rd/_ed;const x0=W-(_ed-_rd);const g=ctx.createLinearGradient(W,0,x0,0);g.addColorStop(0,'rgba(4,7,3,'+(_ea*k).toFixed(3)+')');g.addColorStop(1,'rgba(4,7,3,0)');ctx.fillStyle=g;ctx.fillRect(x0,0,W-x0,H);}
  if(cam.y<_ed){const k=1-cam.y/_ed;const g=ctx.createLinearGradient(0,0,0,_ed-cam.y);g.addColorStop(0,'rgba(4,7,3,'+(_ea*k).toFixed(3)+')');g.addColorStop(1,'rgba(4,7,3,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,_ed-cam.y);}
  const _bd=WORLD-H-cam.y;
  if(_bd<_ed){const k=1-_bd/_ed;const y0=H-(_ed-_bd);const g=ctx.createLinearGradient(0,H,0,y0);g.addColorStop(0,'rgba(4,7,3,'+(_ea*k).toFixed(3)+')');g.addColorStop(1,'rgba(4,7,3,0)');ctx.fillStyle=g;ctx.fillRect(0,y0,W,H-y0);}
 }
}
