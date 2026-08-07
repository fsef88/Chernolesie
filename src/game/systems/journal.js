const JOURNAL=(function(){
 try{const o=JSON.parse(LS.get('cl_journal','{}'));return (o&&typeof o==='object')?o:{};}
 catch(e){return {};}
})();
function journalFind(kind,id,name){
 JOURNAL[kind]=JOURNAL[kind]||{};
 if(JOURNAL[kind][id])return false;
 JOURNAL[kind][id]=name||id;
 LS.setLater('cl_journal',JSON.stringify(JOURNAL));   // вне кадра: см. LS.setLater
 return true;
}
function journalHas(kind,id){return !!(JOURNAL[kind]&&JOURNAL[kind][id]);}
function journalCount(kind){return JOURNAL[kind]?Object.keys(JOURNAL[kind]).length:0;}
function openJournal(){
 const ov=document.getElementById('jourov');if(!ov)return;
 const g=document.getElementById('jgrid');if(!g)return;
 let html='';
 const evoIds=Object.keys(EVO_RECIPES);
 html+='<div class="jsec">✦ Пробуждения — '+journalCount('evo')+'/'+evoIds.length+'</div>';
 for(const id of evoIds){
  const r=EVO_RECIPES[id],f=journalHas('evo',id);
  html+='<div class="jcard'+(f?' found':'')+'"><h4>'+(f?r.n:'? ? ?')+'</h4>'+
   (f?('из «'+(WNAME[id]||id)+'»<br><span style="opacity:.75">'+(EVO_DESC[id]||'')+'</span>')
     :('рецепт: '+(WNAME[id]||id)+' + '+r.p))+'</div>';
 }
 html+='<div class="jsec">✦ Синергии — '+journalCount('syn')+'/'+SYNERGIES.length+'</div>';
 for(const sy of SYNERGIES){
  const f=journalHas('syn',sy.id);
  html+='<div class="jcard'+(f?' found':'')+'"><h4>'+(f?sy.n:'? ? ?')+'</h4>'+
   (f?sy.d:'ещё не открыта')+'</div>';
 }
 g.innerHTML=html;
 ov.style.display='flex';
}
{
 const bj=document.getElementById('btnJournal');
 if(bj)bj.onclick=openJournal;
 const bjc=document.getElementById('btnJourClose');
 if(bjc)bjc.onclick=function(){const ov=document.getElementById('jourov');if(ov)ov.style.display='none';};
 const bt2=document.getElementById('btnTree2');
 if(bt2)bt2.onclick=function(){openTree();};
 const bsh=document.getElementById('btnShare');if(bsh)bsh.onclick=function(){shareRun(won);};
 const bad=document.getElementById('btnAd');if(bad)bad.onclick=function(){AD.showFullscreen(function(){});};

}

// ---------- ВЕТКА ОТКРЫТИЙ В ДРЕВЕ ----------
// Документ, ч.3: «работает не „стал сильнее“, а „открыл новое“». Все узлы ниже
// меняют СЛЕДУЮЩИЙ забег качественно, а не сдвигают проценты.
