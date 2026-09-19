#!/usr/bin/env node
/**
 * Guards for leftover 44px catalog search and leftover desktop social-dock
 * chips, plus leftover peach :focus-visible on leftover checkout name /
 * phone / pickup / notes fields.
 * Complementary to PR #56 (order-field *size*, not rings), PR #18
 * (search-input cherry ring), PR #41 (16px iOS search/sort), PR #16 / #43
 * (search-clear *size*), PR #24 (social focus-only expand), PR #34 (footer
 * gutter / Contactos rápidos landmark), PR #12 (order 16px), PR #4 (visible
 * labels), PR #52 (btn-wa / logo / hero-rating rings).
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
  html.includes('css/estilos.css?v=60') && html.includes('js/app.js?v=36'),
  'index.html should cache-bust estilos.css?v=60 and keep app.js?v=36'
);
assert(
  html.includes('js/extras.js?v=21'),
  'extras.js cache token should stay ?v=21'
);
assert(
  html.includes('id="search-input"') &&
  html.includes('class="shop-main"') &&
  html.includes('class="social-link social-wa"') &&
  html.includes('id="cust-nome"') &&
  html.includes('id="cust-telemovel"') &&
  html.includes('id="cust-levantamento"') &&
  html.includes('id="cust-notas"'),
  'leftover catalog search / social dock / order fields stay in place'
);
assert(
  html.includes('placeholder="Pesquisar produto… (ex: morangos, tomate, banana)"') &&
  html.includes('placeholder="O Seu Nome *"') &&
  html.includes('placeholder="Nº de Telemóvel *"') &&
  html.includes('placeholder="Hora de levantamento (ex: 17h30)"') &&
  html.includes('placeholder="Pedidos especiais ou notas..."') &&
  html.includes('title="Fale connosco no WhatsApp"') &&
  html.includes('title="Google Reviews"') &&
  html.includes('title="Como chegar à loja"') &&
  html.includes('title="Encomendar via WhatsApp"'),
  'search / order / social visible copy stays unchanged'
);
assert(
  html.includes('https://wa.me/351932699850') &&
  html.includes('https://maps.app.goo.gl/1gHGqMac4ahTtfxf8?g_st=ac'),
  'social WhatsApp and Google URLs stay unchanged'
);

assert(
  /\.shop-main \.search-input \{[^}]*min-height:44px/.test(css),
  'leftover catalog search field should be at least 44px tall'
);
assert(
  /\.social-link \{[^}]*min-height:44px/.test(css),
  'leftover desktop social-dock chips should be at least 44px tall'
);
assert(
  /\.order-form input:focus-visible/.test(css) &&
  /\.order-form textarea:focus-visible/.test(css),
  'leftover order fields should show a peach keyboard ring'
);

assert(
  !/\.order-form input \{[^}]*min-height:44px/.test(css),
  'must not redo PR #56 leftover order-field tap size'
);
assert(
  !/\.shop-main \.search-clear \{[^}]*min-height:44px/.test(css) &&
  !/\.search-clear \{[^}]*min-height:44px/.test(css),
  'must not redo PR #16 / #43 leftover search-clear tap size'
);
assert(
  !/@media \(max-width:768px\) \{[^}]*\.shop-main \.search-input[^}]*font-size:\s*16px/.test(css),
  'must not redo PR #41 leftover 16px catalog search'
);
assert(
  !/\.social-link:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.hero-rating:focus-visible/.test(css),
  'must not redo PR #24 / #52 leftover social / header / hero / WhatsApp rings'
);
assert(
  !/\.shop-main \.search-input:focus-visible/.test(css) &&
  !/\.search-input:focus-visible/.test(css),
  'must not redo PR #18 leftover search-input cherry ring'
);
assert(
  !/\.feature-photo:focus-visible/.test(css) &&
  !/\.cs-card:focus-visible/.test(css) &&
  !/\.mobile-menu a:focus-visible/.test(css) &&
  !/\.mb-item \{[^}]*min-height:44px/.test(css) &&
  !/\.privacy-box a:focus-visible/.test(css) &&
  !/\.contact-card a:focus-visible/.test(css) &&
  !/\.oi-stepper button:focus-visible/.test(css) &&
  !/\.product-modal-qty button:focus-visible/.test(css),
  'must not redo PR #51–#56 leftover chrome / dialog / menu rings or taps'
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
  console.error('check-search-social-order-leftover failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-search-social-order-leftover: ok');
