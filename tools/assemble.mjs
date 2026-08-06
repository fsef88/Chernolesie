// ============================================================
//  assemble.mjs — сборка дерева исходников обратно в один HTML.
//  Общая функция для build.mjs и для самопроверки split.mjs.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';

const TOKEN = /@@([AB]):([^@]+)@@/g;   // A — целиком data:-URI, B — «голый» base64

export function assemble(root) {
  const src = path.join(root, 'src');
  const manifest = JSON.parse(fs.readFileSync(path.join(src, 'build.manifest.json'), 'utf8'));

  // ассеты читаются один раз: одна и та же картинка может встречаться дважды
  const cache = new Map();
  const b64 = (rel) => {
    if (!cache.has(rel)) {
      if (!manifest.assets[rel]) throw new Error(`Ассет не описан в манифесте: ${rel}`);
      cache.set(rel, fs.readFileSync(path.join(root, 'assets', rel)).toString('base64'));
    }
    return cache.get(rel);
  };
  const expand = (kind, rel) =>
    kind === 'A' ? `data:${manifest.assets[rel]};base64,${b64(rel)}` : b64(rel);

  const out = [];
  for (const p of manifest.parts) {
    if (p.lit !== undefined) { out.push(p.lit); continue; }
    const body = fs.readFileSync(path.join(src, p.file), 'utf8');
    out.push(body.replace(TOKEN, (_, kind, rel) => expand(kind, rel)));
  }
  return out.join('');
}
