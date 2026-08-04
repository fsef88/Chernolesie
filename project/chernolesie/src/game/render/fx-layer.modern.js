// ============================================================
//  FX Layer v8.0 — Модульная + оптимизированная версия
// ============================================================

import { drawWeaponTrails } from './fx/weapon-trails.js';
import { drawGemPops, drawAbsorbGlow } from './fx/particles.js';
import { drawFlashes } from './fx/flashes.js';
import { drawGemTails } from './fx/gem-effects.js';
import { isVisible, cullArray } from './fx/culling.js';

function drawFxLayer() {
  const FXS = Math.max(1, Math.min(2.4, 1 / (ZOOM || 1) * 0.85));

  // === ОПТИМИЗАЦИЯ: отсекаем невидимое ===
  const visibleGems = cullArray(ACTIVE.gems || [], cam, W, H);
  const visibleFlashes = cullArray(ACTIVE.flashes || [], cam, W, H);

  // 1. Хвосты гемов + поглощение
  drawGemTails(ctx, visibleGems, cam, FXS);
  drawGemPops(ctx, gemPops, cam, FXS);
  drawAbsorbGlow(ctx, absorbGlow, absorbCol, P, cam, FXS);

  // 2. Взрывы (оставляем как было)
  if (typeof activeExplosions !== 'undefined' && EXPLOSION_ANIM_SHEET && EXPLOSION_ANIM_SHEET.complete) {
    for (let i = activeExplosions.length - 1; i >= 0; i--) {
      const ex = activeExplosions[i];
      if (!isVisible(ex.x, ex.y, cam, W, H)) continue;
      ex.t += 1/60;
      const prog = Math.min(1, ex.t / ex.maxT);
      if (prog >= 1) { activeExplosions.splice(i, 1); continue; }

      const fIdx = Math.min(7, Math.floor(prog * 8));
      const col = fIdx % 4, row = Math.floor(fIdx / 4);
      const sx = col * 80, sy = row * 80;
      const drawSize = 90 * (ex.sc || 1);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.max(0, 1 - prog * 0.4);
      ctx.drawImage(EXPLOSION_ANIM_SHEET, sx, sy, 80, 80,
        ex.x - cam.x - drawSize/2, ex.y - cam.y - drawSize/2, drawSize, drawSize);
      ctx.restore();
    }
  }

  // 3. Частицы (пока старый код)
  ctx.globalAlpha = 1;
  for (const p of ACTIVE.particles) {
    if (!isVisible(p.x, p.y, cam, W, H)) continue;
    // ... старый код отрисовки частиц ...
  }

  // 4. Вспышки (новый модуль + culling)
  drawFlashes(ctx, visibleFlashes, cam, FXS);

  // 5. Следы оружия (новый модуль)
  drawWeaponTrails(ctx, slashes, cam, FXS, currentClass, weapons, CLASS_VISUALS, SLASH_ANIM_SHEET, KOSA_TRAIL_SHEET);

  // 6. Остальной код (молнии, стрелы, орбиты) — временно оставляем
  // ... (будет вынесено позже)
}

export { drawFxLayer };