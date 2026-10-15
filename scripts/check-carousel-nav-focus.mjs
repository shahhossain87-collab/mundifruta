#!/usr/bin/env node
/**
 * Guards leftover featured-row carousel-nav keyboard rings.
 * Complementary to leftover-ring drafts #141–#190 (does not move
 * catalog/search, restyle the nav, change the 4-item mobile bar,
 * rewrite modal visible CTAs, or change JSON-LD).
 *
 * Not a redo of leftover float-cart rings (PR #205), leftover
 * Hora de levantamento toggle rings (PR #206), leftover Voltar ao
 * topo rings (PR #190), leftover 4-item-bar rings, leftover
 * hamburger aria-expanded (PR #70), leftover catalog SEO drafts
 * #195–#199, leftover ticker/html/JS/carousel reduced-motion
 * drafts #200–#204, leftover credits-page favicon (draft #201),
 * leftover floating-fruit CSS, leftover homepage category-tile
 * rings from #194, leftover catalog-sort forest ring (PR #61).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const generator = readFileSync(join(root, 'scripts/generate-seo-pages.mjs'), 'utf8');
const creditos = readFileSync(join(root, 'creditos.html'), 'utf8');

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
  'creditos.html cache stays estilos.css?v=64 (do not combine leftover credits favicon)'
);
assert(
  generator.includes("cssPath: '../../css/estilos.css?v=65'"),
  'generated catalog CSS stays estilos.css?v=65'
);

assert(
  html.includes('id="promo-grid"') &&
  html.includes('id="popular-grid"') &&
  html.includes('id="season-grid"') &&
  html.includes('id="veg-featured-grid"') &&
  html.includes('class="feature-grid"'),
  'leftover featured-row grids stay promo / populares / época / legumes'
);
assert(
  extras.includes("prev.className = 'carousel-nav prev'") &&
  extras.includes("next.className = 'carousel-nav next'") &&
  extras.includes("prev.setAttribute('aria-label', 'Anterior')") &&
  extras.includes("next.setAttribute('aria-label', 'Seguinte')") &&
  extras.includes("prev.textContent = '‹'") &&
  extras.includes("next.textContent = '›'") &&
  extras.includes("prev.type = 'button'") &&
  extras.includes("next.type = 'button'"),
  'leftover carousel-nav stays type=button with leftover Anterior / Seguinte and leftover ‹ ›'
);
assert(
  extras.includes("grid.scrollBy({ left: -passo() * 2, behavior: 'smooth' })") &&
  extras.includes("grid.scrollBy({ left: passo() * 2, behavior: 'smooth' })") &&
  extras.includes("if (reduzir) return;"),
  'leftover prev/next still scroll leftover smooth and leftover auto-advance still skips when reduced'
);

assert(
  /\.carousel-nav:focus-visible/.test(css),
  'leftover carousel-nav should join the leftover forest :focus-visible ring'
);
assert(
  css.includes('.carousel-nav:focus-visible') &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover carousel-nav must use the leftover catalog forest ring (not a new color)'
);
assert(
  /@media \(hover:none\) \{ \.carousel-nav \{ display:none; \} \}/.test(css),
  'leftover carousel-nav still hides on leftover hover:none (touch) viewports'
);
assert(
  css.includes('.qty-btn:focus-visible') &&
  css.includes('.add-btn:focus-visible') &&
  css.includes('.photo-wrap:focus-visible'),
  'leftover catalog qty / Adicionar / photo forest rings stay'
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
  /<a href="#produtos" class="btn-prim">Ver Produtos/.test(html) &&
  /<a href="#encomenda" class="btn-ghost">Encomendar por WhatsApp/.test(html),
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
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(html) &&
  !html.includes('aria-expanded'),
  'leftover hamburger stays named Menu without aria-expanded'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  extras.includes("document.getElementById('privacy-modal').hidden = false"),
  'leftover footer Privacidade still opens leftover privacy via leftover abrirPrivacidade'
);

assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(css),
  'leftover homepage category tiles keep leftover #194 focus-visible'
);
assert(
  !css.includes('outline:3px solid var(--peach)'),
  'must not redo leftover peach overlay rings'
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
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css),
  'must not combine leftover featured-row shop-link / feature-add rings'
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
  'must not redo leftover SEO catalog forest rings (PRs #208–#214)'
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
  !/@media \(prefers-reduced-motion:\s*reduce\)[\s\S]{0,220}\.feature-grid\.carousel\s*\{[^}]*scroll-behavior:\s*auto/.test(css) &&
  !app.includes('function preferenciaScroll') &&
  !extras.includes('const comportamento'),
  'must not redo leftover ticker / html-scroll / JS-scroll / carousel reduced-motion drafts'
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
  !html.includes('role="tabpanel"'),
  'must not redo leftover catalog qty labels, order labels, or catalog tabpanel'
);

if (failures.length) {
  console.error('check-carousel-nav-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-carousel-nav-focus: ok');
