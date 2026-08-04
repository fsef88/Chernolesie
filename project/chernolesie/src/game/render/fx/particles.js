// ============================================================
//  FX: Particles & Gem Effects
// ============================================================

export function drawGemPops(ctx, gemPops, cam, FXS) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (const q of gemPops) {
    const a = q.t / q.max;
    const k = 1 - a;
    const px = q.x - cam.x;
    const py = q.y - cam.y;
    const rr = q.out
      ? (16 + 10 * q.sc) * k * FXS
      : (16 + 10 * q.sc) * a * FXS;

    ctx.globalAlpha = k * 0.9;
    ctx.strokeStyle = q.col;
    ctx.lineWidth = 2.4 * FXS;
    ctx.beginPath();
    ctx.arc(px, py, rr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = k;
    ctx.fillStyle = '#fff';
    const cs = 2.6 * k * FXS;
    ctx.beginPath();
    ctx.arc(px, py, cs, 0, Math.PI * 2);
    ctx.fill();

    // Лучи внутрь
    ctx.globalAlpha = k * 0.7;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.4 * FXS;
    for (let i = 0; i < 4; i++) {
      const an = i * 1.5708 + q.x * 0.05;
      ctx.beginPath();
      const l1 = q.out ? 0.85 : 1.25;
      const l2 = q.out ? 1.45 : 0.7;
      ctx.moveTo(px + Math.cos(an) * rr * l1, py + Math.sin(an) * rr * l1);
      ctx.lineTo(px + Math.cos(an) * rr * l2, py + Math.sin(an) * rr * l2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

export function drawAbsorbGlow(ctx, absorbGlow, absorbCol, P, cam, FXS) {
  if (absorbGlow <= 0.02) return;

  const ax = P.x - cam.x;
  const ay = P.y - cam.y;
  const ag = Math.min(1, absorbGlow);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  ctx.globalAlpha = ag * 0.32;
  ctx.strokeStyle = absorbCol;
  ctx.lineWidth = 2 * FXS;
  ctx.beginPath();
  ctx.arc(ax, ay, (P.r + 7 + 6 * ag) * FXS * 0.8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = ag * 0.18;
  ctx.beginPath();
  ctx.arc(ax, ay, (P.r + 13 + 9 * ag) * FXS * 0.8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}