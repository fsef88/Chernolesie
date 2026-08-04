// ============================================================
//  v6.18f  СТРАХОВКА РЕЦЕПТА И ОЖИВЛЕНИЕ СТАРЫХ СИНЕРГИЙ
// ============================================================
// Возвращает НАЗВАНИЕ пассивки, которая сейчас блокирует хотя бы один рецепт:
// оружие уже набрало нужный уровень, всё упирается только в неё. Если таких
// несколько — берём ту, что блокирует орудие с наибольшим уровнем (игрок в него
// вложился больше всех). Если ничего не блокирует — null, пул не трогаем.
function recipeBlocker(){
 const need=evoMinLvl();
 let best=null,bestLv=-1;
 for(const w of weapons){
  const r=EVO_RECIPES[w.id];
  if(!r||w.evo)continue;
  const lv=wLvl(w.id);
  if(lv<need||passiveTaken(r.p))continue;
  if(lv>bestLv){bestLv=lv;best=r.p;}
 }
 for(const au of auraList()){
  const r=EVO_RECIPES[au.k];
  if(!r||!au.a.on||au.a.evo)continue;
  if(au.a.lvl<need||passiveTaken(r.p))continue;
  if(au.a.lvl>bestLv){bestLv=au.a.lvl;best=r.p;}
 }
 // Пассивку можно взять, только если для неё есть слот (лимит SLOTS.passives).
 // Иначе гарантировать её бессмысленно: cardAllowed всё равно её отфильтрует.
 if(best&&!cardAllowed({t:best}))return null;
 return best;
}
// v6.18f: сундук как вторая страховка. Если рецепт блокирует только пассивка,
// а карта всё равно не пришла (игрок выбрал другое), сундук говорит об этом
// прямо — раньше он просто молча качал уровень.
// ------------------------------------------------------------
// СТАРЫЕ СИНЕРГИИ. Все 20 требовали ДВЕ эволюции сразу. С рецептами (v6.18)
// двойная эволюция стала заметно реже, и половина старого контента рисковала
// стать мёртвой: условие, выполнимое раз в двадцать забегов, — это не контент.
// Смягчаем ровно так же, как у новых связок: одна эволюция + вторая вещь на
// уровне от 3. Правим не тексты условий, а сами req — оборачиваем каждый в
// «или мягкая проверка», поэтому старое поведение остаётся достижимым путём.
// ------------------------------------------------------------
(function relaxOldSynergies(){
 // мягкие требования: id синергии -> [что должно быть эволюционировано ИЛИ прокачано]
 const SOFT={
  blooddance:['sword','poison'],  iceblade:['sword','frost'],   thornsweep:['sword','thorn'],
  stormstrike:['sword','bolt'],   poisonrain:['bow','poison'],  icevolley:['bow','frost'],
  thornvolley:['bow','thorn'],    stormvolley:['bow','bolt'],   chainplague:['bolt','poison'],
  chainfrost:['bolt','frost'],    stormshield:['bolt','thorn'], deathmist:['poison','frost'],
  poisonshards:['poison','thorn'],shatterfrost:['frost','thorn'],frostchain:['frost','bolt']
 };
 const lvlOf=function(k){
  if(k==='poison')return poison.on?poison.lvl:0;
  if(k==='thorn') return thorn.on?thorn.lvl:0;
  if(k==='frost') return frost.on?frost.lvl:0;
  return weapons.some(function(w){return w.id===k;})?wLvl(k):0;
 };
 const evoOf=function(k){
  if(k==='poison')return !!poison.evo;
  if(k==='thorn') return !!thorn.evo;
  if(k==='frost') return !!frost.evo;
  const w=weapons.find(function(x){return x.id===k;});return !!(w&&w.evo);
 };
 for(const sy of SYNERGIES){
  const pair=SOFT[sy.id];
  if(!pair)continue;                       // apocalypse и орбитные — не трогаем
  const hard=sy.req;
  sy.req=function(){
   try{if(hard())return true;}catch(e){}
   const a=pair[0],b=pair[1];
   if(!lvlOf(a)||!lvlOf(b))return false;
   if(!evoOf(a)&&!evoOf(b))return false;   // хотя бы одна эволюция всё же нужна
   return lvlOf(a)>=3&&lvlOf(b)>=3;
  };
 }
})();

