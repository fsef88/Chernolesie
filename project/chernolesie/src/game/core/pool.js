// ============================================================
//  OBJECT POOLING
// ============================================================
// ЗАЩИТА ОТ ПЕРЕБОРА: каждый poolGet/spawn тратит O(n) на подсчёт живых объектов
// в массиве (for...of с alive). На мобильном после 10 минут в массиве POOL.gems
// может быть 80 мёртвых объектов, и каждый spawnGem проходит их ВСЕ.
// Решение: держим отдельные activeX массивы, в которых только живые объекты.
// При poolGet/poolRelease — push/splice O(1).
// Циклы в draw() и update() идут по activeX, что в среднем в 5-10 раз быстрее.
const POOL={particles:[],dmgTexts:[],gems:[],flashes:[],enemies:[]};
const MAX_ENEMIES=450;   // v6.11: под кап, растущий с видимой площадью до ×4.5
const ACTIVE={particles:[],dmgTexts:[],gems:[],flashes:[]};
function poolGet(arr,reset){
 // счётчик _deadCount — когда 0, не сканируем массив.
 let o=null;if(arr._fd&&arr._fd.length){o=arr._fd.pop();if(arr._deadCount>0)arr._deadCount--;}
 if(!o&&arr._deadCount>0){
  for(let i=arr.length-1;i>=0;i--){
   if(!arr[i].alive){o=arr[i];arr._deadCount--;break;}
  }
 }
 if(!o){o={alive:false};arr.push(o);}
 reset(o);
 o.alive=true;
 // Добавляем в active-список соответствующего пула
 const name=arr===POOL.particles?'particles':arr===POOL.dmgTexts?'dmgTexts':arr===POOL.gems?'gems':'flashes';
 ACTIVE[name].push(o);
 o._ai=ACTIVE[name].length-1; // запоминаем индекс — для O(1) poolRelease
 return o;
}
function poolRelease(arr,o){if(!o.alive)return;
 o.alive=false;
 arr._deadCount=(arr._deadCount||0)+1;if(!arr._fd)arr._fd=[];arr._fd.push(o);
 const name=arr===POOL.particles?'particles':arr===POOL.dmgTexts?'dmgTexts':arr===POOL.gems?'gems':'flashes';
 const list=ACTIVE[name];
 // (#13) раньше indexOf O(n) + splice O(n) на КАЖДОЕ удаление —
 // при 200 частицах до 40K сравнений/сек. Теперь O(1) swap-and-pop.
 let idx=(typeof o._ai==='number'&&o._ai>=0)?o._ai:-1;
 if(idx>=list.length||list[idx]!==o)idx=list.indexOf(o); // fallback при рассинхроне
 if(idx>=0){
  const tail=list.pop();
  if(idx<list.length){list[idx]=tail;tail._ai=idx;}
 }
 o._ai=-1;
}
// v5.12 ENEMY OBJECT POOL
function clearEnemy(e){
 e.alive=false;e.dead=false;e.boss=false;e.elite=false;e.mini=false;e.miniKind=null;e.affix=null;e.courier=false;e.beacon=false;e.shaman=false;e.sumT=0;e.rageT=0;
 e.dying=0;e.dieMax=0;e.hp=0;e.maxhp=0;e.x=0;e.y=0;e.r=12;e.spd=0;e.dmg=0;
 e.type=null;e.ai='chase';e.dmgMod=1;e.drawH=60;e.flash=0;e.hit=0;e.stun=0;e.slow=1;
 e.kx=0;e.ky=0;e.at=0;e.hitT=0;e.wasInRange=false;e.boltT=0;e.frozen=0;e.poisoned=0;
 e.orbT=0;e.markT=0;e.markStacks=0;e.zigzag=0;e.zigzagT=0;e.fireT=0;e.spawnT=0;e.warnT=0;
 e.slamT=0;e.atkT=0;e.phase=1;e.howlT=0;e.chargeT=0;e.chargeTelegraph=0;e.chargeDir=null;e.chargeDuration=0;
 // v6.16: здесь сбрасывались `lx`/`ly` БЕЗ подчёркивания, а анимация читает
 // `_lx`/`_ly` — то есть предыдущая позиция НИКОГДА не сбрасывалась при выдаче
 // объекта из пула. Новый враг получал координаты трупа, лежавшего в этой ячейке
 // до него, и на первом кадре его «скорость» выходила в тысячи px/с: спрайт
 // получал предельный наклон и максимальный темп анимации, а потом резко падал
 // до нормы. Именно это и видно на враге как рывок при появлении.
 // Ставим undefined, а не 0: обработчик специально проверяет undefined, чтобы
 // на первом кадре считать скорость нулевой, а не от точки (0,0).
 e.ringT=0;e.lx=0;e.ly=0;e._lx=undefined;e._ly=undefined;
 e._evx=0;e._evy=0;e._ehurt=0;e._eatk=0;
 // v6.17: та же беда, что была с _lx/_ly. Фаза анимации, сглаженная скорость и
 // сглаженный fps оставались от ПРЕДЫДУЩЕГО жильца ячейки пула — новый враг
 // стартовал с середины чужого цикла и с чужим темпом. Сбрасываем.
 e._animPh=undefined;e._smoothSp=undefined;e._prevFps=undefined;
 e.pounceSpd=0;e.atkFrames=null;e.dieFrames=null;e.frames=null;e.atkDur=0;
 e.weak=null;e.col=null;e.eye=null;e.size=1;e.xp=0;e._skipMove=false;e.densitySlow=1;
 // ИНТЕРПОЛЯЦИЯ: инициализировать предыдущие координаты
 e._prevX=0;e._prevY=0;
}
function acquireEnemy(props){
 let e=null;
 const pool=POOL.enemies;
 for(let i=pool.length-1;i>=0;i--){
  if(!pool[i].alive){e=pool[i];break;}
 }
 if(!e){e={alive:false};pool.push(e);}
 clearEnemy(e);
 if(props){for(const k in props){if(Object.prototype.hasOwnProperty.call(props,k))e[k]=props[k];}}
 // ИНТЕРПОЛЯЦИЯ: инициализировать предыдущие координаты при создании врага
 if(e.x!=null)e._prevX=e.x;
 if(e.y!=null)e._prevY=e.y;
 e.alive=true;e.dead=false;
 if(e.hp==null)e.hp=1;
 if(e.maxhp==null)e.maxhp=e.hp;
 enemies.push(e);
 return e;
}
function releaseEnemy(e){
 if(!e)return;
 e.alive=false;e.dead=true;
 e.atkFrames=null;e.dieFrames=null;e.frames=null;e.chargeDir=null;
}

function resetParticle(p){p.life=p.max=rnd(.25,.75);p.x=p.y=0;p.vx=p.vy=0;p.g=0;p.c='#fff';p.blood=0;p.wood=0;p.bone=0;p.silt=0;p.ice=0;p._spr=null;p._ang=0;p._spin=0;}

