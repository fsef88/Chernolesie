function adMute(on){   // v5.66: звук на время рекламы. Игра уже на паузе (paused=true)
 try{
  if(musicGain&&AC){
   musicGain.gain.cancelScheduledValues(AC.currentTime);
   const mv=LS.num('cl_mus',25)/100*0.4;   // то же значение, что восстанавливает resetRun
   musicGain.gain.linearRampToValueAtTime(on?0:mv,AC.currentTime+0.2);
  }
  if(AC&&AC.suspend&&AC.resume){on?AC.suspend():AC.resume();}
 }catch(e){console.warn('adMute',e);}
}
const AD={
 debugGrant:(location.protocol==='file:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'),
 show(onReward,onFail){
  let settled=false,watchdog=0;
  const finish=(ok,reason)=>{
   if(settled)return; settled=true;
   if(watchdog)clearTimeout(watchdog); adMute(false); if(window.__wasPaused!==undefined){paused=window.__wasPaused;delete window.__wasPaused;}
   if(ok)onReward(); else onFail(reason||'реклама недоступна');
  };
  try{
   if(window.ysdk&&ysdk.adv&&ysdk.adv.showRewardedVideo){
    let paid=false;
    watchdog=setTimeout(()=>finish(false,'превышено время ожидания рекламы'),30000);
    ysdk.adv.showRewardedVideo({callbacks:{
     onOpen:()=>{adMute(true);window.__wasPaused=paused;paused=true;},
     onRewarded:()=>{paid=true;},
     onClose:()=>finish(paid,paid?'':'закрыто до награды'),
     onError:()=>finish(false,'ошибка сети')
    }});
    return;
   }
  }catch(e){console.warn('AD.show',e);}
  if(this.debugGrant){console.warn('AD: SDK нет, отладочная награда');finish(true);}
  else finish(false,'реклама недоступна');
 }
};
let reviveLeft=BALANCE.reviveMax,reviveBusy=false;
// v6.23 (коммерция): межзабеговая fullscreen-реклама (не rewarded).
AD.showFullscreen=function(onDone){
 let settled=false,watchdog=0;
 const finish=()=>{if(settled)return;settled=true;if(watchdog)clearTimeout(watchdog); adMute(false); if(window.__wasPaused!==undefined){paused=window.__wasPaused;delete window.__wasPaused;}if(window.__wasPaused!==undefined){paused=window.__wasPaused;delete window.__wasPaused;}if(onDone)onDone();};
 try{
  if(window.ysdk&&ysdk.adv&&ysdk.adv.showFullscreenAdv){
   watchdog=setTimeout(finish,30000);
   ysdk.adv.showFullscreenAdv({callbacks:{onOpen:()=>{adMute(true);window.__wasPaused=paused;paused=true;},onClose:finish,onError:(e)=>{console.warn('AD.fullscreen',e);finish();}}});
   return;
  }
 }catch(e){console.warn('AD.fullscreen',e);}
 finish();
};
// v1.0 Яндекс: межстраничная реклама по событиям.
// Правило платформы: не чаще одного показа в 3 минуты.
let _lastInterT=-999;
function maybeInterstitial(){
 const now=performance.now();
 if(now-_lastInterT<180000)return;
 _lastInterT=now;
 try{AD.showFullscreen(function(){});}catch(e){}
}
// v6.23 (коммерция): шеринг результата забега.
function shareRun(victory){
 try{
  var txt='Чёрнолесье — Защитник Заставы: '+(victory?'ПОБЕДА':'пал на '+fmt(time))+', убийств '+kills+', уровень '+level+'.';
  if(window.ysdk&&ysdk.features&&ysdk.features.share){ysdk.features.share({imageUrl:'',text:txt}).catch(function(e){console.warn('share',e);});return;}
  if(navigator.share){navigator.share({title:'Чёрнолесье',text:txt}).catch(function(e){console.warn('share',e);});return;}
  if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){}).catch(function(e){console.warn('clip',e);});}
 }catch(e){console.warn('shareRun',e);}
}

