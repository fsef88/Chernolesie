// ============================================================
//  ДОСТИЖЕНИЯ (22 шт)
// ============================================================
const ACHIEVEMENTS=[
 {id:'first_kill',cat:'combat',icon:'⚔',name:'Первая кровь',desc:'Убей первого врага',cond:(s)=>s.kills>=1,prog:(s)=>s.kills},
 {id:'kills_100',cat:'combat',icon:'💀',name:'Сотня',desc:'100 убийств за забег',cond:(s)=>s.kills>=100,prog:(s)=>Math.min(100,s.kills)},
 {id:'kills_500',cat:'combat',icon:'☠',name:'Мясорубка',desc:'500 убийств за забег',cond:(s)=>s.kills>=500,prog:(s)=>Math.min(500,s.kills)},
 {id:'kills_1000',cat:'combat',icon:'🩸',name:'Тысяча',desc:'1000 убийств за забег',cond:(s)=>s.kills>=1000,prog:(s)=>Math.min(1000,s.kills)},
 {id:'boss_kill',cat:'combat',icon:'👑',name:'Хранитель повержен',desc:'Убей босса',cond:(s)=>s.won,prog:(s)=>s.won?1:0},
 {id:'treant_kill',cat:'combat',icon:'🌲',name:'Лесной исполин',desc:'Победи Древня — младшего Хранителя',cond:(s)=>(s.treant||0)>=1,prog:(s)=>s.treant?1:0},
 {id:'mglist_kill',cat:'combat',icon:'👁',name:'Стрыга изгнана',desc:'Изгнай Стрыгу — ночную охотницу',cond:(s)=>(s.mglist||0)>=1,prog:(s)=>s.mglist?1:0},
 {id:'warlord_kill',cat:'combat',icon:'🌳',name:'Вожак срублен',desc:'Победи Лешего-Вожака',cond:(s)=>(s.warlord||0)>=1,prog:(s)=>s.warlord?1:0},
 {id:'no_damage',cat:'combat',icon:'🛡',name:'Неуязвимый',desc:'2 минуты без единой раны',cond:(s)=>s.time>=120&&!s._dmgTaken,hidden:true},
 // v5.87: было s.time<=150 («до 2:30») — наследство трёхминутного забега.
 // Босс выходит на 28:00, поэтому достижение стало НЕДОСТИЖИМЫМ в принципе.
 // Смысл «спидраннера» сохраняем: убить Хранителя за 90 с после его выхода.
 {id:'speed_kill',cat:'combat',icon:'⚡',name:'Спидраннер',desc:'Убей босса за 90с после выхода',cond:(s)=>s.won&&s.time<=BALANCE.bossTime+90,prog:(s)=>s.won?1:0},
 {id:'survive_5',cat:'survival',icon:'⏰',name:'5 минут',desc:'Продержись 5 минут',cond:(s)=>s.time>=300,prog:(s)=>Math.min(300,s.time)},
 {id:'survive_10',cat:'survival',icon:'🕐',name:'10 минут',desc:'Продержись 10 минут',cond:(s)=>s.time>=600,prog:(s)=>Math.min(600,s.time)},
 // v5.88: было только 5 и 10 минут — наследство короткого забега. Разбор
 // id ('survive_' → parseInt*60) в openAch подхватывает новые сам.
 {id:'survive_20',cat:'survival',icon:'🕕',name:'20 минут',desc:'Продержись 20 минут',cond:(s)=>s.time>=1200,prog:(s)=>Math.min(1200,s.time)},
 {id:'survive_30',cat:'survival',icon:'🕛',name:'Полный дозор',desc:'Продержись 30 минут',cond:(s)=>s.time>=1800,prog:(s)=>Math.min(1800,s.time)},
 {id:'lvl_10',cat:'build',icon:'📈',name:'Быстрый старт',desc:'Достигни 10 уровня',cond:(s)=>s.level>=10,prog:(s)=>Math.min(10,s.level)},
 {id:'lvl_25',cat:'build',icon:'🚀',name:'Сила',desc:'Достигни 25 уровня',cond:(s)=>s.level>=25,prog:(s)=>Math.min(25,s.level)},
 {id:'evo_sword',cat:'build',icon:'⚔',name:'Рагнарёк',desc:'Эволюционируй меч',cond:(s)=>s.swordEvo},
 {id:'evo_bolt',cat:'build',icon:'⚡',name:'Громобой',desc:'Эволюционируй молнии',cond:(s)=>s.boltEvo},
 {id:'evo_bow',cat:'build',icon:'🏹',name:'Верный дозор',desc:'Эволюционируй лук',cond:(s)=>s.bowEvo},
 {id:'bow_double',cat:'build',icon:'🎯',name:'Спаренный глаз',desc:'Возьми «Спаренный выстрел»',cond:(s)=>(s.bowDouble||0)>0},
 {id:'combo_20',cat:'combat',icon:'🔥',name:'Сеча',desc:'Серия 20 убийств без паузы',cond:(s)=>(s.maxCombo||0)>=20},
 // v5.87: было жёстко >=5 при семи классах — Огневик и Грозник в требование
 // «сыграй за все классы» не входили. Здесь и ниже берём длину массива.
 {id:'all_classes',cat:'meta',icon:'🎭',name:'Универсал',desc:'Сыграй за все классы',cond:()=>achData.progress&&Object.keys(achData.progress.classes||{}).length>=CLASSES.length,hidden:true},
 {id:'all_boons',cat:'meta',icon:'🌟',name:'Под защитой богов',desc:'Получи благословение всех 5 божеств',cond:()=>achData.progress&&Object.keys(achData.progress.boons||{}).length>=BOONS.length,hidden:true},
 {id:'all_curses',cat:'meta',icon:'💀',name:'Проклятый',desc:'Получи все 4 проклятия',cond:()=>achData.progress&&Object.keys(achData.progress.curses||{}).length>=CURSES.length,hidden:true},
 {id:'no_curse',cat:'meta',icon:'🛡',name:'Светлый путь',desc:'3 победы без проклятий',cond:()=>achData.progress&&achData.progress.noCurseWins>=3,hidden:true},
 {id:'with_curse',cat:'meta',icon:'💀',name:'Любитель риска',desc:'Победи с проклятием',cond:()=>achData.progress&&achData.progress.curseWins>=1},
 {id:'daily_streak',cat:'meta',icon:'📅',name:'Дисциплина',desc:'3 daily подряд',cond:()=>achData.progress&&achData.progress.dailyStreak>=3,hidden:true},
 {id:'relics_3',cat:'build',icon:'💎',name:'Коллекционер',desc:'3 реликвии за забег',cond:(s)=>s.relics>=3,prog:(s)=>Math.min(3,s.relics)},
 {id:'tree_max',cat:'meta',icon:'🌳',name:'Древо познано',desc:'Макси одну ветку древа',cond:()=>achData.progress&&achData.progress.treeMax>=1},
 {id:'meta_gold_1000',cat:'meta',icon:'💰',name:'Богач',desc:'1000 золота Заставы',cond:()=>metaGold>=1000,prog:()=>Math.min(1000,metaGold)},
 {id:'meta_gold_10000',cat:'meta',icon:'💎',name:'Торговец',desc:'10000 золота Заставы',cond:()=>metaGold>=10000,prog:()=>Math.min(10000,metaGold)},
 {id:'first_blood_drawn',cat:'combat',icon:'🩸',name:'Кровопролитие',desc:'Убей 50 врагов за 2 минуты',cond:(s)=>s.kills>=50&&s.time<=120,prog:(s)=>Math.min(50,s.kills)},
];
const ACH_CATS={combat:'⚔ Бой',survival:'🛡 Выживание',build:'🏗 Билды',meta:'🌟 Мета'};
// v5.88: сбор живых данных вынесен из checkAch. Раньше экран достижений
// брал прогресс из runStats, который во время забега почти пустой (его
// заполняет endRun), поэтому полоски показывали 0/100 даже при 90 убийствах.
function achLive(){
 return {
  kills,level,won,time,hpPct:P.hp/P.maxhp,gold,
  // v5.41 (Б2): treant/mglist/warlord/maxCombo/bowDouble сюда НЕ попадали —
  // 5 достижений были навечно мертвы (cond видел undefined). Доказано probe_audit.
  treant:treantKills,mglist:mglistKills,warlord:warlordKills,
  maxCombo:runStats.maxCombo||0,bowDouble:(runStats.bowDouble||0)||(P.bowDouble>0?1:0),
  _dmgTaken:runDmgTaken>0,
  swordEvo:!!weapons.find(w=>w.id==='sword'&&w.evo),
   boltEvo:!!weapons.find(w=>w.id==='bolt'&&w.evo),
   bowEvo:!!weapons.find(w=>w.id==='bow'&&w.evo),
  relics:relics.length
 };
}
function checkAch(){
 const live=achLive();
 for(const a of ACHIEVEMENTS){
  if(!a||!a.cond)continue;
  if(achData.unlocked[a.id])continue;
  try{
   if(a.cond(live))unlockAch(a);
  }catch(e){swallow('ach.cond',e);}
 }
}
function unlockAch(a){
 if(!a)return;
 if(!achData.unlocked[a.id]){
  achData.unlocked[a.id]=Date.now();
  if(!achData.notified[a.id]){
   achData.notified[a.id]=1;
   notifyAch(a);
   sfxAch();
  }
  LS.set('cl_ach',JSON.stringify(achData));
  // v6.31: классы больше не привязаны к достижениям — они открываются
  // по пожизненным счётчикам, см. commitLife() в endRun().
 }
}
// v6.26: очередь открытых за забег классов — показывается на итогах.
let pendingClassUnlocks=[];
function showClassUnlockToast(){
 if(!pendingClassUnlocks.length)return;
 const el=document.getElementById('classUnlockToast');
 const nm=document.getElementById('cutName');
 if(!el||!nm)return;
 const name=pendingClassUnlocks.shift();
 nm.textContent=name;
 el.classList.add('show');
 try{sfxAch();}catch(e){}
 setTimeout(()=>{
  el.classList.remove('show');
  // следующий в очереди — через паузу, чтобы плашки не наложились
  if(pendingClassUnlocks.length)setTimeout(showClassUnlockToast,600);
 },3200);
}
let _achTimeout=null;
function notifyAch(a){
 const n=document.getElementById('achnotif');if(!n||!a)return;
 n.style.display='flex';
 document.getElementById('achnotifIcon').textContent=a.icon;
 document.getElementById('achnotifTitle').textContent=a.name;
 document.getElementById('achnotifDesc').textContent=a.desc;
 n.classList.add('show');
 if(_achTimeout)clearTimeout(_achTimeout);
 _achTimeout=setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.style.display='none',500);},3500);
}
let currentAchCat='combat';
function openAch(){
 document.getElementById('achov').style.display='flex';
 const tabs=document.getElementById('achtabs');tabs.innerHTML='';
 Object.keys(ACH_CATS).forEach(c=>{
  const b=document.createElement('span');
  b.className='achtab'+(c===currentAchCat?' active':'');
  b.textContent=ACH_CATS[c];
  b.onclick=()=>{currentAchCat=c;openAch();};
  tabs.appendChild(b);
 });
 const grid=document.getElementById('achgrid');grid.innerHTML='';
 // v5.88: catCount был объявлен и ни разу не использован — убран.
 let catTotal=0,catUnlocked=0;
 const live=achLive();   // v5.88: живые данные вместо пустого runStats
 ACHIEVEMENTS.filter(a=>a.cat===currentAchCat).forEach(a=>{
  const unlocked=!!achData.unlocked[a.id];
  const hidden=a.hidden&&!unlocked;
  if(!hidden)catTotal++;
  if(unlocked)catUnlocked++;
  const prog=a.prog?a.prog(live):(unlocked?1:0);
  let max=1;
  if(!hidden){
   if(a.id.startsWith('kills_'))max=parseInt(a.id.split('_')[1]);
   else if(a.id.startsWith('lvl_'))max=parseInt(a.id.split('_')[1]);
   else if(a.id.startsWith('survive_'))max=parseInt(a.id.split('_')[1])*60;
   else if(a.id.startsWith('meta_gold_'))max=parseInt(a.id.split('_')[2]);
   else if(a.id==='first_blood_drawn')max=50;
  }
  const el=document.createElement('div');
  el.className='ach'+(unlocked?'':' locked')+(hidden?' hidden':'');
  el.innerHTML=`<div class="icon">${hidden?'?':a.icon}</div><div><h4>${hidden?'???':a.name}</h4><p>${hidden?'Скрытое достижение':a.desc}</p>${max>1?`<div class="progress"><div style="width:${(prog/max)*100}%"></div></div>`:''}</div>`;
  grid.appendChild(el);
 });
 // v5.88: catTotal/catUnlocked считались и НЕ отображались — незаконченный
 // элемент интерфейса. Показываем счётчик открытого в текущей категории.
 const cnt=document.createElement('span');
 cnt.className='achtab';
 cnt.style.cssText='pointer-events:none;opacity:.65;margin-left:auto';
 cnt.textContent=catUnlocked+' / '+catTotal;
 tabs.appendChild(cnt);
}
document.getElementById('btnAch').onclick=()=>{paused=true;openAch();};
document.getElementById('btnAchClose').onclick=()=>{closeOverlay('achov');};

