#!/usr/bin/env node
/**
 * Guards for leftover decorative marks on leftover hero chips,
 * leftover Quem Somos chips, leftover header Encomendar, and leftover
 * Google-badge logo. Complementary to PR #80 (contact / cart / pay
 * icons), PR #79 (info-strip emojis / mini arrows), PR #32
 * (hero/badge *stars*), leftover hamburger expanded (PR #70).
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
  html.includes('<span class="hero-chip"><span aria-hidden="true">🕗</span> Aberto Hoje · 8h–20h</span>') &&
  html.includes('<span class="hero-chip"><span aria-hidden="true">📱</span> Encomendas WhatsApp</span>') &&
  html.includes('<span class="hero-chip"><span aria-hidden="true">🛍️</span> Levantamento na Loja</span>'),
  'leftover hero-chip emojis should be aria-hidden; visible hours / WhatsApp / pickup copy stay'
);

assert(
  html.includes('<span class="qs-chip"><span aria-hidden="true">🌅</span> Frescura diária</span>') &&
  html.includes('<span class="qs-chip"><span aria-hidden="true">💶</span> Preços justos</span>') &&
  html.includes('<span class="qs-chip"><span aria-hidden="true">🤝</span> Atendimento próximo</span>') &&
  html.includes('<span class="qs-chip"><span aria-hidden="true">❤️</span> Confiança da comunidade</span>'),
  'leftover qs-chip emojis should be aria-hidden; visible Quem Somos copy stays'
);

assert(
  html.includes('<span aria-hidden="true">🛒</span> Encomendar <span class="cart-badge" id="cart-count">0</span>') &&
  html.includes('class="nav-order" onclick="irParaEncomenda()">'),
  'leftover nav-order cart mark should be aria-hidden; visible Encomendar and count stay'
);

assert(
  html.includes('<span class="gb-logo" aria-hidden="true">G</span>') &&
  html.includes('<span class="gb-nota" id="gb-nota">4,9</span>') &&
  html.includes('<span class="gb-stars" id="gb-stars">★★★★★</span>') &&
  html.includes('<span class="gb-total" id="gb-total">107 avaliações no Google</span>') &&
  html.includes('<span class="hr-stars">★★★★★</span>'),
  'leftover Google-badge logo should be aria-hidden; score / count stay; stars stay for PR #32'
);

assert(
  html.includes('<div class="contact-icon">📍</div>') &&
  html.includes('<span class="mb-icon">🛒</span>') &&
  html.includes('<span class="fc-icon">🛒</span>') &&
  html.includes('<div class="order-card-title">🛒 A Sua Encomenda</div>') &&
  html.includes('<span class="pay-badge">✓ MB WAY</span>'),
  'must not redo leftover contact / cart / pay icon hiding (PR #80)'
);

assert(
  /<div class="info-strip">/.test(html) &&
  html.includes('<div class="info-item"><span>🕗</span> Seg–Dom: 8:00 – 20:00</div>') &&
  html.includes('<span class="osm-arrow">→</span>') &&
  !html.includes('aria-label="Levantamento na Loja"') &&
  !html.includes('aria-label="Como Encomendar"'),
  'must not redo leftover info-strip / order-steps-mini landmarks or emoji hiding (PR #79)'
);

assert(
  /<div class="hero" id="inicio">/.test(html) &&
  /<div class="section shop-feature alt" id="populares">/.test(html) &&
  /<div class="section shop-feature" id="verao">/.test(html) &&
  /<div class="section shop-feature alt" id="legumes-frescos">/.test(html) &&
  !html.includes('aria-label="Fruta & Legumes Frescos Todos os Dias"') &&
  !html.includes('aria-label="Frutas Populares"'),
  'must not redo leftover hero / featured landmarks (PR #78)'
);

assert(
  /<section class="section shop" id="produtos"/.test(html) &&
  !html.includes('aria-label="Frutas & Legumes Frescos"') &&
  /<div class="section shop-feature promo-shop" id="promocoes">/.test(html) &&
  /<div class="section fi" id="cabazes">/.test(html),
  'must not redo leftover catalog / cabaz / promo landmarks (PR #77)'
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
  /<nav id="main-nav">/.test(html) &&
  /<nav class="mobile-bar" id="mobile-bar">/.test(html) &&
  !html.includes('aria-label="Principal"') &&
  !html.includes('aria-label="Carrinho e contactos"') &&
  !html.includes('aria-expanded="false"'),
  'must not redo leftover menu / nav landmarks (PR #74/#75) or hamburger expanded (PR #70)'
);

assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>') &&
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Menos"'),
  'product/cabaz/featured add stay a visible plus; must not redo leftover catalog qty / cart stepper names'
);

assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !app.includes('function irParaSeccao') &&
  !app.includes('function atualizarPainelCatalogo') &&
  !html.includes('role="tabpanel"') &&
  !html.includes('aria-label="Contactos rápidos"'),
  'must not redo leftover order labels, catalog tabpanel helpers, or social-dock landmark'
);

assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.nav-order \{[^}]*min-height:44px/.test(css) &&
  !/\.google-badge \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css),
  'must not redo leftover 44px tap-target or peach-ring PRs'
);

if (failures.length) {
  console.error('check-hero-chip-qs-nav-badge-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-hero-chip-qs-nav-badge-hidden: ok');
