//  RENDER
// ============================================================
// ============================================================
// v5.20 СВЕТ ЧЁРНОЛЕСЬЯ: ночная глубина + живой свет заставы
// ============================================================
let _abuf=null,_abW=0,_abH=0;
let _gtVar=null;
const MOTES=[];
function updateMotes(px,py,R){
 const want=Math.max(6,Math.round(26*partMul));
 while(MOTES.length<want)MOTES.push({x:P.x+(Math.random()*2-1)*600,y:P.y+(Math.random()*2-1)*600,vx:(Math.random()*2-1)*7,vy:-5-Math.random()*10,ph:Math.random()*6.283,sz:0.8+Math.random()*1.3});
 if(MOTES.length>want)MOTES.length=want;
 const R9=R*0.92,R9sq=R9*R9;
 ctx.globalCompositeOperation='lighter';
 for(const m of MOTES){
  m.x+=m.vx/60;m.y+=m.vy/60;
  let dx=m.x-P.x,dy=m.y-P.y;
  if(dx*dx+dy*dy>518400){m.x=P.x+(Math.random()*2-1)*560;m.y=P.y+(Math.random()*2-1)*560;dx=m.x-P.x;dy=m.y-P.y;}
  const d2=dx*dx+dy*dy;
  if(d2>R9sq)continue;
  const k=1-Math.sqrt(d2)/R9;
  ctx.globalAlpha=(0.06+0.05*Math.sin(time*2.4+m.ph))*Math.min(1,k*2.6);
  ctx.fillStyle='#ffdba8';
  ctx.beginPath();ctx.arc(m.x-cam.x,m.y-cam.y,m.sz,0,7);ctx.fill();
 }
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawAtmosphere(px,py){
 const night=nightMode||theme==='night',winter=theme==='winter';
 let ambA=night?0.46:winter?0.26:0.31;   // v6.66: светлее — было 0.60/0.34/0.44, экран тонул в черноте
 const ink=night?'14,18,38':winter?'42,58,80':'22,30,24';   // v6.66: светлее и с оттенком
 const bossAlive=bossE&&!bossE.dead;
 if(bossAlive)ambA=Math.min(0.68,ambA+0.05);
 let R=night?380:winter?430:460;   // v6.66: радиус света шире — поле боя читается
 // v6.12: радиус света и плотность тьмы были подобраны под обзор один к одному
 // (412×915). В режиме «Толпа» видно 1030×2288, то есть круг света в 372 px
 // накрывал лишь центральный пятачок, а вся толпа тонула в 44% темноты — именно
 // поэтому поле выглядело пустым и мутным. Свет масштабируем вместе с обзором,
 // а тьму на широком обзоре ослабляем: в эталонном жанре поле освещено ровно,
 // атмосферная тьма там вообще не используется.
 const _vs=Math.max(1,Math.max(W,H)/915);
 R*=_vs;
 ambA*=Math.max(0.45,1-0.22*(_vs-1));
 if(currentCurse==='blind')R*=0.62;
 const fl=1+Math.sin(time*9)*0.014+Math.sin(time*23.7)*0.008; // дыхание пламени (мягче — без строба)
 R*=fl;
 // v5.25 АНТИ-СТРОБ: вся атмосфера (тьма, прорезь света, тёплый свет, лучи,
 // туман) рисуется в ПОЛУРАЗРЕШЁННЫЙ буфер и выводится ОДНИМ drawImage.
 // Было ~7 полноэкранных композитных прохода за кадр — слабые GPU не тянули,
 // картинка «стробила». Стало 1 проход (+виньетка), апскейл мягко сглаживает.
 const S=0.5,aw=(W*S)|0,ah=(H*S)|0;
 if(!_abuf||_abW!==aw||_abH!==ah){_abuf=document.createElement('canvas');_abuf.width=aw;_abuf.height=ah;_abW=aw;_abH=ah;}
 const lc=_abuf.getContext('2d');
 const hx=px*S,hy=py*S-5,Rs=R*S;
 lc.globalCompositeOperation='source-over';
 lc.clearRect(0,0,aw,ah);
 lc.fillStyle='rgba('+ink+','+ambA.toFixed(3)+')';
 lc.fillRect(0,0,aw,ah);
 // v6.65: ПАРАЛЛАКС-ТУМАН. Холодный лес-силуэт ложится в тёмные края экрана
 // и медленно плывёт за камерой (0.18 скорости). Тёплый герой в центре
 // остаётся чистым — прорезь света вырезает его из тумана.
 // тёплый свет костра + лучи + туман — аддитивно ВНУТРИ буфера
 lc.globalCompositeOperation='lighter';
 const wr=Rs*0.82;
 const wg=lc.createRadialGradient(hx,hy,4,hx,hy,wr);
 wg.addColorStop(0,'rgba(250,165,75,'+(winter?0.13:0.15)+')');   // v6.69: янтарный, меньше красного
 wg.addColorStop(0.45,'rgba(235,140,60,0.06)');
 wg.addColorStop(1,'rgba(220,125,50,0)');
 lc.fillStyle=wg;lc.fillRect(hx-wr,hy-wr,wr*2,wr*2);
 const rayCol=winter?'rgba(215,235,255,':'rgba(245,222,160,';   // v6.69: лучи мягче
 for(let i=0;i<4;i++){
  const wa=700+i*1600+Math.sin(time*0.045+i*2.1)*260;
  const rx=(wa-cam.x)*S;
  if(rx<-aw*0.3||rx>aw*1.3)continue;
  const topX=rx-aw*0.10+Math.sin(time*0.13+i*1.9)*aw*0.03;
  const rw=aw*0.045*(1+0.3*Math.sin(time*0.21+i));
  const gg=lc.createLinearGradient(0,0,0,ah*0.82);
  gg.addColorStop(0,rayCol+'0.05)');gg.addColorStop(0.62,rayCol+'0.015)');gg.addColorStop(1,rayCol+'0)');
  lc.fillStyle=gg;
  lc.beginPath();lc.moveTo(topX-rw,-10);lc.lineTo(topX+rw,-10);lc.lineTo(rx+rw*2.1,ah*0.82);lc.lineTo(rx-rw*2.1,ah*0.82);lc.closePath();lc.fill();
 }
 // v6.70: прорезь света — герой и босс остаются чистыми
 lc.globalCompositeOperation='destination-out';
 const hg=lc.createRadialGradient(hx,hy,Rs*0.14,hx,hy,Rs);
 hg.addColorStop(0,'rgba(0,0,0,0.94)');hg.addColorStop(0.55,'rgba(0,0,0,0.60)');hg.addColorStop(1,'rgba(0,0,0,0)');
 lc.fillStyle=hg;lc.beginPath();lc.arc(hx,hy,Rs,0,7);lc.fill();
 if(bossAlive){const bx=(bossE.x-cam.x)*S,by=(bossE.y-cam.y-30)*S;
  if(bx>-130&&bx<aw+130&&by>-130&&by<ah+130){
   const br=Rs*0.62;
   const bg2=lc.createRadialGradient(bx,by,br*0.15,bx,by,br);
   bg2.addColorStop(0,'rgba(0,0,0,0.82)');bg2.addColorStop(1,'rgba(0,0,0,0)');
   lc.fillStyle=bg2;lc.beginPath();lc.arc(bx,by,br,0,7);lc.fill();
  }}
 lc.globalCompositeOperation='lighter';
 if(partMul>0.4){for(let i=0;i<3;i++){
  const fx=(((time*7+i*(W+600)/3+300)%(W+700))-350)*S;
  const fy=(H*(0.24+0.24*i)+Math.sin(time*0.16+i*2.2)*36)*S;
  const fr=(260+70*i)*S;
  const fg2=lc.createRadialGradient(fx,fy,fr*0.1,fx,fy,fr);
  fg2.addColorStop(0,'rgba(150,175,160,0.05)');fg2.addColorStop(1,'rgba(150,175,160,0)');
  lc.fillStyle=fg2;lc.beginPath();lc.ellipse(fx,fy,fr,fr*0.42,0,0,7);lc.fill();
 }}
 // один полноэкранный проход — растягиваем полуразрешенный буфер
 ctx.globalCompositeOperation='source-over';
 ctx.drawImage(_abuf,0,0,W,H);
 // пыль в свете костра — мелкие точки, остаются на основном контексте
 updateMotes(px,py-10,R);
 if(winter){for(let i=0;i<20;i++){const x=(time*20+i*73)%W,y=(time*30+i*97)%H;ctx.fillStyle='rgba(220,230,240,0.6)';ctx.fillRect(x,y,2,2);}}
 ctx.globalAlpha=1;
 // виньетка — мягче прежней; краснеет в финальной фазе босса
 const vg=ctx.createRadialGradient(W/2,H/2,H*0.38,W/2,H/2,H*0.85);
 vg.addColorStop(0,'rgba(0,0,0,0)');
 vg.addColorStop(0.62,'rgba(0,0,0,0.04)');
 vg.addColorStop(1,(bossAlive&&bossE.phase===2)?'rgba(46,5,2,0.30)':'rgba(0,0,0,0.26)');
 ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
}

// ============================================================
//  v5.69 draw() РАЗРЕЗАН ПО СЛОЯМ (было 349 строк одним куском)
//  Порядок вызова = порядок отрисовки, менять нельзя: ctx.save/restore
//  парные, слои идут земля -> пропсы -> враги -> эффекты -> герой -> HUD.
// ============================================================
// v7.35 ГРАДАЦИЯ ЗЕМЛИ. Запекается в тайл один раз, на кадр не влияет.
//  mul — множитель цвета: чем темнее, тем глубже фон; оттенок уводит листву
//        с оранжевого, чтобы тёплые эффекты не светились по тёплому.
//  sat — сколько насыщенности оставить (100 = как есть).
// Меняется здесь одним местом; _gtVar достаточно обнулить, чтобы перепечь.
const GROUND_GRADE={mul:'#6f7d64',sat:38,flat:0};
function drawGround(){
 ctx.fillStyle=theme==='winter'?'#3a4a5a':(nightMode||theme==='night')?'#0a0a18':'#1a2410';
 ctx.fillRect(0,0,W,H);
 if(GT.complete&&GT.naturalWidth){
 // v5.26 ТВЁРДАЯ ЗЕМЛЯ: тайлы рисуются напрямую по мировым клеткам 768px.
 // Флип клетки и пятно мха/света берутся из хэша МИРОВЫХ координат (_cx,_cy) —
 // паттерн земли абсолютно неподвижен относительно мира (старый _gbuf-буфер
 // «перескакивал» на клетку каждые 768px ходьбы — выглядело как рывок назад).
 const _ts=768;
 // v5.29: пятна мха/света ЗАПЕЧЕНЫ в 4 варианта тайла один раз на старте (было —
 // до ~16 createRadialGradient + заливок КАЖДЫЙ КАДР: GC-мусор и fill-rate).
 // Теперь за кадр — только drawImage готового варианта, выбор по мировому хэшу.
 if(!_gtVar){_gtVar=[];const _hs=[911382323,2608872923,1573669621,377401575];
  for(let v=0;v<4;v++){const c2=document.createElement('canvas');c2.width=_ts;c2.height=_ts;const g2=c2.getContext('2d');g2.drawImage(GT,0,0,_ts,_ts);
   // v6.12: земля глушила спрайты. Тайл — очень контрастная и насыщенная органика
   // (корни, иглы), на ней силуэт врага в 40 px не читается. В эталонном жанре пол
   // намеренно плоский и малоконтрастный, вся читаемость отдана спрайтам.
   // Печём приглушение прямо в тайл — это происходит один раз при загрузке,
   // на кадр не влияет: сначала сажаем контраст плоской заливкой, затем слегка
   // снимаем насыщенность.
   // v7.35: плоская заливка (v6.13, rgba .16) гасила текстуру заодно с яркостью,
   // поэтому и не давала уйти дальше — на 0.30 пропадали ориентиры движения.
   // Замена: multiply масштабирует пиксели, а не подмешивает краску. Яркость
   // падает, а разница между корнем и мхом остаётся в той же пропорции — рисунок
   // земли виден, экран не превращается в равномерное поле.
   // Цвет множителя уводит листву с оранжевого: половина эффектов в игре тёплая,
   // и на тёплом фоне они не читались. Холодная земля разводит их по тону.
   if(GROUND_GRADE.flat>0){   // прежний способ, оставлен для сравнения снимками
    g2.globalCompositeOperation='source-over';
    g2.fillStyle='rgba(26,30,24,'+GROUND_GRADE.flat+')';g2.fillRect(0,0,_ts,_ts);
   }
   g2.globalCompositeOperation='multiply';
   g2.fillStyle=GROUND_GRADE.mul;g2.fillRect(0,0,_ts,_ts);
   g2.globalCompositeOperation='saturation';
   g2.fillStyle='hsl(0,'+GROUND_GRADE.sat+'%,50%)';g2.fillRect(0,0,_ts,_ts);
   g2.globalCompositeOperation='source-over';
   for(let si=0;si<2;si++){const h2=(Math.imul(_hs[v]+si*777777,2654435761))>>>0;
    const pr=250+(h2&127),dk=(h2>>9)&3;
    const pxx=(((h2>>11)&1023)/1023)*_ts,pyy=(((h2>>21)&1023)/1023)*_ts;
    const pg2=g2.createRadialGradient(pxx,pyy,pr*0.15,pxx,pyy,pr);
    if(dk<2){pg2.addColorStop(0,'rgba(5,7,4,'+(0.10+((h2>>8)&15)*0.006).toFixed(3)+')');pg2.addColorStop(1,'rgba(5,7,4,0)');
     g2.globalCompositeOperation='source-over';}
    else{pg2.addColorStop(0,'rgba(170,160,95,'+(0.05+((h2>>8)&7)*0.006).toFixed(3)+')');pg2.addColorStop(1,'rgba(170,160,95,0)');
     g2.globalCompositeOperation='lighter';}
    g2.fillStyle=pg2;g2.beginPath();g2.arc(pxx,pyy,pr,0,7);g2.fill();g2.globalCompositeOperation='source-over';}
   _gtVar[v]=c2;}}
 const _cx0=Math.floor(cam.x/_ts),_cy0=Math.floor(cam.y/_ts),_cx1=Math.floor((cam.x+W)/_ts),_cy1=Math.floor((cam.y+H)/_ts);
 for(let _cy=_cy0;_cy<=_cy1;_cy++)for(let _cx=_cx0;_cx<=_cx1;_cx++){
  const sx=_cx*_ts-cam.x,sy=_cy*_ts-cam.y;
  const gh=((_cx*73856093)^(_cy*19349663))>>>0;
  ctx.drawImage(_gtVar[(gh>>>2)&3],sx,sy,_ts,_ts);
 }}
}
// v5.99: кэш запечённого свечения кристаллов, ключ — цвет. Цветов около восьми
// (по типам врагов), поэтому кэш крошечный и живёт весь сеанс.
const _gemSpr=Object.create(null);
// v6.2: ключ кэша теперь цвет+размер — крупные номиналы рисуются крупнее, чтобы
// ценность читалась с одного взгляда. Вариантов всего три (1/5/25).
function gemSprite(col,sc){
 const k=col+'|'+sc;
 let c=_gemSpr[k];
 if(c)return c;
 const R=6*sc, S=Math.ceil(R*2+28);   // ромб ±R плюс запас под blur с обеих сторон
 c=document.createElement('canvas');c.width=S;c.height=S;
 const g=c.getContext('2d');
 g.translate(S/2,S/2);
 g.shadowColor=col;g.shadowBlur=10*sc;g.fillStyle=col;
 g.beginPath();g.moveTo(0,-R);g.lineTo(R*0.67,0);g.lineTo(0,R);g.lineTo(-R*0.67,0);g.closePath();g.fill();
 _gemSpr[k]=c;
 return c;
}
// v6.0: пространственные бакеты для декораций. При WORLD=6000 их было ~150 и
// перебор всего массива за кадр стоил десятую долю мс. После увеличения мира их
// стало ~2000, то есть 120 тысяч проверок в секунду впустую — на экране всё равно
// видно 6–9. Раскладываем один раз по клеткам 2000px и за кадр обходим только те
// клетки, что пересекают камеру: это 4–9 клеток вместо всего мира.
const DBUCKET=2000;
const _dbN=Math.ceil(WORLD/DBUCKET)+1;
const _dbuckets=new Array(_dbN*_dbN);
function _decoBucketsBuild(){
 for(const d of decos){
  const bx=Math.min(_dbN-1,Math.max(0,Math.floor(d.x/DBUCKET)));
  const by=Math.min(_dbN-1,Math.max(0,Math.floor(d.y/DBUCKET)));
  const k=by*_dbN+bx;
  (_dbuckets[k]||(_dbuckets[k]=[])).push(d);
 }
}
_decoBucketsBuild();
// v6.46 АНОМАЛИИ НА КАНВАСЕ.
// Сундук, алтарь и золотая жила — три главные находки забега — рисовались
// одинаковыми ЖЁЛТЫМИ КРУЖКАМИ 32px через DOM-элемент с текстовым символом
// (◆ ✦ ▲) поверх канваса. Отличить их можно было только по значку, размер не
// зависел от зума (на «Толпе» кружок был вдвое крупнее героя), и они жили вне
// мира: не перекрывались травой, не имели тени, не реагировали на свет.
// Рисуем в мире, каждой — свой силуэт.
// v7.0: СПРАЙТЫ АНОМАЛИЙ
// v7.21: 100% Живописные спрайты Сундука и Алтаря без чёрных квадратов (новые RGBA-версии без фона)
