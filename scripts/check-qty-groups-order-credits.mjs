#!/usr/bin/env node
/**
 * Guards for leftover product-modal / cart quantity *groups* and leftover
 * order-field keyboard ring + leftover credits back tap.
 * Complementary to PR #32 (modal qty *button* names), PR #31 (cart
 * Menos/Mais *button* names), PR #56 (order field *size*), PR #57
 * (peach order-field ring), PR #4 (order *labels*), PR #51 (oi-stepper
 * peach ring, not the group name), leftover 44px / peach-ring PRs,
 * leftover add names (#26 / #31 / #66 / #70 / #71), leftover catalog
 * qty names (#67), leftover chrome types (#63), leftover empty-foto
 * (#68), leftover hamburger expanded (#70), or JSON-LD.
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
  html.includes('css/estilos.css?v=65') && html.includes('js/app.js?v=39'),
  'index.html should cache-bust estilos.css?v=65 and app.js?v=39'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=25'
);
assert(
  credits.includes('css/estilos.css?v=65'),
  'creditos.html should cache-bust estilos.css?v=65'
);
assert(
  app.includes('qtyGroup.setAttribute(\'aria-label\', `Selecionar quantidade de ${item.nome}`)'),
  'leftover product-modal qty group should name the open product'
);
assert(
  html.includes('class="product-modal-qty" aria-label="Selecionar quantidade"'),
  'leftover product-modal qty group keeps a generic first-paint label'
);
assert(
  html.includes('aria-label="Diminuir quantidade"') &&
  html.includes('aria-label="Aumentar quantidade"'),
  'must not redo leftover product-modal qty *button* names (PR #32)'
);
assert(
  app.includes('class="oi-stepper" aria-label="Quantidade de ${i.nome}"'),
  'leftover cart stepper group should name the line item'
);
assert(
  app.includes('aria-label="Menos"') && app.includes('aria-label="Mais"'),
  'must not redo leftover cart Menos/Mais *button* names (PR #31)'
);
assert(
  /\.order-form input:focus-visible/.test(css) &&
  /\.order-form textarea:focus-visible/.test(css) &&
  !/\.order-form input:focus,/.test(css),
  'leftover order fields should use :focus-visible (not always-on :focus)'
);
assert(
  /min-height:\s*44px/.test(credits) &&
  credits.includes('.credits-back:focus-visible'),
  'leftover credits back link should be 44px with a keyboard ring'
);
assert(
  credits.includes('href="index.html"') &&
  credits.includes('← Voltar à loja'),
  'leftover credits back copy and shop URL stay'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  /class="feature-add" onclick="adicionarProduto/.test(app) &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html),
  'must not redo leftover catalog qty labels (PR #67) or featured/modal add names (PR #71)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('aria-label="Adicionar ${item.nome}'),
  'must not redo leftover order labels, catalog tabpanel helpers, or add-name templates'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.order-form input \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover 44px tap-target PRs or catalog tabpanel'
);
assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.order-form input:focus-visible[^}]*outline:3px solid var\(--peach\)/.test(css),
  'must not redo leftover peach rings from open PRs on shop chrome / order fields'
);

if (failures.length) {
  console.error('check-qty-groups-order-credits failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-qty-groups-order-credits: ok');
