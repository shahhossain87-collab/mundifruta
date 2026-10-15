#!/usr/bin/env node
/**
 * Guards for leftover mobile filter-drawer backdrop (`.shop-backdrop`)
 * keyboard ring. Complementary to leftover Filtros / drawer-close forest
 * rings (PR #154) and leftover catalog-sort forest ring (PR #61); does
 * not redo leftover Filtros / sidebar-close rings, leftover Combina bem
 * cs-card forest ring (PR #227), leftover cabaz-ver forest ring (PR #226),
 * leftover credits-wrap forest ring (PR #225), leftover credits-back
 * forest ring (PR #224), leftover footer-credit forest ring (PR #223),
 * leftover privacy-dialog WhatsApp/email forest ring (PR #222), leftover
 * hero ghost CTA forest ring (PR #221), leftover featured-add /
 * featured-photo / carousel-nav rings (#219/#217/#216), leftover
 * shop-feature catalog-link rings (PR #182), leftover wrapping-nav Ervas /
 * Época / Cabazes (PR #218), leftover Fruta da Época shop-link destination
 * (PR #220), leftover-ring drafts #141–#190, leftover catalog SEO drafts
 * #195–#199, leftover wrapping-nav / breadcrumb / Ver produto / crawl-link /
 * title / photo / footer forest rings (#208–#214), leftover catalog
 * og:image / Twitter share tags (#215), leftover ticker/html/JS/carousel
 * reduced-motion drafts #200/#202–#204, leftover credits-page favicon
 * (draft #201), leftover hero-eyebrow pulse (PR #207), leftover
 * floating-fruit CSS, leftover homepage category-tile rings from #194,
 * leftover hamburger aria-expanded (PR #70).
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
  html.includes('css/estilos.css?v=67') &&
  html.includes('js/app.js?v=40') &&
  html.includes('js/extras.js?v=21') &&
  html.includes('js/dados.js?v=26'),
  'homepage cache should be estilos.css?v=67, app.js?v=40, extras.js?v=21, dados.js?v=26'
);
assert(
  creditos.includes('css/estilos.css?v=64'),
  'creditos.html cache stays estilos.css?v=64'
);
assert(
  generate.includes("cssPath: '../../css/estilos.css?v=65'"),
  'generated catalog CSS stays estilos.css?v=65'
);

assert(
  html.includes('class="shop-backdrop" id="shop-backdrop" type="button" onclick="toggleFiltros()" aria-label="Fechar filtros" hidden') &&
  html.includes('class="filtbtn" type="button" onclick="toggleFiltros()" aria-label="Abrir filtros e categorias"') &&
  html.includes('class="sidebar-close" type="button" onclick="toggleFiltros()" aria-label="Fechar filtros"'),
  'leftover shop-backdrop stays type=button, leftover Fechar filtros, leftover hidden, leftover toggleFiltros; leftover Filtros / leftover drawer ✕ stay'
);
assert(
  app.includes('function toggleFiltros') &&
  app.includes("const bd = document.getElementById('shop-backdrop')") &&
  app.includes('if (bd) bd.hidden = !abrir') &&
  app.includes('if (bd) bd.hidden = true'),
  'leftover toggleFiltros still shows leftover backdrop when the leftover drawer is open and leftover fecharFiltros still hides it'
);

assert(
  /\.shop-backdrop:focus-visible/.test(css),
  'leftover shop-backdrop should join the leftover forest :focus-visible ring'
);
assert(
  css.includes('.shop-backdrop:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover shop-backdrop must use the leftover catalog forest ring (not a new color)'
);
assert(
  css.includes('.shop-backdrop { display:none; }') &&
  css.includes('.shop-backdrop { display:block; position:fixed; inset:0; background:rgba(0,0,0,.42); z-index:1150; border:none; padding:0; }') &&
  css.includes('.shop-backdrop[hidden] { display:none; }'),
  'leftover shop-backdrop stays leftover full-screen mobile overlay (do not restyle leftover drawer overlay)'
);
assert(
  css.includes('.qty-btn:focus-visible') &&
  css.includes('.add-btn:focus-visible') &&
  css.includes('.photo-wrap:focus-visible'),
  'leftover catalog qty / Adicionar / photo forest rings stay'
);
assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(css),
  'leftover homepage category tiles keep leftover #194 focus-visible'
);

assert(
  html.includes('Promoções da Semana') &&
  html.includes('Frutas Populares') &&
  html.includes('Fruta da Época') &&
  html.includes('Legumes Frescos') &&
  html.includes('Ver catálogo completo →') &&
  html.includes('Ver todas as frutas →') &&
  html.includes('Explorar fruta →') &&
  html.includes('Ver todos os legumes →'),
  'leftover featured-row titles and leftover shop-link copy stay'
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
  html.includes('Encomende por WhatsApp e levante na loja'),
  'leftover announcement ticker still uses leftover pickup copy'
);
assert(
  html.includes('id="produtos"') &&
  html.indexOf('id="produtos"') < html.indexOf('id="inicio"'),
  'catalog still starts above leftover #inicio in leftover HTML'
);
assert(
  html.includes('class="hamburger" onclick="toggleMenu()" aria-label="Menu"') &&
  !html.includes('aria-expanded'),
  'leftover hamburger stays named Menu without aria-expanded'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  extras.includes("document.getElementById('privacy-modal').hidden = false"),
  'leftover footer Privacidade still opens leftover privacy via leftover abrirPrivacidade'
);
assert(
  html.includes('Encomendar por WhatsApp') &&
  html.includes('Ver Produtos'),
  'leftover homepage hero CTAs stay Ver Produtos / Encomendar por WhatsApp'
);
assert(
  html.includes('href="creditos.html">Créditos das fotos') &&
  html.includes('&copy; 2026 MUNDIFRUTA · Frutas e Legumes Frescos · Carnaxide'),
  'leftover homepage Créditos das fotos and leftover footer copy stay'
);
assert(
  html.includes('Desenvolvido por <a href="mailto:shahhossain050187@gmail.com">Shah Hossain</a>'),
  'leftover footer-credit destination stays mailto:shahhossain050187@gmail.com / Shah Hossain'
);

assert(
  !css.includes('outline:3px solid var(--peach)'),
  'must not redo leftover peach overlay rings'
);
assert(
  !/\.cs-card:focus-visible/.test(css),
  'must not combine leftover Combina bem cs-card forest rings (PR #227)'
);
assert(
  !/\.cabaz-ver:focus-visible/.test(css),
  'must not combine leftover cabaz-ver forest rings (PR #226)'
);
assert(
  !/\.credits-wrap a:focus-visible/.test(css) &&
  !/\.credits-wrap a:focus-visible/.test(creditos),
  'must not combine leftover credits-wrap forest rings (PR #225)'
);
assert(
  !/\.credits-back:focus-visible/.test(css) &&
  !/\.credits-back:focus-visible/.test(creditos),
  'must not combine leftover credits-back forest rings (PR #224)'
);
assert(
  !/\.footer-credit a:focus-visible/.test(css),
  'must not combine leftover footer-credit forest rings (PR #223)'
);
assert(
  !/\.privacy-box a:focus-visible/.test(css),
  'must not combine leftover privacy-dialog WhatsApp/email forest rings (PR #222)'
);
assert(
  !/\.btn-ghost:focus-visible/.test(css),
  'must not combine leftover hero ghost CTA forest rings (PR #221)'
);
assert(
  !/\.btn-prim:focus-visible/.test(css),
  'must not combine leftover primary CTA forest rings (PR #175)'
);
assert(
  !/\.btn-wa:focus-visible/.test(css),
  'must not combine leftover WhatsApp checkout CTA forest rings (PR #176)'
);
assert(
  !/\.btn-em:focus-visible/.test(css),
  'must not combine leftover email CTA forest rings (PR #177)'
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
  !/\.logo:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css),
  'must not redo leftover-ring drafts #171–#189 besides leftover shop-backdrop'
);
assert(
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.product-modal-close:focus-visible/.test(css) &&
  !/\.product-modal-add:focus-visible/.test(css) &&
  !/\.cabaz-modal-add:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.cs-pop-skip:focus-visible/.test(css) &&
  !/\.cs-pop-close:focus-visible/.test(css) &&
  !/\.reveal-cta:focus-visible/.test(css) &&
  !/\.reveal-close:focus-visible/.test(css) &&
  !/\.privacy-close:focus-visible/.test(css) &&
  !/\.privacy-reset:focus-visible/.test(css) &&
  !/\.consent-link:focus-visible/.test(css) &&
  !/\.consent-no:focus-visible/.test(css) &&
  !/\.consent-yes:focus-visible/.test(css),
  'must not redo leftover modal / consent / Filtros / Combina bem skip-close forest rings'
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
  !creditos.includes('rel="icon"') &&
  !creditos.includes("font-size='90'>🍓"),
  'must not combine leftover credits-page favicon (draft #201)'
);
assert(
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
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-backdrop \{[^}]*min-height:44px/.test(css) &&
  !/\.filtbtn \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs'
);
assert(
  generate.includes('<a href="${homePath}">Início</a>') &&
  generate.includes('<a href="${homePath}categorias/frutas/">Frutas</a>') &&
  generate.includes('<a href="${homePath}categorias/legumes/">Legumes</a>') &&
  generate.includes('<a href="${homePath}categorias/promocoes/">Promoções</a>') &&
  !generate.includes('categorias/ervas-frescas/">Ervas') &&
  !generate.includes('categorias/frutas-da-epoca/">Frutas da época') &&
  !generate.includes('categorias/cabazes/">Cabazes'),
  'must not combine leftover wrapping-nav Ervas / Época / Cabazes expansion (PR #218) in this run'
);
assert(
  html.includes("onclick=\"abrirCatalogo('frutas')\">Explorar fruta →"),
  'must not combine leftover Época featured shop-link destination (PR #220)'
);

if (failures.length) {
  console.error('check-shop-backdrop-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-shop-backdrop-focus: ok');
