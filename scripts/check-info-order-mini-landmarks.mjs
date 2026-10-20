#!/usr/bin/env node
/**
 * Guards for leftover info-strip / order-steps-mini landmarks.
 * Complementary to PR #78 (hero / populares / verao / legumes-frescos),
 * PR #77 (catalog / cabaz / promo / about / reviews), PR #76 (how-to /
 * order / contact / footer-links), PR #75 (mobile-menu / cat-quick /
 * order-list / order-form), PR #74 (main-nav / mobile-bar), PR #8
 * (tappable info-strip phone/address), PR #37 (info-strip dock gutter),
 * leftover hamburger expanded (PR #70).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=38'),
  'index.html should keep estilos.css?v=64 and app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=25'
);
assert(
  /<section class="info-strip" aria-label="Levantamento na Loja">/.test(html) &&
  html.includes('<span aria-hidden="true">🕗</span> Seg–Dom: 8:00 – 20:00') &&
  html.includes('<span aria-hidden="true">📞</span> 932 699 850') &&
  html.includes('<span aria-hidden="true">📍</span> Av de Portugal, Centro Cívico, Carnaxide') &&
  html.includes('<span aria-hidden="true">🛍️</span> Levantamento na Loja'),
  'leftover .info-strip should be a section named from the existing Levantamento na Loja chip'
);
assert(
  /<section class="order-steps-mini" aria-label="Como Encomendar">/.test(html) &&
  html.includes('<h2 class="section-title">Como Encomendar</h2>') &&
  html.includes('<span class="osm-step"><b>1</b> Escolha os produtos</span>') &&
  html.includes('<span class="osm-step"><b>5</b> Levante na loja</span>') &&
  (html.match(/class="osm-arrow" aria-hidden="true">→<\/span>/g) || []).length === 4,
  'leftover .order-steps-mini should be a section named from the existing Como Encomendar title'
);
assert(
  /<div class="hero" id="inicio">/.test(html) &&
  /<div class="section shop-feature alt" id="populares">/.test(html) &&
  /<div class="section shop-feature" id="verao">/.test(html) &&
  /<div class="section shop-feature alt" id="legumes-frescos">/.test(html),
  'must not redo leftover hero / featured landmarks (PR #78)'
);
assert(
  /<section class="section shop" id="produtos" style="padding-top:26px; padding-bottom:26px;">/.test(html) &&
  /<div class="section shop-feature promo-shop" id="promocoes">/.test(html) &&
  /<div class="section fi" id="cabazes">/.test(html) &&
  /<div class="section alt fi" id="avaliacoes">/.test(html) &&
  /<div class="section fi" id="quem-somos">/.test(html),
  'must not redo leftover catalog / cabaz / promo / about / reviews landmarks (PR #77)'
);
assert(
  /<div class="section alt fi" id="como-funciona">/.test(html) &&
  /<div class="section dark" id="encomenda">/.test(html) &&
  /<div class="section" id="contacto">/.test(html) &&
  /<div class="footer-links">/.test(html),
  'must not redo leftover how-to / order / contact / footer-links landmarks (PR #76)'
);
assert(
  /<div class="mobile-menu" id="mobile-menu">/.test(html) &&
  /<div class="cat-quick">/.test(html) &&
  /<ul class="order-items" id="order-list">/.test(html) &&
  /<form class="order-form" id="order-form" onsubmit="enviarWhatsApp\(event\)">/.test(html),
  'must not redo leftover menu / category / order-list / order-form landmarks (PR #75)'
);
assert(
  /<nav id="main-nav">/.test(html) &&
  /<nav class="mobile-bar" id="mobile-bar">/.test(html),
  'must not redo leftover main-nav / mobile-bar landmarks (PR #74)'
);
assert(
  /<div class="social-panel">/.test(html) &&
  !html.includes('aria-label="Contactos rápidos"'),
  'must not redo leftover social-dock landmark (PR #34)'
);
assert(
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(html) &&
  !html.includes('aria-expanded="false"'),
  'must not redo leftover hamburger expanded (PR #70)'
);
const infoStrip = html.match(/<section class="info-strip"[^>]*>[\s\S]*?<\/section>/);
assert(
  infoStrip &&
  !infoStrip[0].includes('<a ') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !html.includes('name="pesquisa"'),
  'must not redo leftover tappable phone (PR #8), order labels (PR #4), or catalog names (PR #73)'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5 / #67) or cart stepper names (PR #31)'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26)'
);
assert(
  html.includes('role="dialog" aria-label="Sugestões de produtos">') &&
  !html.includes('id="cs-pop" hidden role="dialog" aria-modal="true"') &&
  html.includes('<div class="cabaz-modal-box">'),
  'must not redo leftover CS aria-modal / cabaz dialog role (PR #73)'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !/\.info-strip-inner \{[^}]*margin-right:200px/.test(css) &&
  !/\.footer-links \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs, catalog tabpanel, info-strip gutter (PR #37), or footer-link size (PR #51)'
);

if (failures.length) {
  console.error('check-info-order-mini-landmarks failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-info-order-mini-landmarks: ok');
