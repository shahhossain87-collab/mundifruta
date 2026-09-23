#!/usr/bin/env node
/**
 * Guards for leftover Phase A catalog-sort keyboard ring and leftover
 * cabaz control names. Complementary to PR #16 (generic .price-sort
 * outline, not the Phase A .shop-main override), PR #4 / #18 (search
 * rings), PR #41 (16px sort), PR #43 (sort *size*), PR #5 (catalog
 * add/qty labels, not cabaz qty), PR #26 / #31 (product-modal /
 * featured add names; leftover cabaz-modal add name is new),
 * PR #11 (cabaz add *type*), PR #60 (visible Adicionar labels).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65') && html.includes('js/app.js?v=38'),
  'index.html should cache-bust estilos.css?v=65 and app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  !/\.shop-main \.price-sort:focus \{[^}]*outline:none/.test(css),
  'Phase A leftover .shop-main .price-sort:focus must not set outline:none'
);
assert(
  /\.shop-main \.price-sort:focus-visible \{/.test(css),
  'leftover catalog sort should use :focus-visible (not always-on :focus)'
);
assert(
  /\.price-sort:focus-visible/.test(css) &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover catalog :focus-visible forest ring must stay so the sort control can use it'
);
assert(
  html.includes('id="tab-ervas"') &&
  html.includes('id="tab-epoca"') &&
  html.includes('id="tab-promocoes"') &&
  html.includes('id="tab-cabazes"') &&
  /<button type="button" class="cat-tab"[^>]*id="tab-ervas"/.test(html) &&
  /<button type="button" class="cat-tab"[^>]*id="tab-epoca"/.test(html) &&
  /<button type="button" class="cat-tab"[^>]*id="tab-promocoes"/.test(html) &&
  /<button type="button" class="cat-tab"[^>]*id="tab-cabazes"/.test(html),
  'leftover Ervas / Época / Promoções / Cabazes tabs should be type=button'
);
assert(
  app.includes('function renderCabazes') &&
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"') &&
  app.includes('aria-label="Quantidade de ${item.nome}"'),
  'leftover cabaz qty steppers should name the cabaz'
);
assert(
  app.includes("addBtn.setAttribute('aria-label', `Adicionar ${item.nome} ao carrinho`)"),
  'leftover cabaz-modal add should get an accessible name from the open cabaz'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26)'
);
assert(
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>'),
  'featured add keeps a visible plus (PR #31)'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5) or cart stepper names (PR #31)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco') &&
  !app.includes('aria-label="Adicionar ${item.nome}'),
  'must not redo leftover order labels, catalog tabpanel helpers, or featured/modal add-name templates'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.price-sort \{[^}]*min-height:44px/.test(css) &&
  !/\.feature-add \{[^}]*min-width:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css),
  'must not redo leftover 44px tap-target PRs'
);
assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover peach rings or catalog tabpanel from open PRs'
);

if (failures.length) {
  console.error('check-sort-ring-cabaz-names failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-sort-ring-cabaz-names: ok');
