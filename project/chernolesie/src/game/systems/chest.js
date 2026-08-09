function chestEvoCandidate(){
 const auraEvo=auraList().filter(au=>auraReady(au.k)).sort((a,b)=>b.a.lvl-a.a.lvl);
 if(auraEvo.length)return {kind:'aura',k:auraEvo[0].k,obj:auraEvo[0].a};
 const cand=weapons.filter(w=>!w.evo&&evoReady(w.id)).sort((a,b)=>wLvl(b.id)-wLvl(a.id));
 if(cand.length)return {kind:'weapon',k:cand[0].id,obj:cand[0]};
 return null;
}
// Приз «уровень орудию»: качаем то, что БЛИЖЕ к своему рецепту, а не старшее.
function chestWeaponPrize(){
 const need=evoMinLvl();
 const rank=weapons.filter(w=>!w.evo&&EVO_RECIPES[w.id]).map(w=>{
  const r=EVO_RECIPES[w.id],lv=wLvl(w.id),has=passiveTaken(r.p);
  return {w:w,r:r,lv:lv,has:has,score:(has?100:0)-Math.max(0,need-lv)};
 }).sort((a,b)=>b.score-a.score);
 const up=rank.length?rank[0]:(weapons.length?{w:weapons.slice().sort((a,b)=>wLvl(b.id)-wLvl(a.id))[0],r:null,has:false}:null);
 if(!up)return null;
 return {t:'wlvl',title:WNAME[up.w.id]+' +1 ур.',
  desc:(function(){
   if(!up.r)return 'орудие крепнет';
   const left=Math.max(0,need-wLvl(up.w.id)-1);
   if(!up.has)return 'для «'+up.r.n+'» нужны «'+up.r.p+'»'+(left>0?(' и ещё '+left+' ур.'):'');
   return left>0?('до «'+up.r.n+'» ещё '+left+' ур.'):('рецепт «'+up.r.n+'» собран!');
  })(),
  apply:()=>bumpWLvl(up.w.id)};
}
// Приз «часть рецепта»: выдаёт пассивку, которая одна блокирует готовое орудие.
// recipeBlocker() возвращает её только когда уровень УЖЕ набран, то есть это
// не подачка, а закрытие вложения, которое игрок уже сделал.
function chestRecipePrize(){
 let name=null;
 try{name=recipeBlocker();}catch(e){}
 if(!name)return null;
 const card=CARD_POOL.find(c=>c.t===name);
 if(!card)return null;
 return {t:'evo',title:name,desc:'недостающая часть рецепта',
  apply:()=>{cardLv[name]=(cardLv[name]||0)+1;try{card.f();}catch(e){}}};
}
function openChest(){
 sfxChest();   // v7.0: звук открытия сундука
 // Сколько призов. Пятёрка редка — она и должна быть событием.
 const _r=seedRandom();
 const n=_r<0.55?1:(_r<0.90?3:5);
 const prizes=[];
 // НЕДОСТАЮЩАЯ ЧАСТЬ РЕЦЕПТА — первым призом, если орудие уже набрало уровень
 // и всё упирается только в пассивку. Замер показал ноль эволюций за 200
 // сундуков: уровень оружия сундук качал, а пассивку взять было неоткуда, и
 // рецепт стоял вечно. Теперь сундук закрывает именно то, чего не хватает,
 // и тут же, следующим призом, выдаёт саму эволюцию — как в вампирах, где
 // сундук и есть то место, где рождается новое оружие.
 // Применяем СРАЗУ, до расчёта эволюции: иначе chestEvoCandidate её не увидит.
 const rp=chestRecipePrize();
 if(rp){try{rp.apply();}catch(e){}rp.apply=function(){};prizes.push(rp);}
 // ЭВОЛЮЦИЯ — следом, если рецепт собран.
 const ev=chestEvoCandidate();
 if(ev){
  const r=EVO_RECIPES[ev.k];
  prizes.push({t:'evo',title:r.n,desc:WNAME[ev.k]+' пробуждается',evo:true,
   apply:()=>{
    if(ev.kind==='aura'){ev.obj.evo=true;journalFind('evo',ev.k,r.n);}
    else evolveWeapon(ev.obj);
   }});
 }
 // Остальные призы — из пула. Уровни орудий тянут вес: они и есть мясо забега.
 // v7.3: Роскошный пул наград без повторов (каждый дар в сундуке уникален!)
 const usedKinds = new Set(prizes.map(p=>p.title));
 const bonusPool = [
  {t:'gold',  title:'+180 ◆', desc:'золото славянской заставы', apply:()=>{gold+=180;}},
  {t:'maxhp', title:'+25 макс. HP', desc:'тело богатыря крепнет навсегда', apply:()=>{P.maxhp+=25;P.hp+=25;}},
  {t:'evo',   title:'+15% урон', desc:'Благословение Перуна: ярость в бою', apply:()=>{P.dmgMul=(P.dmgMul||1)*1.15;}},
  {t:'evo',   title:'-12% кулдаун', desc:'Скорость Сварога: быстрые взмахи', apply:()=>{P.cdMul=Math.max(0.1,(P.cdMul||1)*0.88);}},
  {t:'pickup',title:'+20% скорость', desc:'Шаг Волка: стремительный бег', apply:()=>{P.spd=(P.spd||150)*1.20;}},
  {t:'pickup',title:'+25% подбор', desc:'Магнит Велеса: широкий охват', apply:()=>{P.pickup*=1.25;}},
  {t:'heal',  title:'+'+Math.round(P.maxhp*0.5)+' HP', desc:'Живая Вода: раны затягиваются', apply:()=>{P.hp=Math.min(P.maxhp,P.hp+P.maxhp*0.5);}}
 ];
 let tries = 0;
 while(prizes.length<n && tries++ < 30){
  const p = chestWeaponPrize();
  if(p && !usedKinds.has('wlvl_'+p.title)){ usedKinds.add('wlvl_'+p.title); prizes.push(p); continue; }
  const avail = bonusPool.filter(b => !usedKinds.has(b.title));
  if(!avail.length) break;
  const b = avail[Math.floor(seedRandom()*avail.length)];
  usedKinds.add(b.title);
  prizes.push(b);
 }
 showChest(prizes);
}
// v7.2: ДОФАМИНОВЫЙ АТТРАКЦИОН — музыкальная лестница раскрытия сундука!
function sfxChestReveal(step, isEvo, total){
  if(!AC) return;
  vibe(12);
  const k = det(1.05);
  // Мажорная победная пентатоника триумфа (С5, D5, E5, G5, A5, C6)
  const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
  const freq = notes[Math.min(notes.length-1, step)] * k;
  
  if(isEvo){
    [523.25, 659.25, 783.99, 1046.50].forEach((f, idx)=>{
      setTimeout(()=>{
        layer('triangle', f*k, f*k, 0.28, 0.12, 0.008);
        layer('sine', f*2*k, f*2*k, 0.18, 0.04, 0.008);
      }, idx*75);
    });
  } else {
    layer('triangle', freq, freq*1.01, 0.24, 0.09, 0.005);
    layer('sine', freq*0.5, freq*0.5, 0.18, 0.12, 0.005);
    layer('sine', freq*1.5, freq*1.5, 0.10, 0.04, 0.005);
  }
}

