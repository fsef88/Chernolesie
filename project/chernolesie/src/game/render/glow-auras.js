const _glowCache={};
function glowSprite(col){
 let c=_glowCache[col];
 if(c)return c;
 const R=64;
 c=document.createElement('canvas');c.width=c.height=R*2;
 const g=c.getContext('2d');
 const gr=g.createRadialGradient(R,R,0,R,R,R);
 // Центр — ЧИСТЫЙ БЕЛЫЙ, не цвет. В эталоне 15% кадра выбито в #ffffff:
 // сильный свет всегда уходит в белый, а оттенок виден только по кромке
 // ореола. Если лить цветом, получается «цветной туман», а не свет.
 // Белое ядро держим МАЛЕНЬКИМ: при десятке наложенных вспышек 'lighter'
 // складывает их в сплошное молоко и врагов не видно (проверено скриншотом).
 // Сердцевина белая, но уже с 8% радиуса идёт цвет — свет остаётся цветным.
 gr.addColorStop(0,   '#ffffff');
 gr.addColorStop(0.08,col);
 gr.addColorStop(0.40,col.length===7?col+'55':col);
 gr.addColorStop(1,   col.length===7?col+'00':'rgba(0,0,0,0)');
 g.fillStyle=gr;g.beginPath();g.arc(R,R,R,0,TAU);g.fill();
 _glowCache[col]=c;
 return c;
}
// ============================================================
// v7.5: ПОСТОЯННОЕ ВИЗУАЛЬНОЕ ПРИСУТСТВИЕ ОРУЖИЯ (Auras, Mandalas & Orbit Trails)
// ============================================================
// v7.5: ПОСТОЯННОЕ ВИЗУАЛЬНОЕ ПРИСУТСТВИЕ ОРУЖИЯ (Painted Aura Texture instead of code!)
function drawPermanentAuras(px, py){
  if(typeof weapons==='undefined'||!weapons)return;
  const hasIdol=weapons.find(w=>w.id==='idol');
  const hasObereg=weapons.find(w=>w.id==='obereg');
  
  // 1) ИДОЛ / ЧЕСНОЧНАЯ АУРА («Солнечная Мандала Заставы») — нарисованная текстура вместо кода!
  if(hasIdol){
    const lvl=wLvl('idol')||1;
    const evo=hasIdol.evo;
    const R=(130+22*lvl)*wArea('idol')*(P.synIdolRope?1.35:1);
    ctx.save();
    ctx.translate(px,py);
    // v7.35: мандала рисуется ОБЫЧНЫМ смешиванием. В ней 71% тёмных пикселей —
    // при сложении почти весь рисунок не появлялся вовсе, оставалось светлое
    // кольцо, и вместе со щитом Оберега и кольцом состояния это давало вокруг
    // героя кашу из наложенных окружностей. Щит Оберега остаётся на сложении:
    // у него тёмных пикселей 0%, это чистое свечение, и там сложение родное.
    ctx.globalCompositeOperation='source-over';
    ctx.globalAlpha=0.60+0.16*Math.sin(time*2.5);
    ctx.rotate(time*0.35);
    if(typeof AURA_ART_IDOL !== 'undefined' && AURA_ART_IDOL.complete && AURA_ART_IDOL.naturalWidth){
      const diam = R * 2.2;
      ctx.drawImage(AURA_ART_IDOL, -diam/2, -diam/2, diam, diam);
      if(evo){
        // При Эволюции накладываем вторую встречно-вращающуюся ауру с огненным оттенком
        ctx.rotate(-time*0.8);
        ctx.globalAlpha=0.5+0.2*Math.sin(time*4);
        ctx.drawImage(AURA_ART_IDOL, -diam*0.55, -diam*0.55, diam*1.1, diam*1.1);
      }
    } else {
      ctx.strokeStyle='#c9a04a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,R,0,TAU); ctx.stroke();
    }
    ctx.restore();
  }

  // 2) ОБЕРЕГ («Рунический Купол Защиты») — нарисованный арт вместо кода
  if(hasObereg){
    const lvl=wLvl('obereg')||1;
    const R=65+8*lvl;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.translate(px,py);
    ctx.rotate(-time*1.2);
    if(typeof OBEREG_SHIELD_ART !== 'undefined' && OBEREG_SHIELD_ART.complete && OBEREG_SHIELD_ART.naturalWidth){
     const diam = R * 2.1;
     ctx.globalAlpha=0.75+0.25*Math.sin(time*3);
     ctx.drawImage(OBEREG_SHIELD_ART, -diam/2, -diam/2, diam, diam);
    } else {
     ctx.strokeStyle='rgba(143,208,255,0.65)';
     ctx.lineWidth=2.2;
     ctx.beginPath();ctx.arc(0,0,R,0,TAU);ctx.stroke();
     ctx.setLineDash([8,12]);
     ctx.strokeStyle='rgba(255,207,106,0.75)';
     ctx.beginPath();ctx.arc(0,0,R+6,0,TAU);ctx.stroke();
    }
    ctx.restore();
  }
}

