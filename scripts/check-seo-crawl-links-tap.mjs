#!/usr/bin/env node
/**
 * Guards leftover homepage Explorar o catálogo tap targets on phones.
 * Complementary to leftover catalog price-filter tap (PR #344), leftover
 * cat-tab tap (PR #343), leftover subcat-chip tap (PR #342), leftover
 * filter-chip tap (PR #341), leftover individual filter-tag tap (PR #340),
 * leftover filter-tag Limpar tudo tap (PR #339), leftover catalog
 * pagination tap (PR #338), leftover no-results Limpar filtros tap
 * (PR #337), leftover catalog sort tap (PR #336), leftover catalog
 * search-clear tap (PR #335), leftover checkout Continuar a comprar tap
 * (PR #334), leftover Explorar o catálogo keyboard ring (PR #211),
 * leftover wrapping-nav 44px (PR #285), leftover Ver produto 44px
 * (PR #281), leftover product-page order CTA (PR #270). Does not redo
 * leftover type=button on leftover hamburger / Encomendar / mobile-close
 * / search-clear / 4-item bar Carrinho / cabaz-modal-close /
 * cabaz-modal-add / cabaz-ver / float-cart / float-legumes / scroll-top
 * / cat-quick-btn / shop-link, leftover .seo-crawl-links a:focus-visible
 * (PR #211), leftover wrapping Ervas / Época / Cabazes (PR #218),
 * leftover combined all-breakpoint #filter-preco 44px (PR #42 / #43),
 * leftover SEO hamburger, leftover forest wordmark (PR #196), leftover
 * catalog h2 move, leftover forest-on-forest contrast, leftover
 * .seo-text-link 44px (PR #281), leftover .seo-order-link 44px (PR #270),
 * leftover .seo-nav a 44px (PR #285), leftover .seo-breadcrumbs a 44px
 * (PR #286), leftover .seo-footer a 44px (PR #288), leftover
 * .seo-header 44px (PR #289), leftover homepage og:image:alt (PR #244),
 * leftover homepage lang pt-PT (PR #239), leftover ticker reduced-motion
 * (PR #200), leftover html smooth-scroll (PR #202), leftover search-clear
 * type=button (PR #308), leftover search-clear :focus-visible (PR #171),
 * leftover .btn-continuar:focus-visible (PR #178), leftover
 * .btn-em:focus-visible (PR #177), leftover float-cart 44px (PR #53),
 * leftover float-cart type (PR #325), leftover float-cart ring (PR #205),
 * leftover filter-select 44px (PR #344), leftover cat-tab 44px (PR #343).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const product = readFileSync(join(root, 'produtos', 'melancia-1-4', 'index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias', 'frutas', 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  index.includes('css/estilos.css?v=67') &&
  index.includes('js/app.js?v=40') &&
  index.includes('js/extras.js?v=21') &&
  index.includes('js/dados.js?v=26'),
  'homepage cache should be estilos.css?v=67 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
);
assert(
  /estilos\.css\?v=65/.test(generator) &&
  product.includes('css/estilos.css?v=65') &&
  category.includes('css/estilos.css?v=65'),
  'generated catalog CSS cache should stay estilos.css?v=65'
);
assert(
  credits.includes('css/estilos.css?v=64'),
  'credits cache should stay estilos.css?v=64'
);

assert(
  /\.seo-crawl-links a \{ background:#fff; border:1px solid var\(--line\); border-radius:var\(--r-full\); padding:8px 13px; font-size:\.82rem; \}/.test(css),
  'leftover Explorar o catálogo chips should hug leftover labels on leftover desktop (padding:8px 13px, leftover no min-height)'
);
assert(
  /@media \(max-width:640px\) \{\s*\/\* Explorar o catálogo: 44px tap target on phones, copy unchanged\. \*\/\s*\.seo-crawl-links a \{ display:inline-flex; align-items:center; min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover seo-crawl-links a min-height:44px'
);
assert(
  !/\.seo-crawl-links a \{[^}]*min-height:44px/.test(css.replace(/@media \(max-width:640px\) \{\s*\/\* Explorar o catálogo: 44px tap target on phones, copy unchanged\. \*\/\s*\.seo-crawl-links a \{ display:inline-flex; align-items:center; min-height:44px; box-sizing:border-box; \}\s*\}/, '')),
  'must not invent leftover all-breakpoint seo-crawl-links 44px'
);
assert(
  !/\.seo-crawl-links a:focus-visible/.test(css) &&
  !/\.seo-text-link:focus-visible/.test(css) &&
  !/\.seo-nav a:focus-visible/.test(css) &&
  !/\.seo-order-link:focus-visible/.test(css),
  'should not invent leftover Explorar o catálogo / Ver produto / wrapping-nav / order CTA keyboard rings (PR #211 / #210 / #208 / #175)'
);
assert(
  /<h2 id="seo-crawl-title">Explorar o catálogo<\/h2>/.test(index) &&
  /<p>Veja produtos por categoria e consulte cada produto antes de encomendar\.<\/p>/.test(index) &&
  /aria-label="Categorias do catálogo"/.test(index),
  'leftover Explorar o catálogo heading / leftover intro / leftover Categorias do catálogo landmark should stay'
);
assert(
  /<a href="categorias\/frutas\/">Frutas<\/a>/.test(index) &&
  /<a href="categorias\/legumes\/">Legumes<\/a>/.test(index) &&
  /<a href="categorias\/ervas-frescas\/">Ervas frescas<\/a>/.test(index) &&
  /<a href="categorias\/frutas-da-epoca\/">Frutas da época<\/a>/.test(index) &&
  /<a href="categorias\/promocoes\/">Promoções<\/a>/.test(index) &&
  /<a href="categorias\/cabazes\/">Cabazes<\/a>/.test(index),
  'leftover Explorar o catálogo chips should stay leftover Frutas / leftover Legumes / leftover Ervas frescas / leftover Frutas da época / leftover Promoções / leftover Cabazes'
);
assert(
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  !product.includes('seo-crawl-links') &&
  !category.includes('seo-crawl-links') &&
  !credits.includes('seo-crawl-links'),
  'catalog / credits pages should still have leftover no Explorar o catálogo chips'
);
assert(
  /<a class="btn-prim seo-order-link" href="\/\?produto=melancia-1-4#produtos">Ver no catálogo e encomendar<\/a>/.test(product),
  'leftover product-page Ver no catálogo e encomendar should stay leftover copy leftover href'
);
assert(
  category.includes('Ver produto'),
  'leftover category-card Ver produto should stay leftover Ver produto'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Catalog price filter: 44px tap target on phones, copy unchanged\. \*\/\s*\.shop-sidebar \.filter-select \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover filter-select 44px tap in this slice (PR #344)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Catalog category tabs: 44px tap target on phones, copy unchanged\. \*\/\s*\.shop-sidebar \.cat-tab \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover cat-tab 44px tap in this slice (PR #343)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Subcat-chip: 44px tap target on phones, copy unchanged\. \*\/\s*\.subcat-chip \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover subcat-chip 44px tap in this slice (PR #342)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Filter-chip: 44px tap target on phones, copy unchanged\. \*\/\s*\.filter-chip \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover filter-chip 44px tap in this slice (PR #341)'
);
assert(
  !/\.seo-text-link \{[^}]*min-height:44px/.test(css) &&
  !/\.seo-order-link \{[^}]*min-height:4/.test(css) &&
  !/\.seo-nav a \{[^}]*min-height:44px/.test(css) &&
  !/\.seo-breadcrumbs a \{[^}]*min-height:44px/.test(css) &&
  !/\.seo-footer a \{[^}]*min-height:44px/.test(css),
  'should not redo leftover Ver produto / leftover order CTA / leftover wrapping-nav / leftover breadcrumb / leftover footer 44px slices'
);
assert(
  !/\.shop-main \.price-sort \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/\.feature-add \{[^}]*min-width:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.float-cart \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs or leftover all-breakpoint catalog sort / add / hamburger / WhatsApp / float-cart 44px'
);
assert(
  /<button class="search-clear" id="search-clear" onclick="limparPesquisa\(\)" aria-label="Limpar pesquisa">✕<\/button>/.test(index),
  'leftover catalog search-clear should stay leftover ✕ leftover Limpar pesquisa without invented type=button'
);
assert(
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(index) &&
  /<button class="nav-order" onclick="irParaEncomenda\(\)">/.test(index),
  'leftover hamburger Menu / leftover header Encomendar should stay without invented type=button'
);
assert(
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(index),
  'leftover mobile-menu close should stay leftover ✕ without invented type=button'
);
assert(
  /<button class="mb-item" onclick="irParaEncomenda\(\)">/.test(index) &&
  index.includes('id="mb-cart-label">Carrinho</span>'),
  'leftover 4-item bar Carrinho should stay without invented type=button'
);
assert(
  /<button class="float-cart" id="float-cart" onclick="irParaEncomenda\(\)" title="Ver a sua encomenda">/.test(index) &&
  /<button class="float-legumes" id="float-legumes" onclick="abrirCatalogo\('legumes'\)" title="Ver legumes frescos" hidden>/.test(index) &&
  /<button class="scroll-top" id="scroll-top" onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\)" title="Voltar ao topo">▲<\/button>/.test(index),
  'leftover float-cart / leftover float-legumes / leftover scroll-top should stay without invented type=button'
);
assert(
  /<button type="submit" class="btn-wa">📱 Encomendar por WhatsApp<\/button>/.test(index),
  'leftover order WhatsApp should stay leftover type=submit leftover .btn-wa'
);
assert(
  app.includes("window.open(`https://wa.me/351932699850?text=${encodeURIComponent(t)}`, '_blank')"),
  'leftover order WhatsApp should keep leftover wa.me/351932699850'
);
assert(
  /href="https:\/\/wa\.me\/351932699850" target="_blank" rel="noopener">WhatsApp<\/a>/.test(index) &&
  /href="mailto:shahhossain87@gmail.com">email<\/a>/.test(index),
  'privacy-dialog should keep leftover WhatsApp wa.me/351932699850 and leftover shahhossain87@gmail.com mailto'
);
assert(
  /<h4>Morada<\/h4>\s*<p>Av de Portugal, Centro Cívico<br>Loja 24-C, 2790-129 Carnaxide<\/p>/.test(index) &&
  /<h4>Horário<\/h4>\s*<p>Segunda – Domingo<br>8:00 – 20:00<\/p>/.test(index),
  'homepage Encontre-nos Morada / Horário should stay leftover paragraphs, not invented tap-target links'
);
assert(
  !index.includes('aria-expanded') &&
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(index),
  'should not redo leftover hamburger aria-expanded (PR #70) or leftover mobile-close accessible name (PR #179)'
);
assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !index.includes('role="tabpanel"'),
  'must not redo leftover peach rings or catalog tabpanel from open PRs'
);

if (failures.length) {
  console.error('check-seo-crawl-links-tap failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-seo-crawl-links-tap: ok');
