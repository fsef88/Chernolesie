// v7.36 ИСПЕЧЁННАЯ ИСКРА — см. комментарий в месте вызова.
const _sparkCache={};
function _sparkSpr(col){
 let c=_sparkCache[col];
 if(c)return c;
 const R=16;
 c=document.createElement('canvas');c.width=c.height=R*2;
 const g=c.getContext('2d');
 g.fillStyle=col;
 // тот же ромб: полуширина 0.7 от полувысоты
 g.beginPath();g.moveTo(R,0);g.lineTo(R+R*0.7,R);g.lineTo(R,R*2);g.lineTo(R-R*0.7,R);g.closePath();g.fill();
 _sparkCache[col]=c;
 return c;
}

// v11.0 RC1 100% SPRITE ASSET VFX (Аутентичные PNG-спрайты с альфа-каналом, без рисования кодом):
// Все визуальные эффекты заклинаний загружаются из готовых PNG-ассетов. В цикле отрисовки — ТОЛЬКО drawImage.
const _bakedChainSpr = (function(){ const i=new Image(); i.src='@@A:art/fx-layer/-bakedchainspr.png@@'; return i; })();
const _bakedDrainSpr = (function(){ const i=new Image(); i.src='@@A:art/fx-layer/-bakeddrainspr.png@@'; return i; })();
const _bakedIdolSpr  = (function(){ const i=new Image(); i.src='@@A:art/fx-layer/-bakedidolspr.png@@'; return i; })();
const _bakedLaserSpr = (function(){ const i=new Image(); i.src='@@A:art/fx-layer/-bakedlaserspr.png@@'; return i; })();
function drawFxLayer(){
 const FXS = Math.max(1, Math.min(2.4, 1 / (ZOOM || 1) * 0.85));

 // === ОПТИМИЗАЦИЯ v8.0: Culling для гемов ===
 const visibleGems = [];
 for (let i = 0; i < ACTIVE.gems.length; i++) {
   const g = ACTIVE.gems[i];
   const sx = g.x - cam.x;
   const sy = g.y - cam.y;
   if (sx > -160 && sy > -160 && sx < W + 160 && sy < H + 160) {
     visibleGems.push(g);
   }
 }

 ctx.save();
 ctx.globalCompositeOperation = 'lighter';

 // (a) Хвосты гемов — только видимые
 for (const g of visibleGems) {
  const tr = g._tr; if (!tr || !g.ms) continue;
  const i0 = ((g._ti | 0) + 1) & 3;
  const ox = tr[i0 * 2], oy = tr[i0 * 2 + 1];
  const dx = g.x - ox, dy = g.y - oy;
  if (dx * dx + dy * dy < 9) continue;
  ctx.globalAlpha = 0.5; ctx.strokeStyle = g.col; ctx.lineCap = 'round';
  ctx.lineWidth = 2.2 * (g.sc || 1) * FXS;
  ctx.beginPath(); ctx.moveTo(ox - cam.x, oy - cam.y); ctx.lineTo(g.x - cam.x, g.y - cam.y); ctx.stroke();
 }
 ctx.lineCap = 'butt';
 // (b) хлопок в точке поглощения: кольцо схлопывается внутрь + белая искра.
 //     Схлопывание (а не разлёт) читается как «поглотил», а не «взорвалось».
 for(const q of gemPops){
  const qx = q.x - cam.x, qy = q.y - cam.y;
  if (qx < -60 || qy < -60 || qx > W + 60 || qy > H + 60) continue;
  const a=q.t/q.max,k=1-a;
  const px=q.x-cam.x,py=q.y-cam.y;
  const rr=q.out?(16+10*q.sc)*k*FXS      // наружу: от нуля к большому
                :(16+10*q.sc)*a*FXS;     // внутрь: от большого к нулю
  ctx.globalAlpha=k*0.9;
  ctx.strokeStyle=q.col;ctx.lineWidth=2.4*FXS;
  ctx.beginPath();ctx.arc(px,py,rr,0,TAU);ctx.stroke();
  ctx.globalAlpha=k;
  ctx.fillStyle='#fff';
  const cs=2.6*k*FXS;
  ctx.beginPath();ctx.arc(px,py,cs,0,TAU);ctx.fill();
  // четыре коротких луча внутрь — «затягивает»
  ctx.globalAlpha=k*0.7;ctx.strokeStyle='#fff';ctx.lineWidth=1.4*FXS;
  for(let i=0;i<4;i++){
   const an=i*1.5708+q.x*0.05;
   ctx.beginPath();
   const l1=q.out?0.85:1.25, l2=q.out?1.45:0.7;
   ctx.moveTo(px+Math.cos(an)*rr*l1,py+Math.sin(an)*rr*l1);
   ctx.lineTo(px+Math.cos(an)*rr*l2,py+Math.sin(an)*rr*l2);
   ctx.stroke();
  }
 }
 // (c) сияние насыщения на герое: копится от потока гемов, гаснет за полсекунды.
 //     Даёт обратную связь «я собираю поток», которой не было совсем.
 if(absorbGlow>0.02){
  // v7.35: было два кольца вокруг героя. Вместе с кольцом состояния и аурами
  // оружия они складывались в кашу из наложенных окружностей. Сияние
  // насыщения — не состояние, за которым следят, а фоновая обратная связь,
  // поэтому вместо колец мягкое пятно: читается боковым зрением и не спорит
  // с кольцом состояния.
  const ax=P.x-cam.x,ay=P.y-cam.y;
  const ag=Math.min(1,absorbGlow);
  const rr=(P.r+16+10*ag)*FXS*0.8;
  const g=ctx.createRadialGradient(ax,ay,rr*0.25,ax,ay,rr);
  g.addColorStop(0,absorbCol);
  g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=ag*0.26;
  ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(ax,ay,rr,0,TAU);ctx.fill();
 }
 ctx.restore();
 ctx.globalAlpha=1;
   // v7.11: 8-кадровая анимация славянского огненного взрыва из атласа EXPLOSION_ANIM_SHEET (сетка 4x2, кадр 80x80)
  if(typeof EXPLOSION_ANIM_SHEET !== 'undefined' && EXPLOSION_ANIM_SHEET.complete && EXPLOSION_ANIM_SHEET.naturalWidth && typeof activeExplosions !== 'undefined'){
     for(let i = activeExplosions.length - 1; i >= 0; i--){
       const ex = activeExplosions[i];
       ex.t += _drawDt;
       const prog = Math.min(1, ex.t / ex.maxT);
       if(prog >= 1){ activeExplosions.splice(i, 1); continue; }
       const sx_cam = ex.x - cam.x, sy_cam = ex.y - cam.y;
       if (sx_cam < -120 || sy_cam < -120 || sx_cam > W + 120 || sy_cam > H + 120) continue;
       const fIdx = Math.min(7, Math.floor(prog * 8));
      const col = fIdx % 4, row = Math.floor(fIdx / 4);
      const sx = col * 80, sy = row * 80, sw = 80, sh = 80;
      const drawSize = 90 * (ex.sc || 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, 1 - (prog * 0.4));
      ctx.drawImage(EXPLOSION_ANIM_SHEET, sx, sy, sw, sh, ex.x - cam.x - drawSize/2, ex.y - cam.y - drawSize/2, drawSize, drawSize);
      ctx.restore();
    }
  }
  // particles — с culling (оптимизация v8.0)
 for(const p of ACTIVE.particles){
  const al=Math.max(0,p.life/p.max);if(al<0.12)continue;
  const px=p.x-cam.x,py=p.y-cam.y;
  // Усиленный culling для частиц
  if (px < -70 || py < -70 || px > W + 70 || py > H + 70) continue;
  const pt=particleTypeOf(p);
  if(pt!=='spark'){
   const spr=p._spr||(p._spr=particleSprite(pt,p.c));
   const s=(6+4*al)*FXS;
   ctx.globalAlpha=al;
   // v6.67: капли не вращаем (блик крутится криво), только ориентируем по скорости;
   // щепки/осколки/листья/кристаллы вращаются как раньше
   if(pt==='drop'){
    const _da=Math.atan2(p.vy,p.vx);
    ctx.save();ctx.translate(px,py);ctx.rotate(_da);
    ctx.drawImage(spr,-s/2,-s/2,s,s);
    ctx.restore();
   }else{
    if(p._ang===undefined){p._ang=Math.atan2(p.vy,p.vx);p._spin=(Math.random()-0.5)*9;}
    p._ang+=p._spin*0.016;
    ctx.save();ctx.translate(px,py);ctx.rotate(p._ang);
    ctx.drawImage(spr,-s/2,-s/2,s,s);
    ctx.restore();
   }
  }else{
   // v7.36: ромб искры собирался путём из семи вызовов на КАЖДУЮ частицу, а
   // искры — самый массовый тип: в плотном бою их сотни, то есть под две тысячи
   // операций холста за кадр на одни искры. Ромб испечён по цвету и ставится
   // одним blit. Цветов в игре десятки, кэш вырастает один раз и не растёт.
   ctx.globalAlpha=al;
   const s=(1.5+2.2*al)*FXS;
   ctx.drawImage(_sparkSpr(p.c),px-s,py-s,s*2,s*2);
  }
 }ctx.globalAlpha=1;
 // flashes — с culling
 const visibleFlashes = [];
 for (let i = 0; i < ACTIVE.flashes.length; i++) {
   const f = ACTIVE.flashes[i];
   const sx = f.x - cam.x, sy = f.y - cam.y;
   if (sx > -180 && sy > -180 && sx < W + 180 && sy < H + 180) visibleFlashes.push(f);
 }

 // v7.35: ВСПЫШКА ПОПАДАНИЯ — арт вместо рисования кодом.
 //
 //  Здесь было около двадцати линий и дуг на КАЖДОЕ попадание: три
 //  концентрических окружности, белая точка, венок крестиков-искр и ещё
 //  четыре луча у крупной вспышки. На экране это самая часто повторяющаяся
 //  геометрия во всей игре — она рисуется по нескольку раз за кадр и в бою
 //  засыпает поле мелкими кружками.
 //
 //  Лист impact-burst-sheet уже лежал в реестре и использовался только на
 //  критах. Теперь он рисует все вспышки. Лист белый, поэтому красится в цвет
 //  вспышки и кладётся сложением — это его родной режим, в отличие от листов
 //  зон по заданию, которые приходят уже цветными.
 for(const f of visibleFlashes){
  const a=f.t/f.max, k=1-a, px=f.x-cam.x, py=f.y-cam.y;
  const _fw=(f.w!=null?f.w:(f.big?1:0));
  const r=(7+9*_fw)*(0.4+k)*FXS;
  const sh=(typeof IMPACT_BURST_SHEET!=='undefined')
    ?(tintedSheet(IMPACT_BURST_SHEET,f.color||'#ffffff')||IMPACT_BURST_SHEET):null;
  if(sh&&sh.width!==0&&(sh.naturalWidth===undefined||sh.naturalWidth)){
   const fi=Math.max(0,Math.min(7,Math.floor(k*8)));
   const sw=Math.floor((sh.naturalWidth||sh.width)/4), sy2=Math.floor((sh.naturalHeight||sh.height)/2);
   // 4.6 радиуса, а не 3.2: прежний венок крестиков разлетался примерно на
   // две величины радиуса, и при 3.2 лист выходил заметно тусклее и мельче
   // того, что заменял.
   const d=r*4.6;
   ctx.save();
   ctx.globalCompositeOperation='lighter';
   ctx.globalAlpha=Math.min(1,a*1.6)*(0.7+0.3*_fw);
   ctx.drawImage(sh,(fi%4)*sw,(fi>3?1:0)*sy2,sw,sy2,px-d/2,py-d/2,d,d);
   ctx.restore();
   continue;
  }
  // запасной путь, пока лист не декодировался: одно кольцо, без венка искр
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=a*0.8;
  ctx.strokeStyle=f.color; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(px,py,r,0,TAU); ctx.stroke();
  ctx.restore();
 }
 // slashes
 const _swordForSlash=weapons.find(w=>w.id==='sword');
 const _slashEvo=_swordForSlash&&_swordForSlash.evo;

 // === ОПТИМИЗАЦИЯ: culling для взмахов оружия ===
 for(const s of slashes){
  const k=s.t/0.34;

  // Пропускаем взмахи, которые игрок не видит
  const sx = P.x - cam.x;
  const sy = P.y - cam.y;
  if (sx < -130 || sy < -130 || sx > W + 130 || sy > H + 130) continue;

  if(s._kosa){
   // v7.35: у косы есть свой лист зоны по заданию (WFX_SHEETS.kosa). Этот след
   // рисуется на 185% радиуса, сложением и без обрезки по конусу — поверх листа
   // он расплывался далеко за границу зоны, и удар читался как мазок. Один удар
   // рисуется один раз: где есть лист, старый след не нужен.
   // Тот же блок продублирован в render/fx/weapon-trails.js (ветка .modern),
   // правка внесена в оба, чтобы копии не разъехались.
   const _kw=(typeof WFX_SHEETS!=='undefined')&&WFX_SHEETS.kosa;
   if(_kw&&_kw.brief)continue;
   const kk=Math.min(1,s.t/0.26);
   ctx.save();ctx.translate(P.x-cam.x,P.y-cam.y);ctx.rotate(s.ang);
   ctx.globalCompositeOperation='lighter';
   ctx.globalAlpha=kk*0.9;
   if(KOSA_TRAIL_SHEET && KOSA_TRAIL_SHEET.complete && KOSA_TRAIL_SHEET.naturalWidth){
    const prog = 1 - Math.max(0, Math.min(1, s.t / 0.26));
    const fIdx = Math.min(7, Math.floor(prog * 8));
    const col = fIdx % 4, row = Math.floor(fIdx / 4);
    const sw = KOSA_TRAIL_SHEET.naturalWidth / 4;
    const sh = KOSA_TRAIL_SHEET.naturalHeight / 2;
    const drawSize = s.reach * 1.85;
    ctx.drawImage(KOSA_TRAIL_SHEET, col * sw, row * sh, sw, sh, -drawSize * 0.35, -drawSize * 0.5, drawSize, drawSize);
   } else {
    const arc=s.arc||0.75;
    ctx.strokeStyle=s.evo?'#d0b8ff':'#b8c8d8';ctx.lineWidth=s.evo?26:18;
    ctx.beginPath();ctx.arc(0,0,s.reach*0.78,-arc,arc);ctx.stroke();
   }
   ctx.restore();
   continue;
  }
  ctx.save();ctx.translate(P.x-cam.x,P.y-cam.y);ctx.rotate(s.ang);ctx.globalCompositeOperation='lighter';
  // v7.20: 100% Арт-ориентированные индивидуальные эффекты ближнего боя без рисования кодом (Воин / Знахарка / Воронник)
  const isWarrior = (currentClass === 'warrior' || !currentClass);
  const isDruid = (currentClass === 'druid');
  const isRogue = (currentClass === 'rogue');
  const classVfx = CLASS_VISUALS[currentClass] || CLASS_VISUALS.warrior;
  const colMain = _slashEvo ? '#ff7a2e' : classVfx.color;
  const colAcc  = _slashEvo ? '#ffaa44' : classVfx.accent;

  if(isWarrior && typeof SLASH_ANIM_SHEET !== 'undefined' && SLASH_ANIM_SHEET.complete && SLASH_ANIM_SHEET.naturalWidth){
   // (1) ВОИН: Правильная отрисовка slash-эффекта
   const progress = 1 - Math.max(0, Math.min(1, k));
   const fIdx = Math.min(7, Math.floor(progress * 8));
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sw = Math.floor(SLASH_ANIM_SHEET.naturalWidth / 4);
   const sh = Math.floor(SLASH_ANIM_SHEET.naturalHeight / 2);

   // Фиксированный визуальный размер эффекта
   const visualSize = 180;
   
   // Смещение, чтобы "лезвие" спрайта шло от оружия героя
   // -visualSize * 0.38 по X и -visualSize * 0.42 по Y — подобрано экспериментально
   const offsetX = -visualSize * 0.38;
   const offsetY = -visualSize * 0.42;

   ctx.globalAlpha = Math.max(0.25, k);
   ctx.drawImage(
     SLASH_ANIM_SHEET,
     col * sw, row * sh, sw, sh,
     offsetX, offsetY,
     visualSize, visualSize
   );
   // v7.36: венок крестиков-искр поверх листа убран — см. drawFxLayer ниже.
  } else if(isDruid && typeof DRUID_WAVE_SHEET !== 'undefined' && DRUID_WAVE_SHEET.complete && DRUID_WAVE_SHEET.naturalWidth){
   // (2) ЗНАХАРКА: 8-кадровая анимация морозно-травяной волны посоха из атласа DRUID_WAVE_SHEET
   const progress = 1 - Math.max(0, Math.min(1, k));
   const fIdx = Math.min(7, Math.floor(progress * 8));
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sw = Math.floor(DRUID_WAVE_SHEET.naturalWidth / 4);
   const sh = Math.floor(DRUID_WAVE_SHEET.naturalHeight / 2);
   const drawSize = s.reach * 1.55;
   ctx.globalAlpha = Math.max(0.25, k);
   ctx.drawImage(DRUID_WAVE_SHEET, col * sw, row * sh, sw, sh, -drawSize * 0.30, -drawSize * 0.5, drawSize, drawSize);
   // v7.36: то же — крестики поверх листа убраны.
  } else if(isRogue && typeof ROGUE_SLASH_SHEET !== 'undefined' && ROGUE_SLASH_SHEET.complete && ROGUE_SLASH_SHEET.naturalWidth){
   // (3) ВОРОННИК: 8-кадровая анимация теневого серпа из атласа ROGUE_SLASH_SHEET
   const progress = 1 - Math.max(0, Math.min(1, k));
   const fIdx = Math.min(7, Math.floor(progress * 8));
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sw = Math.floor(ROGUE_SLASH_SHEET.naturalWidth / 4);
   const sh = Math.floor(ROGUE_SLASH_SHEET.naturalHeight / 2);
   const drawSize = s.reach * 1.55;
   ctx.globalAlpha = Math.max(0.25, k);
   ctx.drawImage(ROGUE_SLASH_SHEET, col * sw, row * sh, sw, sh, -drawSize * 0.30, -drawSize * 0.5, drawSize, drawSize);
   // v7.36: то же — крестики поверх листа убраны.
   //
   //  Один цикл на все три класса: разбросать блики по дуге радиуса удара,
   //  пока лист уже нарисован. Радиус к листу отношения не имел, поэтому
   //  искры ложились то внутри рисунка, то за его кромкой — и на кромке
   //  выдавали, что круг у эффекта всё-таки есть.
  } else {
   for(let g = 4; g >= 1; g--){
    const off = g * 0.13 * (1 - k), al = k * 0.16 * (1 - g / 5.5);
    if(al <= 0.01) continue;
    ctx.globalAlpha = al;
    ctx.strokeStyle = colMain;
    ctx.lineWidth = (_slashEvo ? 16 : 12) * (1 - g * 0.12);
    ctx.beginPath(); ctx.arc(0, 0, s.reach * 0.82, -0.86 - off, 0.86 - off); ctx.stroke();
   }
   ctx.globalAlpha = k * 0.30; ctx.strokeStyle = colMain; ctx.lineWidth = _slashEvo ? 20 : 16; ctx.beginPath(); ctx.arc(0, 0, s.reach * 0.82, -0.86, 0.86); ctx.stroke();
   ctx.globalAlpha = k * 0.82; ctx.strokeStyle = colAcc;  ctx.lineWidth = _slashEvo ? 9 : 7;   ctx.beginPath(); ctx.arc(0, 0, s.reach * 0.80, -0.82, 0.82); ctx.stroke();
   ctx.globalAlpha = k;        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4;               ctx.beginPath(); ctx.arc(0, 0, s.reach * 0.80, -0.62, 0.62); ctx.stroke();
  }
  ctx.restore();
 }
 // bolts — с culling (безопасная оптимизация)
 for(const b of bolts){
  const bx=b.x-cam.x,by=b.y-cam.y,k=b.t/0.18;

  // Пропускаем молнии за пределами экрана
  if (bx < -100 || by < -120 || bx > W + 100 || by > H + 120) continue;
  const progress=1-Math.max(0,b.t/0.18);
  if(LIGHTNING_ANIM_SHEET && LIGHTNING_ANIM_SHEET.complete && LIGHTNING_ANIM_SHEET.naturalWidth){
   const fIdx = Math.min(7, Math.floor(progress * 8));
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sx = col * 80, sy = row * 80;
   ctx.save();
   ctx.globalCompositeOperation = 'lighter';
   ctx.globalAlpha = Math.max(0, 1.1 - progress);
   ctx.drawImage(LIGHTNING_ANIM_SHEET, sx, sy, 80, 80, bx - 40, by - 70, 80, 80);
   ctx.restore();
  } else {
   ctx.save();ctx.globalAlpha=k;ctx.globalCompositeOperation='lighter';
   // v8.7 VISUAL POLISH: мощный разряд молнии с толстым белым ядром и синим ореолом
   ctx.strokeStyle='rgba(140,200,255,0.45)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(bx,by-48);
   for(let s=1;s<=5;s++){const ty=by-48+s*(48/5),tx=bx+(s%2?1:-1)*(6+s*1.5)*k;ctx.lineTo(tx,ty);}ctx.stroke();
   ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(bx,by-48);
   for(let s=1;s<=5;s++){
    const ty=by-48+s*(48/5);
    const tx=bx+(s%2?1:-1)*(6+s*1.5)*k;
    ctx.lineTo(tx,ty);
   }
   ctx.stroke();
   ctx.globalAlpha=k*0.7;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by-8,3.5*k,0,7);ctx.fill();
   ctx.restore();
  }
 }
 // aim lines (короткий дозорный прицел) — с culling
 for(let i=0;i<aimLines.length;i++){
  const L=aimLines[i],k=Math.max(0,L.t/0.14);

  // Пропускаем прицелы/цепи за пределами экрана
  if (L.x1 - cam.x < -80 || L.y1 - cam.y < -80 || L.x1 - cam.x > W + 80 || L.y1 - cam.y > H + 80) continue;
  // v6.17b: ВЕРВЬ — цепь между двумя врагами (абсолютные координаты, не от игрока)
  if(L._verv){
   const kk=Math.max(0,L.t/0.3);
   const sx=L.x1-cam.x, sy=L.y1-cam.y, ex=L.x2-cam.x, ey=L.y2-cam.y;
   const dx=ex-sx, dy=ey-sy, len=Math.hypot(dx,dy)||1, ang=Math.atan2(dy,dx);
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=kk*0.95;
   ctx.translate(sx,sy);ctx.rotate(ang);
   ctx.drawImage(_bakedChainSpr, 0, -12, len, 24);
   ctx.restore();continue;
  }
  // v6.17c: УПЫРЬ — нить вытягивания жизни к игроку
  if(L._drain){
   const kk=Math.max(0,L.t/0.22);
   const sx=L.x1-cam.x, sy=L.y1-cam.y, ex=L.x2-cam.x, ey=L.y2-cam.y;
   const dx=ex-sx, dy=ey-sy, len=Math.hypot(dx,dy)||1, ang=Math.atan2(dy,dx);
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=kk*0.9;
   ctx.translate(sx,sy);ctx.rotate(ang);
   ctx.drawImage(_bakedDrainSpr, 0, -12, len, 24);
   ctx.restore();continue;
  }
  // v6.17b: ИДОЛ — короткий разряд к цели
  if(L._idol){
   const kk=Math.max(0,L.t/0.16);
   const sx=L.x1-cam.x, sy=L.y1-cam.y, ex=L.x2-cam.x, ey=L.y2-cam.y;
   const dx=ex-sx, dy=ey-sy, len=Math.hypot(dx,dy)||1, ang=Math.atan2(dy,dx);
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=kk;
   ctx.translate(sx,sy);ctx.rotate(ang);
   ctx.drawImage(_bakedIdolSpr, 0, -14, len, 28);
   ctx.restore();continue;
  }
  ctx.save();ctx.translate(P.x-cam.x,P.y-cam.y-6);ctx.rotate(L.ang);
  ctx.globalAlpha=0.22*k;ctx.strokeStyle='#cfe6a0';ctx.lineWidth=2;ctx.setLineDash([4,6]);
  ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(L.len,0);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
 }
 if(idols.length)drawIdols();   // v6.17b
 if(volki.length)drawVolki();   // v6.17: волки под снарядами
 drawZonePulses(_drawDt);   // v7.33: границы зон оружия, каждая своим цветом
 drawSheetFx(_drawDt);      // v7.34: криты и оседающая пыль
 drawSerpOrbs();drawVihrStorm();drawKosaTrail();   // v6.19: след жатвы Косы
