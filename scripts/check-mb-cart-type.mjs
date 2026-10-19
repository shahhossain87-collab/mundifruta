#!/usr/bin/env node
/**
 * Guards leftover 4-item bar Carrinho type="button".
 * Complementary to leftover search-clear type (PR #308), leftover
 * mobile-close type (PR #307), leftover header Encomendar type
 * (PR #306), leftover hamburger type (PR #305), leftover
 * cabaz-modal-add type (PR #304), leftover cabaz-modal-close type
 * (PR #303), leftover cabaz-ver type (PR #302); leftover 4-item bar
 * Carrinho type=button slice after leftover nearby shop-backdrop /
 * sidebar-close / filtbtn already had leftover type="button". Does not
 * redo leftover search-clear type (PR #308), leftover mobile-close
 * type (PR #307), leftover hamburger type (PR #305), leftover
 * Encomendar type (PR #306), leftover cabaz-modal-add type (PR #304),
 * leftover cabaz-modal-close type (PR #303), leftover cabaz-ver type
 * (PR #302), leftover float-cart type, leftover Carrinho 44px tap,
 * leftover .mb-item:focus-visible (PR leftover forest ring), leftover
 * hamburger aria-expanded (PR #70), leftover wrapping-nav expansion
 * (PR #218), leftover forest wordmark (PR #196), leftover SEO
 * hamburger, or leftover Morada maps (PR #227).
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
  /<button type="button" class="mb-item" onclick="irParaEncomenda\(\)">/.test(index) &&
  index.includes('class="mb-item"') &&
  index.includes('onclick="irParaEncomenda()"') &&
  index.includes('id="mb-cart-label">Carrinho</span>') &&
  index.includes('id="mb-cart-count">0</span>') &&
  index.includes('<span class="mb-icon">🛒</span>'),
  'leftover 4-item bar Carrinho should stay leftover 🛒 / leftover Carrinho / leftover badge 0 and get leftover type=button before leftover class'
);

assert(
  app.includes('function irParaEncomenda()') &&
  app.includes("const enc = document.getElementById('encomenda');") &&
  app.includes("if (enc) enc.scrollIntoView({ behavior:'smooth', block:'start' });"),
  'leftover Carrinho should keep leftover irParaEncomenda scroll to leftover #encomenda'
);

assert(
  /<a class="mb-item" href="#promocoes">/.test(index) &&
  /<a class="mb-item" href="https:\/\/wa\.me\/351932699850" target="_blank" rel="noopener">/.test(index) &&
  /<span class="mb-label">Promoções<\/span>/.test(index) &&
  /<span class="mb-label">WhatsApp<\/span>/.test(index) &&
  /<span class="mb-label">Como Chegar<\/span>/.test(index),
  'leftover 4-item bar Promoções / WhatsApp / Como Chegar should stay leftover anchors'
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
  /<button class="float-cart" id="float-cart" onclick="irParaEncomenda\(\)" title="Ver a sua encomenda">/.test(index) &&
  !/<button class="float-cart"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="float-cart"/.test(index),
  'should not invent leftover type=button on leftover float-cart'
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
  /\.mobile-bar \{ display:none; \}/.test(css) &&
  /\.mb-item \{\s*position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px;\s*padding:9px 4px 10px; background:none; border:none; cursor:pointer; text-decoration:none;\s*color:rgba\(255,255,255,0\.9\); font-family:'Poppins',sans-serif; font-weight:600; font-size:0\.72rem;\s*\}/.test(css) &&
  /\.mobile-bar \{ grid-template-columns:repeat\(4,1fr\); \}/.test(css),
  'leftover 4-item bar Carrinho should keep leftover padded column / leftover 0.72rem / leftover desktop none / leftover 4-column grid'
);

assert(
  !/\.mb-item \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.mb-item \{ min-height:44px/.test(css) &&
  !/@media \(max-width:768px\) \{[\s\S]*\.mb-item \{ min-height:44px/.test(css),
  'should not invent leftover 4-item bar Carrinho 44px tap'
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
  !category.includes('class="mb-item"') &&
  !product.includes('class="mb-item"') &&
  !credits.includes('class="mb-item"') &&
  !category.includes('id="mobile-bar"') &&
  !product.includes('id="mobile-bar"') &&
  !credits.includes('id="mobile-bar"'),
  'should not invent leftover hamburger / leftover mobile-menu / leftover mobile-close / leftover 4-item bar on leftover catalog / leftover credits'
);

assert(
  category.includes('>Ver produto<') &&
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"'),
  'catalog Ver produto / Ver no catálogo e encomendar should stay'
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
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.mobile-close:focus-visible/.test(css) &&
  !/\.hamburger:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.cabaz-modal-add:focus-visible/.test(css) &&
  !/\.cabaz-modal-close:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css),
  'should not invent leftover .mb-item:focus-visible / leftover .search-clear:focus-visible / leftover .mobile-close:focus-visible / leftover .hamburger:focus-visible / leftover .nav-order:focus-visible / leftover .cabaz-modal-add:focus-visible / leftover .cabaz-modal-close:focus-visible / leftover .cabaz-ver:focus-visible / leftover .float-cart:focus-visible / leftover .btn-wa:focus-visible'
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
  console.error('check-mb-cart-type failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-mb-cart-type: ok');
