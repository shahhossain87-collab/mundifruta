#!/usr/bin/env node
/**
 * Guards for leftover catalog add names and leftover hamburger
 * aria-expanded. Complementary to PR #5 (older add/qty labels, not
 * this leftover named catalog add), PR #66 (cabaz add names),
 * PR #67 (catalog qty names), PR #60 (visible Adicionar after add),
 * PR #31 / #26 (featured / product-modal add names), PR #63 (hamburger
 * type=button / mobile-close label), PR #9 (menu overlay / trap /
 * Escape), PR #7 (hamburger 44px), PR #31 (hamburger focus ring).
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
  html.includes('css/estilos.css?v=63') && html.includes('js/app.js?v=39'),
  'index.html should cache-bust estilos.css?v=63 and app.js?v=39'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=24'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=24'
);
assert(
  app.includes('function criarCard') &&
  app.includes('aria-label="Adicionar ${item.nome} ao carrinho">＋ Adicionar</button>'),
  'leftover catalog add should name the product and keep visible ＋ Adicionar'
);
assert(
  app.includes('if (add) add.textContent = \'＋\';'),
  'must not redo leftover Adicionar restore after add (PR #60)'
);
assert(
  html.includes('aria-expanded="false"') &&
  html.includes('aria-controls="mobile-menu"') &&
  html.includes('class="hamburger"') &&
  /<button class="hamburger"[^>]*aria-expanded="false"[^>]*aria-controls="mobile-menu"/.test(html),
  'leftover hamburger should start aria-expanded=false and control #mobile-menu'
);
assert(
  app.includes('function toggleMenu') &&
  app.includes("btn.setAttribute('aria-expanded', String(open))"),
  'toggleMenu should keep leftover hamburger aria-expanded in sync'
);
assert(
  !/<button class="hamburger"[^>]*type="button"/.test(html) &&
  html.includes('<button class="mobile-close" onclick="toggleMenu()">✕</button>'),
  'must not redo leftover hamburger / mobile-close types (PR #63)'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('onclick="adicionarProduto(\'${id}\', produtos_map[\'${id}\'])">＋</button>') &&
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty names (PR #67), cabaz/featured add names (PR #66 / #31), or cart stepper names (PR #31)'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26 / #61)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco') &&
  !app.includes('urlFoto(\'\')') &&
  !app.includes('function urlFoto'),
  'must not redo leftover order labels, catalog tabpanel helpers, or empty-foto fallback (PR #68)'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.shop-main \.search-input:focus-visible/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover 44px tap-target, search-ring, or catalog tabpanel PRs'
);

if (failures.length) {
  console.error('check-catalog-add-menu-expanded failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-catalog-add-menu-expanded: ok');
