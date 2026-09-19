#!/usr/bin/env node
/**
 * Guards for leftover catalog qty names and leftover generic search
 * keyboard ring. Complementary to PR #61 (cabaz qty names, not catalog
 * leftover qty), PR #5 (generic Diminuir/Aumentar), PR #63 (Phase A
 * .shop-main search ring, not leftover cherry .search-input), PR #18
 * (cherry search ring on :focus), PR #31 (cart Menos/Mais), PR #32
 * (modal qty names), PR #11 (cabaz-modal-add *visible* plus).
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
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=39'),
  'index.html should cache-bust estilos.css?v=64 and app.js?v=39'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('js/dados.js?v=24'),
  'dados.js cache token should stay ?v=24'
);

const criarCard = app.slice(app.indexOf('function criarCard'), app.indexOf('function indexarProdutos'));
assert(
  criarCard.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  criarCard.includes('aria-label="Aumentar quantidade de ${item.nome}"') &&
  criarCard.includes('aria-label="Quantidade de ${item.nome}"'),
  'leftover catalog qty steppers should name the product'
);
assert(
  !criarCard.includes('aria-label="Diminuir">') &&
  !criarCard.includes('aria-label="Aumentar">'),
  'leftover catalog qty must not stay generic Diminuir/Aumentar'
);
assert(
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover cart stepper names (PR #31)'
);
assert(
  html.includes('aria-label="Diminuir quantidade">') &&
  html.includes('aria-label="Aumentar quantidade">'),
  'must not redo leftover product-modal qty labels (PR #32)'
);
assert(
  app.includes('function renderCabazes') &&
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"'),
  'leftover cabaz qty names from PR #61 must stay'
);

assert(
  /(^|\n)\s*\.search-input:focus-visible \{/.test(css) &&
  !/(^|\n)\s*\.search-input:focus \{/.test(css),
  'leftover generic .search-input should use :focus-visible (not always-on :focus)'
);
assert(
  css.includes('border-color:var(--cherry)') &&
  css.includes('box-shadow:0 14px 32px rgba(196,30,58,0.12)'),
  'leftover cherry search ring color must stay'
);
assert(
  /\.photo-wrap:focus-visible, \.search-input:focus-visible \{/.test(css) &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover catalog forest :focus-visible list should include leftover .search-input'
);
assert(
  /\.shop-main \.search-input:focus \{/.test(css),
  'must not redo leftover Phase A .shop-main .search-input:focus (PR #63)'
);

assert(
  /<button type="button" class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋<\/button>/.test(html),
  'leftover cabaz-modal add should be type=button and stay a visible plus'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>'),
  'product-modal / featured add stay a visible plus (PR #2 / #31)'
);
assert(
  app.includes('onclick="adicionarProduto(\'${id}\', produtos_map[\'${id}\'])">＋ Adicionar</button>'),
  'must not redo leftover catalog visible Adicionar (PR #60)'
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
assert(
  html.includes('class="hamburger" onclick="toggleMenu()" aria-label="Menu"') &&
  html.includes('class="mobile-close" onclick="toggleMenu()"') &&
  html.includes('class="search-clear" id="search-clear" onclick="limparPesquisa()"'),
  'must not redo leftover hamburger / mobile-close / search-clear types (PR #63)'
);

if (failures.length) {
  console.error('check-catalog-qty-search-ring failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-catalog-qty-search-ring: ok');
