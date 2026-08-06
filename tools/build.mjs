// ============================================================
//  build.mjs — сборка играбельного билда из дерева исходников.
//
//   node tools/build.mjs          -> dist/chernolesie.html
//        один файл со всем внутри — то, что уходит в Яндекс Игры
//
//   node tools/build.mjs --dev    -> dist/dev/index.html
//        каждый модуль и каждый ассет отдельным файлом:
//        в DevTools видно имя файла, ассеты правятся без пересборки
//
//   node tools/build.mjs --check  -> только сверка с эталоном, без записи
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { assemble } from './assemble.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'build.manifest.json'), 'utf8'));

const DEV   = process.argv.includes('--dev');
const CHECK = process.argv.includes('--check');
const sha = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const mb  = (n) => (n / 1048576).toFixed(2) + ' МБ';

// ------------------------------------------------------------
//  Прод: всё внутрь одного HTML
// ------------------------------------------------------------
function buildProd() {
  const html = assemble(ROOT);
  const same = sha(html) === manifest.sha256;

  if (!CHECK) {
    fs.mkdirSync(DIST, { recursive: true });
    fs.writeFileSync(path.join(DIST, 'chernolesie.html'), html, 'utf8');
  }

  console.log(`dist/chernolesie.html  ${mb(Buffer.byteLength(html, 'utf8'))}`);
  console.log(`sha256  ${sha(html)}`);
  console.log(same
    ? 'Совпадает с эталоном ' + manifest.source + ' — правок в игре нет.'
    : 'Отличается от эталона — в исходниках есть изменения (это нормально после правок).');
}

// ------------------------------------------------------------
//  Dev: стили — отдельными файлами, код — как в оригинале
//
//  Почему код НЕ разложен по <script src>: игра писалась как один
//  скрипт, и часть кода вычисляет имена функций прямо при загрузке
//  (core/input.js:39 вешает обработчик на togglePause из ui/overlays.js).
//  В одном скрипте это работает за счёт подъёма объявлений, в разных —
//  падает с ReferenceError. Поэтому модули склеиваются в те же три
//  <script>, что были в оригинале, а разбиение на файлы возвращает
//  source map: в DevTools видны исходные модули и в них ставятся точки
//  останова. Поведение при этом ровно как в прод-сборке.
// ------------------------------------------------------------
const B64C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const vlq = (n) => {
  let v = n < 0 ? ((-n) << 1) | 1 : (n << 1), s = '';
  do { let d = v & 31; v >>>= 5; if (v) d |= 32; s += B64C[d]; } while (v);
  return s;
};

// Склейка «строка в строку»: карта получается точной без всякого парсинга.
function concatWithMap(mods, name) {
  const sources = [], contents = [], out = [];
  let mappings = '', prevSrc = 0, prevLine = 0;

  mods.forEach(({ rel, code }, si) => {
    sources.push('/src/' + rel);
    contents.push(code);
    const ls = code.split('\n');
    if (ls[ls.length - 1] === '') ls.pop();
    ls.forEach((l, li) => {
      out.push(l);
      mappings += 'A' + vlq(si - prevSrc) + vlq(li - prevLine) + 'A' + ';';
      prevSrc = si; prevLine = li;
    });
  });

  return {
    code: out.join('\n') + `\n//# sourceMappingURL=${name}.map\n`,
    map: JSON.stringify({ version: 3, file: name, sources, sourcesContent: contents, names: [], mappings }),
  };
}

function buildDev() {
  const out = path.join(DIST, 'dev');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'styles'), { recursive: true });

  const files = manifest.parts.filter(p => p.file).map(p => p.file);
  const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8');

  // «Голый» base64 (@@B:) ссылкой заменить нельзя — код сам клеит префикс data:.
  const inlineRaw = (s) => s.replace(/@@B:([^@]+)@@/g,
    (_, rel) => fs.readFileSync(path.join(ROOT, 'assets', rel)).toString('base64'));
  // @@A: -> ссылка от корня сайта. Потому dev-сервер и поднимается из корня проекта.
  const prep = (s) => inlineRaw(s).replace(/@@A:([^@]+)@@/g, (_, rel) => '/assets/' + rel);

  const css = files.filter(f => f.endsWith('.css'));
  css.forEach(f => fs.writeFileSync(path.join(out, f), prep(read(f)), 'utf8'));

  // Три скрипта — ровно как в оригинальном документе.
  const blocks = [
    ['sprite-atlas.js', files.filter(f => f.endsWith('data/sprite-atlas.js'))],
    ['game.js',         files.filter(f => f.startsWith('game/') && f.endsWith('.js')
                                       && !f.endsWith('.orphan.js')
                                       && !f.endsWith('data/sprite-atlas.js')
                                       && !f.startsWith('game/platform/'))],
    ['yandex-games.js', files.filter(f => f.startsWith('game/platform/'))],
  ];

  let nMods = 0;
  for (const [name, list] of blocks) {
    const { code, map } = concatWithMap(list.map(rel => ({ rel, code: prep(read(rel)) })), name);
    fs.writeFileSync(path.join(out, name), code, 'utf8');
    fs.writeFileSync(path.join(out, name + '.map'), map, 'utf8');
    nMods += list.length;
  }

  const markup = files.filter(f => f.startsWith('markup/')).map(f => prep(read(f))).join('');
  fs.writeFileSync(path.join(out, 'index.html'),
    prep(read('head.html')) +
    css.map(f => `<link rel="stylesheet" href="${f}">\n`).join('') +
    '</head>\n<body>\n' + markup +
    blocks.map(([n]) => `<script src="${n}"></script>\n`).join('') +
    '</body>\n</html>\n', 'utf8');

  console.log(`dist/dev/index.html  — ${css.length} стилей, ${nMods} модулей в 3 скриптах + source maps`);
  console.log('Ассеты берутся из assets/ по ссылке — правятся без пересборки.');
  console.log('Запуск: npm run dev  ->  http://localhost:5173/');
}

DEV ? buildDev() : buildProd();
