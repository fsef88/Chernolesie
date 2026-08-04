// ============================================================
//  v6.26 РАЗБЛОКИРОВКА КЛАССОВ
//  Раньше все семь классов были доступны сразу, и после первого
//  забега не оставалось причины начать второй: весь контент уже
//  показан. Теперь четыре класса открываются за конкретные
//  достижения — это канон жанра и главный крючок возвращения.
//
//  Стартовые три покрывают базовые архетипы (ближний бой, контроль,
//  маг), поэтому первый выбор не выглядит безальтернативным.
//  Условия намеренно ранние: первое открытие должно случиться
//  в первом же забеге, иначе система читается как запрет, а не цель.
// ============================================================
const CLASS_UNLOCKS={
  warrior:null,                                   // с самого начала
  druid:null,
  shaman:null,
  // v6.31 НАКОПИТЕЛЬНЫЕ ЦЕЛИ.
  // Прежние условия («500 убийств», «10 минут») брались за ОДИН забег
  // и открывали три класса в первой же сессии. Замер ботом это подтвердил.
  // Теперь цель нельзя взять с наскока: она копится через много попыток,
  // и каждый забег читается как вклад в прогресс.
  //  have() — сколько уже есть, need — сколько нужно.
  rogue:  {need:5,    have:()=>life.minis,  hint:'победи 5 мини-боссов',      short:'мини-боссов'},
  archer: {need:10000,have:()=>life.kills,  hint:'10 000 убийств всего',      short:'убийств'},
  ognevik:{need:3,    have:()=>life.noDmg,  hint:'3 забега без единой раны',  short:'чистых забегов'},
  groznik:{need:2,    have:()=>life.wins,   hint:'победи Хранителя 2 раза',   short:'побед'},
};
function classUnlocked(id){
  const u=CLASS_UNLOCKS[id];
  if(!u)return true;
  try{return u.have()>=u.need;}catch(e){return false;}
}
function classLockHint(id){
  const u=CLASS_UNLOCKS[id];
  if(!u)return '';
  // Показываем не просто условие, а ПРОГРЕСС: «3 / 5 мини-боссов».
  // Видимый счётчик — то, ради чего игрок запускает следующий забег.
  let h=0; try{h=u.have();}catch(e){}
  const n=u.need;
  const num=(n>=1000)?(h.toLocaleString('ru-RU')+' / '+n.toLocaleString('ru-RU')):(h+' / '+n);
  return num+' '+u.short;
}
function classLockFrac(id){
  const u=CLASS_UNLOCKS[id];
  if(!u)return 1;
  try{return Math.min(1,u.have()/u.need);}catch(e){return 0;}
}
// Сколько классов ещё закрыто — для строки-приманки на титульнике.
function lockedClassCount(){
  return CLASSES.reduce((n,c)=>n+(classUnlocked(c.id)?0:1),0);
}
let tree={};try{const t=LS.get('cl_tree');if(t){const p=JSON.parse(t);if(p&&typeof p==='object'&&!Array.isArray(p))tree=p;}}catch(e){tree={};}

