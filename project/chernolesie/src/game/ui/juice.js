// ============================================================
//  СПАВН (ЗА пределами экрана, не из ниоткуда)
//  Камера: cam.x/y = ЛЕВЫЙ-ВЕРХНИЙ угол экрана. Спавн ведём от ЦЕНТРА камеры
//  (cam.x + W/2, cam.y + H/2), иначе при упоре камеры в край мира
//  враг появлялся в центре экрана, потому что P.x уже уехал, а cam.x — нет.
// ============================================================
// ===== v5.47: СЕЧА = ВАЛЮТА (вехи ×10/×25/×50) =====
// v6.24: крупный титр. Один канал на все громкие события забега.
let _btTmr=null;
function bigText(main,sub,color){
 const el=document.getElementById('bigtext');
 if(!el)return;
 el.innerHTML='<div class="bt1">'+main+'</div>'+(sub?'<div class="bt2">'+sub+'</div>':'');
 if(color){const h=el.querySelector('.bt1');if(h)h.style.color=color;}
 el.classList.add('show');
 if(_btTmr)clearTimeout(_btTmr);
 _btTmr=setTimeout(()=>{el.classList.remove('show');},2400);
}
// v6.24 ВЕХИ МИНУТ. Забег на 30 минут шёл ровным полотном: сложность росла
// молча, и у игрока не было точек «я дожил досюда». Каждая минута теперь
// объявляется титром с нарастающей строкой — дешёвая, но честная лестница.
const MINUTE_LINES=['чаща шевелится','кровь позвала','мгла густеет','лес считает шаги',
 'корни просыпаются','тропы закрылись','тьма набирает вес','застава одна',
 'счёт пошёл на выдохи','старое смотрит в спину'];
let _minMark=0;
function minuteMark(){
 const m=Math.floor(time/60);
 if(m<=_minMark)return;
 _minMark=m;
 if(over||won||m<1)return;
 bigText(m+':00',MINUTE_LINES[(m-1)%MINUTE_LINES.length]);
 if(AC){
  const k=Math.min(1,m/20);
  tone(180+k*90,0.22,'triangle',0.13,320+k*180);
  setTimeout(()=>tone(280+k*140,0.28,'triangle',0.10),150);
 }
 vibe(28);
}
// v6.24 СЕРДЦЕБИЕНИЕ. Низкий HP показывался статичной красной рамкой —
// информация без эмоции. Пульс идёт и в глаз, и в динамик, и в ладонь,
// поэтому выживание на 10% ощущается как выживание, а не как число.
let _hbT=0;
function heartbeat(dt){
 const lowHp=P.maxhp>0&&P.hp>0&&P.hp/P.maxhp<0.25;
 // взвод клатча снимается только когда игрок ВЫЛЕЧИЛСЯ выше трети:
 // без запаса титр «на волоске» дёргался бы на каждом тике регена у черты
 if(P.hp/P.maxhp>0.34)_clutchArmed=false;
 if(UI.lowHpV){
  if(lowHp)UI.lowHpV.classList.add('crit');else UI.lowHpV.classList.remove('crit');
 }
 if(!lowHp){_hbT=0;return;}
 _hbT-=dt;
 if(_hbT>0)return;
 const frac=P.hp/P.maxhp;
 _hbT=0.45+frac*1.4;
 if(AC){
  tone(58,0.13,'sine',0.20);
  setTimeout(()=>tone(48,0.16,'sine',0.14),160);
 }
 vibe(14);
}
function comboMilestone(n){
 if(n===10){magnetT=1.8;flashScreen('#5adcff',0.22);spawnFlash(P.x,P.y,1,'#5adcff');if(typeof sfxPick==='function')sfxPick();log('🧲 Жадность Велеса — кристаллы летят к герою!','gold');}
 else if(n===25){
  const c=enemies.filter(e=>e.alive&&e.hp>0).map(e=>({e,d:dist2(e.x-P.x,e.y-P.y)})).filter(o=>o.d<=340*340).sort((a,b)=>a.d-b.d).slice(0,6);
  for(const o of c){hitEnemy(o.e,45*P.dmgMul,'bolt',true);spawnFlash(o.e.x,o.e.y,0.7,'#8fd0ff');for(let k=0;k<5;k++){const a=Math.random()*TAU,sp=rnd(60,180);spawnParticle(o.e.x,o.e.y,Math.cos(a)*sp,Math.sin(a)*sp,rnd(.2,.45),'#8fd0ff',-60,0);}}
  if(c.length){flashScreen('#8fd0ff',0.25);log('⚡ Разряд Перуна — поражено: '+c.length+'!','gold');}
 }
 // v6.17: веха ×50 больше не замедляет мир на 3с — вместо этого просто награда+флеш.
 else if(n===50){flashScreen('#b478ff',0.35);vibe(70);log('⏳ Мгла стынет — сеча ×50!','gold');}
 else if(n===100){flashScreen('#ffcf6a',0.45);vibe(100);log('☄ Сеча ×100!','gold');}
  else if(n===150){
   flashScreen('#5adcff',0.5);
   vibe(90);
   log('🌪 Буря поднимается — сеча ×150!','gold');
   const c=enemies.filter(e=>e.alive&&e.hp>0).sort((a,b)=>dist2(a.x-P.x,a.y-P.y)-dist2(b.x-P.x,b.y-P.y)).slice(0,12);
   for(const o of c){ hitEnemy(o, 80*P.dmgMul, 'elec', true); }
  }
  else if(n===250){
   flashScreen('#ff6a6a',0.55);
   vibe(110);
   log('⚡ Земля дрожит — великая жатва ×250! (+15% скорость)','warn');
   P.spd=(P.spd||150)*1.15;
  }
  else if(n===500){
   flashScreen('#ffd77d',0.65);
   vibe(130);
   magnetT=Math.max(magnetT,3.5);
   log('👑 Весь лес преклоняется — богатырская сеча ×500! (магнит)','gold');
  }
  else if(n===1000){
   flashScreen('#ff8a00',0.75);
   shake=Math.max(shake,8);
   vibe(160);
   P.hp=P.maxhp;
   log('☄ ТЫ — ВЛАДЫКА ЧЁРНОЛЕСЬЯ! (1000 сражённых — исцеление)','evo');
  }
}
