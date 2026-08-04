function doSword(){
 const ang=Math.atan2(P.fy,P.fx),arc=3.5,reach=(95+24)*P.areaMul*wbalA('sword'); // v7.1 широкая косьба меча
 window._swordSlash={ang:ang,reach:reach,t:0.28,maxT:0.28}; // v7.5: сияющий полумесяц взмаха // v7.1 широкая косьба меча   // v6.34: дуга 126\u00b0 -> 200\u00b0
 // Замер: при 120 врагах на экране меч давал 583 промаха на 18 взмахов —
 // цели просто не попадали в узкий конус. Стартовое оружие не должно
 // требовать точного разворота (канон жанра: Whip бьёт в обе стороны).
 const classVfx=CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior;
 const candidates=aliveNear(P.x,P.y,reach+P.r);   // v5.89: труп не считается целью (удар уходил в кулдаун впустую)
 // Не проигрываем анимацию меча в пустоту: сначала проверяем реальную цель в секторе удара.
 let hasTarget=false;
 for(const e of candidates){
  const dx=e.x-P.x,dy=e.y-P.y,d=dist(dx,dy);
  if(d<reach+e.r){
   let da=Math.atan2(dy,dx)-ang;
   while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
   if(Math.abs(da)<arc/2){hasTarget=true;break;}
  }
 }
 if(!hasTarget)return false;
 // v6.40 ПЕРВЫЕ УДАРЫ. Взмах жил 0.22 с — на 60 fps это 13 кадров, глаз
 // едва успевает его заметить, отчего старт игры ощущался «ватным».
 // Продлеваем до 0.34 с (шлейф из v6.38 успевает прочитаться) и добавляем
 // рывок героя вперёд: тело подаётся за клинком, удар получает вес.
 slashes.push({ang,reach,t:0.34});P.atk=heroAtkDur();heroAnimPlay('atk');sfxSwing();
 P.kx=(P.kx||0)+Math.cos(ang)*40;P.ky=(P.ky||0)+Math.sin(ang)*40;
 // Фирменный «Удар заставы»: золотые искры + искры от столкновения — визуальный вес.
 for(let i=0;i<8;i++){const a=ang+rnd(-0.75,0.75),sp=rnd(50,200);spawnParticle(P.x+Math.cos(ang)*24,P.y+Math.sin(ang)*24,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.18,.42),i<3?classVfx.color:'#ff8a3c',150,0);}
 for(let i=0;i<4;i++){const a=ang+rnd(-0.4,0.4),sp=rnd(80,180);spawnParticle(P.x+Math.cos(ang)*30,P.y+Math.sin(ang)*30,Math.cos(a)*sp,Math.sin(a)*sp-20,rnd(.25,.5),classVfx.accent,100,0);}
 const swordW=weapons.find(w=>w.id==='sword');
 const evo=swordW&&swordW.evo;
 for(const e of candidates){
  const dx=e.x-P.x,dy=e.y-P.y,d=dist(dx,dy);
  if(d<reach+e.r){
   let da=Math.atan2(dy,dx)-ang;
   while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;
   if(Math.abs(da)<arc/2){
    let dmg=21*P.dmgMul*(1+0.22*(swordLvl-1))*(evo?2.0:1)*wbal('sword');   // v6.34
    let isCrit=P.crit&&seedRandom()<P.crit;
    if(isCrit){dmg*=2;sfxCrit();}
    hitEnemy(e,dmg,'phys',isCrit);
    if(evo){
     // Рагнарёк: кровоток (poisoned как DoT) + шанс
     if(seedRandom()<0.35+(P.evoSwordBleed||0)*0.08)e.poisoned=Math.max(e.poisoned||0,1.8+(P.evoSwordBleed||0)*0.35);
     if(P.synergyMark)e.markT=Math.max(e.markT||0,3);
    }
    for(let i=0;i<3;i++){const a=Math.random()*TAU,sp=rnd(60,180);if(!spawnParticle(e.x-dx*0.3,e.y-dy*0.3,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.3,.6),'#7a2412',150,1))break;}
   }
  }
 }
 return true;
}


