// ============================================================
//  v7.36 ИСПЕЧЁННЫЕ ЗНАЧКИ СТАТУСОВ
//
//  Статусы висят почти на каждом враге в поздней игре, а рисовались путями:
//  пять кристаллов льда по шесть вызовов, четыре пузыря яда по три, шесть
//  нитей замедления по четыре. До сорока вызовов холста НА ОДНОГО врага, и при
//  трёх сотнях врагов это больше десяти тысяч операций за кадр.
//
//  Стоимость такой отрисовки в JS не видна: вызов лишь записывает команду, а
//  растеризует её браузер потом. Поэтому хронометр честно показывал единицы
//  миллисекунд при кадре в тридцать.
//
//  Тот же приём, что у тайлов земли (v5.29) и свечения гемов (v5.99): рисуем
//  один раз в маленький холст, дальше только blit.
// ============================================================
const _iceCv=(function(){
 const R=64,c=document.createElement('canvas');c.width=c.height=R*2;
 const g=c.getContext('2d');
 g.fillStyle='#e8f6ff';g.strokeStyle='#ffffff';g.lineWidth=2;
 for(let i=0;i<5;i++){
  const an=i*1.2566, rr=R*0.66;
  const bx=R+Math.cos(an)*rr*0.5, by=R+Math.sin(an)*rr*0.667;
  const tx=R+Math.cos(an)*rr, ty=R+Math.sin(an)*rr*0.9;
  const nx=-Math.sin(an)*R*0.05, ny=Math.cos(an)*R*0.05;
  g.beginPath();g.moveTo(bx+nx,by+ny);g.lineTo(tx,ty);g.lineTo(bx-nx,by-ny);g.closePath();g.fill();
 }
 return c;
})();
function _mkBub(col){
 const R=16,c=document.createElement('canvas');c.width=c.height=R*2;
 const g=c.getContext('2d');
 g.fillStyle=col;g.beginPath();g.arc(R,R,R-1,0,Math.PI*2);g.fill();
 return c;
}
const _bubA=_mkBub('#9ad06a'), _bubB=_mkBub('#c9e08a');
function drawEnemiesLayer(){
 // ВРАГИ с правильным AI визуалом
 const visR=Math.max(W,H)*0.6,visR2=visR*visR;
 for(const e of enemies){
  if(warpOn&&!isExplored(e.x,e.y)&&dist2(e.x-P.x,e.y-P.y)>visR2)continue;
  // ИНТЕРПОЛЯЦИЯ: использовать interpolated координаты для плавной анимации
  const interpolatedX=e._prevX!==undefined?(e._prevX+(e.x-e._prevX)*interpFactor):e.x;
  const interpolatedY=e._prevY!==undefined?(e._prevY+(e.y-e._prevY)*interpFactor):e.y;
  // CULLING: cam = левый-верхний угол, мерить надо от ЦЕНТРА камеры
  // (раньше было Math.abs(e.x-cam.x)>W/2+50 — ломалось, т.к. cam это угол, не центр)
  // динамический отступ. У босса drawH=172, у элиты 138 — с жесткими 60px
  // половина их туши "схлопывалась" на краю экрана. Теперь margin = размер спрайта.
  const cullMargin=Math.max(60,e.drawH||60);
  if(Math.abs(interpolatedX-(cam.x+W/2))>W/2+cullMargin||Math.abs(interpolatedY-(cam.y+H/2))>H/2+cullMargin)continue;
  const x=interpolatedX-cam.x,y=interpolatedY-cam.y;
  updateEnemyAnimMeta(e);
   const flip=(P.x-e.x)<0;
  // v10.0 LOD (Level of Detail): в густой орде (>200) отсекаем тени у дальних рядовых врагов
  if(!(enemies.length > 200 && !e.boss && !e.elite && !e.mini && x*x + y*y > 78400)){
   shadow(x,y+e.r*0.3+e.drawH*0.14,e.drawH*0.38);
  }
  if(e.elite||e.boss||e.mini||e.courier||e.beacon||e.shaman){const gc=e.boss?(e.phase===2?'rgba(255,60,40,':'rgba(200,90,255,'):e.mini?(e.type==='naviya'?'rgba(180,255,210,':'rgba(255,190,90,'):e.courier?'rgba(255,220,90,':e.beacon?'rgba(190,120,255,':e.shaman?'rgba(255,90,60,':(AFFIX_AURA[e.affix]||'rgba(120,255,140,');ctx.save();ctx.globalCompositeOperation='lighter';const gr=ctx.createRadialGradient(x,y-e.drawH*0.3,4,x,y-e.drawH*0.3,e.drawH*0.55);gr.addColorStop(0,gc+'0.22)');gr.addColorStop(1,gc+'0)');
   // v6.68: аура мягче — не шумит поверх тела
   ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y-e.drawH*0.3,e.drawH*0.55,0,7);ctx.fill();ctx.restore();}
  // v6.16: ТЕЛЕГРАФ ВЫСТРЕЛА ШУТЕРА — линия цели + пульсирующая мишень на игроке.
  // Шутер целится в текущую позицию P во время 0.4с предупреждения (e.telegraphT).
  if(e.ai==='shooter'&&e.telegraphT>0){
   const k=Math.min(1,e.telegraphT/0.4); // 1→0 к моменту выстрела
   const px=P.x-cam.x, py=P.y-cam.y;
   ctx.save();
   ctx.globalAlpha=0.25+0.45*k;
   ctx.strokeStyle='#c98bff';ctx.lineWidth=2;
   // v8.7: сплошной лазерный прицел без штриховой пунктирной линии
   ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(px,py);ctx.stroke();
   // пульсирующая мишень на игроке
   const pulse=1+0.25*Math.sin(time*22);
   ctx.globalAlpha=0.4+0.4*k;
   ctx.strokeStyle='#b478ff';ctx.lineWidth=2.5;
   ctx.beginPath();ctx.arc(px,py-4,(P.r+10)*pulse,0,7);ctx.stroke();
   ctx.globalAlpha=(0.3+0.3*k)*Math.abs(Math.sin(time*22));
   ctx.fillStyle='#b478ff';ctx.beginPath();ctx.arc(px,py-4,(P.r+10)*pulse,0,7);ctx.fill();
   ctx.restore();
  }
  // условие было e.spawnT<=0. У босса/элиты/Древня spawnT вообще
  // не задаётся (undefined), а undefined<=0 === false → их ТЕЛА НИКОГДА не
  // рисовались — видны были только аура и тень! `!(spawnT>0)` одинаково
  // работает и для undefined, и для 0.
  if(!(e.spawnT>0)){
   // Wraith: полупрозрачный по умолчанию, проявляется при ударе
   if(e.type==='volkolak'&&e.hit<=0&&e.flash<=0)ctx.save();
   if(e.type==='volkolak'&&e.hit<=0&&e.flash<=0)ctx.globalAlpha=0.55;
   else if(e.type==='volkolak')ctx.globalAlpha=0.8;   // v6.68: при ударе призрак проявляется — удар читается
   // v5.73 ВСПЫШКА СМЕРТИ: на 90мс силуэт выбеливается. Рисуем спрайт как обычно,
   // затем поверх — его же, залитый белым через 'lighter'. Форма берётся из самого
   // спрайта, поэтому вспышка повторяет силуэт, а не рисует круг поверх него.
   const _df=e.deathFlash>0?Math.min(1,e.deathFlash/0.09):0;
   // v6.16: Leshiy fallback — если кадр анимации не готов, не дергаем пустой/битый спрайт
   const _leshiyFrameReady=e.type==='leshiy'?((e.frames&&e.frames[Math.floor(((e._animPh!=null?e._animPh:(e.at||0)*(e.frames.fps||9)))%(e.frames.length||1))])||{}).complete:true; // v6.17: сверяемся с той же фазой, что и drawSprite
   // v7.31: 100% Анимированные 8-кадровые Боссы и Вожаки (Змей Горыныч, Волк-Вожак, Леший-Владыка)
   const prog = (time * 6.5 + (e.x||0) * 0.01) % 1.0;
   const fIdx = Math.floor(prog * 8) % 8;
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sw = 160, sh = 160;

   if(e.boss && typeof BOSS_HRANITEL_SHEET !== 'undefined' && BOSS_HRANITEL_SHEET.complete && BOSS_HRANITEL_SHEET.naturalWidth){
    const drawW = e.drawH * 1.5, drawH = e.drawH * 1.5;
    ctx.save();
    if(flip){ ctx.translate(x, y + e.r*0.3); ctx.scale(-1, 1); ctx.drawImage(BOSS_HRANITEL_SHEET, col*sw, row*sh, sw, sh, -drawW/2, -drawH*0.8, drawW, drawH); }
    else { ctx.drawImage(BOSS_HRANITEL_SHEET, col*sw, row*sh, sw, sh, x - drawW/2, y + e.r*0.3 - drawH*0.8, drawW, drawH); }
    ctx.restore();
    if(e.phase >= 2){
     // визуальная фаза Ярости (огненные руны и пульсирующий багровый свет)
     ctx.save(); ctx.globalCompositeOperation = 'lighter';
     ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 6);
     ctx.drawImage(BOSS_HRANITEL_SHEET, col*sw, row*sh, sw, sh, x - drawW*0.55, y + e.r*0.3 - drawH*0.85, drawW*1.1, drawH*1.1);
     ctx.restore();
    }
   } else if((e.mini && e.type === 'baba_yaga') && typeof BOSS_DREVEN_SHEET !== 'undefined' && BOSS_DREVEN_SHEET.complete && BOSS_DREVEN_SHEET.naturalWidth){
    // ДРЕВЕНЬ / ЛЕСНОЙ ИСПОЛИН (4x4 Атлас 768x512)
    const dsw = Math.floor(BOSS_DREVEN_SHEET.naturalWidth / 4), dsh = Math.floor(BOSS_DREVEN_SHEET.naturalHeight / 4);
    let dfIdx = 0;
    if(e.dying > 0) dfIdx = 12 + Math.min(3, Math.floor((1 - Math.max(0, e.dying / (e.dieMax||1.25))) * 4));
    else if(e.atkT > 0) dfIdx = 4 + Math.min(3, Math.floor((1 - Math.max(0, e.atkT / (e.atkDur||0.85))) * 4));
    else if(e.slamT <= 0.6 || e.phase === 2) dfIdx = 8 + (Math.floor(time * 6) % 4);
    else dfIdx = Math.floor(time * 5) % 4;
    const dcol = dfIdx % 4, drow = Math.floor(dfIdx / 4);
    const drawW = e.drawH * 1.5, drawH = e.drawH * 1.5;
    ctx.save();
    if(flip){ ctx.translate(x, y + e.r*0.3); ctx.scale(-1, 1); ctx.drawImage(BOSS_DREVEN_SHEET, dcol*dsw, drow*dsh, dsw, dsh, -drawW/2, -drawH*0.85, drawW, drawH); }
    else { ctx.drawImage(BOSS_DREVEN_SHEET, dcol*dsw, drow*dsh, dsw, dsh, x - drawW/2, y + e.r*0.3 - drawH*0.85, drawW, drawH); }
    ctx.restore();
   } else if((e.miniKind === 'warlord' || (e.elite && e.type === 'upyr')) && typeof BOSS_KOSCHEI_SHEET !== 'undefined' && BOSS_KOSCHEI_SHEET.complete && BOSS_KOSCHEI_SHEET.naturalWidth){
    // КОЩЕЙ БЕССМЕРТНЫЙ / КОСТЯНОЙ ЦАРЬ (4x4 Атлас 768x512)
    const ksw = Math.floor(BOSS_KOSCHEI_SHEET.naturalWidth / 4), ksh = Math.floor(BOSS_KOSCHEI_SHEET.naturalHeight / 4);
    let kfIdx = 0;
    if(e.dying > 0) kfIdx = 12 + Math.min(3, Math.floor((1 - Math.max(0, e.dying / (e.dieMax||1.25))) * 4));
    else if(e.howlT > 0 && e.howlT < 1.5) kfIdx = 8 + (Math.floor(time * 7) % 4);
    else if(e.slamT <= 0.6 || e.phase === 2) dfIdx = 4 + (Math.floor(time * 6) % 4);
    else kfIdx = Math.floor(time * 5) % 4;
    const kcol = kfIdx % 4, krow = Math.floor(kfIdx / 4);
    const drawW = e.drawH * 1.45, drawH = e.drawH * 1.45;
    ctx.save();
    if(flip){ ctx.translate(x, y + e.r*0.3); ctx.scale(-1, 1); ctx.drawImage(BOSS_KOSCHEI_SHEET, kcol*ksw, krow*ksh, ksw, ksh, -drawW/2, -drawH*0.85, drawW, drawH); }
    else { ctx.drawImage(BOSS_KOSCHEI_SHEET, kcol*ksw, krow*ksh, ksw, ksh, x - drawW/2, y + e.r*0.3 - drawH*0.85, drawW, drawH); }
    ctx.restore();
   } else if((e.mini && e.type === 'naviya') && typeof BOSS_SORCERER_SHEET !== 'undefined' && BOSS_SORCERER_SHEET.complete && BOSS_SORCERER_SHEET.naturalWidth){
    // ЧЕРНОКНИЖНИК / НАВИЙ ВЛАДЫКА (4x4 Атлас 768x512)
    const ssw = Math.floor(BOSS_SORCERER_SHEET.naturalWidth / 4), ssh = Math.floor(BOSS_SORCERER_SHEET.naturalHeight / 4);
    let sfIdx = 0;
    if(e.dying > 0) sfIdx = 12 + Math.min(3, Math.floor((1 - Math.max(0, e.dying / (e.dieMax||1.25))) * 4));
    else if(e.atkT > 0) sfIdx = 4 + Math.min(3, Math.floor((1 - Math.max(0, e.atkT / (e.atkDur||0.55))) * 4));
    else if(e.howlT <= 1.2) sfIdx = 8 + (Math.floor(time * 6) % 4);
    else sfIdx = Math.floor(time * 5) % 4;
    const scol = sfIdx % 4, srow = Math.floor(sfIdx / 4);
    const drawW = e.drawH * 1.45, drawH = e.drawH * 1.45;
    ctx.save();
    if(flip){ ctx.translate(x, y + e.r*0.3); ctx.scale(-1, 1); ctx.drawImage(BOSS_SORCERER_SHEET, scol*ssw, srow*ssh, ssw, ssh, -drawW/2, -drawH*0.85, drawW, drawH); }
    else { ctx.drawImage(BOSS_SORCERER_SHEET, scol*ssw, srow*ssh, ssw, ssh, x - drawW/2, y + e.r*0.3 - drawH*0.85, drawW, drawH); }
    ctx.restore();
   } else if((e.type === 'vedmaT' || (e.elite && e.shaman)) && typeof BOSS_BABAYAGA_SHEET !== 'undefined' && BOSS_BABAYAGA_SHEET.complete && BOSS_BABAYAGA_SHEET.naturalWidth){
    // БАБА ЯГА / ВЕДЬМА ЧЁРНЫХ ТОПЕЙ (4x4 Атлас 768x512)
    const bsw = Math.floor(BOSS_BABAYAGA_SHEET.naturalWidth / 4), bsh = Math.floor(BOSS_BABAYAGA_SHEET.naturalHeight / 4);
    let bfIdx = 0;
    if(e.dying > 0) bfIdx = 12 + Math.min(3, Math.floor((1 - Math.max(0, e.dying / (e.dieMax||1.25))) * 4));
    else if(e.fireT > 0) bfIdx = 4 + (Math.floor(time * 6) % 4);
    else if(e.telegraphT > 0) bfIdx = 8 + (Math.floor(time * 6) % 4);
    else bfIdx = Math.floor(time * 5) % 4;
    const bcol = bfIdx % 4, brow = Math.floor(bfIdx / 4);
    const drawW = e.drawH * 1.4, drawH = e.drawH * 1.4;
    ctx.save();
    if(flip){ ctx.translate(x, y + e.r*0.3); ctx.scale(-1, 1); ctx.drawImage(BOSS_BABAYAGA_SHEET, bcol*bsw, brow*bsh, bsw, bsh, -drawW/2, -drawH*0.85, drawW, drawH); }
    else { ctx.drawImage(BOSS_BABAYAGA_SHEET, bcol*bsw, brow*bsh, bsw, bsh, x - drawW/2, y + e.r*0.3 - drawH*0.85, drawW, drawH); }
    ctx.restore();
   } else if(!((e.atkFrames&&drawBeastFrame(e,x,y+e.r*0.3,flip))||(_leshiyFrameReady&&e.frames&&drawSprite(e.frames,x,y+e.r*0.3,e.drawH,flip,e.at||0,e)))){
    const sz=e.r*(e.size||1);
    ctx.beginPath();ctx.arc(x,y,sz,0,7);ctx.fillStyle=e.flash>0?'#fff':e.col;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(150,190,180,.55)';ctx.stroke();
    ctx.fillStyle=e.eye;ctx.beginPath();ctx.arc(x-sz*.3,y-sz*.15,sz*.16,0,7);ctx.arc(x+sz*.3,y-sz*.15,sz*.16,0,7);ctx.fill();
   }
   // v5.73: выбеливание силуэта в момент смерти
   if(_df>0&&e.frames){
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=_df*0.85;
    drawSprite(e.frames,x,y+e.r*0.3,e.drawH,flip,e.at||0,e);
    ctx.globalAlpha=_df*0.5;
    drawSprite(e.frames,x,y+e.r*0.3,e.drawH*1.06,flip,e.at||0,e);
    ctx.restore();
   }
   if(e.type==='volkolak'&&e.hit<=0&&e.flash<=0)ctx.restore();
  }
  if(e.boss&&e.chargeTelegraph>0&&e.chargeDir){const k=e.chargeTelegraph;const tx=x+e.chargeDir.x*120,ty=y+e.chargeDir.y*120;ctx.save();ctx.globalAlpha=0.35+0.4*Math.sin(time*25);ctx.strokeStyle='#ff8a40';ctx.lineWidth=4;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(tx,ty-20);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
  if(e.boss&&e.chargeDir&&!e.chargeTelegraph){ctx.save();ctx.globalAlpha=0.25;ctx.strokeStyle='#ff4a3a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x+e.chargeDir.x*80,y+e.chargeDir.y*80-10);ctx.stroke();ctx.restore();}
  // v6.43 БЕЛЫЕ КРУГЛЯШИ. Игрок прислал скриншот: по всему экрану белые «яйца»
  // вместо врагов. Причина — альфа считалась как e.hit*4, а e.hit доходит до
  // 0.50 (в hitEnemy: 0.16+0.34*_wt, где _wt=1 при убийстве с одного удара).
  // 0.50*4 = АЛЬФА 2.0, вдвое выше максимума: сплошная белая заливка в режиме
  // lighter полностью перекрывала спрайт на 0.2-0.5 секунды. Замер живого боя:
  // до 5 таких пятен в кадре, в среднем 2 — именно они и видны на скриншоте.
  // Хуже всего это било по рядовым, которые гибнут с одного удара: враг не
  // умирал на глазах, а превращался в белый овал и так исчезал.
  // Чиним тремя правками:
  //   1) альфа ограничена 0.85 — вспышка подсвечивает, но не стирает силуэт;
  //   2) овал ужат до 0.11/0.18 от роста (был 0.16/0.26 — больше туловища);
  //   3) вспышка гаснет быстрее, чем длится сквош (кривая в квадрате).
  // v6.43: у ТРУПА круглого белого пятна быть не должно — за смерть отвечает
  // выбеливание силуэта (_df выше), которое повторяет форму спрайта.
  // Круг поверх трупа читался как «яйцо», потому что тело уже полупрозрачное.
  if(e.hit>0&&!(e.dying>0)){
   const _ha=Math.min(0.85,e.hit*e.hit*7);
   ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=_ha;
   ctx.fillStyle='#fff';ctx.beginPath();
   ctx.ellipse(x,y-e.drawH*0.28,e.drawH*0.11,e.drawH*0.18,0,0,TAU);ctx.fill();
   ctx.restore();
  }
  // v6.42 СТАТУСЫ НА ВРАГЕ. Было: два полупрозрачных кружка поверх туловища
  // (alpha 0.4/0.5) — на дефолтном зуме 0.4 это мутное пятно 5 экранных пикселей,
  // неотличимое от самого спрайта. Игрок не понимал, кто заморожен, кто отравлен,
  // и работают ли вообще стихии. Теперь у каждого статуса СВОЙ СИЛУЭТ,
  // читаемый по форме, а не по цвету: лёд — кристаллы-шипы, яд — пузыри,
  // замедление — тяжёлые цепи. Все три могут висеть одновременно и не сливаются.
  // v10.3 LOD: в густой толпе (>150) отсекаем статус-иконки у дальних рядовых врагов, экономя до 3000 операций холста в кадр
  if((e.frozen>0||e.poisoned>0||(e.slow||1)<0.92) && !(enemies.length > 150 && !e.boss && !e.elite && !e.mini && x*x+y*y > 40000)){
   const _sh=e.drawH||60, _fs=Math.max(1,Math.min(2.2,1/(ZOOM||1)*0.8));
   ctx.save();
   // ЛЁД: корка на туловище + острые кристаллы наружу. Мигает на исходе.
   if(e.frozen>0){
    const fade=e.frozen<0.5?(0.55+0.45*Math.sin(time*24)):1;   // предупреждение о конце
    // заливка ТОЛЬКО подкрашивает: при lighter+0.30 враг превращался
    // в белое пятно и переставал читаться как враг (проверено на скриншоте).
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=0.20*fade;ctx.fillStyle='#7fb8e8';
    ctx.beginPath();ctx.ellipse(x,y-_sh*0.28,_sh*0.22,_sh*0.34,0,0,TAU);ctx.fill();
    // v7.36: пять кристаллов рисовались пятью путями по шесть вызовов каждый —
    // тридцать операций на одного замороженного врага. Форма от врага не
    // зависела ничем, кроме поворота венка (e.x*0.03), поэтому венок испечён
    // целиком и ставится одним blit с поворотом. Вид тот же.
    ctx.globalCompositeOperation='lighter';
    ctx.globalAlpha=0.85*fade;
    const _ir=_sh*0.30*1.5, _id=_ir*2;
    // save/restore, а НЕ setTransform: слой врагов рисуется внутри смещения
    // тряски экрана, и сброс матрицы в базовую стёр бы её для всего дальнейшего.
    ctx.save();ctx.translate(x,y-_sh*0.28);ctx.rotate(e.x*0.03);
    ctx.drawImage(_iceCv,-_id/2,-_id/2,_id,_id);
    ctx.restore();
   }
   // ЯД: пузыри всплывают вверх — движение читается даже мелко.
   // Позиции детерминированы от координат врага, поэтому не «кипят» между кадрами.
   if(e.poisoned>0){
    ctx.globalCompositeOperation='source-over';
    for(let i=0;i<4;i++){
     const ph=(time*1.5+i*0.25+e.x*0.01)%1;     // 0→1 цикл подъёма
     const bx=x+Math.sin(i*2.4+e.y*0.05+ph*3)*_sh*0.16;
     const by=y-_sh*0.12-ph*_sh*0.55;
     const rr=(1.6+1.4*(1-ph))*_fs;
     ctx.globalAlpha=(1-ph)*0.85;
     // v7.36: beginPath+arc+fill на каждый пузырь — двенадцать вызовов на врага.
     // Пузырь испечён двух оттенков, рисуется одним blit.
     ctx.drawImage(i&1?_bubA:_bubB,bx-rr,by-rr,rr*2,rr*2);
    }
    ctx.globalAlpha=0.30;ctx.fillStyle='#6a9a3a';
    ctx.beginPath();ctx.ellipse(x,y-_sh*0.18,_sh*0.20,_sh*0.26,0,0,TAU);ctx.fill();
   }
   // ЗАМЕДЛЕНИЕ: не имело визуала ВООБЩЕ — игрок не видел, что паутина/тлен
   // работают. Тяжёлые тяжи тянут врага к земле, дрожат от натяжения.
   const sl=e.slow||1;
   if(sl<0.92){
    const st=(0.92-sl)/0.92;                    // 0..1 сила эффекта
    ctx.globalCompositeOperation='source-over';
    // Цвет тяжей был #7a6a4a — РОВНО цвет лесной подстилки, эффект тонул в фоне
    // (та же ошибка, что чинили у смерти врага в v6.41). Рисуем в два прохода:
    // чёрная подложка, поверх бледно-лиловая нить — читается на любом фоне.
    // v7.36: было два прохода по три нити, и каждая нить — свой beginPath со
    // stroke, то есть двадцать четыре вызова на врага. Тёмная подложка нужна
    // была, чтобы нить не тонула в подстилке; тот же результат даёт обводка
    // одним путём: собираем все три нити в ОДИН путь и штрихуем дважды.
    for(let pass=0;pass<2;pass++){
     ctx.globalAlpha=(pass===0?0.75:0.55+0.4*st);
     ctx.strokeStyle=pass===0?'rgba(10,6,14,0.9)':'#b9a8d8';
     ctx.lineWidth=(pass===0?3.0:1.3)*_fs;
     ctx.beginPath();
     for(let i=0;i<3;i++){
      const an=i*2.094+e.y*0.02;
      const jx=Math.sin(time*9+i)*1.2;          // дрожь натяжения
      ctx.moveTo(x+Math.cos(an)*_sh*0.16+jx,y-_sh*0.22);
      ctx.lineTo(x+Math.cos(an)*_sh*0.34,y+_sh*0.04);
     }
     ctx.stroke();
    }
    ctx.globalAlpha=0.34+0.3*st;ctx.fillStyle='#1a1024';
    ctx.beginPath();ctx.ellipse(x,y+_sh*0.04,_sh*0.26,_sh*0.09,0,0,TAU);ctx.fill();
   }
   ctx.restore();
  }
  // СПАВН-EFFECT: враг проявляется из тумана медленно и заметно
  if(e.spawnT>0){
   const sa=1-e.spawnT/2.5; // 0→1 за 2.5 сек
   // 1) Внешний пульсирующий круг тумана — виден издалека, яркий сначала
   ctx.save();
   const ringPulse=0.6+0.4*Math.sin(time*6);
   ctx.globalAlpha=(1-sa)*0.5*ringPulse;
   ctx.strokeStyle='#7fb04a';
   ctx.lineWidth=3;
   // v7.36: тут стоял shadowBlur — самая дорогая возможность холста: браузер
   // рисует фигуру в отдельную поверхность и размывает её, и вся эта работа
   // идёт мимо JS-замера. На 28-й минуте в состоянии спавна одновременно
   // десятки врагов. Свечение даёт вторая, более широкая и бледная линия —
   // на глаз то же мягкое кольцо, но без размытия.
   ctx.beginPath();
   ctx.ellipse(x,y+e.r*0.5,e.r*3.2*(0.7+0.3*sa),e.r*1.4*(0.7+0.3*sa),0,0,7);
   ctx.stroke();
   ctx.globalAlpha*=0.45;ctx.lineWidth=7;ctx.stroke();
   ctx.restore();
   // 2) Внутренний зелёный туман под врагом
   ctx.save();
   ctx.globalAlpha=(1-sa)*0.6+0.1;
   ctx.fillStyle='#3a4a2c';
   ctx.beginPath();
   ctx.ellipse(x,y+e.r*0.5,e.r*2*(0.5+0.5*sa),e.r*0.85*(0.5+0.5*sa),0,0,7);
   ctx.fill();
   ctx.restore();
   // 3) Враг проявляется полупрозрачным
   ctx.save();
   ctx.globalAlpha=sa*0.85;
   if(e.frames&&drawSprite(e.frames,x,y+e.r*0.3,e.drawH,flip,e.at||0,e)){
    // нарисовано
   }else{
    const sz=e.r*(e.size||1);
    ctx.beginPath();ctx.arc(x,y,sz,0,7);ctx.fillStyle=e.col;ctx.fill();
    ctx.fillStyle=e.eye;ctx.beginPath();ctx.arc(x-sz*.3,y-sz*.15,sz*.16,0,7);ctx.arc(x+sz*.3,y-sz*.15,sz*.16,0,7);ctx.fill();
   }
   ctx.restore();
   // 4) Вертикальные потоки "энергии" из земли (всё время fade-in)
   for(let i=0;i<3;i++){
    const a=time*4+i*2.1;
    const px2=x+Math.cos(a)*e.r*0.8;
    const py2=y-e.r*0.3+Math.sin(a*1.7)*e.r*0.3;
    ctx.save();
    ctx.globalAlpha=(1-sa)*0.4;
    ctx.fillStyle='#9ac06a';
    ctx.beginPath();
    ctx.arc(px2,py2,2,0,7);
    ctx.fill();
    ctx.restore();
   }
  }
 }
}
// v6.50 СВЕТОВОЙ СЛОЙ — главное отличие от эталона жанра.
// Замер кадра Vampire Survivors против нашего (пик боя, 52 врага):
//   VS:   чистый белый 15.06% площади, ярче 150 — 71% кадра
//   наш:  чистый белый  0.00%,          ярче 150 —  0.4%
// Причина не в числе эффектов, а в том, ЧТО они делают со сценой. У нас
// светились сами линии — тонкие кольца и искры поверх тёмной травы. В VS
// каждый источник ЗАЛИВАЕТ вокруг себя свет: под кучей эффектов земли почти
// не видно, экран сияет. Это и читается как «сочно».
// Рисуем мягкие пятна света от всех активных источников ПОД слоем эффектов,
// режим 'lighter' — свет складывается, и в гуще боя сцена реально светлеет.
// Градиенты кэшируются по цвету: createRadialGradient на каждый источник
// каждый кадр — самая дорогая операция canvas.
