#!/usr/bin/env node
/**
 * Guards the complementary storefront tweaks in this change:
 * - catalog/cabaz names are headings
 * - product/featured/cabaz/cross-sell/gallery images reserve size
 * - cart quantity changes are announced once
 * - optional order fields are a disclosure that moves focus
 * - Frutas/Legumes tabs stay in sync and accept arrow keys
 * - overlay dialogs contain overscroll
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

assert(
  app.includes('<h3 class="product-name">${item.nome}</h3>'),
  'Catalog and cabaz cards should expose the product name as an h3'
);
assert(
  (app.match(/<h3 class="product-name">\$\{item\.nome\}<\/h3>/g) || []).length >= 2,
  'Both catalog and cabaz renderers should use h3.product-name'
);
assert(
  !app.includes('<div class="product-name">${item.nome}</div>'),
  'Product names should no longer be unranked divs'
);
assert(
  css.includes('h3.product-name'),
  'Heading reset needed so h3.product-name keeps the card typography'
);

assert(
  app.includes('width="400" height="200"') && app.includes('width="400" height="185"'),
  'Catalog/cabaz (200) and featured (185) photos should declare width/height'
);
assert(
  extras.includes('width="84" height="84"'),
  'Cross-sell thumbnails should declare 84×84'
);
assert(
  extras.includes('width="400" height="400"'),
  'Quem Somos gallery photos should declare 400×400'
);

assert(
  html.includes('id="cart-live"') && html.includes('aria-live="polite"'),
  'A single cart live region should announce quantity changes'
);
assert(
  app.includes('function anunciarCarrinho') && app.includes('anuncioCarrinhoInicial'),
  'Cart announcements should skip the first empty paint'
);
assert(
  !html.includes('id="cart-count" aria-live'),
  'Do not put aria-live on every visible badge (would triple-announce)'
);

assert(
  /id="order-optional-toggle"[^>]*aria-expanded="false"/.test(html)
    || /aria-expanded="false"[^>]*id="order-optional-toggle"/.test(html.replace(/\s+/g, ' ')),
  'Optional order toggle should start collapsed'
);
assert(
  html.includes('aria-controls="order-optional"') && html.includes('onclick="mostrarCamposOpcionais()"'),
  'Optional fields should open through mostrarCamposOpcionais()'
);
assert(
  app.includes("document.getElementById('cust-levantamento')")
    && app.includes('primeiro.focus()'),
  'Opening optional fields should move focus to the pickup-time input'
);

assert(
  app.includes('const tab = btn || document.getElementById(`tab-${cat}`)'),
  'mostrarCategoria should still highlight the matching tab without a button argument'
);
assert(
  app.includes('function ligarSetasCategorias') && app.includes("e.key !== 'ArrowRight'"),
  'Frutas/Legumes tabs should move with arrow keys'
);
assert(
  app.includes('ligarSetasCategorias();'),
  'Arrow-key helper must run at init'
);

assert(
  css.includes('overscroll-behavior:contain') || css.includes('overscroll-behavior: contain'),
  'Modals should contain overscroll so the page behind does not rubber-band'
);
['.product-modal', '.cabaz-modal', '.privacy-modal', '.offer-reveal'].forEach((sel) => {
  const idx = css.indexOf(sel + ' {') >= 0 ? css.indexOf(sel + ' {') : css.indexOf(sel + '{');
  assert(idx >= 0, `${sel} rule missing`);
  if (idx >= 0) {
    const chunk = css.slice(idx, idx + 450);
    assert(
      /overscroll-behavior:\s*contain/.test(chunk),
      `${sel} should set overscroll-behavior: contain`
    );
  }
});

assert(
  html.includes('css/estilos.css?v=38') && html.includes('js/app.js?v=33') && html.includes('js/extras.js?v=22'),
  'Cache-bust query strings should match this change'
);

if (errors.length) {
  console.error('check-catalog-headings failed:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}
console.log('check-catalog-headings: ok');
