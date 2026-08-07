function onKillHeal(amount){
 if(P.lifesteal&&amount>0){
  // вампиризм: +1 HP за убийство + бонус от урона.
  // CAP=10: босс (2600 HP) дал бы +131 HP, элита (240) — +13.
  // Без cap это обесценивает урон от босса и убивает напряжение.
  // +10 за килл босса = значимо, но не имба.
  // Cap настраиваемый — если нужно поднять/опустить, меняй тут.
  const heal=Math.min(10,1+Math.floor(amount*P.lifesteal*0.1));
  const before=P.hp;
  P.hp=Math.min(P.maxhp,P.hp+heal);
  if(P.hp>before)spawnDmgText(P.x,P.y-P.r-20,`+${Math.round(P.hp-before)}`,'frost');
 }
}
// v7.31: ЗОЛОТО ЗА ЦЕННОСТЬ, А НЕ ЗА ФАКТ СМЕРТИ.
// Было gold++ на каждое убийство. Замер полного забега: 98 301 убийство —
// столько же золота, и вся Кузница с Древом окупались за три забега. При этом
// леший (5 HP) приносил ровно столько же, сколько Чащобный Хозяин (300 HP).
// Теперь платят только те, кого стоило убивать: шкала повторяет номиналы
// кристаллов из GEM_TIERS, чтобы ценность врага читалась одинаково и в опыте,
// и в золоте. Рядовая мелочь не платит совсем — её валюта это опыт.
function goldFor(e){
 if(!e)return 0;
 if(e.boss||e.mini||e.elite)return 0;   // у них свои выплаты ниже по файлу
 const v=e.xp||1;
 return v>=25?8:v>=10?3:v>=5?1:0;
}
function killDrops(e){
 if(e.dead)return;e.dead=true;e.hp=0;kills++;gold+=goldFor(e);sfxDeath();spawnDeathBurst(e);
 // v6.22: копим смерти текущего шага для общего ответа (см. flushMultiKill)
 mkN++;mkX+=e.x;mkY+=e.y;
 // v8.10 COMMERCIAL ENGINE INTEGRATION: синергии при гибели врага
 if(P.synApocalypse4 && seedRandom()<0.15 && typeof doBolt==='function'){ doBolt(); }
 if(P.synVoidChoir && seedRandom()<0.35){ P.hp=Math.min(P.maxhp,P.hp+1); }
 onEnemyKilledW(e.x,e.y);   // v6.17c: серия венца + метка для тризны
 // v6.63: награды сюрпризов
 if(e.courier){
  log('💰 Курьер пал — сундук его!','gold');
  spawnAnomaly('chest',e.x,e.y);
  spawnCoins(e.x,e.y,6);
  dropXp(e.x,e.y,40,20);
  flashScreen('rgba(255,220,90,',0.3);
  shake=Math.max(shake,5);
 }else if(e.beacon){
  log('✴ Маяк чащи погас','warn');
  dropXp(e.x,e.y,30,28);
  spawnCoins(e.x,e.y,3);
  flashScreen('rgba(190,120,255,',0.3);
 }else if(e.shaman){
  log('🔥 Шаман пал — орда в ярости!','warn');
  shake=Math.max(shake,6);
  let _raged=0;
  // FIX v7.38: используем spatial hash вместо перебора всех врагов — O(1) вместо O(n)
  const nearShaman = enemiesNear(e.x, e.y, 300);
  for(const en of nearShaman){
   if(!en.alive||en.hp<=0||en===e)continue;
   if(dist2(en.x-e.x,en.y-e.y)<300*300){
    en.spd=(en.spd||90)*1.35;en.dmgMod=(en.dmgMod||1)*1.3;en.rageT=6;_raged++;
    spawnFlash(en.x,en.y,0.5,'#ff5a40');
   }
  }
  if(_raged>0)log('Орда разъярена — '+_raged+' врагов','warn');
 }
 // v5.73 СОБЫТИЕ СМЕРТИ. Раньше рядовой враг умирал без единого кадра паузы:
 // убийство ничем не отличалось от простого попадания, и «щелчка» не возникало.
 // В жанре именно убийство — главная точка отдачи, оно всегда весомее удара.
 // Хитстоп масштабируем по величине цели: мелочь щёлкает, туша ощущается.
 if(!e.boss&&!e.mini){
  const _big=(e.drawH||60)>=90||e.elite;
  // v6.16: тряска/хитстоп при смерти — ТОЛЬКО для элит (босс/мини трясут через killDrops).
  // Рядовые мобы раньше давали shake+=2/+4 при каждом убийстве — отсюда «тряска при каждом убийстве».
  if(e.elite){}   // v6.17: и тряска, и хитстоп убраны — вес несут вспышка и отдача
  // отлёт трупа по направлению удара: смерть на месте читается как «исчез»,
  // смерть с отбросом — как «убил»
  const _dx=e.x-P.x,_dy=e.y-P.y,_d=Math.sqrt(_dx*_dx+_dy*_dy)||1;
  e.kx=(e.kx||0)+_dx/_d*(_big?150:220);
  e.ky=(e.ky||0)+_dy/_d*(_big?150:220);
  // БЕЛАЯ ВСПЫШКА СИЛУЭТА на один кадр. Приём из жанра: перед тем как труп
  // упадёт, он на миг становится белым. Глаз получает чёткую точку «вот сейчас»,
  // и смерть перестаёт тонуть в общей каше из тридцати тел.
  e.deathFlash=0.09;
  // v5.76: без e.dying туша удалялась в ТОМ ЖЕ кадре (updateDespawn), поэтому
  // ни кадры смерти f_11..f_14, ни белая вспышка, ни отлёт трупа не показывались.
  // v10.1: короткая анимация гибели (0.28с для рядовых врагов) без зависания мёртвых тел на экране
  if(e.dieFrames&&e.dieFrames.length)e.dying=(e.boss||e.mini)?(e.dieMax||1.25):0.28;
  // восходящий тон по серии — см. sfxKillTone
  if(typeof sfxKillTone==='function')sfxKillTone(killCombo+1);
 }
 // v6.21: печать копится с крови — элита/мини/босс жирнее.
 // Ставки урезаны в ~7 раз: на 60 killов в минуту кровь даёт ~0.24 заряда,
 // то есть срезает ожидание с 59с до ~50с, а не обнуляет его.
 if(specialCharge<specialMax){
  let sc=0.004;
  if(e.elite)sc=0.035;
  if(e.mini)sc=0.12;
  if(e.boss)sc=0.30;
  specialCharge=Math.min(specialMax,specialCharge+sc);
 }
 killCombo++;killComboT=2.4;if(killCombo>runStats.maxCombo)runStats.maxCombo=killCombo;if(killCombo===10||killCombo===25||killCombo===50){log('Серия ×'+killCombo+'!','gold');comboMilestone(killCombo);}
 onKillHeal(e.maxhp); // <-- ВАМПИРИЗМ при УБИЙСТВЕ

 // ==========================================
 // ❄️ ЭФФЕКТ РАСКАЛЫВАНИЯ ЛЬДА (ICE SHATTER)
 // ==========================================
 if(e.frozen>0){
  const _iceCount=e.boss?20:e.mini?14:e.elite?10:6;
  for(let i=0;i<_iceCount;i++){
   const a=i/_iceCount*TAU+Math.random()*0.2, sp=rnd(100,240);
   const p=spawnParticle(e.x,e.y-e.r*0.5,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.4,.85),i%2?'#bfe0ff':'#e0f0ff',150,0);
   if(p)p.ice=1;
  }
  if(AC){
   try{
    tone(1500,0.12,'sine',0.05,2200);
    setTimeout(()=>{try{tone(1900,0.10,'sine',0.03,1100)}catch(err){}},35);
   }catch(err){}
  }
  const _shatterDmg=(10+(e.maxhp||e.hp||5)*0.12)*P.dmgMul;
  const _shatterR=e.r+80;
  const _victims=aliveNear(e.x,e.y,_shatterR);
  for(const v of _victims){
   if(v===e)continue;
   hitEnemy(v,_shatterDmg,'frost',false);
   v.slow=Math.min(v.slow||1,0.65);
   v.frozen=Math.max(v.frozen||0,0.6);
  }
  spawnFlash(e.x,e.y-e.r*0.5,0.6,'#bfe0ff');
  log('❄ Раскалывание льда!','frost');
 }

 // ==========================================
 // 🍂 ТЕМАТИЧЕСКИЕ ЧАСТИЦЫ СМЕРТИ (DEBRIS)
 // ==========================================
 const _epCount=Math.floor((e.boss?24:e.mini?18:e.elite?14:8)*partMul);
 let _colPool=['#7a2412','#aa3a22','#5a1a0a'];
 let _pType='blood'; 
 
 if(e.type==='leshiy'||e.type==='chashob'){
  _colPool=['#8b5a2b','#5c4033','#a0522d','#4a5d23'];
  _pType='wood';
 }else if(e.type==='kikimora'||e.type==='vodyanoy'||e.type==='bognik'||e.type==='vedmaT'||e.type==='vodianik'){
  _colPool=['#2c3d1d','#3a4d22','#5a4625','#1b2e11'];
  _pType='silt';
 }else if(e.type==='upyr'||e.type==='naviya'||e.type==='rusalka'||e.type==='baba_yaga'||e.type==='poludnitsa'){
  _colPool=['#f5f5f0','#e6e6da','#5c1006','#420a02'];
  _pType='bone';
 }
 
 for(let i=0;i<_epCount;i++){
  const a=Math.random()*TAU,sp=rnd(80,e.boss?320:230);
  const p=spawnParticle(e.x,e.y-e.r*0.5,Math.cos(a)*sp,Math.sin(a)*sp-40,rnd(.35,.9),_colPool[i%_colPool.length],250,(_pType==='blood'?1:0));
  if(!p)break;
  if(_pType==='wood')p.wood=1;
  else if(_pType==='bone'){
   if(i%2===0)p.bone=1;
   else p.blood=1;
  }
  else if(_pType==='silt')p.silt=1;
 }

 const isBoss=!!e.boss;
 if(isBoss){gold+=280;won=true;bossE=null;shake=8;flashScreen('#ffcf6a',0.7);slowmoHit(0.5,1.08);   // v6.61: падение Хранителя — заморозка + слоу-мо
  // v6.24: полсекунды тишины на падении Хранителя. Это финал забега —
  // единственное место, где длинная пауза не мешает, а работает на выдох.
  evoPause=Math.max(evoPause,0.55);
  bigText('ХРАНИТЕЛЬ ПАЛ','застава цела');
  vibe(160);   // v6.17: хитстоп убран, вспышка усилена
  if(UI.bosshp)UI.bosshp.style.width='0%';
  const bp=EL('bossphase'); if(bp)bp.textContent='повержен';
  EL('bossbar').classList.remove('enrage');
  // щедрый дождь гемов + хил + реликвия + карта
  dropXp(e.x,e.y,250,48,130,170);   // v6.2
  spawnCoins(e.x,e.y,10);   // v6.62: дождь монет с Хранителя
  P.hp=Math.min(P.maxhp,P.hp+40);
  const rBoss=RELICS[Math.floor(seedRandom()*RELICS.length)];
  const _gotB=addRelic(rBoss);   // v5.83: слоты могли быть полны
  if(_gotB)log('⚜ Хранитель пал — застава цела. Дар: '+(rBoss.name||'реликвия'),'gold');
  else{gold+=120;log('⚜ Хранитель пал — застава цела. Слоты реликвий полны: +120 ◆','gold');}
 }
 // МИНИ-БОССЫ (Древень/Стрыга): награда — гарантированная реликвия, хил,
 // золото, выбор карты. dying запускает анимацию падения (e.dieFrames).
 if(e.mini){
  const isT=e.type==='baba_yaga';
  const isW=e.miniKind==='warlord';
  if(isT){treantKills++;miniBossE=null;}
  else if(isW){warlordKills++;mini3BossE=null;}
  else{mglistKills++;mini2BossE=null;}
  gold+=isT?75:(isW?65:55);
  // v6.24: мини-босс — веха на четверть забега, ей положен свой титр и стоп-кадр
  evoPause=Math.max(evoPause,0.28);
  bigText(isT?'ДРЕВЕНЬ ПАЛ':(isW?'ВОЖАК ПАЛ':'СТРЫГА ИЗГНАНА'),'путь открыт',isT?'#8aff5a':(isW?'#b8e07a':'#c9ffe0'));
  vibe(110);
  slowmoHit(0.3,1.05);   // v6.61: мини-босс
  shake=5;flashScreen(   // v6.17: хитстоп убран
  isT?'#8aff5a':(isW?'#7fb04a':'#c9ffe0'),0.35);
  e.dying=e.dieMax||1.25;
  // Полосу HP прячем только если её не занял главный босс
  if(!bossE)EL('bossbar').style.display='none';
  if(UI.bosshp)UI.bosshp.style.width='0%';
  const gemN=isT?10:8,healN=isT?25:15;
  dropXp(e.x,e.y,120,30,100,140);   // v6.2: мини-босс   // v5.95
  spawnCoins(e.x,e.y,8);   // v6.62: монеты с мини-босса
  P.hp=Math.min(P.maxhp,P.hp+healN);
  const r=RELICS[Math.floor(seedRandom()*RELICS.length)];
  if(!addRelic(r)){gold+=60;log('Слоты реликвий полны: +60 ◆','gold');}   // v5.83
  log(isT?'🌲 Древень повержен!':(isW?'🌳 Леший-Вожак повержен!':'👁 Стрыга изгнана!'), 'gold');
  if(!over&&!won&&!paused){paused=true;showCards();}
 }
 // Болотник распадается на 2 мелких отростка
 if(e.type==='bognik'){
  for(let si=0;si<2;si++){
   const a2=seedRandom()*TAU;
   if(liveEnemies()<40){
    const _leshiySpawn={...ETYPES.leshiy,x:e.x+Math.cos(a2)*20,y:e.y+Math.sin(a2)*20,hp:3,maxhp:3,type:'leshiy',flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,ai:'chase',dmgMod:0.5,fireT:0,spawnT:0,zigzag:0,zigzagT:0};
    acquireEnemy(_leshiySpawn);
   }
  }
 }
  if(e.elite){
   // v7.38: slowmoHit убран со смерти элиты для динамики без тормозов
  // v6.62: Взрывной — взрывается при смерти, бьёт по игроку
  if(e.affix==='booming'){
   flashScreen('rgba(255,120,40,',0.35);
   shake=Math.max(shake,6);
   for(let _i=0;_i<14;_i++){const _a=rnd(0,6.283);spawnParticle(e.x,e.y,Math.cos(_a)*rnd(120,300),Math.sin(_a)*rnd(120,300),rnd(.3,.6),'#ff9a3c',0,0);}
   if(dist2(e.x-P.x,e.y-P.y)<140*140&&P.invuln<=0){
    const bdmg=Math.round(14*armorMul()*(1+0.03*Math.floor(time/60)));
    P.hp-=bdmg;if(!isFinite(P.hp))P.hp=0;
    spawnDmgText(P.x,P.y-P.r-14,Math.round(bdmg),'void');
    sfxHurtSoft();
   }
  }
  gold+=25;   // v6.17: без тряски и без хитстопа
  dropXp(e.x,e.y,60,20,90,120);   // v6.2: элита
  spawnCoins(e.x,e.y,4);   // v6.62: монеты с элиты
  P.hp=Math.min(P.maxhp,P.hp+15);
  // РЕЛИКВИЯ ВЫДАЁТСЯ ТОЛЬКО ПОСЛЕ УБИЙСТВА элиты (не на спавне!)
  if(e.hasRelic){
   const r=RELICS[Math.floor(seedRandom()*RELICS.length)];
   if(!addRelic(r)){gold+=40;log('Слоты реликвий полны: +40 ◆','gold');}   // v5.83
  }
  spawnAnomaly('chest',e.x,e.y);   // v5.69: элита -> сундук -> эволюция
  if(!over&&!won&&!paused){paused=true;showCards();}
 }
 dropXp(e.x,e.y,e.xp||1,8);   // v6.2: ценность из ETYPES вместо жёсткой единицы

 {const _dw=e.boss?1:(e.mini?0.85:(e.elite?0.7:0.32));
  const f0=spawnFlash(e.x,e.y-e.r*0.6,_dw,'#ffe6a0');
  if(f0){f0.t=f0.max=0.14+0.10*_dw;}
  // v6.50 УДАРНАЯ ВОЛНА СМЕРТИ.
  if(typeof gemPop==='function'){
   const rc=e.boss?'#ffd77d':e.mini?'#ffb060':e.elite?'#ff9a6a':'#ffe6a0';
   gemPop(e.x,e.y-e.r*0.4,rc,0.9+2.2*_dw,1);
  }}   // v6.16: hitstop убран — был при КАЖДОМ убийстве рядового моба. Тряска/пауза остаётся только для босса/мини/элиты.
 // Конец забега — ПОСЛЕ всего лута и эффектов (#3)
 if(isBoss)endRun(true);
}
