#!/usr/bin/env node
/**
 * Guards for leftover cabaz-card add names and leftover cabaz
 * sel-check hide. Complementary to PR #61 (cabaz-modal add name /
 * cabaz qty names, not the leftover card plus), PR #64 (cabaz-ver
 * name / cabaz grid label), PR #60 (visible “＋ Adicionar”),
 * PR #5 (catalog add/qty labels), PR #26 / #31 (product-modal /
 * featured add names), PR #27 / #32 (cabaz h3 / article).
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
  'index.html should cache-bust app.js?v=39 and keep estilos.css?v=63'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);

const cabazFn = app.slice(app.indexOf('function renderCabazes'), app.indexOf('function abrirCabaz'));
assert(
  cabazFn.includes('aria-label="Adicionar ${item.nome} ao carrinho"') &&
  cabazFn.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\"") &&
  /<button class="add-btn"[^>]*>＋<\/button>/.test(cabazFn.replace(/\s+/g, ' ')),
  'leftover cabaz card add should name the cabaz and stay a visible plus'
);
assert(
  cabazFn.includes('<div class="sel-check" aria-hidden="true">✓</div>'),
  'leftover cabaz sel-check should be aria-hidden like leftover catalog cards'
);
assert(
  cabazFn.includes('👁 Ver o que leva') &&
  !cabazFn.includes('aria-label="Ver o que leva'),
  'must not redo leftover cabaz-ver name (PR #64)'
);
assert(
  !cabazFn.includes('aria-label="Os Nossos Cabazes"') &&
  !app.includes('grid-cabazes").setAttribute(\'aria-label\'') &&
  !app.includes('grid-cabazes").setAttribute("aria-label"'),
  'must not redo leftover cabaz grid label (PR #64)'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5) or cart stepper names (PR #31)'
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
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover order labels, catalog tabpanel helpers, or featured/modal add-name helpers'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css),
  'must not redo leftover 44px tap-target or peach-ring PRs'
);

if (failures.length) {
  console.error('check-cabaz-add-name failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-cabaz-add-name: ok');
