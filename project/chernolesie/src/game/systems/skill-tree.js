// ============================================================
//  ДРЕВО СИЛЫ
// ============================================================
const TREE={
 power:{name:'⚔ Сила',nodes:[
  {id:'pw1',name:'+12% урон',cost:50,max:5,f:(l)=>P.dmgMul*=1+0.12*l,stat:'dmg'},
  // БЫЛО: +0.15 (игнорировало l) → на 2 уровне то же что на 1. Теперь +0.15*l.
  {id:'pw2',name:'+15% крит',cost:80,max:3,f:(l)=>P.crit=(P.crit||0)+0.15*l,stat:'crit'},
  // БЫЛО: *=1.25 (константа) → мультипликативно работало, но с неверной кривой
  // (множитель 1.25 каждый раз вместо +0.25*l). Теперь аддитивно: +0.25*l.
  {id:'pw3',name:'+25% боссам',cost:120,max:3,f:(l)=>P.bossMul=(P.bossMul||1)+0.25*l,stat:'boss'},
 ]},
 guard:{name:'🛡 Защита',nodes:[
  // БЫЛО: +=25 (константа) → 5 уровней давали только 25 HP. Теперь +=25*l.
  // v7.36: было +25*l (до +125). Потолок живучести опущен — см. 07-vs-numbers.md.
  {id:'gd1',name:'+12 макс. HP',cost:50,max:5,f:(l)=>{P.maxhp+=12*l;P.hp=P.maxhp;},stat:'hp'},
  // БЫЛО: +0.3 (константа) → все 3 уровня давали те же 0.3 регена. Теперь +0.15*l.
  {id:'gd2',name:'+0.15 реген/с',cost:100,max:3,f:(l)=>P.regen=(P.regen||0)+0.15*l,stat:'regen'},
  {id:'gd3',name:'+15% броня',cost:80,max:3,f:(l)=>P.armor=(P.armor||0)+0.15*l,stat:'armor'},
 ]},
 speed:{name:'⚡ Скорость',nodes:[
  {id:'sp1',name:'+12% бег',cost:50,max:5,f:(l)=>P.spd*=1+0.12*l,stat:'spd'},
  // БЫЛО: *=1.18 (константа) → все 3 уровня давали один и тот же буст.
  // Теперь *=1+0.18*l — кривая как у pw1/sp1.
  {id:'sp2',name:'+18% атака',cost:80,max:3,f:(l)=>P.rateMul*=1+0.18*l,stat:'rate'},
  {id:'sp3',name:'+25% подбор',cost:60,max:3,f:(l)=>P.pickup*=1+0.25*l,stat:'pickup'},
 ]},
 fate:{name:'🌟 Судьба',nodes:[
  // БЫЛО: *=1.3 (константа) → каждый уровень давал 30% сверху, что слишком сильно.
  // Теперь +0.3*l — аддитивно, мягче.
  {id:'ft1',name:'+30% XP',cost:60,max:4,f:(l)=>P.xpMul=(P.xpMul||1)+0.3*l,stat:'xp'},
  {id:'ft2',name:'+20% золото',cost:60,max:4,f:(l)=>P.goldMul=(P.goldMul||1)+0.2*l,stat:'gold'},
  // БЫЛО: +1 (константа) → 2 уровня давали 1 слот вместо 2. Теперь +l.
  {id:'ft3',name:'+1 слот реликвий',cost:200,max:2,f:(l)=>P.maxRelics=(P.maxRelics||3)+l,stat:'relicslot'},
 ]},
 watch:{name:'🏹 Дозор',nodes:[
  {id:'wa1',name:'+40 дальность лука',cost:70,max:4,f:(l)=>{P.bowRange=(P.bowRange||0)+40*l;},stat:'bowrange'},
  {id:'wa2',name:'+10% темп лука',cost:90,max:3,f:(l)=>{P.bowRate=(P.bowRate||1)*(1+0.10*l);},stat:'bowrate'},
  {id:'wa3',name:'Стартовый колчан',cost:150,max:1,f:(l)=>{if(l>0)P._metaStartBow=1;},stat:'startbow'},
 ]},
 storm:{name:'⚡ Гром',nodes:[
  {id:'st1',name:'+12% сила молний',cost:70,max:4,f:(l)=>{P.boltDmgMul=(P.boltDmgMul||1)*(1+0.12*l);},stat:'boltdmg'},
  {id:'st2',name:'Молнии чаще',cost:90,max:3,f:(l)=>{P.boltRateMul=(P.boltRateMul||1)*(1+0.12*l);},stat:'boltrate'},
  {id:'st3',name:'Искра Перуна',cost:150,max:1,f:(l)=>{if(l>0)P._metaStartBolt=1;},stat:'startbolt'},
 ]}
};
function openTree(){
 paused=true;
 document.getElementById('treeov').style.display='flex';
 const row=document.getElementById('treerow');row.innerHTML='';
 for(const k in TREE){
  const branch=TREE[k];
  const bdiv=document.createElement('div');
  bdiv.className='treebranch';
  bdiv.innerHTML=`<h3>${branch.name}</h3>`;
  branch.nodes.forEach(n=>{
   const lvl=tree[n.id]||0;
   const maxed=lvl>=n.max;
   const cost=n.cost*(lvl+1);
   const can=!maxed&&metaGold>=cost;
   const d=document.createElement('div');
   d.className='treenode'+(maxed?' maxed':(can?' can':' locked'));
   // v6.18: у узлов-открытий числа нет — вместо неё подпись, что именно откроется.
   const _hint=(typeof UNLOCK_HINT!=='undefined'&&UNLOCK_HINT[n.id])?`<p class="lvl" style="color:#9ad06a">${UNLOCK_HINT[n.id]}</p>`:'';
   d.innerHTML=`<h4>${n.name}</h4>${_hint}<p class="lvl">Ур. ${lvl}/${n.max}</p><div class="cost">${maxed?'МАКС':'◆ '+cost}</div>`;
   d.onclick=()=>{if(maxed||!can)return;metaGold-=cost;tree[n.id]=lvl+1;LS.set('cl_gold',metaGold);LS.set('cl_tree',JSON.stringify(tree));if(lvl+1>=n.max){achData.progress.treeMax=(achData.progress.treeMax||0)+1;LS.set('cl_ach',JSON.stringify(achData));}sfxUpgrade();openTree();};try{if(window.YA_SAVE)YA_SAVE();}catch(e){}   // Яндекс: облачный сейв
   bdiv.appendChild(d);
  });
  row.appendChild(bdiv);
 }
 document.getElementById('treecost').textContent=`Золото Заставы: ${metaGold} ◆`;
}
document.getElementById('btnTree').onclick=openTree;
// v6.19: вход в журнал из паузы. openJournal не трогает paused — пауза уже
// активна, оверлей #jourov ложится поверх и убирается кнопкой «Закрыть» (btnJourClose).
document.getElementById('btnJournal2').onclick=openJournal;
document.getElementById('btnTreeClose').onclick=()=>{closeOverlay('treeov');};
const _btr=document.getElementById('btnTreeReset');
if(_btr)_btr.onclick=()=>{
 let refund=0;
 for(const k in TREE){
  TREE[k].nodes.forEach(n=>{
   const lvl=tree[n.id]||0;
   for(let l=1;l<=lvl;l++)refund+=n.cost*l;
   tree[n.id]=0;
  });
 }
 metaGold=(metaGold||0)+refund;
 LS.set('cl_gold',metaGold);
 LS.set('cl_tree',JSON.stringify(tree));
 sfxUpgrade();
 openTree();
};
function applyTree(){
 for(const k in TREE)for(const n of TREE[k].nodes){
  const lvl=tree[n.id]||0;
  if(lvl>0)n.f(lvl);
 }
}

