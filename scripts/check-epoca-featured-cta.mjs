#!/usr/bin/env node
/**
 * Guards leftover Fruta da Época featured shop-link destination.
 * Complementary to leftover homepage category-tile `abrirCatalogo('epoca')`
 * from #194 and leftover catalog tab `tab-epoca`. Does not redo leftover
 * shop-feature catalog-link rings (PR #182), leftover featured-add /
 * featured-photo / carousel-nav rings (#219/#217/#216), leftover wrapping-nav
 * Ervas / Época / Cabazes expansion (PR #218), leftover filter-drawer work
 * from PR #40 besides this leftover destination, leftover-ring drafts
 * #141–#190, leftover catalog SEO drafts #195–#199, leftover wrapping-nav /
 * breadcrumb / Ver produto / crawl-link / title / photo / footer forest
 * rings (#208–#214), leftover catalog og:image / Twitter share tags (#215),
 * leftover ticker/html/JS/carousel reduced-motion drafts #200/#202–#204,
 * leftover credits-page favicon (draft #201), leftover hero-eyebrow pulse
 * (PR #207), leftover floating-fruit CSS, leftover hamburger aria-expanded
 * (PR #70), leftover catalog-sort forest ring (PR #61).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');
const generate = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=66') &&
  html.includes('js/app.js?v=40') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=26'),
  'homepage cache stays estilos.css?v=66, app.js?v=40, extras.js?v=21, dados.js?v=26'
);
assert(
  creditos.includes('css/estilos.css?v=64'),
  'creditos.html cache stays estilos.css?v=64 (do not combine leftover credits favicon)'
);
assert(
  generate.includes("cssPath: '../../css/estilos.css?v=65'"),
  'generated catalog CSS stays estilos.css?v=65'
);

assert(
  /id="verao"[\s\S]{0,400}onclick="abrirCatalogo\('epoca'\)">Explorar fruta →<\/button>/.test(html),
  'leftover Fruta da Época shop-link should call leftover abrirCatalogo(\'epoca\')'
);
assert(
  html.includes('Explorar fruta →'),
  'visible leftover Explorar fruta → copy stays'
);
assert(
  html.includes('onclick="abrirCatalogo(\'frutas\')">Ver todas as frutas →</button>'),
  'leftover Ver todas as frutas still calls leftover abrirCatalogo(\'frutas\')'
);
assert(
  html.includes('onclick="document.getElementById(\'produtos\').scrollIntoView({behavior:\'smooth\'})">Ver catálogo completo →</button>'),
  'leftover Ver catálogo completo still scrolls leftover #produtos'
);
assert(
  html.includes('onclick="abrirCatalogo(\'legumes\')">Ver todos os legumes →</button>'),
  'leftover Ver todos os legumes still calls leftover abrirCatalogo(\'legumes\')'
);
assert(
  html.includes('onclick="abrirCatalogo(\'epoca\')"') &&
  html.includes('data-count-label="epoca">Fruta da Época</span>'),
  'leftover homepage category tile still calls leftover abrirCatalogo(\'epoca\')'
);
assert(
  html.includes('id="tab-epoca"') &&
  html.includes("onclick=\"mostrarCategoria('epoca',this)\""),
  'leftover catalog Frutas da Época tab stays'
);
assert(
  app.includes("epoca:     { label:'Frutas da Época'") &&
  app.includes("function abrirCatalogo(cat)") &&
  app.includes("mostrarCategoria(cat, document.getElementById(`tab-${cat}`))"),
  'leftover abrirCatalogo still opens leftover catalog tab for the leftover category'
);

assert(
  html.includes('Promoções da Semana') &&
  html.includes('Frutas Populares') &&
  html.includes('Fruta da Época') &&
  html.includes('Legumes Frescos'),
  'leftover featured-row titles stay'
);
assert(
  html.includes('id="mobile-bar"') &&
  html.includes('id="mb-cart-label">Carrinho') &&
  html.includes('mb-label">Promoções') &&
  html.includes('mb-label">WhatsApp') &&
  html.includes('mb-label">Como Chegar'),
  'leftover 4-item bar labels stay Carrinho / Promoções / WhatsApp / Como Chegar'
);
assert(
  /Ver Produtos/.test(html) &&
  /Encomendar por WhatsApp/.test(html),
  'leftover homepage hero CTAs stay Ver Produtos / Encomendar por WhatsApp'
);
assert(
  html.includes('Encomende por WhatsApp e levante na loja'),
  'leftover announcement ticker still uses leftover pickup copy'
);
assert(
  html.includes('id="produtos"') &&
  html.indexOf('id="produtos"') < html.indexOf('id="inicio"'),
  'catalog still starts above leftover #inicio in leftover HTML'
);
assert(
  /aria-label="Menu"/.test(html) &&
  !html.includes('aria-expanded'),
  'leftover hamburger stays named Menu without aria-expanded'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  extras.includes("document.getElementById('privacy-modal').hidden = false"),
  'leftover footer Privacidade still opens leftover privacy via leftover abrirPrivacidade'
);

assert(
  !/\.shop-link:focus-visible/.test(css),
  'must not combine leftover shop-feature catalog-link rings (PR #182)'
);
assert(
  !/\.feature-add:focus-visible/.test(css),
  'must not combine leftover featured-add rings (PR #219)'
);
assert(
  !/\.feature-photo:focus-visible/.test(css),
  'must not combine leftover featured-photo rings (PR #217)'
);
assert(
  !/\.carousel-nav:focus-visible/.test(css),
  'must not combine leftover featured-row carousel-nav rings (PR #216)'
);
assert(
  !/\.float-cart:focus-visible/.test(css),
  'must not redo leftover float-cart forest rings (PR #205)'
);
assert(
  !/\.order-optional-toggle:focus-visible/.test(css),
  'must not combine leftover Hora de levantamento toggle rings'
);
assert(
  !/\.scroll-top:focus-visible/.test(css),
  'must not redo leftover Voltar ao topo forest rings (PR #190)'
);
assert(
  !/\.mb-item:focus-visible/.test(css),
  'must not combine leftover 4-item-bar forest rings'
);
assert(
  !/\.social-link:focus-visible/.test(css) &&
  !/\.contact-card a:focus-visible/.test(css) &&
  !/\.reviews-cta:focus-visible/.test(css) &&
  !/\.google-badge:focus-visible/.test(css) &&
  !/\.hero-rating:focus-visible/.test(css) &&
  !/#mobile-menu a:focus-visible/.test(css) &&
  !/\.nav-links a:focus-visible/.test(css) &&
  !/\.footer-links a:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.btn-continuar:focus-visible/.test(css) &&
  !/\.btn-em:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.btn-prim:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css),
  'must not redo leftover-ring drafts #171–#189'
);
assert(
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.product-modal-close:focus-visible/.test(css) &&
  !/\.product-modal-add:focus-visible/.test(css) &&
  !/\.cabaz-modal-add:focus-visible/.test(css) &&
  !/\.cs-pop-skip:focus-visible/.test(css) &&
  !/\.reveal-cta:focus-visible/.test(css) &&
  !/\.reveal-close:focus-visible/.test(css) &&
  !/\.privacy-close:focus-visible/.test(css) &&
  !/\.consent-link:focus-visible/.test(css),
  'must not redo leftover modal / consent / Filtros forest rings'
);
assert(
  !/\.seo-nav a:focus-visible/.test(css) &&
  !/\.seo-breadcrumbs a:focus-visible/.test(css) &&
  !/\.seo-text-link:focus-visible/.test(css) &&
  !/\.seo-crawl-links a:focus-visible/.test(css) &&
  !/\.seo-product-card h2 a:focus-visible/.test(css) &&
  !/\.seo-product-image:focus-visible/.test(css) &&
  !/\.seo-footer a:focus-visible/.test(css),
  'must not redo leftover catalog SEO forest rings #208–#214'
);
assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(css),
  'leftover homepage category tiles keep leftover #194 focus-visible'
);
assert(
  css.includes('.qty-btn:focus-visible') &&
  css.includes('.add-btn:focus-visible') &&
  css.includes('.photo-wrap:focus-visible'),
  'leftover catalog qty / Adicionar / photo forest rings stay'
);
assert(
  css.includes('.ff1') &&
  css.includes('animation:fA') &&
  css.includes('.ff10'),
  'must not redo leftover floating-fruit CSS'
);
assert(
  !/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]{0,220}\.announcement-track/.test(css) &&
  !/@media \(prefers-reduced-motion:\s*reduce\)\s*\{\s*html\s*\{[^}]*scroll-behavior:\s*auto/.test(css) &&
  !app.includes('function preferenciaScroll'),
  'must not redo leftover ticker / html-scroll / JS-scroll reduced-motion drafts'
);
assert(
  !html.includes('aria-label="Fechar"') ||
  !/class="mobile-close"[^>]*aria-label="Fechar"/.test(html),
  'must not combine leftover mobile-close accessible name in this run'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  !html.includes('for="cust-nome"') &&
  !html.includes('role="tabpanel"') &&
  !app.includes('aria-label="Adicionar ${item.nome}'),
  'must not redo leftover catalog qty labels, order labels, catalog tabpanel, or featured-add-name'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-link \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css),
  'must not redo leftover 44px tap-target PRs'
);
assert(
  !css.includes('outline:3px solid var(--peach)'),
  'must not redo leftover peach overlay rings'
);

if (failures.length) {
  console.error('check-epoca-featured-cta failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-epoca-featured-cta: ok');
