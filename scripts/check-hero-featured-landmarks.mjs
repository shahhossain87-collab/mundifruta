#!/usr/bin/env node
/**
 * Guards for leftover hero / populares / verao / legumes-frescos landmarks.
 * Complementary to PR #77 (catalog / cabaz / promo / about / reviews),
 * PR #76 (how-to / order / contact / footer-links), PR #75 (mobile-menu /
 * cat-quick / order-list / order-form), PR #74 (main-nav / mobile-bar),
 * PR #40 (epoca featured CTA destination), PR #26 (shop-link hashes),
 * PR #29 (shop-link tap), PR #2 (shopping-first hero), PR #34 (social-dock
 * landmark), leftover hamburger expanded (PR #70).
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
  /<section class="hero" id="inicio" aria-label="Fruta &amp; Legumes Frescos Todos os Dias">/.test(html) &&
  html.includes('<h1 class="hero-heading">') &&
  html.includes('Fruta &amp; Legumes') &&
  html.includes('Frescos Todos os Dias'),
  'leftover #inicio should be a section named from the existing hero heading'
);
assert(
  /<section class="section shop-feature alt" id="populares" aria-label="Frutas Populares">/.test(html) &&
  html.includes('<h2 class="section-title">Frutas Populares</h2>'),
  'leftover #populares should be a section named from the existing Frutas Populares title'
);
assert(
  /<section class="section shop-feature" id="verao" aria-label="Fruta da Época">/.test(html) &&
  html.includes('<h2 class="section-title">Fruta da Época</h2>'),
  'leftover #verao should be a section named from the existing Fruta da Época title'
);
assert(
  /<section class="section shop-feature alt" id="legumes-frescos" aria-label="Legumes Frescos">/.test(html) &&
  html.includes('<h2 class="section-title">Legumes Frescos</h2>'),
  'leftover #legumes-frescos should be a section named from the existing Legumes Frescos title'
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
assert(
  html.includes('<button class="shop-link" onclick="abrirCatalogo(\'frutas\')">Ver todas as frutas →</button>') &&
  html.includes('<button class="shop-link" onclick="abrirCatalogo(\'frutas\')">Explorar fruta →</button>') &&
  html.includes('<button class="shop-link" onclick="abrirCatalogo(\'legumes\')">Ver todos os legumes →</button>'),
  'must not redo leftover featured shop-link hashes (PR #26) or epoca CTA destination (PR #40)'
);
assert(
  html.includes('<a href="#produtos" class="btn-prim">Comprar Agora</a>') &&
  html.includes('<span class="hero-chip">🛍️ Levantamento na Loja</span>'),
  'must not restyle leftover shopping-first hero copy (PR #2)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !html.includes('name="nome"') &&
  !html.includes('name="telemovel"') &&
  !html.includes('name="pesquisa"'),
  'must not redo leftover order visible labels (PR #4), order names (PR #21), or catalog names (PR #73)'
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
  /<div class="info-strip">/.test(html) &&
  /<div class="order-steps-mini">/.test(html),
  'must not convert leftover info-strip / order-steps-mini wrappers'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !/\.footer-links \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs, catalog tabpanel, or footer-link size (PR #51)'
);

if (failures.length) {
  console.error('check-hero-featured-landmarks failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-hero-featured-landmarks: ok');
