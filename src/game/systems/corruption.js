// ============================================================
//  v6.26 ПОРЧА ЧАЩИ (ступени сложности после победы)
//  Победа над Берсерком раньше заканчивала игру: дальше идти некуда.
//  Теперь каждая победа открывает следующую ступень Порчи — враги
//  крепче и злее, а рекорд по каждой ступени считается отдельно.
//  Это канон жанра (Ascension в Slay the Spire, Curse в Halls of Torment)
//  и единственный способ продлить жизнь проекта после первого прохождения.
//
//  Ступень умножает diffMul, который уже применяется к HP рядовых,
//  элиты, мини-боссов и финального босса — отдельная математика не нужна.
// ============================================================
const CORRUPTION_MAX=5;
const CORRUPTION_STEP=0.22;      // +22% HP врагов за ступень
let corruption=0;                // выбранная на титульнике
let corruptionUnlocked=0;        // максимум, доступный игроку
try{corruption=Math.max(0,Math.min(CORRUPTION_MAX,LS.num('cl_corr',0)));}catch(e){}
try{corruptionUnlocked=Math.max(0,Math.min(CORRUPTION_MAX,LS.num('cl_corr_max',0)));}catch(e){}
if(corruption>corruptionUnlocked)corruption=corruptionUnlocked;

function corruptionMul(){return 1+CORRUPTION_STEP*corruption;}
// Рекорд времени по каждой ступени отдельно: сравнивать забег на Порче 0
// и на Порче 5 бессмысленно.
function corrBestKey(n){return 'cl_corrbest_'+n;}
function corrBest(n){try{return LS.num(corrBestKey(n),0);}catch(e){return 0;}}
function setCorrBest(n,t){try{LS.set(corrBestKey(n),String(Math.round(t)));}catch(e){}}

let winStreak=LS.num('cl_wstreak',0);
let loseStreak=LS.num('cl_lstreak',0);
let currentBoon=null,currentClass=null,currentCurse=null;
// ЗАЩИТА ОТ ПОВТОРНОГО ПРИМЕНЕНИЯ ПАССИВКИ (окончательно, #5):
// старый флаг classApplied сбрасывался ПЕРЕД проверкой в resetRun — условие
// `!classApplied` было всегда true. А в экране выбора класса passive() висел на
// клике по карточке — каждый клик применял пассивку заново (Шаман ×1.4×1.4=×1.96
// areaMul, Воин ×1.3×1.3 HP и т.д.). Теперь запоминаем, к какому объекту P
// пассивка уже применена; P пересоздаётся в resetRun → ровно 1 пассивка на забег.
let appliedClassFor=null;
function applyClassPassive(id){
 if(!id)return;
 if(appliedClassFor===P)return;
 const c=CLASSES.find(x=>x.id===id);
 if(!c)return;
 c.passive();
 appliedClassFor=P;
 // warm up hero sprite frames so first battle frames are less likely to fall back
 if(currentClass) heroSpr(currentClass);
}
let theme=LS.get('cl_theme','forest');
let nightMode=false; // v6.23 (B3-ост): ночной режим из un6 «Ночной дозор» — визуально, без игровых штрафов
let warpOn=LS.get('cl_warp','1')==='1';
// ЗАЩИТА: после JSON.parse проверяем тип, иначе багнутый LS даст null/строку/число,
// что позже уронит stats.push() или сломает tree[branch].nodes.forEach()
let stats=[];try{const s=LS.get('cl_stats');if(s){const p=JSON.parse(s);if(Array.isArray(p))stats=p;}}catch(e){stats=[];}
let achData={unlocked:{},notified:{},progress:{}};try{const a=LS.get('cl_ach');if(a){const p=JSON.parse(a);if(p&&typeof p==='object'&&!Array.isArray(p))achData=Object.assign(achData,p);}}catch(e){swallow('save.ach',e);}

