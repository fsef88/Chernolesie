const HERO_BATTLE={};
(function(){const mk=s=>{const i=new Image();i.src=s;return i};
 HERO_BATTLE.warrior=mk('@@A:art/hero-fx/hero-battle.webp@@');
 HERO_BATTLE.druid=mk('@@A:art/hero-fx/hero-battle-2.webp@@');
 HERO_BATTLE.shaman=mk('@@A:art/hero-fx/hero-battle-3.webp@@');
 HERO_BATTLE.rogue=mk('@@A:art/hero-fx/hero-battle-4.webp@@');
 HERO_BATTLE.archer=mk('@@A:art/hero-fx/hero-battle-5.webp@@');
 HERO_BATTLE.ognevik=mk('@@A:art/hero-fx/hero-battle-6.webp@@');
 HERO_BATTLE.groznik=mk('@@A:art/hero-fx/hero-battle-7.webp@@');
})();
function drawHeroMedallion(x,y,flip){
 const id=currentClass||'warrior';
 const im=HERO_BATTLE[id]||HERO_BATTLE.warrior;
 const cv=CLASS_VISUALS[id]||CLASS_VISUALS.warrior;
 // дыхание/походка/встряска при уроне — анимация живого жетона
 const hurt=Math.max(0,P.hurtT||0);
 const breathe=Math.sin(time*2.0)*0.8; // soft idle
 const bob=P.moving?Math.abs(Math.sin(HA.phase*TAU))*0.9:breathe;
 const tilt=P.moving?Math.sin(HA.phase*Math.PI*4)*0.06:0;
 const lunge=(P.atk>0&&!P.moving?Math.sin(Math.min(1,P.atk/heroAtkDur())*Math.PI)*4:0); // v5.50: рывок корпуса не на бегу
 const shake=(hurt>0?Math.sin(time*90)*Math.min(1,hurt*4)*2.2:0);
 const H=84,Wh=84;
 ctx.save();
 ctx.translate(x+shake,y-bob);
 if(flip)ctx.scale(-1,1);
 ctx.rotate(tilt+(flip?-1:1)*0.0);
 // классовое свечение за жетоном (мягкое дыхание огня заставы)
 // v6.67: внутреннее свечение убрано — двойной shadowBlur давал грязное размытие
 ctx.drawImage(im,-Wh/2-lunge*(flip?-1:1)*0,-H+16,Wh,H);
 ctx.restore();
 // вспышка урона — красная по кругу жетона
 if(hurt>0){const hf=Math.min(1,hurt*4)*0.4;ctx.save();ctx.globalAlpha=hf;ctx.fillStyle='#ff4a33';ctx.beginPath();ctx.arc(x+shake,y-bob-H/2+16,H*0.46,0,7);ctx.fill();ctx.restore();}
}

function spawnDeathBurst(e){
 // Материальная смерть по типу врага: дерево/тень/болото/босс. Только VFX, без механики.
 let cols=['#7a2412','#6a4a28','#8fd06a'],soul='#bfe08a';
 if(e.type==='volkolak'||e.type==='rusalka'||e.type==='naviya'){cols=['#1b2030','#6f5aa0','#b478ff'];soul='#c9ffe0';}
 else if(e.type==='bognik'){cols=['#405020','#9ac06a','#cfe86a'];soul='#cfe86a';}
 else if(e.type==='baba_yaga'||e.type==='leshiy'){cols=['#6a4a28','#7fb04a','#bfe08a'];soul='#8aff5a';}
 else if(e.boss||e.elite){cols=['#ffaa44','#7a241a','#b478ff'];soul='#ffcf6a';}
 for(let i=0;i<Math.floor(10*partMul);i++){
  const a=randomVisual()*TAU,sp=rnd(60,260);
  if(!spawnParticle(e.x,e.y-e.r*0.45,Math.cos(a)*sp,Math.sin(a)*sp-80,rnd(.28,.78),cols[i%cols.length],280,0))break;
 }
 // Душа/искры вверх — награда глазу за убийство
 for(let i=0;i<3;i++){spawnParticle(e.x+rnd(-12,12),e.y-e.r*0.9,rnd(-12,12),rnd(-180,-100),rnd(.5,.95),soul,-60,0);}
}


