let _surgeTmr=null,_surgeIdx=0,_surgeT=-999,lowHpT=0,furyT=0,_furyAdd=0;
function surgeBanner(name,sub,color){
 const ov=document.getElementById('surgeov');if(!ov)return;
 const n=document.getElementById('surgename'),b=document.getElementById('surgesub');
 if(n){n.textContent=name;if(color)n.style.color=color;}
 if(b)b.textContent=sub||'';
 ov.classList.remove('fade');ov.classList.add('show');
 if(_surgeTmr)clearTimeout(_surgeTmr);
 _surgeTmr=setTimeout(function(){
  ov.classList.add('fade');
  _surgeTmr=setTimeout(function(){ov.classList.remove('show','fade');_surgeTmr=null;},400);
 },1400);
}
// Ярость: короткое окно чистой силы. Прибавка симметрична (add -> отнимаем то же
// значение), поэтому повторный вход НЕ стакается — он только продлевает окно.
function startFury(sec,add){
 if(furyT<=0){_furyAdd=add;P.dmgMul+=add;}
 furyT=Math.max(furyT,sec);
 P.invuln=Math.max(P.invuln||0,1.2);
}
function stopFury(){
 if(_furyAdd){P.dmgMul-=_furyAdd;_furyAdd=0;}
 furyT=0;
}
// v6.18h ЛЕСТНИЦА СЕЧИ — ПЕРЕДЕЛАНА ПОСЛЕ ЗАМЕРА.
// Было: пороги 50/100/150/200/300 и дальше каждые +100. Замер на живом забеге:
// 00:50 — серия ×374 при 374 убийствах, то есть она НЕ ПРЕРЫВАЛАСЬ НИ РАЗУ, и все
// пять ступеней отстрелялись за первые пятьдесят секунд. Дальше «Неистовство»
// срабатывало бы каждые ~13 секунд, а окно Ярости (6-8с) не успевало закрыться —
// то, что задумывалось как редкий пик, стало постоянным фоном.
// Ошибка в допущении: я считал серию ×200 достижением, а она набегает сама.
// Стало три предохранителя сразу:
//   1) пороги РАСТУТ (60 -> 160 -> 400 -> 900 -> 1800, дальше ×1.8);
//   2) ступени идут строго по порядку и каждая срабатывает РОВНО ОДИН РАЗ за забег;
//   3) между любыми двумя всплесками — не меньше SURGE_GAP секунд, сколько бы
//      игрок ни накосил. Без этого первые три ступени всё равно слиплись бы в одну.
const SURGES=[
 {n:60,  t:'ЧЁРНЫЙ ПОЛДЕНЬ', s:'чаща замерла', c:'#b478ff', f:function(){
   // Замирают ВРАГИ, а не мир: игрок продолжает двигаться и рубить неподвижных.
   for(const e of enemies){if(e.hp>0&&!e.boss)e.frozen=Math.max(e.frozen||0,1.4);}
   flashScreen('#b478ff',0.5);
 }},
 {n:160, t:'ЯРОСТЬ ЗАСТАВЫ',s:'+30% урона на 6 секунд',c:'#ff8a3c',f:function(){
   startFury(6,0.30);flashScreen('#ff8a3c',0.55);
 }},
 {n:400, t:'ЩЕДРАЯ ЖИЛА',  s:'кристаллы цветут',c:'#5affc9',f:function(){
   for(let i=0;i<22;i++){const a=srnd(0,TAU),r=srnd(90,260);
    spawnGem(clamp(P.x+Math.cos(a)*r,16,WORLD-16),clamp(P.y+Math.sin(a)*r,16,WORLD-16),
     1,'#5affc9',Math.cos(a)*40,Math.sin(a)*40-50);}
   magnetT=Math.max(magnetT,2.2);flashScreen('#5affc9',0.45);
 }},
 {n:900, t:'ЖАТВА НАВИ',   s:'всё рядом обращается в прах',c:'#ffd77d',f:function(){
   // Радиус срезан с 560 до 420: на пороге 900 это всё ещё мощно, но уже не
   // «полэкрана даром» — раньше эта ступень наступала на второй минуте.
   let n=0;
   for(const e of enemies){
    if(e.hp<=0||e.dying>0||e.boss||e.mini)continue;
    if(dist2(e.x-P.x,e.y-P.y)>420*420)continue;
    hitEnemy(e,e.hp+1,'void',true);n++;
   }
   flashScreen('#ffd77d',0.7);log('☠ Жатва Нави: обращено в прах — '+n,'gold');
 }},
 {n:1800,t:'ЗОВ ПРЕДКОВ',  s:'ярость и жила разом',c:'#ff6a6a',f:function(){
   startFury(8,0.40);magnetT=Math.max(magnetT,2.5);flashScreen('#ff6a6a',0.6);
 }}
];
const SURGE_GAP=75;      // секунд между всплесками — жёсткий предохранитель
const SURGE_GROW=1.8;    // во сколько раз дорожает каждая ступень за последней
// Порог для ступени номер i (нумерация с нуля, хвост бесконечен).
function surgeNeed(i){
 if(i<SURGES.length)return SURGES[i].n;
 return Math.round(SURGES[SURGES.length-1].n*Math.pow(SURGE_GROW,i-SURGES.length+1));
}
function checkSurges(){
 const need=surgeNeed(_surgeIdx);
 if(killCombo<need)return;
 if(time-_surgeT<SURGE_GAP)return;          // слишком рано — ступень подождёт
 _surgeT=time;
 const S=SURGES[_surgeIdx];
 _surgeIdx++;
 if(S){
  surgeBanner(S.t,'сеча ×'+need+' — '+S.s,S.c);
  try{S.f();}catch(e){if(typeof swallow==='function')swallow('surge',e);}
  log('✦ '+S.t+' — '+S.s,'evo');
 }else{
  surgeBanner('НЕИСТОВСТВО','сеча ×'+need+' — сеча не кончается','#ff6a6a');
  startFury(6,0.35);gold+=25;flashScreen('#ff6a6a',0.5);
 }
 // v7.0: каждый всплеск — свой звук
 const _surgeSfx=[sfxSurgeBlackNoon,sfxSurgeRage,sfxSurgeVein,sfxSurgeHarvest,sfxSurgeAncestors];
 if(_surgeIdx>0&&_surgeIdx<=_surgeSfx.length){try{_surgeSfx[_surgeIdx-1]();}catch(e){if(typeof sfxEvo==='function')sfxEvo();}}
 else if(typeof sfxEvo==='function')sfxEvo();
}
// Это самый сильный эмоциональный момент жанра, и он не стоит игроку ничего —
// он его ЗАРАБОТАЛ. Поэтому награда настоящая: ярость, золото и вслух сказанное
// «ты выжил», а не молчание, как было раньше.
function tickComeback(dt){
 const frac=P.hp/Math.max(1,P.maxhp);
 if(frac<0.20){lowHpT+=dt;}
 else if(frac>0.50&&lowHpT>=2.5){
  lowHpT=0;
  surgeBanner('ВОПРЕКИ','вытащил себя с того света','#8fff8a');
  startFury(5,0.25);gold+=20;
  flashScreen('#8fff8a',0.5);
  if(typeof sfxEvo==='function')sfxEvo();
  log('🌿 ВОПРЕКИ — застава выстояла на волоске. +20 ◆','evo');
 }
 else if(frac>0.35){lowHpT=Math.max(0,lowHpT-dt*0.5);}
 if(furyT>0){furyT-=dt;if(furyT<=0)stopFury();}
}


