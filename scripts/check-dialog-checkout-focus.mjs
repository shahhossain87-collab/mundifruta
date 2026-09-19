#!/usr/bin/env node
/**
 * Guards for leftover peach focus rings on leftover dialog / checkout
 * controls (the taps PR #46 enlarges) plus leftover modal-add / optional-
 * field rings, and a leftover 44px guarantee on the 4-item mobile bar.
 * Complementary to PR #46 (dialog leftover tap *sizes*), PR #54 (privacy /
 * overlay-close / Filtros / cabaz-ver rings), PR #53 (contact / float-cart /
 * offer rings), PR #51 (checkout-consent focus on oi-stepper / order-remove /
 * consent-link), PR #31 (mobile-bar focus rings), PR #16 (optional-toggle
 * tap *size*), PR #15 (5-item bar).
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
  html.includes('css/estilos.css?v=58') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=58 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('class="product-modal-qty"') &&
  html.includes('class="product-modal-add"') &&
  html.includes('cabaz-modal-add') &&
  html.includes('class="cs-pop-skip"') &&
  html.includes('class="consent-no"') &&
  html.includes('class="consent-yes"') &&
  html.includes('class="btn-continuar"') &&
  html.includes('class="btn-em"') &&
  html.includes('class="privacy-reset"') &&
  html.includes('class="order-optional-toggle"'),
  'leftover dialog / checkout / optional-field controls stay in place'
);
assert(
  html.includes('id="mobile-bar"') &&
  (html.match(/class="mb-item"/g) || []).length === 4,
  'mobile bar still has the existing 4 leftover items'
);
assert(
  html.includes('>Carrinho<') &&
  html.includes('>Promoções<') &&
  html.includes('>WhatsApp<') &&
  html.includes('>Como Chegar<'),
  'mobile-bar visible labels stay unchanged'
);
assert(
  html.includes('onclick="alterarQtdModal(-1)"') &&
  html.includes('onclick="alterarQtdModal(1)"') &&
  html.includes('onclick="adicionarDoModal()"') &&
  html.includes('onclick="continuarAComprar()"') &&
  html.includes('onclick="enviarEmail()"') &&
  html.includes('onclick="definirConsentimento(false)"') &&
  html.includes('onclick="definirConsentimento(true)"') &&
  html.includes('onclick="reporConsentimento()"'),
  'leftover dialog / checkout handlers stay unchanged'
);

assert(
  /\.mb-item \{[^}]*min-height:44px/.test(css),
  'leftover mobile-bar items should be at least 44px tall'
);
assert(
  /\.product-modal-qty button:focus-visible/.test(css) &&
  /\.product-modal-add:focus-visible/.test(css) &&
  /\.cabaz-modal-add:focus-visible/.test(css) &&
  /\.cs-pop-skip:focus-visible/.test(css) &&
  /\.consent-no:focus-visible/.test(css) &&
  /\.consent-yes:focus-visible/.test(css) &&
  /\.btn-continuar:focus-visible/.test(css) &&
  /\.btn-em:focus-visible/.test(css) &&
  /\.privacy-reset:focus-visible/.test(css) &&
  /\.order-optional-toggle:focus-visible/.test(css),
  'leftover dialog / checkout / modal-add / optional-toggle should show a keyboard ring'
);

assert(
  !/\.product-modal-qty button \{[^}]*width:44px/.test(css) &&
  !/\.cs-pop-skip \{[^}]*min-height:44px/.test(css) &&
  !/\.consent-no \{[^}]*min-height:44px/.test(css) &&
  !/\.consent-yes \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-continuar \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-em \{[^}]*min-height:44px/.test(css) &&
  !/\.privacy-reset \{[^}]*min-height:44px/.test(css),
  'must not redo PR #46 leftover dialog / checkout tap sizes'
);
assert(
  !/\.order-optional-toggle \{[^}]*min-height:44px/.test(css),
  'must not redo PR #16 leftover optional-toggle tap size'
);
assert(
  !/\.mb-item:focus-visible/.test(css),
  'must not redo PR #31 leftover mobile-bar focus rings'
);
assert(
  !/\.privacy-box a:focus-visible/.test(css) &&
  !/\.footer-credit a:focus-visible/.test(css) &&
  !/\.privacy-close:focus-visible/.test(css) &&
  !/\.cs-pop-close:focus-visible/.test(css) &&
  !/\.product-modal-close:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css),
  'must not redo PR #54 leftover privacy / overlay / filter / cabaz-ver focus'
);
assert(
  !/\.contact-card a:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.reveal-close:focus-visible/.test(css) &&
  !/\.oi-stepper button:focus-visible/.test(css) &&
  !/\.order-remove:focus-visible/.test(css) &&
  !/\.consent-link:focus-visible/.test(css),
  'must not redo PR #53 / #51 leftover contact / checkout-consent focus'
);
assert(
  !html.includes('href="tel:+351932699850"') &&
  html.includes('Av de Portugal, Centro Cívico') &&
  !/<h4>Morada<\/h4>\s*<a[\s\S]*maps\.app\.goo\.gl/.test(html),
  'must not redo PR #7 tel:+351 or PR #8 contact Morada maps URL'
);
assert(
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !app.includes('function aplicarFiltroPreco'),
  'must not redo leftover catalog / filter helpers from open PRs'
);
assert(
  (html.match(/class="mb-item"/g) || []).length !== 5,
  'must not redo PR #15 leftover 5-item mobile bar'
);

if (failures.length) {
  console.error('check-dialog-checkout-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-dialog-checkout-focus: ok');