function drawKosaTrail(){
 if(!kosaTrail.length)return;
 for(const m of kosaTrail){
  const sx=m.x-cam.x,sy=m.y-cam.y;
  // Culling для следов Косы
  if (sx < -40 || sy < -40 || sx > W + 40 || sy > H + 40) continue;
  const a=Math.max(0,1-(m.t||0)/1.2);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.5*a;
  ctx.strokeStyle='#9affb0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy,6+10*(1-a),0,7);ctx.stroke();ctx.restore();}
}
 // arrows (лук Стража) — с culling
 for(let i=0;i<arrows.length;i++){
  const a=arrows[i];const ax=a.x-cam.x,ay=a.y-cam.y;const ang=Math.atan2(a.vy,a.vx);

  // Пропускаем стрелы за пределами экрана
  if (ax < -60 || ay < -60 || ax > W + 60 || ay > H + 60) continue;
  // v6.17: СЕРП — вращающееся полукруглое лезвие
  if(a._boom){
   ctx.save();ctx.translate(ax,ay);ctx.rotate(time*17);ctx.globalCompositeOperation='lighter';
   ctx.strokeStyle=a._col||'#cfe0ff';ctx.lineWidth=3.2;
   ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(0,0,9,0.5,4.2);ctx.stroke();
   ctx.lineWidth=1.4;ctx.globalAlpha=0.8;
   ctx.beginPath();ctx.arc(0,0,12,0.7,3.9);ctx.stroke();
   ctx.fillStyle=a._col||'#cfe0ff';
   ctx.beginPath();ctx.arc(Math.cos(0.5)*9,Math.sin(0.5)*9,2.2,0,7);ctx.fill();
   ctx.restore();continue;
  }
  // v6.17: КАМЕНЬ — гранёный осколок, тускнеет с каждым рикошетом
  // v6.17: КАМЕНЬ — гранёный осколок (использует секцию 2 ледяного шипа из PROJECTILES_ART_SHEET)
  // v7.14: 8-кадровая анимация ледяных шипов стужи Мораны из атласа FROST_SPIKE_ANIM_SHEET
  if(a._stone){
   const progress = (time * 2.5) % 1.0;
   if(typeof FROST_SPIKE_ANIM_SHEET !== 'undefined' && FROST_SPIKE_ANIM_SHEET.complete && FROST_SPIKE_ANIM_SHEET.naturalWidth){
    const fIdx = Math.min(7, Math.floor(progress * 8));
    const col = fIdx % 4, row = Math.floor(fIdx / 4);
    const sx = col * 80, sy = row * 80, sw = 80, sh = 80;
    ctx.save();ctx.translate(ax,ay);ctx.rotate(time*3);ctx.globalCompositeOperation='lighter';
    ctx.drawImage(FROST_SPIKE_ANIM_SHEET, sx, sy, sw, sh, -18, -18, 36, 36);
    ctx.restore();continue;
   }
   ctx.save();ctx.translate(ax,ay);ctx.rotate(time*9);ctx.globalCompositeOperation='lighter';
   ctx.fillStyle=a._col||'#d8d0c0';ctx.shadowBlur=0;
   ctx.beginPath();
   for(let k2=0;k2<5;k2++){const an=k2*1.2566,rr=k2%2?4:7.5;
    const px=Math.cos(an)*rr,py=Math.sin(an)*rr;
    if(k2===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
   ctx.closePath();ctx.fill();
   ctx.globalAlpha=0.6;ctx.strokeStyle='#fff';ctx.lineWidth=1;
   ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.stroke();
   ctx.restore();continue;
  }
  // v7.9: Студийная нарезка снарядов (секция 0 для стрелы Луказаставы)
  if(typeof PROJECTILES_ART_SHEET !== 'undefined' && PROJECTILES_ART_SHEET.complete && PROJECTILES_ART_SHEET.naturalWidth){
    ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);ctx.globalCompositeOperation='lighter';
    ctx.drawImage(PROJECTILES_ART_SHEET, 0, 0, 160, 160, -16, -16, 32, 32);
    ctx.restore();
  } else {
    ctx.save();ctx.translate(ax,ay);ctx.rotate(ang);ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=a.evo?'#ffcf6a':'#d8e0b0';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(8,0);ctx.stroke();
    ctx.fillStyle=a.evo?'#ffaa44':'#9ac06a';
    ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(2,-2.5);ctx.lineTo(2,2.5);ctx.closePath();ctx.fill();
    ctx.strokeStyle=a.evo?'#ffcf6a':'#8a7a50';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-14,-2.5);ctx.moveTo(-10,0);ctx.lineTo(-14,2.5);ctx.stroke();
    ctx.restore();
  }
 }
 // orbit — с culling
 if(hasOrbit){for(let i=0;i<orbCount;i++){
  const a=orbAngle+i*(TAU/orbCount);
  const ox=P.x+Math.cos(a)*70-cam.x,oy=P.y+Math.sin(a)*70-cam.y;

  // Пропускаем ворон за пределами экрана
  if (ox < -30 || oy < -30 || ox > W + 30 || oy > H + 30) continue;
  const flap=Math.sin(time*14+i*1.7);
  ctx.save();ctx.translate(ox,oy);ctx.rotate(a+Math.PI/2);
  ctx.fillStyle='#1a1220';ctx.strokeStyle='#b478ff';ctx.lineWidth=1.2;
  ctx.beginPath();ctx.ellipse(0,0,5.5,3.2,0,0,7);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.arc(5.2,-1.2,2.2,0,7);ctx.fill();
  ctx.fillStyle='#c9a04a';ctx.beginPath();ctx.moveTo(7.2,-1.2);ctx.lineTo(10.5,-0.2);ctx.lineTo(7.2,0.2);ctx.closePath();ctx.fill();
  ctx.fillStyle='#2a1833';ctx.strokeStyle='#8a5ab0';
  ctx.beginPath();ctx.moveTo(-1,0);ctx.quadraticCurveTo(-6,-8-flap*5,-12,-2-flap*3);ctx.quadraticCurveTo(-6,0,-1,1);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(-1,0);ctx.quadraticCurveTo(-5,7+flap*4,-11,3+flap*2);ctx.quadraticCurveTo(-5,1,-1,0);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ffcf6a';ctx.beginPath();ctx.arc(5.6,-1.5,0.7,0,7);ctx.fill();
  ctx.restore();
 }}
}

// ============================================================
//  v6.57 ЧИТАЕМОСТЬ БОЯ БЕЗ НОВЫХ КАРТИНОК
//  1) фон приглушается только под боем, до отрисовки врагов/эффектов;
//  2) герой получает постоянный мягкий силуэт и пятно под ногами;
//  3) готовая Печать видна рядом с героем спокойным кольцом, а не стробом.
// ============================================================
