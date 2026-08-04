// ============================================================
//  Optimized FX Layer — Vampire Survivors level smoothness
//  Цель: минимум state changes + aggressive culling
// ============================================================

import { isVisible } from './culling.js';

export function drawOptimizedFxLayer(ctx, data, cam, W, H, FXS, currentClass) {
  const {
    gemPops, absorbGlow, absorbCol, P,
    flashes, slashes, particles,
    ACTIVE, cam: _cam, weapons, CLASS_VISUALS
  } = data;

  // === 1. AGGRESSIVE CULLING ===
  const visibleFlashes = flashes.filter(f => isVisible(f.x, f.y, cam, W, H));
  const visibleSlashes = slashes.filter(s => isVisible(P.x, P.y, cam, W, H)); // slashes are near player

  // === 2. MINIMIZE CONTEXT STATE CHANGES ===
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Гемы + поглощение (уже culled в вызывающем коде)
  // ... (оставляем текущую реализацию, но с cull)

  // Вспышки (culled)
  for (const f of visibleFlashes) {
    // ... (логика вспышек из flashes.js, но без лишних save/restore внутри цикла)
  }

  ctx.restore();

  // === 3. Weapon trails (самый важный для хлёсткости) ===
  // Вызываем отдельно, чтобы не ломать composite operation
  // drawWeaponTrails(...) — будет вызываться из основного слоя

  // === 4. Частицы — culled + batch ===
  ctx.save();
  for (const p of particles) {
    if (!isVisible(p.x, p.y, cam, W, H)) continue;
    // ... отрисовка
  }
  ctx.restore();
}