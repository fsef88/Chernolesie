// ============================================================
//  gif.mjs — снять анимацию боя кадр за кадром.
//
//  Одиночный снимок не показывает, ЧТО эффект делает: зона живёт доли
//  секунды, а весь смысл листа — в движении между восемью кадрами.
//  Здесь игра шагается детерминированно: rAF перехватывается, время
//  двигается ровными шагами, и на каждом шаге снимается кадр. Итог
//  собирается в GIF (tools/gif.mjs пишет png-кадры, склейка — Pillow).
//
//  Запуск (нужен playwright: npm i -D playwright):
//      node tools/gif.mjs --weapon navi --frames 48 --step 33
//
//  --weapon  какое оружие дать герою
//  --frames  сколько кадров снять
//  --step    сколько миллисекунд игрового времени на кадр
//  --cd      перезарядка оружия на время съёмки (по умолчанию 0.7 с)
//  --crop    область кадра: XxY+Ш+В (по умолчанию вокруг героя)
//  --out     папка для png-кадров
// ============================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(__dirname, '../dist/chernolesie.html');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
const WEAPON = flag('--weapon', 'navi');
const FRAMES = parseInt(flag('--frames', '48'), 10);
const STEP = parseInt(flag('--step', '33'), 10);
// частота ударов на время съёмки: при боевой перезарядке в кадр попадает
// один удар и секунда простоя — для показа эффекта это пустая плёнка
const CD = parseFloat(flag('--cd', '0.7'));
const OUT = path.resolve(flag('--out', path.join(__dirname, '../shots/anim')));

if (!fs.existsSync(BUILD)) { console.error('Нет dist — сначала npm run build'); process.exit(1); }
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Нужен playwright: npm i -D playwright'); process.exit(1); }

const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
page.on('pageerror', e => console.log('ОШИБКА СТРАНИЦЫ:', e.message));

await page.goto('file://' + BUILD, { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.click('#btnStartPoohd');
await page.waitForTimeout(8000);          // ждём, пока уйдёт титульная заставка

await page.evaluate(([weapon, step, cd]) => {
  xpNext = 1e9;                            // окно уровня не должно прервать съёмку
  weapons.length = 0;
  weapons.push({ id: weapon, cd: cd, t: 0, evo: false });
  if (weapon === 'zercalo') window.__pool = true;
  // перехват rAF: дальше кадры идут только когда мы попросим
  window.__pending = null;
  window.requestAnimationFrame = (cb) => { window.__pending = cb; return 1; };
  window.__t = performance.now();
  window.__step = () => {
    const cb = window.__pending; window.__pending = null;
    if (!cb) return false;
    window.__t += step;
    P.fx = 1; P.fy = 0;                    // взгляд зафиксирован — направление видно честно
    if (window.__pool) { zercaloPool = 400; kostiStacks = 9; }
    cb(window.__t);
    return true;
  };
}, [WEAPON, STEP, CD]);

for (let i = 0; i < FRAMES; i++) {
  const ok = await page.evaluate(() => window.__step());
  if (!ok) { console.log('кадр', i, '— игра не запросила отрисовку, пропуск'); await page.waitForTimeout(30); }
  await page.screenshot({ path: path.join(OUT, `f${String(i).padStart(3, '0')}.png`) });
}
console.log(`снято ${FRAMES} кадров по ${STEP} мс -> ${OUT}`);
await browser.close();
