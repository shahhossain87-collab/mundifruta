#!/usr/bin/env node
/**
 * Guards for leftover contact-card / floating-cart tap targets and leftover
 * peach focus rings on those controls plus the welcome-offer and scroll-top.
 * Complementary to PR #8 (info-strip / Morada maps), PR #7 (tel:+351),
 * PR #12/#22 (hide float-cart), PR #28 (inert empty chip / scroll-top),
 * PR #32 (float-cart type=button / shop-CTA rings), PR #52 (logo / rating / WA).
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
  html.includes('css/estilos.css?v=56') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=56 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('href="tel:932699850"') && html.includes('932 699 850'),
  'contact phone href and visible number stay unchanged'
);
assert(
  html.includes('href="mailto:shahhossain87@gmail.com"') &&
  html.includes('>shahhossain87@gmail.com<'),
  'contact email href and visible address stay unchanged'
);
assert(
  html.includes('class="float-cart"') && html.includes('irParaEncomenda()'),
  'floating cart control and handler stay unchanged'
);
assert(
  html.includes('class="scroll-top"') && html.includes('id="offer-pop"'),
  'scroll-top and welcome-offer markup stay in place'
);

assert(
  /\.contact-card a \{[^}]*min-height:44px/.test(css),
  'leftover contact phone/email should be at least 44px tall'
);
assert(
  /\.float-cart \{[^}]*min-height:44px/.test(css),
  'leftover floating cart chip should be at least 44px tall'
);
assert(
  /\.float-cart:focus-visible/.test(css) &&
  /\.scroll-top:focus-visible/.test(css) &&
  /\.contact-card a:focus-visible/.test(css) &&
  /\.reveal-close:focus-visible/.test(css) &&
  /\.reveal-cta:focus-visible/.test(css) &&
  /\.reveal-later:focus-visible/.test(css),
  'leftover cart / contact / offer / scroll-top should show a keyboard ring'
);

assert(
  !html.includes('href="tel:+351932699850"'),
  'must not redo PR #7 tel:+351 contact format'
);
assert(
  html.includes('Av de Portugal, Centro Cívico') &&
  !/<h4>Morada<\/h4>\s*<a[\s\S]*maps\.app\.goo\.gl/.test(html),
  'must not redo PR #8 contact Morada maps URL'
);
assert(
  !/\.logo \{[^}]*min-height:44px/.test(css) &&
  !/\.nav-order \{[^}]*min-height:44px/.test(css) &&
  !/\.hero-rating \{[^}]*min-height:44px/.test(css),
  'must not redo PR #52 leftover header/hero taps'
);
assert(
  !/\.nav-links a \{[^}]*min-height:44px/.test(css) &&
  !/\.footer-links a \{[^}]*min-height:44px/.test(css),
  'must not redo PR #51 leftover chrome taps'
);
assert(
  !/\.logo:focus-visible/.test(css) &&
  !/\.hero-rating:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'must not redo PR #52 leftover logo / rating / WhatsApp focus'
);
assert(
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.btn-prim:focus-visible/.test(css),
  'must not redo PR #31 / #32 nav and Comprar Agora focus rings'
);
assert(
  !/\.float-cart \{[^}]*visibility:hidden/.test(css) &&
  !/\.scroll-top \{[^}]*visibility:hidden/.test(css),
  'must not redo PR #28 inert empty float-cart / scroll-top'
);
assert(
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo'),
  'must not redo leftover catalog-tab / scroll helpers from open PRs'
);

if (failures.length) {
  console.error('check-contact-overlay-taps failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-contact-overlay-taps: ok');
