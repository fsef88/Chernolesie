const TILE=60;
// v6.0: МИР УВЕЛИЧЕН В 4 РАЗА ПО СТОРОНЕ (в 16 раз по площади): 6000 → 24000 px.
// Зачем: при 6000 и базовой скорости 200 px/с игрок пересекал карту за 30 секунд,
// то есть за 28-минутный забег упирался в кромку чащи десятки раз. Теперь переход
// от края до края занимает около двух минут — карта перестаёт ощущаться коробкой,
// как в Vampire Survivors, где арена велика настолько, что границу почти не видишь.
// Что масштабируется САМО и правки не требует (проверено):
//   • декорации — генерируются сеткой `gy*CELL_D<WORLD`, плотность сохраняется
//     (было ~150 пропсов, стало ~2000 на весь мир, на экране по-прежнему 6–9);
//   • мини-карта — она центрирована на игроке с окном ±1500, а не показывает
//     весь мир, поэтому от размера не зависит вообще;
//   • спавн врагов, элиты, боссов, аномалий, хазардов — всё считается от игрока
//     и клампится в [0..WORLD];
//   • деспавн — радиус считается от размера экрана, а не мира;
//   • камера — clamp по WORLD-W/WORLD-H;
//   • стартовая точка — P.x=WORLD/2 (центрирование добавлено в v5.98).
// Что пришлось поправить руками — туман войны, см. ниже.
const WORLD=TILE*400;
// Декорации мира: брёвна/камни/заборы/тёрн (11 спрайтов, прозрачный фон)
const DECO_SRC=[
/*v5.5 deco 0*/"@@A:art/world/deco-src.webp@@",
/*v5.5 deco 1*/"@@A:art/world/aaa.webp@@",
/*v5.5 deco 2*/"@@A:art/world/gaaa.webp@@",
/*v5.5 deco 3*/"@@A:art/world/cntv3xqpnm7h3fgwt4wgz6tfkaa.webp@@",
/*v5.5 deco 4*/"@@A:art/world/ico-31.webp@@",
/*v5.5 deco 5*/"@@A:art/world/aaaa.webp@@",
/*v5.5 deco 6*/"@@A:art/world/rlqkz41fgaaa.webp@@",
/*v5.5 deco 7*/"@@A:art/world/djhomhwx3mb2oa.webp@@",
/*v5.5 deco 8*/"@@A:art/world/fm1x4a.webp@@",
/*v5.5 deco 9*/"@@A:art/world/jzv4zvnga.webp@@",
/*v5.5 deco 10*/"@@A:art/world/zsdo8ieb7aw.webp@@",
/*v5.5 deco 11*/"@@A:art/world/gae.webp@@",
/*v5.5 deco 12*/"@@A:art/world/m3nx98jw8eaa.webp@@",
/*v5.5 deco 13*/"@@A:art/world/b7ls9f5shaa.webp@@",
/*v5.5 deco 14*/"@@A:art/world/lsf.webp@@",
/*v5.5 deco 15*/"@@A:art/world/fd1asao35lyoor3xicabru.webp@@",
/*v5.5 deco 16*/"@@A:art/world/vspugxkfww.webp@@",
/*v5.5 deco 17*/"@@A:art/world/bmcaa.webp@@",
/*v5.5 deco 18*/"@@A:art/world/rsybyca.webp@@",
/*v5.5 deco 19*/"@@A:art/world/bzjw32i.webp@@",
/*v5.24 deco 20*/"@@A:art/world/howqi7e2famdlbdyah7wet18uaa.png@@",
/*v5.24 deco 21*/"@@A:art/world/luwfn1od9yqaaaabjru5erkjggg.png@@",
/*v5.24 deco 22*/"@@A:art/world/vwcgxh2tz3duewaaaabjru5erkjggg.png@@",
/*v5.24 deco 23*/"@@A:art/world/iyflaaaaaelftksuqmcc.png@@",
/*v5.24 deco 24*/"@@A:art/world/wvv5viw9wnraaaaaelftksuqmcc.png@@",
/*v5.24 deco 25*/"@@A:art/world/srmawxogaaaaasuvork5cyii.png@@",
/*v5.24 deco 26*/"@@A:art/world/vqq57ivrkaaaaasuvork5cyii.webp@@",
/*v5.24 deco 27*/"@@A:art/world/uln039lbw.png@@",
/*v5.24 deco 28*/"@@A:art/world/d8jghlsbhoduaaaaasuvork5cyii.png@@",
/*v5.24 deco 29*/"@@A:art/world/gcj9pafpl9hzgaaaabjru5erkjggg.png@@",
/*v5.24 deco 30*/"@@A:art/world/bzt6us0nacb2aaaaaelftksuqmcc.png@@"
];
const GT=new Image();GT.src='@@A:art/world/or8ekkyu2begaaaaasuvork5cyii.jpg@@';let GTpat=null;

window.addEventListener('error',(e)=>{
 const t=Date.now();
 if(!window.__lastFrameErr||t-window.__lastFrameErr>1000){
  window.__lastFrameErr=t;
  console.error('[frame]',e.error?e.error.stack||e.error.message:e.message);
 }
});
window.addEventListener('unhandledrejection',(e)=>{
 const t=Date.now();
 if(!window.__lastPromiseErr||t-window.__lastPromiseErr>1000){
  window.__lastPromiseErr=t;
  console.error('[promise]',e.reason&&e.reason.stack?e.reason.stack:String(e.reason));
 }
});

