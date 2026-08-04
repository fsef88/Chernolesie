//  КАРТОЧКИ АПГРЕЙДОВ
// ============================================================
const CARD_POOL=[
 {t:'Точильный камень',d:'+16% урона',tag:'phys',f:()=>P.dmgMul+=0.16},
 {t:'Наузы',d:'+15% скорости атак',tag:'phys',f:()=>P.rateMul+=0.15},
 {t:'Сапоги-скороходы',d:'+15% скорости',tag:'phys',f:()=>P.spd*=1.15},
 {t:'Ладанка',d:'+35 макс. HP, лечение',tag:'phys',f:()=>{P.maxhp+=35;P.hp=Math.min(P.maxhp,P.hp+35)}},
 {t:'Пояс силы',d:'+25% радиус атак',tag:'phys',f:()=>P.areaMul+=0.25},
 {t:'Око Велеса',d:'+50% подбор',tag:'phys',f:()=>P.pickup*=1.5},
 {t:'Грозовая стужа',d:'Молния+мороз',tag:'elec',f:()=>{frost.on=true;if(!hasBolt){hasBolt=true;weapons.push({id:'bolt',cd:1.25,t:0,evo:false});}}},
 {t:'Ядовитая кровь',d:'Шипы+яд',tag:'pois',f:()=>{thorn.on=true;poison.on=true;}},
 {t:'Ледяная хватка',d:'+25% замедление',tag:'frost',f:()=>frost.lvl++}, // v6.19 (C1): оси кулдаун/пробитие как пассивки
 {t:'Скорый жест',d:'+18% частота атак (кулдаун)',tag:'phys',f:()=>P.cdMul=(P.cdMul||1)*0.85},
 {t:'Сверло',d:'+1 пробитие снарядов',tag:'phys',f:()=>P.pierceMul=(P.pierceMul||1)*1.6},

 {t:'Заряд спецатаки',d:'+1 к макс.',tag:'void',f:()=>specialMax++},
 {t:'Воронья стая',d:'+2 ворона на орбите',tag:'void',f:()=>addOrbs(2)},
 {t:'Живая кора',d:'+20 макс. HP и +0.4 реген/с',tag:'phys',f:()=>{P.maxhp+=20;P.hp=Math.min(P.maxhp,P.hp+20);P.regen=(P.regen||0)+0.4;}},
 {t:'Клеймо ярости',d:'+12% крит',tag:'phys',f:()=>{P.crit=(P.crit||0)+0.12;}},
 {t:'Медвежья хватка',d:'+15% урон, −5% скорость',tag:'phys',f:()=>{P.dmgMul+=0.15;P.spd*=0.95;}},
 {t:'Шёпот Нави',d:'+1 реликт-слот (макс. 5)',tag:'void',f:()=>{P.maxRelics=Math.min(5,(P.maxRelics||3)+1);}},
 {t:'Кровавая роса',d:'+0.3 вампиризм с убийств',tag:'pois',f:()=>{P.lifesteal=(P.lifesteal||0)+0.3;}},
 // v6.18b: две оси роста, которых в игре не было. Они бесполезны половине
 // арсенала (сродство 0) — и в этом смысл: карта впервые может быть «не для
 // моего билда», а значит выбор карты становится решением, а не бесплатным +.
 {t:'Двойная мера',d:'+20% количества: лезвия, волки, отскоки, звенья',tag:'phys',f:()=>{P.amountMul=(P.amountMul||1)+0.20;}},
 {t:'Долгий век',d:'+25% длительности: следы, тотемы, стая, путы',tag:'void',f:()=>{P.durMul=(P.durMul||1)+0.25;}},
];
// ============================================================
//  v5.69 СЛОТЫ БИЛДА + ЭВОЛЮЦИЯ ЧЕРЕЗ СУНДУК
//  Дизайнерские ручки: SLOTS, EVO. Канон VS: набор ограничен,
//  поэтому взятие карты = отказ от другой, а не просто +к силе.
// ============================================================
// v7.31: потолок прокачки 5 -> 8, как в Vampire Survivors.
// Было: 12 слотов x 5 = 60 осмысленных прокачек, а замер живого забега дал
// 71 уровень — то есть примерно каждая третья карта за забег выпадала филлером
// («+8% урона»), потому что качать было уже нечего. Стало 12 x 8 = 96:
// билд достраивается к концу забега, а не к середине.
// EVO.minLvl намеренно остался на 5 — эволюция должна приходить в середине
// забега, а уровни 6-8 остаются ростом уже пробуждённого оружия.
const SLOTS={weapons:6,passives:6,maxLevel:8};
const EVO={viaCards:false,minLvl:5,chestGold:30};