function doBow(){
 // Дальний выстрел Стража. Без цели — не тратим анимацию.
 // Старт: короткий дозорный выстрел. Дальность растёт с lvl и слегка с areaMul.
 // areaMul больше не раздувает радиус ×1.25+ на старте Стража.
 const range=215+28*(bowLvl-1)+Math.max(0,(P.areaMul||1)-1)*28+(P.bowRange||0);
 const candidates=aliveNear(P.x,P.y,range+24);
 if(!candidates.length)return false;
 let best=null,bestScore=1e9;
 const fx=P.fx||1,fy=P.fy||0;
 for(const e of candidates){
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  if(d>range+e.r)continue; // жёсткий cap дальности
  const align=1-Math.max(-1,Math.min(1,(dx*fx+dy*fy)/d));
  const score=d+align*90;
  if(score<bestScore){bestScore=score;best=e;}
 }
 if(!best)return false;
 const bowW=weapons.find(w=>w.id==='bow');
 const evo=bowW&&bowW.evo;
 const ang=Math.atan2(best.y-P.y,best.x-P.x);
 P.fx=Math.cos(ang);P.fy=Math.sin(ang);
 P.atk=heroAtkDur();heroAnimPlay('atk');sfxSwing();
 const spd=390+18*bowLvl;
 const dmg=23*P.dmgMul*(1+0.20*(bowLvl-1))*(evo?1.9:1)*wbal('bow');   // v6.34
 // life ≈ дистанция/скорость + небольшой запас (не снайпер через полкарты)
 const life=Math.min(0.70,0.38+range/spd);
 const tipPois=P.arrowPoison||0, tipFrost=P.arrowFrost||0;
 const mkArrow=(aang,mul,lifeMul,rlMul)=>({x:P.x,y:P.y-8,vx:Math.cos(aang)*spd*mul,vy:Math.sin(aang)*spd*mul,life:life*lifeMul,dmg:dmg*(mul<1?0.55:1),evo:!!evo,pierced:0,rangeLeft:range*rlMul,pois:tipPois,frost:tipFrost});
 arrows.push(mkArrow(ang,1,1,1));
 if((P.bowDouble||0)>0&&seedRandom()<P.bowDouble){
  arrows.push(mkArrow(ang+srnd(-0.12,0.12),0.92,0.92,0.92));   // v5.81: шанс брался из seedRandom, а разброс — из несеяного rnd
 }
 if(evo){
  const rain=Math.min(5,2+(P.evoBowRain||0));
  for(let i=0;i<rain;i++){
   const t=rain==1?0:(i/(rain-1)-0.5);
   arrows.push(mkArrow(ang+t*0.34,0.88+0.04*(1-Math.abs(t)),0.9,0.9));
  }
 }
 aimLines.push({ang,len:Math.min(range,160),t:0.14});

 const cv=CLASS_VISUALS[currentClass]||CLASS_VISUALS.archer;
 for(let i=0;i<5;i++){
  const a2=ang+rnd(-0.35,0.35),sp=rnd(40,140);
  spawnParticle(P.x+Math.cos(ang)*18,P.y-8+Math.sin(ang)*18,Math.cos(a2)*sp,Math.sin(a2)*sp,rnd(.12,.3),i%2?cv.color:cv.accent,40,0);
 }
 return true;
}
function updateArrows(dt){
 for(let i=arrows.length-1;i>=0;i--){
  const a=arrows[i];
  const step=Math.hypot(a.vx,a.vy)*dt;
  // v6.17: СЕРП — летит по дуге и возвращается к игроку (возвратный снаряд).
  if(a._boom){
   a._bmT+=dt;
   const ang=Math.atan2(a.vy,a.vx),sp=Math.hypot(a.vx,a.vy)||1;
   // после половины пути разворачиваем к игроку — «возврат в руку»
   if(a._bmT>0.42||a._bmHome){
    const hx=P.x-a.x,hy=P.y-a.y,hd=Math.hypot(hx,hy)||1;
    const want=Math.atan2(hy,hx);
    let diff=want-ang;while(diff>Math.PI)diff-=6.2832;while(diff<-Math.PI)diff+=6.2832;
    const turn=Math.min(Math.abs(diff),(a._bmHome?9:5.5)*dt)*Math.sign(diff);
    const na=ang+turn;a.vx=Math.cos(na)*sp;a.vy=Math.sin(na)*sp;
    // вернулся в руку — снаряд снимается, цикл замкнулся
    if(hd<26&&a._bmT>0.5){arrows.splice(i,1);continue;}
   }else{
    // на первой половине — закрутка по дуге, чтобы читалось как серп, а не стрела
    const na=ang+2.6*dt;a.vx=Math.cos(na)*sp;a.vy=Math.sin(na)*sp;
   }
   a._hit=null;   // возвратный снаряд бьёт одну цель повторно на обратном пути
  }
  a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;
  if(a.rangeLeft!=null){a.rangeLeft-=step;if(a.rangeLeft<=0){arrows.splice(i,1);continue;}}
  if(a.life<=0){arrows.splice(i,1);continue;}
  if(ACTIVE.particles.length<MAX_PARTICLES-10&&Math.random()<0.4){
   spawnParticle(a.x,a.y,-a.vx*0.02,-a.vy*0.02,rnd(.08,.18),a.evo?'#ffcf6a':'#cfe6a0',0,0);
  }
  const near=enemiesNear(a.x,a.y,28);
  for(const e of near){
   if(e.hp<=0||e.dying>0)continue;
   // v5.82: стрела не помнила, кого уже задела. Хитбокс врага (r=12..20) шире шага
   // стрелы за кадр (~6.5 px), поэтому эволюционная стрела била ОДНУ И ТУ ЖЕ цель
   // 2 кадра подряд и «пробой» заканчивался на первом же враге, никого не пронзив.
   if(a._hit&&a._hit.indexOf(e)>=0)continue;
   if(dist(e.x-a.x,e.y-a.y)<e.r+6){
    (a._hit||(a._hit=[])).push(e);
    let isCrit=P.crit&&seedRandom()<P.crit;
    let dmg=a.dmg;if(isCrit){dmg*=2;sfxCrit();}
    hitEnemy(e,dmg,'phys',isCrit);
    if(a.pois){e.poisoned=Math.max(e.poisoned||0,1.6+0.6*a.pois);}
    if(a.frost&&seedRandom()<0.35+0.1*a.frost){e.frozen=Math.max(e.frozen||0,1.2+0.3*a.frost);}
    if(P.synergyMark){e.markT=Math.max(e.markT||0,3); e.markStacks=Math.min(5,(e.markStacks||0)+1);}
    for(let k=0;k<3;k++){const ang=Math.random()*TAU,sp=rnd(40,120);spawnParticle(e.x,e.y,Math.cos(ang)*sp,Math.sin(ang)*sp,rnd(.15,.35),a.pois?'#7ab04a':(a.frost?'#bfe0ff':'#9ac06a'),80,0);}
    a.pierced=(a.pierced||0)+1;
    // v6.17: КАМЕНЬ — вместо исчезновения прыгает в следующую цель поблизости.
    // Чем плотнее толпа, тем больше прыжков: награда за игру в куче.
    if(a._ric>0){
     a._ric--;
     // v6.19: Град Сварога — эво-камень раскалывается: при отскоке летит
     // осколок в сторону. Осколки (_shard) не раскалываются дальше.
     if(a._split&&!a._shard){
      const ang0=Math.atan2(a.vy,a.vx)+1.4,ang1=Math.atan2(a.vy,a.vx)-1.4;
      for(const sa of [ang0,ang1]){
       arrows.push({x:a.x,y:a.y,vx:Math.cos(sa)*340,vy:Math.sin(sa)*340,life:1.2,
        dmg:a.dmg*0.6,evo:true,pierced:0,rangeLeft:null,_hit:[],_ric:0,_shard:true,
        _col:'#ffd27a',_stone:true});
      }
     }
     const nx=aliveNear(a.x,a.y,190).filter(o=>(!a._hit||a._hit.indexOf(o)<0));
     if(nx.length){
      const t=nx.sort((p1,p2)=>dist2(p1.x-a.x,p1.y-a.y)-dist2(p2.x-a.x,p2.y-a.y))[0];
      const ta=Math.atan2(t.y-a.y,t.x-a.x),sp2=Math.hypot(a.vx,a.vy)||300;
      a.vx=Math.cos(ta)*sp2;a.vy=Math.sin(ta)*sp2;a.dmg*=0.88;a.life=Math.max(a.life,0.8);
      break;
     }
     arrows.splice(i,1);break;
    }
    if(a._boom)break;   // серп летит дальше по дуге
    if(a._pierce==null)a._pierce=wPierce(a.id||'');   // v6.19 (C1): ось пробития
    if(!a.evo||a.pierced>=Math.max(1,Math.round(2*a._pierce))){arrows.splice(i,1);break;}
    a.dmg*=0.6;
   }
  }
 }
}

// v5.61: молния бьёт по врагу, а не по кулдауну. Раньше ветка bolt запускала
// анимацию удара при enemies.length — то есть при живом враге в любой точке карты.
