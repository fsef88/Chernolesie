let serpOrbs=[],serpOrbA=0;
const oberegWall={t:0,r:0};
const vihrStorm={x:0,y:0,r:0,t:0,dmg:0,hit:0};
let vervLinks=[];
// v6.19: Коса-эволюция стягивает скошенных к ногам (см. doKosa/tickWeaponState). Не новый рендер — точки рисуются в drawKosaTrail.
let kosaTrail=[];
function tickSerpOrbs(dt){
 serpOrbA+=dt*2.2;
 const n=serpOrbs.length;
 for(let i=0;i<n;i++){
  const o=serpOrbs[i];
  o.a=serpOrbA+i*(TAU/n);
  o.x=P.x+Math.cos(o.a)*(o.R||90);
  o.y=P.y-8+Math.sin(o.a)*(o.R||90)*0.72;
  o.cd-=dt;
  if(o.cd>0)continue;
  const list=enemiesNear(o.x,o.y,30);
  let any=false;
  for(const e of list){
   if(e.hp<=0||e.dying>0)continue;
   if(dist(e.x-o.x,e.y-o.y)>e.r+18)continue;
   hitEnemy(e,o.dmg||8,'phys',false);any=true;
  }
  if(any){o.cd=0.28;spawnParticle(o.x,o.y,rnd(-20,20),rnd(-20,20),0.2,'#ffd27a',0,0);}
 }
}
function drawSerpOrbs(){
 // v7.26: 100% Арт-ориентированная отрисовка Орбит Серпа / Ворона (RAVEN_ORB_ART)
 if(!serpOrbs.length)return;
 for(let i=0;i<serpOrbs.length;i++){
  const o=serpOrbs[i];if(o.x==null)continue;
  const sx=o.x-cam.x,sy=o.y-cam.y;
  ctx.save();ctx.translate(sx,sy);
  ctx.rotate(serpOrbA*3+i);
  ctx.globalAlpha=0.9;
  if(typeof RAVEN_ORB_ART !== 'undefined' && RAVEN_ORB_ART.complete && RAVEN_ORB_ART.naturalWidth){
   ctx.globalCompositeOperation='lighter';
   ctx.drawImage(RAVEN_ORB_ART, -16, -16, 32, 32);
  } else {
   ctx.strokeStyle='#ffd27a';ctx.lineWidth=2.4;
   ctx.beginPath();ctx.arc(0,0,9,0,TAU);ctx.stroke();
  }
  ctx.restore();
 }
}
function drawVihrStorm(){
 // v7.26: 100% Арт-ориентированная 8-кадровая отрисовка Вихря Сварога (VIHR_VORTEX_SHEET)
 if(vihrStorm.t<=0)return;
 const sx=vihrStorm.x-cam.x,sy=vihrStorm.y-cam.y,k=vihrStorm.t/vihrStorm.max;
 ctx.save();ctx.translate(sx,sy);
 ctx.rotate(time*3);
 ctx.globalAlpha=k*0.85;
 if(typeof VIHR_VORTEX_SHEET !== 'undefined' && VIHR_VORTEX_SHEET.complete && VIHR_VORTEX_SHEET.naturalWidth){
  ctx.globalCompositeOperation='lighter';
  // v7.35: петля идёт по кадрам 4-7, а не по всем восьми. Лист рисует полный
  // цикл — рождение, пик, затухание, — а смерч висит на земле постоянно:
  // прокрутка целиком заставляла его раз в цикл распадаться и собираться
  // заново на месте. Кадры 4-7 — устойчивая воронка, разница между ними даёт
  // вращение, а полного распада в кадре не случается.
  const LOOP0=3, LOOPN=4;
  const prog = (time * 3.0) % 1.0;
  const fIdx = LOOP0 + Math.min(LOOPN - 1, Math.floor(prog * LOOPN));
  const col = fIdx % 4, row = Math.floor(fIdx / 4);
  const sw = Math.floor(VIHR_VORTEX_SHEET.naturalWidth / 4);
  const sh = Math.floor(VIHR_VORTEX_SHEET.naturalHeight / 2);
  const drawSize = vihrStorm.r * 2.2;
  ctx.drawImage(VIHR_VORTEX_SHEET, col * sw, row * sh, sw, sh, -drawSize/2, -drawSize/2, drawSize, drawSize);
 } else {
  ctx.strokeStyle='#bfe8ff';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(0,0,vihrStorm.r,0,TAU);ctx.stroke();
 }
 ctx.restore();
}
// хуки, которые зовёт остальная игра
function onEnemyKilledW(x,y){
 kostiStacks=Math.min(40,kostiStacks+1);kostiT=3.0;
 TRIZNA_MARKS.push({x,y});
}
// v6.18: синергия «Отдарок» — полученный урон кормит и зерцало, и клюку сильнее.
function onPlayerHurtW(d){zercaloPool+=d*(P.synMirror?1.6:1);}
function onGemPickedW(){
 // v6.18: было «5 ступеней вместо 3». Ненасытность теперь снимает САМО правило:
 // голод не сбрасывается подбором — но начинает есть игрока (см. tickWeaponState).
 // Это конфликт, а не бонус: копить силу или подбирать опыт — решение каждую секунду.
 const w=weapons.find(x=>x.id==='golod');
 if(w&&w.evo)return;
 if(P.synHunger){golodT*=0.5;return;}   // синергия «Пустое чрево»: подбор лишь половинит голод
 golodT=0;
}

