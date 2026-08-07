import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => fs.readFileSync(root + p, 'utf8');
const markup = read('/src/markup/30-title.html');
const code = read('/src/game/ui/screen-title.js');
const polish = read('/src/styles/69-menu-polish.css');

for (const id of ['tsFeaturedHero', 'tsDeckPrev', 'tsDeckNext', 'tsDeckPages', 'tsHeroName', 'btnStartPoohd']) {
  assert.ok(markup.includes(`id="${id}"`), `Не найден обязательный элемент #${id}`);
}
assert.ok(code.includes('featuredArt=CLASS_ART[c.id]'), 'Большой портрет не связан с выбранным классом');
assert.ok(code.includes('deckPage') && code.includes('paintDeck'), 'Нет кнопочной пагинации героев');
assert.ok(code.includes("touchstart") && code.includes("touchend") && code.includes('data-title-class'), 'Нет свайп-переключения героев');
assert.ok(polish.includes('border-radius:50%'), 'Портреты не обрезаются до круглого медальона');
assert.ok(polish.includes('.ts-class-deck .classcard p'), 'Описание не скрыто в мобильных карточках');
console.log('title menu static checks: 6/6 passed');
