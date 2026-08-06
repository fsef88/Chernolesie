function buildCardPool(){
const pool=[...CARD_POOL].filter(c=>!(c.t==='Ледяная хватка'&&!frost.on)); // v5.41 (Б6): без ауры карта мертва
 // фильтруем карты по наличию оружия. Шаман не имеет меча →
 // «Заточка меча» бесполезна. Аналогично: если нет орбиты, не предлагаем
 // «Стая Велеса» и т.п. Убираем карты мусорного уровня из пула.
 const hasSword=weapons.some(w=>w.id==='sword');
 const hasBow=weapons.some(w=>w.id==='bow');
 if(!hasBolt)pool.push({t:'Гроза Перуна',d:'Молнии по врагам',tag:'elec',f:()=>{hasBolt=true;weapons.push({id:'bolt',cd:1.25,t:0,evo:false});}});
 else pool.push({t:'Буря Перуна',d:'Молнии чаще и сильнее',tag:'elec',f:()=>boltLvl++});
 if(!poison.on)pool.push({t:'Ядовитые споры',d:'Облака яда',tag:'pois',f:()=>poison.on=true});
 else if(poison.evo)pool.push({t:'Чума земли',d:'Evo-яд: аура ядовитого облака',tag:'pois',f:()=>{P.evoPoisonCloud=(P.evoPoisonCloud||0)+1;}});
 else pool.push({t:'Мор-туман',d:'Яд сильнее',tag:'pois',f:()=>poison.lvl++});
 // ===== v6.17: НОВЫЙ АРСЕНАЛ =====
 // Каждое оружие: карта открытия -> карты уровня -> карта evo (после эволюции).
 const _hasW=id=>weapons.some(w=>w.id===id);
 const _wEvo=id=>{const w=weapons.find(x=>x.id===id);return w&&w.evo;};
 if(!_hasW('serp'))pool.push({t:'Серп-оборотень',d:'Лезвия по дуге, возвращаются в руку',tag:'phys',f:()=>weapons.push({id:'serp',cd:2.1,t:0,evo:false})});
 else if(_wEvo('serp'))pool.push({t:'Волчий круг',d:'Evo-серп: вдвое больше лезвий',tag:'phys',f:()=>NEWW_LVL.serp++});
 else pool.push({t:'Волчья сталь',d:'Серпы чаще и дальше',tag:'phys',f:()=>NEWW_LVL.serp++});
 if(!_hasW('kosa'))pool.push({t:'Коса Моры',d:'Широкий взмах перед собой',tag:'frost',f:()=>weapons.push({id:'kosa',cd:1.5,t:0,evo:false})});
 else if(_wEvo('kosa'))pool.push({t:'Жатва',d:'Evo-коса: круговой взмах, сковывает',tag:'frost',f:()=>NEWW_LVL.kosa++});
 else pool.push({t:'Отбитое лезвие',d:'Коса шире и больнее',tag:'frost',f:()=>NEWW_LVL.kosa++});
 if(!_hasW('ugli'))pool.push({t:'Угли Чернобога',d:'Горящий след за спиной',tag:'pois',f:()=>weapons.push({id:'ugli',cd:0.55,t:0,evo:false})});
 else if(_wEvo('ugli'))pool.push({t:'Выжженный путь',d:'Evo-угли: тлеют дольше и травят',tag:'pois',f:()=>NEWW_LVL.ugli++});
 else pool.push({t:'Смоляная поступь',d:'След шире и жарче',tag:'pois',f:()=>NEWW_LVL.ugli++});
 if(!_hasW('kamen'))pool.push({t:'Камень Алатырь',d:'Осколок скачет между врагами',tag:'phys',f:()=>weapons.push({id:'kamen',cd:1.35,t:0,evo:false})});
 else if(_wEvo('kamen'))pool.push({t:'Град Сварога',d:'Evo-камень: вдвое больше скачков',tag:'phys',f:()=>NEWW_LVL.kamen++});
 else pool.push({t:'Гранёный скол',d:'Камень бьёт сильнее и скачет чаще',tag:'phys',f:()=>NEWW_LVL.kamen++});
 if(!_hasW('obereg'))pool.push({t:'Оберег Рода',d:'Кольцо отбрасывает тварей',tag:'elec',f:()=>weapons.push({id:'obereg',cd:1.9,t:0,evo:false})});
 else if(_wEvo('obereg'))pool.push({t:'Круг предков',d:'Evo-оберег: толкает вдвое, сковывает',tag:'elec',f:()=>NEWW_LVL.obereg++});
 else pool.push({t:'Резной оберег',d:'Кольцо шире и злее',tag:'elec',f:()=>NEWW_LVL.obereg++});
 if(!_hasW('zov'))pool.push({t:'Зов Велеса',d:'Волки охотятся сами',tag:'void',f:()=>weapons.push({id:'zov',cd:4.5,t:0,evo:false})});
 else if(_wEvo('zov'))pool.push({t:'Стая-тень',d:'Evo-зов: вдвое больше волков',tag:'void',f:()=>NEWW_LVL.zov++});
 else pool.push({t:'Вой в чаще',d:'Волков больше, живут дольше',tag:'void',f:()=>NEWW_LVL.zov++});
 // ===== v6.17b: ВТОРАЯ ВОЛНА =====
 if(!_hasW('kolokol'))pool.push({t:'Колокол Яви',d:'Удар по всему экрану',tag:'elec',f:()=>weapons.push({id:'kolokol',cd:7.0,t:0,evo:false})});
 else if(_wEvo('kolokol'))pool.push({t:'Набат',d:'Evo-колокол: бьёт сильнее и морозит',tag:'elec',f:()=>NEWW_LVL.kolokol++});
 else pool.push({t:'Медный звон',d:'Колокол чаще и дальше',tag:'elec',f:()=>NEWW_LVL.kolokol++});
 if(!_hasW('verv'))pool.push({t:'Вервь Мары',d:'Цепь режет всех между двумя тварями',tag:'frost',f:()=>weapons.push({id:'verv',cd:2.4,t:0,evo:false})});
 else if(_wEvo('verv'))pool.push({t:'Двойные путы',d:'Evo-вервь: две цепи, сковывает',tag:'frost',f:()=>NEWW_LVL.verv++});
 else pool.push({t:'Тугая вервь',d:'Цепь режет больнее',tag:'frost',f:()=>NEWW_LVL.verv++});
 if(!_hasW('idol'))pool.push({t:'Идол Чура',d:'Тотем бьёт молниями сам',tag:'void',f:()=>weapons.push({id:'idol',cd:6.0,t:0,evo:false})});
 else if(_wEvo('idol'))pool.push({t:'Капище',d:'Evo-идол: три тотема, бьют чаще',tag:'void',f:()=>NEWW_LVL.idol++});
 else pool.push({t:'Резной столб',d:'Идол живёт дольше и бьёт дальше',tag:'void',f:()=>NEWW_LVL.idol++});
 if(!_hasW('navi'))pool.push({t:'Навий хвост',d:'Бьёт за спиной на бегу',tag:'void',f:()=>weapons.push({id:'navi',cd:1.3,t:0,evo:false})});
 else if(_wEvo('navi'))pool.push({t:'Тень по пятам',d:'Evo-хвост: шире и злее',tag:'void',f:()=>NEWW_LVL.navi++});
 else pool.push({t:'Мёртвая хватка',d:'Хвост бьёт больнее',tag:'void',f:()=>NEWW_LVL.navi++});
 if(!_hasW('rosa'))pool.push({t:'Роса Мокоши',d:'Жжёт вокруг и лечит за каждого',tag:'pois',f:()=>weapons.push({id:'rosa',cd:2.2,t:0,evo:false})});
 else if(_wEvo('rosa'))pool.push({t:'Живая вода',d:'Evo-роса: лечит вдвое',tag:'pois',f:()=>NEWW_LVL.rosa++});
 else pool.push({t:'Утренник',d:'Роса шире и лечит больше',tag:'pois',f:()=>NEWW_LVL.rosa++});
 if(!_hasW('vihr'))pool.push({t:'Вихрь Стрибога',d:'Стягивает тварей в кучу',tag:'elec',f:()=>weapons.push({id:'vihr',cd:3.2,t:0,evo:false})});
 else if(_wEvo('vihr'))pool.push({t:'Смерч',d:'Evo-вихрь: тянет вдвое сильнее',tag:'elec',f:()=>NEWW_LVL.vihr++});
 else pool.push({t:'Порывистый ветер',d:'Вихрь шире и сильнее',tag:'elec',f:()=>NEWW_LVL.vihr++});
 if(!_hasW('klyuka'))pool.push({t:'Клюка Яги',d:'Копит твой урон и бьёт в ответ',tag:'void',f:()=>weapons.push({id:'klyuka',cd:1.0,t:0,evo:false})});
 else if(_wEvo('klyuka'))pool.push({t:'Костяная клюка',d:'Evo-клюка: отдача вдвое',tag:'void',f:()=>NEWW_LVL.klyuka++});
 else pool.push({t:'Тяжёлый посох',d:'Ответный удар больнее',tag:'void',f:()=>NEWW_LVL.klyuka++});
 if(!_hasW('zerno'))pool.push({t:'Зерно Марены',d:'Зерно всходит взрывом',tag:'pois',f:()=>weapons.push({id:'zerno',cd:2.0,t:0,evo:false})});
 else if(_wEvo('zerno'))pool.push({t:'Мёртвая пашня',d:'Evo-зерно: всходит быстрее, травит',tag:'pois',f:()=>NEWW_LVL.zerno++});
 else pool.push({t:'Тучное зерно',d:'Взрыв шире и злее',tag:'pois',f:()=>NEWW_LVL.zerno++});
 // ===== v6.17c: ТРЕТЬЯ ВОЛНА (оружие «состояния») =====
 if(!_hasW('kosti'))pool.push({t:'Костяной венец',d:'Растёт с каждым убийством подряд',tag:'phys',f:()=>weapons.push({id:'kosti',cd:1.1,t:0,evo:false})});
 else if(_wEvo('kosti'))pool.push({t:'Венец владыки',d:'Evo-венец: вдвое больше ярусов',tag:'phys',f:()=>NEWW_LVL.kosti++});
 else pool.push({t:'Крепкая кость',d:'Венец шире и злее',tag:'phys',f:()=>NEWW_LVL.kosti++});
 if(!_hasW('upyr'))pool.push({t:'Упыриный зуб',d:'Тем сильнее, чем меньше твоих сил',tag:'void',f:()=>weapons.push({id:'upyr',cd:1.6,t:0,evo:false})});
 else if(_wEvo('upyr'))pool.push({t:'Жажда крови',d:'Evo-зуб: три цели, ярость выше',tag:'void',f:()=>NEWW_LVL.upyr++});
 else pool.push({t:'Острый клык',d:'Зуб бьёт больнее и дальше',tag:'void',f:()=>NEWW_LVL.upyr++});
 if(!_hasW('zercalo'))pool.push({t:'Зерцало правды',d:'Копит твою боль и возвращает залпом',tag:'elec',f:()=>weapons.push({id:'zercalo',cd:1.0,t:0,evo:false})});
 else if(_wEvo('zercalo'))pool.push({t:'Кривда',d:'Evo-зерцало: возврат вдвое, копит быстрее',tag:'elec',f:()=>NEWW_LVL.zercalo++});
 else pool.push({t:'Чистое стекло',d:'Зерцало бьёт шире',tag:'elec',f:()=>NEWW_LVL.zercalo++});
 if(!_hasW('sopel'))pool.push({t:'Сопель Перуна',d:'Молния скачет по цепи врагов',tag:'elec',f:()=>weapons.push({id:'sopel',cd:1.8,t:0,evo:false})});
 else if(_wEvo('sopel'))pool.push({t:'Цепь небес',d:'Evo-сопель: девять звеньев, морозит',tag:'elec',f:()=>NEWW_LVL.sopel++});
 else pool.push({t:'Долгий разряд',d:'Больше звеньев в цепи',tag:'elec',f:()=>NEWW_LVL.sopel++});
 if(!_hasW('trizna'))pool.push({t:'Тризна',d:'Бьёт там, где твари уже пали',tag:'void',f:()=>weapons.push({id:'trizna',cd:1.7,t:0,evo:false})});
 else if(_wEvo('trizna'))pool.push({t:'Курганы',d:'Evo-тризна: пять могил разом',tag:'void',f:()=>NEWW_LVL.trizna++});
 else pool.push({t:'Поминный круг',d:'Тризна шире и злее',tag:'void',f:()=>NEWW_LVL.trizna++});
 if(!_hasW('golod'))pool.push({t:'Голод Нави',d:'Крепнет, пока не подбираешь камни',tag:'pois',f:()=>weapons.push({id:'golod',cd:1.4,t:0,evo:false})});
 else if(_wEvo('golod'))pool.push({t:'Ненасытность',d:'Evo-голод: пять ступеней ярости',tag:'pois',f:()=>NEWW_LVL.golod++});
 else pool.push({t:'Пустое чрево',d:'Голод растёт быстрее',tag:'pois',f:()=>NEWW_LVL.golod++});
 if(!thorn.on)pool.push({t:'Шипы (лозы)',d:'Аура шипов',tag:'phys',f:()=>thorn.on=true});
 else if(thorn.evo)pool.push({t:'Шипастая петля',d:'Evo-шипы: враги медленнее и слабее',tag:'phys',f:()=>{P.evoThornWeb=(P.evoThornWeb||0)+1;}});
 else pool.push({t:'Хватка чащи',d:'Шипы шире',tag:'phys',f:()=>thorn.lvl++});
 if(!frost.on)pool.push({t:'Ледяная аура',d:'Замедляет и ранит',tag:'frost',f:()=>frost.on=true});
 else if(frost.evo)pool.push({t:'Зимний плен',d:'Evo-стужа: враги замерзают и ломаются',tag:'frost',f:()=>{P.evoFrostBind=(P.evoFrostBind||0)+1;}});
 else pool.push({t:'Стужа Мораны',d:'Мороз сильнее',tag:'frost',f:()=>frost.lvl++});
 if(hasOrbit)pool.push({t:'Стая Велеса',d:'+1 ворон',tag:'void',f:()=>addOrbs(1)});
 // ЗАЩИТА: «Заточка меча» только если у игрока ЕСТЬ меч. Шаман без меча
 // получал эту карту, и она ничего не давала — пустое улучшение.
 if(hasSword)pool.push({t:'Заточка меча',d:'+урон меча',tag:'phys',f:()=>swordLvl++});
 if(hasBow){
  pool.push({t:'Тетива из жил',d:'+урон и темп лука',tag:'phys',f:()=>bowLvl++});
  pool.push({t:'Смоляные наконечники',d:'Стрелы накладывают яд',tag:'pois',f:()=>{P.arrowPoison=(P.arrowPoison||0)+1;poison.on=true;}});
  pool.push({t:'Иней на острие',d:'Стрелы могут заморозить',tag:'frost',f:()=>{P.arrowFrost=(P.arrowFrost||0)+1;frost.on=true;}});
  pool.push({t:'Дальний дозор',d:'+55 дальность лука',tag:'phys',f:()=>{P.bowRange=(P.bowRange||0)+55;}});
  pool.push({t:'Спаренный выстрел',d:'Шанс 30% вторая стрела',tag:'phys',f:()=>{P.bowDouble=(P.bowDouble||0)+0.30;runStats.bowDouble=1;}});
  const bw=weapons.find(w=>w.id==='bow');
  if(bw&&bw.evo){
   pool.push({t:'Ливень заставы',d:'Evo-лук: +1 стрела веера',tag:'phys',f:()=>{P.evoBowRain=(P.evoBowRain||0)+1;}});
   pool.push({t:'Метка дозора',d:'Попадания лука +8% урона 3с',tag:'void',f:()=>{P.synergyMark=(P.synergyMark||0)+1;}});
  }else if(bw&&bowLvl>=3){
   if(EVO.viaCards)pool.push({t:'Пробуждение колчана',d:'Мгновенно эволюционируй лук',tag:'void',f:()=>{bw.evo=true;runStats.bowEvo=true;P.evoBowRain=1;log('🏹 Стрелы Перунова Древа!','evo');sfxEvo();}});
  }
 }else if(!hasSword||currentClass==='druid'){
  // v5.83: было currentClass==='shaman'||'druid' — Огневик и Грозник тоже
  // кастеры без меча (их passive делает weapons=[bolt]), но в список их
  // не дописали: единственная карта второго оружия им не выпадала никогда.
  pool.push({t:'Колчан дозора',d:'Лук лесной заставы',tag:'phys',f:()=>{if(!weapons.some(w=>w.id==='bow'))weapons.push({id:'bow',cd:1.22,t:0,evo:false});}});
 }
 // меч evo-карты
 const sW2=weapons.find(w=>w.id==='sword');
 if(sW2){
  if(sW2.evo){
   pool.push({t:'Кровавая заточка',d:'Evo-меч: удары вешают кровоток',tag:'pois',f:()=>{P.evoSwordBleed=(P.evoSwordBleed||1)+1;}});
   pool.push({t:'Размах Рагнарёка',d:'Evo-меч: +18% радиус дуги',tag:'phys',f:()=>{P.areaMul=(P.areaMul||1)+0.18;}});
  }else if(swordLvl>=3){
   if(EVO.viaCards)pool.push({t:'Пробуждение клинка',d:'Мгновенно эволюционируй меч',tag:'void',f:()=>{sW2.evo=true;runStats.swordEvo=true;P.evoSwordBleed=1;log('⚔ Рагнарёк пробуждается!','evo');sfxEvo();}});
  }
 }
 // молния evo
 const bW2=weapons.find(w=>w.id==='bolt');
 if(bW2){
  if(bW2.evo){
   pool.push({t:'Небесная цепь',d:'Evo-молния: +1 прыжок цепи',tag:'elec',f:()=>{P.evoBoltStorm=(P.evoBoltStorm||0)+1;}});
   pool.push({t:'Громовой напев',d:'Evo-молния: +15% темп болтов',tag:'elec',f:()=>{P.boltRateMul=(P.boltRateMul||1)*1.15;}});
  }else if(boltLvl>=3){
   if(EVO.viaCards)pool.push({t:'Пробуждение грозы',d:'Мгновенно эволюционируй молнии',tag:'void',f:()=>{bW2.evo=true;runStats.boltEvo=true;P.evoBoltStorm=1;hasBolt=true;log('⚡ Громобой нисходит!','evo');sfxEvo();}});
  }
 }
 // классовые синергии (1-2 в пул)
 if(currentClass==='warrior'){
  pool.push({t:'Клятва ратника',d:'После Q: +15% урон 4с',tag:'phys',f:()=>{P.synergyWarQ=(P.synergyWarQ||0)+1;}});
 }else if(currentClass==='druid'){
  pool.push({t:'Корни Мораны',d:'Яд и стужа +1 ур. синергии',tag:'frost',f:()=>{frost.on=true;poison.on=true;frost.lvl++;poison.lvl++;}});
 }else if(currentClass==='shaman'){
  pool.push({t:'Барабан Перуна',d:'Печать копится +25% быстрее',tag:'elec',f:()=>{P.sealChargeMul=(P.sealChargeMul||1)*1.25;}});
 }else if(currentClass==='rogue'){
  pool.push({t:'Шёпот стаи',d:'Вороны +12% урона',tag:'void',f:()=>{P.shadowOrbMul=(P.shadowOrbMul||1)*1.12;if(hasOrbit)addOrbs(1);}});
 }else if(currentClass==='archer'){
  pool.push({t:'Глаз заставы',d:'Крит +8% и +30 дальн. лука',tag:'phys',f:()=>{P.crit=(P.crit||0)+0.08;P.bowRange=(P.bowRange||0)+30;}});
 }else if(currentClass==='ognevik'){
  // v5.83: у Огневика и Грозника классовой карты не было вообще — цепочка
  // if/else заканчивалась на archer, и два из семи классов остались без
  // своей синергии, хотя у остальных пяти она есть.
  pool.push({t:'Горнило пепла',d:'Область +10%, молнии +10% урона',tag:'elec',f:()=>{P.areaMul=(P.areaMul||1)+0.10;P.boltDmgMul=(P.boltDmgMul||1)*1.10;}});
 }else if(currentClass==='groznik'){
  pool.push({t:'Древко Перуна',d:'Молнии +12% урона, +6% бег',tag:'elec',f:()=>{P.boltDmgMul=(P.boltDmgMul||1)*1.12;P.spd*=1.06;}});
 }
 // для Daily Run используем seedRandom — карты будут одинаковые
 // у всех игроков в этот день. Обычные забеги (runSeed=0) → Math.random.
 // v5.72: карты синергий. Они НЕ занимают слоты оружия/пассивок —
 // это надстройка над двумя уже взятыми эволюциями, поэтому идут
 // мимо cardAllowed. Вес x2: синергия должна попадаться заметно.
 const synCards=synergyCards();
 for(const sc of synCards)pool.push(sc);
 // v6.42 СИНЕРГИЯ ДОЛЖНА БЫТЬ ВИДНА. Комментарий выше обещал «вес x2», но
 // карта клалась в пул РОВНО ОДИН раз и тонула среди ~40 других: замер живого
 // забега показал две ГОТОВЫЕ синергии, ни разу не выпавшие за 12 минут.
 // Синергия — редчайшее событие билда (нужна эволюция плюс докачка второго
 // компонента) и главный крючок жанра: игрок открывает связку сам и уносит
 // знание в следующий забег. Прятать её за случайностью нельзя.
 // Даём гарантированный слот, как страховке рецепта ниже: ОДНА синергия
 // (случайная из готовых) занимает первую позицию, остальные два слота
 // остаются обычными — выбор не вырождается в единственную кнопку.
 let _synForce=null;
 if(synCards.length)_synForce=synCards[Math.floor(seedRandom()*synCards.length)];
 const pool2=pool.filter(c=>c.syn?true:cardAllowed(c));   // v5.69: лимит слотов и уровней
 const opts=[];
 // v6.18f СТРАХОВКА РЕЦЕПТА. Дыра, которую открыли рецепты эволюций (v6.18):
 // эволюция требует НАЗВАННУЮ пассивку, но карты выпадают случайно. Оружие могло
 // дойти до потолка уровня, а «Пояс силы» не предложиться ни разу за забег —
 // и рецепт, который игрок весь забег видел в HUD, оставался невыполнимым.
 // Это худший вид фрустрации: цель показана, а дороги к ней нет.
 // Теперь: если хотя бы одно орудие ДОРОСЛО до нужного уровня и упирается ровно
 // в отсутствующую пассивку — эта пассивка занимает один из трёх слотов выбора.
 // Гарантируется только ОДИН слот: остальные два остаются случайными, поэтому
 // выбор не вырождается в «нажми единственную кнопку».
 // v6.42: сначала синергия — она реже и ценнее рецептовой подсказки
 if(_synForce){
  const si=pool2.findIndex(c=>c.synId&&c.synId===_synForce.synId);
  if(si>=0)opts.push(pool2.splice(si,1)[0]);
 }
 {const miss=recipeBlocker();
  if(miss){
   const idx=pool2.findIndex(c=>c.t===miss);
   if(idx>=0)opts.push(pool2.splice(idx,1)[0]);
  }}
 // v6.18g ВТОРАЯ ПРИЧИНА, почему слоты забивались за полминуты. Кривая опыта —
 // только половина беды. Вторая: в пуле 27 орудий, и почти каждая карта была
 // «вот тебе НОВОЕ оружие». Три карты из трёх открывали новый слот, отказаться
 // было не от чего — слоты забивались сами собой, без единого решения игрока.
 // В канонe жанра пул мал, поэтому новинка — редкость, а обычный выбор это
 // «что из уже взятого качать».
 // Теперь: пока орудий меньше трёх — не больше двух новинок за раз, дальше —
 // не больше ОДНОЙ. Остальные слоты уходят под апгрейды того, что уже есть.
 // Если в пуле физически не осталось ничего, кроме новинок (всё прочее уперлось
 // в потолок уровня), ограничение снимается — пустых окон выбора не будет.
 {let newLeft=(ownedWSlots().size>=3)?1:2;
 // v6.19 (B2): ранние уровни — НОВИНКИ обязательны. Гарантируем хотя бы
 // одну незнакомую вещь на level<=3, чтобы первые минуты учили арсенал.
 if(level<=3){
  const _hasNew=opts.some(o=>opensNewSlot(o));
  if(!_hasNew){
   const _ni=pool2.findIndex(c=>opensNewSlot(c));
   if(_ni>=0){opts.push(pool2.splice(_ni,1)[0]);newLeft=Math.max(0,newLeft-1);}
  }
 }
 // ПЕРВЫЕ ДВА УРОВНЯ — ТОЛЬКО ОРУЖИЕ.
 // Гарантия выше давала ОДНУ новинку из трёх: игрок мог дважды подряд взять
 // пассивку и остаться с одним орудием к второй минуте. Замер показал, что
 // именно число орудий к 1:00 определяет весь забег (1 орудие → ~100 убийств,
 // 3 орудия → ~430). Пока орудий меньше двух, все три карты открывают слот —
 // выбор остаётся (какое оружие), но проигрышной ветки больше нет.
 if(level<=2&&ownedWSlots().size<2){
  const _weap=pool2.filter(opensNewSlot);
  if(_weap.length>=3){
   opts.length=0;
   for(let _i=0;_i<3&&_weap.length;_i++){
    const _k=Math.floor(seedRandom()*_weap.length),_c=_weap.splice(_k,1)[0];
    const _pi=pool2.indexOf(_c); if(_pi>=0)pool2.splice(_pi,1);
    opts.push(_c);
   }
   newLeft=0;
  }
 }
  for(const o of opts)if(opensNewSlot(o))newLeft--;
  let guard=0;
  while(opts.length<3&&pool2.length&&guard++<300){
   const i=Math.floor(seedRandom()*pool2.length),c=pool2[i];
   if(opensNewSlot(c)){
    if(newLeft<=0){
     if(pool2.some(function(x){return !opensNewSlot(x);}))continue;   // есть альтернатива — ищем её
    }else newLeft--;
   }
   opts.push(pool2.splice(i,1)[0]);
  }}
 fillOpts(opts);
 return opts;
}

