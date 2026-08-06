let secondWindUsed=false;
TREE.unlock={name:'🔑 Открытия',nodes:[
 {id:'un1',name:'Второе дыхание',cost:200,max:1,f:function(l){if(l>0)P._metaSecondWind=1;},stat:'secondwind'},
 {id:'un2',name:'Стартовый серп',cost:150,max:1,f:function(l){if(l>0)P._metaStartSerp=1;},stat:'startserp'},
 {id:'un3',name:'Стартовый оберег',cost:150,max:1,f:function(l){if(l>0)P._metaStartObereg=1;},stat:'startobereg'},
 {id:'un4',name:'+1 слот оружия',cost:260,max:1,f:function(l){if(l>0)P._metaSlot=1;},stat:'wslot'},
 {id:'un5',name:'Тайное слово',cost:180,max:1,f:function(l){if(l>0)P._metaRecipe=1;},stat:'recipe'},
 // v6.19 (B3-ост): ветка открытий — новый класс и ночной режим (зацепки)
 {id:'un6',name:'Ночной дозор',cost:220,max:1,f:function(l){if(l>0)P._metaNight=1;},stat:'night'}
]};
// Подписи к узлам-открытиям: без них «Второе дыхание» — просто слово.
const UNLOCK_HINT={
 un1:'Одно воскрешение за забег, без рекламы',
 un2:'Забег начинается с Серпа-оборотня',
 un3:'Забег начинается с Оберега Рода',
 un4:'Слотов оружия становится 7',
 un5:'Рецепты эволюций требуют на уровень меньше',
 // v6.19 (B3-ост)
 un6:'Забег начинается в сумерках — ночной режим'
};
// Слот оружия — единственный узел, который трогает дизайнерскую ручку SLOTS.
// Применяем в resetRun через applyTree -> здесь, чтобы значение не накапливалось.
const SLOTS_BASE=SLOTS.weapons;
function applyUnlocks(){
 // v6.19 (B3-ост): маркеры новых систем (сами системы — за прогоном в браузере)
 if(typeof tree!=='undefined'&&tree.un6)P._metaNight=1;
 if(typeof tree!=='undefined'&&tree.un6){nightMode=true;log('\u{1F319} Ночной дозор — чаща вокруг скрыта тьмой','#9ad0ff');}
 SLOTS.weapons=SLOTS_BASE+((typeof tree!=='undefined'&&tree.un4)?1:0);
 if(typeof tree!=='undefined'&&tree.un2&&!weapons.some(function(w){return w.id==='serp';}))
  weapons.push({id:'serp',cd:2.1,t:0.3,evo:false});
 if(typeof tree!=='undefined'&&tree.un3&&!weapons.some(function(w){return w.id==='obereg';}))
  weapons.push({id:'obereg',cd:1.6,t:0.5,evo:false});
}

// ---------- ВИТРИНА: одна ближайшая цель ----------
// Документ, ч.3: показывать ВСЁ дерево — значит не показать ничего. Близость
// конкретной цели повышает готовность продолжить, поэтому берём ровно один узел:
// самый дешёвый из тех, что ещё не по карману. Если по карману всё — зовём тратить.
function nextGoal(){
 const all=[];
 for(const k in TREE)for(const n of TREE[k].nodes){
  const lvl=tree[n.id]||0;if(lvl>=n.max)continue;
  all.push({name:n.name,cost:n.cost*(lvl+1),hint:UNLOCK_HINT[n.id]||''});
 }
 if(typeof PERKS!=='undefined')for(const p of PERKS){
  const lvl=perks[p.k]|0;if(p.max!=null&&lvl>=p.max)continue;
  all.push({name:p.t,cost:pcost(p.k),hint:''});
 }
 if(!all.length)return null;
 const locked=all.filter(function(o){return o.cost>metaGold;}).sort(function(a,b){return a.cost-b.cost;});
 if(locked.length)return {g:locked[0],need:locked[0].cost-metaGold,afford:false};
 const cheap=all.sort(function(a,b){return a.cost-b.cost;})[0];
 return {g:cheap,need:0,afford:true};
}


