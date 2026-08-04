// ============================================================
//  FX: Weapon Trails & Melee Effects
//  Следы оружия и ближнего боя (меч, коса, серп и т.д.)
// ============================================================

export function drawWeaponTrails(ctx, slashes, cam, FXS, currentClass, weapons, CLASS_VISUALS, SLASH_ANIM_SHEET, KOSA_TRAIL_SHEET) {
  const _swordForSlash = weapons.find(w => w.id === 'sword');
  const _slashEvo = _swordForSlash && _swordForSlash.evo;

  for (const s of slashes) {
    const k = s.t / 0.34;

    // Коса Моры
    if (s._kosa) {
      // v7.35: у косы появился свой лист зоны по заданию (WFX_SHEETS.kosa).
      // Старый след рисовался поверх него на 185% радиуса, сложением и без
      // обрезки по конусу — он и расплывался за границу зоны, превращая удар
      // в мазок. Один удар рисуется один раз: где есть лист, старый след лишний.
      const _kw = (typeof WFX_SHEETS !== 'undefined') && WFX_SHEETS.kosa;
      if (_kw && _kw.brief) continue;

      const kk = Math.min(1, s.t / 0.26);
      ctx.save();
      ctx.translate(P.x - cam.x, P.y - cam.y);
      ctx.rotate(s.ang);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = kk * 0.9;

      if (KOSA_TRAIL_SHEET && KOSA_TRAIL_SHEET.complete && KOSA_TRAIL_SHEET.naturalWidth) {
        const prog = 1 - Math.max(0, Math.min(1, s.t / 0.26));
        const fIdx = Math.min(7, Math.floor(prog * 8));
        const col = fIdx % 4, row = Math.floor(fIdx / 4);
        const sw = Math.floor(KOSA_TRAIL_SHEET.naturalWidth / 4);
        const sh = Math.floor(KOSA_TRAIL_SHEET.naturalHeight / 2);
        const drawSize = s.reach * 1.85;
        ctx.drawImage(KOSA_TRAIL_SHEET, col * sw, row * sh, sw, sh, -drawSize * 0.35, -drawSize * 0.5, drawSize, drawSize);
      } else {
        const arc = s.arc || 0.75;
        ctx.strokeStyle = s.evo ? '#d0b8ff' : '#b8c8d8';
        ctx.lineWidth = s.evo ? 26 : 18;
        ctx.beginPath();
        ctx.arc(0, 0, s.reach * 0.78, -arc, arc);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }

    // Обычный меч / классовые взмахи
    ctx.save();
    ctx.translate(P.x - cam.x, P.y - cam.y);
    ctx.rotate(s.ang);
    ctx.globalCompositeOperation = 'lighter';

    const isWarrior = (currentClass === 'warrior' || !currentClass);
    const isDruid = (currentClass === 'druid');
    const isRogue = (currentClass === 'rogue');
    const classVfx = CLASS_VISUALS[currentClass] || CLASS_VISUALS.warrior;
    const colMain = _slashEvo ? '#ff7a2e' : classVfx.color;
    const colAcc = _slashEvo ? '#ffaa44' : classVfx.accent;

    if (isWarrior && SLASH_ANIM_SHEET && SLASH_ANIM_SHEET.complete && SLASH_ANIM_SHEET.naturalWidth) {
      const progress = 1 - Math.max(0, Math.min(1, k));
      const fIdx = Math.min(7, Math.floor(progress * 8));
      const col = fIdx % 4, row = Math.floor(fIdx / 4);
      const sw = Math.floor(SLASH_ANIM_SHEET.naturalWidth / 4);
      const sh = Math.floor(SLASH_ANIM_SHEET.naturalHeight / 2);
      const drawSize = s.reach * 1.55;

      ctx.globalAlpha = Math.max(0.22, k);
      ctx.drawImage(SLASH_ANIM_SHEET, col * sw, row * sh, sw, sh, -drawSize * 0.30, -drawSize * 0.5, drawSize, drawSize);

      if (k > 0.32) {
        ctx.globalAlpha = k * 0.95;
        ctx.strokeStyle = '#fff7d0';
        ctx.lineWidth = 1.8;
        for (let i = 0; i < 4; i++) {
          const t2 = -0.60 + i * 0.40;
          const rr = s.reach * (0.86 + ((i * 29) % 7) / 7 * 0.1);
          const sx = Math.cos(t2) * rr, sy = Math.sin(t2) * rr, sz = 2.8 * k;
          ctx.beginPath();
          ctx.moveTo(sx - sz, sy);
          ctx.lineTo(sx + sz, sy);
          ctx.moveTo(sx, sy - sz);
          ctx.lineTo(sx, sy + sz);
          ctx.stroke();
        }
      }
    } else if (isDruid && DRUID_WAVE_SHEET && DRUID_WAVE_SHEET.complete && DRUID_WAVE_SHEET.naturalWidth) {
      // Аналогично для Знахарки (код можно вынести дальше)
      // ... (оставлено для краткости в первом проходе)
    } else if (isRogue && ROGUE_SLASH_SHEET && ROGUE_SLASH_SHEET.complete && ROGUE_SLASH_SHEET.naturalWidth) {
      // Аналогично для Воронника
    } else {
      // Fallback
      for (let g = 4; g >= 1; g--) {
        const off = g * 0.13 * (1 - k);
        const al = k * 0.16 * (1 - g / 5.5);
        if (al <= 0.01) continue;
        ctx.globalAlpha = al;
        ctx.strokeStyle = colMain;
        ctx.lineWidth = (_slashEvo ? 16 : 12) * (1 - g * 0.12);
        ctx.beginPath();
        ctx.arc(0, 0, s.reach * 0.82, -0.86 - off, 0.86 - off);
        ctx.stroke();
      }
      ctx.globalAlpha = k * 0.30;
      ctx.strokeStyle = colMain;
      ctx.lineWidth = _slashEvo ? 20 : 16;
      ctx.beginPath();
      ctx.arc(0, 0, s.reach * 0.82, -0.86, 0.86);
      ctx.stroke();
    }

    ctx.restore();
  }
}