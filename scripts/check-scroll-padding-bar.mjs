#!/usr/bin/env node
/**
 * Guards for leftover hash/focus clearance above the leftover 4-item
 * mobile bar. Complementary to PR #97 (html scroll-padding-top under
 * leftover announcement + nav), PR #46 (filter-drawer content pad),
 * and PR #4 (consent/toast overlay vs bar). This leftover only adds
 * html scroll-padding-bottom where leftover #mobile-bar is shown.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const dados = readFileSync(join(root, 'js/dados.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=65') && credits.includes('css/estilos.css?v=65'),
  'index.html and creditos.html should cache-bust estilos.css?v=65'
);
assert(
  html.includes('js/app.js?v=38') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=25'),
  'app.js stays ?v=38; extras.js stays ?v=21; dados.js stays ?v=25'
);

assert(
  /@media \(max-width:768px\) \{[\s\S]*?html \{ scroll-padding-bottom: calc\(72px \+ env\(safe-area-inset-bottom, 0px\)\); \}/.test(css),
  'leftover html scroll-padding-bottom should clear leftover 4-item bar at ≤768px'
);
assert(
  /@media \(max-width:700px\) \{[\s\S]*?html \{ scroll-padding-bottom: calc\(80px \+ env\(safe-area-inset-bottom, 0px\)\); \}/.test(css),
  'leftover html scroll-padding-bottom should match leftover denser bar at ≤700px'
);
assert(
  css.includes('html { scroll-behavior: smooth; }'),
  'leftover html scroll-behavior:smooth stays (reduced-motion stop stays in PR #21 / #104)'
);
assert(
  !/html \{[\s\S]*?scroll-padding-top:/.test(css),
  'must not redo leftover html scroll-padding-top (PR #97)'
);
assert(
  !css.includes('--nav-height: 52px') &&
  !css.includes('overflow-x: clip') &&
  !css.includes('scroll-behavior: auto'),
  'must not redo leftover mobile --nav-height / overflow-x:clip / reduced-motion scroll (PR #12 / #18 / #21 / #104)'
);
assert(
  !css.includes('overscroll-behavior:contain') &&
  !css.includes('overscroll-behavior: contain') &&
  !css.includes('overscroll-behavior:none'),
  'must not redo leftover overscroll containment (PR #27 / #98–#102)'
);
assert(
  css.includes('.mobile-menu {\n      display:none; position:fixed; inset:0; z-index:999;'),
  'must not redo leftover menu-bar stacking (PR #103)'
);
assert(
  !html.includes('skip-link') &&
  !html.includes('Saltar para') &&
  !html.includes('href="#search-input"') &&
  !html.includes('id="conteudo"') &&
  !html.includes('<main'),
  'must not redo leftover skip-to-search (PR #21) or leftover skip / main landmark from PR #2'
);
assert(
  !app.includes('function irParaSeccao') &&
  !app.includes('function comportamentoScroll') &&
  !app.includes('behavior: comportamentoScroll()'),
  'must not redo leftover JS reduced-motion scroll helpers (PR #29)'
);

assert(
  html.includes('<a href="#produtos">Produtos</a>') &&
  html.includes('<a href="#cabazes">Cabazes</a>') &&
  html.includes('<a href="#contacto">Contacto</a>') &&
  html.includes('id="contacto"') &&
  html.includes('id="encomenda"') &&
  html.includes('class="btn-wa">📱 Encomendar por WhatsApp</button>'),
  'leftover hash destinations and leftover WhatsApp checkout CTA stay'
);
assert(
  html.includes('<span>Início</span><span class="crumb-sep" aria-hidden="true">›</span>') &&
  html.includes('<span>Loja</span><span class="crumb-sep" aria-hidden="true">›</span>') &&
  html.includes('<b id="crumb-cat">Frutas</b>'),
  'must not redo leftover shop-crumb links (PR #47); Início / Loja stay plain text'
);
assert(
  html.includes('id="main-nav">') &&
  !html.includes('id="main-nav" aria-label') &&
  html.includes('id="mobile-bar">') &&
  !html.includes('id="mobile-bar" aria-label') &&
  html.includes('aria-label="Menu">') &&
  !html.includes('aria-expanded') &&
  !html.includes('aria-controls="mobile-menu"'),
  'must not redo leftover main-nav / mobile-bar landmarks (PR #74) or leftover hamburger expanded (PR #70)'
);
assert(
  !html.includes('aria-current') &&
  !app.includes('aria-current') &&
  !html.includes('data-bar=') &&
  !html.includes('data-cat="frutas"') &&
  !app.includes('function marcarBarraAtual') &&
  !app.includes('function marcarLogoAtual') &&
  !app.includes('function marcarAtalhoAtual'),
  'must not redo leftover current-page markers (PR #92–#96)'
);
assert(
  html.includes('id="mobile-menu">') &&
  !html.includes('id="mobile-menu" aria-label') &&
  html.includes('<div class="footer-links">') &&
  !html.includes('<nav class="footer-links"'),
  'must not redo leftover mobile-menu / footer-links landmarks (PR #75 / #76)'
);
assert(
  app.includes("const map = { produtos:'#produtos', cabazes:'#cabazes', verao:'#verao', avaliacoes:'#avaliacoes', contacto:'#contacto' }"),
  'must not add Promoções / Quem Somos to the leftover header spy (PR #5)'
);
assert(
  html.includes('<span class="mb-label" id="mb-cart-label">Carrinho</span>') &&
  html.includes('<span class="mb-label">Promoções</span>') &&
  html.includes('<span class="mb-label">WhatsApp</span>') &&
  html.includes('<span class="mb-label">Como Chegar</span>'),
  'visible leftover 4-item bar labels stay'
);
assert(
  app.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋ Adicionar</button>") &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html),
  'must not redo leftover named-add / photo-fallback hiding (PR #91); leftover plus-only adds stay unwrapped'
);
assert(
  html.includes('<span>🎁 10€ de desconto na primeira compra acima de 40€</span>'),
  'must not redo leftover ticker-mark hiding (PR #84) or leftover ticker copy'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.mb-item \{[^}]*min-height:44px/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !html.includes('"@type": "OrderAction"'),
  'must not redo leftover 44px tap-target / tabpanel / JSON-LD PRs'
);
assert(
  extras.includes('box.innerHTML = `🎁 <strong>Cupão de ${cupaoConfig.desconto}€ reservado.'),
  'must not redo leftover coupon / carousel hiding (PR #88)'
);
assert(
  dados.includes('nome:"Melancia 1/4"') &&
  dados.includes('nome:"Cabaz Detox"'),
  'must not invent leftover product / cabaz names'
);
assert(
  html.includes('class="consent"') &&
  css.includes('.consent {') &&
  css.includes('bottom:12px') &&
  css.includes('.toast {') &&
  css.includes('bottom:32px'),
  'must not redo leftover consent/toast overlay vs bar (PR #4)'
);

if (failures.length) {
  console.error('check-scroll-padding-bar failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-scroll-padding-bar: ok');
