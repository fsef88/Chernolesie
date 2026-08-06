const WEAPON_ICON_WORDS={serp:['серп','волчий круг','волчья сталь'],kosa:['коса','жатва','отбитое лезвие'],ugli:['угли','выжженный','смоляная поступь'],kamen:['алатырь','град сварога','granёный','гранёный скол'],obereg:['оберег','круг предков','резной'],zov:['зов велеса','стая-тень','волч'],kolokol:['колокол','набат'],verv:['вервь','мары'],idol:['идол','чур'],navi:['навий','хвост'],rosa:['роса','мокош'],vihr:['вихрь','стрибог'],klyuka:['клюка','яг'],zerno:['зерно','марен','пашня'],kosti:['костян','венец'],upyr:['упырин','зуб'],zercalo:['зерцало','кривда'],sopel:['сопель'],trizna:['тризна','курган'],golod:['голод']};
const CARD_ICON_MAP={
 'Гроза Перуна':'bolt',
 'Буря Перуна':'bolt',
 'Громовой напев':'bolt',
 'Барабан Перуна':'bolt',
 'Горнило пепла':'bolt',
 'Древко Перуна':'bolt',
 'Ядовитые споры':'pois',
 'Чума земли':'pois',
 'Мор-туман':'pois',
 'Шипы (лозы)':'pois',
 'Шипастая петля':'pois',
 'Хватка чащи':'pois',
 'Серп-оборотень':'serp',
 'Волчий круг':'serp',
 'Волчья сталь':'serp',
 'Коса Моры':'kosa',
 'Жатва':'kosa',
 'Отбитое лезвие':'kosa',
 'Угли Чернобога':'ugli',
 'Выжженный путь':'ugli',
 'Смоляная поступь':'ugli',
 'Камень Алатырь':'kamen',
 'Град Сварога':'kamen',
 'Гранёный скол':'kamen',
 'Оберег Рода':'obereg',
 'Круг предков':'obereg',
 'Резной оберег':'obereg',
 'Зов Велеса':'zov',
 'Стая-тень':'zov',
 'Вой в чаще':'zov',
 'Колокол Яви':'kolokol',
 'Набат':'kolokol',
 'Медный звон':'kolokol',
 'Вервь Мары':'verv',
 'Двойные путы':'verv',
 'Тугая вервь':'verv',
 'Идол Чура':'idol',
 'Капище':'idol',
 'Резной столб':'idol',
 'Навий хвост':'navi',
 'Тень по пятам':'navi',
 'Мёртвая хватка':'navi',
 'Роса Мокоши':'rosa',
 'Живая вода':'rosa',
 'Утренник':'rosa',
 'Вихрь Стрибога':'vihr',
 'Смерч':'vihr',
 'Порывистый ветер':'vihr',
 'Клюка Яги':'klyuka',
 'Костяная клюка':'klyuka',
 'Тяжёлый посох':'klyuka',
 'Зерно Марены':'zerno',
 'Мёртвая пашня':'zerno',
 'Тучное зерно':'zerno',
 'Костяной венец':'kosti',
 'Венец владыки':'kosti',
 'Крепкая кость':'kosti',
 'Упыриный зуб':'upyr',
 'Жажда крови':'upyr',
 'Острый клык':'upyr',
 'Зерцало правды':'zercalo',
 'Кривда':'zercalo',
 'Чистое стекло':'zercalo',
 'Сопель Перуна':'sopel',
 'Цепь небес':'sopel',
 'Долгий разряд':'sopel',
 'Тризна':'trizna',
 'Курганы':'trizna',
 'Поминный круг':'trizna',
 'Голод Нави':'golod',
 'Ненасытность':'golod',
 'Пустое чрево':'golod',
 'Ледяная аура':'frost',
 'Зимний плен':'frost',
 'Стужа Мораны':'frost',
 'Стая Велеса':'void',
 'Шёпот стаи':'void',
 'Заточка меча':'sword',
 'Кровавая заточка':'sword',
 'Размах Рагнарёка':'sword',
 'Тетива из жил':'bow',
 'Смоляные наконечники':'bow',
 'Иней на острие':'bow',
 'Дальний дозор':'bow',
 'Спаренный выстрел':'bow',
 'Ливень заставы':'bow',
 'Колчан дозора':'bow',
 'Пробуждение колчана':'star',
 'Пробуждение клинка':'star',
 'Небесная цепь':'star',
 'Пробуждение грозы':'star',
 'Клятва ратника':'star',
 'Корни Мораны':'star',
 'Метка дозора':'eye',
 'Глаз заставы':'eye'
};
// v6.71: ТОЧНЫЙ СЛОВАРЬ иконок карточек — закрывает все коллизии регэкспов/fallback
function cardIconId(o){
 if(o.t && CARD_ICON_MAP[o.t]) return CARD_ICON_MAP[o.t];
 if(o.icon && ICONS.map[o.icon]) return o.icon;
 // v6.35: ищем иконку орудия по названию карты. Проверяем ДО общих правил,
 // иначе «Коса Моры» уйдёт в 'frost', а «Зов Велеса» — в 'bag'.
 {const _t=(o.t||'').toLowerCase();
  for(const _id in WEAPON_ICON_WORDS){
   if(!PAINTED_ICONS[_id])continue;
   for(const _w of WEAPON_ICON_WORDS[_id]){ if(_t.indexOf(_w)>=0) return _id; }
  }}
 const t=(o.t||'').toLowerCase();
 if(/пробуждение|эвол|ливень|рагнар|громобой|перунов|небесн|клятва|синер/.test(t)) return 'star';
 if(/меч|заточ|клинок|точил| rag|меч/.test(t)) return 'sword';
 if(/лук|тетив|колчан|стрел|дозор|снайп|глаз заставы/.test(t)) return 'bow';
 if(/молни|гроз|перун|гром|болт/.test(t)) return 'bolt';
 if(/яд|мор|шип|кров|смол/.test(t)) return 'pois';
 if(/мороз|лёд|иней|стуж|моран/.test(t)) return 'frost';
 if(/ворон|ста|тен|навь|void|шёпот/.test(t)) return 'void';
 if(/hp|лад|жизн|живиц|кольчуг|лечен/.test(t)) return 'heart';
 if(/сапог|скор|бег|ветер/.test(t)) return 'boot';
 if(/золот|мешок|велес|удач|кость/.test(t)) return 'bag';
 if(/крит|глаз|ворон/.test(t)) return 'eye';
 if(/щит|брон|защит/.test(t)) return 'shield';
 if(/спец|печат|заряд|ярил/.test(t)) return 'sun';
 if(o.tag==='phys')return 'phys';
 if(o.tag==='elec')return 'elec';
 if(o.tag==='pois')return 'pois';
 if(o.tag==='frost')return 'frost';
 if(o.tag==='void')return 'void';
 return 'dar';
}

