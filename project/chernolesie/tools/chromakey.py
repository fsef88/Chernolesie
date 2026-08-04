#!/usr/bin/env python3
# ============================================================
#  chromakey.py — офлайн-подготовка спрайт-листов эффектов.
#
#  Нейросеть отдаёт кадры на magenta-фоне (#FF00FF) без альфы.
#  Игра рисует эффекты через globalCompositeOperation='lighter',
#  поэтому фон обязан быть полностью прозрачным: любой остаток
#  magenta светится розовым прямоугольником поверх карты.
#
#  Наивный «убрать всё, что похоже на #FF00FF» не работает:
#  у сгенерированных листов фон с виньеткой — в центре (249,1,248),
#  по углам (72,4,76). Порог, снимающий центр, оставляет углы,
#  порог, снимающий углы, съедает сам эффект.
#
#  Здесь фон моделируется полиномом 2-й степени по каждому каналу,
#  ключ считается относительно локальной яркости фона, а цвет
#  восстанавливается обратным альфа-смешиванием (despill).
#
#  Это разовый инструмент художника, в сборку игры он не входит.
#  Требуется Python 3 с Pillow и numpy:
#      pip install Pillow numpy
#
#  Использование:
#      python3 tools/chromakey.py вход.png выход.webp
#      python3 tools/chromakey.py вход.png выход.webp --grid 4x3 \
#              --pick 0,1,3,4,6,7,9,10 --out-grid 4x2 --cell 160
#
#  --grid      сетка кадров во входном листе (столбцы x строки)
#  --pick      какие кадры оставить, по порядку слева направо сверху вниз
#  --out-grid  сетка выходного листа
#  --cell      сторона квадратной ячейки выходного листа
#
#  Без --grid лист просто чистится «как есть», без перекладки кадров.
# ============================================================

import argparse
import sys

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit('Нужны Pillow и numpy: pip install Pillow numpy')


def parse_grid(text):
    cols, rows = text.lower().split('x')
    return int(cols), int(rows)


def background_model(rgb, bg_mask):
    """Гладкая модель фона: полином 2-й степени по каждому каналу.

    Фон-виньетка меняется плавно, поэтому квадратичной поверхности
    хватает, а шум генерации она заодно сглаживает."""
    h, w = rgb.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    x = (xx / w - 0.5).ravel()
    y = (yy / h - 0.5).ravel()
    basis = np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], axis=1)

    sel = bg_mask.ravel()
    if sel.sum() < 64:
        raise SystemExit('Фон не найден: похоже, это не magenta-хромакей')

    model = np.empty((h, w, 3), dtype=np.float64)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(basis[sel], rgb[:, :, c].ravel()[sel], rcond=None)
        model[:, :, c] = (basis @ coef).reshape(h, w)
    return np.clip(model, 0, 255)


def key(img):
    """Magenta -> альфа. Возвращает RGBA float64."""
    src = np.array(img.convert('RGBA'), dtype=np.float64)
    rgb, alpha_in = src[:, :, :3], src[:, :, 3]

    # «Магентовость»: у фона зелёный провален, у эффекта — нет.
    magentaness = np.minimum(rgb[:, :, 0], rgb[:, :, 2]) - rgb[:, :, 1]

    # Опорные пиксели фона: заведомо магента и не выбитые прошлой чисткой.
    bg_mask = (magentaness > 40) & (rgb[:, :, 1] < 60)
    bg = background_model(rgb, bg_mask)
    bg_key = np.maximum(np.minimum(bg[:, :, 0], bg[:, :, 2]) - bg[:, :, 1], 1.0)

    alpha = np.clip(1.0 - magentaness / bg_key, 0.0, 1.0)
    alpha[alpha_in < 8] = 0.0            # то, что уже было прозрачным
    alpha[alpha < 0.02] = 0.0            # обрезка шума по краям

    # Обратное альфа-смешивание: comp = a*F + (1-a)*BG  ->  F = (comp - (1-a)*BG)/a
    safe = np.maximum(alpha, 1e-3)[:, :, None]
    fg = np.clip((rgb - (1.0 - alpha)[:, :, None] * bg) / safe, 0, 255)
    fg[alpha == 0] = 0

    return np.dstack([fg, alpha * 255.0])


def cut(rgba, cols, rows):
    h, w = rgba.shape[:2]
    cw, ch = w // cols, h // rows
    return [rgba[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]
            for r in range(rows) for c in range(cols)]


def union_box(frames, threshold=6.0):
    """Общая рамка содержимого по всем кадрам.

    Кадрируются все кадры одинаково — иначе эффект прыгает по экрану."""
    box = None
    for f in frames:
        ys, xs = np.nonzero(f[:, :, 3] > threshold)
        if not len(xs):
            continue
        b = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
        box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]),
                                     max(box[2], b[2]), max(box[3], b[3]))
    if box is None:
        raise SystemExit('Все кадры пустые')
    return box


def square(box, w, h):
    """Дотянуть рамку до квадрата: ячейки выходного листа квадратные."""
    x0, y0, x1, y1 = box
    side = max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    x0 = int(round(cx - side / 2))
    y0 = int(round(cy - side / 2))
    return x0, y0, x0 + side, y0 + side


def crop_pad(frame, box):
    """Вырезать рамку, дополняя прозрачным всё, что вышло за кадр."""
    x0, y0, x1, y1 = box
    out = np.zeros((y1 - y0, x1 - x0, 4), dtype=np.float64)
    sx0, sy0 = max(x0, 0), max(y0, 0)
    sx1, sy1 = min(x1, frame.shape[1]), min(y1, frame.shape[0])
    if sx1 > sx0 and sy1 > sy0:
        out[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = frame[sy0:sy1, sx0:sx1]
    return out


def to_image(rgba):
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--grid')
    ap.add_argument('--pick')
    ap.add_argument('--out-grid', default='4x2')
    ap.add_argument('--cell', type=int, default=160)
    args = ap.parse_args()

    rgba = key(Image.open(args.src))

    if not args.grid:
        to_image(rgba).save(args.dst)
        print(f'{args.dst}: чистка без перекладки, {rgba.shape[1]}x{rgba.shape[0]}')
        return

    frames = cut(rgba, *parse_grid(args.grid))
    if args.pick:
        frames = [frames[int(i)] for i in args.pick.split(',')]

    box = square(union_box(frames), frames[0].shape[1], frames[0].shape[0])
    cell = args.cell
    cols, rows = parse_grid(args.out_grid)
    if len(frames) != cols * rows:
        sys.exit(f'Кадров {len(frames)}, а сетка {cols}x{rows} ждёт {cols * rows}')

    sheet = Image.new('RGBA', (cols * cell, rows * cell), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        tile = to_image(crop_pad(f, box)).resize((cell, cell), Image.LANCZOS)
        sheet.paste(tile, ((i % cols) * cell, (i // cols) * cell))

    sheet.save(args.dst, lossless=True) if args.dst.endswith('.webp') else sheet.save(args.dst)
    print(f'{args.dst}: {cols}x{rows} по {cell}px, кадр-рамка {box}')


if __name__ == '__main__':
    main()
