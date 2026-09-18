#!/usr/bin/env node
/**
 * Source checks for leftover CTA/a11y names (complementary to PRs #25–#31).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const fails = [];

function assert(cond, msg) {
  if (!cond) fails.push(msg);
}

assert(html.includes('id="product-modal-qty-minus"'), 'modal minus control needs an id');
assert(html.includes('id="product-modal-qty-plus"'), 'modal plus control needs an id');
assert(
  app.includes('Diminuir quantidade de ${item.nome}') && app.includes('Aumentar quantidade de ${item.nome}'),
  'modal qty buttons must include the product name'
);
assert(
  app.includes("createElement('article')") && (app.match(/createElement\('article'\)/g) || []).length >= 2,
  'catalog and cabaz cards should be articles'
);
assert(
  extras.includes('alt=""') && extras.includes('qs-photo'),
  'Quem Somos gallery images should be decorative'
);
assert(
  extras.includes('Anterior — ${nomeSeccao}') && extras.includes('Seguinte — ${nomeSeccao}'),
  'carousel arrows should include the section title'
);
assert(html.includes('hr-stars" aria-hidden="true"'), 'hero rating stars should be decorative');
assert(html.includes('gb-stars" id="gb-stars" aria-hidden="true"'), 'Google badge stars should be decorative');
assert(html.includes('aria-modal="true" aria-label="Preferências de privacidade"'), 'consent dialog needs aria-modal');
assert(html.includes('type="button" class="float-cart"'), 'float-cart needs type=button');
assert(html.includes('type="button" class="float-legumes"'), 'float-legumes needs type=button');
assert(css.includes('.btn-prim:focus-visible'), 'Comprar Agora needs a focus ring');
assert(css.includes('.shop-link:focus-visible'), 'featured catalog links need a focus ring');
assert(css.includes('.carousel-nav:focus-visible'), 'carousel arrows need a focus ring');
assert(css.includes('.footer-links a:focus-visible'), 'footer links need a focus ring');
assert(css.includes('.veg-suggestion:focus-visible'), 'legumes CTA needs a focus ring');
assert(html.includes('estilos.css?v=38'), 'CSS cache bust');
assert(html.includes('app.js?v=33'), 'app.js cache bust');
assert(html.includes('extras.js?v=22'), 'extras.js cache bust');

if (fails.length) {
  console.error('FAIL');
  fails.forEach((f) => console.error(' -', f));
  process.exit(1);
}
console.log('OK: modal CTA / leftover a11y source checks passed');
