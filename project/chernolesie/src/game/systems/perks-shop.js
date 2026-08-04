//  МАГАЗИН ПЕРКОВ
// ============================================================
// v5.3 Кузница Заставы — 9 мета-перков (между забегами)
const PERKS=[
 {k:'dmg',t:'Заточка',d:'+10% урон / ур.',tag:'Сталь',base:30,max:8},
 {k:'hp',t:'Кольчуга',d:'+20 макс. HP / ур.',tag:'Стража',base:30,max:8},
 {k:'spd',t:'Сапоги',d:'+8% бег / ур.',tag:'Путь',base:30,max:8},
 {k:'crit',t:'Глаз ворона',d:'+4% крит / ур.',tag:'Тень',base:45,max:6},
 {k:'regen',t:'Живица',d:'+0.25 реген/с / ур.',tag:'Чаща',base:50,max:5},
 {k:'area',t:'Размах',d:'+8% радиус / ур.',tag:'Сталь',base:40,max:6},
 {k:'pickup',t:'Мешок Велеса',d:'+12% подбор / ур.',tag:'Судьба',base:35,max:6},
 {k:'special',t:'Заряд Ярило',d:'+1 макс. спец / 2 ур.',tag:'Гром',base:80,max:4},
 {k:'luck',t:'Кость Мокоши',d:'+5% удача реликвий / ур.',tag:'Судьба',base:55,max:5},
];
function pcost(k){
 const p=PERKS.find(x=>x.k===k); if(!p)return 99999;
 const lvl=perks[k]||0;
 return Math.round(p.base*Math.pow(1.42,lvl));
}
function applyPerks(){
 const d=perks.dmg|0,h=perks.hp|0,s=perks.spd|0,c=perks.crit|0,r=perks.regen|0;
 const a=perks.area|0,pk=perks.pickup|0,sp=perks.special|0,lk=perks.luck|0;
 if(d)P.dmgMul+=0.10*d;
 if(h){P.maxhp+=20*h;P.hp=P.maxhp;}
 if(s)P.spd*=(1+0.08*s);
 if(c)P.crit=(P.crit||0)+0.04*c;
 if(r)P.regen=(P.regen||0)+0.25*r;
 if(a)P.areaMul=(P.areaMul||1)+0.08*a;
 if(pk)P.pickup*=(1+0.12*pk);
 if(sp)specialMax+=(sp>>1);
 if(lk)P.luck=(P.luck||0)+0.05*lk;
}
function applyMetaStartWeapons(){
 if(P._metaStartBow&&!weapons.some(w=>w.id==='bow')){
  if(currentClass!=='archer') weapons.push({id:'bow',cd:1.22,t:0.4,evo:false});
 }
 if(P._metaStartBolt&&!weapons.some(w=>w.id==='bolt')){
  hasBolt=true;
  weapons.push({id:'bolt',cd:1.25,t:0.5,evo:false});
 }
}
function renderShop(){
 const mg=document.getElementById('metagold'); if(mg)mg.textContent=metaGold;
 const head=document.getElementById('shophead');
 if(head)head.textContent='Кузница Заставы — перки на все забеги · победная серия: '+winStreak;
 const sl=document.getElementById('streakline');
 if(sl){
  const bonus=winStreak>0?Math.min(40,winStreak*12):0;
  sl.textContent=winStreak>0
   ?('🔥 Серия побед: '+winStreak+' · следующий забег +'+bonus+'% к золоту забега')
   :(loseStreak>0?('Серия поражений: '+loseStreak+' · сложность смягчится после 2'):'Победи Змея Горыныча — серия усилит золото следующего забега');
 }
 const s=document.getElementById('shop'); if(!s)return; s.innerHTML='';
 PERKS.forEach(p=>{
  const lvl=perks[p.k]|0, maxed=p.max!=null&&lvl>=p.max, c=pcost(p.k);
  const d=document.createElement('div');
  d.className='card meta'+(maxed?' maxed':'');
  const _ic=p.k==='dmg'?'sword':p.k==='hp'?'heart':p.k==='spd'?'boot':p.k==='crit'?'eye':p.k==='regen'?'flame':p.k==='area'?'star':p.k==='pickup'?'bag':p.k==='special'?'sun':p.k==='luck'?'crown':'dar';
  d.innerHTML=`<div class="upgradeIcon dar" style="color:#ffcf6a">${iconPaint(_ic)}</div><span class="mtag">${p.tag||''}</span><h3>${p.t}</h3><p>${p.d}<br>Ур. ${lvl}${p.max!=null?('/'+p.max):''}${maxed?'':(' → '+(lvl+1))}</p><div class="mcost">${maxed?'МАКС':'◆ '+c}</div>`;
  if(!maxed&&metaGold>=c){
   d.onclick=()=>{
    if(metaGold<c)return;
    const newGold=metaGold-c; if(newGold<0)return;
    if(p.max!=null&&(perks[p.k]|0)>=p.max)return;
    metaGold=newGold;
    perks[p.k]=(perks[p.k]|0)+1;
    LS.set('cl_gold',metaGold);
    LS.set('cl_perks',JSON.stringify(perks));
   try{if(window.YA_SAVE)YA_SAVE();}catch(e){}   // Яндекс: облачный сейв
    sfxUpgrade();
    renderShop();
   };
  }else if(!maxed){d.style.opacity=.45;}
  s.appendChild(d);
 });
}

// ============================================================
