// ============================================================
//  РЕКОРДЫ
// ============================================================
function openStats(){
 paused=true;
 document.getElementById('statsov').style.display='flex';
 // Яндекс: лидерборд (топ по убийствам)
 {const yb=document.getElementById('btnYaLb'),yt=document.getElementById('yatable');
  if(yb&&yt){
   if(window.YA_LB&&window.YA_LB.ready){
    yb.style.display='block';
    yb.onclick=()=>{
     const was=yt.style.display;yt.style.display=was==='block'?'none':'block';
     if(was!=='block'){
      yt.innerHTML='<div style="padding:10px;color:#9fa088">Загрузка…</div>';
      window.YA_LB.entries(10,(es)=>{
       if(!es||!es.length){yt.innerHTML='<div style="padding:10px;color:#9fa088">Пока пусто — стань первым!</div>';return;}
       let h='<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:#c9a04a"><th style="padding:4px;border-bottom:1px solid #3a3a2a">#</th><th style="padding:4px;border-bottom:1px solid #3a3a2a">Игрок</th><th style="padding:4px;border-bottom:1px solid #3a3a2a">Убийств</th></tr>';
       es.forEach((e,i)=>{h+='<tr><td style="padding:3px 6px;text-align:center">'+(i+1)+'</td><td style="padding:3px 6px">'+((e.player&&e.player.publicName)||'Аноним')+'</td><td style="padding:3px 6px;text-align:center">'+e.score+'</td></tr>';});
       h+='</table>';
       yt.innerHTML=h;
      });
     }
    };
   }else yb.style.display='none';
  }
 }
 const t=document.getElementById('statstable');
 const best=stats.length?Math.max(...stats.map(s=>s.time)):0;
 const bestK=stats.length?Math.max(...stats.map(s=>s.kills)):0;
 const wins=stats.filter(s=>s.won).length;
 const total=stats.length;
 const achCount=Object.keys(achData.unlocked).length;
 const achTotal=ACHIEVEMENTS.length;
 let html=`<tr><th>Параметр</th><th>Значение</th></tr>`;
 html+=`<tr><td>Лучшее время</td><td>${fmt(best)}</td></tr>`;
 html+=`<tr><td>Лучшие убийства</td><td>${bestK}</td></tr>`;
 html+=`<tr><td>Побед / Всего</td><td>${wins} / ${total}</td></tr>`;
 html+=`<tr><td>Золото Заставы</td><td>${metaGold} ◆</td></tr>`;
 html+=`<tr><td>Достижения</td><td>${achCount} / ${achTotal}</td></tr>`;
 if(stats.length){
  html+=`<tr><th colspan=2>Последние забеги</th></tr>`;
  stats.slice(-5).reverse().forEach(s=>{
   html+=`<tr><td>${fmt(s.time)} · ${s.won?'🏆':'☠'}</td><td>${s.kills}☠ ${s.level}ур ${s.gold}◆</td></tr>`;
  });
 }
 t.innerHTML=html;
}
document.getElementById('btnStats').onclick=openStats;
document.getElementById('btnStatsClose').onclick=()=>{closeOverlay('statsov');};

