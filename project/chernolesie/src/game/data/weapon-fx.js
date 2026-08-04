// ============================================================
//  v7.33 ЦВЕТ И ФОРМА ОРУЖИЯ — ОДНА ТАБЛИЦА НА ВСЮ ИГРУ
//
//  Замер, с которого всё началось: семь разных орудий пятого уровня дают на
//  экране один золотой ореол вокруг героя. По кадру нельзя сказать, какое
//  оружие сработало — все зоны рисуются тёплым светом через 'lighter' поверх
//  ярко-оранжевой листвы, то есть свет по свету того же тона.
//
//  В Vampire Survivors читаемость держится на трёх вещах, и ни одна из них
//  не про размер:
//    1. У оружия СВОЙ цвет, и он никогда не меняется. Билд читается по цвету.
//    2. У оружия СВОЙ силуэт, нарисованный непрозрачно, а не свечением.
//    3. Фон тёмный и обесцвеченный, поэтому яркое отделяется от него.
//
//  Здесь — первый пункт. Цвета разведены по кругу оттенков так, чтобы соседние
//  по игре орудия не сливались, и при этом остались в славянской палитре:
//  сталь, лёд, кровь, зелень нави, гроза, золото капища.
//
//  col — основной тон зоны и следа
//  rim — кромка: она рисуется ОБЫЧНЫМ смешиванием, чтобы форма имела край
//        и читалась как предмет, а не как свет
//  core— цвет ядра вспышки (белый почти у всех: сильный свет уходит в белый)
// ============================================================
const WFX={
 sword:  {col:'#ffd27a', rim:'#7a4a12', core:'#fff6dc', name:'меч'},
 serp:   {col:'#cfe0ff', rim:'#2b3a5a', core:'#ffffff', name:'серп'},
 kosa:   {col:'#8affc4', rim:'#0e3a28', core:'#eaffe8', name:'коса'},
 ugli:   {col:'#ff7a3c', rim:'#4a1608', core:'#ffd9a8', name:'угли'},
 kamen:  {col:'#ffe9a8', rim:'#5a4410', core:'#ffffff', name:'камень'},
 obereg: {col:'#8fd0ff', rim:'#123448', core:'#eaf6ff', name:'оберег'},
 zov:    {col:'#c8b8ff', rim:'#2a1f4a', core:'#f2ecff', name:'зов'},
 kolokol:{col:'#ffc247', rim:'#5a3a08', core:'#fff3d0', name:'колокол'},
 verv:   {col:'#b478ff', rim:'#2c1450', core:'#f0e2ff', name:'вервь'},
 idol:   {col:'#ffcf6a', rim:'#5a4012', core:'#fff6dc', name:'идол'},
 navi:   {col:'#7a5cff', rim:'#180f3c', core:'#ded4ff', name:'навий хвост'},
 rosa:   {col:'#6affd8', rim:'#083a30', core:'#e6fffa', name:'роса'},
 vihr:   {col:'#a8e8ff', rim:'#0e3a52', core:'#ffffff', name:'вихрь'},
 klyuka: {col:'#ff6a6a', rim:'#4a0e0e', core:'#ffd8d0', name:'клюка'},
 zerno:  {col:'#9ac06a', rim:'#22380f', core:'#eaffd0', name:'зерно'},
 kosti:  {col:'#ffe0b0', rim:'#503418', core:'#ffffff', name:'венец'},
 upyr:   {col:'#ff4a6a', rim:'#40060f', core:'#ffd0d8', name:'зуб'},
 zercalo:{col:'#d8f0ff', rim:'#2a3c48', core:'#ffffff', name:'зерцало'},
 sopel:  {col:'#8fd0ff', rim:'#0e2a50', core:'#ffffff', name:'сопель'},
 trizna: {col:'#c0ff8a', rim:'#1e3a10', core:'#f0ffe0', name:'тризна'},
 golod:  {col:'#ff8ad0', rim:'#3c0a2a', core:'#ffe0f2', name:'голод'},
 bolt:   {col:'#8fd0ff', rim:'#0e2a50', core:'#ffffff', name:'гроза'},
 bow:    {col:'#e8d8a0', rim:'#4a3a14', core:'#fff8e0', name:'лук'},
 poison: {col:'#9ac06a', rim:'#1e3410', core:'#e8ffd0', name:'мор'},
 frost:  {col:'#bfe0ff', rim:'#183a4e', core:'#ffffff', name:'стужа'},
 thorn:  {col:'#c8a06a', rim:'#3a2610', core:'#ffe8c0', name:'шипы'},
 orbit:  {col:'#b0a8c8', rim:'#221c34', core:'#ece8f6', name:'вороньё'}
};
const WFX_DEF={col:'#ffcf6a', rim:'#4a3a12', core:'#ffffff', name:'дар'};
function wfx(id){return WFX[id]||WFX_DEF;}

