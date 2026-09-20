#!/usr/bin/env node
/**
 * Guards for leftover cabaz/cross-sell dialog semantics, leftover
 * catalog field names, and leftover credits citation links.
 * Complementary to PR #5 (grab-bag cabaz dialog among catalog-jump /
 * alerts / add names), PR #32 (consent aria-modal, not CS), PR #33
 * (cabaz overlay aria-hidden / close type, not role=dialog on the box),
 * PR #8 (dialog focus trap), PR #21 (order-form name attributes, not
 * leftover catalog search/sort/price), PR #18 (social WA/Google
 * rel=noopener, not credits citations), PR #72 (credits back 44px /
 * peach rings, not target/rel).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') &&
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'cache tokens should stay estilos.css?v=64, app.js?v=38, extras.js?v=21, dados.js?v=25'
);
assert(
  /id="search-input"[^>]*name="pesquisa"/.test(html) &&
  /id="price-sort"[^>]*name="ordenar"/.test(html) &&
  /id="filter-preco"[^>]*name="preco"/.test(html),
  'leftover catalog search / sort / price fields should have name attributes'
);
assert(
  html.includes('id="cs-pop" hidden role="dialog" aria-modal="true"'),
  'leftover cross-sell popup should be aria-modal'
);
assert(
  /class="cabaz-modal-box"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="cabaz-modal-title"/.test(html) ||
  /class="cabaz-modal-box" role="dialog" aria-modal="true" aria-labelledby="cabaz-modal-title"/.test(html),
  'leftover cabaz modal box should be a named dialog'
);
assert(
  html.includes('id="cabaz-modal-title"') &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'leftover cabaz title id and visible plus add stay'
);
assert(
  credits.includes('class="credits-back" href="index.html"') &&
  !/class="credits-back"[^>]*target="_blank"/.test(credits),
  'leftover credits back stays a same-tab index.html link'
);
const creditHrefs = [...credits.matchAll(/<a\s+([^>]+)>/g)].map(m => m[1]);
const externalCredits = creditHrefs.filter(attrs => /href="https?:\/\//.test(attrs));
assert(externalCredits.length >= 100, `expected leftover credits citation links (got ${externalCredits.length})`);
assert(
  externalCredits.every(attrs =>
    /target="_blank"/.test(attrs) && /rel="noopener noreferrer"/.test(attrs)
  ),
  'leftover credits citation links should open safely in a new tab'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !html.includes('role="tabpanel"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco') &&
  !app.includes('aria-label="Adicionar ${item.nome}'),
  'must not redo leftover order labels, catalog tabpanel helpers, or add-name templates'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5) or cart stepper names (PR #31)'
);
assert(
  html.includes('aria-label="Selecionar quantidade"') &&
  !html.includes('aria-label="Selecionar quantidade de'),
  'must not redo leftover product-modal qty group name (PR #72)'
);
assert(
  !html.includes('aria-expanded="false"') &&
  html.includes('class="hamburger" onclick="toggleMenu()" aria-label="Menu"'),
  'must not redo leftover hamburger expanded (PR #70)'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.credits-back \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css),
  'must not redo leftover 44px tap-target PRs'
);
assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.credits-back:focus-visible/.test(css),
  'must not redo leftover peach rings from open PRs'
);

if (failures.length) {
  console.error('check-cabaz-cs-credits-names failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-cabaz-cs-credits-names: ok');
