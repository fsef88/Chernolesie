function spawn(forceDistant){
 // Истинный центр видимого экрана
 const cx=cam.x+W/2;
 const cy=cam.y+H/2;
 // Распределение типов. seedRandom для Daily → репродуцируемая последовательность мобов.
  // v5.41 (Б1): Волколак был МЁРТВ — его ветка стояла после rusalka и получала
 // окно 0.50-0.52 = 2% (probe_audit: 2.0% на 20000 попыток). Теперь порог rusalka
 // динамический: до 2:00 распределение старое (14%), после — rusalka 8%, окно
 // 0.44-0.52 (8%) отдано Волколаку. Остальные доли не тронуты.
 const type=pickEnemyType(time);          // v5.65: веса из SPAWN_TABLE
 const e=ETYPES[type];
 if(!e)return;
 let sx=0,sy=0,valid=false;
 // До 10 попыток найти точку: внутри мира [0..WORLD] И снаружи прямоугольника камеры.
 for(let i=0;i<10;i++){
  // srnd: позиции спавна — геймплей, в Daily должны быть воспроизводимы
  const a=spawnSideBias>=0?([0,Math.PI/2,Math.PI,-Math.PI/2][spawnSideBias]+srnd(-0.5,0.5)):srnd(0,TAU); // v5.47: волна знамения
  // v6.12 ГЛАВНАЯ ПРИЧИНА ПУСТОГО ПОЛЯ. Точка спавна бралась на КРУГЕ радиусом
  // max(W,H)/2+запас. Экран телефона в портрете 515×1144, то есть круг радиусом 822:
  // сверху и снизу враг появлялся сразу за кромкой (572+250), а слева и справа —
  // в 822 при половине ширины 258, то есть на 564 px дальше, чем нужно. При скорости
  // 95 px/с это лишние ШЕСТЬ СЕКУНД пути, и всё это время фланги пустые. Отсюда
  // и ощущение, что толпы нет: враги шли только сверху и снизу.
  // Правильно — эллипс по форме экрана: одинаковый зазор со всех сторон.
  const pad=srnd(100,250)+(forceDistant?srnd(400,700):0);
  const rx=W/2+pad, ry=H/2+pad;
  sx=cx+Math.cos(a)*rx;
  sy=cy+Math.sin(a)*ry;
  // 1) внутри мира
  if(sx>=0&&sx<=WORLD&&sy>=0&&sy<=WORLD){
   // 2) СТРОГО за пределами прямоугольника камеры (с запасом 50px)
   if(sx<cam.x-50||sx>cam.x+W+50||sy<cam.y-50||sy>cam.y+H+50){
    valid=true;break;
   }
  }
 }
 // Если игрок зажат в углу карты и свободного места за экраном нет — отменяем спавн
 if(!valid)return;
 spawnAt(type,sx,sy);
}
// v6.22: одиночный спавн в ЗАДАННУЮ точку. Вынесен из spawn(), чтобы формации
// волн могли ставить врагов по геометрии (стена, кольцо), а не по случайному углу.
function spawnAt(type,sx,sy){
 const e=ETYPES[type];
 if(!e)return false;
 if(!(sx>=0&&sx<=WORLD&&sy>=0&&sy<=WORLD))return false;
 let aliveN=0;for(let i=0;i<enemies.length;i++){const en=enemies[i];if(en.alive&&en.hp>0&&!en.boss&&!en.mini)aliveN++;}
 if(aliveN>=MAX_ENEMIES)return false;
 const hpMul=enemyHpMul(time,diffMul);
 const safeHp=isFinite(e.hp*hpMul)&&e.hp*hpMul>0?e.hp*hpMul:5;
 acquireEnemy({...e,x:sx,y:sy,hp:safeHp,maxhp:safeHp,type,flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,zigzag:srnd(0,TAU),zigzagT:0,ai:e.ai,dmgMod:e.dmgMod,fireT:0,spawnT:0.3,warnT:0.3,frames:e.frames,drawH:e.drawH,weak:e.weak,col:e.col,eye:e.eye,size:e.size,xp:e.xp,r:e.r,spd:e.spd,dmg:e.dmg});
 return true;
}
// =====================================================================
// v6.22 ФОРМАЦИИ ВОЛН
// Обычный поток ставит врагов по случайному углу эллипса — получается
// равномерный дождь, из которого толпа не читается. Раз в ~35 с приходит
// формация: стена с одного края, смыкающееся кольцо или плотный поток.
// Экран заливается за раз, и одна атака сносит десяток — это и есть «мясо».
// =====================================================================
let formCd=26,form=null;   // v6.56: первая плотная формация приходит раньше
function formationSize(){
 const d=(typeof directorP!=='undefined'?directorP:1);
 const dirBoost=1+Math.max(0,d-1)*0.45; // v6.59: если игроку легко — волна чуть плотнее
 return Math.round((35+Math.floor(time/60)*8)*Math.min(2.5,viewDensityMul())*dirBoost); // v7.7 плотные формации
}
function startFormation(){
 // v6.59: формации — главный ритм survivor-жанра. Обычный спавн даёт фон,
 // а эти паттерны создают читаемые ситуации: стена, кольцо, поток, зажим, стая.
 const kinds=time<45?['wall','stream','pincer','pack']:['wall','ring','stream','pincer','pack'];
 const kind=kinds[Math.min(kinds.length-1,Math.floor(srnd(0,kinds.length)))];
 let type=pickEnemyType(time);
 if(kind==='pack')type=time<55?'leshiy':(srnd(0,1)<0.55?'rusalka':'volkolak');
 runFormation(kind,type,formationSize(),null);
}
// v7.30: геометрия вынесена из startFormation(). Случайная волна и волна из
// расписания строятся одним кодом, отличается только КТО решает kind/type/n.
// announce: null — стандартная реплика формации, строка — своя, '' — молча.
function runFormation(kind,type,n,announce){
 if(!ETYPES[type])return;
 const a=srnd(0,TAU);
 const cx=cam.x+W/2,cy=cam.y+H/2;
 const say=(def,col)=>{const s=(announce===null||announce===undefined)?def:announce;if(s)log(s,col||'gold');};
 if(kind==='ring'){
  // кольцо по эллипсу экрана: смыкается со всех сторон разом
  const rx=W/2+200,ry=H/2+200;
  let ok=0;
  for(let i=0;i<n;i++){
   const t=a+i/n*TAU;
   if(spawnAt(type,cx+Math.cos(t)*rx,cy+Math.sin(t)*ry))ok++;
  }
  if(ok>4){say('⟳ Кольцо смыкается');vibe(60);flashScreen('#ffcf6a',0.3);}
 }else if(kind==='wall'){
  // стена: одна линия поперёк направления a, второй ряд со смещением
  const R=Math.max(W,H)*0.6+150;
  const ox=Math.cos(a),oy=Math.sin(a),qx=-oy,qy=ox;
  const span=Math.max(W,H)*1.15;
  let ok=0;
  for(let i=0;i<n;i++){
   const u=(i/Math.max(1,n-1)-0.5)*span;
   const row=(i%2)*80;
   if(spawnAt(type,cx+ox*(R+row)+qx*u,cy+oy*(R+row)+qy*u))ok++;
  }
  if(ok>4){say('▮ Стена идёт');vibe(60);flashScreen('#ff6a6a',0.3);}
 }else if(kind==='pincer'){
  // зажим с двух сторон: игроку надо выбрать щель, а не просто идти по кругу
  const R=Math.max(W,H)*0.58+150;
  const ox=Math.cos(a),oy=Math.sin(a),qx=-oy,qy=ox;
  const span=Math.max(W,H)*0.72;
  let ok=0;
  const half=Math.max(4,Math.floor(n/2));
  for(let side=0;side<2;side++){
   const sx=side? -ox:ox, sy=side? -oy:oy;
   for(let i=0;i<half;i++){
    const u=(i/Math.max(1,half-1)-0.5)*span;
    const row=(i%2)*70;
    if(spawnAt(type,cx+sx*(R+row)+qx*u,cy+sy*(R+row)+qy*u))ok++;
   }
  }
  if(ok>6)say('⇄ Чаща сжимает');
 }else if(kind==='pack'){
  // быстрая стая: не много HP, но много тел. Хорошо создаёт ощущение мясорубки.
  const R=Math.max(W,H)*0.52+120;
  const ox=Math.cos(a),oy=Math.sin(a),qx=-oy,qy=ox;
  const m=Math.max(8,Math.round(n*0.78));
  let ok=0;
  for(let i=0;i<m;i++){
   const lane=(i%4)-1.5;
   const u=lane*42+srnd(-22,22);
   const depth=srnd(0,210);
   if(spawnAt(type,cx+ox*(R+depth)+qx*u,cy+oy*(R+depth)+qy*u))ok++;
  }
  if(ok>5)say('⋯ Стая прорывается');
 }else{
  // поток: узкий сектор, подаётся порциями несколько секунд подряд
  form={kind:'stream',t:6.5,tick:0,a:a,type:type,per:Math.max(2,Math.round(n/8))};
  say('≫ Поток с одной стороны');
 }
}
// v7.30: РАСПИСАНИЕ ВОЛН. Идёт поверх случайных формаций и имеет приоритет:
// после сценарной волны случайная не приходит ещё 18 секунд, иначе две толпы
// накладываются и главы забега перестают читаться по отдельности.
let waveIdx=0;
function updateWaveScript(){
 const pt=progT(time);
 while(waveIdx<WAVE_SCRIPT.length&&pt>=WAVE_SCRIPT[waveIdx].t){
  const w=WAVE_SCRIPT[waveIdx++];
  if(bossSpawned)continue;
  // размер поправляется на площадь экрана тем же множителем, что и обычные
  // формации: на планшете волна не должна размазываться в редкую цепочку
  runFormation(w.kind,w.type,Math.max(6,Math.round(w.n*Math.min(2.5,viewDensityMul()))),w.log||'');
  formCd=Math.max(formCd,18);
 }
}
function updateFormations(dt){
 if(bossSpawned)return;
 updateWaveScript();               // v7.30: сценарные волны идут и до 18-й секунды
 if(time<18)return;                // v6.56: не ждём полминуты до первой формации
 formCd-=dt;
 if(formCd<=0){
  // v7.30: раньше случайная формация приходила каждые 16-34 с и была единственным
  // ритмом. Теперь ритм задаёт WAVE_SCRIPT, а случайные волны сдвинуты в фон:
  // иначе сценарная глава тонет в трёх безымянных, пришедших вокруг неё.
  formCd=Math.max(26,(50-Math.floor(time/60)*2)*directorFormMul());   // v6.58: директор чаще даёт формации, если легко
  // и порог свободного места строже: волна в уже забитое поле не спавнится,
  // а кулдаун тратит — получалось «объявление есть, толпы нет».
  if(liveEnemies()<enemyCap(time)*0.85)startFormation();
 }
 if(form){
  form.t-=dt;
  form.tick-=dt;
  if(form.tick<=0){
   form.tick=0.3;
   const cx=cam.x+W/2,cy=cam.y+H/2,rx=W/2+170,ry=H/2+170;
   for(let i=0;i<form.per;i++){
    const t=form.a+srnd(-0.4,0.4);
    spawnAt(form.type,cx+Math.cos(t)*rx,cy+Math.sin(t)*ry);
   }
  }
  if(form.t<=0)form=null;
 }
}

// v6.62: АФФИКСЫ ЭЛИТ — цветная аура + своя механика у каждого.
// Яростный — быстрее; Студёный — замедляет при ударе; Живучий — толще;
// Взрывной — взрывается при смерти.
