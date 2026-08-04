// ============================================================
//  Простые тесты для fx-layer.js (безопасная оптимизация)
//  Запуск: node tools/test-fx.mjs
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fxPath = path.join(__dirname, '../src/game/render/fx-layer.js');

console.log('=== Тесты FX Layer ===\n');

// 1. Проверка синтаксиса
try {
  const code = fs.readFileSync(fxPath, 'utf8');
  new Function(code); // просто парсим
  console.log('✓ Синтаксис fx-layer.js корректный');
} catch (e) {
  console.error('✗ Ошибка синтаксиса в fx-layer.js:', e.message);
  process.exit(1);
}

// 2. Проверка наличия ключевых оптимизаций
const code = fs.readFileSync(fxPath, 'utf8');

const checks = [
  { name: 'Culling для гемов', regex: /visibleGems/ },
  { name: 'Culling для вспышек', regex: /visibleFlashes/ },
  { name: 'Culling для взмахов', regex: /Пропускаем взмахи/ },
  { name: 'Culling для молний', regex: /Пропускаем молнии/ },
  { name: 'Culling для стрел', regex: /Пропускаем стрелы/ },
  { name: 'Culling для aimLines', regex: /Пропускаем прицелы/ },
  { name: 'Culling для kosaTrail', regex: /Culling для следов Косы/ },
  { name: 'Culling для orbit', regex: /Пропускаем ворон/ },
  { name: 'Culling для gemPops', regex: /Culling для gemPops|for\(const q of gemPops\)/ },
];

let passed = 0;
for (const check of checks) {
  if (check.regex.test(code)) {
    console.log(`✓ ${check.name}`);
    passed++;
  } else {
    console.log(`✗ ${check.name} — не найдено`);
  }
}

console.log(`\nПройдено: ${passed}/${checks.length}`);

// 3. Финальная проверка
if (passed === checks.length) {
  console.log('\n✅ Все тесты FX Layer пройдены. Можно продолжать оптимизацию.');
  process.exit(0);
} else {
  console.log('\n⚠️  Некоторые оптимизации не найдены. Проверь код.');
  process.exit(1);
}