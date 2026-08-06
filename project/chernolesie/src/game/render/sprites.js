// ============================================================
//  СПРАЙТЫ
// ============================================================
function pad(n){return String(n).padStart(2,'0');}
// v5.85: папки, для которых в EMB есть хотя бы один кадр.
const _EMB_DIRS=(()=>{const d=new Set();for(const k in EMB){const i=k.lastIndexOf('/');if(i>0)d.add(k.slice(0,i));}return d;})();
// v5.85: раньше отсутствующий в реестре кадр уходил в СЕТЕВОЙ запрос по
// относительному пути. В однофайловой сборке такого файла нет — получалось
// 58 запросов в 404 на каждую загрузку, а анимация мигала между спрайтом и
// силуэтом-заглушкой на всех недостающих кадрах (Водяной: просили 16, в файле 2;
// Древень и Стрыга: просили 16, в файле по 4).
// Теперь: если папка в реестре ЕСТЬ, а конкретного кадра нет — кадр просто
// пропускается, и цикл анимации крутит только реальные кадры. Если папки в
// реестре нет вовсе (работа с россыпью файлов при разработке) — поведение старое.
function frames(dir,pre,a,b){
 const r=[];const d=dir.replace('../','');const emb=_EMB_DIRS.has(d);
 for(let i=a;i<=b;i++){
  const _k=d+'/'+pre+pad(i)+'.png';
  if(emb&&!EMB[_k])continue;
  const im=new Image();im.onerror=()=>{im.broken=true;};
  im.src=EMB[_k]||encodeURI(dir+'/'+pre+pad(i)+'.png');
  r.push(im);
 }
 return r;
}

// v5.5 W: удалён мёртвый пакет Final Bogatyr (const HERO + heroImgs + imgs).
ETYPES.vodianik.frames=frames('Enemies/Vodianik_norm','f_',1,8);ETYPES.vodianik.atkFrames=frames('Enemies/Vodianik_norm','f_',9,10);ETYPES.vodianik.dieFrames=frames('Enemies/Vodianik_norm','f_',11,14);ETYPES.vodianik.atkDur=0.5;ETYPES.vodianik.dieMax=0.9;ETYPES.vodianik.frames.fps=9;ETYPES.leshiy.frames=frames('Enemies/Leshiy_norm','f_',1,8);ETYPES.leshiy.atkFrames=frames('Enemies/Leshiy_norm','f_',9,10);ETYPES.leshiy.dieFrames=frames('Enemies/Leshiy_norm','f_',11,14);ETYPES.leshiy.atkDur=0.5;ETYPES.leshiy.dieMax=0.9;ETYPES.leshiy.frames.fps=9;ETYPES.leshiy.frames.blend=0.3;ETYPES.leshiy.drawH=60; // v5.49: живые сучья; v6.16: blend 0.3→0.2, чтобы убрать мерцание кадров лешего
ETYPES.rusalka.frames=frames('Enemies/Rusalka_norm','f_',1,8);ETYPES.rusalka.atkFrames=frames('Enemies/Rusalka_norm','f_',9,10);ETYPES.rusalka.dieFrames=frames('Enemies/Rusalka_norm','f_',11,14);ETYPES.rusalka.atkDur=0.5;ETYPES.rusalka.dieMax=0.9;ETYPES.rusalka.drawH=66;
ETYPES.upyr.frames=frames('Enemies/Upyr_norm','f_',1,8);ETYPES.upyr.atkFrames=frames('Enemies/Upyr_norm','f_',9,10);ETYPES.upyr.dieFrames=frames('Enemies/Upyr_norm','f_',11,14);ETYPES.upyr.atkDur=0.5;ETYPES.upyr.dieMax=0.9;ETYPES.upyr.drawH=106;
ETYPES.vodyanoy.frames=frames('Enemies/Vodyanoy_norm','f_',1,16);
// v6.72: ЗМЕЙ ГОРЫНЫЧ — финальный босс. Арт сгенерирован (2 кадра дыхания),
// вырезан с белого фона, встроен как base64 webp. pingpong даёт «дыхание».
(function(){
 const _mk=(b64)=>{const im=new Image();im.src='data:image/webp;base64,'+b64;return im;};
 const DRAGON_FRAMES=[_mk('@@B:art/sprites/dragon-frames.webp@@'),_mk('@@B:art/sprites/grlbjsaaaaaaa.webp@@')];
 DRAGON_FRAMES.pingpong=true;DRAGON_FRAMES.fps=2.2;
 ETYPES.dragon=Object.assign({},ETYPES.upyr,{
  hp:2600,spd:44,r:46,dmg:22,drawH:210,ai:'tank',dmgMod:1.5,
  col:'#3e3a2c',eye:'#ffb347',size:1.9,weak:'frost',
  frames:DRAGON_FRAMES
 });
 ETYPES.dragon.frames.pingpong=true;ETYPES.dragon.frames.fps=2.2;
})();ETYPES.vodyanoy.frames.pingpong=true;ETYPES.vodyanoy.frames.fps=2.5;ETYPES.vodyanoy.drawH=100;

