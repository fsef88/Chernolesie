// ============================================================
//  zip.mjs — упаковщик, который открывается Проводником Windows.
//
//  Зачем свой: штатные средства дают архив, который zipfldr.dll
//  считает «неверным форматом».
//    * Compress-Archive и .NET ZipFile под PowerShell 5.1 пишут в
//      путях обратные слэши вопреки спецификации;
//    * bsdtar (tar.exe) пишет записи потоком — флаг 0x08, размеры и
//      CRC уходят в data descriptor после данных.
//  Оба архива читаются .NET, tar и 7-Zip, но не Проводником.
//
//  Здесь классический формат: размеры и CRC в локальном заголовке,
//  никакого ZIP64, никаких data descriptor, имена в UTF-8 (бит 11).
//
//  Запуск: node tools/zip.mjs <архив.zip> <папка> [имя-корня-внутри]
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const LFH = 0x04034b50, CDH = 0x02014b50, EOCD = 0x06054b50;
const UTF8 = 0x0800;                       // бит 11: имена в UTF-8

// Дата в формате MS-DOS: 2 байта дата, 2 байта время, секунды с шагом 2.
function dosTime(d) {
  const yr = Math.max(1980, d.getFullYear());
  return {
    date: ((yr - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  };
}

function walk(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
    const abs = path.join(dir, e.name);
    const rel = base ? base + '/' + e.name : e.name;
    if (e.isDirectory()) out.push(...walk(abs, rel));
    else if (e.isFile()) out.push({ abs, rel });
  }
  return out;
}

// Уже сжатые форматы жать бесполезно — только время тратить.
const STORED = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.zip', '.woff2']);

export function zipDir(outFile, srcDir, rootName = '') {
  const files = walk(srcDir);

  // Записи каталогов обязательны. Без них Проводник не строит дерево: если в
  // корне архива нет ни одного файла напрямую (всё лежит внутри папки), он
  // показывает пусто и ругается «неверный формат». tar, 7-Zip и .NET такой
  // архив читают — расхождение обнаружилось только пробой через Shell.Application.
  const dirs = new Set();
  for (const f of files) {
    const parts = ((rootName ? rootName + '/' : '') + f.rel).split('/');
    parts.pop();
    for (let i = 1; i <= parts.length; i++) dirs.add(parts.slice(0, i).join('/') + '/');
  }

  const entries = [
    ...[...dirs].sort().map(d => ({ dir: true, name: d })),
    ...files.map(f => ({ dir: false, name: (rootName ? rootName + '/' : '') + f.rel, abs: f.abs })),
  ];

  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of entries) {
    const name = f.name;
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = f.dir ? Buffer.alloc(0) : fs.readFileSync(f.abs);
    const store = f.dir || STORED.has(path.extname(f.abs).toLowerCase());
    const data = store ? raw : zlib.deflateRawSync(raw, { level: 9 });
    // Если «сжатое» вышло больше исходного — кладём как есть.
    const useStore = store || data.length >= raw.length;
    const body = useStore ? raw : data;
    const method = useStore ? 0 : 8;
    const crc = zlib.crc32(raw);
    const { date, time } = dosTime(f.dir ? new Date() : fs.statSync(f.abs).mtime);

    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(LFH, 0);
    lfh.writeUInt16LE(20, 4);            // версия для распаковки
    lfh.writeUInt16LE(UTF8, 6);          // флаги: НЕТ бита 3 — размеры здесь, а не в дескрипторе
    lfh.writeUInt16LE(method, 8);
    lfh.writeUInt16LE(time, 10);
    lfh.writeUInt16LE(date, 12);
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(body.length, 18);
    lfh.writeUInt32LE(raw.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28);            // extra не пишем вовсе
    chunks.push(lfh, nameBuf, body);

    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(CDH, 0);
    cdh.writeUInt16LE(20, 4);            // версия создателя
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(UTF8, 8);
    cdh.writeUInt16LE(method, 10);
    cdh.writeUInt16LE(time, 12);
    cdh.writeUInt16LE(date, 14);
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(body.length, 20);
    cdh.writeUInt32LE(raw.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30);            // extra
    cdh.writeUInt16LE(0, 32);            // комментарий
    cdh.writeUInt16LE(0, 34);            // номер диска
    cdh.writeUInt16LE(0, 36);            // внутренние атрибуты
    // Внешние атрибуты: младший байт — атрибуты DOS (0x10 = каталог, его читает
    // Проводник), старшие два байта — права unix. Через `<<16` нельзя: сдвиг в JS
    // даёт знаковый int32 и 0o100644 уходит в минус.
    const unix = f.dir ? 0o040755 : 0o100644;
    cdh.writeUInt32LE(((unix * 0x10000) + (f.dir ? 0x10 : 0)) >>> 0, 38);
    cdh.writeUInt32LE(offset, 42);       // смещение локального заголовка
    central.push(cdh, nameBuf);

    offset += lfh.length + nameBuf.length + body.length;
  }

  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(EOCD, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cd.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  if (entries.length > 0xffff) throw new Error('больше 65535 файлов — нужен ZIP64');
  if (offset > 0xffffffff) throw new Error('больше 4 ГБ — нужен ZIP64');

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, Buffer.concat([...chunks, cd, eocd]));
  return { files: files.length, entries: entries.length, bytes: fs.statSync(outFile).size };
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('zip.mjs')) {
  const [out, dir, root] = process.argv.slice(2);
  if (!out || !dir) {
    console.error('node tools/zip.mjs <архив.zip> <папка> [имя-корня-внутри]');
    process.exit(1);
  }
  const r = zipDir(out, dir, root || '');
  console.log(`${out}\n  ${r.files} файлов, ${(r.bytes / 1048576).toFixed(1)} МБ`);
}
