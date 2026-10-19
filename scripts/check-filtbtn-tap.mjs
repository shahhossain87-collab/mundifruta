#!/usr/bin/env node
/**
 * Guards leftover catalog Filtros tap targets on phones.
 * Complementary to leftover filtbtn focus (PR #323), leftover
 * sidebar-close focus (PR #322), leftover sidebar-close tap
 * (PR #321), leftover mobile-close tap (PR #320), leftover
 * float-legumes focus (PR #319), leftover consent Aceitar tudo /
 * Só essenciais tap (PR #318), leftover shop-link tap (PR #314);
 * leftover Filtros already has leftover type="button" and leftover
 * aria-label Abrir filtros e categorias. Does not redo leftover
 * type=button on leftover hamburger / Encomendar / mobile-close /
 * search-clear / 4-item bar Carrinho / cabaz-modal-close /
 * cabaz-modal-add / cabaz-ver / float-cart / float-legumes /
 * scroll-top / cat-quick-btn / shop-link, leftover hamburger 44px
 * (PR #7), leftover sidebar-close 44px (PR #321), leftover
 * wrapping Ervas / Época / Cabazes (PR #218), leftover footer
 * Ervas / Época (PR #230), leftover SEO hamburger, leftover
 * forest wordmark (PR #196), leftover Morada maps (PR #227),
 * leftover consent-btns tap (PR #318), leftover toast /
 * scroll-top mobile bottom (PR #317 / #316), leftover shop-link
 * ring / tap / type (PR #315 / #314 / #313), leftover
 * float-legumes focus (PR #319), leftover sidebar-close 44px,
 * leftover search-clear 44px, leftover filtbtn forest ring
 * (PR #323), or leftover sidebar-close forest ring (PR #322).
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
  /\.filtbtn \{ display:none; align-items:center; gap:8px; border:1px solid var\(--line-2\); background:#fff; border-radius:var\(--r-full\); padding:10px 16px; font:700 \.85rem 'Poppins',sans-serif; cursor:pointer; \}/.test(css),
  'leftover .filtbtn should stay leftover hidden on leftover desktop and hug leftover ⚙️ Filtros'
);

assert(
  /@media \(max-width:900px\) \{[\s\S]*?\.filtbtn \{ display:inline-flex; \}/.test(css),
  'leftover .filtbtn should stay leftover inline-flex on leftover tablet/desktop drawer, without leftover 44px there'
);

assert(
  /@media \(max-width:640px\) \{\s*\/\* Filter-drawer Filtros: 44px tap target on phones, copy unchanged\. \*\/\s*\.filtbtn \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover Filtros min-height:44px'
);

assert(
  /<button class="filtbtn" type="button" onclick="toggleFiltros\(\)" aria-label="Abrir filtros e categorias">⚙️ Filtros<\/button>/.test(index),
  'leftover Filtros should stay leftover ⚙️ Filtros with leftover type=button and leftover aria-label Abrir filtros e categorias'
);

assert(
  /<button class="shop-backdrop" id="shop-backdrop" type="button" onclick="toggleFiltros\(\)" aria-label="Fechar filtros" hidden><\/button>/.test(index) &&
  /<button class="sidebar-close" type="button" onclick="toggleFiltros\(\)" aria-label="Fechar filtros">✕<\/button>/.test(index),
  'leftover shop-backdrop / leftover sidebar-close should stay leftover type=button without leftover 44px from this slice'
);

assert(
  app.includes('function toggleFiltros()') &&
  app.includes("const sb = document.getElementById('shop-sidebar');") &&
  app.includes("document.body.classList.toggle('filtros-open', abrir);"),
  'leftover Filtros should still call leftover toggleFiltros() to toggle leftover .open / leftover filtros-open'
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
  /<button class="search-clear" id="search-clear" onclick="limparPesquisa\(\)" aria-label="Limpar pesquisa">✕<\/button>/.test(index),
  'leftover catalog search-clear should stay leftover ✕ without invented type=button'
);

assert(
  /<button class="mb-item" onclick="irParaEncomenda\(\)">/.test(index) &&
  index.includes('id="mb-cart-label">Carrinho</span>'),
  'leftover 4-item bar Carrinho should stay without invented type=button'
);

assert(
  /<button class="cabaz-modal-close" onclick="fecharCabaz\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /id="cabaz-modal-add"[^>]*>＋<\/button>/.test(index),
  'cabaz-modal close ✕ / add ＋ should stay leftover copy without invented type=button'
);

assert(
  /<button class="product-modal-close" type="button" onclick="fecharProduto\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /id="product-modal-add"[^>]*>＋<\/button>/.test(index),
  'product-modal close ✕ / add ＋ should stay leftover copy'
);

assert(
  /<button class="cs-pop-close" type="button" onclick="fecharCrossSell\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /<button class="cs-pop-skip" type="button" onclick="fecharCrossSell\(\)">Continuar sem adicionar<\/button>/.test(index),
  'cross-sell close ✕ / Continuar sem adicionar should stay leftover copy'
);

assert(
  /<button class="privacy-close" type="button" onclick="fecharPrivacidade\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /<button class="privacy-reset" type="button" onclick="reporConsentimento\(\)">Repor consentimento<\/button>/.test(index),
  'privacy-dialog close / Repor consentimento should stay leftover copy'
);

assert(
  /<button class="consent-link" type="button" onclick="abrirPrivacidade\(\)">Saber mais<\/button>/.test(index) &&
  /<button class="consent-no" type="button" onclick="definirConsentimento\(false\)">Só essenciais<\/button>/.test(index) &&
  /<button class="consent-yes" type="button" onclick="definirConsentimento\(true\)">Aceitar tudo<\/button>/.test(index),
  'consent banner Saber mais / Só essenciais / Aceitar tudo should stay leftover copy'
);

assert(
  /href="https:\/\/wa\.me\/351932699850" target="_blank" rel="noopener">WhatsApp<\/a>/.test(index) &&
  /href="mailto:shahhossain87@gmail.com">email<\/a>/.test(index),
  'privacy-dialog should keep leftover WhatsApp wa.me/351932699850 and leftover shahhossain87@gmail.com mailto'
);

assert(
  /href="tel:932699850">932 699 850<\/a>/.test(index) &&
  /href="mailto:shahhossain87@gmail.com">shahhossain87@gmail.com<\/a>/.test(index),
  'homepage Encontre-nos should keep leftover 932 699 850 tel and leftover shahhossain87@gmail.com mailto'
);

assert(
  /<h4>Morada<\/h4>\s*<p>Av de Portugal, Centro Cívico<br>Loja 24-C, 2790-129 Carnaxide<\/p>/.test(index) &&
  /<h4>Horário<\/h4>\s*<p>Segunda – Domingo<br>8:00 – 20:00<\/p>/.test(index),
  'homepage Encontre-nos Morada / Horário should stay leftover paragraphs, not invented tap-target links'
);

assert(
  /Desenvolvido por <a href="mailto:shahhossain050187@gmail.com">Shah Hossain<\/a>/.test(index),
  'homepage footer credit should keep leftover Desenvolvido por Shah Hossain mailto'
);

assert(
  index.includes('>Produtos<') &&
  index.includes('>Frutas<') &&
  index.includes('>Legumes<') &&
  index.includes('>Quem Somos<') &&
  index.includes('>Encomendar<') &&
  index.includes('>Contacto<') &&
  index.includes('>Privacidade<') &&
  index.includes('>Créditos das fotos<') &&
  index.includes('href="creditos.html"'),
  'homepage footer shop-links should stay leftover Produtos / Frutas / Legumes / Quem Somos / Encomendar / Contacto / Privacidade / Créditos das fotos'
);

assert(
  (() => {
    const menu = index.match(/<div class="mobile-menu"[\s\S]*?<\/div>/)?.[0] || '';
    return /onclick="abrirCatalogo\('frutas'\);toggleMenu\(\)">Frutas<\/a>/.test(menu) &&
      /onclick="abrirCatalogo\('legumes'\);toggleMenu\(\)">Legumes<\/a>/.test(menu) &&
      /onclick="toggleMenu\(\)">Promoções<\/a>/.test(menu) &&
      /onclick="toggleMenu\(\)">Cabazes<\/a>/.test(menu) &&
      !/>Ervas/.test(menu) &&
      !/>Época/.test(menu);
  })(),
  'leftover mobile-menu links should stay leftover Frutas / Legumes / Promoções / Cabazes without leftover Ervas / Época'
);

assert(
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);

assert(
  category.includes('>Ver produto<') &&
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"'),
  'catalog Ver produto / Ver no catálogo e encomendar should stay'
);

assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.sidebar-close \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover filter-drawer close ✕ tap target (PR #321)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.mobile-close \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover mobile-menu close ✕ tap target (PR #320)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cabaz-modal-close \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover cabaz-modal close ✕ tap target (PR #300)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.product-modal-close \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover product-preview modal close ✕ tap target (PR #298)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cs-pop-close \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover cross-sell popup close ✕ tap target (PR #297)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.privacy-close \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover privacy-dialog close ✕ tap target (PR #295)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.privacy-reset \{ min-height:44px/.test(css),
  'should not redo leftover privacy-dialog Repor consentimento tap target (PR #296)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-link \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover consent-banner Saber mais tap target (PR #294)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-no \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-yes \{ min-height:44px/.test(css),
  'should not redo leftover Só essenciais / Aceitar tudo tap targets (PR #318)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cs-pop-skip \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.cabaz-ver \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.shop-link \{ min-height:44px/.test(css),
  'should not redo leftover Continuar sem adicionar / cabaz-ver / shop-link tap targets'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.search-clear \{ min-height:44px/.test(css),
  'should not invent leftover search-clear 44px tap in this slice'
);
assert(
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css),
  'should not redo leftover hamburger 44px tap (PR #7)'
);
assert(
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.product-modal-close:focus-visible/.test(css) &&
  !/\.cs-pop-close:focus-visible/.test(css) &&
  !/\.privacy-close:focus-visible/.test(css),
  'should not redo leftover sidebar-close / filtbtn / mobile-close / hamburger / cabaz-modal-close / product-modal-close / cs-pop-close / privacy-close forest rings'
);
assert(
  !/\.seo-header \.logo \{[^}]*color:\s*var\(--forest\)/.test(css),
  'should not redo leftover forest wordmark on white catalog headers (PR #196)'
);
assert(
  generator.includes('<a href="${homePath}">Início</a>') &&
  generator.includes('<a href="${homePath}categorias/frutas/">Frutas</a>') &&
  generator.includes('<a href="${homePath}categorias/legumes/">Legumes</a>') &&
  generator.includes('<a href="${homePath}categorias/promocoes/">Promoções</a>') &&
  !generator.includes('categorias/ervas-frescas/">Ervas') &&
  !generator.includes('categorias/frutas-da-epoca/">Época') &&
  !generator.includes('categorias/cabazes/">Cabazes'),
  'generator wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  !/<div class="footer-links">[\s\S]*?>Cabazes</.test(index) &&
  !/<div class="footer-links">[\s\S]*?>Ervas</.test(index) &&
  !/<div class="footer-links">[\s\S]*?>Época</.test(index),
  'should not redo leftover footer Cabazes / Promoções / Avaliações / Ervas / Época shop-links'
);
const contactGrid = index.match(/id="contacto"[\s\S]*?<div class="map-wrap/)?.[0] || '';
assert(
  contactGrid.includes('>Morada<') &&
  !/href="https:\/\/(www\.)?google\.com\/maps/.test(contactGrid) &&
  !/href="https:\/\/maps\.app\.goo\.gl/.test(contactGrid),
  'should not invent leftover Morada maps tap-target (PR #227)'
);

if (failures.length) {
  console.error('check-filtbtn-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-filtbtn-tap: ok');
