function specialPos(){
 const cx=cam.x+W/2,cy=cam.y+H/2;
 for(let i=0;i<8;i++){
  const a=srnd(0,TAU),pad=srnd(150,320),rx=W/2+pad,ry=H/2+pad;
  const sx=cx+Math.cos(a)*rx,sy=cy+Math.sin(a)*ry;
  if(sx>=0&&sx<=WORLD&&sy>=0&&sy<=WORLD&&(sx<cam.x-50||sx>cam.x+W+50||sy<cam.y-50||sy>cam.y+H+50))return {x:sx,y:sy};
 }
 return {x:clamp(P.x+srnd(-400,400),100,WORLD-100),y:clamp(P.y+srnd(-400,400),100,WORLD-100)};
}
function spawnCourier(){
 const p=specialPos(),b=ETYPES.upyr;
 const hp=Math.max(40,safeNum(b.hp*3*diffMul,60));
 acquireEnemy({...b,x:p.x,y:p.y,hp:hp,maxhp:hp,type:'upyr',courier:true,ai:'flee',spd:147,drawH:50,dmgMod:1,xp:10,r:13,spawnT:0.5,warnT:0.5,flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,fireT:0});
 log('💨 Курьер чащи! Догони — он несёт сундук','gold');
}
function spawnBeacon(){
 const p=specialPos(),b=ETYPES.bognik;
 const hp=Math.max(90,safeNum(b.hp*5*diffMul,120));
 acquireEnemy({...b,x:p.x,y:p.y,hp:hp,maxhp:hp,type:'bognik',beacon:true,ai:'chase',spd:0,drawH:62,dmgMod:1,xp:5,r:20,sumT:2.0,spawnT:0.5,warnT:0.5,flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,fireT:0});
 log('✴ Зов чащи! Маяк призывает орду — разбей его','warn');
}
function spawnShaman(){
 const p=specialPos(),b=ETYPES.vedmaT;
 const hp=Math.max(70,safeNum(b.hp*4*diffMul,90));
 acquireEnemy({...b,x:p.x,y:p.y,hp:hp,maxhp:hp,type:'vedmaT',shaman:true,ai:'chase',spd:112,drawH:56,dmgMod:1.2,xp:8,r:15,spawnT:0.5,warnT:0.5,flash:0,kx:0,ky:0,at:0,slow:1,hitT:0,wasInRange:false,boltT:0,frozen:0,poisoned:0,fireT:0});
 log('🜏 Шаман чащи вышел — убей его первым','warn');
}
function updateSpecialEvents(dt){
 if(bossSpawned||time<85)return;
 specialE.t-=dt;
 if(specialE.t>0)return;
 specialE.t=70+srnd(0,25);
 // Не больше одного спец-врага на экране одновременно
 for(const en of enemies){if(en.alive&&en.hp>0&&(en.courier||en.beacon||en.shaman))return;}
 const pool=['courier'];
 if(time>=180)pool.push('beacon');
 if(time>=320)pool.push('shaman');
 const kind=pool[Math.floor(srnd(0,pool.length))];
 if(kind==='courier')spawnCourier();
 else if(kind==='beacon')spawnBeacon();
 else spawnShaman();
 // Маяк: каждые ~2.4с призывает 3-5 врагов вокруг себя (пока жив)
 for(const en of enemies){
  if(!(en.beacon&&en.alive&&en.hp>0))continue;
  en.sumT=(en.sumT||0)-dt;
  if(en.sumT<=0){
   en.sumT=2.4;
   if(liveEnemies()<enemyCap(time)){
    const n=3+Math.floor(srnd(0,3));
    for(let i=0;i<n;i++){
     const a=srnd(0,TAU),rr=srnd(60,150);
     const sx=en.x+Math.cos(a)*rr,sy=en.y+Math.sin(a)*rr;
     if(sx>=0&&sx<=WORLD&&sy>=0&&sy<=WORLD)spawnAt(pickEnemyType(time),sx,sy);
    }
   }
  }
 }
}