ETYPES.baba_yaga.frames=frames('Enemies/BabaYaga_norm','f_',1,16);ETYPES.baba_yaga.drawH=146;
// Атака и смерть Древня — отдельные НЕзацикленные наборы кадров
// v5.85: раньше здесь было frames('../Enemies/Treant_norm','f_',13,24) — папки
// Treant_norm в реестре НЕТ ВООБЩЕ, все 12 кадров уходили в 404. Мини-босс
// «Древень» рисуется спрайтами BabaYaga_norm, и на время атаки и смерти
// drawBeastFrame получал только битые картинки: спрайт пропадал, телеграф
// атаки был не виден. Пока отдельного арта атаки/смерти нет — переиспользуем
// кадры ходьбы: анимация не отличается, но мини-босс хотя бы видим.
const TREANT_ATK=ETYPES.baba_yaga.frames;
const TREANT_DIE=ETYPES.baba_yaga.frames;
ETYPES.naviya.frames=frames('Enemies/Naviya_norm','f_',1,16);ETYPES.naviya.drawH=128;
ETYPES.volkolak.frames=frames('Enemies/Volkolak_norm','f_',1,8);ETYPES.volkolak.atkFrames=frames('Enemies/Volkolak_norm','f_',9,10);ETYPES.volkolak.dieFrames=frames('Enemies/Volkolak_norm','f_',11,14);ETYPES.volkolak.atkDur=0.5;ETYPES.volkolak.dieMax=0.9;ETYPES.volkolak.drawH=58;
ETYPES.kikimora.frames=frames('Enemies/Kikimora_norm','f_',1,8);ETYPES.kikimora.atkFrames=frames('Enemies/Kikimora_norm','f_',9,10);ETYPES.kikimora.dieFrames=frames('Enemies/Kikimora_norm','f_',11,14);ETYPES.kikimora.atkDur=0.5;ETYPES.kikimora.dieMax=0.9;ETYPES.kikimora.drawH=72;
ETYPES.poludnitsa.frames=frames('Enemies/Poludnitsa_norm','f_',1,8);ETYPES.poludnitsa.atkFrames=frames('Enemies/Poludnitsa_norm','f_',9,10);ETYPES.poludnitsa.dieFrames=frames('Enemies/Poludnitsa_norm','f_',11,14);ETYPES.poludnitsa.atkDur=0.5;ETYPES.poludnitsa.dieMax=0.9;ETYPES.poludnitsa.drawH=74;
ETYPES.volkolak.frames.fps=9;
ETYPES.kikimora.frames.fps=9;
ETYPES.rusalka.frames.fps=9;
ETYPES.upyr.frames.fps=9;
ETYPES.baba_yaga.frames.pingpong=true;ETYPES.baba_yaga.frames.fps=1.75;
ETYPES.naviya.frames.pingpong=true;ETYPES.naviya.frames.fps=2;
ETYPES.poludnitsa.frames.fps=9;
// v5.85: то же для «Стрыги» — папки Mglist_norm в реестре нет, 8 кадров в 404.
// Рисуется спрайтами Naviya_norm, поэтому атака и смерть берут их же кадры.
const MGLIST_ATK=ETYPES.naviya.frames;
const MGLIST_DIE=ETYPES.naviya.frames;
ETYPES.bognik.frames=frames('Enemies/Bognik_norm','f_',1,8);ETYPES.bognik.atkFrames=frames('Enemies/Bognik_norm','f_',9,10);ETYPES.bognik.dieFrames=frames('Enemies/Bognik_norm','f_',11,14);ETYPES.bognik.atkDur=0.5;ETYPES.bognik.dieMax=0.9;ETYPES.bognik.frames.fps=9;ETYPES.bognik.drawH=88;
// v5.49: Ведьма Топи (фиолет-отрава) + Чащобный Хозяин (янтарь-обугло).
// Основа — 2 кадра пинг-понг; наборы атаки/смерти уже навешаны на тип врага
// (загорятся, когда появятся ai-триггеры atkT/dying — механика drawBeastFrame общая).
ETYPES.vedmaT.frames=frames('Enemies/VedmaT_norm','f_',1,8);ETYPES.vedmaT.atkFrames=frames('Enemies/VedmaT_norm','f_',9,10);ETYPES.vedmaT.dieFrames=frames('Enemies/VedmaT_norm','f_',11,14);ETYPES.vedmaT.atkDur=0.5;ETYPES.vedmaT.dieMax=0.9;ETYPES.vedmaT.frames.fps=9;ETYPES.vedmaT.drawH=110;
ETYPES.chashob.frames=frames('Enemies/Chashob_norm','f_',1,16);ETYPES.chashob.frames.pingpong=true;ETYPES.chashob.frames.fps=2;ETYPES.chashob.drawH=150;
const VEDMAT_ATK=frames('Enemies/VedmaT_norm','f_',9,10);const VEDMAT_DIE=frames('Enemies/VedmaT_norm','f_',11,14);
const CHASHOB_ATK=frames('Enemies/Chashob_norm','f_',3,7);const CHASHOB_DIE=frames('Enemies/Chashob_norm','f_',14,16);
ETYPES.vedmaT.atkFrames=VEDMAT_ATK;ETYPES.vedmaT.dieFrames=VEDMAT_DIE;ETYPES.vedmaT.atkDur=0.9;ETYPES.vedmaT.dieMax=1.1;
ETYPES.chashob.atkFrames=CHASHOB_ATK;ETYPES.chashob.dieFrames=CHASHOB_DIE;ETYPES.chashob.atkDur=0.9;ETYPES.chashob.dieMax=1.2;
// ГЛЮК АНИМАЦИИ ЭЛИТЫ/БОССА (жалоба): жёсткий цикл %N рвался на шве
// (8-ой кадр → 1-ый резко) и туша «дёргалась». Лечится пинг-понг воспроизведением:
// 1..8..1 — шва нет вообще, покачивание читается естественно. И чуть медленнее.


