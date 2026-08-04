//  АНОМАЛИИ
// ============================================================
function spawnAnomaly(forceType,fx,fy){
 // ЗАЩИТА: clamp в границы мира [16..2384] (16 = половина иконки 32px).
 // Иначе у края карты сундук появлялся за стеной, и игрок видел иконку,
 // но не мог её подобрать (упирался в clamp на P.x).
 const ang=srnd(0,TAU),dist_=srnd(200,360); // srnd: позиция аномалии — геймплей (Daily)
 const x=clamp(fx!=null?fx:P.x+Math.cos(ang)*dist_, 16, WORLD-16);
 const y=clamp(fy!=null?fy:P.y+Math.sin(ang)*dist_, 16, WORLD-16);
 const types=['chest','altar','vein'];
 const type=forceType||types[Math.floor(seedRandom()*types.length)];
 anomalies.push({x,y,type,born:time});
 // v6.46: DOM-иконки больше нет — находка рисуется в мире (drawAnomalies).
 // Прежний кружок 32px жил вне канваса: не масштабировался зумом, не имел
 // тени и перекрывал траву, а позиция ещё и считалась без ZOOM (см. syncHud).
 log(type==='chest'?'Найден сундук!':type==='altar'?'Найден алтарь!':'Золотая жила!','gold');
 sfxAnomaly();
}
function tryClaimAnomaly(a){
 if(a.claimed)return;
 if(dist2(P.x-a.x,P.y-a.y)>900)return; // 30^2
 a.claimed=true;
 if(a.domEl)a.domEl.remove();
 if(a.type==='chest'){openChest();}
 else if(a.type==='altar'){showCardsFree();log('Алтарь дарует силу!','gold');}
 else if(a.type==='vein'){gold+=200;log('+200 ◆','gold');sfxPick();}
 // splice удалён, чтобы не ломать for...of в update().
 // Раньше удаление элемента по индексу во время for...of смещало итератор
 // и приводило к пропуску соседних аномалий. Теперь они остаются в массиве
 // с флагом claimed=true, и update() отфильтрует их одним .filter в конце.
}
function showCardsFree(){
 paused=true;
 _cardTaken=false;   // v6.42
 sfxFlip();
 const opts=buildCardPool();
// v6.74: алтарь теперь тоже получает синергии/эволюции через общий пул

 // v5.14.1: пустой пул = не зависаем с пустым экраном на паузе
 if(!opts.length){closeCards();log('Нет доступных даров — путь продолжается','gold');return;}
 const row=document.getElementById('cardrow');if(!row){closeCards();return;}row.innerHTML='';
 opts.forEach(o=>{ row.appendChild(buildTarotCardEl(o, false, true)); });
 document.getElementById('cardbtns').style.display='none';
 document.getElementById('cards').style.display='flex';
}
function log(text,cls){
 const el=document.createElement('div');el.className='logitem'+(cls?' '+cls:'');el.textContent=text;
 const log=document.getElementById('log');
 log.appendChild(el);
 while(log.children.length>3)log.firstChild.remove();
 setTimeout(()=>el.remove(),4100);
}

// ============================================================