// Показ: призы проявляются по одному, помпа растёт с их числом.

// v8.3 VS FANFARE: торжественные фанфары при открытии сундука как в Vampire Survivors
function sfxChestFanfare(count, hasEvo){
  if(!AC) return;
  const k = det(1.0);
  [523.25, 659.25, 783.99, 1046.50].forEach((f, idx)=>{
    setTimeout(()=>{
      layer('triangle', f*k, f*k*1.01, 0.45, 0.15, 0.01);
      layer('sawtooth', f*0.5*k, f*0.5*k, 0.35, 0.08, 0.01);
      layer('sine', f*2*k, f*2*k, 0.25, 0.05, 0.01);
    }, idx*65);
  });
  if(hasEvo || count >= 3){
    setTimeout(()=>{
      [659.25, 783.99, 1046.50, 1318.51].forEach((f)=>{
        layer('triangle', f*k, f*k, 0.55, 0.16, 0.01);
        layer('sine', f*2*k, f*2*k, 0.35, 0.06, 0.01);
      });
    }, 380);
  }
}

function showChest(prizes){
  paused=true;
  const ov=document.getElementById('chestov'),row=document.getElementById('chestrow');
  if(!ov||!row){prizes.forEach(p=>{try{p.apply();}catch(e){}});paused=false;return;}
  row.innerHTML='';
  const sub=document.getElementById('chestsub'), badge=document.getElementById('chestbadge');
  const hasEvo = prizes.some(p => p.evo);
  if(badge){
    badge.textContent = hasEvo ? '⚡ ВЕЛИКОЕ ПРОБУЖДЕНИЕ ⚡' : (prizes.length >= 5 ? '👑 ЗНАТНЫЙ СХРОН 👑' : (prizes.length === 3 ? '🌟 ЩЕДРЫЙ СХРОН 🌟' : '✨ ДАР ЛЕСА ✨'));
  }
  if(sub){
    sub.textContent = prizes.length===1 ? 'находка' : (prizes.length===3 ? 'щедрая находка (3 дара)' : 'ЗНАТНЫЙ СХРОН (5 ДАРОВ)');
  }
  const artwrap = document.getElementById('chestartwrap');
  if(artwrap && typeof CHEST_ART !== 'undefined' && CHEST_ART.src){
    artwrap.innerHTML = `<img src="${CHEST_ART.src}" alt="Сундук">`;
  }
  ov.style.display='flex';
  flashScreen('#ffcf6a',prizes.length>=5?0.35:0.22);
   shake=Math.max(shake,3);
  gemPop(P.x,P.y,'#ffcf6a',1.4);
  sfxAnomaly&&sfxAnomaly();
  sfxChestFanfare(prizes.length, hasEvo);
  const _burst=(k,col)=>{for(let i=0;i<k;i++){const a=rnd(0,TAU),sp=rnd(70,260);
   spawnParticle(P.x,P.y,Math.cos(a)*sp,Math.sin(a)*sp-60,rnd(.5,1.0),col,160,0);}};
  _burst(prizes.length>=5?36:20,'#ffcf6a');
  // Раскрытие по одному с торжественными фанфарами и вспышками!
  prizes.forEach((p,i)=>{
   setTimeout(()=>{
    if(!chestOpen())return;
    try{p.apply();}catch(e){swallow&&swallow('chest.apply',e);}
    const d=document.createElement('div');
    d.className='chitem'+(p.evo?' evo':'');
    d.style.animationDelay='0s';
    const _icId = (typeof cardIconId === 'function' ? cardIconId(p) : null) || 'gold';
    d.innerHTML='<div class="chico" style="color:'+(p.evo?'#ffd77d':'#c9a04a')+'">'+((typeof iconPaint === 'function' && iconPaint(_icId)) || CHEST_SVG[p.t] || CHEST_SVG.gold)+'</div>'+
     '<div class="chtx"><div class="chtt">'+p.title+'</div><div class="chdd">'+p.desc+'</div></div>';
    row.appendChild(d);
    sfxChestReveal(i, p.evo, prizes.length);
    if(p.evo){evoFanfare(p.title,p.desc); _burst(18,'#ffd77d');}
    else{flashScreen('#ffcf6a',0.16);_burst(10,'#ffe6a0');}
   },280+i*420);
  });
  const total=280+prizes.length*420+900;
  const btn=document.getElementById('btnChestTake');
  if(btn){btn.style.display='none';btn.onclick=closeChest;
   setTimeout(()=>{if(chestOpen())btn.style.display='';},280+prizes.length*420);}
  // v8.3 VS CHEST: сундук не закрывается по таймеру — игрок любуется наградой сколько захочет
}
function chestOpen(){const ov=document.getElementById('chestov');return !!(ov&&ov.style.display==='flex');}
function closeChest(){
 const ov=document.getElementById('chestov');
 if(ov)ov.style.display='none';
 const pv=document.getElementById('pauseov');
 paused=!!(pv&&pv.style.display==='flex');
}