function drawWeaponTrails(px, py){
  // 1) ШЛЕЙФ ВЗМАХА МЕЧА (200-градусная сияющая дуга при ударе)
  if(window._swordSlash&&window._swordSlash.t>0){
    const s=window._swordSlash;
    s.t-=1/60;
    const alpha=Math.max(0, s.t/s.maxT);
    const reach=s.reach;
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    ctx.translate(px,py);
    ctx.rotate(s.ang);
    ctx.globalAlpha=alpha;
    // v7.10: 8-кадровая анимация славянского взмаха из атласа SLASH_ANIM_SHEET (сетка 4x2)
    const progress = 1 - Math.max(0, s.t/s.maxT);
    if(typeof SLASH_ANIM_SHEET !== 'undefined' && SLASH_ANIM_SHEET.complete && SLASH_ANIM_SHEET.naturalWidth){
      const fIdx = Math.min(7, Math.floor(progress * 8));
      const col = fIdx % 4, row = Math.floor(fIdx / 4);
      // размер кадра берётся из самого листа: жёстко зашитые 80px не совпадали ни с одним атласом
      const sw = Math.floor(SLASH_ANIM_SHEET.naturalWidth / 4);
      const sh = Math.floor(SLASH_ANIM_SHEET.naturalHeight / 2);
      const sx = col * sw, sy = row * sh;
      const drawSize = reach * 1.8;
      ctx.drawImage(SLASH_ANIM_SHEET, sx, sy, sw, sh, -drawSize*0.35, -drawSize*0.5, drawSize, drawSize);
    } else {
      ctx.strokeStyle='#ffe49e'; ctx.lineWidth=6; ctx.beginPath(); ctx.arc(0,0,reach,-1.75,1.75); ctx.stroke();
    }
    ctx.restore();
  }

  // 2) СВЕТОВЫЕ ШЛЕЙФЫ ВРАЩАЮЩЕЙСЯ КОСЫ И ОРБИТ
  if(typeof idols!=='undefined'&&idols.length){
    ctx.save();
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<idols.length;i++){
      const t=idols[i],tx=t.x-cam.x,ty=t.y-cam.y;
      ctx.fillStyle=t.evo ? '#ffd77d' : '#8fd0ff';
      ctx.globalAlpha=0.6;
      ctx.beginPath();ctx.arc(tx,ty,8,0,TAU);ctx.fill();
    }
    ctx.restore();
  }
}
function drawGlowLayer(){
 const S=Math.max(1,Math.min(2.4,1/(ZOOM||1)*0.85));
 ctx.save();
 ctx.globalCompositeOperation='lighter';
 // v6.50 ЗАРЕВО СЕРИИ. В VS ощущение мощи РАСТЁТ по ходу забега: чем гуще
 // мясорубка, тем светлее экран. У нас серия убийств (killCombo) считалась,
 // но выражалась только строчкой в логе — игрок не чувствовал разгона.
 // Теперь под героем разгорается зарево цвета его класса.
 {const kc=(typeof killCombo!=='undefined'?killCombo:0);
  if(kc>3){
   const k=Math.min(1,(kc-3)/45);
   const cv=(typeof CLASS_VISUALS!=='undefined'?(CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior):null);
   const r=(46+70*k)*S;
   ctx.globalAlpha=0.10+0.20*k;
   ctx.drawImage(glowSprite(cv?cv.color:'#ffcf6a'),P.x-cam.x-r,P.y-cam.y-r,r*2,r*2);
  }}
 // вспышки — самый мощный источник
 for(const f of ACTIVE.flashes){
  const a=f.t/f.max, w=(f.w!=null?f.w:(f.big?1:0));
  const r=(30+40*w)*(0.5+0.5*(1-a))*S;
  ctx.globalAlpha=Math.min(0.52,a*(0.26+0.30*w));
  const sp=glowSprite(f.color);
  ctx.drawImage(sp,f.x-cam.x-r,f.y-cam.y-r,r*2,r*2);
 }
 // частицы: каждая светит слабо, но их сотни — вместе дают зарево
 for(const p of ACTIVE.particles){
  const al=Math.max(0,p.life/p.max);
  if(al<0.15)continue;
  const r=14*al*S;
  ctx.globalAlpha=al*0.15;
  ctx.drawImage(glowSprite(p.c),p.x-cam.x-r,p.y-cam.y-r,r*2,r*2);
 }
 // зоны — постоянный источник под ногами
 for(const z of zones){
  const k=Math.min(1,z.t/z.max);
  const col=z._bell?'#ffd77d':z._fire?'#ff9a3c':z._ring?'#9fd8ff':
            z._seed?'#9ad06a':z._dew?'#8fff8a':z._whirl?'#a8d8f0':'#9ad06a';
  const r=z.r*0.95;
  ctx.globalAlpha=k*0.16;
  ctx.drawImage(glowSprite(col),z.x-cam.x-r,z.y-cam.y-r,r*2,r*2);
 }
 // ловушки чащи — опасность должна светиться
 for(const h of hazards){
  if(h.state!=='active'||(h.dmg|0)<=0)continue;
  const r=h.r*0.9;
  ctx.globalAlpha=0.22;
  ctx.drawImage(glowSprite('#ff8a3c'),h.x-cam.x-r,h.y-cam.y-r,r*2,r*2);
 }
 ctx.restore();
}
