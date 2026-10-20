#!/usr/bin/env node
/**
 * Guards for leftover catalog / cabaz / promo / about / reviews landmarks.
 * Complementary to PR #76 (how-to / order / contact / footer-links, not
 * these nav-linked shop/about/reviews wrappers), PR #75 (mobile-menu /
 * cat-quick / order-list / order-form), PR #74 (main-nav / mobile-bar),
 * PR #64 (grid-cabazes aria-label, not the #cabazes section),
 * PR #34 (desktop social-dock landmark), PR #51 (footer-links 44px),
 * PR #33 (Privacidade as button), PR #26 (footer extra hashes).
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
  /<section class="section shop" id="produtos"[^>]*aria-label="Frutas &amp; Legumes Frescos">/.test(html) &&
  html.includes('<h2 class="section-title">Frutas &amp; Legumes Frescos</h2>'),
  'leftover #produtos should keep its section tag and be named from the existing catalog title'
);
assert(
  /<section class="section shop-feature promo-shop" id="promocoes" aria-label="Promoções da Semana">/.test(html) &&
  html.includes('<h2 class="section-title">Promoções da Semana</h2>'),
  'leftover #promocoes should be a section named from the existing Promoções da Semana title'
);
assert(
  /<section class="section fi" id="cabazes" aria-label="Os Nossos Cabazes">/.test(html) &&
  html.includes('<h2 class="section-title">Os Nossos Cabazes</h2>') &&
  /<div class="products-grid" id="grid-cabazes"><\/div>/.test(html),
  'leftover #cabazes should be a section named from the existing Os Nossos Cabazes title'
);
assert(
  /<section class="section alt fi" id="avaliacoes" aria-label="Avaliações">/.test(html) &&
  html.includes('<h2 class="section-title">Avaliações</h2>'),
  'leftover #avaliacoes should be a section named from the existing Avaliações title'
);
assert(
  /<section class="section fi" id="quem-somos" aria-label="Quem Somos">/.test(html) &&
  html.includes('<h2 class="section-title">Quem Somos</h2>'),
  'leftover #quem-somos should be a section named from the existing Quem Somos title'
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
  html.includes('<button class="cat-quick-btn" onclick="abrirCatalogo(\'frutas\')">') &&
  html.includes('href="#" onclick="abrirPrivacidade();return false;">Privacidade</a>'),
  'must not redo leftover shortcut types (PR #25) or leftover Privacidade button (PR #33)'
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
  /<div class="section shop-feature alt" id="populares">/.test(html) &&
  /<div class="section shop-feature" id="verao">/.test(html) &&
  /<div class="section shop-feature alt" id="legumes-frescos">/.test(html) &&
  /<div class="hero" id="inicio">/.test(html),
  'must not convert leftover populares / verao / legumes-frescos / hero wrappers'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !/\.footer-links \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs, catalog tabpanel, or footer-link size (PR #51)'
);

if (failures.length) {
  console.error('check-catalog-cabaz-promo-about-reviews-landmarks failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-catalog-cabaz-promo-about-reviews-landmarks: ok');
