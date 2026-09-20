#!/usr/bin/env node
/**
 * Guards for leftover decorative icons on leftover contact cards,
 * leftover mobile-bar / float-cart chrome, leftover order-card titles,
 * and leftover pay badges. Complementary to PR #79 (info-strip emojis /
 * mini arrows), PR #74 (mobile-bar landmark), PR #75 (order-list /
 * order-form names from these titles), PR #53 (contact 44px), PR #35
 * (mb-cart / float-cart names), PR #28 (inert empty float-cart),
 * PR #32 (hero/badge stars), leftover hamburger expanded (PR #70).
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

const contactIcons = html.match(/<div class="contact-icon" aria-hidden="true">[^<]+<\/div>/g) || [];
assert(
  contactIcons.length === 4 &&
  html.includes('<div class="contact-icon" aria-hidden="true">📍</div>') &&
  html.includes('<div class="contact-icon" aria-hidden="true">📞</div>') &&
  html.includes('<div class="contact-icon" aria-hidden="true">📧</div>') &&
  html.includes('<div class="contact-icon" aria-hidden="true">🕗</div>') &&
  html.includes('<h4>Morada</h4>') &&
  html.includes('<h4>Telefone / WhatsApp</h4>') &&
  html.includes('<a href="tel:932699850">932 699 850</a>') &&
  html.includes('<h4>Horário</h4>'),
  'leftover contact-card icons should be aria-hidden; visible headings and phone stay'
);

assert(
  html.includes('<span class="mb-icon" aria-hidden="true">🛒</span><span class="mb-label" id="mb-cart-label">Carrinho</span>') &&
  html.includes('<span class="mb-icon" aria-hidden="true">%</span><span class="mb-label">Promoções</span>') &&
  html.includes('<span class="mb-icon" aria-hidden="true">💬</span><span class="mb-label">WhatsApp</span>') &&
  html.includes('<span class="mb-icon" aria-hidden="true">📍</span><span class="mb-label">Como Chegar</span>'),
  'leftover mobile-bar icons should be aria-hidden; visible 4-item labels stay'
);

assert(
  html.includes('<span class="fc-icon" aria-hidden="true">🛒</span>') &&
  html.includes('title="Ver a sua encomenda"') &&
  html.includes('id="float-cart-text">0 · 0,00'),
  'leftover float-cart icon should be aria-hidden; title and total stay'
);

assert(
  html.includes('<div class="order-card-title"><span aria-hidden="true">🛒</span> A Sua Encomenda</div>') &&
  html.includes('<div class="order-card-title"><span aria-hidden="true">📋</span> Os Seus Dados</div>') &&
  html.includes('id="order-list"') &&
  html.includes('id="order-form"') &&
  !html.includes('aria-label="A Sua Encomenda"') &&
  !html.includes('aria-label="Os Seus Dados"'),
  'leftover order-card title emojis should be aria-hidden; titles stay (PR #75 names the list/form)'
);

assert(
  html.includes('<span class="pay-badge"><span aria-hidden="true">✓</span> MB WAY</span>') &&
  html.includes('<span class="pay-badge"><span aria-hidden="true">✓</span> Multibanco</span>') &&
  html.includes('<span class="pay-badge"><span aria-hidden="true">✓</span> Dinheiro</span>') &&
  html.includes('<span class="pay-badge"><span aria-hidden="true">🛍️</span> Levantamento na Loja</span>'),
  'leftover pay-badge marks should be aria-hidden; existing payment copy stays'
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
  html.includes('class="hero-chip">🕗 Aberto Hoje · 8h–20h</span>') &&
  html.includes('<span class="qs-chip">🌅 Frescura diária</span>') &&
  html.includes('class="nav-order" onclick="irParaEncomenda()">') &&
  html.includes('🛒 Encomendar') &&
  html.includes('<span class="gb-logo">G</span>'),
  'must not wrap leftover hero-chip / qs-chip / nav-order / Google-badge marks in this run'
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
  !/\.contact-card a \{[^}]*min-height:44px/.test(css) &&
  !/\.mb-item \{[^}]*min-height:44px/.test(css) &&
  !/\.float-cart \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.contact-card a:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css),
  'must not redo leftover 44px tap-target or peach-ring PRs'
);

if (failures.length) {
  console.error('check-contact-cart-icon-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-contact-cart-icon-hidden: ok');