// ---------- СИНЕРГИИ ДЛЯ НОВОГО АРСЕНАЛА ----------
// Документ, ч.6: 12 старых синергий завязаны на меч/лук/молнию/ауры, а 27 новых
// орудий не участвовали ни в одной. Синергия — сильнейший крючок, потому что это
// ЗНАНИЕ, которое игрок открывает сам и уносит с собой в следующий забег.
//
// БАЛАНС, о котором надо знать. Старое условие синергии — ДВЕ эволюции сразу.
// С рецептами (v6.18) двойная эволюция стала заметно реже, и на таком условии
// новые связки почти никогда бы не появились в пуле. Условие ниже мягче:
//   обе вещи взяты + хотя бы ОДНА эволюционировала + вторая не ниже 3 уровня.
// Старые 12 синергий не тронуты — они по-прежнему требуют две эволюции.
function _hasW618(id){return weapons.some(function(w){return w.id===id;});}
function _evoW618(id){const w=weapons.find(function(x){return x.id===id;});return !!(w&&w.evo);}
function pairReady(a,b){
 if(!_hasW618(a)||!_hasW618(b))return false;
 if(!_evoW618(a)&&!_evoW618(b))return false;
 return wLvl(a)>=3&&wLvl(b)>=3;
}
SYNERGIES.push(
 {id:'windseed',n:'Мёртвая воронка',d:'Вихрь стягивает толпу и сажает зерно ей в середину',tag:'pois',
  req:function(){return pairReady('vihr','zerno');},
  apply:function(){P.synWindSeed=1;}},
 {id:'windbell',n:'Собор ветров',d:'Собранных вихрем сразу накрывает звоном',tag:'elec',
  req:function(){return pairReady('vihr','kolokol');},
  apply:function(){P.synWindBell=1;}},
 {id:'dewward',n:'Родникова стена',d:'Оберег лечит за каждого, кого оттолкнул',tag:'phys',
  req:function(){return pairReady('obereg','rosa');},
  apply:function(){P.synDewWard=1;}},
 {id:'edgeofdeath',n:'На краю',d:'На низком HP отдача клюки копится вдвое быстрее',tag:'void',
  req:function(){return pairReady('upyr','klyuka');},
  apply:function(){P.synEdge=1;}},
 {id:'gravecircle',n:'Погребальный круг',d:'Скошенные косой оставляют могилы для Тризны',tag:'void',
  req:function(){return pairReady('trizna','kosa');},
  apply:function(){P.synGrave=1;}},
 {id:'bonestorm',n:'Венец грозы',d:'Серия убийств удлиняет цепь Сопели',tag:'elec',
  req:function(){return pairReady('kosti','sopel');},
  apply:function(){P.synBoneStorm=1;}},
 {id:'hungerpull',n:'Пустое чрево',d:'Подбор больше не гасит голод, а лишь половинит его',tag:'pois',
  req:function(){return _hasW618('golod')&&wLvl('golod')>=3&&(cardLv['Око Велеса']||0)>0;},
  apply:function(){P.synHunger=1;}},
 {id:'wolfgraves',n:'Стая из курганов',d:'Вместе с призраками из могил встают волки',tag:'phys',
  req:function(){return pairReady('zov','trizna');},
  apply:function(){P.synWolfGraves=1;}},
 {id:'idolrope',n:'Капище на привязи',d:'Вервь тянется до идолов: круг тотема шире',tag:'elec',
  req:function(){return pairReady('idol','verv');},
  apply:function(){P.synIdolRope=1;}},
 {id:'mirrorstaff',n:'Отдарок',d:'Полученная боль сильнее кормит Зерцало',tag:'void',
  req:function(){return pairReady('zercalo','klyuka');},
  apply:function(){P.synMirror=1;}},
 {id:'serpshadow',n:'Круг за спиной',d:'Навий хвост подгоняет лезвия: +1 к орбите серпа',tag:'phys',
  req:function(){return pairReady('serp','navi');},
  apply:function(){NEWW_LVL.serp+=2;}},
 {id:'stoneshock',n:'Громовой скол',d:'Отскоки камня идут по следам молнии',tag:'elec',
  req:function(){return pairReady('kamen','sopel');},
  apply:function(){NEWW_LVL.kamen++;NEWW_LVL.sopel++;}}
);


// ============================================================
//  v6.18b  РАЗДЕЛЁННОЕ МАСШТАБИРОВАНИЕ
//  Было: у всех 27 орудий одна формула роста — (база+шаг*ур) * P.dmgMul,
//  площадь через P.areaMul. То есть КАЖДАЯ пассивка усиливала КАЖДОЕ оружие
//  одинаково. Следствие: билдов меньше, чем кажется по числу карт, — «Пояс силы»
//  был обязателен всем, а «Точильный камень» никогда не был выбором.
//  Стало: у оружия есть СРОДСТВО к оси роста. Пояс силы даёт Росе 1.4, а
//  Упыриному зубу 0.5 — и впервые появляется причина собирать разные пассивки
//  под разные орудия. Плюс две новые оси, которых в игре не было совсем:
//  количество (снаряды/волки/отскоки) и длительность (следы/тотемы/стая).
//
//  БАЛАНС. Коэффициенты подобраны так, чтобы среднее по арсеналу осталось ~1.0
//  (d: 1.06, a: 0.98) — суммарная сила игрока не изменилась, изменилось её
//  РАСПРЕДЕЛЕНИЕ. Отдельные орудия просели (Роса от урона, Упырь от радиуса),
//  отдельные выросли (Клюка от урона, Вихрь от радиуса) — это и есть цель.
//   d — сродство к урону  (Точильный камень, Медвежья хватка, древо силы)
//   a — сродство к радиусу (Пояс силы)
//   n — сродство к количеству (новая карта «Двойная мера»), 0 = не применимо
//   u — сродство к длительности (новая карта «Долгий век»), 0 = не применимо
// ============================================================
