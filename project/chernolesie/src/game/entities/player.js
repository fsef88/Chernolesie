function updateMovement(dt){
 // движение
 let mx=0,my=0;
 if(keys['d']||keys['KeyD']||keys['arrowright'])mx+=1;
 if(keys['a']||keys['KeyA']||keys['arrowleft'])mx-=1;
 if(keys['s']||keys['KeyS']||keys['arrowdown'])my+=1;
 if(keys['w']||keys['KeyW']||keys['arrowup'])my-=1;
 if(touchMove.active){mx+=touchMove.x;my+=touchMove.y;}
 // Таймеры состояния: каждый на отдельной строке, комментарии сверху
if(P.slowT>0)P.slowT-=dt;
if(P.shieldT>0)P.shieldT-=dt;
if(P._warQT>0){
 P._warQT-=dt;
 if(P._warQT<=0){
  const was=P._warQBoost||0;
  if(was>0){P.dmgMul=Math.max(0.5,(P.dmgMul||1)-was);P._warQBoost=0;}
  P._warQT=0;
 }
}
if(P.shadowOrbT>0){
 P.shadowOrbT-=dt;
 if(P.shadowOrbT<=0){
  P.shadowOrbT=0;
  P.shadowOrbMul=(P._shadowOrbBase!=null?P._shadowOrbBase:1);
  P._shadowOrbBase=null;
  if(P._orbBase!=null){orbCount=P._orbBase;P._orbBase=null;}
  else if(currentClass==='rogue')orbCount=Math.min(orbCount,3);
 }
}
 const rawLen=Math.hypot(mx,my);const len=rawLen||1;mx/=len;my/=len;
 if(rawLen>0.01){P.fx=mx;P.fy=my;}   // v5.62: взгляд сохраняется. Было P.fx=mx безусловно —
                                     // при отпущенном вводе mx=0/1=0, P.fx<0 становилось false
                                     // и герой мгновенно разворачивался вправо. Тот же класс
                                     // бага, что len=rawLen||1 в v5.54.
 // v5.54: rawLen — настоящая величина ввода, len только для нормализации
 // v6.1 ПЛАВНОСТЬ: запоминаем позицию до шага физики. Интерполировались ТОЛЬКО
 // враги (drawEnemiesLayer), а игрок, снаряды и камера рисовались по «сырым»
 // координатам с частотой физики 60 Гц. На дисплее 120 Гц каждый второй кадр
 // показывал ту же позицию, на 60 Гц любой пропуск шага давал заметный рывок —
 // отсюда ощущение 15 кадров при формально высоком FPS.
 P._prevX=P.x;P._prevY=P.y;
 JDBG.mx=+mx.toFixed(2);JDBG.my=+my.toFixed(2);JDBG.spd=Math.round(P.spd*viewSpeedMul());
 // v6.15: ЗДЕСЬ И БЫЛА ПРИЧИНА «ДЖОЙСТИК НЕ РАБОТАЕТ». В v6.13 я дописал в конец
 // этой строки комментарий «// v6.13: ход масштабируется обзором», и следом за ним
 // на ТОЙ ЖЕ строке шло `P.x+=mx*spd*dt;` — то есть само перемещение героя.
 // Комментарий его проглотил: ввод читался, вектор считался, скорость считалась,
 // а координаты не менялись вообще. Ни на одном обзоре, а не только в «Толпе».
 // Это тот самый класс бага, который я нашёл у тебя в v5.74, повторил в v5.87 и
 // после которого записал правило «комментарии к плотным однострочникам — только
 // отдельной строкой сверху». Здесь я его снова нарушил.
 // Детектор съеденного кода эту строку пропустил: он искал хвост, который целиком
 // выглядит как инструкция, а тут за комментарием идут ЧЕТЫРЕ инструкции подряд.
 const spd=P.spd*viewSpeedMul()*(P.slowT>0?0.55:1)*(P.spdBoostT>0?1.18:1); if(P.spdBoostT>0)P.spdBoostT-=dt;
 // ДВИЖЕНИЕ ГЕРОЯ: отдельно перемещение, отдельно clamp, отдельно флаги
P.x+=mx*spd*dt;P.y+=my*spd*dt;
P.x=clamp(P.x,P.r,WORLD-P.r);P.y=clamp(P.y,P.r,WORLD-P.r);
P.moving=rawLen>0.01;
P._mv=Math.min(1,rawLen)*(P.slowT>0?0.55:1);
 // VISUAL POLISH: лёгкая пыль/листья из-под ног — убирает ощущение скольжения, механику не трогает
 if(P.moving){
  // v5.10: только редкая пыль под ногами (земля), без цветных «листьев/искр» класса
  P.stepT=(P.stepT||0)-dt;
  if(P.stepT<=0){
   P.stepT=0.28;
   P.stepSide=(P.stepSide||1)*-1;
   const ox=-P.fy*P.stepSide*6,oy=P.fx*P.stepSide*6;
   spawnParticle(P.x+ox,P.y+oy,rnd(-12,12)-P.fx*22,rnd(-8,8)-P.fy*22,rnd(.18,.32),theme==='winter'?'#c8d8e4':'#5a4a30',60,0);
  }
 }else P.stepT=0;
 // ГРАНИЦЫ МИРА: игрок НЕ МОЖЕТ уйти за пределы 0..WORLD (был баг — камера упиралась, игрок уходил)
 // Используем эффективный размер мира с учётом экрана: края мира — это края экрана
 P.x=clamp(P.x, P.r, WORLD-P.r);
 P.y=clamp(P.y, P.r, WORLD-P.r);
 // ЗАЩИТА ОТ NaN: если какой-то баг дал NaN в P.x/y, последующие вычисления
 // (dist, dist2, нормализация) породят NaN везде. safeNum сбрасывает к центру мира.
 P.x=safeNum(P.x,WORLD/2);P.y=safeNum(P.y,WORLD/2);   // v6.0: было 1000 — угол увеличенного мира
 // ЗДОРОВЬЕ: максимум держим ЦЕЛЫМ и не даём текущему его превысить.
 // На экране было «333/332.8»: hp выводился через Math.round, а maxhp — сырым.
 // Дробь берётся из процентных множителей (класс Волхва P.maxhp*=0.94,
 // проклятие «Стекло» *=0.4, проценты древа), и после округления hp вверх
 // получалось значение БОЛЬШЕ максимума — игрок видел невозможное число.
 P.hp=safeNum(P.hp,100);
 P.maxhp=Math.max(1,Math.round(safeNum(P.maxhp,100)));
 if(P.hp>P.maxhp)P.hp=P.maxhp;
 // ПОТОЛОК СКОРОСТИ БЕГА.
 // Источники скорости перемножаются и ничем не ограничены:
 //   база класса 170
 //   перк «Сапоги» 8/8            ×1.64  → 279
 //   узел древа «+12% бег» 5/5    ×1.60  → 446
 //   карты в забеге (+15/+5/+15%) ×1.38  → 616
 // То есть у полностью прокачанного игрока герой бежал ВЧЕТВЕРО быстрее
 // базового и втрое быстрее любого врага — мир просто улетал за край экрана,
 // а кайт переставал быть решением, потому что догнать было некому.
 // Потолок 1.35× от базы класса: прокачка бега остаётся заметной (+35%),
 // но перестаёт ломать управляемость. Крутить здесь.
 {const _sc=(CLASS_BASE_SPD[currentClass]||200)*1.35;
  if(P.spd>_sc)P.spd=_sc;}
 P.spd=safeNum(P.spd,200);P.dmgMul=safeNum(P.dmgMul,1);
 P.rateMul=safeNum(P.rateMul,1);P.specialRate=safeNum(P.specialRate,1);
 // Таймеры анимаций: каждый на отдельной строке
P.animT+=dt;heroAnimUpdate(dt);
if(P.atk>0)P.atk-=dt;
if(P.hurtT>0)P.hurtT-=dt;
if(P.levelFx>0)P.levelFx-=dt;
if(P.specialFx>0)P.specialFx-=dt;
if(P.invuln>0)P.invuln-=dt; // v5.36 (C2): тик i-frames
 // Классовая реакция игрока: короткий след и импульс не зависят от оружия.
 if(P.atk>0&&(P.classFxAtkT||0)<=0){P.classFxAtkT=.08;const _ac=(CLASS_VISUALS[currentClass]||CLASS_VISUALS.warrior).accent;for(let _i=0;_i<2;_i++){const _a=Math.atan2(P.fy,P.fx)+rnd(-.5,.5);spawnParticle(P.x+P.fx*20,P.y+P.fy*20,Math.cos(_a)*rnd(70,150),Math.sin(_a)*rnd(70,150),rnd(.18,.34),_ac,120,0);}}else P.classFxAtkT=(P.classFxAtkT||0)-dt;
  // v6.23 (B2): фазовый онбординг первых 60с (десктоп, где #hint виден).
  // v7.42: подсказка меняется ТРИ РАЗА за забег (на 10-й и 30-й секунде), а
  // innerHTML присваивался каждый шаг физики — 60 разборов HTML в секунду всю
  // первую минуту. Замер на живом бою давал по #hint 38 правок DOM в секунду.
  if(!isMobile&&time<60){
   const _hp=time<10?0:time<30?1:2;
   if(__HUDW.hint!==_hp){
    const _h=document.getElementById('hint');
    if(_h&&_h.style.display!=='none'){
     __HUDW.hint=_hp;
     _h.innerHTML = _hp===0 ? 'WASD — ход · Esc — пауза · <b style="color:#c9a04a">Q — Печать класса</b> (когда полоска полна)'
      : _hp===1 ? 'Выбирай карты разных типов — не только +% урона'
      : 'Первая волна близко — держи дистанцию и коси толпу';
    }
   }
  }
  if(P.regen&&P.hp<P.maxhp){
  P.hp=Math.min(P.maxhp,P.hp+P.regen*dt);
  // реген-пульсация — используем кэшированный UI.regen
  if(UI.regen){
   const _ro=P.regen>0?'1':'0',_rt='+'+P.regen.toFixed(1);
   if(__HUDW.regO!==_ro){__HUDW.regO=_ro;UI.regen.style.opacity=_ro;}
   if(__HUDW.regT!==_rt){__HUDW.regT=_rt;UI.regen.textContent=_rt;}
  }
 }
 // иначе зелёная надпись "+1.5" навечно застывает над полной полоской.
 // Раньше этот блок был вложен в if(regen && hp<maxhp) — как только HP заполнялось,
 // мы просто переставали заходить и не сбрасывали opacity в '0'.
 if(UI.regen&&(!(P.regen>0&&P.hp<P.maxhp))&&__HUDW.regO!=='0'){__HUDW.regO='0';UI.regen.style.opacity='0';}
 // ТАЙМЕР БАФФА СПЕЦАТАКИ — привязан к игровому времени, не к real-time
 if(P.specialBuffT>0){
  P.specialBuffT-=dt;
  if(P.specialBuffT<=0){
   P.specialBuffT=0;
   // Снимаем ТОЛЬКО специальный буст, базовый rateMul не трогаем
   P.specialRate=1;
  }
 }
 if(P.armor&&P.hp<P.maxhp)P.hp=Math.min(P.maxhp,P.hp+0.1*P.armor*dt);
}
