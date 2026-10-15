#!/usr/bin/env node
/**
 * Guards for leftover homepage mobile-menu catalog jumps (Ervas / Época).
 * Complementary to leftover Frutas / Legumes hamburger jumps, leftover
 * Ervas / Época catalog tabs, and leftover category tiles; does not redo
 * leftover wrapping-nav Ervas / Época / Cabazes (PR #218), leftover
 * footer Ervas / Época catalog jumps (PR #230), leftover footer Cabazes /
 * Promoções / Avaliações shop-links (PR #229), leftover Época featured
 * shop-link destination (PR #220), leftover mobile-menu link keyboard
 * rings (PR #184), leftover hamburger aria-expanded (PR #70), leftover
 * mobile-close accessible name (PR #179), leftover-ring drafts #141–#190,
 * leftover catalog SEO drafts #195–#199, leftover wrapping-nav /
 * breadcrumb / Ver produto / crawl-link / title / photo / footer forest
 * rings (#208–#214), leftover catalog og:image / Twitter share tags
 * (#215), leftover ticker/html/JS/carousel reduced-motion drafts
 * #200/#202–#204, leftover credits-page favicon (draft #201), leftover
 * hero-eyebrow pulse (PR #207), leftover floating-fruit CSS, leftover
 * homepage category-tile rings from #194, leftover shop-backdrop forest
 * ring (PR #228).
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
  'homepage cache is estilos.css?v=67, app.js?v=40, extras.js?v=21, dados.js?v=26'
);
assert(
  creditos.includes('css/estilos.css?v=64'),
  'creditos.html cache stays estilos.css?v=64'
);
assert(
  generate.includes("cssPath: '../../css/estilos.css?v=65'"),
  'generated catalog CSS stays estilos.css?v=65'
);

const menuMatch = html.match(/<div class="mobile-menu" id="mobile-menu">([\s\S]*?)<\/div>/);
assert(menuMatch, 'leftover homepage mobile-menu block should stay');
const menu = menuMatch ? menuMatch[1] : '';
assert(
  menu.includes("onclick=\"abrirCatalogo('frutas');toggleMenu()\">Frutas") &&
  menu.includes("onclick=\"abrirCatalogo('legumes');toggleMenu()\">Legumes") &&
  menu.includes("onclick=\"abrirCatalogo('ervas');toggleMenu()\">Ervas") &&
  menu.includes("onclick=\"abrirCatalogo('epoca');toggleMenu()\">Época") &&
  menu.includes('href="#promocoes"') &&
  menu.includes('>Promoções</a>') &&
  menu.includes('href="#cabazes"') &&
  menu.includes('>Cabazes</a>') &&
  menu.includes('href="#como-funciona"') &&
  menu.includes('>Como Funciona</a>') &&
  menu.includes('href="#produtos"') &&
  menu.includes('>Produtos</a>') &&
  menu.includes('href="#quem-somos"') &&
  menu.includes('>Quem Somos</a>') &&
  menu.includes('href="#avaliacoes"') &&
  menu.includes('>Avaliações</a>') &&
  menu.includes('href="#encomenda"') &&
  menu.includes('>Encomendar</a>') &&
  menu.includes('href="#contacto"') &&
  menu.includes('>Contacto</a>'),
  'leftover mobile-menu should keep existing shop-links and add leftover Ervas / Época catalog jumps'
);
assert(
  menu.indexOf("onclick=\"abrirCatalogo('legumes');toggleMenu()\">Legumes") <
  menu.indexOf("onclick=\"abrirCatalogo('ervas');toggleMenu()\">Ervas") &&
  menu.indexOf("onclick=\"abrirCatalogo('ervas');toggleMenu()\">Ervas") <
  menu.indexOf("onclick=\"abrirCatalogo('epoca');toggleMenu()\">Época") &&
  menu.indexOf("onclick=\"abrirCatalogo('epoca');toggleMenu()\">Época") <
  menu.indexOf('>Promoções</a>'),
  'leftover mobile-menu Ervas / Época should follow leftover Frutas / Legumes catalog order'
);
assert(
  !menu.includes('Ervas frescas') &&
  !menu.includes('Frutas da Época') &&
  !menu.includes('Fruta da Época'),
  'leftover mobile-menu Ervas / Época stay short labels, matching leftover Frutas / Legumes'
);
assert(
  /class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(menu),
  'leftover mobile-close stays a visible ✕ that still calls leftover toggleMenu'
);

const navMatch = html.match(/<div class="nav-links">([\s\S]*?)<\/div>/);
assert(navMatch, 'leftover wrapping-nav block should stay');
const nav = navMatch ? navMatch[1] : '';
assert(
  nav.includes('href="#produtos">Produtos') &&
  nav.includes("onclick=\"abrirCatalogo('frutas')\">Frutas") &&
  nav.includes("onclick=\"abrirCatalogo('legumes')\">Legumes") &&
  nav.includes('href="#cabazes">Cabazes') &&
  nav.includes('href="#promocoes">Promoções') &&
  nav.includes('href="#quem-somos">Quem Somos') &&
  nav.includes('href="#avaliacoes">Avaliações') &&
  nav.includes('href="#contacto">Contacto'),
  'leftover wrapping-nav Cabazes / Promoções / Avaliações stay'
);
assert(
  !nav.includes("abrirCatalogo('ervas')") &&
  !nav.includes("abrirCatalogo('epoca')") &&
  !nav.includes('>Ervas<') &&
  !nav.includes('>Época<'),
  'must not combine leftover wrapping-nav Ervas / Época / Cabazes expansion (PR #218)'
);

const footerMatch = html.match(/<div class="footer-links">([\s\S]*?)<\/div>/);
assert(footerMatch, 'leftover homepage footer-links block should stay');
const footer = footerMatch ? footerMatch[1] : '';
assert(
  footer.includes('href="#produtos">Produtos') &&
  footer.includes("onclick=\"abrirCatalogo('frutas')\">Frutas") &&
  footer.includes("onclick=\"abrirCatalogo('legumes')\">Legumes") &&
  footer.includes('href="#quem-somos">Quem Somos') &&
  footer.includes('href="#encomenda">Encomendar') &&
  footer.includes('href="#contacto">Contacto') &&
  footer.includes('onclick="abrirPrivacidade();return false;">Privacidade') &&
  footer.includes('href="creditos.html">Créditos das fotos'),
  'leftover footer existing shop-links stay'
);
assert(
  !footer.includes("abrirCatalogo('ervas')") &&
  !footer.includes("abrirCatalogo('epoca')") &&
  !footer.includes('href="#cabazes">Cabazes') &&
  !footer.includes('href="#promocoes">Promoções') &&
  !footer.includes('href="#avaliacoes">Avaliações'),
  'must not redo leftover footer Ervas / Época (PR #230) or leftover footer Cabazes / Promoções / Avaliações (PR #229)'
);

assert(
  html.includes('id="tab-ervas"') &&
  html.includes('id="tab-epoca"') &&
  html.includes("onclick=\"mostrarCategoria('ervas',this)\">Ervas frescas") &&
  html.includes("onclick=\"mostrarCategoria('epoca',this)\">Frutas da Época") &&
  html.includes("onclick=\"abrirCatalogo('ervas')\"") &&
  html.includes("onclick=\"abrirCatalogo('epoca')\""),
  'leftover Ervas / Época catalog tabs and leftover category-tile jumps stay'
);
assert(
  app.includes("ervas:     { label:'Ervas frescas'") &&
  app.includes("epoca:     { label:'Frutas da Época'") &&
  app.includes('function abrirCatalogo(cat)') &&
  app.includes("document.getElementById('produtos').scrollIntoView") &&
  app.includes("function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }"),
  'leftover abrirCatalogo still opens leftover Ervas / Época catalog tabs and leftover toggleMenu still toggles leftover open'
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
  html.includes('&copy; 2026 MUNDIFRUTA · Frutas e Legumes Frescos · Carnaxide'),
  'leftover footer copy stays'
);
assert(
  html.includes('Desenvolvido por <a href="mailto:shahhossain050187@gmail.com">Shah Hossain</a>'),
  'leftover footer-credit destination stays mailto:shahhossain050187@gmail.com / Shah Hossain'
);

assert(
  /\.mobile-menu \{[^}]*overflow-y:\s*auto/.test(css),
  'leftover mobile-menu should scroll on leftover short viewports after leftover Ervas / Época'
);
assert(
  /\.mobile-close \{[^}]*position:\s*fixed/.test(css),
  'leftover mobile-close stays on-screen while leftover overlay scrolls'
);
assert(
  /@media \(max-height:\s*700px\)\s*\{\s*\.mobile-menu \{[^}]*gap:\s*12px/.test(css),
  'leftover short-viewport mobile-menu gap tightens so leftover Ervas / Época still fit'
);

assert(
  !css.includes('outline:3px solid var(--peach)'),
  'must not redo leftover peach overlay rings'
);
assert(
  !/\.footer-links a:focus-visible/.test(css),
  'must not combine leftover footer shop-link keyboard rings (PR #181)'
);
assert(
  !/\.footer-credit a:focus-visible/.test(css),
  'must not combine leftover footer-credit forest rings (PR #223)'
);
assert(
  !/\.shop-backdrop:focus-visible/.test(css),
  'must not combine leftover shop-backdrop forest rings (PR #228)'
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
  !/\.mobile-menu a:focus-visible/.test(css) &&
  !/\.nav-links a:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.btn-continuar:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css),
  'must not redo leftover-ring drafts #171–#189 besides leftover mobile-menu Ervas / Época'
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
  generate.includes('>Início</a>') &&
  generate.includes('>Frutas</a>') &&
  generate.includes('>Legumes</a>') &&
  generate.includes('>Promoções</a>') &&
  !generate.includes('categorias/ervas-frescas/">Ervas') &&
  !generate.includes('categorias/frutas-da-epoca/">Frutas da época') &&
  !generate.includes('categorias/cabazes/">Cabazes'),
  'must not combine leftover wrapping-nav Ervas / Época / Cabazes expansion (PR #218) in this run'
);
assert(
  html.includes("onclick=\"abrirCatalogo('frutas')\">Explorar fruta →"),
  'must not combine leftover Época featured shop-link destination (PR #220)'
);
assert(
  html.includes('<span>📞</span> 932 699 850'),
  'must not combine leftover info-strip tel: link in this run'
);

if (failures.length) {
  console.error('check-mobile-menu-ervas-epoca failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-mobile-menu-ervas-epoca: ok');