// ============================================================
//  ОТПЕЧАТОК ЗОНЫ — то, чего не хватало больше всего.
//
//  Зона поражения косы — 165% ширины кадра, а нарисована она была кружком
//  радиусом 6-16px (fx-layer.js, drawKosaTrail). Игрок физически не видел,
//  где бьёт его оружие.
//
//  zoneStamp рисует настоящую границу зоны: тёмная кромка обычным смешиванием
//  (форма получает край), поверх — цветное кольцо и мягкая заливка на 'lighter'.
//  Порядок важен: сначала тёмное, потом светлое, иначе кромка съедается светом.
//
//  x,y — уже в экранных координатах. R — тот же радиус, по которому считается
//  попадание, без «художественных» множителей: если нарисовано больше, чем
//  бьёт, игрок учится не верить картинке.
// ============================================================
//  v7.35: не всякая зона — круг. Коса бьёт конусом по взгляду (halfArc 0.75 рад,
//  у эволюции 1.15), а кольцо рисовалось полное — обещало удар вокруг себя при
//  секторе вперёд, то есть вчетверо больше, чем бьёт. Поэтому граница строится
//  по той же паре (радиус, полуугол), по которой считается попадание: у конуса
//  это сектор с двумя радиусами, у круга — прежнее кольцо.
function zoneStamp(x,y,R,id,a,opts){
 if(!(R>0)||!(a>0))return;
 const f=wfx(id),o=opts||{};
 // толщина кромки НЕ пропорциональна радиусу: у зоны в 500px кольцо в 14px
 // читается как забор вокруг игрока. Растёт медленно и упирается в потолок.
 const rimW=o.rimW||Math.max(2,Math.min(5.5,1.6+R*0.008));
 // сектор: полуугол меньше пи — значит зона конусная и замыкается на игроке
 const half=(o.arc>0&&o.arc<Math.PI)?o.arc:0;
 const ang=o.ang||0;
 const path=function(){
  ctx.beginPath();
  if(half){
   ctx.moveTo(0,0);
   ctx.arc(0,0,R,ang-half,ang+half);
   ctx.closePath();
  }else ctx.arc(0,0,R,0,TAU);
 };
 ctx.save();
 ctx.translate(x,y);
 // 1) тёмная кромка — обычным смешиванием, чтобы у зоны был край
 ctx.globalAlpha=Math.min(1,a*0.55);
 ctx.strokeStyle=f.rim;
 ctx.lineWidth=rimW*1.9;
 path();ctx.stroke();
 // 2) цветное кольцо поверх кромки
 ctx.globalCompositeOperation='lighter';
 ctx.globalAlpha=a*0.8;
 ctx.strokeStyle=f.col;
 ctx.lineWidth=rimW;
 path();ctx.stroke();
 // 3) заливка: слабая, только чтобы зона читалась как площадь, а не как обод.
 //    Сильнее нельзя — при трёх зонах внахлёст экран уходит в молоко.
 // заливка — только у небольших зон. У кольца в пол-экрана она затемняет
 // всё поле и спорит с землёй; там достаточно самой границы.
 // у сектора заливка уместна и на большом радиусе: он занимает четверть круга
 if(o.fill!==false&&(R<220||half)){
  const g=ctx.createRadialGradient(0,0,R*0.25,0,0,R);
  g.addColorStop(0,'rgba(0,0,0,0)');
  g.addColorStop(0.82,f.col+'14');
  g.addColorStop(1,f.col+'30');
  ctx.globalAlpha=a*0.9;
  ctx.fillStyle=g;
  path();ctx.fill();
 }
 ctx.restore();
}

