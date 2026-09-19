#!/usr/bin/env node
/**
 * Guards for leftover peach focus rings on leftover featured photos,
 * leftover catalog search-clear, leftover cross-sell cards, and leftover
 * mobile-menu links / close, plus leftover 44px on checkout name / phone /
 * pickup fields.
 * Complementary to PR #32 (shop-CTA rings, not feature-photo), PR #31
 * (featured-add rings), PR #43 / #16 (search-clear *size* / type), PR #18
 * (search-input ring), PR #10 (CS dialog focus restore, not .cs-card ring),
 * PR #4 (CS ＋ names), PR #9 (mobile-menu overlay / trap / 44px links+close),
 * PR #12 (order 16px / ≤600px steppers), PR #50 (oi-stepper / order-remove
 * 44px), PR #7 (autocomplete), PR #55 (dialog/checkout leftover rings).
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
  html.includes('css/estilos.css?v=59') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=59 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('id="cust-nome"') &&
  html.includes('id="cust-telemovel"') &&
  html.includes('id="cust-levantamento"') &&
  html.includes('id="search-clear"') &&
  html.includes('class="mobile-menu"') &&
  html.includes('class="mobile-close"') &&
  html.includes('class="cs-pop"'),
  'leftover order / search-clear / mobile-menu / cross-sell controls stay in place'
);
assert(
  html.includes('placeholder="O Seu Nome *"') &&
  html.includes('placeholder="Nº de Telemóvel *"') &&
  html.includes('placeholder="Hora de levantamento (ex: 17h30)"'),
  'order-field visible copy stays unchanged'
);
assert(
  html.includes('>Promoções<') &&
  html.includes('>Cabazes<') &&
  html.includes('>Como Funciona<') &&
  html.includes('>Produtos<') &&
  html.includes('>Quem Somos<') &&
  html.includes('>Avaliações<') &&
  html.includes('>Encomendar<') &&
  html.includes('>Contacto<'),
  'mobile-menu visible labels stay unchanged'
);
assert(
  app.includes('class="feature-photo"') &&
  app.includes("onclick=\"abrirProduto('${item._id}')\""),
  'featured leftover photo button stays a product-preview control'
);

assert(
  /\.order-form input \{[^}]*min-height:44px/.test(css),
  'leftover order name / phone / pickup fields should be at least 44px tall'
);
assert(
  /\.feature-photo:focus-visible/.test(css) &&
  /\.cs-card:focus-visible/.test(css) &&
  /\.shop-main \.search-clear:focus-visible/.test(css) &&
  /\.mobile-menu a:focus-visible/.test(css) &&
  /\.mobile-close:focus-visible/.test(css),
  'leftover featured-photo / CS-card / search-clear / mobile-menu should show a keyboard ring'
);

assert(
  !/\.shop-main \.search-clear \{[^}]*min-height:44px/.test(css) &&
  !/\.search-clear \{[^}]*min-height:44px/.test(css),
  'must not redo PR #16 / #43 leftover search-clear tap size'
);
assert(
  !/\.mobile-menu a \{[^}]*min-height:44px/.test(css) &&
  !/\.mobile-close \{[^}]*width:44px/.test(css),
  'must not redo PR #9 leftover mobile-menu link / close tap sizes'
);
assert(
  !/\.cat-quick-btn:focus-visible/.test(css),
  'must not redo PR #25 leftover shortcut focus rings'
);
assert(
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.btn-prim:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css),
  'must not redo PR #31 / #32 leftover featured-add / shop-CTA focus'
);
assert(
  !/\.product-modal-qty button:focus-visible/.test(css) &&
  !/\.cs-pop-skip:focus-visible/.test(css) &&
  !/\.mb-item \{[^}]*min-height:44px/.test(css),
  'must not redo PR #55 leftover dialog-checkout focus / mobile-bar 44px'
);
assert(
  !/\.privacy-box a:focus-visible/.test(css) &&
  !/\.contact-card a:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.oi-stepper button:focus-visible/.test(css),
  'must not redo PR #51–#54 leftover chrome / contact / privacy focus'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco'),
  'must not redo leftover order labels or catalog / filter helpers from open PRs'
);
assert(
  !html.includes('href="tel:+351932699850"') &&
  html.includes('Av de Portugal, Centro Cívico'),
  'must not redo PR #7 tel:+351 or invent contact copy'
);

if (failures.length) {
  console.error('check-featured-menu-order-leftover failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-featured-menu-order-leftover: ok');