const CLASS_VISUALS={
 warrior:{color:'#ffcf6a',accent:'#fff0b0',mark:'⚔',seal:'Кровавый круг',sealIcon:'⚔'},
 druid:{color:'#bfe0ff',accent:'#e9fbff',mark:'❄',seal:'Морозный обет',sealIcon:'❄'},
 shaman:{color:'#8fd0ff',accent:'#ffffff',mark:'⚡',seal:'Гнев Перуна',sealIcon:'⚡'},
 rogue:{color:'#b478ff',accent:'#f0d8ff',mark:'☽',seal:'Стая Велеса',sealIcon:'☽'},
 archer:{color:'#9ac06a',accent:'#e8f4b0',mark:'ᛉ',seal:'Залп дозора',sealIcon:'🏹'},
 ognevik:{color:'#ff8a3c',accent:'#ffd9a0',mark:'♨',seal:'Горнило',sealIcon:'🔥'},
 groznik:{color:'#a8ccff',accent:'#eef6ff',mark:'⛈',seal:'Копьё Грозы',sealIcon:'⛈'}
};
function sealInfo(id){
 const cv=CLASS_VISUALS[id]||CLASS_VISUALS.warrior;
 return {
  color:cv.color,
  accent:cv.accent,
  name:cv.seal||'Печать',
  icon:cv.sealIcon||cv.mark||'✦',
  iconId:sealIconId(id),
  svg:ICONS.get(sealIconId(id))
 };
}

// ============================================================
//  v5.18 — ГЕРОЙ В БОЮ: живописный жетон богатыря (тот самый портрет)
// ============================================================
