function fmt(t){const m=Math.floor(t/60),s=Math.floor(t%60);return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');}


// ============================================================
//  VISUAL POLISH V1 — HERO/VFX HELPERS
// ============================================================
// v5.88: CLASS_ANIM объявлен пустым и не читается нигде — оставлен как задел,
// помечен, чтобы не искать его смысл в следующий раз.
// v5.88: CLASS_ANIM больше не используется — кадровая анимация героя
// идёт через HERO_LAYOUT/heroAnimSeq. Оставлено как задел; не удалять.
const CLASS_ANIM={};
const CLASS_ART={};
CLASS_ART.ognevik=(function(){const i=new Image();i.src='@@A:art/icons/class-art.webp@@';return i})();
CLASS_ART.groznik=(function(){const i=new Image();i.src='@@A:art/icons/class-art-2.webp@@';return i})();
// ============================================================
//  v5.16 ART — живописные портреты-медальоны классов
// ============================================================
(function(){const mk=s=>{const i=new Image();i.src=s;return i};
 CLASS_ART.warrior=mk('@@A:art/icons/class-art-3.webp@@');
 CLASS_ART.druid=mk('@@A:art/icons/class-art.jpg@@');
 CLASS_ART.shaman=mk('@@A:art/icons/class-art-4.webp@@');
 CLASS_ART.rogue=mk('@@A:art/icons/class-art-5.webp@@');
 CLASS_ART.archer=mk('@@A:art/icons/class-art-6.webp@@');
})();
// Живописные иконки оружий и рун (вместо SVG там, где есть арт)
const PAINTED_ICONS={
 boot:'@@A:art/icons/painted-icons.jpg@@',
 heart:'@@A:art/icons/nnjxqfpawnpjqa2lnsxpy0alsxpy0saap.jpg@@',
 bag:'@@A:art/icons/bfb8stabgmy5tu5ojkk83gu1pbzlynlbjx9zrfxpy0zgozlxay7v1dekvrpmntluvqqg9m4gqzynyk6bgnxrqagyzdps6xfsxtpy11cwlnsxpy0is0tlgnxoqm0s6wnlghcwlpy0sael.jpg@@',
 shield:'@@A:art/icons/jy9txzpu4yyfsc2kjuidawlyfsaaccdatgw2wadawlyfsabypatgwwaf.jpg@@',
 eye:'@@A:art/icons/yj4gm8amaamvhsfcm9ho0y0y0xwm6ngngnaadjpcamaadroxoxoanjpcamaap.jpg@@',
 sun:'@@A:art/icons/nqnbpegtrpq17qoosixmp596ulz2mtxhedgwdkb8kjamflflfpaa4esstyys0qwkwk9nkwavlflfeiqvlflfeiqwkwkziie.jpg@@',
 elec:'@@A:art/icons/fvwzjtzs1hqvrjzstmtz6lltuwm17jtxvzxrijok7odix4ydk6x1fksekutraamblr2ad04qgdfefxvfdw4r1womk8uyqwudyspyncwzrriu4q0icooxriiekkmuyohcjngkmuqhniijfhwie.jpg@@',
 serp:'@@A:art/icons/tqnhxxl6nnfuk81qjp614xriigdnfgkmvibmjvrijfabmijfgnqadnfgkmuaffgkmuaf.jpg@@',
 kosa:'@@A:art/icons/uxl.jpg@@',
 ugli:'@@A:art/icons/by5gcaewgh8kgkmjusrxp.jpg@@',
 kamen:'@@A:art/icons/gh3b9zpy40bygjfva6dx0gidqkmeql8yolarsyby9h8d4h201py0saebsqte6wdc13gljuuszrmu40saii5ruljsxqkl.jpg@@',
 obereg:'@@A:art/icons/n0tgjbhcowpvimszu4ispwprjj3uccvhwwrb4zaiofhwx22jjoyv8lctisrywfbctist.jpg@@',
 zov:'@@A:art/icons/zlryt6quesap2dsxvivsonpctzq3fjot0txbjhw4srueqlhjneawkwksytfmlsxsxukizspypyqsrdavlhnlfssf.jpg@@',
 kolokol:'@@A:art/icons/m1hsxt4qgo1lnlflfacpususuakl2pypyoavkliligd.jpg@@',
 verv:'@@A:art/icons/kit.jpg@@',
 idol:'@@A:art/icons/zci3ziir5pp8ajhqe9bwfuvluvluvkpuk5nfimq4amcviufeyei4je2fluepumbicfduclszmo9dfdfujw2j27gzqoyoyroaoumumuafqo8ukap.jpg@@',
 navi:'@@A:art/icons/lf9tomck5j15jtx00smotqjj5hkblknwovca8xqgpntuxqy0atu1mbamnae1ntgpjqb.jpg@@',
 rosa:'@@A:art/icons/zidc9gngnsqgjjrj76maadojrjrjqaz0mlxoxoam6ngngnacauamamaap.jpg@@',
 vihr:'@@A:art/icons/iffbk2cw52wlhhbwi12xpdlihclknskbzusfws54h8ql9flcvnmlgca2lpo4ohiwlorjaa2wmcqniitfftqh4gezqjz5yzofgkdwgsbnjrrqauasiigbtsuuuafflijfabrijboxqae0llijfabrrijfabmijfgkadnfgkmuaffgn6muagakmuy3oadrrijfabrrijfabmijfgkacijfgdigaooxrigbkkxfligd.jpg@@',
 klyuka:'@@A:art/icons/dgwgsbxxwsk2fbekixjgbbyvsssywszthwxjj.jpg@@',
 zerno:'@@A:art/icons/eqkzo7zdix9sc6ljrssbbiculry84dboa241txnmtzupkxoetxptoy0ma1argfljjxkgddqxoy1apa6ghjqxqklmu6gndgoov.jpg@@',
 kosti:'@@A:art/icons/rxq9jt6bjpsnczj4hbwajypmvykdtajs7ncfpwudiuoxcnmkedxst1avdrnemuyopig2wpamuyrpwtnhwjflg0ajrmjfgkacijfligbkm0yoxqauuyoxqb.jpg@@',
 upyr:'@@A:art/icons/m4fot8v2xvxwc1ztvlfhyl7j8ht15x50upokwsnjuo5jrxsxsxwpaia5xcuscuaklsxsxqbyu0sv3fah.jpg@@',
 zercalo:'@@A:art/icons/qjltk9of2doy0ajgochsgwvd6mokdfltclzmz33h5fzwppufihimrpxjwieqkpcsgafdfdftiaozoyoyoafchihigaum0mumuachqxqxqb.jpg@@',
 sopel:'@@A:art/icons/ggskkqaiu5ezz98a4kenc6saueo3lhun0i0ul745ffc1ptuajc3vcklvzmo5hsam6q9fda651mk9xmxeruzsbzpvqhjt6etnv4iwctzg0tpjty0ccls0safgpjg0s6wnlgpjfpawnlgpjp.jpg@@',
 trizna:'@@A:art/icons/qku1dn5f2yyjnystxruvfxacvujcxzl7pip5rsmnbyvjgjwgblkuj3svhyvsk2olsv8lcthwxfeslcthwxfesiyvsk2iov.jpg@@',
 golod:'@@A:art/icons/kkzbwkdkjaqeugtnq3fonozi20nog2uhagevsodfgkngjcoyisqze7orcw4ve4ts1hqvhjrz3oxxcu0wcooxrigaooxrjigaooxrigazrrijfah.jpg@@',
 sword:'@@A:art/icons/cg5p21g93dlnsi.jpg@@',
 bow:'@@A:art/icons/c5o85zj5znpwcuf.jpg@@',
 bolt:'@@A:art/icons/tzmvyc3eem25.jpg@@',
 phys:'@@A:art/icons/xroc.jpg@@',
 pois:'@@A:art/icons/h1emsiccx9s.jpg@@',
 frost:'@@A:art/icons/wdmcftjzi9imum.jpg@@',
 void:'@@A:art/icons/vumnacnse9fzsijkw9i7q06zn6jn5dec0pqdk3.jpg@@',
 star:'@@A:art/icons/vy5hg0lpgz0oflgmbtkvlqzo0qyqe0nb9om3heipzjeo0y8pr5xdelc7enr84xeqiuc695v0hjwxw4ewepqmkktc3w63n.jpg@@',
 dar:'@@A:art/icons/s8ugjyngwwkltkjqfnqdziu9xp.jpg@@'
};
// Художественная иконка, если есть; иначе — SVG из ICONS
// v7.9: Студийный маппинг иконок оружия и реликвий из ICONS_ART_SHEET (3 колонки x 2 строки)
function iconPaint(ic){
  const s=PAINTED_ICONS[ic];
  if(s) return '<img class="pk" src="'+s+'" alt="">';
  if(typeof ICONS_ART_SHEET !== 'undefined' && ICONS_ART_SHEET.src){
    const map = {
      sword: [0, 0], bolt: [106, 0], pois: [212, 0],
      frost: [0, 160], void: [106, 160], dar: [212, 160], star: [212, 160]
    };
    const [posW, posH] = map[ic] || [0, 0];
    const bgPos = `${posW === 0 ? '0%' : posW === 106 ? '50%' : '100%'} ${posH === 0 ? '0%' : '100%'}`;
    return `<div class="relic-icon-sprite" style="width:34px;height:34px;border-radius:8px;box-shadow:0 0 10px rgba(255,207,106,.4);background-image:url('${ICONS_ART_SHEET.src}');background-size:300% 200%;background-position:${bgPos};display:inline-block;vertical-align:middle;"></div>`;
  }
  return ICONS.get(ic);
}
// Мини-портрет класса для HUD-чипа и экрана итогов
function classTiny(id){const i=CLASS_ART[id];return i&&i.src?'<img class="minip" src="'+i.src+'" alt="">':'';}
// v5.17 — медальоны божеств
// v7.39: переход на webp с прозрачным фоном (белые квадраты на тёмном фоне при jpg)
const PAINTED_BOONS={
 veles:'@@A:art/icons/boon-veles.webp@@',
 morana:'@@A:art/icons/boon-morana.webp@@',
 perun:'@@A:art/icons/boon-perun.webp@@',
 yarilo:'@@A:art/icons/boon-yarilo.webp@@',
 mokosh:'@@A:art/icons/boon-mokosh.webp@@'
};
const BOON_COLORS={veles:'#6ce0c0',morana:'#bfe0ff',perun:'#8fd0ff',yarilo:'#ffcf6a',mokosh:'#a8d06a'};
function boonArt(id){const s=PAINTED_BOONS[id];return s?'<img class="boonmed" src="'+s+'" alt="">':'';}
function boonMini(id){const s=PAINTED_BOONS[id];return s?'<img class="minip" src="'+s+'" alt="">':'';}
// v5.19 — медальоны проклятий
const PAINTED_CURSES={
 blind:'@@A:art/icons/painted-curses.jpg@@',
 famine:'@@A:art/icons/mgdgnsp8dorxqpd58inb2od4csveofrhsjnqok9qegqtpbce68zprhg8yr8lxvp.webp@@',
 glass:'@@A:art/icons/ks8eqzd3yeiym1husznjnqvqzcqjku5y2ainsgkodowtdooilqtqixmfkqsihgaaaa.jpg@@',
 time:'@@A:art/icons/crpgvxrcmvlgceds5wokicrriwlt7yhcw4cwoeeszkvecbdhxzbinsydgx0geilvcobnnbq3nvgjejhbvhdlowbaibhwjacmcx9ndicxyjngxmbptvzh67rjj1wpzwgff6dj2rvrefagwrp5ya4prljhawwkhsewebu3ossxdmqk2txgcb3d7yunp6x5hmsemhi2d5zhg5jfsnfocutsw0h1kcgt0z.webp@@'
};
function curseMini(id){const s=PAINTED_CURSES[id];return s?'<img class="minip cminip" src="'+s+'" alt="">':'';}


// ============================================================
//  v5.15 ICONOSTAS — единая SVG-иконография (без emoji в бою)
// ============================================================
const ICONS=(function(){
 const S=(body,vb='0 0 48 48')=>'<svg viewBox="'+vb+'" aria-hidden="true" width="48" height="48">'+body+'</svg>';
 const st='fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
 const fl='fill="currentColor"';
 const map={
  // classes / seals
  warrior: S('<path '+st+' d="M24 6 28 18h12l-10 8 4 12-10-7-10 7 4-12-10-8h12z"/><path '+st+' d="M24 22v14"/>'),
  druid: S('<path '+st+' d="M24 4v40M8 14l32 20M8 34l32-20"/><circle '+st+' cx="24" cy="24" r="6"/>'),
  shaman: S('<path '+st+' d="M26 4 12 26h10L18 44 36 20H26z"/>'),
  rogue: S('<path '+st+' d="M14 10c8-6 20-2 22 8 2 12-10 22-22 18"/><path '+st+' d="M18 20h12M20 28h8"/><circle '+fl+' cx="30" cy="18" r="1.8"/>'),
  archer: S('<path '+st+' d="M10 24c8-14 20-14 28 0-8 14-20 14-28 0z"/><path '+st+' d="M8 24h32M34 18l6 6-6 6"/>'),
  seal_warrior: S('<circle '+st+' cx="24" cy="24" r="16"/><path '+st+' d="M24 10v20M16 18l8 12 8-12"/>'),
  seal_druid: S('<circle '+st+' cx="24" cy="24" r="16"/><path '+st+' d="M24 8v32M10 18l28 12M10 30l28-12"/>'),
  seal_shaman: S('<circle '+st+' cx="24" cy="24" r="16"/><path '+st+' d="M26 12 16 28h8l-4 12 14-16h-8z"/>'),
  seal_rogue: S('<circle '+st+' cx="24" cy="24" r="16"/><path '+st+' d="M18 16c6-4 14 0 14 8s-8 12-14 8"/><path '+st+' d="M22 24h10"/>'),
  seal_archer: S('<circle '+st+' cx="24" cy="24" r="16"/><path '+st+' d="M12 24c6-10 18-10 24 0-6 10-18 10-24 0z"/><path '+st+' d="M10 24h28"/>'),
  seal_ognevik: S('<circle '+st+' cx="24" cy="24" r="16"/><path '+st+' d="M24 12c3.4 4.4-4.6 7.4-1.8 12.4 1.2 2.2 3.6 2.8 5 1.2 2.6-3-1-6.2 1.5-10.4 2.4 3.2 3.9 6.8 2 10-1.4 2.5-4.7 3-6.9 1.4-2.9-2.1-2.3-11 0.2-14.6z"/>'),
  ognevik: S('<path '+st+' d="M24 8c4 5-5.4 8.6-2.1 14.6 1.4 2.6 4.3 3.3 5.9 1.4 3-3.5-1.2-7.3 1.8-12.2 2.8 3.8 4.6 8 2.4 11.8-1.7 2.9-5.6 3.6-8.2 1.6C20.4 22.6 21.2 12.2 24 8z"/>'),
  seal_groznik: S('<circle '+st+' cx="24" cy="24" r="16"/><path '+st+' d="M10 34 30 14"/><path '+st+' d="M30 14l6 2-2-6z"/><path '+st+' d="M26 8l-6 8h6l-4 8 10-10h-6z"/>'),
  groznik: S('<path '+st+' d="M8 38 36 10"/><path '+st+' d="M36 10l4 8-8-4 8-6z"/><path '+st+' d="M20 18l-6 6h6l-4 8 10-8h-6z"/>'),
  // weapons
  sword: S('<path '+st+' d="M14 34 30 18"/><path '+st+' d="M28 16l6-6 4 4-6 6"/><path '+st+' d="M12 36l8-2-6-6z"/><path '+st+' d="M18 30l4 4"/>'),
  bow: S('<path '+st+' d="M12 10c12 4 12 24 0 28"/><path '+st+' d="M12 10c2 8 2 20 0 28"/><path '+st+' d="M10 24h26M30 18l8 6-8 6"/>'),
  bolt: S('<path '+st+' d="M26 4 10 26h11L17 44 38 18H25z"/>'),
  // card tags + generic upgrades
  phys: S('<path '+st+' d="M10 38 28 20m-4 0 6-6 10 10-6 6M8 40l9-2-7-7z"/><path '+st+' d="M30 8l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>'),
  elec: S('<path '+st+' d="M28 4 11 27h11l-3 17 18-25H26z"/>'),
  pois: S('<path '+st+' d="M24 5 43 40H5z"/><circle '+st+' cx="24" cy="29" r="3"/><path '+st+' d="M24 15v8"/>'),
  frost: S('<path '+st+' d="M24 5v38M7.5 14.5l33 19M7.5 33.5l33-19M15 8l9 5 9-5M15 40l9-5 9 5"/>'),
  void: S('<path '+st+' d="M24 4 42 14v20L24 44 6 34V14z"/><circle '+st+' cx="24" cy="24" r="7"/>'),
  dar: S('<path '+st+' d="m24 4 4 14 14 6-14 4-4 16-4-16-14-4 14-6z"/>'),
  heart: S('<path '+st+' d="M24 40s-14-8-14-18 8-12 14-6c6-6 14-2 14 6s-14 18-14 18z"/>'),
  boot: S('<path '+st+' d="M14 12h10v16l10 4v6H12v-8l2-18z"/>'),
  bag: S('<path '+st+' d="M14 18h20l-2 22H16z"/><path '+st+' d="M18 18c0-6 12-6 12 0"/>'),
  eye: S('<path '+st+' d="M6 24s8-12 18-12 18 12 18 12-8 12-18 12S6 24 6 24z"/><circle '+st+' cx="24" cy="24" r="5"/>'),
  crown: S('<path '+st+' d="M8 34h32L36 18l-8 8-4-12-4 12-8-8z"/>'),
  flame: S('<path '+st+' d="M24 6s10 10 10 20a10 10 0 0 1-20 0c0-6 6-12 10-20z"/>'),
  orb: S('<circle '+st+' cx="24" cy="24" r="12"/><path '+st+' d="M12 24h24M24 12c4 4 4 16 0 24"/>'),
  skull: S('<circle '+st+' cx="24" cy="20" r="12"/><path '+st+' d="M16 30h16v8H16z"/><circle '+fl+' cx="19" cy="20" r="2"/><circle '+fl+' cx="29" cy="20" r="2"/>'),
  tree: S('<path '+st+' d="M24 44V28"/><path '+st+' d="M24 8l12 16H12z"/><path '+st+' d="M24 18l10 12H14z"/>'),
  moon: S('<path '+st+' d="M30 8a14 14 0 1 0 10 20 12 12 0 1 1-10-20z"/>'),
  sun: S('<circle '+st+' cx="24" cy="24" r="8"/><path '+st+' d="M24 4v6M24 38v6M4 24h6M38 24h6M9 9l4 4M35 35l4 4M39 9l-4 4M13 35l-4 4"/>'),
  star: S('<path '+st+' d="m24 4 4 14 14 6-14 4-4 16-4-16-14-4 14-6z"/>'),
  shield: S('<path '+st+' d="M24 4 40 10v14c0 12-10 18-16 20-6-2-16-8-16-20V10z"/>'),
  reroll: S('<path '+st+' d="M10 18a14 14 0 0 1 24-4"/><path '+st+' d="M38 30A14 14 0 0 1 14 34"/><path '+st+' d="M34 8h6v6M14 40H8v-6"/>'),
  boss: S('<path '+st+' d="M8 20h32v8H8z"/><path '+st+' d="M12 12h24v8H12z"/><circle '+st+' cx="18" cy="24" r="2"/><circle '+st+' cx="30" cy="24" r="2"/>'),
 };
 const alias={
  sword_w:'sword', bow_w:'bow', bolt_w:'bolt',
  krovavyy:'seal_warrior', moroznyy:'seal_druid', gnev:'seal_shaman', staya:'seal_rogue', zalp:'seal_archer',
  hp:'heart', spd:'boot', pickup:'bag', crit:'eye', xp:'star', gold:'crown', armor:'shield',
  evo:'star', syn:'orb'
 };
 function get(name){
  if(!name) return map.dar;
  if(map[name]) return map[name];
  if(alias[name]&&map[alias[name]]) return map[alias[name]];
  return map.dar;
 }
 function wrap(name, cls, color){
  const c=color?(' style="color:'+color+';--icon-c:'+color+'"'):'';
  return '<div class="icon-seal '+(cls||'')+'"'+c+'>'+get(name)+'</div>';
 }
 return {get,wrap,map};
})();

function weaponIconId(id){
 // v6.35: у каждого орудия своя нарисованная иконка. Раньше все двадцать
 // новых орудий показывали одну заглушку 'dar' — слоты были неразличимы.
 if(PAINTED_ICONS[id])return id;
 if(id==='sword')return 'sword';
 if(id==='bow')return 'bow';
 if(id==='bolt')return 'bolt';
 return 'dar';
}
function sealIconId(id){
 if(id==='warrior')return 'seal_warrior';
 if(id==='druid')return 'seal_druid';
 if(id==='shaman')return 'seal_shaman';
 if(id==='rogue')return 'seal_rogue';
 if(id==='archer')return 'seal_archer';
 if(id==='ognevik')return 'seal_ognevik'; // v5.47
 if(id==='groznik')return 'seal_groznik'; // v5.48
 return 'seal_warrior';
}
