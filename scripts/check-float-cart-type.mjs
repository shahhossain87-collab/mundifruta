#!/usr/bin/env node
/**
 * Guards leftover float-cart type="button".
 * Complementary to leftover float-legumes type (PR #310), leftover
 * 4-item bar Carrinho type (PR #309), leftover search-clear type
 * (PR #308), leftover mobile-close type (PR #307), leftover header
 * Encomendar type (PR #306), leftover hamburger type (PR #305),
 * leftover cabaz-modal-add type (PR #304), leftover cabaz-modal-close
 * type (PR #303), leftover cabaz-ver type (PR #302); leftover
 * float-cart type=button slice after leftover nearby shop-backdrop /
 * sidebar-close / filtbtn already had leftover type="button". PR #310
 * listed leftover float-cart type as a later slice and then skipped
 * it. Does not redo leftover float-legumes type (PR #310), leftover
 * Carrinho type (PR #309), leftover search-clear type (PR #308),
 * leftover mobile-close type (PR #307), leftover hamburger type
 * (PR #305), leftover Encomendar type (PR #306), leftover
 * cabaz-modal-add type (PR #304), leftover cabaz-modal-close type
 * (PR #303), leftover cabaz-ver type (PR #302), leftover
 * .float-cart:focus-visible (PR #205), leftover float-cart 44px tap
 * (PR #53), leftover hamburger aria-expanded (PR #70), leftover
 * wrapping-nav expansion (PR #218), leftover forest wordmark
 * (PR #196), leftover SEO hamburger, leftover scroll-top type
 * (PR #311), leftover cat-quick-btn type (PR #312), leftover
 * shop-link type (PR #313), or leftover Morada maps.
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
  /<button type="button" class="float-cart" id="float-cart" onclick="irParaEncomenda\(\)" title="Ver a sua encomenda">/.test(index) &&
  index.includes('id="float-cart"') &&
  index.includes('class="float-cart"') &&
  index.includes('onclick="irParaEncomenda()"') &&
  index.includes('title="Ver a sua encomenda"') &&
  index.includes('class="fc-icon">🛒</span>') &&
  /id="float-cart-text">0 · 0,00/.test(index),
  'leftover float-cart should stay leftover 🛒 / leftover Ver a sua encomenda / leftover 0 · 0,00 € and get leftover type=button before leftover class'
);

assert(
  app.includes('function irParaEncomenda()') &&
  app.includes("const enc = document.getElementById('encomenda');") &&
  app.includes("if (enc) enc.scrollIntoView({ behavior:'smooth', block:'start' });") &&
  app.includes("const fc = document.getElementById('float-cart');") &&
  app.includes("fc.classList.add('visible')") &&
  app.includes("fc.classList.remove('visible')"),
  'leftover float-cart should keep leftover irParaEncomenda scroll to leftover #encomenda and leftover .visible when leftover cart has leftover items'
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
  /<button class="mb-item" onclick="irParaEncomenda\(\)">/.test(index) &&
  !/<button class="mb-item"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="mb-item"/.test(index),
  'should not invent leftover type=button on leftover 4-item bar Carrinho (PR #309)'
);

assert(
  /<button class="float-legumes" id="float-legumes" onclick="abrirCatalogo\('legumes'\)" title="Ver legumes frescos" hidden>/.test(index) &&
  !/<button class="float-legumes"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="float-legumes"/.test(index),
  'should not invent leftover type=button on leftover float-legumes (PR #310)'
);

assert(
  /<button class="scroll-top" id="scroll-top" onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\)" title="Voltar ao topo">▲<\/button>/.test(index) &&
  !/<button class="scroll-top"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="scroll-top"/.test(index),
  'should not invent leftover type=button on leftover scroll-top (PR #311)'
);

assert(
  /<button class="cat-quick-btn" onclick="abrirCatalogo\('frutas'\)">/.test(index) &&
  /<button class="shop-link" onclick="document\.getElementById\('produtos'\)\.scrollIntoView\(\{behavior:'smooth'\}\)">Ver catálogo completo →<\/button>/.test(index) &&
  !/<button type="button" class="cat-quick-btn"/.test(index) &&
  !/<button class="cat-quick-btn"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="shop-link"/.test(index) &&
  !/<button class="shop-link"[^>]*type="button"/.test(index),
  'should not invent leftover type=button on leftover cat-quick-btn (PR #312) or leftover shop-link (PR #313)'
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
  /\.float-cart \{\s*position:fixed; top:calc\(var\(--announcement-height\) \+ 16px\); right:12px; z-index:1150;\s*display:flex; align-items:center; gap:8px; padding:10px 14px; border:2px solid #fff; cursor:pointer;\s*background:var\(--cherry\); color:#fff; border-radius:var\(--r-full\);\s*box-shadow:0 8px 20px rgba\(196,30,58,0\.35\), 0 2px 6px rgba\(0,0,0,0\.22\);\s*font-family:'Poppins',sans-serif; font-weight:800; font-size:0\.88rem; letter-spacing:0\.25px;\s*opacity:0; transform:translateY\(-14px\) scale\(0\.9\); pointer-events:none;\s*transition:opacity 0\.25s ease, transform 0\.25s ease, filter 0\.2s;\s*\}/.test(css) &&
  /\.float-cart\.visible \{ opacity:1; transform:translateY\(0\) scale\(1\); pointer-events:auto; \}/.test(css),
  'leftover float-cart should keep leftover cherry chip / leftover opacity 0 / leftover pointer-events none until leftover .visible'
);

assert(
  !/\.float-cart \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.float-cart \{ min-height:44px/.test(css) &&
  !/@media \(max-width:768px\) \{[\s\S]*\.float-cart \{ min-height:44px/.test(css) &&
  !/\.float-cart:focus-visible/.test(css),
  'should not invent leftover float-cart 44px tap or leftover .float-cart:focus-visible (PR #205 / #53)'
);

assert(
  !css.includes('.float-legumes') &&
  index.includes('id="float-legumes"') &&
  index.includes('hidden>'),
  'leftover float-legumes should stay leftover hidden with leftover no CSS'
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
  !category.includes('id="float-cart"') &&
  !product.includes('id="float-cart"') &&
  !credits.includes('id="float-cart"') &&
  !category.includes('class="float-cart"') &&
  !product.includes('class="float-cart"') &&
  !credits.includes('class="float-cart"'),
  'should not invent leftover hamburger / leftover mobile-menu / leftover mobile-close / leftover float-cart on leftover catalog / leftover credits'
);

assert(
  category.includes('>Ver produto<') &&
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"'),
  'catalog Ver produto / Ver no catálogo e encomendar should stay'
);

assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.filtbtn \{ min-height:44px/.test(css),
  'should not redo leftover catalog Filtros 44px tap target (PR #324)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.sidebar-close \{ min-height:44px/.test(css),
  'should not redo leftover filter-drawer close ✕ tap target (PR #321)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.mobile-close \{ min-height:44px/.test(css),
  'should not redo leftover mobile-menu close ✕ tap target (PR #320)'
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
  !/\.filtbtn:focus-visible/.test(css) &&
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.cabaz-modal-add:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/\.float-legumes:focus-visible/.test(css) &&
  !/\.scroll-top:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'should not invent leftover .filtbtn:focus-visible / leftover .sidebar-close:focus-visible / leftover .mb-item:focus-visible / leftover .search-clear:focus-visible / leftover .mobile-close:focus-visible / leftover .hamburger:focus-visible / leftover .nav-order:focus-visible / leftover .cabaz-modal-add:focus-visible / leftover .cabaz-modal-close:focus-visible / leftover .cabaz-ver:focus-visible / leftover .float-legumes:focus-visible / leftover .scroll-top:focus-visible / leftover .shop-link:focus-visible / leftover .btn-wa:focus-visible'
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
  console.error('check-float-cart-type failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-float-cart-type: ok');