// v7.4: ГЕНЕРАЦИЯ СЛАВЯНСКОЙ ТАРО-СКРИЖАЛИ С РЕДКОСТЬЮ И ЦИФРАМИ
// v11.0 RC1 EVOLUTION GRIMOIRE HINT: подсказка связи оружия и пассивки в окне прокачки
function getCardEvoHint(o){
  if(!o || !o.t) return null;
  for(const k in EVO_RECIPES){
    const rec = EVO_RECIPES[k];
    if(rec.p === o.t || (o.t.indexOf(rec.p) >= 0)){
      const hasW = weapons.some(w => w.id === k);
      if(hasW){
        return '⚡ Эволюция для: ' + (WNAME[k] || k) + ' ➔ ' + rec.n;
      }
    }
  }
  const wid = o.id || (o.wid);
  if(wid && EVO_RECIPES[wid]){
    const rec = EVO_RECIPES[wid];
    return '⚡ Эволюция с пассивкой: ' + rec.p;
  }
  return null;
}
function buildTarotCardEl(o, isNew, isFree){
  const d=document.createElement('div');
  const tag=o.tag||'dar';
  const ic=cardIconId(o);
  // v7.32: плашка «НОВИНКА» и лента редкости с карты убраны — на узкой карточке
  // они налезали друг на друга и обрезались рамкой. Новый слот теперь читается
  // по зелёной кромке (.card-new), редкость — по свечению рамки (.rar-*).

  const isEvo=/пробуждение|эвол|ливень|рагнар|громобой|перунов|небесн/i.test(o.t||'')||!!o.evo;
  const isSyn=/клятва|синер|корни мораны|барабан|шёпот стаи|глаз заставы/i.test(o.t||'')||!!o.syn;

  // 4 тира редкости: Обычный / Редкий / Эпический / Легендарный
  const _rn = seedRandom();
  const rarity = isEvo ? 'legendary' : (isSyn ? 'epic' : (_rn < 0.12 ? 'legendary' : (_rn < 0.32 ? 'epic' : (_rn < 0.65 ? 'rare' : 'common'))));
  
  d.className='card rar-'+rarity+(isEvo?' card-evo':'')+(isSyn?' card-syn':'')+(isNew?' card-new':'');
  if(typeof TAROT_FRAME_ART !== 'undefined' && TAROT_FRAME_ART.src){
    d.style.setProperty('--tarot-bg', `url("${TAROT_FRAME_ART.src}")`);
  }

  // v7.32: строка «Ур. 2 ➔ Ур. 3 (+20% урон)» убрана — на строке во всю ширину
  // важнее название и что оружие делает; шаг прокачки виден в HUD арсенала.
  const evoHint = getCardEvoHint(o);
  const hintHtml = evoHint ? `<div class="cardEvoHint">${evoHint}</div>` : '';
  d.innerHTML =
    `<div class="upgradeIcon ${tag}${isEvo?' evo':''}">${iconPaint(ic)}</div>` +
    `<div class="cbody">` +
      `<h3>${o.t}</h3>` +
      `<p>${o.d}</p>` +
      hintHtml +
    `</div>` +
    `<span class="tag ${tag}">${tag==='phys'?'сталь':tag==='elec'?'гром':tag==='pois'?'мор':tag==='frost'?'стужа':tag==='void'?'тень':'дар'}</span>` +
    `<span class="fxRunes"></span><span class="fxEdge"></span><span class="fxDust"></span>`;

  d.onclick = ()=>{
    takeCard(o);
    if(typeof sfxUpgrade==='function') sfxUpgrade();
    closeCards();
  };
  return d;
}
function showCards(){
 paused=true;
 _cardTaken=false;   // v6.42: реролл рисует новую пачку — замок должен открыться
 sfxFlip(); // v5.14.1: всегда стопаем мир (не только levelUp)
 const opts=buildCardPool();
// v6.74: пул+выбор карт вынесены в buildCardPool() (общий для лвл-апа и алтаря)

 // v6.16: АВТО-ПРОПУСК ФИЛЛЕРОВ. Если в пуле не осталось ни одной реальной карты
 // (все слоты забиты/заблокированы cardAllowed) и opts состоят ТОЛЬКО из
 // FILLER_CARDS («+золото/+HP/+скорость» и т.п.) — показ окна бессмысленен:
 // игрок всё равно получит рандомный филлер. Берём случайный и закрываем сразу.
 const _realOpts=opts.filter(o=>!FILLER_CARDS.includes(o));
 if(_realOpts.length===0&&opts.length){
  const _f=FILLER_CARDS[Math.floor(seedRandom()*FILLER_CARDS.length)];
  takeCard(_f);sfxPick();closeCards();return;
 }
 const _ct=document.querySelector('.cards-title');
 if(_ct)_ct.innerHTML='Уровень! Выбери улучшение<span style="display:block;font-size:12px;opacity:.65;margin-top:2px">'+slotsLine()+'</span>';
 // v7.32: подсказка обучения живёт поверх всего и налезала на заголовок окна
 // уровня — гасим её на время выбора, вернётся сама при следующем поводе.
 {const _tut=document.getElementById('tutorial');if(_tut)_tut.classList.remove('show');}
 const row=document.getElementById('cardrow');row.innerHTML='';
 const CARD_SVGS={
 phys:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38 28 20m-4 0 6-6 10 10-6 6M8 40l9-2-7-7z"/><path d="M30 8l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>',
 elec:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M28 4 11 27h11l-3 17 18-25H26z"/></svg>',
 pois:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5 43 40H5z"/><circle cx="24" cy="29" r="3"/><path d="M24 15v8"/></svg>',
 frost:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 5v38M7.5 14.5l33 19M7.5 33.5l33-19M15 8l9 5 9-5M15 40l9-5 9 5"/></svg>',
 void:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 42 14v20L24 44 6 34V14z"/><circle cx="24" cy="24" r="7"/><path d="M24 10v7M24 31v7M10 24h7M31 24h7"/></svg>',
 dar:'<svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 4 4 14 14 6-14 4-4 16-4-16-14-4 14-6z"/></svg>'
};
 opts.forEach(o=>{ row.appendChild(buildTarotCardEl(o, opensNewSlot(o), false)); });
 document.getElementById('cardbtns').style.display='flex';
 const btnReroll=document.getElementById('btnreroll');
 const btnSkip=document.getElementById('btnskip');
 if(gold<5){btnReroll.classList.add('disabled');btnReroll.onclick=null;}else{btnReroll.classList.remove('disabled');btnReroll.onclick=()=>{gold-=5;showCards();};}
 btnSkip.onclick=closeCards;
 document.getElementById('cards').style.display='flex';
}
function closeCards(){
 const c=document.getElementById('cards');if(c)c.style.display='none';
 // v6.74: декремент только если счётчик был >0. Алтарь (showCardsFree) зовёт
 // closeCards() без pendingLevelUps++, иначе счётчик уходил в -1 и следующий
 // levelUp() (++ -> 0) не проходил бы проверку ===1, теряя окно прокачки.
 if(pendingLevelUps>0)pendingLevelUps--;
 if(pendingLevelUps>0 && !over && !runEnded){
  setTimeout(()=>showCards(),150); // следующее окно прокачки из очереди
 } else {
  paused=false;
 }
}

// ============================================================
