const UI={
 hp:document.getElementById('hp'),
 hpLow:document.getElementById('hp').classList,
 hpText:document.getElementById('hptext'),
 hpNum:document.getElementById('hpnum'),
 lowHpVignette:document.getElementById('lowHpVignette'),
 regenPulse:document.getElementById('regenPulse'),
 xpFill:document.getElementById('xpfill'),
 timeEl:document.getElementById('time'),
 lvlEl:document.getElementById('lvl'),
 killsEl:document.getElementById('kills'),
 goldEl:document.getElementById('gold'),
 weaponsEl:document.getElementById('weapons'),
 bossBar:document.getElementById('bossbar'),
 bosshp:document.getElementById('bosshp'),
 bosseft:document.getElementById('bosseft'),
 bosstimer:document.getElementById('bosstimer'),
 classdisp:document.getElementById('classdisp'),
 // добавлены ссылки на часто-используемые в update() элементы
 regen:document.getElementById('regenPulse'),
 bossBar2:document.getElementById('bossbar'),
 pauseov:document.getElementById('pauseov'),
 tbtnSpecial:document.getElementById('tbtnSpecial'),
 tbtnSpecIcon:document.getElementById('tbtnSpecIcon'),
 tbtnSpecCharge:document.getElementById('tbtnSpecCharge'),
 ultA:document.getElementById('tbtnUltA'),
 ultB:document.getElementById('tbtnUltB'),
 spechud:document.getElementById('spechud'),
 speclabel:document.getElementById('speclabel'),
 specicon:document.getElementById('specicon'),
 specfill:document.getElementById('specfill'),
 lowHpV:document.getElementById('lowHpVignette')
};
// СИНХРОНИЗАЦИЯ UI С LS: ползунки/селекты в HTML имеют дефолтные значения
// (vol=35, mus=25, theme=forest), но в LS могут быть другие. Без синхронизации
// игрок поставил громкость 100, обновил страницу — играет громко, а ползунок
// стоит на 35. Случайный клик — звук резко прыгает.
document.getElementById('vol').value=LS.num('cl_vol',35);
document.getElementById('mus').value=LS.num('cl_mus',25);
document.getElementById('theme').value=theme;
document.getElementById('warp').value=warpOn?'1':'0';
document.getElementById('qpart').value=partTarget===1.0?'2':(partTarget===0.3?'0':'1');
// v6.23: селект вибро тоже поднимается из LS, иначе после выключения
// он на следующем заходе снова показывает «Вкл» при фактически выключенной вибрации
if(_vibSel)_vibSel.value=vibeOn?'1':'0';
// v5.94: fpscap был единственным селектом без синхронизации, и в разметке у него
// стояло selected на «60», тогда как движок держит fpsCap=0 (кап выключен в v5.29:
// гонка 16.67ms против vsync дёргала кадры). Игрок видел в настройках 60, а работало
// ∞. Хуже: браузер при soft-reload восстанавливает состояние формы БЕЗ события
// change — селект показывал одно, переменная держала другое. Явная синхронизация
// закрывает оба случая.
document.getElementById('fpscap').value=String(fpsCap);

// ============================================================
//  UPDATE — игровая логика
// ============================================================
// v5.68: кеш ссылок на DOM. В игровом шаге было 14 поисков по дереву на кадр
// (bossbar, bosshp, bossname, bossphase, tutorial) — при 60 fps это 840 обращений
// в секунду за пятью статическими элементами разметки.
const _EL=new Map();
function EL(id){
 let e=_EL.get(id);
 if(e===undefined){e=document.getElementById(id);_EL.set(id,e);}
 return e;
}
// =====================================================================
// ИГРОВОЙ ШАГ. Раньше update() был одной функцией на 645 строк: ввод,
// движение, спавн, оружие, враги, подбор, уровни и HUD в одном теле.
// Три бага v5.62-v5.63 — взгляд только вправо, удар по кулдауну,
// ходьба на месте — сидели именно здесь и были невидимы из-за размера.
// Резка механическая: порядок вызовов сохранён один к одному, тела
// секций перенесены дословно. Перекрёстных локальных переменных между
// секциями нет — проверено разбором областей видимости.
// =====================================================================
