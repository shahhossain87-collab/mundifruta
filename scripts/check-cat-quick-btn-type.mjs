#!/usr/bin/env node
/**
 * Guards leftover cat-quick-btn type="button".
 * Complementary to leftover scroll-top type (PR #311), leftover float-legumes
 * type (PR #310), leftover float-cart type (memories 2026-10-19), leftover
 * 4-item bar Carrinho type (PR #309), leftover search-clear type (PR #308),
 * leftover mobile-close type (PR #307), leftover header Encomendar type
 * (PR #306), leftover hamburger type (PR #305), leftover cabaz-modal-add type
 * (PR #304), leftover cabaz-modal-close type (PR #303), leftover cabaz-ver
 * type (PR #302); leftover cat-quick-btn type=button slice after leftover
 * nearby shop-backdrop / sidebar-close / filtbtn already had leftover
 * type="button". Does not redo leftover scroll-top type (PR #311), leftover
 * float-legumes type (PR #310), leftover float-cart type, leftover 4-item bar
 * Carrinho type (PR #309), leftover search-clear type (PR #308), leftover
 * mobile-close type (PR #307), leftover hamburger type (PR #305), leftover
 * Encomendar type (PR #306), leftover cabaz-modal-add type (PR #304), leftover
 * cabaz-modal-close type (PR #303), leftover cabaz-ver type (PR #302), leftover
 * shop-link type, leftover cat-quick-btn 44px tap, leftover hamburger
 * aria-expanded (PR #70), leftover wrapping-nav expansion (PR #218), leftover
 * forest wordmark (PR #196), leftover SEO hamburger, or leftover Morada maps
 * (PR #227). Homepage leftover .cat-quick-btn:focus-visible already exists;
 * do not invent a second leftover focus ring.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const product = readFileSync(join(root, 'produtos', 'melancia-1-4', 'index.html'), 'utf8');
const category = readFileSync(join(root, 'categorias', 'frutas', 'index.html'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  index.includes('css/estilos.css?v=66') &&
  index.includes('js/app.js?v=40') &&
  index.includes('js/extras.js?v=21') &&
  index.includes('js/dados.js?v=26'),
  'homepage cache should stay estilos.css?v=66 / app.js?v=40 / extras.js?v=21 / dados.js?v=26'
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
  /<button type="button" class="cat-quick-btn" onclick="abrirCatalogo\('frutas'\)">/.test(index) &&
  /<button type="button" class="cat-quick-btn" onclick="abrirCatalogo\('legumes'\)">/.test(index) &&
  /<button type="button" class="cat-quick-btn" onclick="abrirCabazes\(\)">/.test(index) &&
  /<button type="button" class="cat-quick-btn" onclick="abrirCatalogo\('promocoes'\)">/.test(index) &&
  /<button type="button" class="cat-quick-btn" onclick="abrirCatalogo\('ervas'\)">/.test(index) &&
  /<button type="button" class="cat-quick-btn" onclick="abrirCatalogo\('epoca'\)">/.test(index) &&
  /<button type="button" class="cat-quick-btn cq-order" onclick="document\.getElementById\('encomenda'\)\.scrollIntoView\(\{behavior:'smooth'\}\)">/.test(index),
  'leftover cat-quick-btn should stay leftover Frutas / leftover Legumes / leftover Cabazes / leftover Promoções / leftover Ervas frescas / leftover Fruta da Época / leftover Carrinho and get leftover type=button before leftover class'
);

assert(
  index.includes('data-count-label="frutas">Frutas</span>') &&
  index.includes('data-count-label="legumes">Legumes</span>') &&
  index.includes('data-count-label="cabazes">Cabazes</span>') &&
  index.includes('data-count-label="promocoes">Promoções</span>') &&
  index.includes('data-count-label="ervas">Ervas frescas</span>') &&
  index.includes('data-count-label="epoca">Fruta da Época</span>') &&
  index.includes('Carrinho <b id="quick-cart-count">0</b>') &&
  index.includes('alt="Seleção de frutas frescas"') &&
  index.includes('alt="Seleção apenas de legumes frescos"') &&
  index.includes('alt="Cabazes de frutas e legumes"') &&
  index.includes('alt="Promoções e destaques da semana"') &&
  index.includes('alt="Ervas frescas e aromáticas"') &&
  index.includes('alt="Fruta fresca da época"') &&
  index.includes('alt="Carrinho de compras vazio para rever a encomenda"'),
  'leftover cat-quick-btn labels / leftover alts should stay leftover Frutas / leftover Legumes / leftover Cabazes / leftover Promoções / leftover Ervas frescas / leftover Fruta da Época / leftover Carrinho'
);

assert(
  !/<button class="cat-quick-btn"[^>]*>/.test(index) &&
  (index.match(/<button type="button" class="cat-quick-btn/g) || []).length === 7,
  'all leftover homepage cat-quick-btn should use leftover type=button before leftover class'
);

assert(
  app.includes("function abrirCatalogo(cat) {") &&
  app.includes("function abrirCabazes() {") &&
  app.includes("document.getElementById('produtos').scrollIntoView({ behavior:'smooth', block:'start' });") &&
  app.includes("const el = document.getElementById('cabazes');") &&
  app.includes("if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });"),
  'leftover cat-quick-btn should keep leftover abrirCatalogo / leftover abrirCabazes in leftover app.js and leftover onclick in leftover index.html'
);

assert(
  /<button class="shop-link" onclick="document\.getElementById\('produtos'\)\.scrollIntoView\(\{behavior:'smooth'\}\)">Ver catálogo completo →<\/button>/.test(index) &&
  /<button class="shop-link" onclick="abrirCatalogo\('frutas'\)">Ver todas as frutas →<\/button>/.test(index) &&
  /<button class="shop-link" onclick="abrirCatalogo\('frutas'\)">Explorar fruta →<\/button>/.test(index) &&
  /<button class="shop-link" onclick="abrirCatalogo\('legumes'\)">Ver todos os legumes →<\/button>/.test(index) &&
  !/<button type="button" class="shop-link"/.test(index) &&
  !/<button class="shop-link"[^>]*type="button"/.test(index),
  'should not invent leftover type=button on leftover shop-link'
);

assert(
  /<button class="scroll-top" id="scroll-top" onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\)" title="Voltar ao topo">▲<\/button>/.test(index) &&
  !/<button class="scroll-top"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="scroll-top"/.test(index),
  'should not redo leftover scroll-top type=button (PR #311)'
);

assert(
  /<button class="float-legumes" id="float-legumes" onclick="abrirCatalogo\('legumes'\)" title="Ver legumes frescos" hidden>/.test(index) &&
  !/<button class="float-legumes"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="float-legumes"/.test(index),
  'should not redo leftover float-legumes type=button (PR #310)'
);

assert(
  /<button class="float-cart" id="float-cart" onclick="irParaEncomenda\(\)" title="Ver a sua encomenda">/.test(index) &&
  !/<button class="float-cart"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="float-cart"/.test(index),
  'should not invent leftover type=button on leftover float-cart'
);

assert(
  /<button class="mb-item" onclick="irParaEncomenda\(\)">/.test(index) &&
  !/<button type="button" class="mb-item"/.test(index) &&
  !/<button class="mb-item"[^>]*type="button"/.test(index),
  'should not redo leftover 4-item bar Carrinho type=button (PR #309)'
);

assert(
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(index) &&
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(index) &&
  /<button class="nav-order" onclick="irParaEncomenda\(\)">/.test(index) &&
  /<button class="search-clear" id="search-clear" onclick="limparPesquisa\(\)" aria-label="Limpar pesquisa">✕<\/button>/.test(index),
  'leftover mobile-close / leftover hamburger / leftover Encomendar / leftover search-clear should stay leftover without invented type=button'
);

assert(
  !/<button class="mobile-close"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="mobile-close"/.test(index) &&
  !/<button class="hamburger"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="hamburger"/.test(index) &&
  !/<button class="nav-order"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="nav-order"/.test(index) &&
  !/<button class="search-clear"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="search-clear"/.test(index),
  'should not invent leftover type=button on leftover mobile-close / leftover hamburger / leftover Encomendar / leftover search-clear'
);

assert(
  /<button class="cabaz-modal-close" onclick="fecharCabaz\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /<button class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋<\/button>/.test(index),
  'leftover cabaz-modal close ✕ / leftover cabaz-modal add ＋ should stay leftover without leftover type=button (PR #303 / #304)'
);

assert(
  !/<button class="cabaz-modal-close"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="cabaz-modal-close"/.test(index) &&
  !/<button type="button" class="btn-wa cabaz-modal-add"/.test(index) &&
  !/<button class="btn-wa cabaz-modal-add"[^>]*type="button"/.test(index),
  'should not redo leftover cabaz-modal-close type=button (PR #303) or leftover cabaz-modal-add type=button (PR #304)'
);

assert(
  app.includes('`<button class="cabaz-ver" onclick="event.stopPropagation(); abrirCabaz(\'${id}\')">👁 Ver o que leva</button>`'),
  'leftover cabaz-ver should stay leftover 👁 Ver o que leva without leftover type=button (PR #302)'
);

assert(
  !app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  !app.includes('aria-label="Ver o que leva no ${item.nome}`'),
  'should not redo leftover cabaz-ver aria-label (PR #64)'
);

assert(
  app.includes('<button class="photo-wrap" type="button" onclick="abrirCabaz(\'${id}\')" aria-label="Ver detalhes de ${item.nome}">') &&
  app.includes('<button class="add-btn" type="button" onclick="adicionarProduto(\'${id}\', produtos_map[\'${id}\'])">＋</button>') &&
  app.includes('aria-label="Diminuir quantidade de ${item.nome}"') &&
  app.includes('aria-label="Aumentar quantidade de ${item.nome}"') &&
  app.includes("addBtn.setAttribute('aria-label', `Adicionar ${item.nome} ao carrinho`)"),
  'leftover cabaz photo-wrap / add ＋ / qty names / modal add name should stay leftover'
);

assert(
  !index.includes('aria-expanded') &&
  !app.includes('aria-expanded'),
  'should not redo leftover hamburger aria-expanded (PR #70)'
);

assert(
  /\.hamburger \{ display:none; flex-direction:column; gap:5px; cursor:pointer; padding:6px; background:none; border:none; \}/.test(css) &&
  /\.hamburger span \{ display:block; width:24px; height:2px; background:#fff; border-radius:2px; transition:all 0\.3s; \}/.test(css),
  'leftover hamburger should keep leftover 6px padding / leftover 24×2 bars'
);

assert(
  /\.mobile-close \{\s*position:absolute; top:24px; right:28px;\s*background:none; border:none; color:#fff; font-size:2rem; cursor:pointer;\s*\}/.test(css),
  'leftover mobile-close should keep leftover absolute ✕ / leftover 2rem / leftover top 24px right 28px'
);

assert(
  /\.search-clear \{\s*position:absolute; right:14px; top:50%; transform:translateY\(-50%\);\s*background:none; border:none; cursor:pointer; color:var\(--text-md\); font-size:0\.96rem; display:none;\s*\}/.test(css) &&
  /\.search-clear\.visible \{ display:block; \}/.test(css),
  'leftover search-clear should keep leftover absolute ✕ / leftover 0.96rem / leftover display:none until leftover visible'
);

assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:focus-visible,\s*body\.homepage \.homepage-category \.cat-quick-btn:hover \{/.test(css) &&
  /body\.homepage \.homepage-category \.cat-quick-btn \{\s*min-height:176px;/.test(css) &&
  /body\.homepage \.homepage-category \.cat-quick-btn:nth-child\(n\+5\) \{\s*min-height:112px;/.test(css),
  'leftover homepage cat-quick-btn should keep leftover 176px / leftover 112px / leftover existing :focus-visible hover ring'
);

assert(
  index.includes('<a href="#produtos"       onclick="abrirCatalogo(\'frutas\');toggleMenu()">Frutas</a>') &&
  index.includes('<a href="#produtos"       onclick="abrirCatalogo(\'legumes\');toggleMenu()">Legumes</a>') &&
  index.includes('<a href="#promocoes"      onclick="toggleMenu()">Promoções</a>') &&
  index.includes('<a href="#cabazes"        onclick="toggleMenu()">Cabazes</a>') &&
  index.includes('<a href="#como-funciona"  onclick="toggleMenu()">Como Funciona</a>') &&
  index.includes('<a href="#produtos"       onclick="toggleMenu()">Produtos</a>') &&
  index.includes('<a href="#quem-somos"     onclick="toggleMenu()">Quem Somos</a>') &&
  index.includes('<a href="#avaliacoes"     onclick="toggleMenu()">Avaliações</a>') &&
  index.includes('<a href="#encomenda"      onclick="toggleMenu()">Encomendar</a>') &&
  index.includes('<a href="#contacto"       onclick="toggleMenu()">Contacto</a>'),
  'leftover mobile-menu links should stay leftover Frutas / Legumes / Promoções / Cabazes / Como Funciona / Produtos / Quem Somos / Avaliações / Encomendar / Contacto'
);

assert(
  /<button class="product-modal-close" type="button" onclick="fecharProduto\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /<button class="product-modal-add" id="product-modal-add" type="button" onclick="adicionarDoModal\(\)">＋<\/button>/.test(index) &&
  /aria-label="Diminuir quantidade">−<\/button>/.test(index) &&
  /aria-label="Aumentar quantidade">\+<\/button>/.test(index),
  'product-modal close ✕ / leftover add ＋ type=button / qty Diminuir / Aumentar should stay leftover copy'
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
  /<button type="submit" class="btn-wa">📱 Encomendar por WhatsApp<\/button>/.test(index),
  'leftover order WhatsApp should stay leftover type=submit leftover .btn-wa, not leftover type=button'
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
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);

assert(
  !category.includes('class="hamburger"') &&
  !product.includes('class="hamburger"') &&
  !credits.includes('class="hamburger"') &&
  !generator.includes('class="hamburger"') &&
  !category.includes('id="mobile-menu"') &&
  !product.includes('id="mobile-menu"') &&
  !category.includes('class="mobile-close"') &&
  !product.includes('class="mobile-close"') &&
  !credits.includes('class="mobile-close"') &&
  !category.includes('class="cat-quick-btn"') &&
  !product.includes('class="cat-quick-btn"') &&
  !credits.includes('class="cat-quick-btn"') &&
  !generator.includes('class="cat-quick-btn"') &&
  !category.includes('id="float-legumes"') &&
  !product.includes('id="float-legumes"') &&
  !credits.includes('id="float-legumes"') &&
  !category.includes('id="scroll-top"') &&
  !product.includes('id="scroll-top"') &&
  !credits.includes('id="scroll-top"') &&
  !generator.includes('id="scroll-top"'),
  'should not invent leftover hamburger / leftover mobile-menu / leftover mobile-close / leftover cat-quick-btn / leftover float-legumes / leftover scroll-top on leftover catalog / leftover credits'
);

assert(
  category.includes('>Ver produto<') &&
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"'),
  'catalog Ver produto / Ver no catálogo e encomendar should stay'
);

assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cat-quick-btn \{ min-height:44px/.test(css) &&
  !/\.cat-quick-btn \{[^}]*min-(width|height):44px/.test(css),
  'should not invent leftover cat-quick-btn 44px tap'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.scroll-top \{ min-height:44px/.test(css) &&
  !/\.scroll-top \{[^}]*min-(width|height):44px/.test(css),
  'should not invent leftover scroll-top 44px tap (leftover width/height 44px already stay)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.float-legumes \{ min-height:44px/.test(css) &&
  !/\.float-legumes \{[^}]*min-(width|height):44px/.test(css),
  'should not invent leftover float-legumes 44px tap'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cabaz-ver \{ min-height:44px/.test(css),
  'should not redo leftover cabaz-ver 44px tap target (PR #301)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cabaz-modal-close \{ min-height:44px/.test(css),
  'should not redo leftover cabaz-modal close ✕ tap target (PR #300)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cs-pop-skip \{ min-height:44px/.test(css),
  'should not redo leftover Continuar sem adicionar tap target (PR #299)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.product-modal-close \{ min-height:44px/.test(css),
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
  !/@media \(max-width:640px\) \{[\s\S]*\.privacy-box a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover privacy-dialog WhatsApp / email tap target (PR #293)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.contact-card a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover homepage Encontre-nos tel / mailto tap target (PR #292)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.footer-links a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover homepage footer-links tap target (PR #291)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.footer-credit a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover homepage footer-credit tap target (PR #290)'
);
assert(
  !/\.float-legumes:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.scroll-top:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.cabaz-modal-add:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'should not invent leftover .float-legumes:focus-visible / leftover .float-cart:focus-visible / leftover .scroll-top:focus-visible / leftover .mb-item:focus-visible / leftover .search-clear:focus-visible / leftover .mobile-close:focus-visible / leftover .hamburger:focus-visible / leftover .nav-order:focus-visible / leftover .cabaz-modal-add:focus-visible / leftover .cabaz-modal-close:focus-visible / leftover .cabaz-ver:focus-visible / leftover .shop-link:focus-visible / leftover .btn-wa:focus-visible'
);
assert(
  !index.includes('role="tabpanel"') &&
  !css.includes('#mobile-menu a { color:#fff'),
  'should not redo leftover catalog tabpanel or leftover mobile-menu contrast'
);
assert(
  /<a href="\$\{homePath\}">Início<\/a>\s*<a href="\$\{homePath\}categorias\/frutas\/">Frutas<\/a>\s*<a href="\$\{homePath\}categorias\/legumes\/">Legumes<\/a>\s*<a href="\$\{homePath\}categorias\/promocoes\/">Promoções<\/a>/.test(generator),
  'should not redo leftover wrapping-nav Ervas / Época / Cabazes (PR #218)'
);

if (failures.length) {
  console.error('check-cat-quick-btn-type failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-cat-quick-btn-type: ok');
