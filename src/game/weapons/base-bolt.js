const BOLT_RANGE=420;   // px: дальность урона молнии, как искал doBolt
const ATK_ANIM_R=230;   // px: v5.63 — порог АНИМАЦИИ удара. Рост героя на экране ~76 px,
                        // радиус коллизии 14, скорость 200 px/с => 230 px это 3 роста,
                        // примерно 1.1 с сближения. Дальше молния летит без замаха.
function faceTo(e){                       // v5.62: развернуться к цели
 const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
 P.fx=dx/d;P.fy=dy/d;
}
const _btOut={e:null,d:0};   // v6.3: переиспользуемый результат boltTarget
function boltTarget(){  // v5.63: БЛИЖАЙШАЯ живая цель + дистанция (иначе взгляд дребезжит между врагами)
 if(!enemies.length)return null;
 const c=enemiesNear(P.x,P.y,BOLT_RANGE);
 let best=null,bd=1e9;
 for(const e of c){
  if((e.boltT||0)>0||e.hp<=0||(e.dying>0))continue;
  const d=dist(e.x-P.x,e.y-P.y)-(e.r||0);
  if(d<=BOLT_RANGE&&d<bd){bd=d;best=e;}
 }
 // v6.3: возвращался новый объект {e,d} каждый кадр. Переиспользуем один.
 if(!best)return null;
 _btOut.e=best;_btOut.d=bd;return _btOut;
}
function doBolt(){
 if(!enemies.length)return;
 // spatial hash для ближайших
 // фильтруем мёртвых (e.hp > 0). В том же кадре меч мог убить врага,
 // а молния сработает после меча в той же итерации update() — без фильтра
 // она бы тратила bolt-цепочку на труп.
 const candidates=enemiesNear(P.x,P.y,420);
 const near=candidates.filter(e=>(e.boltT||0)<=0&&e.hp>0);
 if(!near.length)return;
 const w=weapons.find(w=>w.id==='bolt');
 const evo=w&&w.evo;
 const e=near[Math.floor(seedRandom()*near.length)];
 e.boltT=1.0;
 let dmg=27*P.dmgMul*(P.boltDmgMul||1)*(1+0.20*(boltLvl-1))*(evo?2.1:1)*wbal('bolt');   // v6.34
 // (CRITICAL) bossMul здесь НЕ применяем — hitEnemy() внутри себя
 // уже умножает на P.bossMul. Было двойное применение: молния била босса
 // ×bossMul² (с деревом pw3 lvl3: ×4.2 вместо ×2.05).
 hitEnemy(e,dmg,'elec');
 bolts.push({x:e.x,y:e.y,t:0.18});
 for(let i=0;i<4;i++){const a=Math.random()*TAU,sp=rnd(80,200);if(!spawnParticle(e.x,e.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.2,.5),'#8fd0ff',-50,0))break;}
 if(frost.on&&seedRandom()<0.4)e.frozen=2; // #6: детерминизм Daily
 // v11.5 SHAMAN STARTING POWER: Волхв со старта бьёт цепной молнией по 2 целям
 if(currentClass === 'shaman' || evo){
  const second = findClosestEnemy(e.x, e.y, 160, [e]);
  if(second){
   hitEnemy(second, dmg * 0.85, 'elec');
   bolts.push({x: second.x, y: second.y, t: 0.18});
  }
 }
 if(evo){let prev=e;const hops=3+((P.evoBoltStorm||1)-1);for(let k=0;k<hops;k++){
  // spatial hash вместо линейного поиска + кулдаун boltT на каждой цели
  // чтобы молния не прыгала бесконечно между двумя ближайшими
  // Также: e.hp > 0 — не прыгаем на трупы
  const nexts=enemiesNear(prev.x,prev.y,180);
  const next=nexts.find(en=>en!==prev&&(en.boltT||0)<=0&&en.hp>0);
  if(!next)break;
  next.boltT=1.0; // ставим кулдаун на новой цели
  bolts.push({x:next.x,y:next.y,t:0.18});
  hitEnemy(next,dmg*0.5,'elec');
  prev=next;
 }}
}
 // lifesteal срабатывает ТОЛЬКО при УБИЙСТВЕ врага, а не от получения урона
