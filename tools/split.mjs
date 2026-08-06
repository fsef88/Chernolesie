// ============================================================
//  split.mjs — разовая операция: монолит -> дерево исходников
//
//  Что делает:
//   1. Режет исходный HTML по картe из tools/manifest.mjs.
//   2. Вынимает КАЖДЫЙ base64 (спрайты, шрифт, живопись) в
//      настоящий файл в assets/ и ставит на его место маркер.
//   3. Пишет src/build.manifest.json — рецепт обратной сборки.
//   4. Тут же собирает всё назад и сверяет SHA-256 с оригиналом.
//      Не сошлось — значит разбор неверен, и об этом будет сказано.
//
//  Запуск: node tools/split.mjs
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as M from './manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = path.join(ROOT, M.SOURCE);
const OUT  = path.join(ROOT, 'src');
const ASSETS = path.join(ROOT, 'assets');

const NO_ASSETS = process.argv.includes('--no-assets');

// --- чтение с сохранением переводов строк -------------------
const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split(/(?<=\n)/);          // терминатор остаётся в строке
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const text = (from, to) => lines.slice(from - 1, to).join('');

console.log(`Исходник: ${M.SOURCE}`);
console.log(`  строк ${lines.length}, ${(Buffer.byteLength(raw, 'utf8') / 1048576).toFixed(2)} МБ`);
console.log(`  sha256 ${sha(raw)}\n`);

// ------------------------------------------------------------
//  1. Собираем плоский список именованных кусков
// ------------------------------------------------------------
const named = [];
const add = (rel, from, to, note) => named.push({ rel, from, to, note });

add('head.html', ...M.HEAD_RANGE, 'head: мета, иконки, подключение SDK Яндекса');
for (const [f, a, b, n] of M.STYLES)  add(`styles/${f}`, a, b, n);
for (const [f, a, b, n] of M.MARKUP)  add(`markup/${f}`, a, b, n);
add('game/data/sprite-atlas.js', ...M.EMB_RANGE, 'window.EMB — все кадры анимаций');
add('game/data/hero-warrior-v674.orphan.js', ...M.ORPHAN_RANGE,
    'НЕ ИСПОЛНЯЕТСЯ: в оригинале лежит между </script> и <script>. См. docs/known-issues.md');
for (const [f, a, b, n] of M.GAME)     add(`game/${f}`, a, b, n);
for (const [f, a, b, n] of M.PLATFORM) add(`game/platform/${f}`, a, b, n);

named.sort((x, y) => x.from - y.from);

// проверка на пересечения
for (let i = 1; i < named.length; i++) {
  if (named[i].from <= named[i - 1].to) {
    throw new Error(`Диапазоны пересекаются: ${named[i - 1].rel} (${named[i - 1].from}-${named[i - 1].to}) и ${named[i].rel} (${named[i].from}-${named[i].to})`);
  }
}

// ------------------------------------------------------------
//  2. Части документа: именованные файлы + «швы» между ними
// ------------------------------------------------------------
const parts = [];
let cursor = 1;
for (const n of named) {
  if (n.from > cursor) parts.push({ lit: text(cursor, n.from - 1) });
  parts.push({ file: n.rel, note: n.note, lines: [n.from, n.to] });
  cursor = n.to + 1;
}
if (cursor <= lines.length) parts.push({ lit: text(cursor, lines.length) });

