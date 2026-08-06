function dealDamage(e,dmg){if(!e||e.dead||(e.dying>0))return;if(!isFinite(dmg)||dmg<=0)return;e.hp-=dmg;if(e.hp<=0)killDrops(e);}
let _thudMs=0;   // v6.18d: троттлинг низкого подслоя тяжёлого удара
// v6.39 ПАЛИТРА УДАРА ПО СТИХИИ.
//  f — цвет вспышки, p — цвета искр, g — гравитация частиц.
//  Гравитация тоже несёт смысл: осколки камня падают (300),
//  искры молнии почти не падают (60), споры яда всплывают (-40).
const TAG_FX={
 phys :{f:'#ffe6a0',p:['#ffe6a0','#ff8a3c','#7a5a34','#d8d0c0'],g:300},
 elec :{f:'#8fd0ff',p:['#cfe0ff','#8fd0ff','#ffffff','#5aa8ff'],g:60},
 pois :{f:'#9ad06a',p:['#9ad06a','#6a9a3a','#c9e08a','#4a6a2a'],g:-40},
 frost:{f:'#bfe0ff',p:['#ffffff','#bfe0ff','#8fc0e0','#e8f4ff'],g:80},
 void :{f:'#c9a0ff',p:['#c9a0ff','#8a5ac0','#e0c9ff','#5a3a8a'],g:-20},
 blood:{f:'#ff6a6a',p:['#c14a3a','#ff6a6a','#7a2412','#aa3a22'],g:340},
};
function hitEnemy(e,dmg,tag,crit){
 if(!e||e.dead||e.dying>0)return;
 tag=tag||'phys';
 if(!isFinite(dmg)||dmg<0)dmg=0;
 // v6.18d ВЕС УДАРА. Тряска и хитстоп мира сознательно выключены (v6.16/6.17),
 // и правильно: они трясли экран на каждом из десятков попаданий в секунду.
 // Но вместе с ними ушёл и сам вес — реакция врага была КОНСТАНТОЙ:
 //   e.flash=0.16; e.hit=0.22; отдача 90; 6 частиц
 // Удар на 5 урона и удар на 400 выглядели, звучали и ощущались одинаково.
 // Отсюда «ватность»: игра не различала щелчок и сокрушительный удар.
 // Теперь вся реакция масштабируется от ДОЛИ снятого здоровья (_wt: 0..1).
 // Камеры это не касается вообще — трогаем только цель удара.
 const _wt=Math.max(0,Math.min(1,dmg/Math.max(1,e.maxhp||e.hp||1)));
 e.flash=0.18+0.30*_wt; // v7.1 сочные вспышки                 // вспышка держится дольше на тяжёлом ударе
 e.hit=0.16+0.34*_wt;                   // сквош-растяжка глубже (см. _ehurt в спрайте)
 // ЛОКАЛЬНЫЙ хитстоп: замирает САМ ВРАГ на 0..90мс, мир идёт как шёл. Именно эта
 // микропауза на цели читается рукой как «попал» — в отличие от глобального
 // хитстопа она не может слиться в подтормаживание, потому что не трогает время.
 e.stun=0; // v7.2: убран локальный стан врагов при ударах (устранено ощущение лага)
 const dx=e.x-P.x,dy=e.y-P.y,d=dist(dx,dy)||1;
 // отдача тоже по весу: лёгкий тычок почти не двигает, тяжёлый отшвыривает
 const _kbase=110+220*_wt; // v7.1: мощная сочная отдача от ударов
  e.kx=(e.kx||0)+dx/d*_kbase;e.ky=(e.ky||0)+dy/d*_kbase;
 // ВАЖНО: не мутируем входной dmg, чтобы caller мог использовать оригинальное значение
 if(e.weak===tag)dmg*=1.5;
 if(tag==='phys'&&e.weak==='elec')dmg*=0.7;
 if(e.boss&&P.bossMul)dmg*=P.bossMul;
 if(e.markT>0){dmg*=(1+0.08*Math.min(5,e.markStacks||1));}
 // v8.10 COMMERCIAL ENGINE INTEGRATION: активные эффекты синергий в бою
 if(P.synThunderChoir && tag==='elec'){ dmg*=1.25; if(seedRandom()<0.25)e.frozen=Math.max(e.frozen||0,0.5); }
 if(P.synVoidChoir && tag==='void'){ dmg*=1.25; }
 if(P.synNaviSwarm && tag==='void'){ dmg*=1.25; e.markT=4; }
 if(P.synTriune && (tag==='phys'||tag==='elec')){ dmg*=1.15; }
 // v6.39 ЭФФЕКТ ПО СТИХИИ. Раньше вспышка и искры были захардкожены золотом
 // (#ffe6a0) для ВСЕХ 23 орудий: молния, яд, мороз и кровь выглядели одинаково.
 // В Vampire Survivors каждое оружие узнаётся по цвету удара, поэтому берём
 // палитру от tag — она уже есть в игре и совпадает с иконками карточек.
 const FX=(TAG_FX[tag]||TAG_FX.phys);
 spawnFlash(e.x,e.y-e.r*0.6,0.2+0.8*_wt,FX.f);
 // v6.18d: искры летели РАДИАЛЬНО в случайные стороны — одинаково на любой удар,
 // и глаз не считывал, откуда прилетело. Теперь конус вдоль вектора удара:
 // разлёт узкий (±0.7 рад), скорость и количество растут с весом. Это тот же
 // приём, что и отдача, но читается быстрее — искры видно раньше, чем смещение.
 { // v7.2: бюджет частиц на кадр для устранения просадки FPS при массовых АоЕ-ударах
  if(typeof window._hitFrameParts==='undefined')window._hitFrameParts=0;
  const _nowF=Math.floor(performance.now()/16);
  if(window._lastHitF!==_nowF){window._lastHitF=_nowF;window._hitFrameParts=0;window._hitFrameDmg=0;}
  if(window._hitFrameParts<14){
   const _ha=Math.atan2(dy,dx);
   const _n=Math.min(4,Math.floor((3+6*_wt)*partMul));
   for(let i=0;i<_n;i++){
    if(window._hitFrameParts++>=14)break;
    const a=_ha+rnd(-0.7,0.7),sp=rnd(80,180)+260*_wt;
    if(!spawnParticle(e.x,e.y-e.r*0.5,Math.cos(a)*sp,Math.sin(a)*sp-50,rnd(.22,.58),
      FX.p[i%FX.p.length],FX.g,0))break;
   }
  }}
 // v6.16: shake убран из попадания — иначе трясёт при КАЖДОМ ударе по любому врагу.
 // Тряска теперь только при смерти элиты(5244)/босса(5276)/мини(5302) через killDrops.
 // v6.17: и hitstop тоже убран — мир больше нигде не замедляется.
 // v5.73 ВЕС УДАРА. Было 8мс на обычном попадании — это меньше половины кадра при 60fps,
 // то есть игрок физически не мог его почувствовать. В Vampire Survivors, Hades и
 // Dead Cells обычное попадание останавливает мир на 30-50мс, крит — на 70-90мс:
 // именно эта пауза читается рукой как «попал», а не вспышка и не число урона.
 // v6.17: хитстоп убран по всей игре. Он останавливал мир на КАЖДОМ попадании,
 // а при десятках врагов в секунду это сливалось в постоянное подтормаживание —
 // ровно то «замедление мира», которое читается как лаг, а не как вес удара.
 // В Vampire Survivors хитстопа нет вообще: вес там несут вспышка, отдача и звук.
 // v5.73 ОТДАЧА: враг отлетает сильнее и на крите заметно дальше.
 // Раньше отбрасывание было фиксированным (90) независимо от силы удара.
 // v8.0 VS FEEL: убрано экспоненциальное умножение отталкивания
 // v5.73 звук попадания: раньше на удар по врагу звука не было вообще —
 // звучал только взмах (sfxSwing) и смерть. Удар уходил в тишину.
 if(typeof sfxHit==='function')sfxHit(crit);
 // v6.18d: тяжёлому удару — низкий подслой. sfxHit сам ограничивает частоту 40мс,
 // подслой ограничиваем отдельно и жёстче: он должен быть событием, а не фоном.
 if(_wt>0.34&&typeof tone==='function'){
  const _ms=Date.now();
  if(_ms-_thudMs>140){_thudMs=_ms;
   try{tone(70+40*(1-_wt),0.09+0.06*_wt,'sine',0.16+0.10*_wt,38);}catch(_e){}}
 }
 if(crit){
  const finalDmg=Math.round(dmg);
  if((window._hitFrameDmg=window._hitFrameDmg||0)<8){window._hitFrameDmg++;spawnDmgText(e.x+rnd(-12,12),e.y-e.r-10,finalDmg,tag,true);}
  // v8.8: удалены вызовы DOM flashScreen и дублирующий spawnFlash при критических ударах — устранена причина просадок FPS (через раз)
  // v7.34: крит получает свою звёздную вспышку листом — до этого он отличался
  // от обычного удара только числом урона, то есть на плотной волне никак
  // вспышка идёт под тем же бюджетом, что и цифра урона: на плотной волне
  // критов десятки в секунду, и без потолка экран забивается звёздами
  if(typeof IMPACT_BURST_SHEET!=='undefined'&&window._hitFrameDmg<=3)
   spawnSheetFx(IMPACT_BURST_SHEET,e.x,e.y-e.r*0.5,Math.min(120,46+e.r*2.0),0.26,'#ffe08a');
  if(window._hitFrameParts<14){
   for(let _s=0;_s<4;_s++){
    if(window._hitFrameParts++>=14)break;
    const _sa=rnd(0,6.283);spawnParticle(e.x,e.y,Math.cos(_sa)*rnd(110,260),Math.sin(_sa)*rnd(110,260),rnd(.2,.4),'#ffd94a',0,0);
   }
  }
 } else if((window._hitFrameDmg=window._hitFrameDmg||0)<5&&Math.random()<0.50){
  window._hitFrameDmg++;
  const finalDmg=Math.round(dmg);
  spawnDmgText(e.x+rnd(-12,12),e.y-e.r,finalDmg,tag);
 }
 dealDamage(e,dmg);
}
