#!/usr/bin/env node
/**
 * Guards for leftover decorative marks on leftover filter chips,
 * leftover checkout WhatsApp / continue / lock copy, and leftover
 * welcome-offer CTA. Complementary to PR #81 (hero / qs / nav-order /
 * Google-badge marks), PR #80 (contact / cart / pay / order-title
 * icons), PR #79 (info-strip emojis / mini arrows), leftover
 * hamburger expanded (PR #70).
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
  html.includes('id="filter-promo"') &&
  html.includes('id="filter-disp"') &&
  html.includes('<span aria-hidden="true">🏷️</span> Em promoção') &&
  html.includes('<span aria-hidden="true">✓</span> Disponíveis') &&
  html.includes('aria-pressed="false"') &&
  html.includes("alternarFiltro('promo',this)") &&
  html.includes("alternarFiltro('disp',this)"),
  'leftover filter-chip marks should be aria-hidden; visible Em promoção / Disponíveis stay'
);

assert(
  html.includes('class="btn-wa"') &&
  html.includes('<span aria-hidden="true">📱</span> Encomendar por WhatsApp') &&
  html.includes('class="order-reassure"') &&
  html.includes('<span aria-hidden="true">🔒</span> Sem pagamento antecipado. Pague apenas na loja ao levantar.') &&
  html.includes('class="btn-continuar"') &&
  html.includes('<span aria-hidden="true">←</span> Continuar a comprar'),
  'leftover checkout WhatsApp / lock / continue marks should be aria-hidden; visible copy stays'
);

assert(
  html.includes('class="reveal-cta"') &&
  html.includes('<span aria-hidden="true">🎁</span> Receber Oferta') &&
  html.includes('>Agora não</button>'),
  'leftover welcome-offer gift mark should be aria-hidden; visible Receber Oferta stays'
);

assert(
  html.includes('<span class="hero-chip">🕗 Aberto Hoje · 8h–20h</span>') &&
  html.includes('<span class="qs-chip">🌅 Frescura diária</span>') &&
  html.includes('🛒 Encomendar <span class="cart-badge" id="cart-count">0</span>') &&
  html.includes('<span class="gb-logo">G</span>'),
  'must not redo leftover hero / qs / nav-order / Google-badge hiding (PR #81)'
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
  html.includes('aria-label="Abrir filtros e categorias">⚙️ Filtros</button>') &&
  html.includes('onclick="abrirCatalogo(\'frutas\')">Ver todas as frutas →</button>') &&
  html.includes('onclick="abrirCatalogo(\'frutas\')">Explorar fruta →</button>'),
  'must not wrap leftover Filtros gear or leftover shop-link arrows'
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
  console.error('check-filter-order-offer-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-filter-order-offer-hidden: ok');
