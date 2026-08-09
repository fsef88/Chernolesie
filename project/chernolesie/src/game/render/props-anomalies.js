const ANOMALY_SPRITE_CHEST = (function(){const i=new Image(); i.src=CHEST_ART.src; return i;})();
const ANOMALY_SPRITE_ALTAR = ALTAR_WORLD_PROP_ART; // v7.22: Специальный изометрический 56x56 арт Алтаря для мира игры без фона
// v7.23: 100% Прозрачный спрайт Золотой Жилы без чёрного фона
const ANOMALY_SPRITE_GOLD = GOLD_VEIN_WORLD_PROP_ART;

function drawAnomalies(){
 for(const a of anomalies){
  if(a.claimed)continue;
  const ax=a.x-cam.x, ay=a.y-cam.y;
  if(Math.abs(ax-W/2)>W/2+60||Math.abs(ay-H/2)>H/2+60)continue;
  const t=time*2+a.x*0.01;
  const bob=Math.sin(t)*2.5;              // парение
  const pulse=0.5+0.5*Math.sin(t*1.6);
  ctx.save();
  ctx.translate(ax,ay+bob);
  // общая тень под находкой — привязывает предмет к земле
  ctx.globalAlpha=0.38;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(0,14-bob,13,4.5,0,0,TAU);ctx.fill();
  // ореол свечения: цвет по типу
  const col=a.type==='chest'?'#ffcf6a':a.type==='altar'?'#c9a0ff':'#ffe6a0';
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=0.16+0.12*pulse;
  const gg=ctx.createRadialGradient(0,0,2,0,0,26);
  gg.addColorStop(0,col);gg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gg;ctx.beginPath();ctx.arc(0,0,26,0,TAU);ctx.fill();
  ctx.globalCompositeOperation='source-over';
  ctx.globalAlpha=1;
  // v7.0: спрайтовая отрисовка аномалий
  // v7.3: Роскошная отрисовка находок в мире (крупный арт, луч света в небо и подпись!)
  const _aspr=a.type==='chest'?ANOMALY_SPRITE_CHEST:a.type==='altar'?ANOMALY_SPRITE_ALTAR:ANOMALY_SPRITE_GOLD;
  const _asw = a.type==='chest'?56 : (a.type==='altar'?56 : (a.type==='vein'?52 : 48));
  const _ash = a.type==='chest'?56 : (a.type==='altar'?56 : (a.type==='vein'?52 : 48));
   
  // Вертикальный луч света («Legendary Beam»), бьющий от находки вверх
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const _bmG=ctx.createLinearGradient(0,-10,0,-115);
  _bmG.addColorStop(0,col);
  _bmG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=_bmG;
  ctx.globalAlpha=0.38+0.22*Math.sin(time*3);
  ctx.beginPath();ctx.moveTo(-16,-4);ctx.lineTo(16,-4);ctx.lineTo(5,-115);ctx.lineTo(-5,-115);ctx.closePath();ctx.fill();
  // Светящийся рунический круг на земле
  ctx.beginPath();ctx.ellipse(0,14-bob,26,9,0,0,TAU);
  ctx.strokeStyle=col;ctx.lineWidth=1.8;ctx.globalAlpha=0.5+0.3*pulse;ctx.stroke();
  ctx.restore();

  if(_aspr&&_aspr.complete&&_aspr.naturalWidth){
   ctx.drawImage(_aspr,-_asw/2,-_ash/2-6,_asw,_ash);
  }else{
   ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,12,0,TAU);ctx.fill();
  }
   
  // Чёткая подпись над находкой («✦ СУНДУК ✦»), чтобы игрок издалека видел предмет!
  ctx.save();
  ctx.font='700 12px Monomakh, Georgia, serif';
  ctx.textAlign='center';
  ctx.fillStyle=col;
  ctx.shadowColor='#000';
  ctx.shadowBlur=6;ctx.shadowOffsetX=1;ctx.shadowOffsetY=1;
  const _lbl=a.type==='chest'?'✦ СУНДУК ✦':(a.type==='altar'?'⚡ АЛТАРЬ ⚡':'◆ ЖИЛА ◆');
  ctx.fillText(_lbl,0,-_ash/2-10);
  ctx.restore();
  ctx.restore();
 }
}
function drawProps(){
 // ДЕКОРАЦИИ: наземные пропсы — рисуем до зон/врагов/игрока (они «под ногами»).
 const _dcx=cam.x+W/2,_dcy=cam.y+H/2;
 const _bx0=Math.max(0,Math.floor((cam.x-320)/DBUCKET)),_bx1=Math.min(_dbN-1,Math.floor((cam.x+W+320)/DBUCKET));
 const _by0=Math.max(0,Math.floor((cam.y-320)/DBUCKET)),_by1=Math.min(_dbN-1,Math.floor((cam.y+H+320)/DBUCKET));
 for(let _by=_by0;_by<=_by1;_by++)for(let _bx=_bx0;_bx<=_bx1;_bx++){
  const _arr=_dbuckets[_by*_dbN+_bx];
  if(!_arr)continue;
  for(const d of _arr){
  if(Math.abs(d.x-_dcx)>W/2+320||Math.abs(d.y-_dcy)>H/2+320)continue;
  const im=d.im;
  if(!im.complete||im.broken||!im.naturalWidth)continue;
  // v6.47: потолок высоты применяем ЗДЕСЬ. В prop() он не работал —
  // декорации раскладываются до загрузки картинок, и naturalWidth там ещё 0.
  // Кэшируем результат в самом объекте, чтобы не считать каждый кадр.
  if(d._dw===undefined){
   const ar=im.naturalHeight/im.naturalWidth;
   let tw=d.tw;
   const maxH=(d.tw>180?150:d.tw>85?86:96);   // брёвна/заборы ниже, мелочь до 96
   if(tw*ar>maxH)tw=maxH/ar;
   d._dw=tw;d._dh=tw*ar;
  }
  const dw=d._dw,dh=d._dh;
  const dx=d.x-cam.x,dy=d.y-cam.y;
  // v6.64: мягкая тень под декорацией — эллипс, масштаб по высоте объекта
  ctx.save();
  ctx.globalAlpha=0.30;
  const _sw=dw*0.52,_sh=Math.max(3,dh*0.10);
  ctx.fillStyle='rgba(0,0,0,0.5)';
  ctx.beginPath();ctx.ellipse(dx,dy+2,_sw,_sh,0,0,TAU);ctx.fill();
  ctx.restore();
  if(d.flip){ctx.save();ctx.translate(dx,dy);ctx.scale(-1,1);ctx.drawImage(im,-dw/2,-dh*0.88,dw,dh);ctx.restore();}
  else ctx.drawImage(im,dx-dw/2,dy-dh*0.88,dw,dh);
  }
 }
 // gspots удалены — 240 arc-op/кадр съедали FPS (см. аудит #6)
 // зоны
 for(const z of zones){
  const zx=z.x-cam.x,zy=z.y-cam.y,k=Math.min(1,z.t/z.max);
  ctx.save();
  // v7.27: 100% Арт-ориентированные текстуры мандал для наземных зон оружия (Колокол, Роса Мокоши, Зерно, Венец)
  const drawSize = z.r * 2.2;
  if(z._bell && typeof KOLOKOL_AURA_ART !== 'undefined' && KOLOKOL_AURA_ART.complete && KOLOKOL_AURA_ART.naturalWidth){
   const bt=z._bt||0;
   const ph=1-Math.min(1,bt/1.2);
   const beat=Math.pow(ph,3);
  // v7.35: наземные мандалы рисуются ОБЫЧНЫМ смешиванием, а не сложением.
  // Они наполовину состоят из тёмного орнамента (41-56% тёмных пикселей), а
  // 'lighter' тёмное не рисует физически: на экране от мандалы оставался
  // ровный светящийся блин, весь рисунок пропадал. Та же беда, что была у
  // листа зоны косы.
   ctx.globalCompositeOperation='source-over';
   ctx.globalAlpha=k*(0.72+beat*0.28);
   ctx.drawImage(KOLOKOL_AURA_ART, zx - drawSize/2, zy - drawSize/2, drawSize, drawSize);
   // v7.36: поверх мандалы рисовались ещё три расходящихся кольца «звона» и
   // белый круг в момент удара. Мандала уже показывает круг набата целиком, а
   // кольца шли поверх её орнамента ровными окружностями — ровно тот случай,
   // когда геометрия поверх листа читается как поломка. Взвод удара остался:
   // его несёт дыхание прозрачности самой мандалы (beat в globalAlpha выше).
   ctx.restore();
   continue;
  }
  if(z._dew && typeof ROSA_AURA_ART !== 'undefined' && ROSA_AURA_ART.complete && ROSA_AURA_ART.naturalWidth){
   ctx.globalCompositeOperation='source-over';   // см. v7.35 выше: сложение съедало орнамент
   ctx.globalAlpha=k*0.88;
   ctx.drawImage(ROSA_AURA_ART, zx - drawSize/2, zy - drawSize/2, drawSize, drawSize);
   ctx.restore();
   continue;
  }
  if(z._seed && typeof ZERNO_AURA_ART !== 'undefined' && ZERNO_AURA_ART.complete && ZERNO_AURA_ART.naturalWidth){
   const grow=1-k;
   ctx.globalCompositeOperation='source-over';   // см. v7.35 выше: сложение съедало орнамент
   ctx.globalAlpha=k*(0.80+0.20*Math.abs(Math.sin(time*(4+grow*16))));
   ctx.drawImage(ZERNO_AURA_ART, zx - drawSize/2, zy - drawSize/2, drawSize, drawSize);
   ctx.restore();
   continue;
  }
  if(z._crown && typeof CROWN_AURA_ART !== 'undefined' && CROWN_AURA_ART.complete && CROWN_AURA_ART.naturalWidth){
   const st=z._st||0;
   ctx.globalCompositeOperation='source-over';   // см. v7.35 выше: сложение съедало орнамент
   ctx.globalAlpha=k*(0.76+st*0.24);
   ctx.drawImage(CROWN_AURA_ART, zx - drawSize/2, zy - drawSize/2, drawSize, drawSize);
   ctx.restore();
   continue;
  }
  if(z._fire && typeof FIREBALL_ANIM_SHEET !== 'undefined' && FIREBALL_ANIM_SHEET.complete && FIREBALL_ANIM_SHEET.naturalWidth){
   const prog = (time * 3.0 + z.x*0.01) % 1.0;
   const fIdx = Math.min(7, Math.floor(prog * 8));
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sx = col * 80, sy = row * 80, sw = 80, sh = 80;
   ctx.globalCompositeOperation = 'lighter';
   ctx.globalAlpha = Math.max(0, 0.9 * k);
   ctx.drawImage(FIREBALL_ANIM_SHEET, sx, sy, sw, sh, zx - drawSize/2, zy - drawSize/2, drawSize, drawSize);
   ctx.restore();
   continue;
  }
  // v7.13: Ядовитое Облако Мораны — только для обычной ядовитой зоны (когда нет специальных флагов)
  if(!z._bell && !z._dew && !z._seed && !z._crown && !z._fire && !z._ring && !z._mirror && !z._grave && !z._hunger && !z._whirl && typeof POISON_ANIM_SHEET !== 'undefined' && POISON_ANIM_SHEET.complete && POISON_ANIM_SHEET.naturalWidth){
   const prog = Math.min(1, (z.max - z.t) / z.max);
   const fIdx = Math.min(7, Math.floor(prog * 8));
   const col = fIdx % 4, row = Math.floor(fIdx / 4);
   const sx = col * 80, sy = row * 80, sw = 80, sh = 80;
   ctx.globalCompositeOperation = 'lighter';
   ctx.globalAlpha = Math.max(0, 0.85 * k);
   ctx.drawImage(POISON_ANIM_SHEET, sx, sy, sw, sh, zx - drawSize/2, zy - drawSize/2, drawSize, drawSize);
   ctx.restore();
   continue;
  }
if(z._bell){
   // v12.0 (аудит): процедурный «вайрфрейм» колокола УДАЛЁН по просьбе автора:
   // ровные окружности, расходящиеся волны, лучи-спицы и насечки поверх поля
   // читались как отладочная сетка. Теперь зона видна только мягким золотым
   // дыханием (без единой линии) + арт-мандала выше, если она декодировалась.
   const bt=z._bt||0;
   const ph=1-Math.min(1,bt/1.2);
   const beat=Math.pow(ph,3);
   ctx.globalCompositeOperation='lighter';
   ctx.globalAlpha=k*(0.10+beat*0.16);
   const gb=ctx.createRadialGradient(zx,zy,z.r*0.15,zx,zy,z.r);
   gb.addColorStop(0,'rgba(255,225,150,0.35)');
   gb.addColorStop(0.75,z._evo?'rgba(255,190,90,0.22)':'rgba(220,170,70,0.18)');
   gb.addColorStop(1,'rgba(80,50,10,0)');
   ctx.fillStyle=gb;ctx.beginPath();ctx.arc(zx,zy,z.r,0,TAU);ctx.fill();
   ctx.restore();
   continue;
  }
else{ctx.restore();continue;}   // v12.0 (аудит): процедурные контурные фолбэки зон отключены — остаётся мягкое свечение нижнего слоя
  if(false){ // мёртвая ветка: бывший «вайрфрейм» (кольца/лучи/спирали)
  }
  else if(z._ring){
   // v6.17: ОБЕРЕГ — расходящееся кольцо-волна
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*0.75;
   ctx.strokeStyle=z._evo?'#ffd27a':'#9fd8ff';ctx.lineWidth=z._evo?5:3;
   ctx.shadowColor=z._evo?'#ffcf6a':'#8fd0ff';ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(zx,zy,z.r*(1.25-k*0.25),0,7);ctx.stroke();
   ctx.globalAlpha=k*0.3;ctx.lineWidth=1.5;
   ctx.beginPath();ctx.arc(zx,zy,z.r*(1.05-k*0.15),0,7);ctx.stroke();
  }else if(z._crown){
   // v6.17c: ВЕНЕЦ — кольцо шипов, ярче с ростом серии
   const st=z._st||0;
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*(0.35+st*0.5);
   ctx.strokeStyle=z._evo?'#ffd0f0':'#e0d0b0';ctx.lineWidth=1.6+st*2;
   ctx.shadowColor=z._evo?'#ff9ad0':'#ffe0a0';ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(zx,zy,z.r,0,7);ctx.stroke();
   const spikes=6+Math.round(st*10);
   ctx.lineWidth=1.2+st;
   for(let q=0;q<spikes;q++){
    const an=q*(6.283/spikes)+time*1.5;
    ctx.beginPath();
    ctx.moveTo(zx+Math.cos(an)*z.r*0.9,zy+Math.sin(an)*z.r*0.9);
    ctx.lineTo(zx+Math.cos(an)*z.r*(1.08+st*0.12),zy+Math.sin(an)*z.r*(1.08+st*0.12));
    ctx.stroke();
   }
  }else if(z._mirror){
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*0.8;
   ctx.strokeStyle=z._evo?'#ffe0ff':'#d8f0ff';ctx.lineWidth=3;
   ctx.shadowColor='#a0d8ff';ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(zx,zy,z.r*(1.3-k*0.3),0,7);ctx.stroke();
   ctx.globalAlpha=k*0.35;ctx.lineWidth=8;
   ctx.beginPath();ctx.arc(zx,zy,z.r*(1.15-k*0.2),0,7);ctx.stroke();
  }else if(z._grave){
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*0.7;
   ctx.strokeStyle=z._evo?'#c9a0ff':'#9aa0b0';ctx.lineWidth=2;
   ctx.shadowColor=z._evo?'#c9a0ff':'#8a90a0';ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(zx,zy,z.r*(0.6+(1-k)*0.5),0,7);ctx.stroke();
   ctx.globalAlpha=k*0.5;
   for(let q=0;q<5;q++){const an=q*1.2566+time*0.8;
    ctx.beginPath();ctx.moveTo(zx,zy);
    ctx.lineTo(zx+Math.cos(an)*z.r*0.8,zy+Math.sin(an)*z.r*0.8);ctx.stroke();}
  }else if(z._hunger){
   const h=z._h||0;
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*(0.3+h*0.5);
   const g3=ctx.createRadialGradient(zx,zy,z.r*0.3,zx,zy,z.r);
   g3.addColorStop(0,'rgba(0,0,0,0)');
   g3.addColorStop(0.7,z._evo?'rgba(180,80,220,0.5)':'rgba(120,160,60,0.45)');
   g3.addColorStop(1,'rgba(0,0,0,0)');
   ctx.fillStyle=g3;ctx.beginPath();ctx.arc(zx,zy,z.r,0,7);ctx.fill();
   ctx.globalAlpha=k*(0.4+h*0.6);ctx.strokeStyle=z._evo?'#e0a0ff':'#b0d070';ctx.lineWidth=1.4+h*2;
   ctx.beginPath();ctx.arc(zx,zy,z.r*0.95,0,7);ctx.stroke();
  }else if(z._seed){
   // v6.17b: ЗЕРНО — пульсирует всё быстрее к моменту всхода
   const grow=1-k;
   ctx.globalCompositeOperation='lighter';
   ctx.globalAlpha=0.3+0.5*Math.abs(Math.sin(time*(4+grow*16)));
   ctx.strokeStyle=z._evo?'#c9a0ff':'#9ad06a';ctx.lineWidth=2;
   ctx.shadowColor=z._evo?'#c9a0ff':'#9ad06a';ctx.shadowBlur=0;
   ctx.beginPath();ctx.arc(zx,zy,z._r*(0.25+grow*0.75),0,7);ctx.stroke();
   ctx.globalAlpha=0.8;ctx.fillStyle=z._evo?'#c9a0ff':'#9ad06a';
   ctx.beginPath();ctx.arc(zx,zy,3.5,0,7);ctx.fill();
  }else if(z._whirl){
   // v6.17b: ВИХРЬ — спираль
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*0.6;
   ctx.strokeStyle=z._evo?'#d8f0ff':'#a8d8f0';ctx.lineWidth=2;
   for(let arm=0;arm<3;arm++){
    ctx.beginPath();
    for(let t2=0;t2<6.0;t2+=0.25){
     const rr=z.r*(t2/6.0),an=t2*1.8+arm*2.094-time*7;
     const px=zx+Math.cos(an)*rr,py=zy+Math.sin(an)*rr;
     if(t2===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.stroke();
   }
  }else if(z._dew){
   // v6.17b: РОСА — мягкое зелёное свечение
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*0.4;
   const g2=ctx.createRadialGradient(zx,zy,0,zx,zy,z.r);
   g2.addColorStop(0,'rgba(160,255,160,0.5)');
   g2.addColorStop(1,'rgba(60,180,90,0)');
   ctx.fillStyle=g2;ctx.beginPath();ctx.arc(zx,zy,z.r,0,7);ctx.fill();
   ctx.globalAlpha=k*0.7;ctx.strokeStyle=z._evo?'#c0ffd0':'#8fff8a';ctx.lineWidth=1.4;
   ctx.beginPath();ctx.arc(zx,zy,z.r*0.9,0,7);ctx.stroke();
  }else if(z._fire){
    // v7.15: 8-кадровая анимация солнечного огненного шара и вихря пепла из атласа FIREBALL_ANIM_SHEET
    if(typeof FIREBALL_ANIM_SHEET !== 'undefined' && FIREBALL_ANIM_SHEET.complete && FIREBALL_ANIM_SHEET.naturalWidth){
      const prog = (time * 3.0 + z.x*0.01) % 1.0;
      const fIdx = Math.min(7, Math.floor(prog * 8));
      const col = fIdx % 4, row = Math.floor(fIdx / 4);
      const sx = col * 80, sy = row * 80, sw = 80, sh = 80;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, 0.9 * k);
      const drawSize = z.r * 2.2;
      ctx.drawImage(FIREBALL_ANIM_SHEET, sx, sy, sw, sh, zx - drawSize/2, zy - drawSize/2, drawSize, drawSize);
      ctx.restore();
      continue;
    }
   // v6.17: УГЛИ — тлеющее пятно с рваной кромкой
   ctx.globalCompositeOperation='lighter';ctx.globalAlpha=k*0.5;
   const g=ctx.createRadialGradient(zx,zy,0,zx,zy,z.r);
   g.addColorStop(0,z._evo?'#fff0c0':'#ffb45a');
   g.addColorStop(0.5,z._evo?'#ff9a3c':'#d0542a');
   g.addColorStop(1,'rgba(60,20,10,0)');
   ctx.fillStyle=g;ctx.beginPath();ctx.arc(zx,zy,z.r,0,7);ctx.fill();
   ctx.globalAlpha=k*0.75;ctx.strokeStyle=z._evo?'#ffd27a':'#ff8a3c';ctx.lineWidth=1.6;
   ctx.beginPath();
   for(let a=0;a<6.283;a+=0.5){const rr=z.r*(0.72+0.14*Math.sin(a*3+time*5+z.x));
    const px=zx+Math.cos(a)*rr,py=zy+Math.sin(a)*rr;
    if(a===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
   ctx.closePath();ctx.stroke();
  }else{
   // v6.44 ЯДОВИТОЕ ОБЛАКО. Было: сплошной зелёный круг с shadowBlur — самая
   // заметная зона в игре (яд висит на экране постоянно) и при этом полностью
   // плоская. Игрок прислал скриншот: «зелёные круги — очень слабые эффекты».
   // Никакой формы, никакого движения, ровная заливка поверх травы.
   // Теперь клубящееся облако: рваная кромка дышит, внутри всплывают споры,
   // ядро пульсирует. Рисуется примитивами, спрайт не нужен.
   const _pev=z._evo;
   const _pc1=_pev?'rgba(190,120,255,':'rgba(150,210,90,';
   const _pc2=_pev?'#c9a0ff':'#9ad06a';
   // (1) мягкое ядро — градиент вместо плоской заливки
   const gp=ctx.createRadialGradient(zx,zy,0,zx,zy,z.r);
   gp.addColorStop(0,_pc1+(0.34*k)+')');
   gp.addColorStop(0.55,_pc1+(0.20*k)+')');
   gp.addColorStop(1,_pc1+'0)');
   ctx.globalAlpha=1;ctx.fillStyle=gp;
   ctx.beginPath();ctx.arc(zx,zy,z.r,0,TAU);ctx.fill();
   // (2) КЛУБЫ: рваная кромка из наложенных долей, каждая дышит своей фазой.
   //     Именно эта неровность и отличает облако от «круга».
   ctx.globalAlpha=k*0.30;ctx.fillStyle=_pc2;
   const _pn=7;
   for(let i=0;i<_pn;i++){
    const an=i*(TAU/_pn)+z.x*0.01+time*0.35;
    const br=z.r*(0.42+0.10*Math.sin(time*1.7+i*1.9));
    const bd=z.r*(0.52+0.12*Math.sin(time*1.1+i*2.7));
    ctx.beginPath();ctx.arc(zx+Math.cos(an)*bd,zy+Math.sin(an)*bd,br,0,TAU);ctx.fill();
   }
   // (3) кромка — рваный контур, а не ровная окружность
   ctx.globalAlpha=k*0.55;ctx.strokeStyle=_pc2;ctx.lineWidth=1.6;
   ctx.beginPath();
   for(let a2=0;a2<=TAU+0.01;a2+=0.14){
    const rr=z.r*(0.90+0.10*Math.sin(a2*3.7+time*1.6+z.x*0.02));
    const px2=zx+Math.cos(a2)*rr,py2=zy+Math.sin(a2)*rr;
    if(a2===0)ctx.moveTo(px2,py2);else ctx.lineTo(px2,py2);
   }
   ctx.closePath();ctx.stroke();
   // (4) СПОРЫ всплывают вверх — движение читается даже боковым зрением.
   //     Позиции детерминированы от координат зоны, между кадрами не «кипят».
   ctx.globalAlpha=k*0.75;ctx.fillStyle=_pev?'#e0c9ff':'#c9e08a';
   const _sn=Math.min(9,3+Math.floor(z.r/26));
   for(let i=0;i<_sn;i++){
    const ph=(time*0.5+i*0.137+z.x*0.005)%1;      // 0..1 подъём
    const sa=i*2.399+z.y*0.01;
    const sx2=zx+Math.cos(sa)*z.r*(0.25+0.55*((i*7)%5)/5);
    const sy2=zy+Math.sin(sa)*z.r*0.42-ph*z.r*0.75;
    ctx.globalAlpha=k*(1-ph)*0.8;
    ctx.beginPath();ctx.arc(sx2,sy2,1.4+1.8*(1-ph),0,TAU);ctx.fill();
   }
  }
  ctx.restore();}
 // хазарды
 for(const h of hazards){const hx=h.x-cam.x,hy=h.y-cam.y;if(Math.abs(hx)>W+80||Math.abs(hy)>H+80)continue;ctx.save();
  const isRing=h.kind==='ring';
  if(h.state==='tele'){
   const tmax=isRing?0.85:0.9; const k=1-h.t/tmax;
   ctx.globalAlpha=0.5+0.35*Math.abs(Math.sin(time*18));
   ctx.strokeStyle=isRing?'#ff6a8a':'#ff7a3c'; ctx.lineWidth=isRing?4:3;
   ctx.beginPath(); ctx.arc(hx,hy,Math.max(8,h.r*(isRing?1:(0.45+0.55*k))),0,7); ctx.stroke();
   if(!isRing){ctx.globalAlpha=0.2;ctx.fillStyle='#ff7a3c';ctx.beginPath();ctx.arc(hx,hy,h.r*k*0.5,0,7);ctx.fill();}
   ctx.restore();continue;
  }
  const k=h.life/h.max;
  const _hk=h.life<=0.35?h.life/0.35:1;
  const ex=hx+Math.sin(h.born*3+time*0.5)*h.r*0.06;
  const ey=hy+Math.cos(h.born*2+time*0.4)*h.r*0.06;
  ctx.translate(ex,ey);
  if(!isRing && typeof HAZARD_TRAP_ART !== 'undefined' && HAZARD_TRAP_ART.complete && HAZARD_TRAP_ART.naturalWidth){
   const drawSize = h.r * 2.2;
   ctx.globalCompositeOperation='lighter';
   ctx.globalAlpha = Math.min(1, _hk * 0.9);
   ctx.drawImage(HAZARD_TRAP_ART, -drawSize/2, -drawSize/2, drawSize, drawSize);
  } else {
   ctx.beginPath();ctx.arc(0,0,h.r,0,TAU);ctx.fill();
  }
  ctx.restore();
 }
 // гемы
 // v5.99: КРИСТАЛЛЫ — самое дорогое место отрисовки. Раньше на каждый гем шёл
 // ctx.shadowBlur=10 плюс save/translate/scale/restore и заливка пути. Лимит пула —
 // 80 гемов, то есть до 80 размытий за кадр. shadowBlur заставляет браузер рисовать
 // фигуру в отдельную поверхность и размывать её — это в разы дороже обычной заливки,
 // и на бюджетном Android именно здесь уходили миллисекунды.
 // Решение — тот же приём, которым в v5.29 запекли тайлы земли (_gtVar): свечение
 // печём ОДИН раз на цвет в оффскрин-канвас, дальше за кадр только drawImage.
 // Вид не меняется: размытие то же, масштаб pop-анимации даёт scale самой картинки.
 // v8.5: culling для кристаллов опыта (не рисуем за экраном)
 for(const g of ACTIVE.gems){
  const _gx=g.x-cam.x,_gy=g.y-cam.y;
  if(_gx<-70||_gy<-70||_gx>W+70||_gy>H+70)continue;
  const s=Math.min(1,(g.pop||0)*6),bob=Math.sin(time*4+g.x*0.05)*2;
  const sp=gemSprite(g.col,g.sc||1);
  const w=sp.width*s,h=sp.height*s;
  ctx.drawImage(sp,g.x-cam.x-w/2,g.y-cam.y-6+bob-h/2,w,h);
 }
}
