#!/usr/bin/env node
/**
 * Guards leftover checkout qty − / + tap targets on phones.
 * Complementary to leftover product-modal qty tap (PR #328), leftover
 * catalog qty tap (PR #327), leftover catalog Adicionar tap (PR #326),
 * leftover catalog Filtros tap (PR #324), leftover catalog Filtros
 * focus (PR #323), leftover sidebar-close focus (PR #322), leftover
 * sidebar-close tap (PR #321), leftover mobile-close tap (PR #320),
 * leftover product-modal-close tap (PR #298); leftover checkout qty
 * − / + already has leftover type="button". Does not redo leftover
 * type=button on leftover hamburger / Encomendar / mobile-close /
 * search-clear / 4-item bar Carrinho / cabaz-modal-close /
 * cabaz-modal-add / cabaz-ver / float-cart / float-legumes /
 * scroll-top / cat-quick-btn / shop-link, leftover hamburger 44px
 * (PR #7), leftover Filtros 44px (PR #324), leftover catalog
 * Adicionar 44px (PR #326), leftover catalog qty 44px (PR #327),
 * leftover product-modal qty 44px (PR #328), leftover wrapping Ervas
 * / Época / Cabazes (PR #218), leftover footer Ervas / Época
 * (PR #230), leftover SEO hamburger, leftover forest wordmark
 * (PR #196), leftover Morada maps (PR #227), leftover consent-btns
 * tap (PR #318), leftover toast / scroll-top mobile bottom
 * (PR #317 / #316), leftover shop-link ring / tap / type
 * (PR #315 / #314 / #313), leftover float-cart type (PR #325),
 * leftover float-legumes type (PR #310), leftover cabaz / featured
 * add 44px (PR #45), leftover shop-main .add-btn 44px combined tap,
 * leftover search-clear 44px, leftover feature-add 44px, leftover
 * product-modal-add 44px, leftover order-remove 44px (PR #50 combined
 * all-breakpoint checkout taps), leftover oi-stepper-focus (PR #166),
 * leftover filtbtn forest ring (PR #323), or leftover sidebar-close
 * forest ring (PR #322).
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
  /\.oi-stepper button \{\s*width:28px; height:28px; border-radius:var\(--r-full\);/.test(css),
  'leftover checkout qty − / + should stay leftover 28px on leftover desktop'
);
assert(
  /@media \(max-width:600px\)\{\s*\.order-item \{ flex-direction:column; align-items:stretch; gap:8px; \}/.test(css),
  'leftover 600px order-item stack should stay so leftover 641–700px qty stays leftover 28px'
);
assert(
  /@media \(max-width:640px\) \{\s*\/\* Checkout qty − \/ \+: 44px tap target on phones, copy unchanged\. \*\/\s*\.oi-stepper button \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover checkout qty − / + min-height/min-width:44px'
);

assert(
  app.includes('<button type="button" onclick="alterarQtdCarrinho(\'${i._id}\',-1)" aria-label="Menos">−</button>') &&
  app.includes('<button type="button" onclick="alterarQtdCarrinho(\'${i._id}\',1)" aria-label="Mais">+</button>'),
  'leftover checkout qty − / + should stay leftover − / + with leftover type=button and leftover Menos / Mais'
);
assert(
  app.includes('<button class="order-remove" type="button" onclick="removerProduto(\'${i._id}\')" aria-label="Remover ${i.nome}">×</button>'),
  'leftover checkout × Remover should stay leftover × with leftover type=button'
);
assert(
  /\.order-remove \{\s*width:26px; height:26px;/.test(css) &&
  !/@media \(max-width:640px\) \{\s*\/\* Checkout qty − \/ \+: 44px tap target on phones, copy unchanged\. \*\/\s*\.oi-stepper button \{ min-height:44px; min-width:44px; box-sizing:border-box; \}\s*\.order-remove \{/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.order-remove \{ min-height:44px/.test(css),
  'should not invent leftover checkout × Remover 44px tap in this slice'
);
assert(
  app.includes('<button class="qty-btn" type="button" onclick="alterarQtd(\'${id}\',-1,event)" aria-label="Diminuir">−</button>') &&
  app.includes('<button class="qty-btn" type="button" onclick="alterarQtd(\'${id}\',1,event)" aria-label="Aumentar">+</button>'),
  'leftover catalog qty − / + should stay leftover − / + with leftover type=button'
);
assert(
  /\.qty-btn \{\s*width:32px; height:32px; border-radius:50%;/.test(css) &&
  !/@media \(max-width:640px\) \{\s*\/\* Catalog qty − \/ \+: 44px tap target on phones, copy unchanged\. \*\/\s*\.qty-btn \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog qty − / + tap target (PR #327)'
);
assert(
  /<button type="button" onclick="alterarQtdModal\(-1\)" aria-label="Diminuir quantidade">−<\/button>/.test(index) &&
  /<button type="button" onclick="alterarQtdModal\(1\)" aria-label="Aumentar quantidade">\+<\/button>/.test(index),
  'leftover product-modal qty − / + should stay leftover − / + with leftover type=button'
);
assert(
  /\.product-modal-qty button \{\s*width:36px; height:36px;/.test(css) &&
  !/@media \(max-width:640px\) \{\s*\/\* Product-modal qty − \/ \+: 44px tap target on phones, copy unchanged\. \*\/\s*\.product-modal-qty button \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover product-modal qty − / + tap target (PR #328)'
);
assert(
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"'),
  'leftover cabaz qty − / + should keep leftover named labels'
);
assert(
  app.includes("? `<button class=\"add-btn\" type=\"button\" onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋ Adicionar</button>`"),
  'leftover catalog Adicionar should stay leftover ＋ Adicionar with leftover type=button'
);
assert(
  app.includes('onclick="adicionarProduto(\'${item._id}\', produtos_map[\'${item._id}\'])">＋</button>'),
  'featured add keeps a visible plus (PR #31)'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(index) &&
  /id="cabaz-modal-add"[^>]*>＋<\/button>/.test(index),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26)'
);
assert(
  /\.product-modal-add \{[\s\S]*?min-height:50px;/.test(css),
  'leftover product-modal add should stay leftover min-height:50px, not a leftover 44px phone slice'
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
  /<button class="float-cart" id="float-cart" onclick="irParaEncomenda\(\)" title="Ver a sua encomenda">/.test(index) &&
  /<button class="float-legumes" id="float-legumes" onclick="abrirCatalogo\('legumes'\)" title="Ver legumes frescos" hidden>/.test(index) &&
  /<button class="scroll-top" id="scroll-top" onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\)" title="Voltar ao topo">▲<\/button>/.test(index),
  'leftover float-cart / leftover float-legumes / leftover scroll-top should stay without invented type=button'
);
assert(
  /<button class="cabaz-modal-close" onclick="fecharCabaz\(\)" aria-label="Fechar">✕<\/button>/.test(index),
  'cabaz-modal close should stay leftover copy without invented type=button'
);
assert(
  /<button class="product-modal-close" type="button" onclick="fecharProduto\(\)" aria-label="Fechar">✕<\/button>/.test(index),
  'leftover product-preview close ✕ should stay leftover Fechar'
);
assert(
  /<button class="cs-pop-skip" type="button" onclick="fecharCrossSell\(\)">Continuar sem adicionar<\/button>/.test(index),
  'cross-sell Continuar sem adicionar should stay leftover copy'
);
assert(
  /<button class="consent-link" type="button" onclick="abrirPrivacidade\(\)">Saber mais<\/button>/.test(index) &&
  /<button class="consent-no" type="button" onclick="definirConsentimento\(false\)">Só essenciais<\/button>/.test(index) &&
  /<button class="consent-yes" type="button" onclick="definirConsentimento\(true\)">Aceitar tudo<\/button>/.test(index),
  'consent banner Saber mais / Só essenciais / Aceitar tudo should stay leftover copy'
);
assert(
  /<button type="submit" class="btn-wa">📱 Encomendar por WhatsApp<\/button>/.test(index),
  'leftover order WhatsApp should stay leftover type=submit leftover .btn-wa'
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
  /Desenvolvido por <a href="mailto:shahhossain050187@gmail.com">Shah Hossain<\/a>/.test(index) ||
  /Desenvolvido por Shah Hossain<\/a>/.test(index),
  'homepage footer credit should keep leftover Shah Hossain mailto'
);

const menu = index.match(/<div class="mobile-menu" id="mobile-menu">[\s\S]*?<\/div>/)?.[0] || '';
assert(
  /onclick="abrirCatalogo\('frutas'\);toggleMenu\(\)">Frutas<\/a>/.test(menu) &&
  /onclick="abrirCatalogo\('legumes'\);toggleMenu\(\)">Legumes<\/a>/.test(menu) &&
  /onclick="toggleMenu\(\)">Promoções<\/a>/.test(menu) &&
  /onclick="toggleMenu\(\)">Cabazes<\/a>/.test(menu) &&
  !/>Ervas/.test(menu) &&
  !/>Época/.test(menu),
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
  !category.includes('oi-stepper') &&
  !product.includes('oi-stepper'),
  'generated catalog pages should stay without leftover checkout qty'
);

assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.qty-btn \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog qty tap target (PR #327)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.product-modal-qty button \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover product-modal qty tap target (PR #328)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.add-btn,\s*body\.homepage #produtos \.add-btn \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog Adicionar tap target (PR #326)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.filtbtn \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog Filtros tap target (PR #324)'
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
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css),
  'should not redo leftover combined shop-main .add-btn 44px tap'
);
assert(
  !/\.feature-add \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.feature-add \{ min-height:44px/.test(css),
  'should not invent leftover feature-add 44px tap (PR #45)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.product-modal-add \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.cabaz-modal-add \{ min-height:44px/.test(css),
  'should not invent leftover product-modal-add / leftover cabaz-modal-add 44px tap'
);
assert(
  !/\.oi-stepper button \{[^}]*flex:0 0 44px/.test(css) &&
  !/\.order-remove \{[^}]*flex:0 0 44px/.test(css),
  'should not redo leftover all-breakpoint checkout 44px taps (PR #50)'
);
assert(
  !/\.oi-stepper button:focus-visible/.test(css) &&
  !/\.order-remove:focus-visible/.test(css) &&
  !/\.product-modal-qty button:focus-visible/.test(css) &&
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.product-modal-close:focus-visible/.test(css),
  'should not redo leftover checkout qty / checkout remove / product-modal qty / Filtros / sidebar-close / mobile-close / hamburger / float-cart / cabaz-modal-close / product-modal-close forest rings'
);
assert(
  !/\.seo-header \.logo \{[^}]*color:\s*var\(--forest\)/.test(css),
  'should not redo leftover forest wordmark on white catalog headers (PR #196)'
);
const navBlock = generator.match(/<nav class="seo-nav"[\s\S]*?<\/nav>/)?.[0] || '';
assert(
  navBlock.includes('>Início<') &&
  navBlock.includes('>Frutas<') &&
  navBlock.includes('>Legumes<') &&
  navBlock.includes('>Promoções<') &&
  !navBlock.includes('ervas-frescas') &&
  !navBlock.includes('frutas-da-epoca') &&
  !navBlock.includes('cabazes'),
  'generator wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);

const contactGrid = index.match(/id="contacto"[\s\S]*?<div class="map-wrap/)?.[0] || '';
assert(
  contactGrid.includes('>Morada<') &&
  !/href="https:\/\/(www\.)?google\.com\/maps/.test(contactGrid) &&
  !/href="https:\/\/maps\.app\.goo\.gl/.test(contactGrid),
  'should not invent leftover Morada maps tap-target (PR #227)'
);

if (failures.length) {
  console.error('check-oi-stepper-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-oi-stepper-tap: ok');
