// ============================================================
//  РЕЛИКВИИ
// ============================================================
const RELICS=[
 {id:'rune_dmg',name:'Руна ярости',icon:'🗡',desc:'+20% урон',apply:()=>{P.dmgMul*=1.2;}},
 {id:'rune_hp',name:'Руна жизни',icon:'❤',desc:'+40 макс. HP, лечение',apply:()=>{P.maxhp+=40;P.hp=Math.min(P.maxhp,P.hp+40);}},
 {id:'rune_spd',name:'Руна ветра',icon:'💨',desc:'+15% скорость',apply:()=>{P.spd*=1.15;}},
 {id:'rune_xp',name:'Руна мудрости',icon:'📜',desc:'+30% XP',apply:()=>{P.xpMul=(P.xpMul||1)*1.3;}},
 {id:'rune_luck',name:'Руна удачи',icon:'🍀',desc:'+15% шанс реликвий',apply:()=>{P.luck=(P.luck||0)+0.15;}},
 {id:'rune_shield',name:'Руна щита',icon:'🛡',desc:'+20% броня',apply:()=>{P.armor=(P.armor||0)+0.2;}},
];

