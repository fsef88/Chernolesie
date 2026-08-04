// ============================================================
//  FX: Gem tail + absorption effects (отдельный модуль)
// ============================================================

export function drawGemTails(ctx, gems, cam, FXS) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const g of gems) {
    const tr = g._tr;
    if (!tr || !g.ms) continue;

    const i0 = ((g._ti | 0) + 1) & 3;
    const ox = tr[i0 * 2];
    const oy = tr[i0 * 2 + 1];
    const dx = g.x - ox;
    const dy = g.y - oy;

    if (dx * dx + dy * dy < 9) continue;

    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = g.col;
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.2 * (g.sc || 1) * FXS;
    ctx.beginPath();
    ctx.moveTo(ox - cam.x, oy - cam.y);
    ctx.lineTo(g.x - cam.x, g.y - cam.y);
    ctx.stroke();
  }

  ctx.lineCap = 'butt';
  ctx.restore();
}