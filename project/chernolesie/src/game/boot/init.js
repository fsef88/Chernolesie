// ============================================================
//  СТАРТ — сразу в бой (без меню)
// ============================================================
try{
 // (#1 CRITICAL) здесь стояло 5 вызовов localStorage.removeItem —
 // тестовый сброс, забытый в продакшне. Он стирал ВЕСЬ прогресс игрока
 // (достижения, древо силы, рекорды, перки, туториал) при КАЖДОМ F5.
 currentClass=null;
 classChosen=false;
 boonShown=false;
 currentBoon=null;
 started=false; // v5.34 (C1): игра НЕ начинается, пока игрок не нажмёт «В бой» на титульнике
 P.x=WORLD/2;P.y=WORLD/2;P._prevX=P.x;P._prevY=P.y;   // v6.1: _prev на старте, иначе первый кадр интерполирует от прошлого забега
 // (тест #T5) init-блок НЕ вызывал applyTree() и перки — на первом
 // забеге после загрузки страницы бонусы древа силы и магазина молча не
 // работали (появлялись только после первого «Новый забег»). Порядок как в
 // resetRun: древо → перки → пассивка класса.
 specialMax=1;specialCharge=1;
 applyTree();
 applyPerks();
 paused=false;
 enemies=[];
 // v5.34 (C1): спавн врагов НЕ в init — бой стартует только после «В бой».
 // Здесь только чистое состояние; класс применится в resetRun() по нажатию.
}catch(e){console.error('Init:',e);}
 // v5.34 (C1): ТИТУЛЬНЫЙ ЭКРАН вместо «бой сразу + попап выбора».
 // Игрок видит меню выбора героя ДО старта. Бой не идёт, пока не нажата «В бой».
 // applyClassPassive отложен до нажатия кнопки (currentClass выбран на титульнике).
 // v12.5 ПИКСЕЛЬНАЯ КАЛИБРОВКА ШАПКИ ПО АРТУ.
 // vw/vh-кегли прыгали от размера окна и кэша. Теперь блок заголовка и кегль
 // вычисляются из реальной геометрии сцены 768x1376: баннер = x155..615, y66..113.
 (function(){
  const ART_W=768, ART_H=1376, BX=155, BY=66, BW=460, BH=47;
  const cal=()=>{
   const ts=document.getElementById('titlescreen');
   const lock=document.querySelector('.ts-title-lockup');
   const h1=lock&&lock.querySelector('h1');
   if(!ts||!lock||!h1)return;
   // v7.42: подгонка считает место заголовка из геометрии нарисованной плашки
   // 768x1376 при cover. На широком экране плашки под панелями больше нет:
   // сцена там задник плюс колонка с героем, а шапка стоит в своей колонке из
   // CSS. Инлайновые значения тут только мешали бы, поэтому снимаем их.
   if(matchMedia('(min-width:761px)').matches){
    lock.style.top=lock.style.left=lock.style.width=lock.style.height='';
    h1.style.fontSize='';
    return;
   }
   const r=ts.getBoundingClientRect();
   if(r.width<10||r.height<10)return;
   const scale=Math.max(r.width/ART_W, r.height/ART_H);   // cover
   const offX=(r.width-ART_W*scale)/2, offY=(r.height-ART_H*scale)/2;
   lock.style.top=(offY+BY*scale)+'px';
   lock.style.left=(offX+BX*scale)+'px';
   lock.style.width=(BW*scale)+'px';
   lock.style.height=(BH*scale)+'px';
   // кегль: вписаться в 86% ширины баннера и 80% его высоты
   const cap=BH*scale*0.80, wTarget=BW*scale*0.86;
   let lo=10, hi=cap;
   h1.style.fontSize=hi+'px';
   if(h1.scrollWidth<=wTarget){lo=hi;}
   else{
    for(let i=0;i<14;i++){
     const m=(lo+hi)/2; h1.style.fontSize=m+'px';
     if(h1.scrollWidth>wTarget)hi=m;else lo=m;
    }
   }
   h1.style.fontSize=lo+'px';
  };
  addEventListener('resize',()=>{clearTimeout(cal._t);cal._t=setTimeout(cal,120);});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(cal);
  setTimeout(cal,0); setTimeout(cal,300);
  window.__calTitle=cal;
 })();
 showTitleScreen();
 // startLoop() вызовет requestAnimationFrame сам; здесь НЕ дублируем (был баг — два rAF)
 // requestAnimationFrame(frame);