// ============================================================
//  v5.72  СИНЕРГИИ — ТРЕТИЙ УРОВЕНЬ БИЛДА
// ============================================================
//  Уровень 1: оружие/аура (карты, до 5 ур.)
//  Уровень 2: эволюция   (сундук с элиты, нужен 5 ур.)
//  Уровень 3: СИНЕРГИЯ   (карта, нужны ДВЕ эволюции сразу)
//
//  КАК ЭТО РАБОТАЕТ (для правок другими людьми/ИИ):
//  1) req()  — предикат: доступна ли синергия ПРЯМО СЕЙЧАС.
//              Он не смотрит, взята ли она — это делает synTaken.
//  2) apply()— выполняется ОДИН раз при взятии карты. Внутри —
//              только уже существующие ручки игры (P.*, lvl аур,
//              orbCount) либо флаги P.syn*, которые читаются в
//              updateEnemyAuras()/оружии. Новых систем не заводим.
//  3) Карта синергии появляется в пуле САМА, когда req() истинно
//              и она ещё не взята (см. synergyCards()).
//  4) Взятая синергия навсегда попадает в synTaken и рисуется
//              полоской в HUD (renderSynergyHud).
//
//  ЧТОБЫ ДОБАВИТЬ НОВУЮ СИНЕРГИЮ — допишите объект в массив.
//  Ничего больше править не нужно: пул, HUD и сброс забега
//  подхватят её автоматически.
// ============================================================
const synTaken={};                     // id -> true (что уже взято за забег)
function hasEvo(id){const w=weapons.find(x=>x.id===id);return !!(w&&w.evo);}
function synCount(){return Object.keys(synTaken).length;}
// ============================================================
// v6.42 ДОСТУПНОСТЬ СИНЕРГИЙ.
// Замер живого забега на 12 минут: 13 сундуков, 3 эволюции, и всего ОДНА
// уникальная синергия из 26. Причина арифметическая: 22 из 26 требуют ДВУХ
// эволюций одновременно (а шесть — трёх-четырёх), тогда как за забег их
// набирается две-три. Синергия — сильнейший крючок жанра, это ЗНАНИЕ, которое
// игрок открывает сам и уносит в следующий забег; запертая за таким условием,
// она не существует для 99% игроков.
//
// Для НОВОГО арсенала (v6.18) уже действует мягкое правило pairReady:
// «обе вещи взяты + хотя бы одна эволюционировала + вторая не ниже 3 ур.».
// Распространяем ту же идею на старые связки, но единым помощником, который
// понимает и орудия, и ауры (у аур своё поле .evo и свой .lvl).
//
// Условие НЕ бесплатное: одна настоящая эволюция всё равно нужна, а второй
// компонент требует вложений (3-й уровень). Так синергия остаётся наградой
// за собранный билд, но перестаёт быть лотереей на два сундука подряд.
// ============================================================
const _AURAS={poison:()=>poison,thorn:()=>thorn,frost:()=>frost};
function _synHas(k){                       // вещь вообще взята?
 if(_AURAS[k]){const a=_AURAS[k]();return !!(a&&a.on);}
 if(k==='orbit')return !!hasOrbit;
 return weapons.some(w=>w.id===k);
}
function _synEvo(k){                       // эволюционировала?
 if(_AURAS[k]){const a=_AURAS[k]();return !!(a&&a.evo);}
 if(k==='orbit')return !!hasOrbit&&(orbCount||0)>=5;   // рой воронов = «эво» орбиты
 return hasEvo(k);
}
function _synLvl(k){
 if(_AURAS[k]){const a=_AURAS[k]();return a?(a.lvl||1):0;}
 if(k==='orbit')return orbCount||0;
 return (typeof wLvl==='function'&&weapons.some(w=>w.id===k))?wLvl(k):0;
}
// Мягкое условие пары: обе взяты + хотя бы одна эволюционировала + вторая
// докачана до 3-го уровня. Работает для любого числа компонентов.
function synReady(...ks){
 for(const k of ks)if(!_synHas(k))return false;
 if(!ks.some(_synEvo))return false;                 // без единой эволюции — нет
 return ks.every(k=>_synEvo(k)||_synLvl(k)>=3);     // остальные докачаны
}

