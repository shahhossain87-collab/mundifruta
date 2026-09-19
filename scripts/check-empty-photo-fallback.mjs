#!/usr/bin/env node
/**
 * Guards leftover empty-foto fallback (Bravo Esmolfe after PR #62).
 * Complementary to PR #10 (above-fold eager images, not empty src),
 * PR #27 (width/height, not missing foto), PR #32 (gallery alt, not
 * catalog fallback), PR #62 (product data; foto stays empty).
 * Does not redo catalog qty names (#67), cabaz add names (#66),
 * cabaz-ver names (#64), search rings (#63), or 44px tap PRs.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const dados = readFileSync(join(root, 'js/dados.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') &&
  html.includes('js/app.js?v=39') &&
  html.includes('js/extras.js?v=22') &&
  html.includes('js/dados.js?v=24'),
  'index.html should cache-bust estilos.css?v=64, app.js?v=39, extras.js?v=22; dados.js stays ?v=24'
);
assert(
  /id="product-modal-image"[^>]*hidden/.test(html) &&
  !/id="product-modal-image" src=""/.test(html),
  'leftover product-modal image must not ship with src=""'
);
assert(
  app.includes('function htmlFoto') &&
  app.includes('function mostrarFotoModal') &&
  app.includes('${htmlFoto(item)}'),
  'catalog / featured / cabaz cards should render through htmlFoto'
);
assert(
  /if \(!src\) \{\s*return `<div class="photo-fallback"/.test(app),
  'htmlFoto should use the existing emoji fallback when urlFoto is empty'
);
assert(
  extras.includes('const src = urlFoto(item.foto)') &&
  extras.includes('<span class="cs-emoji">'),
  'leftover cross-sell thumbs should skip empty src'
);
assert(
  /nome:"Bravo Esmolfe premium"[\s\S]*?foto:""/.test(dados),
  'must not invent a Bravo Esmolfe photo in dados.js'
);
assert(
  css.includes('.product-modal-photo .photo-fallback') &&
  css.includes('.feature-photo .photo-fallback'),
  'modal and featured leftover fallbacks need a sized box'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #67 / #5) or cart stepper names (PR #31)'
);
assert(
  !app.includes('aria-label="Adicionar ${item.nome}') &&
  !app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  !html.includes('role="tabpanel"') &&
  !html.includes('for="cust-nome"'),
  'must not redo leftover cabaz/featured add names, cabaz-ver names, tabpanel, or order labels'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.search-input:focus-visible/.test(css) &&
  !/\.search-input:focus-visible/.test(css),
  'must not redo leftover 44px WhatsApp CTA or leftover search-ring PRs'
);

if (failures.length) {
  console.error('check-empty-photo-fallback failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-empty-photo-fallback: ok');
