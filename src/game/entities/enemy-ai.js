function updateEnemyTimers(e,dt){
 if(e.frozen>0)e.frozen-=dt; if(e.markT>0){e.markT-=dt;if(e.markT<=0)e.markStacks=0;}
 if(e.poisoned>0)e.poisoned-=dt;
 if(e.fireT>0)e.fireT-=dt;
 if(e.telegraphT>0)e.telegraphT-=dt; // v6.16: таймер телеграфа выстрела шутера
 if(e.spawnT>0)e.spawnT-=dt;
}
function updateEnemyMovement(e,dt,dx,dy,d,d2,DENSITY_R2){
 e.kx=e.kx||0;e.ky=e.ky||0;e.slow=Math.min(1,(e.slow||1)+dt*1.5);
 // v6.17: ЭТО И ЕСТЬ ПРИЧИНА КУЧИ. Несмотря на имя, densitySlow не смотрел на
 // плотность ВРАГОВ — он брал (dx,dy), то есть вектор на ИГРОКА, и тормозил врага
 // до 0.2 тем сильнее, чем тот ближе. Радиус 35% экрана (~370px) накрывает всю
 // боевую зону, поэтому КАЖДЫЙ подошедший синхронно падал до 20% скорости и
 // застывал стеной, а задние на полном ходу впечатывались в него. Расталкивание
 // такую пробку разжать не может: оно борется со скоростью, а прессует поток сзади.
 // Одинаковый множитель у всех давал ещё и характерную РЕГУЛЯРНУЮ СЕТКУ — враги
 // двигались абсолютно идентично. Комментарий у DENSITY_R («если врагов слишком
 // много РЯДОМ») показывает, что подсчёт соседей задумывался, но написан не был.
 // Считаем настоящую локальную плотность: тормозим только того, кто реально
 // упёрся в затор из своих, и мягко — не ниже 0.55.
 if(e.spawnT<=0){
  let _near=0;
  const _cr=(e.r+16)*2.6,_cr2=_cr*_cr;
  const _nb=_sepNear(e.x,e.y);   // v6.17: 9 ячеек вместо всех врагов
  for(let _i=0;_i<_nb.length;_i++){
   const o=_nb[_i];
   if(o===e)continue;
   const _ox=e.x-o.x,_oy=e.y-o.y,_o2=_ox*_ox+_oy*_oy;
   if(_o2<_cr2){
    // считаем только тех, кто МЕЖДУ мной и игроком: затор впереди тормозит,
    // напирающие сзади — нет, иначе задние ряды тормозят сами себя.
    if(_ox*dx+_oy*dy<0){_near++;if(_near>=4)break;}
   }
  }
  e.densitySlow=1;
 }
 const isSpawning=e.spawnT>0;
 let spd=isSpawning?0:(e.spd*viewSpeedMul()*e.slow*(e.frozen>0?0.75:1)*(e.densitySlow||1));   // v6.13: враги масштабируются тем же множителем, погоня сохраняет пропорции
 // AI поведение по типам
 if(e.ai==='zigzag'){
  e.zigzagT-=dt;
  if(e.zigzagT<=0){e.zigzagT=srnd(0.4,1);e.zigzag+=Math.PI/2+srnd(-0.4,0.4);}
  const perpA=e.zigzag+Math.PI/2;
  e.kx+=Math.cos(perpA)*60*dt;
  e.ky+=Math.sin(perpA)*60*dt;
 }
 if(e.ai==='zigzag'&&!isSpawning&&seedRandom()<0.35){
  spawnParticle(e.x+rnd(-3,3),e.y-e.r*0.3+rnd(-3,3),-e.kx*0.15,-e.ky*0.15,rnd(.15,.35),'#6ac04a',100,0);
 }
 if(e.ai==='kamikaze'&&d>150)spd*=1.5;
 // v6.33: замедление танка не применяем к ЭЛИТЕ — она охотник за игроком,
 // а с множителем 0.7 (40 ед/с) не догоняла его никогда. Мини-боссы и
 // Баба Яга остаются медленными: у них своя роль и своё расписание.
 if(e.ai==='tank'&&!e.elite)spd*=0.7;
 if(e.affix==='furious')spd*=1.4;   // v6.62: Яростный — охотник
 if(e.atkT>0&&e.type==='baba_yaga')spd=0;
 // v6.18d: пока идёт локальный хитстоп, враг не едет — но отдача (e.kx/e.ky)
 // применяется отдельно и продолжает работать, поэтому его всё равно отбрасывает.
 // Получается «удар вбил в него паузу», а не «игра подвисла».
 if(e.ai==='stalker'){if(d>380)spd*=1.7;else spd*=0.95;}
 if(e.ai==='shooter'){
  if(e.telegraphT>0){
   // v6.16: ТЕЛЕГРАФ ВЫСТРЕЛА — 0.4с прицеливания: шутер замедляется и
   // рисует линию цели + пульсирующую мишень (см. drawEnemiesLayer). Выстрел
   // происходит только когда телеграф истёк (декремент в updateEnemyTimers) —
   // у игрока есть время увернуться.
   spd*=0.25;
   if(e.telegraphT<=0){
    e.fireT=2;
    let dmg=e.dmg*0.5*enemyDmgMul(time);   // v7.36: снаряд растёт вместе с контактным ударом
    dmg*=armorMul();   // v5.76: та же броня, что и в контактном уроне
    const projDx=dx,projDy=dy;const projD=Math.sqrt(projDx*projDx+projDy*projDy)||1;
    for(let pi=0;pi<6;pi++){const t=0.15+0.12*pi;spawnParticle(e.x+projDx/projD*e.r*2+projDx*t*0.7,e.y+projDy/projD*e.r*2+projDy*t*0.7,rnd(-20,20),rnd(-20,20),rnd(.18,.35),'#b478ff',0,0);}
    // v5.76: раньше урон снаряда уходил в тишину — ни sfxHurt, ни тряски, ни i-frames.
    if(P.invuln>0){/*i-frames*/}else{P.hp-=dmg;if(dmg>0){runDmgTaken+=dmg;/* убрана временная диагностика попаданий снарядом */sfxHurt();klyukaCharge+=dmg;onPlayerHurtW(dmg);noteHurt(e,dmg);}spawnDmgText(P.x,P.y-P.r,Math.round(dmg),'void');spawnFlash(P.x,P.y,0,'#b478ff');spawnParticle(P.x,P.y-P.r*0.5,0,0,0.25,'#d4a0ff',0,0);}
   }
  } else if(d>200&&d<400&&e.fireT<=0&&e.frozen<=0){
   e.telegraphT=0.4; // начать предупреждение вместо мгновенного выстрела
  }
 }
 let _mvx=dx/d,_mvy=dy/d;
 if(e.ai==='flee'){
  // v6.63: курьер убегает ОТ игрока, но не дальше арены вокруг камеры
  const _dCam=dist2(e.x-(cam.x+W/2),e.y-(cam.y+H/2));
  if(_dCam<950*950){_mvx=-dx/d;_mvy=-dy/d;}
  else{_mvx=0;_mvy=0;}
 }
 // v6.17: враг, уже стоящий вплотную, продолжал ехать в игрока на полной скорости.
 // Толку ноль (урон и так по кулдауну hitT), а задние ряды при этом впрессовывают
 // передние в игрока и друг в друга — расталкивание такое давление не пересиливает,
 // и толпа схлопывается в одну точку. Гасим подход в зоне контакта: у самой цели
 // остаётся 15% хода, дальше плавно набирается до полного.
 if(!e.boss&&!e.mini){
  const _touch=e.r+P.r, _ring=_touch+18;
  // v6.17: жёсткое разведение уже не даёт влезать друг в друга, поэтому сильное
  // торможение больше не нужно — оно лишь замедляло подход всей толпы.
  if(d<_ring)spd*=0.45+0.55*Math.max(0,(d-_touch)/(_ring-_touch));
 }
 if(e.type==='naviya'&&e.atkT>0){
  _mvx=e.lx-e.x;_mvy=e.ly-e.y;const _md=Math.sqrt(_mvx*_mvx+_mvy*_mvy)||1;_mvx/=_md;_mvy/=_md;spd=e.pounceSpd||560;
 }
 // v6.16: SEPARATION (плавное расталкивание) — враги не сбиваются в плотную кучу.
 // Вместо жёсткого сдвига позиции используем kx/ky (они затухают ×0.82 в движении ниже),
 // чтобы не дергать рендер и не давать всплесков _evx/_evy — именно они вызывали
 // мерцание анимации лешего. Здесь тоже ожидаем, что spawnT может быть undefined.

 // v6.17: РАСТАЛКИВАНИЕ ЧЕРЕЗ kx/ky ПРОИГРЫВАЕТ ПОГОНЕ НА ПОРЯДОК и поэтому не
 // работало никогда. Считаем: погоня даёт 95*dt = 1.58 px/кадр строго к центру.
 // Импульс же затухает на 18% за кадр, поэтому устойчивое значение kx = push/0.18,
 // и даже при 90% перекрытия это 0.65 px/кадр, а при реальных 30% — 0.07 px/кадр,
 // в 22 раза слабее погони. Сколько ни поднимай коэффициент, куча всё равно
 // схлопывается: сила стягивания просто больше силы отпора.
 // Меняем подход на позиционный (так делают Vampire Survivors и весь жанр):
 // перекрывшихся РАЗДВИГАЕМ прямо по координатам, каждого на половину перекрытия.
 // Это не сила, а ограничение — его нельзя «пересилить» скоростью, поэтому строй
 // держится при любом числе врагов. Импульс kx/ky остаётся только для отбрасывания
 // от ударов, чем он и был изначально.
 let _sepDx=0,_sepDy=0;
 if(!(e.spawnT>0)&&!e.boss){
  const _sn=_sepNear(e.x,e.y);
  for(let _j=0;_j<_sn.length;_j++){
   const o=_sn[_j];
   if(o===e||o.boss||o.spawnT>0)continue;
   const ox=e.x-o.x,oy=e.y-o.y,od2=ox*ox+oy*oy;
   const minD=e.r+(o.r||14)+6;
   if(od2>=minD*minD)continue;
   let od=Math.sqrt(od2),nx,ny;
   // центры совпали точка в точку (бывает на спавне) — od=0 давало NaN и враг
   // исчезал с экрана навсегда. Разводим по вращающемуся направлению.
   if(od<0.001){const a=(e._sepA=(e._sepA||seedRandom()*6.283)+0.017);nx=Math.cos(a);ny=Math.sin(a);od=0.001;}
   else{nx=ox/od;ny=oy/od;}
   // half: каждый уступает половину, пара расходится на полное перекрытие.
   // 0.5 сразу давало бы дрожание в плотной толпе (пары перекидывают друг друга),
   // поэтому берём 0.28 — за 2-3 кадра сходится плавно и без вибрации.
   const half=(minD-od)*0.28;
   e.x+=nx*half;e.y+=ny*half;_sepDx+=nx*half;_sepDy+=ny*half;
   // сосед двигается тоже, но его _prevX/_lx правим синхронно: иначе на СВОЁМ
   // кадре он увидит этот сдвиг как собственную скорость, что задерёт _evx/_evy
   // и темп его анимации — ровно то мерцание, из-за которого separation и
   // отключили лешему в v6.16.
   if(!o.boss&&!o.mini){o.x-=nx*half;o.y-=ny*half;
    if(o._prevX!=null)o._prevX-=nx*half;if(o._prevY!=null)o._prevY-=ny*half;
    if(o._lx!==undefined)o._lx-=nx*half;if(o._ly!==undefined)o._ly-=ny*half;}
  }
 }
 if(e._lx!==undefined){e._lx+=_sepDx;e._ly+=_sepDy;}   // v6.17: сдвиг разведения не должен читаться анимацией как ход врага
 e._prevX=e.x;e._prevY=e.y;
 if(!e._skipMove){e.x+=_mvx*spd*dt+e.kx*dt;e.y+=_mvy*spd*dt+e.ky*dt;e.x=clamp(e.x,0,WORLD);e.y=clamp(e.y,0,WORLD);}
  // v6.74: расталкивание (e.x+=nx*half) и отброс (kx/ky) могут вынести врага за
  // границу мира — без clamp он исчезает навсегда. Фиксим в пределах [0, WORLD].
  if(e.x<0)e.x=0;else if(e.x>WORLD)e.x=WORLD;
  if(e.y<0)e.y=0;else if(e.y>WORLD)e.y=WORLD;
 // v6.17: было e.kx*=0.82 ЗА КАДР — на 120 Гц отталкивание гасло вдвое быстрее,
 // чем на 60, и на быстрых экранах враги слипались заметно сильнее. Привязываем
 // затухание ко времени: 0.82 за кадр при 60 Гц = коэффициент ~1/e за 0.05с.
 const _kd=Math.pow(0.65,dt*60);
 e.kx*=_kd;e.ky*=_kd;e._skipMove=false;
 return isSpawning;
}
function updateEnemyAuras(e,dt,thornR,thornR2,frostR,frostR2,dx,dy,d,d2){
 // v5.72: множители ниже включают СИНЕРГИИ (флаги P.syn*).
 // Каждый флаг ставится ровно один раз в SYNERGIES[].apply().
 if(e.poisoned>0)dealDamage(e,(P.synBloodDance?6:4)*dt);          // Кровавый танец: яд тикает сильнее
 if(thornR>0&&d2<thornR2+e.r*e.r){
  let td=7*thorn.lvl*P.dmgMul*dt;
  if(P.synStormShield)td*=1.35;                                    // Грозовой оберег
  if(P.synApocalypse)td*=1.25;
  if(P.synEmberStorm)td*=1.25;
  if(P.synShatterFrost&&e.frozen>0)td*=1.40;                       // Хрупкий лёд: мёрзлые ломаются
  // v5.80: «Шипастая петля» (Evo-шипы) — флаг ставился, но не читался нигде.
  if(P.evoThornWeb){td*=1+0.25*P.evoThornWeb;e.slow=Math.min(e.slow,0.62);}
  dealDamage(e,td);
  // Ядовитый терн: шипы отравляют всегда, иначе — базовый шанс 5%
  if(P.synPoisonShards)e.poisoned=Math.max(e.poisoned||0,2);
  else if(seedRandom()<0.05)e.poisoned=2;
 }
 if(frostR>0&&d2<frostR2+e.r*e.r){
  e.slow=Math.min(e.slow,P.synDeathMist?0.50:0.70);                // Мёртвый туман: вязнут сильнее
  dealDamage(e,2.5*frost.lvl*P.dmgMul*dt);
  // v5.80: «Зимний плен» (Evo-стужа) — флаг ставился, но не читался нигде.
  if(P.evoFrostBind&&e.frozen>0)dealDamage(e,3*frost.lvl*P.dmgMul*dt*P.evoFrostBind);
  // Шанс сковать — за СЕКУНДУ, а не за кадр. Бросок шёл каждый шаг физики:
  // 4% за кадр это 2.4 срабатывания в секунду, а заморозка держится 1.5с.
  // Установившаяся доля замороженных = r*1.5/(1+r*1.5) = 78%: почти вся аура
  // стояла неподвижно всегда. Владелец читал это не как контроль, а как
  // подвисание игры — и был прав, экран действительно замирал.
  // Ставим 0.4/с: та же формула даёт 37%, контроль виден, поле живёт.
  // Урон в строке выше уже нормирован на dt — приводим бросок к тому же виду.
  const fz=((P.synIceBlade?0.8:0.4)+0.4*(P.evoFrostBind||0))*dt;   // Клинок Мораны: чаще сковывает
  if(seedRandom()<fz)e.frozen=1.5;
 }
}
function updateOneEnemy(e,dt,thornR,thornR2,frostR,frostR2,DENSITY_R2){
  // УМИРАЮЩИЙ Древень: двигаем только таймер анимации падения.
  // hp уже 0, лут выдан — туша ждёт конца кадров f_20..f_24.
  if(e.dying>0){e.dying-=dt;e.at=(e.at||0)+dt;
  // v5.79: раньше здесь kx/ky только ГАСЛИ, но к координатам не применялись —
  // импульс отлёта, который killDrops выдаёт трупу, уходил в никуда, и туша
  // умирала строго на месте. Двигаем и обновляем _prevX для интерполяции.
  e._prevX=e.x;e._prevY=e.y;e.x+=e.kx*dt;e.y+=e.ky*dt;e.kx*=0.8;e.ky*=0.8;
   if(e.deathFlash>0)e.deathFlash-=dt;   // v5.73: вспышка живёт и на умирающем
   // v6.43 БЕЛЫЕ ОВАЛЫ НА ТРУПАХ — вот он, настоящий источник.
   // Эта ветка делает return ДО общей строки `if(e.hit>0)e.hit-=dt` ниже,
   // поэтому у умирающего e.hit ЗАМИРАЛ на своём значении (0.5 при добивающем
   // ударе) и не убывал никогда. Белая вспышка попадания висела над трупом всю
   // анимацию смерти — до 1.25 секунды, — и в гуще боя экран покрывался
   // белыми яйцами над телами. Найдено по пикселям: у всех пятен dying>0
   // и hit=0.50 при том, что вспышек в этой точке не было.
   // Гасим таймеры удара и здесь — втрое быстрее, чтобы труп сразу тускнел.
   if(e.hit>0)e.hit-=dt*3;
   if(e.flash>0)e.flash-=dt*3;
   return;}
  if(e.deathFlash>0)e.deathFlash-=dt;

  // v5.72: фаза таймеров
  updateEnemyTimers(e,dt);

  const dx=P.x-e.x,dy=P.y-e.y;
  const d2=dist2(dx,dy);
  const d=Math.sqrt(d2)||1;

  // v5.72: фаза движения (включает AI, спец-навыки shooter)
  const isSpawning=updateEnemyMovement(e,dt,dx,dy,d,d2,DENSITY_R2);

  // v6.18d: анимация врага тоже замирает на время локального хитстопа —
  // без этого он «дёргается на месте» и пауза не читается.
  e.at=(e.at||0)+dt;
  if(e.flash>0)e.flash-=dt;if(e.hit>0)e.hit-=dt;
  if(e.boltT>0)e.boltT-=dt;

  // v5.72: фаза аур
  updateEnemyAuras(e,dt,thornR,thornR2,frostR,frostR2,dx,dy,d,d2);
  if(e.boss){
   // v5.4 Ритм: I корни → II ярость+заряд → III бешенство+кольцо
   const ph=e.phase||1;
   const baseSpd=ph===1?34:ph===2?44:54;
   e.chargeT=(e.chargeT||0)-dt;
   const canCharge=ph>=2&&d>180&&d<560&&!isSpawning&&!e.chargeDir&&(e.chargeTelegraph||0)<=0;
   if(e.chargeT<=0&&canCharge){
    e.chargeT=ph===3?2.6:3.4;
    e.chargeTelegraph=ph===3?0.42:0.55;
    e.chargeDir={x:dx/(d||1),y:dy/(d||1)};
    e.chargeDuration=0;
    spawnFlash(e.x,e.y-e.r*0.5,1,ph===3?'#ff4a3a':'#ff8a40');
   }
   if(e.chargeTelegraph>0){
    e.chargeTelegraph-=dt; e._skipMove=true;
    if(Math.random()<0.35)spawnParticle(e.x+rnd(-18,18),e.y+10,rnd(-20,20),rnd(-40,-10),rnd(.15,.3),'#6a4a2a',80,0);
   }else if(e.chargeDir){
    e._skipMove=true;
    const cspd=ph===3?320:270;
    e.x+=e.chargeDir.x*cspd*dt; e.y+=e.chargeDir.y*cspd*dt;
    e.chargeDuration=(e.chargeDuration||0)+dt;
    if(dist2(e.x-P.x,e.y-P.y)<140*140||e.chargeDuration>0.45){
     hazards.push({x:clamp(e.x,0,WORLD),y:clamp(e.y,0,WORLD),r:ph===3?96:78,state:'tele',t:0.35,kind:'root',dmg:(ph===3?32:24)*BALANCE.bossHazMul});
     e.chargeDir=null;e.chargeDuration=0;e.spd=baseSpd;e._skipMove=false;
     if(e.boss){shake=ph===3?5:4;}   // v6.17: элиту исключили, амплитуда снижена
     sfxDeath();
    }
   }
   e.slamT-=dt;
   if(e.slamT<=0){
    e.slamT=ph===1?3.4:ph===2?2.4:1.7;
    const n=ph===1?3:ph===2?5:7, spread=ph===3?210:170;
    if(ph>=3){
     // v5.11 B2: спираль корней вокруг игрока (читаемый паттерн)
     const base=time*2.1;
     for(let i=0;i<n;i++){
      const ang=base+i*(TAU/n), rad=90+i*22;
      hazards.push({x:clamp(P.x+Math.cos(ang)*rad,0,WORLD),y:clamp(P.y+Math.sin(ang)*rad,0,WORLD),r:74,state:'tele',t:0.7+i*0.04,kind:'root',dmg:28*BALANCE.bossHazMul});
     }
    }else{
    for(let i=0;i<n;i++){
     hazards.push({x:clamp(P.x+srnd(-spread,spread),0,WORLD),y:clamp(P.y+srnd(-spread*0.85,spread*0.85),0,WORLD),r:ph===3?80:70,state:'tele',t:ph===3?0.75:0.9,kind:'root',dmg:(ph===3?30:24)*BALANCE.bossHazMul});
    }
    }
    for(let wi=0;wi<18;wi++){
     const wa=wi*0.35;
     spawnParticle(e.x+Math.cos(wa)*55,e.y+Math.sin(wa)*55,Math.cos(wa)*rnd(100,240),Math.sin(wa)*rnd(100,240),rnd(.25,.55),ph>=3?'#ff5a42':(ph===2?'#ff8a40':'#c98a3a'),280,0);
    }
    sfxDeath();
   }
   if(ph>=3){
    e.ringT=(e.ringT==null?4:e.ringT)-dt;
    if(e.ringT<=0){
     e.ringT=4.2;
     hazards.push({x:e.x,y:e.y,r:40,state:'tele',t:0.85,kind:'ring',grow:220,dmg:28*BALANCE.bossHazMul,ox:e.x,oy:e.y});
     spawnFlash(e.x,e.y-20,1,'#ff6a4a');
     log('🌀 Змей Горыныч рвёт землю кольцом!','warn');
    }
   }
   if(ph===1&&e.hp<e.maxhp*0.66){
    e.phase=2;e.spd=44;
    if(e.boss){shake=6;}   // v6.17: хитстоп убран
    flashScreen('#ff8a40',0.35);
    EL('bossbar').classList.add('enrage');
    const el=EL('bosshp'); if(el)el.classList.add('phase2');
    const bp=EL('bossphase'); if(bp)bp.textContent='фаза II · ярость';
    EL('bossname').textContent='ЗМЕЙ ГОРЫНЫЧ · ЯРОСТЬ';
    for(let ri=0;ri<3;ri++){
     if(liveEnemies()<40){   // v5.82: было enemies.length — трупы занимали лимит
      // v5.95: угол брался из seedRandom, а РАДИУС — из несеяного rnd, в одной строке.
      const ra=seedRandom()*TAU,rx=P.x+Math.cos(ra)*srnd(180,300),ry=P.y+Math.sin(ra)*srnd(180,300),h=ETYPES.leshiy.hp*diffMul*1.2;
      acquireEnemy({...ETYPES.leshiy,x:clamp(rx,0,WORLD),y:clamp(ry,0,WORLD),hp:h,maxhp:h,type:'leshiy',flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,ai:'chase',dmgMod:1.1,fireT:0});
     }
    }
    for(let i=0;i<6;i++){const a=i/6*TAU;hazards.push({x:clamp(e.x+Math.cos(a)*120,0,WORLD),y:clamp(e.y+Math.sin(a)*120,0,WORLD),r:68,state:'tele',t:0.8,kind:'root',dmg:24*BALANCE.bossHazMul});}
    log('⚠ Змей Горыныч входит в ЯРОСТЬ! Корни встают из земли…','warn');sfxBoss();
   }else if(ph===2&&e.hp<e.maxhp*0.33){
    e.phase=3;e.spd=54;e.dmg=(e.dmg||22)*1.15;shake=7;   // v6.17: хитстоп убран
    flashScreen('#ff3a2a',0.45);
    const el=EL('bosshp'); if(el){el.classList.remove('phase2');el.classList.add('phase3');}
    const bp=EL('bossphase'); if(bp)bp.textContent='фаза III · бешенство';
    EL('bossname').textContent='ЗМЕЙ ГОРЫНЫЧ · БЕШЕНСТВО'; // v6.74: имя синхронно с интро/HUD
    e.ringT=1.2;
    for(let ri=0;ri<4;ri++){
     if(liveEnemies()<42){   // v5.82: то же, что выше
      // v5.95: то же в фазе III — радиус подкрепления был несеяным.
      const ra=seedRandom()*TAU,rx=P.x+Math.cos(ra)*srnd(160,280),ry=P.y+Math.sin(ra)*srnd(160,280),h=ETYPES.bognik.hp*diffMul;
      acquireEnemy({...ETYPES.bognik,x:clamp(rx,0,WORLD),y:clamp(ry,0,WORLD),hp:h,maxhp:h,type:'bognik',flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,ai:'chase',dmgMod:1.15,fireT:0,spawnT:0.35,warnT:0.35});
     }
    }
    log('☠ БЕШЕНСТВО! Земля рвётся кольцами — не стой в пятнах!','warn');sfxBoss();
   }
  }

  // ДРЕВЕНЬ (мини-босс): взмах корнями, когда игрок в зоне досягаемости.
  // atkT — длительность анимации (кадры f_13..f_19); зона-телеграф hazards
  // активируется ровно в момент удара (t = atkT), так что атаку можно разминуть.
  if(e.type==='baba_yaga'){
   e.slamT-=dt;
   if(e.atkT>0){e.atkT-=dt;}
   else if(e.slamT<=0&&d<330&&!isSpawning){
    e.atkT=0.85;
    e.slamT=(e.phase===2)?3.2:4.6;
    const rr=(e.phase===2)?110:92;
    hazards.push({x:clamp(P.x+srnd(-40,40),0,WORLD),y:clamp(P.y+srnd(-40,40),0,WORLD),r:rr,state:'tele',t:0.85,kind:'root',dmg:(e.phase===2)?28:22});
    if(e.phase===2){
     hazards.push({x:clamp(P.x+srnd(-90,90),0,WORLD),y:clamp(P.y+srnd(-90,90),0,WORLD),r:70,state:'tele',t:1.0,kind:'root',dmg:20});
    }
    sfxDeath();
   }
   if((e.phase||1)===1&&e.hp<e.maxhp*0.5){
    e.phase=2;e.spd=(e.spd||52)*1.15;
    if(e.boss||e.mini){
  if(typeof activeExplosions !== 'undefined') activeExplosions.push({x: e.x, y: e.y, t: 0, maxT: 0.45, sc: e.boss ? 2.6 : 1.7});shake=4;}   // v6.17
    if(!bossE){const bp=EL('bossphase');if(bp)bp.textContent='мини · ярость чащи';}
    log('🌲 Древень беснуется — корни чаще!','warn');
   }
  }
  // СТРЫГА (мини-босс №2): рывок, когда игрок в радиусе. lx/ly фиксируются
  // на момент замаха. В рывке (atkT>0) контактный урон выше (dmgMod 2.0).
  if(e.type==='naviya'){
   e.slamT-=dt;
   if(e.atkT>0){e.atkT-=dt;}
   else if(e.slamT<=0&&d<430&&d>70&&!isSpawning){
    e.atkT=e.atkDur||0.55;
    e.slamT=(e.phase===2)?2.4:3.2;
    e.lx=P.x;e.ly=P.y;
    aimLines.push({ang:Math.atan2(e.ly-e.y,e.lx-e.x),len:Math.min(200,d),t:0.22});
    sfxDeath();
   }
   e.dmgMod=e.atkT>0?(e.phase===2?2.4:2.0):1.5;
   e.howlT=(e.howlT||4)-dt;
   if(e.howlT<=0&&d<380){
    e.howlT=(e.phase===2)?5.0:7.0;
    P.slowT=Math.max(P.slowT||0,1.4);
    spawnFlash(e.x,e.y-20,1,'#a8ffd0');
    log('👁 Вой Стрыги — ноги тяжелеют!','warn');
   }
   if((e.phase||1)===1&&e.hp<e.maxhp*0.5){
    e.phase=2;e.pounceSpd=(e.pounceSpd||560)*1.15;
    if(e.boss||e.mini){shake=4;}   // v6.17
    if(!bossE){const bp=EL('bossphase');if(bp)bp.textContent='мини · жажда Нави';}
    log('👁 Стрыга раскрыла жажду Нави!','warn');
   }
  }
  
  // v5.11 Леший-Вожак
  if(e.miniKind==='warlord'){
   e.slamT=(e.slamT||2)-dt;
   e.howlT=(e.howlT||5)-dt;
   if(e.slamT<=0&&d<360){
    e.slamT=e.phase===2?2.4:3.2;
    for(let i=0;i<(e.phase===2?4:3);i++){
     hazards.push({x:clamp(P.x+srnd(-120,120),0,WORLD),y:clamp(P.y+srnd(-100,100),0,WORLD),r:64,state:'tele',t:0.8,kind:'root',dmg:18});
    }
    sfxDeath();
   }
   if(e.howlT<=0){
    e.howlT=e.phase===2?6:8;
    for(let i=0;i<2;i++){
     if(liveEnemies()<40){   // v5.96: было enemies.length — четвёртое место этого класса
      // (три поправил в v5.82, зов Вожака пропустил). Туши занимали лимит,
      // и в самый плотный момент Вожак не мог позвать чащу.
      const ra=seedRandom()*TAU;
      const h=ETYPES.leshiy.hp*diffMul*0.9;
      acquireEnemy({...ETYPES.leshiy,x:clamp(e.x+Math.cos(ra)*80,0,WORLD),y:clamp(e.y+Math.sin(ra)*80,0,WORLD),hp:h,maxhp:h,type:'leshiy',flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,ai:'chase',dmgMod:0.9,fireT:0});
     }
    }
    spawnFlash(e.x,e.y-20,1,'#7fb04a');
    log('🌳 Вожак зовёт чащу!','warn');
   }
   if((e.phase||1)===1&&e.hp<e.maxhp*0.5){
    e.phase=2;e.spd=(e.spd||78)*1.2;e.dmg=(e.dmg||11)*1.15;
    if(e.boss||e.mini){shake=4;}   // v6.17
    if(!bossE){const bp=EL('bossphase');if(bp)bp.textContent='мини · гнев вожака';}
    log('🌳 Леший-Вожак в ярости!','warn');
   }
  }

  if(e.hitT>0)e.hitT-=dt;
  // контактный урон (импульс) — спавнящиеся враги не бьют
  // единый cooldown через hitT для ВСЕХ врагов.
  // Раньше wasInRange сбрасывался ДИСТАНЦИОННО (когда d >= e.r + P.r).
  // Меч отталкивает врага (e.kx), враг на 1 кадр выходит за радиус — флаг сбрасывается —
  // следующий кадр враг возвращается и бьёт БЕЗ кулдауна. Двойной/тройной урон в секунду.
  // Теперь: hitT кулдаун (1.2с для мобов, 0.7с для боссов/троллей),
  // wasInRange сбрасывается только при d > e.r + P.r + 25 (явный отход, не микро-отскок).
  // FIX v7.39: ГОНКА СОСТОЯНИЙ — если враг уже был в радиусе (wasInRange=true),
  // но вышел за пределы (d >= e.r+P.r), то в ЭТОМ КАДРЕ условие d<e.r+Pр ложно,
  // ветка else сбрасывает флаг, и следующий кадр удар считается ПЕРВЫМ снова.
  // Решение: сбрасывать флаг ТОЛЬКО внутри ветки удара, когда враг ДЕЙСТВИТЕЛЬНО уходит.
  if(!isSpawning && d<e.r+P.r){
   if(e.hitT<=0){
    let dmg=e.dmg*(e.dmgMod||1)*enemyDmgMul(time);   // v7.36: см. enemyDmgMul в director.js
    // v5.96: условие определяло «крупную цель» ПО ТИПУ (`e.type==='upyr'`), а упырь —
    // это обычный враг из SPAWN_TABLE с 10:00, не только элита. То есть каждый
    // рядовой упырь получал боссовый кулдаун 0.7 с вместо 1.2 с и скидку 0.5 на
    // повторные удары. Итоговый DPS выходил даже НИЖЕ обычного (0.71·dmg/с против
    // 0.83), так что в глаза не бросалось, — но правило применялось не к тем.
    // Меняем на признак роли: элита (она и есть упырь) и боссы.
    if(e.elite||e.boss||e.type==='baba_yaga'){
     if(e.wasInRange)dmg*=0.5; // повторные удары элиты/боссов слабее
     e.hitT=0.7;
    }else{
     e.hitT=1.2; // рядовые мобы бьют раз в 1.2 сек
    }
    dmg*=armorMul();   // v5.76: единая формула (был отдельный расчёт без нижнего порога)
    if(P.invuln>0)dmg=0; // v5.36 (C2): i-frames — урон игнорируется, но таймер удара моба всё равно ставится
    if(!isFinite(dmg)||dmg<0)dmg=0;P.hp-=dmg;if(!isFinite(P.hp))P.hp=0;
    // (убрана временная диагностика: первые 8 ударов печатались в игровой лог
    //  с внутренним именем типа врага и точным HP — «☠ Удар по игроку: -4 (leshiy) HP=124»)
    // v6.24 КЛАТЧ. Удар, который перевёл игрока за черту 25%, обрабатывался
    // как любой другой: тот же звук, та же рамка. Момент «чуть не умер» —
    // сильнейшая эмоция забега, и он заслуживает собственного кадра паузы.
    if(dmg>0&&P.hp>0&&P.hp/P.maxhp<0.25&&!_clutchArmed){
     _clutchArmed=true;
     evoPause=Math.max(evoPause,0.16);
     shake=Math.max(shake,8);
     flashScreen('#ff3a2a',0.55);
     bigText('НА ВОЛОСКЕ','держись','#ff8a70');
     vibe(90);
    }
    if(dmg>0){runDmgTaken+=dmg;sfxHurt();klyukaCharge+=dmg;onPlayerHurtW(dmg);noteHurt(e,dmg);}   // v6.17b/c: клюка и зерцало копят // v5.41 (Б3+Б5): история урона; звук/тряска только при реальны
    if(e.affix==='frost'&&dmg>0)P.slowT=Math.max(P.slowT,2.2);   // v6.62: Студёный замедляет игрока Math.max(hitstop,0.012) держал игру вечно в режиме 0.22× (frame()), отсюда «микро-паузы при тряске».
    e.wasInRange=true;
    // ВАМПИРИЗМ Воина срабатывает ТОЛЬКО при УБИЙСТВЕ (см. onKillHeal в killDrops),
    // а не от получения урона. Это описано в CLASSES для warrior.
   }
  }else{
   // FIX v7.39: убираем преждевременный сброс флага. wasInRange теперь гаснет
   // только когда враг реально отошёл (проверка внутри ветки удара выше).
   // Эта ветка больше НЕ сбрасывает флаг — она просто ничего не делает.
  }
 }