function canRevive(){
 if(reviveLeft<=0||reviveBusy)return false;
 if(runSeed&&!BALANCE.reviveInDaily)return false;   // Daily — без возрождений
 return true;
}
function offerRevive(){
 paused=true;timeScale=0;
 const ov=document.getElementById('reviveov');
 if(!ov){endRun(false);return;}                     // разметки нет — не подвешиваем игрока
 const t=document.getElementById('revivetxt');
 if(t)t.textContent='Подняться и продолжить? Здоровье вернётся на '+Math.round(BALANCE.reviveHp*100)+'%, нежить рядом отшвырнёт.';
 ov.style.display='flex';
}
function hideRevive(){const ov=document.getElementById('reviveov');if(ov)ov.style.display='none';}
function declineRevive(){hideRevive();paused=false;timeScale=1;endRun(false);}
function reviveByAd(){
 if(reviveBusy)return;
 reviveBusy=true;
 const b=document.getElementById('btnrevive');
 if(b){b.disabled=true;b.textContent='Загрузка рекламы…';}
 AD.show(
  ()=>{reviveBusy=false;doRevive();},
  (why)=>{
   reviveBusy=false;
   if(b){b.disabled=false;b.textContent='▶ Смотреть рекламу и подняться';}
   const t=document.getElementById('revivetxt');
   if(t)t.textContent='Не вышло: '+why+'. Можно попробовать снова или завершить забег.';
  }
 );
}
// v6.18: бесплатное воскрешение из ветки открытий. Отличается от рекламного:
// даётся один раз за забег, лечит слабее (45% против BALANCE.reviveHp) и не
// требует ничего нажимать — игрок купил это право заранее, в мете.
function secondWind(){
 secondWindUsed=true;
 runStats.revived=true;
 P.hp=Math.max(1,Math.round(P.maxhp*0.45));
 P.invuln=Math.max(P.invuln||0,2.2);
 for(const e of enemies){
  if(e.hp<=0)continue;
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  if(d<420){e.kx+=dx/d*560;e.ky+=dy/d*560;}
 }
 flashScreen('#8fd0ff',0.6);
 if(typeof sfxEvo==='function')sfxEvo();
 log('🌬 Второе дыхание — застава держится!','evo');
}
function doRevive(){
 reviveLeft--;
 runStats.revived=true;
 hideRevive();
 P.hp=Math.max(1,Math.round(P.maxhp*BALANCE.reviveHp));
 P.invuln=Math.max(P.invuln||0,BALANCE.reviveInvuln);
 // Расчистка: без неё игрок умирает в той же куче через секунду.
 // Урон идёт через hitEnemy — значит падают кристаллы и золото, подъём ощущается наградой.
 const near=aliveNear(P.x,P.y,BALANCE.reviveClearR);   // v5.89: трупы в зачистке не нужны
 for(const e of near){
  if(e.boss||e.mini)continue;                        // боссов не сносим
  if(dist(e.x-P.x,e.y-P.y)<=BALANCE.reviveClearR)hitEnemy(e,BALANCE.reviveClearDmg,'elec');
 }
 for(const e of enemies){                            // остальных отшвыриваем
  if(e.hp<=0)continue;                               // v5.92: трупы не отшвыриваем
  const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy)||1;
  if(d<BALANCE.reviveClearR*2){e.kx+=dx/d*520;e.ky+=dy/d*520;}
 }
 flashScreen('#ffcf6a',0.65);   // v6.17: было shake=14 — вместо тряски усилена вспышка
 paused=false;timeScale=1;over=false;
 log('Застава поднимается. Возрождений осталось: '+reviveLeft,'gold');
}
// v5.67: удвоение золота за ролик на экране результата.
// Безопасное место для рекламы: забег уже закончен, поток не прерывается,
// смотреть или нет решает игрок.
let lastRunGold=0,goldDoubled=false,x2Busy=false;
function x2Btn(){return document.getElementById('btnx2gold');}
function refreshX2(){
 const b=x2Btn();if(!b)return;
 if(goldDoubled||lastRunGold<=0){b.style.display='none';return;}
 b.style.display='block';b.disabled=false;
 b.textContent='▶ Удвоить золото за рекламу (+'+lastRunGold+' ◆)';
}
function doubleGoldByAd(){
 if(goldDoubled||x2Busy||lastRunGold<=0)return;
 x2Busy=true;
 const b=x2Btn();if(b){b.disabled=true;b.textContent='Загрузка рекламы…';}
 AD.show(
  ()=>{
   x2Busy=false;goldDoubled=true;
   metaGold+=lastRunGold;LS.set('cl_gold',metaGold);
   if(stats.length){stats[stats.length-1].gold=lastRunGold*2;LS.set('cl_stats',JSON.stringify(stats));}
   const mg=document.getElementById('metagold');if(mg)mg.textContent=metaGold;
   const os=document.getElementById('ostat');
   if(os)os.textContent=os.textContent.replace(/Золото: \d+/,'Золото: '+(lastRunGold*2)+' (×2)');
   refreshX2();renderShop();                       // Кузница сразу видит новое золото
   try{if(window.YA_SAVE)YA_SAVE();}catch(e){}   // Яндекс: облачный сейв
   log('Золото удвоено: +'+lastRunGold+' ◆','gold');
  },
  (why)=>{
   x2Busy=false;
   const bb=x2Btn();
   if(bb){bb.disabled=false;bb.textContent='▶ Удвоить золото за рекламу (+'+lastRunGold+' ◆) · '+why;}
  }
 );
}
