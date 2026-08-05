#!/usr/bin/env python3
# ============================================================
#  addsheet.py — принять лист зоны одной командой.
#
#  Раньше на каждый лист уходил полный круг: снять фон нужным режимом,
#  посмотреть таблицу замера, решить, годится ли, вписать руками в три
#  файла — реестр, манифест, слот. Три ручные правки на лист, и каждая
#  из них уже приводила к ошибке.
#
#  Здесь всё это одной командой, а форма зоны берётся не из головы, а из
#  таблицы ниже, сверенной с боевым кодом. Инструмент сам выбирает режим
#  кадрирования, сам меряет и сам отказывает, если лист не сел.
#
#  Запуск:
#      python3 tools/addsheet.py kosti лист.png
#      python3 tools/addsheet.py klyuka лист.png --dry   (только проверка)
#
#  Требуется Python 3 с Pillow и numpy.
# ============================================================

import argparse
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ------------------------------------------------------------
#  ФОРМЫ ЗОН — сверено с боевым кодом, файл и функция указаны.
#  Если правится боевой код, правится и эта строка: расхождение здесь
#  означает, что игрок увидит не то, чем его оружие бьёт.
# ------------------------------------------------------------
ZONES = {
    'kosa': dict(
        код='weapons/set-a.js doKosa', форма='конус 86° по взгляду (эво 132°)',
        fit='apex', cell='256', охват=(25, 110), r90=0.7),
    'navi': dict(
        код='weapons/set-b.js doNavi', форма='конус 74° СТРОГО ЗА СПИНУ (эво 115°)',
        fit='apex', cell='256', охват=(25, 100), r90=0.7),
    'klyuka': dict(
        код='weapons/set-b.js doKlyuka', форма='круг радиуса R',
        fit='mass', cell='256', охват=(180, 360), r90=0.8),
    'zerno': dict(
        код='weapons/set-b.js tickSeeds', форма='круг 1.5R в момент взрыва',
        fit='mass', cell='256', охват=(180, 360), r90=0.8),
    'kolokol': dict(
        код='weapons/set-b.js doKolokol', форма='круг R, зона длящаяся',
        fit='mass', cell='256', охват=(180, 360), r90=0.8),
    'kosti': dict(
        код='weapons/set-c.js doKosti', форма='3-11 тонких лучей, полуширина 22',
        fit='bar', cell='256x64', охват=None, r90=None),
    'zercalo': dict(
        код='weapons/set-c.js doZercalo', форма='луч длиной R, полуширина 30',
        fit='bar', cell='320x64', охват=None, r90=None),
}

# Пороги приёмки. Взяты не с потолка: каждый отсеивает лист, который уже
# приходил и уже стоил круга.
ПРОЗРАЧНОСТЬ = 40.0   # % полупрозрачных пикселей. У дробного листа хвоста было 77,
                      # у принятого 11. Выше порога рисунок на игровом размере — каша.
УВОД = 0.12           # доля радиуса. Разброс между кадрами — это дрожание на экране.
ОСТАТОК = 0.2         # % пикселей с невычтенным фоном. Ноль требовать нельзя: на
                      # стыке тёмной обводки и фона всегда остаётся несколько
                      # спорных точек. Ореол же начинается с процентов — у листа
                      # косы до починки despill их было 7.4.


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f'chromakey не отработал:\n{r.stdout}\n{r.stderr}')
    return r.stdout


def parse_report(out):
    rows = []
    for line in out.splitlines():
        m = re.match(r'\s*(\d)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s+([\d.]+)\s*\|'
                     r'\s*([-+][\d.]+)\s+([-+][\d.]+)\s*\|\s*(\d+)', line)
        if m:
            rows.append(dict(кадр=int(m[1]), масса=float(m[2]), r50=float(m[3]),
                             r90=float(m[4]), cx=float(m[5]), cy=float(m[6]),
                             охват=float(m[7])))
    return rows


def measure(path):
    import numpy as np
    from PIL import Image
    a = np.array(Image.open(path).convert('RGBA'), dtype=float)
    rgb, al = a[:, :, :3], a[:, :, 3] / 255.0
    R, G, B = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    m = al > 0.05
    if not m.sum():
        sys.exit('Лист пустой')
    полупрозрачные = ((al > 0.05) & (al < 0.75)).sum() / m.sum() * 100
    остаток = (m & (B > G + 25) & (R > G + 25)).sum() / m.sum() * 100
    return полупрозрачные, float(остаток)


def проверить(zone, rows, полупрозрачные, остаток):
    беды = []
    пик = sorted(rows, key=lambda r: -r['масса'])[:4]
    if полупрозрачные > ПРОЗРАЧНОСТЬ:
        беды.append(f'полупрозрачных {полупрозрачные:.0f}% при пороге {ПРОЗРАЧНОСТЬ:.0f} — '
                    f'рисунок дробный, на игровом размере станет кашей')
    if остаток > ОСТАТОК:
        беды.append(f'остатков фона {остаток:.2f}% при пороге {ОСТАТОК} — '
                    f'вокруг эффекта будет ореол')
    if zone['охват']:
        lo, hi = zone['охват']
        плохие = [r for r in пик if not (lo <= r['охват'] <= hi)]
        if плохие:
            беды.append(f'охват пиковых кадров {[int(r["охват"]) for r in плохие]}° '
                        f'вне {lo}-{hi}° — форма не совпадает с зоной поражения')
    if zone['r90']:
        мелкие = [r for r in пик if r['r90'] < zone['r90']]
        if мелкие:
            беды.append(f'r90 пиковых кадров {[r["r90"] for r in мелкие]} ниже {zone["r90"]} — '
                        f'эффект мельче зоны поражения')
    # у конуса и луча масса законно смещена вперёд, следим только за поперечным уводом
    поперёк = 'cy'
    разброс = max(abs(r[поперёк]) for r in пик)
    if разброс > УВОД:
        беды.append(f'увод поперёк удара до {разброс:+.2f} при пороге {УВОД} — '
                    f'эффект будет ездить вбок относительно героя')
    if zone['fit'] == 'mass':
        вдоль = max(abs(r['cx']) for r in пик)
        if вдоль > УВОД:
            беды.append(f'увод вдоль {вдоль:+.2f} при пороге {УВОД} — круговой эффект '
                        f'должен стоять по центру')
    return беды


