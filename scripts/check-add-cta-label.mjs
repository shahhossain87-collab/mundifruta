#!/usr/bin/env node
/**
 * Guards for leftover catalog/cabaz "＋ Adicionar" labels.
 * Complementary to PR #2 (visible modal CTA text, not catalog/cabaz cards),
 * PR #5 (add/qty aria-labels, not the visible card label), PR #26 / #31
 * (modal / featured accessible names; featured visible "＋" stays),
 * PR #11 (cabaz add type=button), PR #43 / #45 (add tap sizes).
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
  html.includes('css/estilos.css?v=43') && html.includes('js/app.js?v=37'),
  'index.html should cache-bust app.js?v=37 and keep estilos.css?v=43'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  app.includes("＋ Adicionar</button>") &&
  app.includes('function criarCard') &&
  app.includes('function renderCabazes'),
  'catalog and cabaz cards should use the leftover "＋ Adicionar" label'
);
assert(
  /add\.textContent = add\.classList\.contains\('feature-add'\) \? '＋' : '＋ Adicionar'/.test(app),
  'atualizarEstadoProduto should restore catalog/cabaz "＋ Adicionar" and keep featured "＋"'
);
assert(
  !/if \(add\) add\.textContent = '＋';/.test(app),
  'must not wipe leftover catalog add labels back to a bare plus'
);
assert(
  html.includes('id="product-modal-add"') &&
  html.includes('class="product-modal-add"') &&
  html.includes('adicionarDoModal()') &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26)'
);
assert(
  app.includes('class="feature-add"') &&
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>'),
  'featured add keeps a visible plus (PR #31)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco') &&
  !app.includes('aria-label="Adicionar ${item.nome}'),
  'must not redo leftover order labels or catalog / filter helpers from open PRs'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/\.feature-add \{[^}]*min-width:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css),
  'must not redo leftover 44px tap-target PRs'
);
assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover focus rings or catalog tabpanel from open PRs'
);
assert(
  app.includes('function promoverCatalogo') &&
  html.includes('class="mobile-bar"') &&
  html.includes('Carrinho') &&
  html.includes('Promoções'),
  'shopping-first move and 4-item mobile bar stay in place'
);

if (failures.length) {
  console.error('check-add-cta-label failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-add-cta-label: ok');
