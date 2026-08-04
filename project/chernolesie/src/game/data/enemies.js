// ============================================================
//  ВРАГИ (5 типов + разное AI поведение)
// ============================================================
const ETYPES={
  leshiy:{hp:5,spd:102,r:12,dmg:4,xp:1,col:'#3c5a2c',eye:'#8fff8a',size:1,weak:'elec',ai:'chase',dmgMod:1,desc:'Леший — хозяин леса'},
  volkolak:{hp:9,spd:128,r:10,dmg:5,xp:2,col:'#5a5a6a',eye:'#ffcf6a',size:1,weak:'frost',ai:'kamikaze',dmgMod:1,desc:'Волколак — оборотень'},
  kikimora:{hp:18,spd:77,r:14,dmg:6,xp:3,col:'#3a5a2a',eye:'#9ac06a',size:1.1,weak:'phys',ai:'shooter',dmgMod:1,desc:'Кикимора — болотная ведьма'},
  rusalka:{hp:4,spd:145,r:10,dmg:3,xp:1,col:'#4a8a9a',eye:'#8fd0ff',size:.85,weak:'frost',ai:'zigzag',dmgMod:1,desc:'Русалка — утопленница'},
  upyr:{hp:30,spd:68,r:24,dmg:10,xp:5,col:'#4a5a4a',eye:'#c14a3a',size:1.8,weak:'frost',ai:'tank',dmgMod:1.5,desc:'Упырь — оживший мертвец'},
  bognik:{hp:14,spd:85,r:18,dmg:7,xp:2,col:'#2c3420',eye:'#cfe86a',size:1.5,weak:'phys',ai:'chase',dmgMod:1.2,desc:'Болотник из Тёмной топи'},
  baba_yaga:{hp:520,spd:68,r:34,dmg:16,xp:0,col:'#4a2c4a',eye:'#c14a3a',size:2.6,weak:'elec',ai:'tank',dmgMod:1.6,desc:'Баба Яга — ведунья'},
  naviya:{hp:420,spd:111,r:28,dmg:14,xp:0,col:'#3a4a6a',eye:'#8fd0ff',size:2.4,weak:'frost',ai:'stalker',dmgMod:1.5,desc:'Навья — дух из Нави'},
  poludnitsa:{hp:30,spd:119,r:14,dmg:15,xp:3,col:'#ffd77d',eye:'#fff0b0',size:1.1,weak:'frost',ai:'zigzag',dmgMod:1.3,desc:'Полуденница — дух полудня'},
  vodyanoy:{hp:40,spd:77,r:20,dmg:9,xp:6,col:'#1f4a3a',eye:'#8fe8d0',size:1.6,weak:'phys',ai:'shooter',dmgMod:1.2,desc:'Водяной Хозяин — дед топей'},
  vedmaT:{hp:60,spd:68,r:22,dmg:11,xp:10,col:'#4a3560',eye:'#c78aff',size:1.7,weak:'frost',ai:'shooter',dmgMod:1.2,desc:'Ведьма Топи — кликуша мертвяков'},
  chashob:{hp:300,spd:60,r:32,dmg:16,xp:40,col:'#3a2c1a',eye:'#ffb347',size:2.5,weak:'frost',ai:'tank',dmgMod:1.6,desc:'Чащобный Хозяин — обугленный князь чащи'},
  vodianik:{hp:120,spd:60,r:30,dmg:14,xp:12,col:'#274a2a',eye:'#bfe8ff',size:2.2,weak:'elec',ai:'tank',dmgMod:1.5,desc:'Водяник — трезубец Тёмной топи'}
};
ETYPES.kikimora.drawH=72;
ETYPES.volkolak.drawH=58;
ETYPES.upyr.drawH=106;
ETYPES.leshiy.drawH=60;
ETYPES.rusalka.drawH=66;

