// ============================================================
//  ТЕКСТУРЫ / АТМОСФЕРА
// ============================================================
// (#15) здесь создавались 140 off-screen canvas (groundBlobs), которые
// НИКОГДА не рисовались — в draw() стоял `for(const b of [])`, пустой цикл.
// Мёртвый код удалён: тайловая текстура GT и так полностью закрывает фон.
// gspots удалены — 240 arc-op/кадр съедали FPS (см. аудит #6)
const motes=[]; // v5.11: ambient-мотыльки отключены (липли к центру/герою)
// Кэшируем моты как готовые маленькие canvas'ы
const _moteCanv=document.createElement('canvas');_moteCanv.width=_moteCanv.height=4;
const _fireflyCanv=document.createElement('canvas');_fireflyCanv.width=_fireflyCanv.height=6;
const _leafCanv=document.createElement('canvas');_leafCanv.width=12;_leafCanv.height=5;
const _mcx=_moteCanv.getContext('2d');_mcx.fillStyle='rgba(180,220,200,0.8)';_mcx.beginPath();_mcx.arc(2,2,1.6,0,7);_mcx.fill();
const _fcx=_fireflyCanv.getContext('2d');const _fg=_fcx.createRadialGradient(3,3,0,3,3,3);_fg.addColorStop(0,'rgba(200,240,120,1)');_fg.addColorStop(1,'rgba(200,240,120,0)');_fcx.fillStyle=_fg;_fcx.fillRect(0,0,6,6);
const _lcx=_leafCanv.getContext('2d');_lcx.fillStyle='#5a6a38';_lcx.beginPath();_lcx.ellipse(6,2.5,5,2.2,0,0,7);_lcx.fill();
const fireflies=[]; // v5.11: светлячки отключены
const leaves=[]; // v5.11: листья-оверлей отключены (ложное «кольцо» вокруг героя)
// Наземный туман — славянская хтонь, стелется по низу экрана
const fogMist=[]; // v5.14.1: нижний туман-оверлей отключён (лип к камере/герою)