const SYNERGIES=[
 // ---------- МЕЧ ----------
 {id:'blooddance',n:'Кровава тризна',d:'Меч рвёт плоть: +25% урона, яд гуще',tag:'pois',
  req:()=>synReady('sword','poison'),
  apply:()=>{P.dmgMul+=0.25;poison.lvl++;P.synBloodDance=1;}},
 {id:'iceblade',n:'Клинок Мораны',d:'Удары студят: мороз чаще сковывает',tag:'frost',
  req:()=>synReady('sword','frost'),
  apply:()=>{frost.lvl++;P.synIceBlade=1;}},
 {id:'thornsweep',n:'Терновый размах',d:'+20% радиус дуги, шипы шире',tag:'phys',
  req:()=>synReady('sword','thorn'),
  apply:()=>{P.areaMul=(P.areaMul||1)+0.20;thorn.lvl++;}},
 {id:'stormstrike',n:'Перунов зарок',d:'Меч зовёт молнию: +20% темп болтов',tag:'elec',
  req:()=>synReady('sword','bolt'),
  apply:()=>{P.boltRateMul=(P.boltRateMul||1)*1.20;P.dmgMul+=0.10;}},
 // ---------- ЛУК ----------
 {id:'poisonrain',n:'Мор-ливень',d:'Стрелы сеют мор: +2 заряда яда',tag:'pois',
  req:()=>synReady('bow','poison'),
  apply:()=>{P.arrowPoison=(P.arrowPoison||0)+2;poison.lvl++;}},
 {id:'icevolley',n:'Иней Перуна',d:'Стрелы леденят: +2 заряда стужи',tag:'frost',
  req:()=>synReady('bow','frost'),
  apply:()=>{P.arrowFrost=(P.arrowFrost||0)+2;frost.lvl++;}},
 {id:'thornvolley',n:'Тернова сеча',d:'+60 дальность лука, шипы гуще',tag:'phys',
  req:()=>synReady('bow','thorn'),
  apply:()=>{P.bowRange=(P.bowRange||0)+60;thorn.lvl++;}},
 {id:'stormvolley',n:'Стрибожий посвист',d:'Шанс двойной стрелы +25%',tag:'elec',
  req:()=>synReady('bow','bolt'),
  apply:()=>{P.bowDouble=(P.bowDouble||0)+0.25;boltLvl++;}},
 // ---------- МОЛНИЯ ----------
 {id:'chainplague',n:'Моровая гроза',d:'Цепь длиннее и разносит мор',tag:'pois',
  req:()=>synReady('bolt','poison'),
  apply:()=>{P.evoBoltStorm=(P.evoBoltStorm||0)+1;poison.lvl++;}},
 {id:'chainfrost',n:'Мораний повой',d:'Цепь длиннее и сковывает',tag:'frost',
  req:()=>synReady('bolt','frost'),
  apply:()=>{P.evoBoltStorm=(P.evoBoltStorm||0)+1;frost.lvl++;}},
 {id:'stormshield',n:'Грозовой оберег',d:'Кольцо шипов бьёт больнее',tag:'elec',
  req:()=>synReady('bolt','thorn'),
  apply:()=>{thorn.lvl+=2;P.synStormShield=1;}},
 // ---------- АУРЫ ----------
 {id:'deathmist',n:'Навий морок',d:'Мор и стужа вместе: враги вязнут',tag:'pois',
  req:()=>synReady('poison','frost'),
  apply:()=>{poison.lvl++;frost.lvl++;P.synDeathMist=1;}},
 {id:'poisonshards',n:'Ядовитый терн',d:'Шипы всегда отравляют',tag:'pois',
  req:()=>synReady('poison','thorn'),
  apply:()=>{P.synPoisonShards=1;thorn.lvl++;}},
 {id:'shatterfrost',n:'Ломкий полон',d:'Мёрзлые враги ломаются от шипов',tag:'frost',
  req:()=>synReady('frost','thorn'),
  apply:()=>{P.synShatterFrost=1;frost.lvl++;}},
 {id:'frostchain',n:'Стылое поле',d:'+25% радиус стужи',tag:'frost',
  req:()=>synReady('frost','bolt'),
  apply:()=>{P.frostR=(P.frostR||1)+0.25;frost.lvl++;}},
 // ---------- ОРБИТА (вороны) ----------
 {id:'ravenclaws',n:'Вороньи когти',d:'+1 ворон, стая бьёт сильнее',tag:'void',
  req:()=>synReady('orbit','thorn'),
  apply:()=>{addOrbs(1);P.shadowOrbMul=(P.shadowOrbMul||1)*1.15;}},
 {id:'blacklightning',n:'Вороний гром',d:'+1 ворон, болты чаще',tag:'elec',
  req:()=>synReady('orbit','bolt'),
  apply:()=>{addOrbs(1);P.boltRateMul=(P.boltRateMul||1)*1.12;}},
 {id:'deathswarm',n:'Мёртвый рой',d:'+1 ворон, мор гуще',tag:'pois',
  req:()=>synReady('orbit','poison'),
  apply:()=>{addOrbs(1);poison.lvl++;}},
 {id:'frostshadow',n:'Стылая тень',d:'+1 ворон, стужа сильнее',tag:'frost',
  req:()=>synReady('orbit','frost'),
  apply:()=>{addOrbs(1);frost.lvl++;}},
 // ---------- МЕТА ----------
 {id:'apocalypse',n:'Чёрный полдень',d:'Все три ауры пробуждены: +30% урон, +15% радиус',tag:'void',
  req:()=>synReady('poison','thorn','frost')&&synCount()>=3,
  apply:()=>{P.dmgMul+=0.30;P.areaMul=(P.areaMul||1)+0.15;P.synApocalypse=1;}}, // v6.19 (C2): синергии-тройки — «три орудия одной стихии»
 {id:'voidchoir',n:'Теневой сход',d:'Три теневых орудия эволюционировали: +25% урон, +20% радиус',tag:'void',
  req:()=>synReady('zov','navi')&&(_synHas('upyr')||_synHas('trizna')),
  apply:()=>{P.dmgMul+=0.25;P.areaMul=(P.areaMul||1)+0.20;P.synVoidChoir=1;}},
 {id:'emberstorm',n:'Огненный смерч',d:'Три огненных орудия эволюционировали: следы горят ярче, +1 прыжок',tag:'pois',
  req:()=>synReady('ugli','zerno','golod'),
  apply:()=>{poison.lvl++;P.evoBoltStorm=(P.evoBoltStorm||0)+1;P.synEmberStorm=1;}},
 {id:'thunderchoir',n:'Грозовой хор',d:'Три громовых орудия эволюционировали: +25% темп болтов, +15% урон',tag:'elec',
  req:()=>synReady('sopel','kolokol','zercalo'),
  apply:()=>{P.boltRateMul=(P.boltRateMul||1)*1.25;P.dmgMul+=0.15;P.synThunderChoir=1;}},
 // ---------- ГЛУБИНА (v6.23): тематические тройки + Апокалипсис ----------
 {id:'triune',n:'Триединый дозор',d:'Меч+Лук+Молния эволюционировали: +20% урон, +15% темп болтов, +10% радиус',tag:'elec',
  req:()=>synReady('sword','bow','bolt'),
  apply:()=>{P.dmgMul+=0.20;P.boltRateMul=(P.boltRateMul||1)*1.15;P.areaMul=(P.areaMul||1)+0.10;P.synTriune=1;}},
 {id:'naviswarm',n:'Навий сход',d:'Тьма стекается: +1 ворон, волки живут дольше, +25% урон теневого',tag:'void',
  req:()=>synReady('orbit','zov','navi'),
  apply:()=>{addOrbs(1);P.shadowOrbMul=(P.shadowOrbMul||1)*1.12;P.dmgMul+=0.25;P.synNaviSwarm=1;}},
 // v6.42 БАГ: у этой синергии был id 'apocalypse' — ТОТ ЖЕ, что у «Чёрного
 // полдня» выше. Пул отсеивает по synTaken[s.id], поэтому взятый Полдень
 // навсегда закрывал АПОКАЛИПСИС, венец всего забега: он не мог выпасть
 // никогда. Даём собственный ключ.
 {id:'apocalypse4',n:'АПОКАЛИПСИС',d:'Четыре стихии эволюционировали: +40% урон, +25% радиус, +20% темп, вампиризм +0.5',tag:'phys',
  req:()=>synReady('poison','frost','bolt','orbit'),
  apply:()=>{P.dmgMul+=0.40;P.areaMul=(P.areaMul||1)+0.25;P.boltRateMul=(P.boltRateMul||1)*1.20;P.lifesteal=(P.lifesteal||0)+0.5;P.synApocalypse4=1;}},
];

