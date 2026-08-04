// ============================================================
//  check.mjs — быстрая проверка исходников перед сборкой.
//   1. вся игра целиком парсится (как её видит браузер);
//   2. каждый модуль парсится сам по себе — значит рез прошёл
//      по границе конструкции, а не посередине функции;
//   3. ищутся повторные объявления одного имени в разных модулях
//      (в общей области видимости это SyntaxError у let/const).
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'build.manifest.json'), 'utf8'));

const mods = manifest.parts
  .filter(p => p.file && p.file.endsWith('.js') && !p.file.endsWith('.orphan.js'))
  .map(p => p.file);

const strip = (s) => s.replace(/@@[AB]:[^@]+@@/g, 'ASSET');
const read = (rel) => strip(fs.readFileSync(path.join(SRC, rel), 'utf8'));

const tmp = path.join(os.tmpdir(), 'chernolesie-check.js');
const nodeCheck = (code) => {
  fs.writeFileSync(tmp, code, 'utf8');
  try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); return null; }
  catch (e) { return (e.stderr || '').toString().split('\n').slice(0, 4).join('\n'); }
};

let bad = 0;

// 1) целиком
const whole = nodeCheck(mods.map(read).join('\n'));
console.log(whole ? `Вся игра целиком : ОШИБКА\n${whole}` : 'Вся игра целиком : парсится ✓');
if (whole) bad++;

// 2) по модулям
const standalone = mods.filter(m => nodeCheck(read(m)));
if (standalone.length) {
  console.log(`\nНе парсятся отдельно (${standalone.length}) — рез прошёл внутри конструкции:`);
  standalone.forEach(m => console.log('  ' + m));
} else {
  console.log(`Каждый модуль    : парсится отдельно ✓ (${mods.length} шт.)`);
}

// 3) дубли объявлений
const DECL = /^(?:function|class)\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
const seen = new Map();
const dups = [];
for (const m of mods) {
  const src = read(m);
  let d;
  DECL.lastIndex = 0;
  while ((d = DECL.exec(src))) {
    const name = d[1] || d[2];
    if (seen.has(name) && seen.get(name) !== m) dups.push(`${name}: ${seen.get(name)} и ${m}`);
    else seen.set(name, m);
  }
}
console.log(dups.length
  ? `\nПовторные объявления (${dups.length}):\n  ` + dups.join('\n  ')
  : `Имена верхнего уровня : дублей нет ✓ (${seen.size} шт.)`);
if (dups.length) bad++;

fs.rmSync(tmp, { force: true });
process.exitCode = bad ? 1 : 0;