// ------------------------------------------------------------
//  Вспышки зон: оружие сработало — на земле осталась его граница.
//  Живут доли секунды, поэтому три-четыре зоны внахлёст не превращают
//  экран в кашу, но игрок успевает прочитать, что именно ударило.
// ------------------------------------------------------------
let zonePulses=[];
// arc — полуугол конуса в радианах, тот же, по которому считается попадание.
// Без него зона считается круговой, как и было у шести круглых орудий.
function pulseZone(x,y,R,id,life,arc){
 if(!(R>0))return;
 if(zonePulses.length>24)zonePulses.shift();   // предохранитель на плотной волне
 // большая зона гаснет быстрее: чем шире кольцо, тем дольше оно мозолит глаз
 const L=life||(R>300?0.3:0.42);
 // угол фиксируется в момент удара: лист не должен крутиться на месте
 zonePulses.push({x:x,y:y,R:R,id:id,t:L,max:L,arc:arc||0,
  rot:(typeof P!=='undefined'&&P.fx!=null)?Math.atan2(P.fy||0,P.fx||1):0});
}
function drawZonePulses(dt){
 for(let i=zonePulses.length-1;i>=0;i--){
  const z=zonePulses[i];
  z.t-=dt;
  if(z.t<=0){zonePulses.splice(i,1);continue;}
  const k=z.t/z.max;                       // 1 в момент удара -> 0 к концу
  const zx=z.x-cam.x, zy=z.y-cam.y;
  // отсечение: зона может быть шире экрана, поэтому сверяем по радиусу
  if(zx+z.R<-40||zy+z.R<-40||zx-z.R>W+40||zy-z.R>H+40)continue;
  // кольцо чуть расширяется на излёте — так удар читается как волна,
  // а не как мигающий обод
  // кольцо рисуется ВСЕГДА: оно показывает настоящую границу поражения.
  // Лист ложится поверх и даёт силуэт — одно другого не заменяет. Когда лист
  // есть, кольцо приглушается, чтобы не спорить с рисунком.
  const RR=z.R*(1+(1-k)*0.06);
  const hasSheet=!!wfxSheet(z.id);
  zoneStamp(zx,zy,RR,z.id,Math.min(1,k*1.25)*(hasSheet?0.5:1),
   {arc:z.arc,ang:z.rot,fill:hasSheet?false:undefined});
  if(hasSheet)zoneSheetStamp(zx,zy,RR,z.id,k,z.rot,z.arc);
 }
}

// ============================================================
//  v7.34 ЛИСТЫ ЗОН — МЕСТО ПОД АРТ
//
//  Кодом дальше не вытянуть: кольцо остаётся кольцом, а в Vampire Survivors
//  у каждого оружия свой СИЛУЭТ. Поэтому здесь заведены слоты: как только
//  рядом появляется лист, зона начинает рисоваться им, а не кольцом.
//
//  Правила листа (те же, что у всех атласов эффектов в проекте):
//   * сетка строго 4x2, восемь кадров, ячейка квадратная;
//   * эффект вписан в ячейку ОТ КРАЯ ДО КРАЯ и центрирован — лист рисуется
//     диаметром 2R, то есть кромка кадра ложится ровно на границу поражения;
//   * фон magenta #FF00FF, снимается через tools/chromakey.py.
//
//  Пока файла нет, зона рисуется кольцом из zoneStamp — игра не ломается,
//  и ассеты можно заводить по одному. Чтобы подключить новый лист: положить
//  webp в assets/art/art-registry/, вписать в src/build.manifest.json и
//  добавить строку сюда.
// ============================================================
//  Листы бывают двух сортов, и рисуются они по-разному.
//
//  Заглушки (дымный серп и прочее из v7.32) нарисованы белым. Их надо красить
//  в цвет оружия и класть сложением: белый дым поверх карты и должен светиться.
//
//  Листы по заданию из docs/art-briefs.md приходят уже в цветах оружия и с
//  тёмной обводкой по внешнему краю. Их нельзя ни красить, ни класть сложением:
//  'source-in' затирает обводку и ядро плоской заливкой, а 'lighter' умеет
//  только прибавлять свет и тёмный контур не рисует вовсе. А контур — это ровно
//  то, чем силуэт отделяется от фона, ради чего лист и заказывался.
//  Поэтому у слота есть режим: tint+lighter для заглушек, как есть для заданий.
const WFX_SHEETS={};
// заводится после загрузки реестра: мятный серп ложится на взмах Косы
addEventListener('load',()=>{
 if(typeof KOSA_ZONE_SHEET!=='undefined')WFX_SHEETS.kosa={im:KOSA_ZONE_SHEET,brief:true};
});
function wfxSheet(id){
 const s=WFX_SHEETS[id];
 if(!s)return null;
 const im=s.im||s;                     // слот может быть и голой картинкой
 return (im&&im.complete&&im.naturalWidth)?s:null;
}
// Кадр листа по прогрессу 0..1 (0 — момент удара, 1 — конец вспышки).
function zoneSheetStamp(x,y,R,id,k,rot,arc){
 const slot=wfxSheet(id);
 if(!slot)return false;
 const raw=slot.im||slot, brief=!!slot.brief;
 const sh=brief?raw:(tintedSheet(raw,wfx(id).col)||raw);
 const fi=Math.max(0,Math.min(7,Math.floor((1-k)*8)));
 const sw=Math.floor((sh.naturalWidth||sh.width)/4), sy=Math.floor((sh.naturalHeight||sh.height)/2);
 const col=fi%4, row=fi>3?1:0;
 const d=R*2;
 ctx.save();
 ctx.translate(x,y);
 // конусная зона: лист приходит веером примерно на 150°, а бьёт коса на 86°.
 // Без обрезки нарисованное снова шире правил. Режем по тому же сектору,
 // по которому считается попадание, — с небольшим запасом, чтобы срез не
 // выглядел ножницами по живому.
 if(arc>0&&arc<Math.PI){
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.arc(0,0,R*1.02,rot-arc*1.06,rot+arc*1.06);
  ctx.closePath();
  ctx.clip();
 }
 if(rot)ctx.rotate(rot);
 if(brief){
  // силуэт поверх карты, как в Vampire Survivors: обводка держит форму,
  // гасим только на излёте, чтобы вспышка уходила, а не обрывалась.
  // Потолок 0.82, а не 1: зона косы держится на экране 0.3 с, и при полной
  // непрозрачности она на это время прячет тех самых врагов, по которым бьёт —
  // игрок перестаёт видеть, что происходит в им же созданной вспышке.
  ctx.globalAlpha=Math.min(0.82,k*1.4);
 }else{
  ctx.globalCompositeOperation='lighter';
  // потолок 0.5: на 'lighter' лист во весь экран при альфе 1 выбивает всё
  // в белое, включая героя. Форма читается и на половине силы.
  ctx.globalAlpha=Math.min(0.5,k*0.6);
 }
 ctx.drawImage(sh,col*sw,row*sy,sw,sy,-R,-R,d,d);
 ctx.restore();
 return true;
}

