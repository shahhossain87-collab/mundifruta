#!/usr/bin/env node
/**
 * Guards for leftover featured add names and leftover product-modal add
 * names. Complementary to leftover cabaz-modal add name (PR #61, merged)
 * and leftover catalog add name (PR #70). Does not restore leftover
 * Adicionar after add (PR #60), name leftover catalog qty (PR #67),
 * leftover cabaz card add (PR #66), leftover cabaz-ver (PR #64), leftover
 * hamburger expanded (PR #70), leftover empty-foto (PR #68), leftover
 * chrome types / search rings (PR #63 / #67), leftover cart Menos/Mais
 * (PR #31), leftover product-modal qty names (PR #32), leftover 44px /
 * peach-ring PRs, or JSON-LD.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=39'),
  'index.html should cache-bust estilos.css?v=64 and app.js?v=39'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js should stay ?v=21 and dados.js should stay ?v=25'
);

const featureBlock = app.slice(
  app.indexOf('function criarCardDestaque'),
  app.indexOf('function preencherDestaques')
);
assert(
  featureBlock.includes('class="feature-add"') &&
  featureBlock.includes('aria-label="Adicionar ${item.nome} ao carrinho"') &&
  /class="feature-add"[^>]*>＋<\/button>/.test(featureBlock),
  'leftover featured add should name the product and stay a visible plus'
);

const abrirProduto = app.slice(
  app.indexOf('function abrirProduto'),
  app.indexOf('function fecharProduto')
);
assert(
  /product-modal-add[\s\S]*setAttribute\('aria-label', `Adicionar \$\{item\.nome\} ao carrinho`\)/.test(abrirProduto),
  'leftover product-modal add should get an accessible name from the open product'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html),
  'leftover product-modal add stays a visible plus'
);

const catalogBlock = app.slice(
  app.indexOf('function criarCard('),
  app.indexOf('function indexarProdutos')
);
assert(
  catalogBlock.includes('＋ Adicionar') &&
  !catalogBlock.includes('aria-label="Adicionar ${item.nome} ao carrinho"'),
  'must not redo leftover catalog add name (PR #70)'
);
assert(
  catalogBlock.includes('aria-label="Diminuir"') &&
  catalogBlock.includes('aria-label="Aumentar"'),
  'must not redo leftover catalog qty names (PR #67)'
);

const cabazBlock = app.slice(
  app.indexOf('function renderCabazes'),
  app.indexOf('function abrirCabaz')
);
assert(
  cabazBlock.includes('>＋</button>') &&
  !cabazBlock.includes('aria-label="Adicionar ${item.nome} ao carrinho"'),
  'must not redo leftover cabaz card add name (PR #66)'
);
assert(
  cabazBlock.includes('👁 Ver o que leva') &&
  !cabazBlock.includes('Ver o que leva no ${item.nome}'),
  'must not redo leftover cabaz-ver name (PR #64)'
);

assert(
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"') &&
  html.includes('aria-label="Diminuir quantidade"') &&
  html.includes('aria-label="Aumentar quantidade"'),
  'must not redo leftover cart stepper names (PR #31) or leftover product-modal qty names (PR #32)'
);
assert(
  /<button class="hamburger"[^>]*aria-label="Menu">/.test(html) &&
  !html.includes('aria-controls="mobile-menu"') &&
  app.includes("function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }"),
  'must not redo leftover hamburger expanded (PR #70)'
);
assert(
  app.includes('imagem.src = urlFoto(item.foto)') &&
  html.includes('id="product-modal-image" src=""'),
  'must not redo leftover empty-foto fallback (PR #68)'
);
assert(
  css.includes('.shop-main .search-input:focus {') &&
  !css.includes('.shop-main .search-input:focus-visible') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover search rings, catalog tabpanel helpers, or order labels'
);
assert(
  extras.includes('function cartaoCS') &&
  !extras.includes('aria-label="Adicionar ${item.nome} ao carrinho"'),
  'must not redo leftover cross-sell ＋ names (PR #4)'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.feature-add \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.product-modal-add:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css),
  'must not redo leftover 44px tap-target or peach-ring PRs'
);
assert(
  html.includes('"@type": "GroceryStore"') &&
  !html.includes('"alternateName"') &&
  !html.includes('"paymentAccepted"'),
  'must not change leftover JSON-LD'
);

if (failures.length) {
  console.error('check-featured-modal-add-names failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-featured-modal-add-names: ok');
