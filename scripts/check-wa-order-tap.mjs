#!/usr/bin/env node
/**
 * Guards for leftover 44px checkout WhatsApp CTA (`.btn-wa`).
 * Complementary to PR #52 (peach :focus-visible on .btn-wa / logo /
 * hero-rating, not tap height), PR #46 (btn-em / Continuar a comprar
 * 44px, not this primary CTA), PR #58 (Comprar Agora / Google-badge /
 * veg-suggestion 44px), PR #18 (order popup fallback, not size).
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
  html.includes('css/estilos.css?v=62') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=62 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('class="btn-wa">📱 Encomendar por WhatsApp</button>') &&
  html.includes('class="btn-wa cabaz-modal-add"') &&
  html.includes('class="btn-em"'),
  'leftover WhatsApp order CTA and cabaz modal add stay in place'
);
assert(
  html.includes('Encomendar por WhatsApp') &&
  html.includes('ou encomende por email') &&
  html.includes('Sem pagamento antecipado'),
  'checkout visible copy stays unchanged'
);
assert(
  html.includes('https://wa.me/351932699850') &&
  html.includes('onsubmit="enviarWhatsApp(event)"'),
  'WhatsApp order URL and submit handler stay unchanged'
);

assert(
  /\.btn-wa \{[^}]*min-height:44px/.test(css),
  'leftover checkout WhatsApp CTA should be at least 44px tall'
);

assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.hero-rating:focus-visible/.test(css),
  'must not redo PR #52 leftover logo / hero-rating / btn-wa rings'
);
assert(
  !/\.btn-em \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-continuar \{[^}]*min-height:44px/.test(css) &&
  !/\.privacy-reset \{[^}]*min-height:44px/.test(css),
  'must not redo PR #46 leftover email / continue / privacy-reset tap sizes'
);
assert(
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.google-badge \{[^}]*min-height:44px/.test(css) &&
  !/\.veg-suggestion \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-link \{[^}]*min-height:44px/.test(css) &&
  !/\.reviews-cta \{[^}]*min-height:44px/.test(css) &&
  !/\.hero-rating \{[^}]*min-height:44px/.test(css) &&
  !/\.nav-order \{[^}]*min-height:44px/.test(css) &&
  !/\.logo \{[^}]*min-height:44px/.test(css),
  'must not redo PR #29 / #37 / #52 / #58 leftover shop-CTA / badge / header-hero tap sizes'
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
  console.error('check-wa-order-tap failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-wa-order-tap: ok');
