#!/usr/bin/env node
/**
 * Guards for leftover checkout × Remover keyboard rings.
 * Complementary to #2–#166 (does not move catalog/search, restyle the nav,
 * change the 4-item mobile bar, fold search accents, add a cabaz hint,
 * jump-to-catalog, rewrite modal visible CTAs, or change JSON-LD).
 *
 * Not a redo of:
 * - PR #166 leftover checkout − / + forest rings
 * - PR #165 leftover privacy-dialog close forest rings
 * - PR #164 leftover welcome-offer CTA forest rings
 * - PR #163 leftover welcome-offer later forest rings
 * - PR #162 leftover welcome-offer close forest rings
 * - PR #161 leftover Combina bem close forest rings
 * - PR #160 leftover Combina bem skip forest rings
 * - PR #159 leftover cabaz-composition add forest rings
 * - PR #158 leftover cabaz-composition close forest rings
 * - PR #157 leftover product-preview add forest rings
 * - PR #156 leftover product-preview close forest rings
 * - PR #155 leftover product-preview qty forest rings
 * - PR #154 leftover Filtros / drawer-close forest rings
 * - PR #140 leftover checkout remove hover cherry on touch
 * - PR #139 leftover checkout stepper hover sage on touch
 * - PR #54 leftover peach overlay-close / cabaz-ver rings (this uses
 *   leftover catalog forest ring on leftover .order-remove, not a new peach)
 * - PR #61 leftover catalog-sort :focus-visible forest ring
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65'),
  'index.html should cache-bust estilos.css?v=65'
);
assert(
  creditos.includes('css/estilos.css?v=65'),
  'creditos.html should match leftover estilos.css?v=65'
);
assert(
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'app.js stays ?v=38, extras.js stays ?v=21, dados.js stays ?v=25'
);

assert(
  app.includes('class="order-remove"') &&
  app.includes("onclick=\"removerProduto('${i._id}')\"") &&
  app.includes('aria-label="Remover ${i.nome}"') &&
  app.includes('>×</button>'),
  'leftover checkout × Remover stays named Remover ${nome}'
);
assert(
  app.includes('function removerProduto') &&
  app.includes('delete carrinho[id]'),
  'leftover checkout × still removes leftover cart lines'
);
assert(
  html.includes('id="order-list"') &&
  html.includes('id="order-total"') &&
  html.includes('A Sua Encomenda'),
  'leftover checkout order list stays'
);
assert(
  app.includes('class="oi-stepper"') &&
  app.includes('aria-label="Menos">−</button>') &&
  app.includes('aria-label="Mais">+</button>'),
  'leftover checkout − / + stay named Menos / Mais (PR #166)'
);
assert(
  html.includes('class="reveal-cta"') &&
  html.includes('Receber Oferta'),
  'leftover welcome-offer CTA stays "Receber Oferta" (PR #164)'
);
assert(
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'leftover cabaz-modal add stays a visible plus (PR #2 / #26 / #61)'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('onclick="adicionarDoModal()"'),
  'leftover product-modal add stays a visible plus (PR #2 / #26)'
);

assert(
  /\.order-remove:focus-visible/.test(css),
  'leftover checkout × Remover should join the leftover forest :focus-visible ring'
);
assert(
  css.includes('.order-remove:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover checkout × Remover must use the leftover catalog forest ring (not a new color)'
);
assert(
  css.includes('.qty-btn:focus-visible') &&
  css.includes('.add-btn:focus-visible') &&
  css.includes('.photo-wrap:focus-visible'),
  'leftover catalog qty / Adicionar / photo forest rings stay'
);
assert(
  !css.includes('outline:3px solid var(--peach)'),
  'must not redo PR #54 leftover peach overlay rings'
);

assert(
  html.includes('id="mobile-bar"') &&
  html.includes('id="mb-cart-label">Carrinho') &&
  html.includes('mb-label">Promoções') &&
  html.includes('mb-label">WhatsApp') &&
  html.includes('mb-label">Como Chegar'),
  'leftover 4-item bar labels stay Carrinho / Promoções / WhatsApp / Como Chegar'
);
assert(
  html.includes('class="hamburger"') &&
  !html.includes('aria-expanded'),
  'leftover hamburger stays without expanded (PR #70)'
);
assert(
  html.includes('id="produtos"') &&
  html.indexOf('id="produtos"') < html.indexOf('id="inicio"'),
  'catalog still starts above leftover #inicio in leftover HTML'
);

assert(
  !/\.oi-stepper button:focus-visible/.test(css),
  'must not redo PR #166 leftover checkout stepper forest rings'
);
assert(
  !/\.privacy-close:focus-visible/.test(css),
  'must not redo PR #165 leftover privacy-dialog close forest rings'
);
assert(
  !/\.consent-no:focus-visible/.test(css) &&
  !/\.consent-yes:focus-visible/.test(css) &&
  !/\.consent-link:focus-visible/.test(css),
  'must not combine leftover consent forest rings in this run'
);
assert(
  !/\.reveal-cta:focus-visible/.test(css),
  'must not redo PR #164 leftover welcome-offer CTA forest rings'
);
assert(
  !/\.reveal-later:focus-visible/.test(css),
  'must not redo PR #163 leftover welcome-offer later forest rings'
);
assert(
  !/\.reveal-close:focus-visible/.test(css),
  'must not redo PR #162 leftover welcome-offer close forest rings'
);
assert(
  !/\.cs-pop-close:focus-visible/.test(css),
  'must not redo PR #161 leftover Combina bem close forest rings'
);
assert(
  !/\.cs-pop-skip:focus-visible/.test(css),
  'must not redo PR #160 leftover Combina bem skip forest rings'
);
assert(
  !/\.cabaz-modal-add:focus-visible/.test(css),
  'must not redo PR #159 leftover cabaz-composition add forest rings'
);
assert(
  !/\.cabaz-modal-close:focus-visible/.test(css),
  'must not redo PR #158 leftover cabaz-composition close forest rings'
);
assert(
  !/\.product-modal-add:focus-visible/.test(css),
  'must not redo PR #157 leftover product-preview add forest rings'
);
assert(
  !/\.product-modal-close:focus-visible/.test(css),
  'must not redo PR #156 leftover product-preview close forest rings'
);
assert(
  !/\.product-modal-qty button:focus-visible/.test(css),
  'must not redo PR #155 leftover product-preview qty forest rings'
);
assert(
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css),
  'must not redo PR #154 leftover Filtros / drawer-close forest rings'
);
assert(
  !/\.privacy-box a:focus-visible/.test(css) &&
  !/\.footer-credit a:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css),
  'must not redo PR #54 leftover peach privacy-link / footer-credit / cabaz-ver rings'
);
assert(
  !/\.cat-quick-btn:focus-visible/.test(css),
  'must not redo PR #25 leftover shortcut focus rings'
);
assert(
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-prim:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'must not redo leftover search-clear / hamburger / close / wordmark / CTA rings'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.order-remove:hover \{ background:rgba\(255,255,255,0\.1\)/.test(css),
  'must not redo PR #140 leftover checkout remove hover cherry on touch'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.oi-stepper button:hover \{ background:rgba\(255,255,255,0\.08\)/.test(css),
  'must not redo PR #139 leftover checkout stepper hover sage on touch'
);
assert(
  !/@media \(hover:\s*none\) \{[\s\S]*?\.cat-quick-btn:hover \{ transform:none/.test(css),
  'must not redo PR #112 leftover category-tile hover'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('role="tabpanel"'),
  'must not redo leftover catalog qty labels, order labels, or catalog tabpanel'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  extras.includes('window.fecharPrivacidade') &&
  extras.includes("document.getElementById('privacy-modal')") &&
  extras.includes('window.reporConsentimento'),
  'leftover privacy open / close / reset behavior stays'
);

if (failures.length) {
  console.error('check-order-remove-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-order-remove-focus: ok');