// ============================================================
// v5.5 W: Final Bogatyr sprite renderer удалён (getFinalHeroFrame/drawFinalHero*).
// ============================================================
//  NEW BOGATYR — Процедурные герои с классовой идентичностью
//  Визуально: узнаваем за 0.5 сек на мобильном, есть характер
//  Технически: <0.8ms, использует трансформации canvas
// ============================================================

// Конфигурация классов — уникальные силуэты
const BOGATYR_CONFIG = {
  // v5.7 Канон: силуэт класса читается за 0.3с
  warrior: {
    bodyW: 32, bodyH: 48, headR: 11.5,
    shoulderW: 40, hasShield: true, weapon: 'sword',
    helmet: 'helm', desc: 'Ратник заставы',
    bodyColor: '#2c1c10', armorColor: '#7a5230',
    cloakColor: '#5a2018', trimColor: '#c9a04a',
    weaponColor: '#d8d0c0', scale: 0.42
  },
  druid: {
    bodyW: 26, bodyH: 52, headR: 10.5,
    shoulderW: 34, hasShield: false, weapon: 'staff',
    helmet: 'crown', desc: 'Хранитель чащи',
    bodyColor: '#1e2c18', armorColor: '#3d5c32',
    cloakColor: '#2a4030', trimColor: '#9ac06a',
    weaponColor: '#8a6a3a', scale: 0.42
  },
  shaman: {
    bodyW: 28, bodyH: 50, headR: 10.5,
    shoulderW: 36, hasShield: false, weapon: 'totem',
    helmet: 'hood', desc: 'Шаман молний',
    bodyColor: '#1a1830', armorColor: '#3a2860',
    cloakColor: '#241838', trimColor: '#8fd0ff',
    weaponColor: '#6a3a8a', scale: 0.42
  },
  rogue: {
    bodyW: 22, bodyH: 42, headR: 9.5,
    shoulderW: 28, hasShield: false, weapon: 'daggers',
    helmet: 'hood', desc: 'Ночной охотник',
    bodyColor: '#12141c', armorColor: '#222836',
    cloakColor: '#1a1028', trimColor: '#b478ff',
    weaponColor: '#a0d0e0', scale: 0.40
  },
  archer: {
    bodyW: 25, bodyH: 46, headR: 10.5,
    shoulderW: 31, hasShield: false, weapon: 'bow',
    helmet: 'cap', desc: 'Стрелок леса',
    bodyColor: '#1e2414', armorColor: '#3a4a28',
    cloakColor: '#2a3818', trimColor: '#9ac06a',
    weaponColor: '#6a4a20', scale: 0.41
  },
  ognevik: {
    bodyW: 27, bodyH: 50, headR: 10.5,
    shoulderW: 35, hasShield: false, weapon: 'staff',
    helmet: 'crown', desc: 'Живое пламя заставы',
    bodyColor: '#2c1408', armorColor: '#5a2810',
    cloakColor: '#38180a', trimColor: '#ff8a3c',
    weaponColor: '#ffa53a', scale: 0.42
  },
  groznik: {
    bodyW: 28, bodyH: 50, headR: 10.5,
    shoulderW: 37, hasShield: false, weapon: 'totem',
    helmet: 'crown', desc: 'Витязь грозы',
    bodyColor: '#101c30', armorColor: '#27405e',
    cloakColor: '#14202c', trimColor: '#a8ccff',
    weaponColor: '#9ab8d8', scale: 0.42
  }
};

