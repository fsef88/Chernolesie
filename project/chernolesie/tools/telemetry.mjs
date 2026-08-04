// ============================================================
//  telemetry.mjs — снять кривые живого забега.
//
//  Зачем: балансные правки в этом жанре нельзя проверить глазами.
//  «Стало сложнее» — не факт, а ощущение; факт — это HP игрока по минутам
//  и время смерти бота, который не двигается.
//
//  Как работает: поднимает dist/chernolesie.html в headless-Chromium,
//  перехватывает requestAnimationFrame и гоняет кадры сам. Физика идёт
//  теми же фиксированными шагами 1/60, что и в обычной игре, — меняется
//  только реальное время между кадрами, поэтому баланс замер не искажает.
//  draw() почти всегда пропускается через fpsCap: 28-минутный забег
//  снимается примерно за 6 минут.
//
//  Разово: npm i -D playwright
//
//  Использование:
//      node tools/telemetry.mjs                      полный забег, бегающий бот
//      node tools/telemetry.mjs 1700 базовая         метка для файла среза
//      node tools/telemetry.mjs 1700 стоячий --idle  бот не двигается
//
//  --idle — главная проверка. Пока игра убивает стоячего бота позже
//  десятой минуты, ставок в забеге нет, и полировать нечего.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = path.join(ROOT, 'dist', 'chernolesie.html');
const OUT = path.join(ROOT, 'dist', 'telemetry');

const SECONDS = Number(process.argv[2] || 1700);
const TAG = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'run';
const IDLE = process.argv.includes('--idle');

if (!fs.existsSync(BUILD)) {
  console.error('Нет dist/chernolesie.html — сначала npm run build');
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('Нужен playwright: npm i -D playwright');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
page.on('pageerror', e => console.log('ОШИБКА СТРАНИЦЫ:', e.message));

await page.goto('file://' + BUILD, { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.click('#btnStartPoohd');
await page.waitForTimeout(1200);

await page.evaluate((idle) => {
  window.__pending = null;
  window.requestAnimationFrame = (cb) => { window.__pending = cb; return 1; };
  window.__t = performance.now();
  window.__log = [];
  window.__next = 0;
  fpsCap = 2;                                  // draw() почти всегда пропускается
  window.__step = function (n) {
    for (let i = 0; i < n; i++) {
      if (paused || over || runEnded) return 'paused';
      const cb = window.__pending; window.__pending = null;
      if (!cb) return 'nocb';
      window.__t += 130;                       // ровно 5 шагов физики на кадр
      if (idle) { touchMove.x = 0; touchMove.y = 0; touchMove.active = false; }
      else {
        const a = time * 0.55;                 // широкий круг, как играет живой человек
        touchMove.x = Math.cos(a); touchMove.y = Math.sin(a); touchMove.active = true;
        if (specialCharge >= 1) { try { useSpecial(); } catch (e) {} }
      }
      cb(window.__t);
      if (time >= window.__next) {
        window.__next = Math.floor(time) + 1;
        let alive = 0;
        for (const e of enemies) if (e.hp > 0 && !(e.dying > 0)) alive++;
        window.__log.push({
          t: +time.toFixed(1), kills, level, xp: Math.round(xp), xpNext, alive,
          gems: ACTIVE.gems ? ACTIVE.gems.length : 0,
          hp: Math.round(P.hp), maxhp: Math.round(P.maxhp),
          weapons: weapons.length, dmgMul: +(P.dmgMul || 1).toFixed(2),
          cap: enemyCap(time), near: nearCap(time),
          hpMul: +enemyHpMul(time, diffMul).toFixed(2),
          dirP: +directorP.toFixed(3), gold,
        });
      }
    }
    return 'ok';
  };
}, IDLE);

const t0 = Date.now();
let last = null, guard = 0;
while (guard++ < 100000) {
  const st = await page.evaluate(() => {
    const r = window.__step(400);
    return { r, time, over, runEnded, len: window.__log.length };
  });
  last = st;
  if (st.over || st.runEnded) break;
  if (st.time >= SECONDS) break;
  if (st.r === 'paused') {
    // окно выбора: карта уровня, божество, класс
    await page.waitForTimeout(420);
    await page.evaluate(() => {
      const vis = id => { const e = document.getElementById(id); return e && getComputedStyle(e).display !== 'none'; };
      if (vis('cards')) { const c = document.querySelector('#cardrow > *'); if (c) c.click(); }
      else if (vis('boonov')) { const c = document.querySelector('#boonrow > *'); if (c) c.click(); }
      else if (vis('classov')) {
        const c = document.querySelector('#classrow > *'); if (c) c.click();
        const b = document.getElementById('btnClassStart'); if (b) b.click();
      } else if (paused) paused = false;
    });
    await page.waitForTimeout(120);
  }
  if (st.r === 'nocb') await page.waitForTimeout(60);
  if (guard % 15 === 0) {
    process.stdout.write(`\r${Math.round(st.time)}с игровых / ${Math.round((Date.now() - t0) / 1000)}с реальных, срезов ${st.len}   `);
  }
}

const log = await page.evaluate(() => window.__log);
await browser.close();

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, `${TAG}${IDLE ? '-idle' : ''}.json`);
fs.writeFileSync(file, JSON.stringify(log));

// ---------- отчёт ----------
const fin = log[log.length - 1] || {};
console.log(`\n\n${IDLE ? 'СТОЯЧИЙ' : 'БЕГАЮЩИЙ'} БОТ · забег кончился на ${Math.floor(fin.t / 60)}:${String(Math.round(fin.t % 60)).padStart(2, '0')}`);
console.log(`убийств ${fin.kills}   уровень ${fin.level}   золота ${fin.gold}   HP ${fin.hp}/${fin.maxhp}\n`);

console.log(' мин | уб/мин | живых | ур. |  HP  | hpMul | dirP');
console.log('-----+--------+-------+-----+------+-------+------');
for (let m = 0; m * 60 < fin.t; m++) {
  const seg = log.filter(r => r.t >= m * 60 && r.t < (m + 1) * 60);
  if (seg.length < 2) continue;
  const kpm = seg[seg.length - 1].kills - seg[0].kills;
  const alive = Math.round(seg.reduce((s, r) => s + r.alive, 0) / seg.length);
  const hpF = Math.round(seg.reduce((s, r) => s + r.hp / Math.max(1, r.maxhp), 0) / seg.length * 100);
  const e = seg[seg.length - 1];
  console.log(`${String(m).padStart(4)} | ${String(kpm).padStart(6)} | ${String(alive).padStart(5)} | ${String(e.level).padStart(3)} | ${String(hpF).padStart(3)}% | ${e.hpMul.toFixed(2).padStart(5)} | ${e.dirP.toFixed(2)}`);
}

const hurt = log.filter(r => r.hp < r.maxhp).length;
const dirTop = log.filter(r => r.dirP >= 1.279).length;
const gemTop = log.filter(r => r.gems >= 520).length;
console.log('\nтри числа, по которым видно, есть ли в забеге ставки:');
console.log(`  срезов с HP ниже полного : ${hurt} из ${log.length} (${(hurt / log.length * 100).toFixed(1)}%) — цель 15-20%`);
console.log(`  директор в своём потолке : ${(dirTop / log.length * 100).toFixed(0)}% забега — цель меньше 25%`);
console.log(`  пул кристаллов забит     : ${(gemTop / log.length * 100).toFixed(0)}% забега — цель около нуля`);
console.log(`\nсрезы: ${file}`);
