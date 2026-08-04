const _HRIG={};
// v6.7: у листа спрайтов два возможных качества, и от него зависит способ отрисовки.
//  • КАНОН — единый холст на все кадры и ступни на одной линии. Тогда художник сам
//    задал центр тяжести, перенос веса в ходьбе и выпад в атаке: движку нельзя
//    ничего нормализовать, надо ставить холст как есть. Из семи классов этому
//    отвечает ТОЛЬКО Волхв (один холст 189×253, разброс линии пола 1 px).
//  • СЫРОЙ — холсты разного размера (у Воина 15 разных, разброс линии пола 120 px).
//    Тут без нормализации не обойтись, остаются костыли v6.6: постоянный масштаб
//    класса и привязка по ступням.
// Высота персонажа для канона берётся ТОЛЬКО по кадрам стойки и ходьбы: в кадрах
// атаки и ульты силуэт раздут эффектами до края холста (у Волхва f_15 упирается
// в самый верх), и по ним масштаб вышел бы вдвое мельче нужного.
function heroRig(cls){
 const cached=_HRIG[cls];
 if(cached&&cached.full)return cached;
 const H=heroSpr(cls), L=HERO_LAYOUT[cls]||HERO_LAYOUT.warrior;
 let maxBh=0,maxBw=0,seen=0,w0=0,h0=0,uniform=true,baseMin=2,baseMax=-1;
 for(const im of H){
  if(!im||!im.complete||im.broken||!im.naturalWidth)continue;
  const m=heroMet(im); if(!m.ok)continue;
  seen++;
  if(!w0){w0=im.naturalWidth;h0=im.naturalHeight;}
  else if(im.naturalWidth!==w0||im.naturalHeight!==h0)uniform=false;
  if(m.y1<baseMin)baseMin=m.y1;
  if(m.y1>baseMax)baseMax=m.y1;
  const bh=(m.y1-m.y0)*im.naturalHeight, bw=(m.x1-m.x0)*im.naturalWidth;
  if(bh>maxBh)maxBh=bh;
  if(bw>maxBw)maxBw=bw;
 }
 if(!seen)return cached||{ok:false,full:false};
 const full=seen===H.length;
 // heroMet сканирует силуэт сеткой 64×64 — допуск на линию пола один шаг сетки.
 const canon=uniform&&full&&(baseMax-baseMin)<=1.6/64;
 let charH=0,baseY=0;
 if(canon){
  baseY=baseMax;
  let top=1;
  for(const fi of [].concat(L.idle||[],L.walk||[])){
   const im=H[fi-1]; if(!im)continue;
   const m=heroMet(im); if(!m.ok)continue;
   if(m.y0<top)top=m.y0;
  }
  charH=Math.max(1,(baseY-top)*h0);
 }
 const rig={ok:true,full,canon,maxBh,maxBw,charH,baseY,iw:w0,ih:h0};
 _HRIG[cls]=rig;
 return rig;
}
const HERO_SPR={};
function heroSpr(cls){
 if(!cls||!BOGATYR_CONFIG[cls])cls='warrior';
 if(!HERO_SPR[cls])HERO_SPR[cls]=frames('Heroes',cls[0].toUpperCase()+cls.slice(1)+'_norm/f_',1,(HERO_LAYOUT[cls]?HERO_LAYOUT[cls].n:16));
 return HERO_SPR[cls];
}
const HERO_LAYOUT={warrior:{idle:[1,2,3,4],walk:[3,4,5,6,7,8,7,6],atk:[7,8,11,12,13,14],n:16},druid:{idle:[1,2,3,4],walk:[1,2,3,4,5,6,5,4],atk:[3,8,12,13,14,15],n:16},rogue:{idle:[1,2,3,4],walk:[13,14,6,7,8,9,10,9],atk:[8,3,9,11,12,13],n:16},shaman:{idle:[9,10],walk:[2,3,4,5,6,7,8,1],atk:[11,12,13,14],ult:[15,16],ultSeq:[15,15,16,16,16,16,14,11,10],atkHit:0.12,n:16},archer:{idle:[1,16,15,14],walk:[1,16,15,14,13,12,13,14],atk:[9,12,2,3,4,5],n:16},ognevik:{idle:[1,2,3,4],walk:[1,2,3,4,5,6,5,4],atk:[13,9,8,3,2,1],n:16},groznik:{idle:[1,2,3,4],walk:[1,2,3,4,5,6,5,4],atk:[2,3,15,14,13,12],n:16}}; // v5.48: живые Знахарка/Страж + новый Грозник
// v5.60: КОНТРОВОЙ СВЕТ ГЕРОЯ — отрыв силуэта от фона.
// Мягкая тень цветом класса (обычное смешивание, не 'lighter' — не даёт кислоты)
// плюс подъём хромы внутри силуэта через soft-light.
const HERO_RIM={glow:0,blurK:0.08,passes:1,lift:0.00};   // v6.68: glow=0 — статичное свечение убрано, остаётся внешнее умное // lift: подъём хромы внутри силуэта, по замерам почти не даёт — оставлен ручкой
const _rimTint=new Map();
function heroTintSil(im,col){
 let c=_rimTint.get(im);
 if(!c||c.col!==col){
  const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;
  const g=cv.getContext('2d');g.drawImage(im,0,0);
  g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,cv.width,cv.height);
  c={cv:cv,col:col};_rimTint.set(im,c);
 }
 return c.cv;
}
function heroRimDraw(im,dx,dy,dw,dh,col,blur){
 const R=HERO_RIM;
 if(R.glow>0&&blur>0){
  ctx.save();ctx.shadowColor=col;ctx.shadowBlur=blur;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  ctx.globalAlpha=R.glow;
  for(let i=0;i<R.passes;i++)ctx.drawImage(im,dx,dy,dw,dh);
  ctx.restore();
 }
 ctx.drawImage(im,dx,dy,dw,dh);
 if(R.lift>0){
  ctx.save();ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=R.lift;
  ctx.drawImage(heroTintSil(im,col),dx,dy,dw,dh);ctx.restore();
 }
}
function heroSprDraw(x,y,flip){
 const cfg=BOGATYR_CONFIG[currentClass]||BOGATYR_CONFIG.warrior;
 const sc=(cfg.scale!=null?cfg.scale:0.42);
 const hgt=(cfg.bodyH+(cfg.headR||10)*2)*sc*3.8;
 const H=heroSpr(currentClass);
 const moving=!!P.moving;
 const fi=HA.frame; // v5.51: кадр даёт HERO ANIM CONTROLLER
 const im=H[(fi||1)-1];
 if(!im||im.broken||!im.naturalWidth)return false;
 const w=hgt*(im.naturalWidth/im.naturalHeight);
 ctx.save();ctx.translate(x,y);
 if(flip)ctx.scale(-1,1);
 const classColor=(typeof CLASS_VISUALS!=='undefined'?(CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior):{color:'#ffcf6a'}).color;
 const feet=hgt*0.18;
 ctx.save();ctx.translate(0,feet+2);ctx.scale(1,0.2);
 let _g=ctx.createRadialGradient(0,0,1,0,0,w*0.40);
 _g.addColorStop(0,classColor+'36');_g.addColorStop(0.6,classColor+'12');_g.addColorStop(1,classColor+'00');
 ctx.fillStyle=_g;ctx.beginPath();ctx.arc(0,0,w*0.40,0,7);ctx.fill();
 // v6.68: тёмный градиент под ногами убран — дублировал подложку drawHeroFocusUnder
 ctx.restore();
 // v6.73: поза героя — squash&stretch и наклон вокруг ступней (ноги не плавают)
 const _pose=heroPose();
 if(_pose.sx!==1||_pose.sy!==1||_pose.rot!==0){
  ctx.translate(0,feet);
  ctx.rotate(_pose.rot);
  ctx.scale(_pose.sx,_pose.sy);
  ctx.translate(0,-feet);
 }
 const _rig=heroRig(currentClass);
 // v6.7: геометрия кадра — одна функция на оба вида листа.
 const _box=(image)=>{
  if(_rig.ok&&_rig.canon){
   const k=(hgt*0.88)/_rig.charH;
   return [-_rig.iw*k/2, feet-_rig.baseY*_rig.ih*k, _rig.iw*k, _rig.ih*k];
  }
  const m2=heroMet(image);
  if(m2.ok&&_rig.ok){
   const iw=image.naturalWidth,ih=image.naturalHeight,tgt=hgt*0.88;
   const k=Math.min(tgt/Math.max(1,_rig.maxBh),(tgt*1.35)/Math.max(1,_rig.maxBw));
   return [-(m2.fcx!=null?m2.fcx:0.5)*iw*k, feet-m2.y1*ih*k, iw*k, ih*k];
  }
  return [-w/2, feet-hgt, w, hgt];
 };
 // v6.7: СМЕШИВАНИЕ СОСЕДНИХ КАДРОВ. У Волхва стойка это всего две позы на 1.6 с,
 // ходьба — восемь. При таком числе поз глаз видит подмену картинки, а не движение.
 // Короткое перекрёстное затухание в конце каждой позы читается как непрерывное
 // движение и стоит один лишний drawImage. Окно узкое (см. heroAnimUpdate), поэтому
 // большую часть времени на экране чистая поза, без двоения рук.
 const _imB=(HA.blend>0.01&&HA.frameNext)?H[(HA.frameNext||1)-1]:null;
 const _bl=(_imB&&_imB.complete&&!_imB.broken&&_imB.naturalWidth)?HA.blend:0;
 const b1=_box(im);
 // контровое свечение — один раз по текущему кадру, иначе блюр удваивается
 if(HERO_RIM.glow>0&&HERO_RIM.blurK>0){
  ctx.save();ctx.shadowColor=classColor;ctx.shadowBlur=hgt*HERO_RIM.blurK;
  ctx.globalAlpha=HERO_RIM.glow;
  for(let i=0;i<HERO_RIM.passes;i++)ctx.drawImage(im,b1[0],b1[1],b1[2],b1[3]);
  ctx.restore();
 }
 if(_bl>0){
  const b2=_box(_imB);
  ctx.save();ctx.globalAlpha=1-_bl;ctx.drawImage(im,b1[0],b1[1],b1[2],b1[3]);ctx.restore();
  ctx.save();ctx.globalAlpha=_bl;ctx.drawImage(_imB,b2[0],b2[1],b2[2],b2[3]);ctx.restore();
 } else ctx.drawImage(im,b1[0],b1[1],b1[2],b1[3]);
 if(HERO_RIM.lift>0){
  ctx.save();ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=HERO_RIM.lift;
  ctx.drawImage(heroTintSil(im,classColor),b1[0],b1[1],b1[2],b1[3]);ctx.restore();
 }
 ctx.restore();
 return true;
}
function drawUltFx(x,y){
 if(!(P.specialFx>0))return;
 const cv2=CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior;
 const D=HERO_CLIPS.ult.dur, hit=HERO_CLIPS.ult.hit;
 const t=Math.max(0,Math.min(1,1-P.specialFx/D));
 ctx.save();ctx.globalCompositeOperation='lighter';
 if(t<hit){                                    // замах: энергия стягивается к посоху
  const k=t/hit;ctx.translate(x,y-70);
  ctx.strokeStyle=cv2.accent;ctx.lineWidth=2.5;
  for(let i=0;i<7;i++){const a=i/7*6.283+t*11,r=150*(1-k)+16;
   ctx.globalAlpha=0.25+0.55*k;ctx.beginPath();ctx.arc(0,0,r,a,a+0.55);ctx.stroke();}
  ctx.globalAlpha=0.6*k;ctx.fillStyle=cv2.color;
  ctx.beginPath();ctx.arc(0,0,10+28*k,0,6.283);ctx.fill();
 }else{                                        // выброс: ударные кольца и разряды
  const k=(t-hit)/(1-hit),R=50+430*k,fade=Math.pow(1-k,1.5);
  ctx.translate(x,y-30);
  if(typeof ULT_SEAL_MANDALA_ART !== 'undefined' && ULT_SEAL_MANDALA_ART.complete && ULT_SEAL_MANDALA_ART.naturalWidth){
    const diam = R * 2.2;
    ctx.globalAlpha = 0.85 * fade;
    ctx.rotate(time * 1.5);
    ctx.drawImage(ULT_SEAL_MANDALA_ART, -diam/2, -diam/2, diam, diam);
  } else {
    ctx.globalAlpha=0.55*fade;ctx.strokeStyle=cv2.color;ctx.lineWidth=2+15*fade;
    ctx.beginPath();ctx.arc(0,0,R,0,6.283);ctx.stroke();
  }
  ctx.restore();
 }
}
function drawHeroFallback(x,y,flip){   // v5.65: спрайт не декодировался — рисуем силуэт, чтобы герой не исчез
 const cv=CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior;
 ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
 ctx.fillStyle='#0a0e14';ctx.beginPath();ctx.ellipse(0,-30,17,35,0,0,7);ctx.fill();
 ctx.fillStyle=cv.color;ctx.beginPath();ctx.ellipse(0,-30,13,31,0,0,7);ctx.fill();
 ctx.beginPath();ctx.arc(0,-64,10,0,7);ctx.fill();
 ctx.restore();
}
function drawClassSilhouette(x,y,flip){
  if(!heroSprDraw(x,y,flip))drawHeroFallback(x,y,flip);
  drawClassAttackFx(x,y);
  drawUltFx(x,y);
}
// ============================================================