// ============================================================
//  ПОКРАСКА ЛИСТА В ЦВЕТ ОРУЖИЯ
//
//  Присланные листы белые. Рисовать их как есть — значит вернуться к тому,
//  с чего начали: всё на экране одного цвета. Красим один раз при первом
//  обращении и держим готовый холст в кэше: 'source-in' по силуэту оставляет
//  форму и заменяет цвет, альфа сохраняется.
// ============================================================
const _tintCache={};
function tintedSheet(sh,col){
 if(!sh||!sh.complete||!sh.naturalWidth)return null;
 const key=(sh.src.length+'x'+sh.naturalWidth)+col;
 let c=_tintCache[key];
 if(c)return c;
 c=document.createElement('canvas');
 c.width=sh.naturalWidth;c.height=sh.naturalHeight;
 const g=c.getContext('2d');
 g.drawImage(sh,0,0);
 g.globalCompositeOperation='source-in';
 g.fillStyle=col;
 g.fillRect(0,0,c.width,c.height);
 // белое ядро возвращаем поверх: чистый цвет без светлой сердцевины
 // читается как плоское пятно, а не как удар
 g.globalCompositeOperation='source-atop';
 g.globalAlpha=0.22;
 g.drawImage(sh,0,0);
 _tintCache[key]=c;
 return c;
}

// ------------------------------------------------------------
//  Разовые вспышки листом: крит, смерть крупного врага и прочее,
//  что не является зоной оружия. Живут своей жизнью, гаснут сами.
// ------------------------------------------------------------
let sheetFx=[];
function spawnSheetFx(sheet,x,y,size,life,col,anchorBottom){
 if(!sheet||!sheet.complete||!sheet.naturalWidth)return;
 if(sheetFx.length>30)sheetFx.shift();
 const L=life||0.4;
 sheetFx.push({sh:sheet,x:x,y:y,s:size,t:L,max:L,col:col||null,ab:!!anchorBottom,
               rot:anchorBottom?0:randomVisual()*TAU});
}
function drawSheetFx(dt){
 for(let i=sheetFx.length-1;i>=0;i--){
  const f=sheetFx[i];
  f.t-=dt;
  if(f.t<=0){sheetFx.splice(i,1);continue;}
  const k=f.t/f.max;
  const x=f.x-cam.x, y=f.y-cam.y;
  if(x+f.s<-30||y+f.s<-30||x-f.s>W+30||y-f.s>H+30)continue;
  const img=f.col?tintedSheet(f.sh,f.col):f.sh;
  if(!img)continue;
  const fi=Math.max(0,Math.min(7,Math.floor((1-k)*8)));
  const sw=Math.floor(img.width/4), sh=Math.floor(img.height/2);
  const cx=fi%4, cy=fi>3?1:0;
  ctx.save();
  ctx.translate(x,y);
  if(f.rot)ctx.rotate(f.rot);
  ctx.globalCompositeOperation='lighter';
  ctx.globalAlpha=Math.min(1,k*1.3);
  // столб пыли растёт от земли, вспышка — от своего центра
  if(f.ab)ctx.drawImage(img,cx*sw,cy*sh,sw,sh,-f.s/2,-f.s,f.s,f.s);
  else     ctx.drawImage(img,cx*sw,cy*sh,sw,sh,-f.s/2,-f.s/2,f.s,f.s);
  ctx.restore();
 }
}
