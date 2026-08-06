const HERO_CLIPS={
 idle:{seq:'idle',dur:1.60,loop:true ,prio:0},
 walk:{seq:'walk',dur:0.98,loop:true ,prio:1,stride:1.20}, // stride: путь за полный цикл в долях роста
 atk :{seq:'atk' ,dur:0.46,loop:false,prio:2,hit:0.55,gap:1.10},
 ult :{seq:'ult' ,dur:0.95,loop:false,prio:3,hit:0.11}
};
// v6.73: HERO JUICER — процедурная «дорогая» анимация поверх спрайтов.
// Так делают в Hades/Dead Cells: не больше кадров, а физика движения —
// squash&stretch, антиципация, овершут, инерция. Всё вокруг якоря ступней.
const _hs=(k)=>k*k*(3-2*k);   // smoothstep
function heroPose(){
 let sx=1,sy=1,rot=0;
 if(HA.clip==='atk'){
  // t 0..1: антиципация -> удар -> возврат -> овершут
  const t=Math.min(1,Math.max(0,HA.t/HERO_CLIPS.atk.dur));
  if(t<0.22){const e=_hs(t/0.22);sx=1+0.06*e;sy=1-0.06*e;rot=-0.05*e;}
  else if(t<0.55){const e=_hs((t-0.22)/0.33);sx=1.06-0.15*e;sy=0.94+0.15*e;rot=-0.05+0.15*e;}
  else if(t<0.85){const e=_hs((t-0.55)/0.30);sx=0.91+0.05*e;sy=1.09-0.05*e;rot=0.10-0.03*e;}
  else{const e=_hs((t-0.85)/0.15);sx=0.96-0.04*e;sy=1.04+0.04*e;rot=0.07-0.07*e;}
 }else if(P.specialFx>0){
  // ульта: накопление (сжался) -> выброс (растянулся)
  const t=Math.min(1,Math.max(0,1-P.specialFx/HERO_CLIPS.ult.dur));
  const hit=HERO_CLIPS.ult.hit||0.11;
  if(t<hit){const e=_hs(t/hit);sx=1+0.10*e;sy=1-0.10*e;rot=-0.07*e;}
  else{const e=_hs(Math.min(1,(t-hit)/(1-hit)));sx=1.10-0.16*e;sy=0.90+0.16*e;rot=-0.07+0.16*e;}
 }else if(P.moving){
  // бег: приземление шага — лёгкое сжатие; наклон корпуса вперёд
  const s=Math.sin(HA.phase*6.283);
  if(s<-0.55){const e=_hs((-0.55-s)/0.45);sx=1+0.028*e;sy=1-0.028*e;}
  rot=0.05+0.015*Math.sin(HA.phase*6.283);
 }else{
  // idle: дыхание
  const b=Math.sin(time*2.0);
  sy=1+0.006*b;sx=1-0.006*b;
 }
 return {sx,sy,rot};
}
let HA={clip:'idle',t:0,frame:1,phase:0,hitDone:false,onHit:null,atkCool:0,px:null,py:null};
function heroAnimSeq(name){
 const HL=HERO_LAYOUT[currentClass]||HERO_LAYOUT.warrior;
 if(name==='ult'){
  // v6.7: если у класса расписана ultSeq — берём её. Прежняя схема держала ВТОРОЙ
  // кадр восемь девятых клипа: у Волхва это 0.85 с полной неподвижности сразу после
  // каста, персонаж будто застывал в воздухе. Возврат через кадры атаки и стойки
  // убирает заморозку и не требует нового арта.
  if(HL.ultSeq&&HL.ultSeq.length)return HL.ultSeq;
  if(HL.ult&&HL.ult.length){const u=HL.ult;   // v5.53: настоящие кадры ульты
   return [u[0],u[1],u[1],u[1],u[1],u[1],u[1],u[1],u[1]];}
  const a=HL.atk,i=HL.idle;
  return [i[0],a[0],a[0],a[0],a[1],a[1],a[2],a[3],a[4],a[5],a[5],a[5]];}
 return HL[name]||HL.idle;
}
function heroAnimPlay(name){
 const c=HERO_CLIPS[name],cur=HERO_CLIPS[HA.clip]||HERO_CLIPS.idle;
 if(!c)return false;
 // v5.57: удар не перезапускается чаще, чем раз в gap — иначе автоатака съедает ходьбу
 if(name==='atk'){if(HA.atkCool>0)return false;HA.atkCool=c.gap||1.0;}
 if(HA.clip===name){if(!c.loop){HA.t=0;HA.hitDone=false;}return true;}
 if(!cur.loop&&HA.t<cur.dur&&c.prio<=cur.prio)return false; // удар/ульту не прерывать ходьбой
 HA.clip=name;HA.t=0;HA.hitDone=false;return true;
}
function heroAnimUpdate(dt){
 let cur=HERO_CLIPS[HA.clip]||HERO_CLIPS.idle;
 // v5.59: ходьба привязана к пройденному пути — ступни не скользят по земле
 const _dx=P.x-(HA.px==null?P.x:HA.px),_dy=P.y-(HA.py==null?P.y:HA.py);
 HA.px=P.x;HA.py=P.y;
 if(HA.clip==='walk'){
  const cfg=BOGATYR_CONFIG[currentClass]||BOGATYR_CONFIG.warrior;
  const hgt=(cfg.bodyH+(cfg.headR||10)*2)*(cfg.scale!=null?cfg.scale:0.42)*3.8;
  const stride=Math.max(20,hgt*(cur.stride||1.2));
  const step=(Math.hypot(_dx,_dy)/stride)*cur.dur;
  HA.t+=Math.min(step,dt*cur.dur*2.5);           // потолок 2.5 цикла в секунду
 }else HA.t+=dt;
 if(HA.atkCool>0)HA.atkCool-=dt;
 if(!cur.loop){
  const hp=cur.hit!=null?cur.hit:0.5;
  if(!HA.hitDone&&HA.t>=cur.dur*hp){HA.hitDone=true;const cb=HA.onHit;HA.onHit=null;if(cb)cb();}
  if(HA.t>=cur.dur){if(HA.onHit){const cb=HA.onHit;HA.onHit=null;cb();} HA.clip=P.moving?'walk':'idle';HA.t=0;HA.hitDone=false;}
 }else{
  if(P.moving&&HA.clip!=='walk'){HA.clip='walk';}
  else if(!P.moving&&HA.clip==='walk'){HA.clip='idle';}
 }
 cur=HERO_CLIPS[HA.clip]||HERO_CLIPS.idle;
 const seq=heroAnimSeq(cur.seq);
 const p=cur.loop?((HA.t%cur.dur)/cur.dur):Math.min(0.9999,HA.t/cur.dur);
 HA.phase=p;
 HA.frame=seq[Math.min(seq.length-1,Math.floor(p*seq.length))]||1;
}
function heroAtkDur(){return HERO_CLIPS.atk.dur;}
// v5.52: нормализация кадров — bbox силуэта, привязка к ступням (кадры имеют разный холст)
const _HMET=new WeakMap();
function heroMet(im){
 let m=_HMET.get(im); if(m)return m;
 m={ok:false};
 try{
  const S=64,c=document.createElement('canvas');c.width=S;c.height=S;
  const g=c.getContext('2d');g.drawImage(im,0,0,S,S);
  const d=g.getImageData(0,0,S,S).data;
  let x0=S,x1=-1,y0=S,y1=-1;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){if(d[(y*S+x)*4+3]>24){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}
  if(x1>=0&&y1>=0){
   // v6.6: центр НИЖНЕЙ полосы силуэта — это ступни. Горизонтальная привязка по
   // центру всего bbox уезжала вместе со взмахом меча: по замеру кадров Воина
   // разброс за цикл ходьбы 71 px против 37 у ступней, то есть герой дёргался
   // по горизонтали на ~30 экранных пикселей каждый цикл.
   const band=Math.max(1,Math.round((y1-y0)*0.15));
   let fx0=S,fx1=-1;
   for(let y=Math.max(y0,y1-band);y<=y1;y++)for(let x=x0;x<=x1;x++){
    if(d[(y*S+x)*4+3]>24){if(x<fx0)fx0=x;if(x>fx1)fx1=x;}
   }
   const fcx=(fx1>=0)?((fx0+fx1+1)/2)/S:((x0+x1+1)/2)/S;
   m={ok:true,x0:x0/S,x1:(x1+1)/S,y0:y0/S,y1:(y1+1)/S,fcx};
  }
 }catch(e){swallow('hero.meta',e);}
 _HMET.set(im,m);return m;
}
// v6.6 ГЛАВНАЯ ПРИЧИНА «герой не гладкий». Масштаб героя считался ЗАНОВО НА КАЖДЫЙ
// КАДР анимации из bbox силуэта именно этого кадра:
//     k=Math.min(tgt/bh, tgt*1.35/bw)
// Поднял герой руку — bbox стал выше — k уменьшился — ВЕСЬ ГЕРОЙ УМЕНЬШИЛСЯ.
// Отвёл меч в сторону — bbox шире — снова уменьшился. Плюс горизонтальная привязка
// шла по центру bbox, поэтому герой ещё и съезжал в сторону при каждой смене кадра.
// Итог: 8–20 раз в секунду персонаж пульсировал в размере и подрагивал по горизонтали,
// и это НЕ зависит от FPS — потому мой предыдущий фикс частоты анимации и не помог.
// Правильно: масштаб — величина КЛАССА, а не кадра. Считаем один раз по самому
// крупному силуэту из всех кадров (чтобы ни один не вылезал за габарит) и кэшируем.
// Пока не все кадры догрузились, результат не кэшируем — иначе зафиксируем масштаб
// по одному случайному кадру.
