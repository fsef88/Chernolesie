// ===== v5.47: ЗНАМЕНИЯ (каждые ~90с, длится 20с) =====
function startOmen(){
 const ids=['moon','seed','rosha'];
 const id=ids[omen.count%3];omen.count++;
 omen.id=id;omen.t=20;omen.next=90;omen.seedT=0;omen.roshaT=0;
 omen.side=Math.floor(seedRandom()*4); // v5.64: было Math.random — ломало детерминизм Daily
 // v6.17: тряска убрана — камера трясётся только на боссах (флеш+лог остаются)
 if(id==='moon'){flashScreen('#ff3a3a',0.3);log('🔴 Знамение: КРАСНЫЙ МЕСЯЦ — твари льнут плотнее, опыт +30%','warn');}
 else if(id==='seed'){flashScreen('#c9b46a',0.25);log('🌬 Знамение: КОСТЯНОЙ СЕЯТЕЛЬ — волна с '+['востока','юга','запада','севера'][omen.side]+'!','warn');}
 else{flashScreen('#5affc9',0.22);log('💠 Знамение: ЩЕДРАЯ РОЩА — кристаллы цветут вокруг героя','gold');}
}
function tickOmen(dt){
 if(omen.id){
  omen.t-=dt;
  if(omen.id==='seed'){omen.seedT-=dt;if(omen.seedT<=0){omen.seedT=2.4;spawnOmenWave();}}
  else if(omen.id==='rosha'){omen.roshaT-=dt;if(omen.roshaT<=0){omen.roshaT=2.0;
   // v5.89: было Math.random/rnd — позиции гемов это геймплей (куда бежать за
   // опытом), и в Daily они расходились у игроков одного дня. Переводим на srnd.
   for(let i=0;i<3;i++){const a=srnd(0,TAU),r=srnd(120,230);spawnGem(clamp(P.x+Math.cos(a)*r,16,WORLD-16),clamp(P.y+Math.sin(a)*r,16,WORLD-16),1,'#5affc9',Math.cos(a)*40,Math.sin(a)*40-50);}}}
  if(omen.t<=0){omen.id=null;log('🌲 Лес выдохнул — знамение миновало.','gold');}
 }else{omen.next-=dt;if(omen.next<=0)startOmen();}
}
function spawnOmenWave(){
 spawnSideBias=omen.side;
 for(let i=0;i<6&&liveEnemies()<enemyCap(time)+10;i++)spawn(false);   // v5.65: волна знамения от текущего капа
 spawnSideBias=-1;
}