// Карты синергий для пула: только доступные и ещё не взятые.
function synergyCards(){
 const out=[];
 for(const s of SYNERGIES){
  if(synTaken[s.id])continue;
  let ok=false; try{ok=!!s.req();}catch(e){ok=false;}
  if(!ok)continue;
  out.push({t:'✦ '+s.n,d:s.d,tag:s.tag,syn:true,synId:s.id,icon:'star',
   f:()=>takeSynergy(s.id)});
 }
 return out;
}
// Взятие синергии: разовый apply + заметная обратная связь.
function takeSynergy(id){
 const s=SYNERGIES.find(x=>x.id===id);
 if(!s||synTaken[id])return;
 synTaken[id]=true;
 try{s.apply();}catch(e){if(typeof swallow==='function')swallow('syn.apply',e);}
 log('✦ СИНЕРГИЯ: '+s.n+'!','evo');
 if(typeof journalFind==='function')journalFind('syn',s.id,s.n);   // v6.18: находки копятся между забегами
 if(typeof flashScreen==='function')flashScreen('#c8a6ff',0.35);
 if(typeof sfxEvo==='function')sfxEvo();
 // v6.39 ВИЗУАЛ СИНЕРГИИ. Все 26 синергий не рисовали НИЧЕГО в мире:
 // только засвет экрана и строка в логе. Событие редкое (нужны две
 // эволюции сразу), поэтому оно должно читаться как награда.
 // Цвет берём из tag самой синергии — тот же, что у её стихии.
 try{
  const _c=(TAG_FX[s.tag]||TAG_FX.void);
  for(let i=0;i<3;i++){const f=spawnFlash(P.x,P.y,1,i?_c.f:'#ffffff'); if(f){f.t=f.max=0.3+i*0.14;}}
  for(let i=0;i<22;i++){
   const a=i/22*TAU;
   spawnParticle(P.x,P.y,Math.cos(a)*(140+rnd(0,180)),Math.sin(a)*(140+rnd(0,180)),
     rnd(.4,.85),_c.p[i%_c.p.length],_c.g*0.4,0);
  }
  shake=Math.max(shake,5);
 }catch(e){}
 // v6.17: тряска убрана — событие подаётся флешем и звуком
}
// Полоска активных синергий в HUD (под слотами).
function renderSynergyHud(){
 const el=document.getElementById('synhud');
 if(!el)return;
 const ids=Object.keys(synTaken);
 if(!ids.length){if(el.textContent)el.textContent='';return;}
 const key=ids.join(',');
 if(el.dataset.k===key)return;      // перерисовываем только при изменении
 el.dataset.k=key;
 el.innerHTML=ids.map(id=>{
  const s=SYNERGIES.find(x=>x.id===id);
  return s?'<span class="synbadge">✦ '+s.n+'</span>':'';
 }).join('');
}
// карта названия -> какие источники атаки она занимает
