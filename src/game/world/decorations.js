// ============================================================
//  ДЕКОРАЦИИ МИРА (46 спрайтов: пни-коряги, колючие кусты, мшистые камни,
//  брёвна, обломки заборов, редкие длинные «полосы пней»).
//  Чистый визуал: без коллизий и влияния на геймплей. Расстановка
//  ДЕТЕРМИНИРОВАНА собственным PRNG (seed 0xDEC0DE) — мир выглядит
//  одинаково в каждой сессии, и поток seedRandom геймплея не трогается.
//  Размер задаётся ЦЕЛЕВОЙ ШИРИНОЙ в px (исходники разного разрешения),
//  по пропорциям к герою (68px): куст ≈ 0.8–1.4 роста, бревно ≈ 1.3–2.3.
// ============================================================
const DECO_IMGS=DECO_SRC.map(s=>{const im=new Image();im.onerror=()=>{im.broken=true;};im.src=s;return im;});
const decos=[];
(function(){
 let st=0xDEC0DE;
 const drnd=()=>{st+=0x6D2B79F5;let t=st;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
 // DECO_SRC v5.5: прореженный набор (20 пропов) — категории сохранены, индексы 0..n-1.
 // Категория → индексы + вес + целевая ширина [min,max] px.
 const CATS={
  stumps:{idx:[6, 7, 10, 15, 17, 18, 19, 21, 22, 23, 26, 27, 28, 29, 30],w:0.22,tw:[60,115]},
  bushes:{idx:[8, 9, 13, 14, 17, 18, 4, 24, 25],w:0.22,tw:[50,100]},
  stones:{idx:[1, 13, 15, 16, 17, 18, 19],w:0.22,tw:[45,90]},
  logs:  {idx:[0, 2, 7, 11, 16, 19, 20],w:0.18,tw:[85,160]},
  fences:{idx:[3, 5, 12],w:0.06,tw:[90,150]},
  wide:  {idx:[10],w:0.10,tw:[190,260]},
 };
 const KEYS=Object.keys(CATS);
 function pickCat(){
  const r=drnd();let acc=0;
  for(const k of KEYS){acc+=CATS[k].w;if(r<acc)return k;}
  return 'stumps';
 }
 // v6.47 ПОТОЛОК ВЫСОТЫ ДЕКОРАЦИЙ.
 // Размер задавался ТОЛЬКО по ширине (tw), а высота получалась из пропорций
 // картинки. У вертикальных спрайтов (соотношение до 2.05) она вымахивала:
 // замер показал высоту до 205 мировых единиц при росте героя 113 — пень
 // почти вдвое выше человека. 12 из 24 картинок перерастали героя.
 // Задаём предел по ВЫСОТЕ и, если картинка вертикальная, ужимаем ширину.
 const DECO_MAX_H={stumps:104,bushes:78,stones:70,logs:74,fences:86,wide:150};
 function prop(cat,x,y){
  const c=CATS[cat];
  const im=DECO_IMGS[c.idx[Math.floor(drnd()*c.idx.length)]];
  let tw=c.tw[0]+drnd()*(c.tw[1]-c.tw[0]);
  const maxH=DECO_MAX_H[cat]||110;
  if(im&&im.naturalWidth&&im.naturalHeight){
   const ar=im.naturalHeight/im.naturalWidth;      // высота на единицу ширины
   if(tw*ar>maxH)tw=maxH/ar;                       // вертикальную — ужимаем
  }
  return {im,x,y,tw,flip:drnd()<0.5};
 }
 const inWorld=(x,y,m)=>x>m&&x<WORLD-m&&y>m&&y<WORLD-m;
 let wideCount=0;
 // Плотность v5.25: клетки 560px (~11×11), до 2 пропсов на клетку, пустых
 // полян меньше → ~150 декораций на мир, на экране видно 6–9 — реликвии чащи читаются.
 const CELL_D=560;
 for(let gy=0;gy*CELL_D<WORLD;gy++)for(let gx=0;gx*CELL_D<WORLD;gx++){
  const roll=drnd();
  if(roll<0.10)continue; // редкая пустая поляна, лес «дышит»
  const x0=gx*CELL_D+120+drnd()*(CELL_D-240); // 750 делит 6000 ровно, clamp не нужен
  const y0=gy*CELL_D+120+drnd()*(CELL_D-240);
  // не загораживаем точку старта — центр мира, где появляется игрок
  if(Math.abs(x0-WORLD/2)<360&&Math.abs(y0-WORLD/2)<360)continue;
  let cat=pickCat();
  if(cat==='wide'){if(wideCount>=5)cat='stumps';else wideCount++;}
  if(cat==='fences'){
   // ЗАБОР — обломки ЛИНИИ: 2–3 сегмента подряд по горизонтали, руины заставы
   const segs=2+Math.floor(drnd()*2);
   const p0=prop('fences',x0,y0);
   for(let s=0;s<segs;s++){
    const fx=x0+(s-(segs-1)/2)*p0.tw*0.85;
    if(!inWorld(fx,y0,80))break;
    const p=prop('fences',fx,y0);
    p.flip=false; // единая ориентация сегментов, иначе линия «ломается»
    decos.push(p);
   }
   continue;
  }
  decos.push(prop(cat,x0,y0));
  if(roll>0.55){ // v5.25: вторая декорация в клетке — чаща гуще, реликвии видны
   const cat2=pickCat();
   if(cat2!=='wide'&&cat2!=='fences'){
    const ox=x0+(drnd()<0.5?-1:1)*(110+drnd()*120);
    const oy=y0+(drnd()<0.5?-1:1)*(90+drnd()*100);
    if(inWorld(ox,oy,60))decos.push(prop(cat2,ox,oy));
   }
  }
 }
})();