ETYPES.naviya.frames.pingpong=true;

// v6.10 ПРИЧИНА ДЁРГАНЫХ ВРАГОВ. Скорость и реакции писались в `e.frames` — а это
// ОБЩИЙ массив кадров из ETYPES, один на весь тип врага. Значение перезаписывал
// каждый враг по очереди, и до отрисовки доживало то, что оставил ПОСЛЕДНИЙ
// обработанный: все лешие на экране получали скорость одного случайного лешего,
// и она менялась каждый кадр вместе с порядком в пуле.
// Пока от этого зависел только наклон силуэта, дефект был почти незаметен. Но в
// v6.5 я привязал к этой же величине ЧАСТОТУ АНИМАЦИИ — и получилось худшее:
// если последним оказывался стоящий враг, темп всей толпы падал вдвое, если
// бегущий — подскакивал до 18 к/с. Частота скакала каждый кадр, и цикл из восьми
// кадров читался как дёрганая петля из двух. Симптом ровно тот, что описан.
// Теперь всё живёт на самом враге и передаётся в отрисовку явным аргументом.
function updateEnemyAnimMeta(e) {
 if (!e.frames) return;
 // v6.16: множитель 60 предполагал, что функция зовётся ровно 60 раз в секунду.
 // Но зовётся она из ОТРИСОВКИ, а она идёт с частотой дисплея: на твоём телефоне
 // это 120 Гц (профайлер показывал FPS 120). Значит сдвиг за кадр вдвое меньше,
 // и «скорость» выходила вдвое ниже настоящей — а с v6.5 от неё зависит темп
 // анимации. Итог: у всех врагов анимация шла в ДВА РАЗА медленнее задуманной,
 // 5-9 к/с вместо 10-18. Это и есть остаток «дёрганости» после v6.10.
 // Берём реальное время кадра, которое draw() уже считает для камеры.
 const _adt=(typeof _drawDt==='number'&&_drawDt>0.0005)?_drawDt:1/60;
 if (e._lx !== undefined) {
  const rawVx=(e.x-e._lx)/_adt, rawVy=(e.y-e._ly)/_adt;
  // v6.16: сглаживание _evx/_evy — без него резкие изменения скорости врага
  // давали скачки FPS анимации (через drawSprite->_spd), что читалось как дерганье/мерцание.
  e._evx=(e._evx||0)*0.7+rawVx*0.3;
  e._evy=(e._evy||0)*0.7+rawVy*0.3;
 } else { e._evx=0; e._evy=0; }
 e._lx = e.x; e._ly = e.y;
 // v5.73: было `e.hitT || e.hit` — hitT это КУЛДАУН АТАКИ ВРАГА, а не факт получения
 // урона. Спрайт дёргался, когда враг БЬЁТ, и почти не дёргался, когда бьют ЕГО:
 // e.hit (0.22с) перебивался единицей hitT (1.2с) почти всегда. Игрок бил в вату.
 // Теперь реакция читается только из e.hit — его ставит hitEnemy() на попадании.
 // v6.10: то же с реакциями — вспышку боли одного врага показывали ВСЕ враги его
 // типа, а свою собственную он мог не показать.
 e._ehurt = e.hit || 0;
 e._eatk = e.atkT || 0;
}
// v7.36 КОПИЯ КАДРА ПОД НУЖНЫЙ РОСТ.
//
//  Тот же приём, которым в v5.29 запекли тайлы земли, а в v5.99 — свечение
//  гемов: считаем один раз, дальше только blit. Рост округляется до 4 px, чтобы
//  копий было немного: у врага рост меняется от размера и предсмертного сжатия,
//  и без корзин кэш рос бы на каждое дробное значение.
//  Хранится копия прямо на самой картинке (img._sc), поэтому живёт ровно
//  столько же, сколько кадр, и чистить отдельно нечего.
let _scN=0;                       // сколько копий уже заведено
const _SC_MAX=160;                // потолок: дальше рисуем из исходника
function _fitSpr(img,h){
 // ЛЮБАЯ неудача здесь возвращает исходную картинку. Это важнее экономии:
 // первая версия отдавала холст, не проверяя, что он получился, и на телефоне
 // с плотной памятью выделение падало. Холст нулевого размера в drawImage
 // БРОСАЕТ исключение, а вся отрисовка обёрнута в try/catch в цикле кадра —
 // поэтому вместо просадки владелец получил пустой экран. В headless памяти
 // вдоволь, и воспроизвести это у себя я не мог.
 try{
  const nw=img.naturalWidth,nh=img.naturalHeight;
  if(!nw||!nh||!isFinite(h)||h<=0)return img;
  const hb=Math.max(8,Math.round(h/4)*4);
  // Копия оправдана только при заметном уменьшении. Если кадр и так почти
  // нужного роста, выигрыша нет, а холст в памяти появится.
  if(nh<hb*1.4)return img;
  const c=img._sc||(img._sc={});
  const cv0=c[hb];
  if(cv0)return cv0;
  if(_scN>=_SC_MAX)return img;
  const w=Math.max(1,Math.round(hb*nw/nh));
  const cv=document.createElement('canvas');cv.width=w;cv.height=hb;
  if(cv.width<1||cv.height<1)return img;          // выделение не удалось
  const g=cv.getContext('2d');
  if(!g)return img;
  g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
  g.drawImage(img,0,0,w,hb);
  c[hb]=cv;_scN++;
  return cv;
 }catch(e){return img;}
}
function drawSprite(fr,x,y,h,flip,t,st){   // v6.10: st — состояние КОНКРЕТНОГО врага
 if(!fr||!fr.length)return false;
 // v6.5: ГЛАВНАЯ ПРИЧИНА «как будто 15 кадров». Профайлер показал 60 FPS, jank 0 и
 // 2.7 мс на кадр из 16.7 — движок не при чём. Но САМИ АНИМАЦИИ шли на 9 к/с:
 // Волколак, Кикимора, Русалка, Упырь, Полуденница — у всех frames.fps=9. Игрок
 // смотрит на врагов, они меняют позу 9 раз в секунду, и глаз читает именно это.
 // Просто поднять fps нельзя: цикл ходьбы из 8 кадров при 9 к/с длится 0.89 с, и
 // если ускорить его вслепую, все начнут семенить. Правильно — привязать темп к
 // фактической скорости: Русалка (180 px/с) должна перебирать ногами вдвое чаще
 // Лешего (95), а Чащобный Хозяин (46) — вдвое реже. Это заодно убирает скольжение
 // ног, из-за которого быстрые враги выглядели катящимися по земле.
 // Опорная точка выведена из длины шага, а не на глаз: цикл из 8 кадров содержит
 // два шага, шаг при drawH≈100 это ~28 px, то есть цикл покрывает ~56 px пути.
 // Отсюда честный темп для Лешего (95 px/с) = 8*95/56 ≈ 13.6 к/с. Беру опорную 80,
 // что даёт ему 10.7 — чуть консервативнее расчёта, потому что уникальных кадров
 // всего 8, и на 14 к/с цикл повторяется слишком часто и начинает мельтешить.
 // _evx/_evy уже считает updateEnemyAnimMeta, отдельных данных не нужно.
 // Замедление от заморозки и яда попадает сюда само — анимация тоже замедлится.
 let _fps=fr.fps||9;
 if(st&&st._evx!==undefined&&!fr.pingpong){
  // v6.16: low-pass на _evx/_evy — без него даже крошечные скачки скорости давали скачки FPS,
  // что читалось как дерганье/мерцание анимации.
  const _rawSp=Math.hypot(st._evx||0,st._evy||0);
  const _smoothSp=st._smoothSp!=null?(st._smoothSp*0.82+_rawSp*0.18):_rawSp;
  st._smoothSp=_smoothSp;
  const _sp=_smoothSp;
   // v7.37 ПЛАВНОСТЬ АНИМАЦИЙ: расширен потолок до 26 кадров/с, а пол при движении — до 10,
   // чтобы идущие юниты не меняли позу ступенчато на 6-9 Гц, вызывая иллюзию лагов.
   _fps=_sp>5?Math.max(10,Math.min(26,_fps*_sp/65)):_fps*0.5;
  // v6.17: _prevFps лежал на fr — а fr это ОБЩИЙ объект ETYPES[type].frames,
  // один на всех врагов типа. Каждый леший перетирал сглаживание соседа, и чем
  // больше лешаков на экране, тем сильнее дёргались все. Храним на самом враге.
  _fps=st._prevFps!=null?st._prevFps*0.85+_fps*0.15:_fps;
  st._prevFps=_fps;
 }
 // v6.10: СМЕШИВАНИЕ КАДРОВ. У трёх врагов кадров почти нет: у Водяного их ВСЕГО
 // ДВА (в файле есть только f_01 и f_02) при темпе 2.5 к/с, у Древня и Стрыги по
 // четыре при 1.75-2 к/с. Это буквально двухкадровая петля с подменой картинки
 // раз в 400 мс — ровно то, что видно как дёрганость. Нового арта для них нет,
 // поэтому смягчаем переход: подмешиваем следующий кадр в конце позы, как сделано
 // для стойки героя. Окно тем шире, чем меньше кадров: при двух позах переход
 // почти непрерывный и читается как плавное покачивание, при восьми — узкий,
 // иначе у бегущего врага двоятся ноги.
 const _seqLen=(fr.pingpong&&fr.length>1)?(fr.length*2-2):fr.length;
 // v6.17: КОРЕНЬ ДЁРГАНЬЯ. Было _pos=t*_fps при _fps, который пересчитывается
 // КАЖДЫЙ кадр от скорости врага. Умножение переменного fps на растущее t даёт
 // скачок фазы = t*Δfps: при t=10с и изменении fps всего на 1% спрайт прыгает на
 // целый кадр. Все фиксы v6.16 давили Δfps, но ошибка всё равно умножалась на t.
 // Правильно — интегрировать фазу: за кадр она растёт ровно на _fps*dt, и любое
 // изменение fps меняет только СКОРОСТЬ проигрывания, а не позицию в цикле.
 const _pdt=(typeof _drawDt==='number'&&_drawDt>0.0005&&_drawDt<0.25)?_drawDt:1/60;
 if(st){
  if(st._animPh==null||!isFinite(st._animPh))st._animPh=(t||0)*_fps;
  st._animPh+=_fps*_pdt;
  if(st._animPh>1e6)st._animPh%=_seqLen;
 }
 const _pos=st?st._animPh:t*_fps;
 const _idx=(k)=>{
  if(fr.pingpong&&fr.length>1){const n=fr.length,ph=((k%_seqLen)+_seqLen)%_seqLen;return ph<n?ph:2*n-2-ph;}
  return ((k%fr.length)+fr.length)%fr.length;
 };
 const _k0=Math.floor(_pos);
 const _fi=_idx(_k0);
 const img=fr[_fi];
 if(!img||!img.complete||img.broken||!img.naturalWidth||!img.naturalHeight)return false;
 const _bw=fr.blend!=null?fr.blend:(fr.length<=2?0.95:(fr.length<=4?0.7:0.3));
 let _bl=0,_imgB=null;
 if(_bw>0){
  const _frac=_pos-_k0;
  if(_frac>1-_bw){
   const cand=fr[_idx(_k0+1)];
   if(cand&&cand.complete&&!cand.broken&&cand.naturalWidth){
    const u=(_frac-(1-_bw))/_bw;
    _bl=u*u*(3-2*u);_imgB=cand;
   }
  }
 }
 const w=h*img.naturalWidth/img.naturalHeight;
  // v7.37: покачивание спрайта по реальному времени отрисовки для гладкой анимации
  const _time=performance.now()*0.001;
 const _spd=st?(Math.abs(st._evx||0)+Math.abs(st._evy||0)):0;
 const _isMoving=_spd>5;const _hurt=(st&&st._ehurt)||0;const _atk=(st&&st._eatk)||0;
 let bobY=0,tiltDeg=0,sX=1,sY=1;
 if(_hurt>0){const hk=Math.min(1,_hurt*5);tiltDeg=-12*hk;sX=1+0.1*hk;sY=1-0.08*hk;}
 else if(_isMoving){const wc=_time*6;bobY=Math.sin(wc)*0.8;tiltDeg=Math.sin(wc)*1.5;sX=1+Math.sin(wc*2)*0.01;sY=1-Math.sin(wc*2)*0.008;}
 else{const ic=_time*4.4;bobY=Math.sin(ic)*0.7;sY=1+Math.sin(ic)*0.007;sX=1-Math.sin(ic)*0.005;}
 if(_atk>0){const ak=Math.min(1,_atk*4);tiltDeg+=18*ak;sX*=1+0.06*ak;}
 ctx.save();ctx.translate(x,y+bobY);if(flip)ctx.scale(-1,1);
 ctx.rotate(tiltDeg*Math.PI/180);ctx.scale(sX,sY);
 // v7.36: рисуем не из исходника, а из копии, ужатой под нужный рост ОДИН раз.
 // Кадры врагов лежат в 256x256 и 320x320, а рисуются высотой 60-96 px — то есть
 // на каждого врага каждый кадр шло уменьшение втрое с фильтрацией. Это самая
 // дорогая форма drawImage, и вся её стоимость сидит в растеризации, мимо
 // хронометра: в JS вызов мгновенный. При трёх сотнях врагов это триста
 // фильтрованных уменьшений крупной текстуры за кадр.
 // Побочно уходит и мерцание: спрайт больше не пересэмплируется заново каждый
 // кадр под чуть иной дробный размер, а всегда берётся из готовой копии.
 const _a=_fitSpr(img,h), _wa=_a.width, _ha=_a.height;
 if(_bl>0&&_imgB){
  const _b=_fitSpr(_imgB,h);
  ctx.globalAlpha=1-_bl;ctx.drawImage(_a,-_wa/2,-_ha*0.82,_wa,_ha);
  ctx.globalAlpha=_bl;ctx.drawImage(_b,-_b.width/2,-_b.height*0.82,_b.width,_b.height);
  ctx.globalAlpha=1;
 } else ctx.drawImage(_a,-_wa/2,-_ha*0.82,_wa,_ha);
 // v8.4: source-atop убран для сохранения 60 FPS (вспышка удара через аппаратный lighter)
 ctx.restore();return true;
}
// Рисует один конкретный кадр (для незацикленных анимаций Древня)
function drawFrameImg(im,x,y,h,flip){
 if(!im||!im.complete||im.broken||!im.naturalWidth||!im.naturalHeight)return false;
 const w=h*im.naturalWidth/im.naturalHeight;
 ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(im,-w/2,-h*0.82,w,h);ctx.restore();return true;
}
// «Звери» (Древень, Стрыга): выбор кадра по состоянию — смерть (проигрывается
// один раз, затушевка в конце) → атака (по прогрессу atkT) → цикл ходьбы.
// Наборы кадров и длительности лежат на самом враге: e.atkFrames/e.dieFrames/
// e.atkDur/e.dieMax — так одна функция обслуживает обоих мини-боссов.
// y уже сдвинута на якорь ног (вызывающий код передаёт y+e.r*0.3).
function drawBeastFrame(e,x,y,flip){
 const dieMax=e.dieMax||1.25;
 if(e.dying>0){
  const D=e.dieFrames,T=Math.min(dieMax,dieMax-e.dying),fi=Math.min(D.length-1,Math.floor(T/dieMax*D.length));
  if(e.dying<0.35){
   ctx.save();ctx.globalAlpha=Math.max(0,e.dying/0.35);
   const ok=drawFrameImg(D[fi],x,y,e.drawH,flip);
   ctx.restore();return ok;
  }
  return drawFrameImg(D[fi],x,y,e.drawH,flip);
 }
 if(e.atkT>0){
  const A=e.atkFrames,ad=e.atkDur||0.85,T=Math.min(ad,ad-e.atkT),fi=Math.min(A.length-1,Math.floor(T/ad*A.length));
  return drawFrameImg(A[fi],x,y,e.drawH,flip);
 }
 return drawSprite(e.frames,x,y,e.drawH,flip,e.at||0,e);
}
// v7.36: тень печётся один раз, дальше — один blit вместо пяти операций.
//
//  Было: save + два залитых эллипса (каждый со своим beginPath) + restore, то
//  есть пять вызовов холста НА КАЖДОГО врага. При трёхстах врагах — полторы
//  тысячи операций за кадр только на тени, и обе заливки ещё и с прозрачностью.
//  Форма и плотность сохранены точно: те же два эллипса с alpha .42 и .22,
//  просто нарисованные заранее в маленький холст 128x44.
const _shCv=(function(){
 const c=document.createElement('canvas');c.width=128;c.height=44;
 const g=c.getContext('2d');
 const cx=64,cy=22,w=128/2.7;   // внешний эллипс шире внутреннего в 1.35 раза
 g.globalAlpha=.22;g.fillStyle='#000';
 g.beginPath();g.ellipse(cx,cy,w*1.35,w*0.46,0,0,7);g.fill();
 g.globalAlpha=.42;
 g.beginPath();g.ellipse(cx,cy,w,w*0.34,0,0,7);g.fill();
 return c;
})();
function shadow(x,y,w){
 const dw=w*2.7,dh=dw*44/128;
 ctx.drawImage(_shCv,x-dw/2,y-dh/2,dw,dh);
}

