const WNAME={
 sword:'Меч',bow:'Лук дозора',bolt:'Гроза Перуна',
 serp:'Серп-оборотень',kosa:'Коса Моры',ugli:'Угли Чернобога',kamen:'Камень Алатырь',
 obereg:'Оберег Рода',zov:'Зов Велеса',kolokol:'Колокол Яви',verv:'Вервь Мары',
 idol:'Идол Чура',navi:'Навий хвост',rosa:'Роса Мокоши',vihr:'Вихрь Стрибога',
 klyuka:'Клюка Яги',zerno:'Зерно Марены',kosti:'Костяной венец',upyr:'Упыриный зуб',
 zercalo:'Зерцало правды',sopel:'Сопель Перуна',trizna:'Тризна',golod:'Голод Нави',
 poison:'Ядовитые споры',thorn:'Шипы (лозы)',frost:'Ледяная аура'
};
// ---------- РЕЦЕПТЫ: оружие N ур. + названная пассивка ----------
// Пассивка выбрана по смыслу орудия, а не случайно: игрок должен уметь угадать
// рецепт до того, как прочтёт его. «Коса метёт шире» -> Пояс силы (радиус).
const EVO_RECIPES={
 sword:{p:'Точильный камень',n:'Рагнарёк'},
 bow:{p:'Наузы',n:'Стрелы Перунова Древа'},
 bolt:{p:'Клеймо ярости',n:'Громобой'},
 serp:{p:'Пояс силы',n:'Волчий круг'},
 kosa:{p:'Пояс силы',n:'Жатва'},
 ugli:{p:'Сапоги-скороходы',n:'Выжженный путь'},
 kamen:{p:'Точильный камень',n:'Град Сварога'},
 obereg:{p:'Живая кора',n:'Круг предков'},
 zov:{p:'Наузы',n:'Стая-тень'},
 kolokol:{p:'Пояс силы',n:'Набат'},
 verv:{p:'Наузы',n:'Двойные путы'},
 idol:{p:'Око Велеса',n:'Капище'},
 navi:{p:'Сапоги-скороходы',n:'Тень по пятам'},
 rosa:{p:'Ладанка',n:'Живая вода'},
 vihr:{p:'Пояс силы',n:'Смерч'},
 klyuka:{p:'Медвежья хватка',n:'Костяная клюка'},
 zerno:{p:'Око Велеса',n:'Мёртвая пашня'},
 kosti:{p:'Клеймо ярости',n:'Венец владыки'},
 upyr:{p:'Кровавая роса',n:'Жажда крови'},
 zercalo:{p:'Живая кора',n:'Кривда'},
 sopel:{p:'Клеймо ярости',n:'Цепь небес'},
 trizna:{p:'Шёпот Нави',n:'Курганы'},
 golod:{p:'Ладанка',n:'Ненасытность'},
 poison:{p:'Кровавая роса',n:'Чума земли'},
 thorn:{p:'Медвежья хватка',n:'Шипастая петля'},
 frost:{p:'Око Велеса',n:'Зимний плен'}
};
// Что ИМЕННО меняется — текст под именем в момент эволюции и в журнале.
// Формулировки описывают новое ПОВЕДЕНИЕ, а не проценты (см. документ, ч.2 шаг 4).
const EVO_DESC={
 serp:'Лезвия больше не возвращаются — они остаются на орбите вокруг тебя.',
 kosa:'Скошенные эволюцией враги стягиваются к ногам и бьются в плотной зоне урожая.',
 ugli:'Эволюционный след разрастается со временем, выжигая всё больше позади.',
 kamen:'Осколок раскалывается на каждом отскоке.',
 obereg:'Круг предков держит стену: нежить не входит внутрь.',
 zov:'Волк-тень, добивший врага, делится — с каждой смерти растёт стая (в пределе капа).',
 kolokol:'Убитый звоном взрывается и задевает соседей.',
 verv:'Вервь остаётся натянутой и режет всех между жертвами.',
 idol:'Эволюционные идолы соединяются лучом, и всё внутри их треугольника режется.',
 navi:'Хвост метёт за спиной вдвое шире.',
 rosa:'Пока стоишь в роднике, он не иссякает.',
 vihr:'Смерч стоит на месте и тянет непрерывно.',
 klyuka:'Отдача бьёт по всей чаще и даёт миг неуязвимости.',
 zerno:'Из взрыва прорастают новые зёрна.',
 kosti:'Серия больше не спадает от простоя — лучей всегда много.',
 upyr:'Убийство на краю гибели исцеляет полностью.',
 zercalo:'Луч бьёт в обе стороны — и вперёд, и за спину.',
 sopel:'Цепь замыкается на тебе и возвращает силы.',
 trizna:'Из могил встают призраки и дерутся за тебя.',
 golod:'Голод больше не сбрасывается — но грызёт тебя самого.',
 sword:'Клинки рвут плоть: раны кровоточат.',
 bow:'Стрелы падают дождём по площади.',
 bolt:'Цепи молний становятся длиннее.',
 poison:'Мор стелется аурой вокруг тебя.',
 thorn:'Шипы затягивают петлю.',
 frost:'Стужа сковывает намертво.'
};
// v6.18: узел древа «Тайное слово» снижает требование рецепта на уровень.
// Это первый в игре мета-апгрейд, который меняет ПРАВИЛО, а не число.
function evoMinLvl(){return Math.max(3,EVO.minLvl-((typeof tree!=='undefined'&&tree.un5)?1:0));}
function auraList(){return [{k:'poison',a:poison},{k:'thorn',a:thorn},{k:'frost',a:frost}];}
function passiveTaken(name){return (cardLv[name]||0)>0;}
// Готовность рецепта: и уровень, и пассивка.
function evoReady(id){
 const r=EVO_RECIPES[id];if(!r)return false;
 return wLvl(id)>=evoMinLvl()&&passiveTaken(r.p);
}
function auraReady(k){
 const r=EVO_RECIPES[k];if(!r)return false;
 const a=({poison:poison,thorn:thorn,frost:frost})[k];
 return !!a&&a.on&&!a.evo&&a.lvl>=evoMinLvl()&&passiveTaken(r.p);
}

