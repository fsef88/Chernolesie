// ============================================================
//  FX Culling — безопасное отсечение невидимых эффектов
//  CULL_MARGIN = 120px — рисуем чуть за краем экрана, чтобы не было резкого исчезновения
// ============================================================

const CULL_MARGIN = 140;

export function isVisible(x, y, cam, W, H) {
  const sx = x - cam.x;
  const sy = y - cam.y;
  return sx > -CULL_MARGIN &&
         sy > -CULL_MARGIN &&
         sx < W + CULL_MARGIN &&
         sy < H + CULL_MARGIN;
}

export function cullArray(arr, cam, W, H, keyX = 'x', keyY = 'y') {
  if (!arr || arr.length === 0) return [];
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (isVisible(item[keyX], item[keyY], cam, W, H)) {
      result.push(item);
    }
  }
  return result;
}