def прописать(wid, имя_файла):
    """Три правки, которые раньше делались руками."""
    конст = wid.upper() + '_ZONE_SHEET'
    рег = os.path.join(ROOT, 'src/game/data/art-registry.js')
    s = open(рег, encoding='utf-8').read()
    if конст not in s:
        якорь = "const KOSA_ZONE_SHEET"
        i = s.index(якорь)
        j = s.index('\n', i) + 1
        s = s[:j] + (f"const {конст:<20} = (function(){{const i=new Image(); "
                     f"i.src='@@A:art/art-registry/{имя_файла}@@'; return i;}})();\n") + s[j:]
        open(рег, 'w', encoding='utf-8').write(s)

    ман = os.path.join(ROOT, 'src/build.manifest.json')
    s = open(ман, encoding='utf-8').read()
    ключ = f'"art/art-registry/{имя_файла}"'
    if ключ not in s:
        якорь = '  "art/art-registry/kosa-zone-sheet.webp": "image/webp",'
        s = s.replace(якорь, якорь + f'\n  {ключ}: "image/webp",')
        open(ман, 'w', encoding='utf-8').write(s)

    fx = os.path.join(ROOT, 'src/game/data/weapon-fx.js')
    s = open(fx, encoding='utf-8').read()
    if f'WFX_SHEETS.{wid}=' not in s:
        якорь = (" if(typeof KOSA_ZONE_SHEET!=='undefined')"
                 "WFX_SHEETS.kosa={im:KOSA_ZONE_SHEET,brief:true};")
        s = s.replace(якорь, якорь + f"\n if(typeof {конст}!=='undefined')"
                                     f"WFX_SHEETS.{wid}={{im:{конст},brief:true}};")
        open(fx, 'w', encoding='utf-8').write(s)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('weapon', choices=sorted(ZONES))
    ap.add_argument('src')
    ap.add_argument('--dry', action='store_true', help='только проверить, ничего не менять')
    ap.add_argument('--grid', default='4x2',
                    help='сетка кадров во ВХОДНОМ листе; генератор не всегда '
                         'делает 4x2 — костяное копьё пришло 4x4')
    ap.add_argument('--pick', default=None,
                    help='какие кадры входного листа взять, через запятую, '
                         'ровно восемь штук')
    ap.add_argument('--inset', type=int, default=None,
                    help='подрезка ячеек; по умолчанию подбирается сама')
    a = ap.parse_args()

    z = ZONES[a.weapon]
    print(f'{a.weapon}: {z["форма"]}   [{z["код"]}]')

    имя = f'{a.weapon}-zone-sheet.webp'
    dst = os.path.join(ROOT, 'assets/art/art-registry', имя)
    tmp = dst + '.tmp.webp'   # расширение важно: Pillow выбирает формат по нему

    # Генератор иногда рисует по листу линии сетки: они попадают в кадр
    # тёмными полосами и ломают поиск острия. Пробуем без подрезки и с ней,
    # берём вариант с меньшим уводом поперёк удара.
    варианты = [a.inset] if a.inset is not None else [0, 8]
    лучший = None
    for ins in варианты:
        cmd = [sys.executable, os.path.join(ROOT, 'tools/chromakey.py'), a.src, tmp,
               '--grid', a.grid, '--out-grid', '4x2',
               '--fit', z['fit'], '--cell', z['cell'], '--inset', str(ins)]
        if a.pick:
            cmd += ['--pick', a.pick]
        out = run(cmd)
        rows = parse_report(out)
        if not rows:
            sys.exit('Не удалось прочитать замер chromakey')
        пик = sorted(rows, key=lambda r: -r['масса'])[:4]
        оценка = max(abs(r['cy']) for r in пик)
        if лучший is None or оценка < лучший[0]:
            with open(tmp, 'rb') as f:
                лучший = (оценка, ins, rows, f.read())
    _, ins, rows, данные = лучший
    with open(tmp, 'wb') as f:
        f.write(данные)

    полупрозрачные, остаток = measure(tmp)
    print(f'подрезка ячеек: {ins} px')
    print('кадр | масса | r50  r90 | увод cx cy | охват')
    for r in rows:
        print(f'{r["кадр"]:>4} | {r["масса"]:5.3f} | {r["r50"]:4.2f} {r["r90"]:4.2f} '
              f'| {r["cx"]:+5.2f} {r["cy"]:+5.2f} | {r["охват"]:5.0f}°')
    print(f'полупрозрачных {полупрозрачные:.1f}%, остатков фона {остаток:.2f}%')

    беды = проверить(z, rows, полупрозрачные, остаток)
    if беды:
        print('\nНЕ ПРИНЯТ:')
        for b in беды:
            print('  •', b)
        os.remove(tmp)
        sys.exit(1)

    print('\nПРИНЯТ')
    if a.dry:
        os.remove(tmp)
        print('(--dry: файл не сохранён, код не тронут)')
        return
    os.replace(tmp, dst)
    прописать(a.weapon, имя)
    print(f'{имя} положен, прописан в реестр, манифест и слот. Дальше: npm run build')


if __name__ == '__main__':
    main()