// ---------- ТЕЛЕГРАФ: игрок всегда видит, насколько близко ----------
// Документ, ч.2 шаг 2. Крючок не в самой эволюции, а в знании «осталось чуть-чуть».
let _evoHudKey='';
function evoHudLines(){
 const out=[];
 const need=evoMinLvl();
 for(const w of weapons){
  const r=EVO_RECIPES[w.id];if(!r)continue;
  const nm=WNAME[w.id]||w.id;
  if(w.evo){out.push({cls:'ready',html:'<b>'+nm+'</b> ✦ '+r.n});continue;}
  const lv=Math.min(need,wLvl(w.id)),has=passiveTaken(r.p);
  const bar='#'.repeat(lv)+'.'.repeat(Math.max(0,need-lv));
  let tail;
  if(lv>=need&&has)tail='<span style="color:#ffd77d">→ '+r.n+'</span>';
  else if(lv>=need)tail='<span class="miss">нужны: '+r.p+'</span>';
  else if(has)tail='<span class="miss">ещё '+(need-lv)+' ур.</span>';
  else tail='<span class="miss">'+(need-lv)+' ур. + '+r.p+'</span>';
  out.push({cls:(lv>=need&&has)?'ready':((lv>=need||has)?'near':''),
   html:'<b>'+nm+'</b> '+bar+' '+tail});
 }
 for(const au of auraList()){
  if(!au.a.on)continue;
  const r=EVO_RECIPES[au.k],nm=WNAME[au.k];
  if(au.a.evo){out.push({cls:'ready',html:'<b>'+nm+'</b> ✦ '+r.n});continue;}
  const lv=Math.min(need,au.a.lvl),has=passiveTaken(r.p);
  const bar='#'.repeat(lv)+'.'.repeat(Math.max(0,need-lv));
  let tail;
  if(lv>=need&&has)tail='<span style="color:#ffd77d">→ '+r.n+'</span>';
  else if(lv>=need)tail='<span class="miss">нужны: '+r.p+'</span>';
  else if(has)tail='<span class="miss">ещё '+(need-lv)+' ур.</span>';
  else tail='<span class="miss">'+(need-lv)+' ур. + '+r.p+'</span>';
  out.push({cls:(lv>=need&&has)?'ready':((lv>=need||has)?'near':''),
   html:'<b>'+nm+'</b> '+bar+' '+tail});
 }
 return out;
}
function renderEvoHud(){
 const el=document.getElementById('evohud');if(!el)return;
 const lines=evoHudLines();
 const key=lines.map(function(l){return l.cls+l.html;}).join('|');
 if(key===_evoHudKey)return;                 // перерисовка только при изменении
 _evoHudKey=key;
 el.innerHTML=lines.map(function(l){return '<div class="er '+l.cls+'">'+l.html+'</div>';}).join('');
}

