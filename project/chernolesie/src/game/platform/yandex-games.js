(function(){
 if(typeof YaGames==='undefined'){console.warn('[Яндекс] SDK не загружен — запуск вне платформы');return;}
 YaGames.init().then(function(ys){
  window.ysdk=ys;
  try{window.YA_LANG=(ys.environment&&ys.environment.i18n&&ys.environment.i18n.lang)||'ru';}catch(e){}
  console.log('[Яндекс] SDK готов, язык: '+(window.YA_LANG||'ru'));
  // Game Ready: шлём сразу после init; frame() при первом кадре тоже вызывает __yaReady
  window.__yaReady=function(){try{if(ys.features&&ys.features.LoadingAPI)ys.features.LoadingAPI.ready();}catch(e){}};
  window.__yaReady();
  initCloud(ys);
  initLB(ys);
 }).catch(function(e){console.warn('[Яндекс] init failed:',e);});

 // ---- Облачные сохранения: зеркало localStorage -> Player (требование 1.9) ----
 // ИСПРАВЛЕНО: ys.getPlayer() возвращает Promise, а не готовый объект.
 // Раньше результат присваивался напрямую: player был Promise, проверка
 // if(!player) всегда проходила, а player.setData/getData кидали TypeError,
 // который молча съедался внешним try/catch. Облачные сохранения не работали
 // ни разу, и в консоли не было ни одного предупреждения.
 function initCloud(ys){
  var player=null;          // заполнится, когда промис разрешится
  var savePending=false;    // троттлинг: у setData лимит ~1 вызов в секунду
  var saveQueued=false;

  function collect(){
   var obj={};
   for(var i=0;i<localStorage.length;i++){
    var k=localStorage.key(i);
    if(k&&k.indexOf('cl_')===0)obj[k]=localStorage.getItem(k);
   }
   return obj;
  }
  function flush(){
   if(!player){saveQueued=false;return;}
   savePending=true;saveQueued=false;
   try{
    player.setData({cl_progress:JSON.stringify(collect())})
     .catch(function(e){console.warn('[Яндекс] сейв не ушёл:',e);})
     .then(function(){
      savePending=false;
      if(saveQueued)setTimeout(flush,1100);
     });
   }catch(e){savePending=false;console.warn('[Яндекс] сейв не ушёл:',e);}
  }
  // YA_SAVE определяем СРАЗУ: игра зовёт его из трёх мест и может успеть
  // до того, как разрешится getPlayer. Пока player=null — просто копим флаг.
  window.YA_SAVE=function(){
   if(savePending||!player){saveQueued=true;return;}
   flush();
  };

  ys.getPlayer({scopes:false}).then(function(pl){
   player=pl;
   return pl.getData(['cl_progress']);
  }).then(function(data){
   if(saveQueued&&!savePending)flush();   // сейв, накопленный до готовности player
   var raw=data&&data.cl_progress;if(!raw)return;
   var obj=JSON.parse(raw),changed=0;
   for(var k in obj){
    if(!Object.prototype.hasOwnProperty.call(obj,k))continue;
    try{if(localStorage.getItem(k)!==obj[k]){localStorage.setItem(k,obj[k]);changed++;}}catch(e){}
   }
   if(!changed){console.log('[Яндекс] облачный прогресс совпадает с локальным');return;}
   console.log('[Яндекс] облачный прогресс загружен ('+changed+' ключей)');
   // Этот скрипт выполняется ПОСЛЕ игрового: к моменту загрузки из облака
   // игра уже прочитала localStorage в память (древо, перки, достижения).
   // Без перезагрузки облачный прогресс подхватился бы только со следующего
   // запуска. Перезагружаемся один раз за сессию — флаг в sessionStorage
   // страхует от цикла, если облако и локалка почему-то не сойдутся.
   try{
    if(!sessionStorage.getItem('cl_cloud_applied')){
     sessionStorage.setItem('cl_cloud_applied','1');
     location.reload();
    }
   }catch(e){}
  }).catch(function(e){console.warn('[Яндекс] Player недоступен:',e);});
 }

 // ---- Лидерборды (рейтинги через SDK) ----
 var LB_NAME='chernolesie_best';
 function initLB(ys){
  try{
   ys.getLeaderboards().then(function(lb){
    window.YA_LB={ready:true,_lb:lb};
    window.YA_LB.submit=function(score){
     try{
      if(!(score>0))return;
      lb.setLeaderboardScore(LB_NAME,Math.floor(score)).catch(function(){
       lb.createLeaderboard(LB_NAME,{type:'numeric',updateStrategy:'best',defaultValue:0}).then(function(){
        lb.setLeaderboardScore(LB_NAME,Math.floor(score)).catch(function(){});
       }).catch(function(){});
      });
     }catch(e){}
    };
    window.YA_LB.entries=function(qty,cb){
     try{
      lb.getLeaderboardEntries(LB_NAME,{quantityTop:qty||10}).then(function(res){
       cb&&cb((res&&res.entries)||[]);
      }).catch(function(){cb&&cb([]);});
     }catch(e){cb&&cb([]);}
    };
   }).catch(function(){});
  }catch(e){}
 }
})();
