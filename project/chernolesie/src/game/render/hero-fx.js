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
 spawnFlash(e.x,e.y,e.boss||e.elite?1:0,e.elite?'#ffcf6a':'#ffffff');
 for(let i=0;i<Math.floor(10*partMul);i++){
  const a=randomVisual()*TAU,sp=rnd(60,260);
  if(!spawnParticle(e.x,e.y-e.r*0.45,Math.cos(a)*sp,Math.sin(a)*sp-80,rnd(.28,.78),cols[i%cols.length],280,0))break;
 }
 // v7.34: крупный враг оседает столбом пыли. Мелочь его не получает —
 // при семидесяти убийствах в секунду экран забился бы дымом.
 // v10.1: столб пыли при гибели оставлен только для боссов и мини-боссов
 if((e.boss||e.mini)&&typeof DUST_PLUME_SHEET!=='undefined' ){
  const big=e.boss?4.2:(e.mini?3.0:(e.elite?2.2:1.5));
  spawnSheetFx(DUST_PLUME_SHEET,e.x,e.y+e.r*0.35,e.r*big*2.6,e.boss?0.9:0.6,'#d8cbb4',true);
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

// v7.35: РИСОВАННЫЕ КОДОМ ЖЕСТЫ КЛАССОВ УБРАНЫ.
//
//  Здесь у воина рисовались четыре концентрические дуги плюс белая кромка,
//  у знахарки — конус из трёх дуг и веер кристаллов, у воронника — две дуги
//  и штрихи. Всё окружностями и линиями поверх героя.
//
//  Удар при этом УЖЕ нарисован артом: базовый взмах кладёт запись в slashes,
//  а fx-layer рисует её листом класса — slash-anim-sheet у воина,
//  druid-wave-sheet у знахарки, rogue-slash-sheet у воронника. То есть код
//  добавлял третью отрисовку одного и того же удара поверх художественной
//  (вторая, drawWeaponTrails в glow-auras.js, вообще никем не вызывается).
//
//  Именно эти дуги были видны на скриншоте владельца как светящийся серп
//  вокруг героя. Договорённость простая: эффект рисует лист или не рисует
//  ничего. Функция оставлена пустышкой, чтобы не искать все места вызова.
function drawClassAttackFx(x,y){}

// ============================================================
//  BOGATYR V3 — Полностью переписанный герой
//  Маленький (35px), с гипертрофированными анимациями
// ============================================================

// Канон героя v5.1: один путь рисования.
// Раньше drawClassSilhouette вызывался в draw(), но не был определён —
// ReferenceError глотался frame try/catch и герой пропадал с экрана.
// ===== v5.38: ЖИВЫЕ ГЕРОИ — живописные спрайты (idle×2/walk×4/attack×2) =====
// ===== v5.51 HERO ANIM CONTROLLER (плавные клипы, приоритеты, лок анимаций) =====
