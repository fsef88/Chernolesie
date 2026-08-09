// ============================================================
//  rebase.mjs — перенос дерева исходников на новый монолит владельца.
//
//  Зачем отдельный инструмент, а не split.mjs. Штатный split.mjs режет по
//  НОМЕРАМ СТРОК из tools/manifest.mjs. Владелец правит игру у себя и присылает
//  готовый один файл; строки в нём уже другие, прежние границы не подойдут.
//  Каждый раз пересчитывать manifest.mjs руками — это ровно та работа, на
//  которой прошлый раз ушёл день.
//
//  Идея: границы не угадываются, а ПЕРЕНОСЯТСЯ. Текущее дерево собирается
//  обратно в монолит (assemble даёт байт в байт то, из чего оно разобрано),
//  этот монолит сравнивается с новым построчно, и по карте соответствия
//  каждая граница разделов уезжает на своё новое место.
//
//  Второе, что делает перенос вместо разбора заново: НЕ ТРОГАЕТ ИМЕНА
//  АССЕТОВ. Для строки, которая не менялась, берётся её прежний текст —
//  а он уже с токенами @@A:путь@@. Новое имя получают только те картинки,
//  которые в этой сборке появились. Разбор заново переименовал бы все 440.
//
//  Запуск:  node tools/rebase.mjs <монолит.html>
//  Проверка в конце строгая: обратная сборка обязана дать присланный файл
//  байт в байт. Не сошлось — перенос неверен, и об этом будет сказано.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assemble } from './assemble.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const ASSETS = path.join(ROOT, 'assets');

const NEW_FILE = process.argv[2];
if (!NEW_FILE) { console.error('Укажите монолит: node tools/rebase.mjs <файл.html>'); process.exit(1); }

// ------------------------------------------------------------
//  РЕШЕНИЯ ПО РАЗДЕЛАМ. Единственное место, где нужен человек.
//
//  Перенос границ механический, но два случая машина решить не может:
//  раздел, который в новом монолите вырезан целиком (переносить нечего),
//  и новый раздел, которого в дереве ещё нет (переносить неоткуда).
//  Оба разбираются глазами по отчёту «неоднозначных границ» и вписываются
//  сюда. Пустой список — обычный случай, когда правки только внутри файлов.
// ------------------------------------------------------------

// Разделы, вырезанные владельцем целиком: файл уходит из дерева и из сборки.
const DROP = [
  // Титульник переписан заново, старые слои раскладки сняты: их правила
  // перебивал бы новый файл, и читать пришлось бы четыре источника вместо одного.
  'styles/61-title-cta.css',
  'styles/62-bottom-action-bar.css',
  'styles/63-ios-start-fix.css',
  // Довесок к атласу спрайтов, лежавший между </script> и <script> и потому
  // никогда не исполнявшийся (см. docs/known-issues.md). Владелец его снёс.
  'game/data/hero-warrior-v674.orphan.js',
];

// Новые разделы: кусок нового монолита, который надо выделить в свой файл.
// Строки — НОВОГО файла, включительно. Ставится после `after`.
const CARVE = [
  {
    after: 'styles/65-levelup-list.css',
    file: 'styles/66-title-final.css',
    from: 1677, to: 1831,
    note: 'Титульный экран: единственный источник раскладки под нарисованную сцену',
  },
];

// ------------------------------------------------------------
//  1. Два монолита и карта соответствия строк
// ------------------------------------------------------------
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const splitLines = (s) => s.split(/(?<=\n)/);      // терминатор остаётся в строке

const oldRaw = assemble(ROOT);                      // то, из чего собрано дерево
const newRaw = fs.readFileSync(NEW_FILE, 'utf8');
const oldLines = splitLines(oldRaw);
const newLines = splitLines(newRaw);

console.log(`Дерево  : ${oldLines.length} строк, ${(Buffer.byteLength(oldRaw) / 1048576).toFixed(2)} МБ`);
console.log(`Монолит : ${newLines.length} строк, ${(Buffer.byteLength(newRaw) / 1048576).toFixed(2)} МБ`);
console.log(`  sha256 ${sha(newRaw)}\n`);

