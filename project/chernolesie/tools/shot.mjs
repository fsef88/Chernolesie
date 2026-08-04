// ============================================================
//  shot.mjs — снимки боя из собранной игры.
//
//  Нужен, чтобы правки картинки проверялись глазами, а не на веру. Живой
//  забег для этого не годится: вспышка зоны живёт 0.3 с, окно уровня
//  перебивает кадр, а сцена между запусками разная — сравнивать нечего.
//  Здесь забег вводится в одно и то же состояние: прокачка выключена,
//  оружие задано, вспышка зоны удерживается на выбранном кадре.
//
//  Запуск (нужен playwright: npm i -D playwright):
//      node tools/shot.mjs                 — текущий вид
//      node tools/shot.mjs --ground        — сравнить градации земли
//      node tools/shot.mjs --weapon kosa --k 0.6
//
//  --out   куда класть png (по умолчанию shots/ в корне проекта)
//  --k     на каком месте вспышки замереть: 1 — момент удара, 0 — конец
// ============================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(__dirname, '../dist/chernolesie.html');

const argv = process.argv.slice(2);
const flag = (n, d) => { const i = argv.indexOf(n); return i < 0 ? d : argv[i + 1]; };
const OUT = path.resolve(flag('--out', path.join(__dirname, '../shots')));
const WEAPON = flag('--weapon', 'kosa');
const K = parseFloat(flag('--k', '0.6'));
const GROUND = argv.includes('--ground');

if (!fs.existsSync(BUILD)) {
  console.error('Нет dist/chernolesie.html — сначала npm run build');
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Нужен playwright: npm i -D playwright'); process.exit(1); }

// Там, где браузеры лежат отдельно от пакета, путь берётся из PW_CHROMIUM.
const launch = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};
const browser = await chromium.launch(launch);
const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
page.on('pageerror', e => console.log('ОШИБКА СТРАНИЦЫ:', e.message));

await page.goto('file://' + BUILD, { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.click('#btnStartPoohd');
await page.waitForTimeout(8000);          // ждём, пока уйдёт титульная заставка

await page.evaluate(([weapon, k]) => {
  xpNext = 1e9;                            // окно уровня не должно перебивать кадр
  weapons.length = 0;
  weapons.push({ id: weapon, cd: 1.5, t: 0, evo: false });
  P.fx = 1; P.fy = 0;                      // взгляд строго вправо — кадры сравнимы
  window.__K = k;
  const orig = drawZonePulses;
  drawZonePulses = function () {
    for (const z of zonePulses) { z.t = z.max * window.__K; z.rot = 0; }
    return orig.call(this, 0);
  };
}, [WEAPON, K]);

const settle = async () => {
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(50);
    if (await page.evaluate(() => zonePulses.length === 1 && !!_gtVar)) return;
  }
};

if (GROUND) {
  // mul, sat — см. GROUND_GRADE в src/game/render/world-layers.js.
  // flat > 0 включает прежнюю плоскую заливку, чтобы было с чем сравнивать.
  const variants = [
    ['0-было', '#ffffff', 72, 0.16],
    ['1-мягко', '#a8b39c', 60, 0],
    ['2-средне', '#6f7d64', 38, 0],
    ['3-глубоко', '#4e5a48', 28, 0],
  ];
  for (const [tag, mul, sat, flat] of variants) {
    await page.evaluate(([mul, sat, flat]) => {
      GROUND_GRADE.mul = mul; GROUND_GRADE.sat = sat; GROUND_GRADE.flat = flat;
      _gtVar = null;                       // перепечь тайлы новым замесом
    }, [mul, sat, flat]);
    await settle();
    await page.screenshot({ path: path.join(OUT, `ground-${tag}.png`) });
    console.log('снят', tag, mul, sat);
  }
} else {
  await settle();
  const f = path.join(OUT, `${WEAPON}-k${String(K).replace('.', '')}.png`);
  await page.screenshot({ path: f });
  console.log('снят', f);
}
await browser.close();