// ------------------------------------------------------------
//  3. Вынос base64 в настоящие файлы
// ------------------------------------------------------------
const EXT = {
  'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/png': 'png', 'image/gif': 'gif',
  'font/ttf': 'ttf', 'font/woff': 'woff', 'font/woff2': 'woff2',
  'application/font-woff': 'woff', 'application/x-font-ttf': 'ttf',
};
const DATA_URI = /data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})/g;
const EMB_KEY  = /["']([^"']+?\.(?:png|webp|jpg))["']\s*[:=]\s*["']data:/g;
const RAW_B64  = /(['"])([A-Za-z0-9+/]{500,}={0,2})\1/g;

const assets = {};            // rel -> { mime, bytes }
const used = new Set();

function uniq(rel) {
  if (!used.has(rel)) { used.add(rel); return rel; }
  const e = path.extname(rel), b = rel.slice(0, -e.length);
  let i = 2; while (used.has(`${b}-${i}${e}`)) i++;
  used.add(`${b}-${i}${e}`); return `${b}-${i}${e}`;
}

// имя ассета по коду слева от него
function guessName(chunk, idx, fallback) {
  const back = chunk.slice(Math.max(0, idx - 400), idx);
  const ids = back.match(/[A-Za-z_$][A-Za-z0-9_$]{2,}/g) || [];
  for (let i = ids.length - 1; i >= 0; i--) {
    const id = ids[i];
    if (/^(data|image|webp|jpeg|png|base64|src|url|font|new|Image|const|let|var|function|return)$/i.test(id)) continue;
    if (/[A-Z]/.test(id)) return id.replace(/_+/g, '-').toLowerCase();
  }
  return fallback;
}

function extractAssets(chunk, rel) {
  if (NO_ASSETS) return chunk;

  // а) атлас спрайтов: ключ объекта = готовый путь файла
  const keyAt = new Map();
  let km;
  EMB_KEY.lastIndex = 0;
  while ((km = EMB_KEY.exec(chunk))) keyAt.set(km.index + km[0].length - 5, km[1]);

  const group = rel.startsWith('styles/') || rel === 'head.html' ? 'ui'
              : rel.includes('sprite-atlas') || rel.includes('warrior-v674') ? 'sprites'
              : 'art/' + path.basename(rel, '.js');

  let out = '', last = 0, i = 0, m;
  DATA_URI.lastIndex = 0;
  while ((m = DATA_URI.exec(chunk))) {
    const [full, mime, b64] = m;
    const ext = EXT[mime] || 'bin';
    const key = keyAt.get(m.index);
    let arel;
    if (key) {
      arel = `sprites/${key.replace(/\.(png|jpg)$/i, '.' + ext)}`;
      used.add(arel);
    } else {
      arel = uniq(`${group}/${guessName(chunk, m.index, path.basename(rel).split('.')[0] + '-' + (++i))}.${ext}`);
    }
    assets[arel] = { mime, b64 };
    out += chunk.slice(last, m.index) + `@@A:${arel}@@`;
    last = m.index + full.length;
  }
  chunk = last ? out + chunk.slice(last) : chunk;

  // б) «голый» base64 без префикса data: — так сделан Змей Горыныч (_mk).
  //    Первый проход уже убрал всё, что шло с префиксом, ложных срабатываний нет.
  out = ''; last = 0;
  RAW_B64.lastIndex = 0;
  while ((m = RAW_B64.exec(chunk))) {
    const b64 = m[2];
    const mime = sniff(b64);
    if (!mime) continue;
    const arel = uniq(`${group}/${guessName(chunk, m.index, path.basename(rel).split('.')[0] + '-raw-' + (++i))}.${EXT[mime]}`);
    assets[arel] = { mime, b64 };
    out += chunk.slice(last, m.index) + m[1] + `@@B:${arel}@@` + m[1];
    last = m.index + m[0].length;
  }
  return last ? out + chunk.slice(last) : chunk;
}

// определяем формат по сигнатуре, а не по расширению — его тут нет
function sniff(b64) {
  const h = Buffer.from(b64.slice(0, 24), 'base64');
  if (h.slice(0, 4).toString() === 'RIFF' && h.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  if (h[0] === 0xFF && h[1] === 0xD8) return 'image/jpeg';
  if (h[0] === 0x89 && h.slice(1, 4).toString() === 'PNG') return 'image/png';
  if (h[0] === 0x00 && h[1] === 0x01 && h[2] === 0x00 && h[3] === 0x00) return 'font/ttf';
  return null;
}

// ------------------------------------------------------------
//  4. Запись
// ------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(ASSETS, { recursive: true, force: true });

const write = (base, rel, data) => {
  const p = path.join(base, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, data);
  return p;
};

let bytesSrc = 0;
for (const p of parts) {
  if (!p.file) continue;
  const body = extractAssets(text(p.lines[0], p.lines[1]), p.file);
  write(OUT, p.file, body);
  bytesSrc += Buffer.byteLength(body, 'utf8');
}

let bytesAssets = 0;
for (const [rel, a] of Object.entries(assets)) {
  const buf = Buffer.from(a.b64, 'base64');
  write(ASSETS, rel, buf);
  bytesAssets += buf.length;
}

const manifest = {
  source: M.SOURCE,
  sha256: sha(raw),
  generated: new Date().toISOString().slice(0, 10),
  assets: Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, v.mime])),
  parts: parts.map(p => p.file
    ? { file: p.file, note: p.note, srcLines: p.lines }
    : { lit: p.lit }),
};
fs.writeFileSync(path.join(OUT, 'build.manifest.json'), JSON.stringify(manifest, null, 1));

// ------------------------------------------------------------
//  5. Обратная сборка и сверка
// ------------------------------------------------------------
const { assemble } = await import('./assemble.mjs');
const rebuilt = assemble(ROOT);
const ok = sha(rebuilt) === sha(raw);

const files = parts.filter(p => p.file).length;
console.log(`Разделов исходников : ${files}`);
console.log(`Файлов ассетов      : ${Object.keys(assets).length}  (${(bytesAssets / 1048576).toFixed(2)} МБ)`);
console.log(`Код после выноса    : ${(bytesSrc / 1048576).toFixed(2)} МБ`);
console.log(`\nСверка round-trip   : ${ok ? 'СОВПАЛО байт в байт ✓' : 'РАСХОЖДЕНИЕ ✗'}`);
if (!ok) {
  const a = raw, b = rebuilt;
  let d = 0; while (d < a.length && d < b.length && a[d] === b[d]) d++;
  console.log(`  первое различие на позиции ${d}`);
  console.log(`  оригинал: ${JSON.stringify(a.slice(d - 60, d + 60))}`);
  console.log(`  сборка  : ${JSON.stringify(b.slice(d - 60, d + 60))}`);
  process.exitCode = 1;
}
