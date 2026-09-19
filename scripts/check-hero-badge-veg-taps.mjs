#!/usr/bin/env node
/**
 * Guards for leftover 44px homepage Comprar Agora, leftover Google reviews
 * badge, and leftover small-screen legumes continue CTA.
 * Complementary to PR #32 (btn-prim / google-badge / veg-suggestion
 * :focus-visible, not tap height), PR #2 (shopping-first layout / visible
 * CTA text), PR #37 (reviews-cta 44px / dock gutter, not this badge),
 * PR #28 (veg-suggestion position:relative / type, not 44px), PR #15
 * (adds the legumes button / 5-item bar), PR #29 (shop-link 44px),
 * PR #52 (hero-rating 44px / btn-wa rings).
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
  html.includes('css/estilos.css?v=61') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=61 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('class="btn-prim">Comprar Agora</a>') &&
  html.includes('id="google-badge"') &&
  html.includes('id="reviews-cta"') &&
  html.includes('class="hero-ctas"'),
  'leftover Comprar Agora / Google badge stay in place'
);
assert(
  html.includes('>Comprar Agora<') &&
  html.includes('107 avaliações no Google') &&
  html.includes('Ver todas as avaliações no Google →') &&
  html.includes('4,9'),
  'hero CTA and reviews visible copy stays unchanged'
);
assert(
  html.includes('https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac') &&
  html.includes('href="#produtos" class="btn-prim"'),
  'hero rating URL and Comprar Agora hash stay unchanged'
);
assert(
  !html.includes('class="veg-suggestion"') &&
  !html.includes('Continuar para Legumes Frescos'),
  'must not add the leftover legumes CTA to the HTML (PR #15 / #28)'
);

assert(
  /\.btn-prim \{[^}]*min-height:44px/.test(css),
  'leftover homepage Comprar Agora should be at least 44px tall'
);
assert(
  /\.google-badge \{[^}]*min-height:44px/.test(css),
  'leftover Google reviews badge should be at least 44px tall'
);
assert(
  /\.veg-suggestion \{[^}]*min-height:44px/.test(css),
  'leftover small-screen legumes continue CTA should be at least 44px tall'
);
assert(
  !/\.veg-suggestion \{[^}]*min-height:42px/.test(css),
  'leftover legumes continue CTA should no longer use the 42px mobile height'
);

assert(
  !/\.btn-prim:focus-visible/.test(css) &&
  !/\.google-badge:focus-visible/.test(css) &&
  !/\.veg-suggestion:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.reviews-cta:focus-visible/.test(css),
  'must not redo PR #32 leftover shop-CTA / badge / veg / reviews rings'
);
assert(
  !/\.shop-link \{[^}]*min-height:44px/.test(css) &&
  !/\.reviews-cta \{[^}]*min-height:44px/.test(css) &&
  !/\.hero-rating \{[^}]*min-height:44px/.test(css) &&
  !/\.nav-order \{[^}]*min-height:44px/.test(css) &&
  !/\.logo \{[^}]*min-height:44px/.test(css),
  'must not redo PR #29 / #37 / #52 leftover shop-link / reviews-cta / header-hero tap sizes'
);
assert(
  !/\.shop-main \.search-input \{[^}]*min-height:44px/.test(css) &&
  !/\.social-link \{[^}]*min-height:44px/.test(css) &&
  !/\.order-form input \{[^}]*min-height:44px/.test(css) &&
  !/\.order-form input:focus-visible/.test(css) &&
  !/\.mb-item \{[^}]*min-height:44px/.test(css),
  'must not redo PR #55–#57 leftover search / social / order / mobile-bar taps or rings'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco'),
  'must not redo leftover order labels or catalog / filter helpers from open PRs'
);

if (failures.length) {
  console.error('check-hero-badge-veg-taps failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-hero-badge-veg-taps: ok');
