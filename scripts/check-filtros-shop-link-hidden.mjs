#!/usr/bin/env node
/**
 * Guards for leftover decorative marks on leftover Filtros, leftover
 * shop-link arrows, and leftover reviews CTA. Complementary to PR #82
 * (filter-chip / checkout / welcome-offer marks), PR #81 (hero / qs /
 * nav-order / Google-badge marks), PR #80 (contact / cart / pay /
 * order-title icons), PR #79 (info-strip emojis / mini arrows),
 * leftover hamburger expanded (PR #70), leftover 44px / peach-ring
 * shop PRs, leftover epoca CTA destination (PR #40), leftover
 * reviews-cta tap (PR #37), leftover shop-link 44px / type (PR #29).
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
  html.includes('class="filtbtn"') &&
  html.includes('aria-label="Abrir filtros e categorias"') &&
  html.includes('onclick="toggleFiltros()"') &&
  html.includes('<span aria-hidden="true">⚙️</span> Filtros</button>'),
  'leftover Filtros gear should be aria-hidden; visible Filtros and leftover Abrir filtros label stay'
);

assert(
  html.includes('onclick="document.getElementById(\'produtos\').scrollIntoView({behavior:\'smooth\'})">Ver catálogo completo <span aria-hidden="true">→</span></button>') &&
  html.includes('onclick="abrirCatalogo(\'frutas\')">Ver todas as frutas <span aria-hidden="true">→</span></button>') &&
  html.includes('onclick="abrirCatalogo(\'frutas\')">Explorar fruta <span aria-hidden="true">→</span></button>') &&
  html.includes('onclick="abrirCatalogo(\'legumes\')">Ver todos os legumes <span aria-hidden="true">→</span></button>'),
  'leftover shop-link arrows should be aria-hidden; visible CTA copy and leftover onclick destinations stay'
);

assert(
  html.includes('id="reviews-cta"') &&
  html.includes('Ver todas as avaliações no Google <span aria-hidden="true">→</span></a>'),
  'leftover reviews-cta arrow should be aria-hidden; visible Google CTA copy stays'
);

assert(
  html.includes('id="filter-promo"') &&
  html.includes('id="filter-disp"') &&
  html.includes('>🏷️ Em promoção</button>') &&
  html.includes('>✓ Disponíveis</button>') &&
  html.includes('>📱 Encomendar por WhatsApp</button>') &&
  html.includes('>🔒 Sem pagamento antecipado. Pague apenas na loja ao levantar.') &&
  html.includes('>← Continuar a comprar</button>') &&
  html.includes('>🎁 Receber Oferta</button>'),
  'must not redo leftover filter-chip / checkout / welcome-offer hiding (PR #82)'
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
  html.includes("onclick=\"abrirCatalogo('frutas')\">Explorar fruta") &&
  app.includes("function abrirCatalogo") &&
  !app.includes("abrirCatalogo('epoca')"),
  'must not change leftover epoca featured CTA destination (PR #40)'
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
  !/\.shop-link \{[^}]*min-height:44px/.test(css) &&
  !/\.reviews-cta \{[^}]*min-height:44px/.test(css) &&
  !/\.filtbtn \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.reviews-cta:focus-visible/.test(css),
  'must not redo leftover 44px tap-target or peach-ring shop PRs'
);

if (failures.length) {
  console.error('check-filtros-shop-link-hidden failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-filtros-shop-link-hidden: ok');
