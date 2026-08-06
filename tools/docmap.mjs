// Генерирует docs/architecture.md из карты разделов и текущих файлов.
// Запуск: npm run docs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as M from './manifest.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const size = (rel) => {
  try { return Math.round(fs.statSync(path.join(SRC, rel)).size / 1024) + ' КБ'; }
  catch { return '—'; }
};
const lines = (rel) => {
  try { return fs.readFileSync(path.join(SRC, rel), 'utf8').split('\n').length; }
  catch { return 0; }
};

const table = (rows, base) => [
  '| Файл | Строк | Размер | Что внутри |',
  '|---|---:|---:|---|',
  ...rows.map(([f, , , note]) => `| \`${base}${f}\` | ${lines(base + f)} | ${size(base + f)} | ${note} |`),
].join('\n');

const groups = {};
for (const [f, a, b, n] of M.GAME) {
  const g = f.includes('/') ? f.split('/')[0] : '.';
  (groups[g] ||= []).push([f.split('/').slice(1).join('/'), a, b, n]);
}

const GROUP_TITLES = {
  boot: 'boot — вход в приложение',
  core: 'core — движок: канвас, ввод, цикл, пулы, утилиты',
  data: 'data — цифры и содержимое (правится дизайнером без риска)',
  state: 'state — изменяемое состояние забега',
  systems: 'systems — правила игры',
  entities: 'entities — игрок и враги',
  weapons: 'weapons — арсенал',
  render: 'render — всё, что рисует',
  ui: 'ui — экраны, оверлеи, иконография',
  audio: 'audio — звук и музыка',
  world: 'world — наполнение карты',
  platform: 'platform — интеграция с Яндекс Играми',
};

const total = [...M.STYLES, ...M.MARKUP, ...M.GAME, ...M.PLATFORM].length + 3;

const doc = `# Архитектура проекта

> Файл сгенерирован из \`tools/manifest.mjs\`. Не правь руками — правь карту и запусти \`npm run docs\`.

Игра исторически жила одним файлом \`${M.SOURCE}\` (14.1 МБ, 13 555 строк,
из них ~92 % — картинки в base64). Он разложен на **${total} разделов** и
**${Object.keys(JSON.parse(fs.readFileSync(path.join(SRC, 'build.manifest.json'), 'utf8')).assets).length} файлов ассетов**.
Сборка возвращает ровно тот же байт в байт HTML — это проверяется на каждой сборке.

## Как устроен репозиторий

\`\`\`
src/            исходники — только здесь идёт работа
  head.html       мета, иконки, подключение SDK Яндекса
  styles/         CSS по разделам интерфейса
  markup/         разметка HUD и оверлеев
  game/           игровой код
  build.manifest.json   рецепт обратной сборки (генерируется)
assets/         настоящие webp/jpg/ttf вместо base64
  sprites/        кадры анимаций (ключи = пути из window.EMB)
  art/            живопись: сундук, алтарь, ауры, боссы, эффекты
  ui/             шрифт, рамки панелей, медальон Печати, иконки
tools/          разбор, сборка, проверки, генерация документации
docs/           документация
dist/           результат сборки (в git не хранится)
\`\`\`

## Порядок исполнения

Игра — один общий скоуп, без модульной системы. Порядок файлов в
\`tools/manifest.mjs\` = порядок исполнения, и он **значим**: часть кода
вычисляет имена функций прямо при загрузке. Переставлять разделы можно
только вместе с проверкой \`npm run check\`.

## Стили — \`src/styles/\`

${table(M.STYLES, 'styles/')}

## Разметка — \`src/markup/\`

${table(M.MARKUP, 'markup/')}

## Игровой код — \`src/game/\`

${Object.entries(groups).map(([g, rows]) =>
  `### ${GROUP_TITLES[g] || g}\n\n${table(rows, 'game/' + g + '/')}`).join('\n\n')}

### platform — интеграция с Яндекс Играми

${table(M.PLATFORM, 'game/platform/')}

## Отдельно

| Файл | Что это |
|---|---|
| \`src/game/data/sprite-atlas.js\` | \`window.EMB\` — таблица «путь кадра → файл спрайта». Сами кадры лежат в \`assets/sprites/\`. |
| \`src/game/data/hero-warrior-v674.orphan.js\` | **Не исполняется.** В оригинале лежит между \`</script>\` и \`<script>\`. См. [known-issues.md](known-issues.md). |
`;

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'architecture.md'), doc, 'utf8');
console.log('docs/architecture.md обновлён');