function drawClassAttackFx(x,y){
 if(!(P.atk>0||P.specialFx>0))return;
 const id=currentClass,cv=CLASS_VISUALS[id]||CLASS_VISUALS.warrior;
 const cfg = BOGATYR_CONFIG[id] || BOGATYR_CONFIG.warrior;
 ctx.save();ctx.translate(x,y-18);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.8;
 ctx.strokeStyle=cv.accent;ctx.fillStyle=cv.color;ctx.lineWidth=2.5;
 
 // Классовые атаки — уникальные для каждого класса
 if(id==='archer'){
   // v6.45 ДОЗОРНЫЙ: жест был жёстко вправо (moveTo(8,-2) -> lineTo(62,-2))
   // независимо от того, куда смотрит герой. Теперь тетива и стрела идут
   // по направлению взгляда, добавлен росчерк полёта.
   const arrowP=Math.min(1,(P.atk||0)/heroAtkDur());
   const ang=Math.atan2(P.fy||0,P.fx||1);
   ctx.save();ctx.rotate(ang);
   ctx.globalAlpha=0.9;
   ctx.beginPath();ctx.arc(16,0,30*(1-arrowP*0.28),-1.02,1.02);ctx.stroke();  // дуга лука
   ctx.lineWidth=1.4;ctx.globalAlpha=0.55;                                    // тетива
   ctx.beginPath();
   ctx.moveTo(16+Math.cos(-1.02)*30,Math.sin(-1.02)*30);
   ctx.lineTo(10-14*arrowP,0);
   ctx.lineTo(16+Math.cos(1.02)*30,Math.sin(1.02)*30);
   ctx.stroke();
   ctx.lineWidth=2.6;ctx.globalAlpha=0.95*arrowP;                             // древко
   ctx.beginPath();ctx.moveTo(14+52*arrowP,0);ctx.lineTo(40+78*arrowP,0);ctx.stroke();
   ctx.globalAlpha=0.5*arrowP;ctx.lineWidth=1.2;                              // росчерк полёта
   for(let i=0;i<3;i++){
    const yy=(i-1)*3.2;
    ctx.beginPath();ctx.moveTo(12+40*arrowP,yy);ctx.lineTo(34+62*arrowP,yy*0.4);ctx.stroke();
   }
   ctx.restore();
 } else if(id==='shaman'){
   // v6.45 ШАМАН: три зигзага шли строго вниз-вправо от плеча и висели на месте.
   // Теперь разряд бьёт по направлению взгляда, с ветвлением.
   const kk=Math.min(1,(P.atk||0)/heroAtkDur());
   const ang=Math.atan2(P.fy||0,P.fx||1);
   ctx.save();ctx.rotate(ang);
   for(let i=0;i<3;i++){
    const ph=time*14+i*2.1, spread=(i-1)*0.32;
    ctx.globalAlpha=(0.85-i*0.18)*(0.35+0.65*kk);
    ctx.lineWidth=3.0-i*0.7;
    ctx.beginPath();ctx.moveTo(10,0);
    let rr=10,aa=spread;
    for(let j=0;j<5;j++){
     rr+=(12+j*3)*(0.6+0.4*kk);
     aa=spread+Math.sin(ph+j*1.7)*0.22;
     ctx.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr);
    }
    ctx.stroke();
   }
   ctx.globalAlpha=0.8*kk;ctx.fillStyle=cv.accent;                            // искры на конце
   for(let i=0;i<4;i++){
    const aa=(i-1.5)*0.3+Math.sin(time*9+i)*0.1, rr=52+((i*31)%9)/9*22;
    ctx.beginPath();ctx.arc(Math.cos(aa)*rr,Math.sin(aa)*rr,1.6+((i*13)%5)/5*1.4,0,TAU);ctx.fill();
   }
   ctx.restore();
 } else if(id==='druid'){
   // v6.45 ЗНАХАРКА. Было: идеальная окружность r=42 плюс 6 лучей строго через
   // 60° — это язык ПРИЦЕЛА из шутера, а не удара (жалоба игрока по скриншоту:
   // «круг вокруг не очень»). Симметричная фигура с равными засечками читается
   // как элемент интерфейса и вдобавок обводила героя ровно по контуру.
   // Канон рогаликов: жест направлен туда, куда смотрит герой, форма рваная,
   // симметрии нет. Делаем МОРОЗНЫЙ ВЫДОХ — конус инея вперёд.
   const kk=Math.min(1,(P.atk||0)/heroAtkDur());
   const ang=Math.atan2(P.fy||0,P.fx||1);
   ctx.save();ctx.rotate(ang);
   // конус стужи: три дуги разной длины, раскрываются от героя
   for(let i=0;i<3;i++){
    const rr=26+i*13+kk*16, sp=0.95-i*0.16;
    ctx.globalAlpha=0.75*(1-i*0.22)*(0.35+0.65*kk);
    ctx.lineWidth=3.2-i*0.7;
    ctx.beginPath();ctx.arc(0,0,rr,-sp,sp);ctx.stroke();
   }
   // кристаллы инея вылетают вперёд веером — с разбросом, без симметрии
   ctx.globalAlpha=0.9*kk;ctx.fillStyle=cv.accent;
   for(let i=0;i<7;i++){
    const sp2=(((i*37)%11)/11-0.5)*1.5;              // детерминированный разброс
    const d=30+((i*29)%13)/13*40+kk*22;
    const sx=Math.cos(sp2)*d, sy=Math.sin(sp2)*d*0.75;
    const sz=1.6+((i*17)%7)/7*2.2;
    ctx.beginPath();
    ctx.moveTo(sx,sy-sz*1.7);ctx.lineTo(sx+sz,sy);
    ctx.lineTo(sx,sy+sz*1.7);ctx.lineTo(sx-sz,sy);
    ctx.closePath();ctx.fill();
   }
   ctx.restore();
 } else if(id==='rogue'){
   // v6.45 ВОРОННИК: две дуги были СИММЕТРИЧНЫ относительно героя (15 и -15) —
   // получался «бантик» вокруг, а не удар. Теперь скрещенный выпад вперёд.
   const kk=Math.min(1,(P.atk||0)/heroAtkDur());
   const ang=Math.atan2(P.fy||0,P.fx||1);
   ctx.save();ctx.rotate(ang);
   for(let i=0;i<2;i++){
    const sgn=i?1:-1, off=0.55*sgn;
    ctx.globalAlpha=0.85*(0.3+0.7*kk);ctx.lineWidth=3;
    ctx.beginPath();
    ctx.arc(14,0,34+kk*10,-0.9+off,0.5+off);ctx.stroke();
   }
   // теневой шлейф: короткие штрихи вдоль удара
   ctx.globalAlpha=0.55*kk;ctx.lineWidth=1.6;
   for(let i=0;i<5;i++){
    const yy=(((i*23)%9)/9-0.5)*34;
    ctx.beginPath();ctx.moveTo(18+i*4,yy);ctx.lineTo(40+i*7+kk*18,yy*0.6);ctx.stroke();
   }
   ctx.restore();
 } else {
   // v6.45 ВОИН: две концентрические дуги вокруг тела читались как ореол.
   // Теперь один широкий взмах в сторону взгляда + шлейф, как у меча.
   const kk=Math.min(1,(P.atk||0)/heroAtkDur());
   const ang=Math.atan2(P.fy||0,P.fx||1);
   ctx.save();ctx.rotate(ang);
   for(let g=3;g>=0;g--){                             // шлейф: копии со сдвигом
    const off=g*0.16*(1-kk);
    ctx.globalAlpha=(0.85-g*0.19)*(0.3+0.7*kk);
    ctx.lineWidth=(4.5-g*0.9);
    ctx.beginPath();ctx.arc(6,-6,42+kk*8,-1.15-off,1.0-off);ctx.stroke();
   }
   // белая кромка клинка — самый яркий слой
   ctx.globalAlpha=0.95*kk;ctx.strokeStyle='#fff7d0';ctx.lineWidth=1.8;
   ctx.beginPath();ctx.arc(6,-6,42+kk*8,-0.85,0.7);ctx.stroke();
   ctx.restore();
 }
 ctx.restore();
}

// ============================================================
//  BOGATYR V3 — Полностью переписанный герой
//  Маленький (35px), с гипертрофированными анимациями
// ============================================================

// Канон героя v5.1: один путь рисования.
// Раньше drawClassSilhouette вызывался в draw(), но не был определён —
// ReferenceError глотался frame try/catch и герой пропадал с экрана.
// ===== v5.38: ЖИВЫЕ ГЕРОИ — живописные спрайты (idle×2/walk×4/attack×2) =====
// ===== v5.51 HERO ANIM CONTROLLER (плавные клипы, приоритеты, лок анимаций) =====