// ---------- МОМЕНТ ЭВОЛЮЦИИ ----------
// Документ, ч.2 шаг 3: единственное место, где акцент оправдан. Мир встаёт на
// 0.4с, края темнеют, имя крупно. Ни в обычном бою, ни при убийстве — только тут.
let evoPause=0,_evoTmr=null,_evoInnerTmr=null;
function evoFanfare(name,desc){
 evoPause=0;
 if(typeof flashScreen==='function')flashScreen('#ffd77d',0.35);
 if(typeof sfxEvo==='function')sfxEvo();
 // v6.38 ЭВОЛЮЦИЯ — КУЛЬМИНАЦИЯ ЗАБЕГА. Раньше был только экранный
 // засвет и плашка: событие, ради которого игрок собирал билд 10 минут,
 // визуально не отличалось от обычного левел-апа. Добавляем взрыв
 // вокруг героя: расходящиеся кольца + золотой залп частиц.
 try{
  for(let i=0;i<4;i++){
   const f=spawnFlash(P.x,P.y,1,i%2?'#ffd77d':'#fff2c0');
   if(f){f.t=f.max=0.34+i*0.13;}
  }
  for(let i=0;i<26;i++){
   const a=i/26*TAU+Math.random()*0.2, sp=rnd(120,320);
   spawnParticle(P.x,P.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.45,.95),
     ['#ffd77d','#fff2c0','#ffaa44'][i%3],-30,0);
  }
  shake=Math.max(shake,6);
 }catch(e){}
 const ov=document.getElementById('evoov');if(!ov)return;
 const wrap=document.getElementById('evoartwrap');
 if(wrap && typeof EVO_ALTAR_ART !== 'undefined' && EVO_ALTAR_ART.src){
   wrap.innerHTML = `<img src="${EVO_ALTAR_ART.src}" alt="Алтарь Пробуждения">`;
 }
 const n=document.getElementById('evoname'),d=document.getElementById('evodesc');
 if(n)n.textContent=name||'';
 if(d)d.textContent=desc||'';
 ov.classList.remove('fade');ov.classList.add('show');
 if(_evoTmr)clearTimeout(_evoTmr);
 if(_evoInnerTmr)clearTimeout(_evoInnerTmr);
 _evoTmr=setTimeout(function(){
  ov.classList.add('fade');
  _evoInnerTmr=setTimeout(function(){ov.classList.remove('show','fade');_evoTmr=null;_evoInnerTmr=null;},340);
 },1500);
}

// ---------- ЖУРНАЛ НАХОДОК ----------
// Документ, ч.6: открытая связка — это знание, которое игрок уносит с собой.
// Коллекция удерживает сама по себе, поэтому находки переживают забег.