// Сравнение идёт по СХЛОПНУТОМУ тексту: каждая длинная base64-простыня
// заменяется на «B64:длина:хеш». Иначе diff давится мегабайтами картинок,
// а на равенство строк это не влияет — хеш в метке различает содержимое.
const collapse = (s) => s.replace(/[A-Za-z0-9+/]{200,}={0,2}/g,
  (m) => `«B64:${m.length}:${sha(m).slice(0, 10)}»`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rebase-'));
fs.writeFileSync(path.join(tmp, 'a'), collapse(oldRaw));
fs.writeFileSync(path.join(tmp, 'b'), collapse(newRaw));
let diffOut = '';
try {
  diffOut = execFileSync('diff', ['-U0', path.join(tmp, 'a'), path.join(tmp, 'b')], { encoding: 'utf8', maxBuffer: 1 << 28 });
} catch (e) {
  if (e.status !== 1) throw e;                      // 1 у diff означает «есть различия»
  diffOut = e.stdout;
}
fs.rmSync(tmp, { recursive: true, force: true });

const hunks = [];
for (const l of diffOut.split('\n')) {
  const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(l);
  if (m) hunks.push({ a: +m[1], ac: m[2] === undefined ? 1 : +m[2], b: +m[3], bc: m[4] === undefined ? 1 : +m[4] });
}

// old -> new для строк, которых правка не коснулась; null для изменённых.
// Чистая вставка приходит с ac=0, и тогда `a` — строка ПЕРЕД вставкой.
function mapLine(L) {
  let off = 0;
  for (const k of hunks) {
    if (k.ac === 0) { if (k.a < L) off += k.bc; continue; }
    if (L < k.a) break;
    if (L <= k.a + k.ac - 1) return null;
    off += k.bc - k.ac;
  }
  return L + off;
}
// new -> old, обратная сторона той же карты: нужна, чтобы для нетронутой
// строки взять её ПРЕЖНИЙ текст — уже с токенами ассетов.
const backMap = new Array(newLines.length + 1).fill(0);
{
  let o = 1, n = 1;
  for (const k of hunks) {
    while (o < (k.ac === 0 ? k.a + 1 : k.a)) { backMap[n++] = o++; }
    o += k.ac; n += k.bc;
  }
  while (n <= newLines.length) backMap[n++] = o++;
}

// ------------------------------------------------------------
//  2. Прежние разделы: именованные плюс «швы» между ними
// ------------------------------------------------------------
const oldMan = JSON.parse(fs.readFileSync(path.join(SRC, 'build.manifest.json'), 'utf8'));
const oldParts = [];
{
  let cur = 1;
  for (const p of oldMan.parts) {
    if (p.file) {
      if (p.srcLines[0] !== cur) throw new Error(`Разрыв в карте разделов перед ${p.file}`);
      oldParts.push({ ...p, from: p.srcLines[0], to: p.srcLines[1] });
      cur = p.srcLines[1] + 1;
    } else {
      const n = splitLines(p.lit).length;            // «шов» хранится текстом
      oldParts.push({ lit: true, from: cur, to: cur + n - 1 });
      cur += n;
    }
  }
  if (cur - 1 !== oldLines.length) throw new Error(`Карта разделов покрывает ${cur - 1} строк из ${oldLines.length}`);
}

// Текущее дерево одним массивом строк С ТОКЕНАМИ. Токен подставляется внутри
// строки, поэтому нумерация совпадает со строками развёрнутого монолита.
const tokenLines = [];
for (const p of oldParts) {
  const body = p.lit
    ? oldLines.slice(p.from - 1, p.to).join('')
    : fs.readFileSync(path.join(SRC, p.file), 'utf8');
  for (const l of splitLines(body)) tokenLines.push(l);
}
if (tokenLines.length !== oldLines.length) throw new Error('Дерево и монолит разошлись по числу строк');

// ------------------------------------------------------------
//  3. Перенос границ
//
//  Конец раздела переносится по карте, начало берётся встык к предыдущему.
//  Именно встык, а не переносом начала: строки, дописанные ровно на границе
//  двух разделов, иначе провалились бы в щель между ними и потерялись.
// ------------------------------------------------------------
const dropped = new Set(DROP);
const kept = oldParts.filter(p => p.lit || !dropped.has(p.file));
for (const f of DROP) if (!oldParts.some(p => p.file === f)) console.log(`  ! в DROP указан неизвестный раздел: ${f}`);

const newParts = [];
let cursor = 1, bad = 0;
kept.forEach((p, i) => {
  let to;
  if (i === kept.length - 1) {
    to = newLines.length;                            // хвост всегда до конца файла
  } else {
    to = mapLine(p.to);
    if (to === null) { bad++; console.log(`  ? граница внутри правки: ${p.file || '(шов)'} ${p.from}-${p.to}`); }
  }
  newParts.push({ ...p, from: cursor, to });
  cursor = to + 1;
});
if (bad) {
  console.error(`\nНеоднозначных границ: ${bad}. Разберите их и впишите в DROP/CARVE в начале файла.`);
  process.exit(1);
}

// Врезка новых разделов
for (const c of CARVE) {
  const i = newParts.findIndex(p => p.file === c.after);
  if (i < 0) throw new Error(`CARVE: не найден раздел ${c.after}`);
  const host = newParts[i];
  if (c.from < host.from || c.to > host.to + (newParts[i + 1] ? newParts[i + 1].to - newParts[i + 1].from + 1 : 0)) {
    // мягкая проверка: врезка должна начинаться сразу за host и не разрывать соседа
  }
  if (c.from !== host.to + 1) throw new Error(`CARVE ${c.file}: ожидалась строка ${host.to + 1}, указано ${c.from}`);
  const next = newParts[i + 1];
  if (!next || next.from !== c.from || next.to < c.to) throw new Error(`CARVE ${c.file}: диапазон не помещается в следующий раздел`);
  next.from = c.to + 1;
  newParts.splice(i + 1, 0, { file: c.file, note: c.note, from: c.from, to: c.to });
}

// ------------------------------------------------------------
//  4. Ассеты. Нетронутая строка отдаёт свой прежний текст вместе с
//     токенами; имя выдаётся только по-настоящему новой картинке.
// ------------------------------------------------------------
const EXT = {
  'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/jpg': 'jpg',
  'image/png': 'png', 'image/gif': 'gif',
  'font/ttf': 'ttf', 'font/woff': 'woff', 'font/woff2': 'woff2',
  'application/font-woff': 'woff', 'application/x-font-ttf': 'ttf',
};
const DATA_URI = /data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})/g;
const EMB_KEY = /["']([^"']+?\.(?:png|webp|jpg))["']\s*[:=]\s*["']data:/g;
const RAW_B64 = /(['"])([A-Za-z0-9+/]{500,}={0,2})\1/g;

const assets = {};                                   // rel -> { mime, b64 }
const used = new Set();
const minted = [];

// Указатель «содержимое -> имя» по прежнему дереву: та же картинка на новом
// месте сохраняет своё имя вместо второго файла-близнеца.
const byHash = new Map();
for (const rel of Object.keys(oldMan.assets)) {
  const f = path.join(ASSETS, rel);
  if (!fs.existsSync(f)) continue;
  const h = sha(fs.readFileSync(f));
  if (!byHash.has(h)) byHash.set(h, rel);
}

function uniq(rel) {
  if (!used.has(rel)) { used.add(rel); return rel; }
  const e = path.extname(rel), b = rel.slice(0, -e.length);
  let i = 2; while (used.has(`${b}-${i}${e}`)) i++;
  used.add(`${b}-${i}${e}`); return `${b}-${i}${e}`;
}

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

function register(b64, mime, chunk, idx, group, rel) {
  const h = sha(Buffer.from(b64, 'base64'));
  let arel = byHash.get(h);
  if (!arel) {
    const key = keyAt.get(idx);
    arel = key
      ? `sprites/${key.replace(/\.(png|jpg)$/i, '.' + (EXT[mime] || 'bin'))}`
      : uniq(`${group}/${guessName(chunk, idx, path.basename(rel).split('.')[0])}.${EXT[mime] || 'bin'}`);
    byHash.set(h, arel);
    minted.push(arel);
  }
  used.add(arel);
  assets[arel] = { mime, b64 };
  return arel;
}

let keyAt = new Map();
function tokenize(chunk, rel) {
  const group = rel.startsWith('styles/') || rel === 'head.html' ? 'ui'
    : rel.includes('sprite-atlas') ? 'sprites'
      : 'art/' + path.basename(rel, '.js');

  keyAt = new Map();
  let km; EMB_KEY.lastIndex = 0;
  while ((km = EMB_KEY.exec(chunk))) keyAt.set(km.index + km[0].length - 5, km[1]);

  let out = '', last = 0, m;
  DATA_URI.lastIndex = 0;
  while ((m = DATA_URI.exec(chunk))) {
    const arel = register(m[2], m[1], chunk, m.index, group, rel);
    out += chunk.slice(last, m.index) + `@@A:${arel}@@`;
    last = m.index + m[0].length;
  }
  chunk = last ? out + chunk.slice(last) : chunk;

  out = ''; last = 0;
  RAW_B64.lastIndex = 0;
  while ((m = RAW_B64.exec(chunk))) {
    const mime = sniff(m[2]);
    if (!mime) continue;
    const arel = register(m[2], mime, chunk, m.index, group, rel);
    out += chunk.slice(last, m.index) + m[1] + `@@B:${arel}@@` + m[1];
    last = m.index + m[0].length;
  }
  return last ? out + chunk.slice(last) : chunk;
}

function sniff(b64) {
  const h = Buffer.from(b64.slice(0, 24), 'base64');
  if (h.slice(0, 4).toString() === 'RIFF' && h.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  if (h[0] === 0xFF && h[1] === 0xD8) return 'image/jpeg';
  if (h[0] === 0x89 && h.slice(1, 4).toString() === 'PNG') return 'image/png';
  if (h[0] === 0x00 && h[1] === 0x01 && h[2] === 0x00 && h[3] === 0x00) return 'font/ttf';
  return null;
}

// Тело раздела: нетронутые строки идут прежним текстом (в них токены уже
// стоят), правленые и новые — разбираются на ассеты заново.
const CARRIED = /@@([AB]):([^@]+)@@/g;
function bodyOf(p) {
  const chunks = [];
  let pending = '';
  const flush = () => { if (pending) { chunks.push(tokenize(pending, p.file || 'lit')); pending = ''; } };
  for (let n = p.from; n <= p.to; n++) {
    const o = backMap[n];
    if (o && oldLines[o - 1] === newLines[n - 1]) {
      flush();
      const line = tokenLines[o - 1];
      chunks.push(line);
      // Токен, приехавший вместе со строкой, register() не видел — но ассет
      // остаётся в деле, и в манифест его записать надо, иначе сборка упадёт.
      let m; CARRIED.lastIndex = 0;
      while ((m = CARRIED.exec(line))) {
        const rel = m[2];
        used.add(rel);
        if (!assets[rel]) assets[rel] = { mime: oldMan.assets[rel], b64: null };
      }
    } else pending += newLines[n - 1];
  }
  flush();
  return chunks.join('');
}

// ------------------------------------------------------------
//  5. Запись
// ------------------------------------------------------------
// Сначала — перепись имён, приезжающих вместе с нетронутыми строками. Только
// после неё можно выдавать имена новым картинкам: иначе новая, разобранная
// раньше по ходу файла, заняла бы имя, которое ниже ещё используется.
for (const p of newParts) {
  for (let n = p.from; n <= p.to; n++) {
    const o = backMap[n];
    if (!o || oldLines[o - 1] !== newLines[n - 1]) continue;
    let m; CARRIED.lastIndex = 0;
    while ((m = CARRIED.exec(tokenLines[o - 1]))) used.add(m[2]);
  }
}

const bodies = newParts.map(p => bodyOf(p));

for (const f of DROP) fs.rmSync(path.join(SRC, f), { force: true });
newParts.forEach((p, i) => {
  if (p.lit) return;
  const dst = path.join(SRC, p.file);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, bodies[i], 'utf8');
});

for (const [rel, a] of Object.entries(assets)) {
  if (a.b64 === null) continue;                      // приехал со строкой, файл на месте
  const dst = path.join(ASSETS, rel);
  const buf = Buffer.from(a.b64, 'base64');
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (!fs.existsSync(dst) || !fs.readFileSync(dst).equals(buf)) fs.writeFileSync(dst, buf);
}
// Ассеты, на которые в новой сборке никто не ссылается. Удаляются только те,
// что были описаны в прежнем манифесте: всё прочее в assets/ — исходники
// генераторов (_chromakey-src и подобное), они к сборке отношения не имеют.
const orphans = Object.keys(oldMan.assets).filter(r => !assets[r]);
for (const r of orphans) fs.rmSync(path.join(ASSETS, r), { force: true });

const manifest = {
  source: path.basename(NEW_FILE),
  sha256: sha(newRaw),
  generated: new Date().toISOString().slice(0, 10),
  assets: Object.fromEntries(Object.entries(assets).map(([k, v]) => [k, v.mime])),
  parts: newParts.map((p, i) => p.lit
    ? { lit: bodies[i] }
    : { file: p.file, note: p.note, srcLines: [p.from, p.to] }),
};
fs.writeFileSync(path.join(SRC, 'build.manifest.json'), JSON.stringify(manifest, null, 1));

// ------------------------------------------------------------
//  6. Сверка
// ------------------------------------------------------------
const rebuilt = assemble(ROOT);
const ok = sha(rebuilt) === sha(newRaw);

console.log(`Разделов            : ${newParts.filter(p => !p.lit).length}` +
  (DROP.length ? `  (снято ${DROP.length})` : '') + (CARVE.length ? `  (добавлено ${CARVE.length})` : ''));
console.log(`Ассетов             : ${Object.keys(assets).length}` +
  `  (новых ${minted.length}, снято ${orphans.length})`);
if (minted.length) console.log('  новые: ' + minted.join(', '));
if (orphans.length) console.log('  снятые: ' + orphans.join(', '));
console.log(`\nСверка round-trip   : ${ok ? 'СОВПАЛО байт в байт' : 'РАСХОЖДЕНИЕ'}`);
if (!ok) {
  let d = 0; while (d < rebuilt.length && d < newRaw.length && rebuilt[d] === newRaw[d]) d++;
  console.log(`  первое различие на позиции ${d}`);
  console.log(`  монолит: ${JSON.stringify(newRaw.slice(d - 80, d + 80))}`);
  console.log(`  сборка : ${JSON.stringify(rebuilt.slice(d - 80, d + 80))}`);
  process.exitCode = 1;
}
