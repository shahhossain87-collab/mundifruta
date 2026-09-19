#!/usr/bin/env node
/**
 * Guards for leftover cabaz-ver accessible name and leftover cabaz-grid
 * section label. Complementary to PR #61 (cabaz qty / cabaz-modal add
 * names, not the “Ver o que leva” control), PR #16 (cabaz-ver *type*),
 * PR #45 (cabaz-ver *size*), PR #54 (cabaz-ver peach ring), PR #18
 * (hide cabaz-ver under 700px), PR #29 (catalog grid aria-label +
 * shop-link tap, not this leftover cabaz section label), PR #49
 * (catalog grid label follows the filter category), PR #51 (catalog
 * tabpanel; Cabazes stays a section jump), PR #27 (catalog/cabaz h3
 * names), PR #32 (cabaz <article>), PR #60 (visible Adicionar).
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
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  /id="grid-cabazes"[^>]*aria-label="Os Nossos Cabazes"/.test(html),
  'leftover cabaz grid should reuse the existing section title as its accessible name'
);
assert(
  html.includes('>Os Nossos Cabazes</h2>'),
  'visible cabaz section title must stay Os Nossos Cabazes'
);
assert(
  app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  app.includes('>👁 Ver o que leva</button>'),
  'leftover cabaz-ver should name the cabaz; visible Ver o que leva stays'
);
assert(
  !/class="cabaz-ver"[^>]*type="button"/.test(app),
  'must not redo leftover cabaz-ver type=button (PR #16)'
);
assert(
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"') &&
  app.includes("addBtn.setAttribute('aria-label', `Adicionar ${item.nome} ao carrinho`)"),
  'leftover cabaz qty / cabaz-modal add names from PR #61 must stay'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5) or cart stepper names (PR #31)'
);
assert(
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>') &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'featured / product-modal / cabaz-modal add stay a visible plus'
);
assert(
  !html.includes('role="tabpanel"') &&
  !html.includes('id="tabpanel"') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function aplicarFiltroPreco'),
  'must not redo leftover catalog tabpanel / scroll / price-apply helpers'
);
assert(
  app.includes('<h3 class="product-name">${item.nome}</h3>') &&
  app.includes('<div class="product-name">${item.nome}</div>'),
  'catalog leftover names stay h3 (PR #27); leftover cabaz names stay a div'
);
assert(
  app.includes("const card = document.createElement('div');") &&
  app.includes("card.className = 'product-card'; card.id = `card-${id}`; card.dataset.productId = id;"),
  'must not redo leftover cabaz <article> wrappers (PR #32)'
);
assert(
  !/\.cabaz-ver \{[^}]*min-height:44px/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/#cabazes \.cabaz-ver \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css),
  'must not redo leftover cabaz-ver size/ring or leftover 44px tap-target PRs'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !html.includes('href="#inicio" class="shop-crumbs') &&
  !/\.shop-main \.search-input:focus-visible/.test(css),
  'must not redo leftover order labels, shop crumbs, or catalog-search ring (PR #63)'
);

if (failures.length) {
  console.error('check-cabaz-ver-name failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-cabaz-ver-name: ok');
