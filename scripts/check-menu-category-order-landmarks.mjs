#!/usr/bin/env node
/**
 * Guards for leftover mobile-menu / category-shortcut / order landmarks.
 * Complementary to PR #74 (main-nav / mobile-bar, not these),
 * PR #34 (desktop social-dock landmark), PR #9 (menu overlay / trap),
 * PR #70 (hamburger expanded), PR #25 (shortcut types / decorative alts),
 * PR #4 (order visible labels), PR #21 (order-form name attributes).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=38'),
  'index.html should keep estilos.css?v=64 and app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=25'
);
assert(
  /<nav class="mobile-menu" id="mobile-menu" aria-label="Menu">/.test(html) &&
  html.includes('onclick="toggleMenu()">Contacto</a>\n</nav>'),
  'leftover #mobile-menu should be a nav named Menu (from the existing hamburger)'
);
assert(
  /<nav class="cat-quick" aria-label="Categorias e carrinho">/.test(html) &&
  html.includes('id="quick-cart-count">0</b></span>\n  </button>\n</nav>'),
  'leftover .cat-quick should be a nav named from existing Categorias / Carrinho labels'
);
assert(
  /<form class="order-form" id="order-form" aria-label="Os Seus Dados" onsubmit="enviarWhatsApp\(event\)">/.test(html),
  'leftover #order-form should reuse the existing Os Seus Dados title'
);
assert(
  /<ul class="order-items" id="order-list" aria-label="A Sua Encomenda">/.test(html),
  'leftover #order-list should reuse the existing A Sua Encomenda title'
);
assert(
  /<nav id="main-nav">/.test(html) &&
  /<nav class="mobile-bar" id="mobile-bar">/.test(html),
  'must not redo leftover main-nav / mobile-bar landmarks (PR #74)'
);
assert(
  /<div class="social-panel">/.test(html) &&
  !html.includes('aria-label="Contactos rápidos"'),
  'must not redo leftover social-dock landmark (PR #34)'
);
assert(
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(html) &&
  !html.includes('aria-expanded="false"'),
  'must not redo leftover hamburger expanded (PR #70)'
);
assert(
  html.includes('<button class="cat-quick-btn" onclick="abrirCatalogo(\'frutas\')">') &&
  html.includes('<button class="cat-quick-btn cq-order" onclick="document.getElementById(\'encomenda\').scrollIntoView({behavior:\'smooth\'})">'),
  'must not redo leftover shortcut types (PR #25)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !html.includes('name="nome"') &&
  !html.includes('name="telemovel"') &&
  !html.includes('name="pesquisa"'),
  'must not redo leftover order visible labels (PR #4), order names (PR #21), or catalog names (PR #73)'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5 / #67) or cart stepper names (PR #31)'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26)'
);
assert(
  html.includes('role="dialog" aria-label="Sugestões de produtos">') &&
  !html.includes('id="cs-pop" hidden role="dialog" aria-modal="true"') &&
  html.includes('<div class="cabaz-modal-box">'),
  'must not redo leftover CS aria-modal / cabaz dialog role (PR #73)'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover 44px tap-target PRs or catalog tabpanel'
);

if (failures.length) {
  console.error('check-menu-category-order-landmarks failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-menu-category-order-landmarks: ok');
