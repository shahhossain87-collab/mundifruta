#!/usr/bin/env node
/**
 * Guards for leftover catalog/cabaz card hover motion. Complementary to
 * PR #112 (cat-quick lift/zoom), PR #20 (cardIn), PR #16 (.fi), PR #43
 * (shop-main add taps), PR #60 (Adicionar labels), and PR #110 (overlay
 * transition:none). This leftover only stops the product-card lift+photo
 * zoom on touch and under reduced motion.
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
  css.includes('.product-card:hover { transform:translateY(-4px); box-shadow:var(--sh-hover); }'),
  'leftover desktop catalog-card hover lift stays for pointer hover'
);
assert(
  css.includes('.product-card:hover .photo-wrap img { transform:scale(1.09); }'),
  'leftover desktop catalog-card photo zoom stays for pointer hover'
);
assert(
  /@media \(hover: none\) \{\s*\.product-card:hover \{ transform: none; \}\s*\.product-card:not\(\.selected\):hover \{ box-shadow: var\(--sh-soft\); \}\s*\.product-card:hover \.photo-wrap img \{ transform: none; \}/.test(css),
  'leftover catalog cards must not lift or zoom on leftover hover:none (touch)'
);
assert(
  /@media \(prefers-reduced-motion: reduce\) \{\s*\.product-card,\s*\.product-card \.photo-wrap img \{ transition: none; \}\s*\.product-card:hover,\s*\.product-card:hover \.photo-wrap img \{ transform: none; \}/.test(css),
  'leftover catalog cards must not animate under leftover reduced-motion'
);
assert(
  css.indexOf('.product-card:hover { transform:translateY(-4px); box-shadow:var(--sh-hover); }') <
    css.indexOf('@media (hover: none)'),
  'leftover hover:none rules must follow leftover catalog hover lift so they win the cascade'
);
assert(
  css.indexOf('@media (hover: none)') <
    css.lastIndexOf('@media (prefers-reduced-motion: reduce) {\n      .product-card,'),
  'leftover reduced-motion catalog-card rules must follow leftover hover:none'
);

assert(
  css.includes('.cat-quick-btn:hover { transform:translateY(-4px); box-shadow:var(--sh-lg); border-color:var(--sage); }') &&
  css.includes('.cat-quick-btn:hover img { transform:scale(1.055); }') &&
  !/@media \(hover: none\) \{\s*\.cat-quick-btn:hover/.test(css),
  'must not redo leftover category-tile hover (PR #112); leftover shortcut lift/zoom stays'
);
assert(
  css.includes('.feature-photo:hover img { transform:scale(1.045); }') &&
  !css.includes('.feature-photo:hover img { transform: none; }') &&
  !css.includes('.feature-product:hover'),
  'must not redo leftover featured-photo hover zoom; leftover scale(1.045) stays'
);

assert(
  css.includes('@keyframes cardIn { to { opacity:1; transform:translateY(0); } }') &&
  css.includes('.product-card.visible {\n      animation:cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;'),
  'must not redo leftover cardIn (PR #20)'
);
assert(
  css.includes('.fi { opacity:0; transform:translateY(22px); transition:opacity 0.6s ease, transform 0.6s ease; }'),
  'must not redo leftover .fi (PR #16)'
);
assert(
  app.includes("onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋ Adicionar</button>"),
  'visible leftover catalog Adicionar stays'
);
assert(
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html),
  'must not rewrite leftover modal visible CTAs; leftover plus-only adds stay'
);

assert(
  css.includes('html { scroll-behavior: smooth; }'),
  'leftover html scroll-behavior:smooth stays (reduced-motion stop stays in PR #21 / #104)'
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
  css.includes('.cs-pop { bottom:74px; }'),
  'must not redo leftover cs-pop vs bar (PR #106)'
);
assert(
  css.includes('.scroll-top { bottom:78px; }'),
  'must not redo leftover scroll-top vs bar (PR #107)'
);
assert(
  css.includes('.toast {\n      position:fixed; bottom:32px;') &&
  css.includes('.consent {') &&
  css.includes('bottom:12px'),
  'must not redo leftover consent/toast overlay vs bar (PR #4 / #108 / #111)'
);
assert(
  !/html \{[\s\S]*?scroll-padding-bottom:/.test(css) &&
  !/html \{[\s\S]*?scroll-padding-top:/.test(css),
  'must not redo leftover html scroll-padding (PR #97 / #105)'
);
assert(
  css.includes('.product-card,\n      .product-card .photo-wrap img { transition: none; }') &&
  !css.includes('.toast { transition:none') &&
  !css.includes('.scroll-top { transition:none') &&
  !css.includes('.product-modal { transition:none') &&
  !css.includes('.float-cart { transition:none') &&
  !css.includes('.shop-sidebar { transition:none') &&
  !css.includes('.cat-quick-btn,\n      .cat-quick-btn img { transition: none; }'),
  'leftover reduced-motion transition:none is only leftover catalog cards (PR #110 overlay / PR #112 tiles stay)'
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
  html.includes('<span class="mb-label" id="mb-cart-label">Carrinho</span>') &&
  html.includes('<span class="mb-label">Promoções</span>') &&
  html.includes('<span class="mb-label">WhatsApp</span>') &&
  html.includes('<span class="mb-label">Como Chegar</span>'),
  'visible leftover 4-item bar labels stay'
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
  !app.includes('function marcarBarraAtual') &&
  !app.includes('function marcarLogoAtual'),
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
  html.includes('data-count-label="frutas">Frutas</span>') &&
  html.includes('data-count-label="legumes">Legumes</span>') &&
  html.includes('<span class="cq-label">Carrinho <b id="quick-cart-count">0</b></span>'),
  'visible leftover Frutas / Legumes / Carrinho stay'
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
  !css.includes('right:200px') &&
  !css.includes('animation-name:cs-up-dock'),
  'must not redo leftover cs-pop desktop dock gutter (PR #39)'
);
assert(
  css.includes('.hero-slide { animation:none; transition:none; }') &&
  css.includes('.offer-reveal,.wm-l,.wm-r,.reveal-amount,.reveal-copy { animation:none !important; }'),
  'leftover hero-slide / welcome-offer reduced-motion stays on leftover master'
);
assert(
  extras.includes("prev.onclick = () => grid.scrollBy({ left: -passo() * 2, behavior: 'smooth' });"),
  'must not redo leftover carousel arrow reduced-motion (PR #29 / #30)'
);
assert(
  html.includes('id="produtos"') &&
  html.includes('id="inicio"') &&
  app.includes('function promoverCatalogo()'),
  'must not move leftover catalog/search; leftover promoverCatalogo stays'
);

if (failures.length) {
  console.error('check-product-card-hover failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-product-card-hover: ok');
