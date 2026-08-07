const TAU=Math.PI*2;   // v6.19: константа для замены Math.PI*2 (экономит умножений)
// v6.65: ассет UI — предзагрузка (кэш для border-image)
(new Image()).src='@@A:art/util/math.jpg@@';
const rnd=(a,b)=>a+Math.random()*(b-a);
// srnd — то же, но через seedRandom: детерминировано в Daily Run.
// Используем для ГЕЙМПЛЕЙНЫХ случайностей (позиции спавна, зигзаг, зоны босса).
// Для частиц/визуала — обычный rnd().
const srnd=(a,b)=>a+seedRandom()*(b-a);
// ДЕЛЕНИЕ НА randomVisual и seedRandom:
// - seedRandom() — детерминированный PRNG для геймплея (Daily Leaderboard).
//   Используем для: тип врага при спавне, крит, элита, проклятие, тип аномалии,
//   выбор реликвии, выбор цели для молнии. В обычном забеге = Math.random.
// - randomVisual() — НИКОГДА не детерминированный. Используем для визуала:
//   позиции частиц, цвета, шейк экрана, шум, ambient. Игрок не должен
//   видеть разницу между двумя Daily забегами из-за частиц.
// - Math.random() в геймплее — баг, исправляем точечно ниже.
// ЗАЩИТА ОТ NaN: любой параметр игрока может стать NaN через undefined * 1.2
// и т.п. Один NaN заражает всё (P.hp=NaN, dmg*=NaN, health bar = NaN%).
// safeNum заменяет нечисло на дефолт. Вызываем в update() после движения.
// v5.69: пустые catch{} разобраны. Глотать молча нельзя (баг не виден),
// console.warn в аудио-коде даёт спам десятки раз в секунду. Компромисс:
// предупреждение ОДИН раз на тег, дальше только счётчик в _swallowed.
const _swallowed={};
function swallow(tag,e){
 if(_swallowed[tag]){_swallowed[tag]++;return;}
 _swallowed[tag]=1;
 if(typeof console!=='undefined'&&console.warn)console.warn('[Чернолесье] подавлено: '+tag+' \u2014 '+((e&&e.message)||e));
}
function safeNum(v,def){return Number.isFinite(v)?v:def;}
// PRNG для Daily Run. Обычные забеги (runSeed=0) используют Math.random напрямую.
// В Daily режиме runSeed !== 0 и каждое обращение к seedRandom() даёт
// воспроизводимое число, зависящее только от seed. Mulberry32 — компактный
// качественный PRNG, даёт равномерное распределение [0,1).
function seedRandom(){
 if(!runSeed)return Math.random();
 // мутируем prngState, НЕ runSeed.
 // runSeed — идентификатор забега (для Daily Streak проверок в endRun).
 // Если бы мутировали runSeed, в endRun сравнение runSeed===LS.num('cl_daily_seed',-1)
 // провалилось бы — runSeed стал бы огромным числом за время забега.
 prngState+=0x6D2B79F5;
 let t=prngState;
 t=Math.imul(t^(t>>>15),t|1);
 t^=t+Math.imul(t^(t>>>7),t|61);
 return((t^(t>>>14))>>>0)/4294967296;
}
// ВИЗУАЛЬНЫЙ PRNG: всегда Math.random, даже в Daily Run.
// Гарантирует что у двух Daily забегов одного дня будут:
// - ОДИНАКОВЫЙ геймплей (тип врага, крит, элита) — через seedRandom
// - РАЗНЫЙ визуал (частицы, моты, шейк) — через randomVisual
// Если использовать везде seedRandom, визуал будет «застывать» при replay.
function randomVisual(){return Math.random();}
// Local-calendar key for Daily: the challenge and streak now roll over at the
// player's local midnight rather than at UTC midnight.  Date.UTC avoids DST-length days.
function dailyDayAt(ms){const d=new Date(ms==null?Date.now():ms);return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000);}
function dailyDay(){return dailyDayAt(Date.now());}
const dist=(x,y)=>Math.hypot(x,y);
const dist2=(x,y)=>x*x+y*y; // быстрая версия без sqrt (для сравнений)
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
// prune — in-place фильтрация без выделения нового массива (swap-compact).
// Заменяет `.filter()` в горячем цикле update(): 6 фильтров × 60 FPS =
// 360 мусорных массивов/сек давили на GC (#12 аудита).
function prune(arr,keep){let w=0;for(let i=0;i<arr.length;i++){const v=arr[i];if(keep(v))arr[w++]=v;}arr.length=w;}

const LS={
 get(k,d){try{const v=localStorage.getItem(k);return v===null?d:v;}catch(e){return d;}},
 set(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}},
 num(k,d){const v=+LS.get(k,d);return isFinite(v)?v:d;},
 // setLater — запись вне кадра. localStorage.setItem синхронный и на холодном
 // профиле умеет блокировать поток на десятки миллисекунд. Внутри забега это
 // происходило на порогах достижений и на первой встрече с врагом, то есть
 // ровно там, где идёт серия убийств — рывок ловился рукой, но не попадал в
 // счётчик панели, потому что тот обнуляется каждые полсекунды.
 // Записи по одному ключу схлопываются: пишется последнее значение.
 _pend:null,
 setLater(k,v){
  if(!LS._pend){
   LS._pend=Object.create(null);
   const flush=()=>{const q=LS._pend;LS._pend=null;
    if(q)for(const key in q)LS.set(key,q[key]);};
   if(typeof requestIdleCallback==='function')requestIdleCallback(flush,{timeout:1200});
   else setTimeout(flush,0);
  }
  LS._pend[k]=v;
 }
};
// Незаписанное нельзя терять при закрытии вкладки.
try{addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden'&&LS._pend){
  const q=LS._pend;LS._pend=null;for(const key in q)LS.set(key,q[key]);}
});}catch(e){}
// v5.88: комментарий обещал, что старые сейвы «будут мигрированы (или сброшены)
// при следующем чтении». Миграции в коде НЕТ, и константа нигде не читается —
// это ловушка для будущего себя. Текст приведён к правде: механизм миграции
// проектировать вместе с первым ломающим изменением формата, тогда же и начать
// писать эту цифру в localStorage. Сейчас защита от битых сейвов другая:
// каждый JSON.parse обёрнут в try/catch с проверкой типа результата.
const SAVE_VERSION=3;   // не используется до появления миграции

