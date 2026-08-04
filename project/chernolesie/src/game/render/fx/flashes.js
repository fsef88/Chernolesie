// ============================================================
//  FX: Flash Effects (по канону Vampire Survivors)
// ============================================================

export function drawFlashes(ctx, flashes, cam, FXS) {
  for (const f of flashes) {
    const a = f.t / f.max;
    const k = 1 - a;
    const px = f.x - cam.x;
    const py = f.y - cam.y;

    const _fw = (f.w != null ? f.w : (f.big ? 1 : 0));
    const r = (7 + 9 * _fw) * (0.4 + k) * FXS;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // (1) Кольца — ударная волна
    ctx.strokeStyle = f.color;
    const _rings = _fw >= 0.5 ? 3 : 2;
    for (let i = 0; i < _rings; i++) {
      const rr = r * (1 + i * 0.42);
      const al = a * (1 - i * 0.3) * (0.45 + 0.55 * _fw);
      if (al <= 0) continue;
      ctx.globalAlpha = al;
      ctx.lineWidth = (3 - i) * (0.6 + 0.4 * _fw);
      ctx.beginPath();
      ctx.arc(px, py, rr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // (2) Белое ядро (только на тяжёлых ударах)
    if (_fw > 0.55) {
      ctx.globalAlpha = a * 0.34 * (_fw - 0.55) / 0.45;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(px, py, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // (3) Крестики-искры (главный приём VS)
    const n = 3 + Math.round(6 * _fw);
    ctx.globalAlpha = a;
    for (let pass = 0; pass < 2; pass++) {
      ctx.strokeStyle = pass === 0 ? 'rgba(20,14,6,0.85)' : '#fff';
      ctx.lineWidth = (pass === 0 ? 4.2 : 2.0) * Math.min(1.8, FXS);
      for (let i = 0; i < n; i++) {
        const ang = (f.x * 0.7 + f.y * 1.3 + i * 2.399);
        const d = r * (1.15 + ((i * 37) % 13) / 13 * 0.95);
        const sx = px + Math.cos(ang) * d;
        const sy = py + Math.sin(ang) * d;
        const sz = (3.0 + 2.2 * _fw) * (0.45 + a * 0.55) * FXS;

        ctx.beginPath();
        ctx.moveTo(sx - sz, sy);
        ctx.lineTo(sx + sz, sy);
        ctx.moveTo(sx, sy - sz);
        ctx.lineTo(sx, sy + sz);
        ctx.stroke();
      }
    }

    // (4) Лучи на крупных вспышках
    if (f.big) {
      ctx.globalAlpha = a * 0.55;
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const ang = (f.x * 0.3 + i * 1.5708);
        ctx.beginPath();
        ctx.moveTo(px + Math.cos(ang) * r * 0.7, py + Math.sin(ang) * r * 0.7);
        ctx.lineTo(px + Math.cos(ang) * r * 1.85, py + Math.sin(ang) * r * 1.85);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}