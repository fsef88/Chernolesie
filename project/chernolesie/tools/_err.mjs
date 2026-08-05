const {chromium}=await import('playwright');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});
const p=await b.newPage({viewport:{width:430,height:900}});
const seen=new Set();
p.on('console',m=>{const t=m.text();if(!seen.has(t)&&(m.type()==='error'||t.includes('FRAME'))){seen.add(t);console.log('>>',t.slice(0,600));}});
p.on('pageerror',e=>console.log('СТРАНИЦА:',e.message));
await p.goto('file://'+process.argv[2]+'?boss=1',{waitUntil:'load'});
await p.waitForTimeout(2500);
await p.click('#btnStartPoohd');
// сохраняем стек первой ошибки кадра
await p.evaluate(()=>{const o=console.error;window.__first=null;console.error=function(){if(!window.__first&&String(arguments[0]).includes('FRAME')){window.__first=(arguments[1]&&arguments[1].stack)||String(arguments[1]);}return o.apply(console,arguments);};});
await p.waitForTimeout(28000);
const st=await p.evaluate(()=>window.__first);
console.log('--- стек первой ошибки кадра ---');
console.log(st||'(ошибок кадра не было)');
await b.close();
