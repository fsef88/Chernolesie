// ============================================================
//  v6.25 РЕЖИМЫ ЗАБЕГА
//  Полный забег идёт 30 минут. Это много для «ещё один заходик»,
//  особенно в браузере: игрок с телефона на такое не подписывается.
//  Короткий режим сжимает ТО ЖЕ содержание в 12 минут: те же пять
//  мини-боссов, тот же финальный босс, та же кривая сложности —
//  просто расписание плотнее. Ничего не вырезано.
//
//  Все производные величины считаются от одного коэффициента,
//  поэтому добавить третий режим = добавить строку в RUN_MODES.
// ============================================================
const RUN_MODES={
  full:  {id:'full',  name:'Полный поход', sub:'~30 минут', icon:'\u2694', k:1},
  short: {id:'short', name:'Короткий бой', sub:'~12 минут', icon:'\u26A1', k:0.4},
};
const BALANCE_BASE={
  bossTime:BALANCE.bossTime,
  miniAt:BALANCE.miniAt.slice(),
  eliteEvery:BALANCE.eliteEvery,
  eliteEveryLate:BALANCE.eliteEveryLate,
  eliteLateAt:BALANCE.eliteLateAt,
  hpStepSec:BALANCE.hpStepSec,
};
let runMode='full';
try{const m=localStorage.getItem('cl_mode'); if(m&&RUN_MODES[m])runMode=m;}catch(e){}

function applyRunMode(id){
  const M=RUN_MODES[id]||RUN_MODES.full;
  runMode=M.id;
  try{localStorage.setItem('cl_mode',M.id);}catch(e){}
  const k=M.k;
  BALANCE.bossTime      = Math.round(BALANCE_BASE.bossTime*k);
  BALANCE.miniAt        = BALANCE_BASE.miniAt.map(t=>Math.round(t*k));
  BALANCE.eliteEvery    = Math.max(20,Math.round(BALANCE_BASE.eliteEvery*k));
  BALANCE.eliteEveryLate= Math.max(14,Math.round(BALANCE_BASE.eliteEveryLate*k));
  BALANCE.eliteLateAt   = Math.round(BALANCE_BASE.eliteLateAt*k);
  // Сложность растёт по игровому времени. Без этой поправки короткий забег
  // был бы просто «первые 12 минут длинного» — то есть слишком лёгким.
  BALANCE.hpStepSec     = Math.max(8,Math.round(BALANCE_BASE.hpStepSec*k));
  // v6.25: спавн и плотность считаются по времени прогресса (см. progT).
  timeScaleK            = k;
  // v6.26: Порча — множитель поверх адаптивной сложности.
  // Пересчитываем от базового diffMul, иначе множитель накапливался бы
  // при каждом запуске забега.
  diffMul = clamp(LS.num('cl_diff',1),0.5,1.5)*corruptionMul();
  BOSS_TIME             = BALANCE.bossTime;
  bossT                 = BOSS_TIME;
  return M;
}

// МИНИ-БОССЫ ПО РАСПИСАНИЮ BALANCE.miniAt: 5:00 10:00 15:00 20:00 25:00,
// по кругу чередуя Древня, Стрыгу и Лешего-Вожака.
// v5.86: комментарий говорил «раз в 3 минуты» — расписание сменилось в v5.65.
// miniBossE/mini2BossE — ссылки для HP-полосы; *Kills — для достижений.
let miniBossE=null,mini2BossE=null,mini3BossE=null,treantKills=0,mglistKills=0,warlordKills=0;
let miniIdx=0;   // v5.65: расписание в BALANCE.miniAt
let metaGold=LS.num('cl_gold',0);
let perks={dmg:0,hp:0,spd:0,crit:0,regen:0,area:0,pickup:0,special:0,luck:0};
try{const raw=LS.get('cl_perks');if(raw){const p=JSON.parse(raw);if(p&&typeof p==='object'&&!Array.isArray(p)){
  for(const k of Object.keys(p)){if(typeof p[k]==='number'&&isFinite(p[k]))perks[k]=Math.max(0,p[k]|0);}
}} }catch(e){swallow('save.perks',e);}
let diffMul=clamp(LS.num('cl_diff',1),0.5,1.5);

