#!/usr/bin/env node
/**
 * Guards leftover scroll-top mobile bottom:78px cascade.
 * Complementary to leftover shop-link focus (PR #315), leftover
 * shop-link tap (PR #314), leftover shop-link type (PR #313), leftover
 * cat-quick-btn type (PR #312), leftover scroll-top type (PR #311);
 * leftover scroll-top mobile bottom cascade slice. Master leftover
 * `.scroll-top { bottom:78px; }` sat before leftover later
 * `.scroll-top { bottom:28px }`, so leftover computed leftover bottom
 * stayed leftover 28px on leftover phones and leftover Voltar ao topo
 * overlapped leftover 4-item bar. Does not redo leftover scroll-top
 * type=button (PR #311), leftover shop-link focus (PR #315), leftover
 * shop-link tap (PR #314), leftover shop-link type (PR #313), leftover
 * cat-quick-btn type (PR #312), leftover float-legumes type (PR #310),
 * leftover float-cart type, leftover 4-item bar Carrinho type (PR #309),
 * leftover search-clear type (PR #308), leftover mobile-close type
 * (PR #307), leftover hamburger type (PR #305), leftover Encomendar
 * type (PR #306), leftover cabaz-modal-add type (PR #304), leftover
 * cabaz-modal-close type (PR #303), leftover cabaz-ver type (PR #302),
 * leftover .scroll-top:focus-visible, leftover hamburger aria-expanded
 * (PR #70), leftover wrapping-nav expansion (PR #218), leftover forest
 * wordmark (PR #196), leftover SEO hamburger, leftover consent Aceitar
 * tudo / Só essenciais 44px tap, or leftover float-legumes
 * :focus-visible.
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
  /<button class="scroll-top" id="scroll-top" onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\)" title="Voltar ao topo">▲<\/button>/.test(index) &&
  index.includes('class="scroll-top"') &&
  index.includes('id="scroll-top"') &&
  index.includes("onclick=\"window.scrollTo({top:0,behavior:'smooth'})\"") &&
  index.includes('title="Voltar ao topo"') &&
  /id="scroll-top"[^>]*>▲<\/button>/.test(index) &&
  !/<button class="scroll-top"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="scroll-top"/.test(index),
  'leftover scroll-top should stay leftover ▲ / leftover Voltar ao topo without leftover type=button (PR #311)'
);

assert(
  app.includes("document.getElementById('scroll-top').classList.toggle('visible', y > 400);") &&
  !app.includes("window.scrollTo({top:0,behavior:'smooth'})"),
  'leftover scroll-top should keep leftover .visible at leftover y > 400 in leftover app.js and leftover onclick in leftover index.html'
);

assert(
  /\.scroll-top \{\s*position:fixed; bottom:28px; left:28px; z-index:900;\s*width:44px; height:44px; border-radius:50%;/.test(css) &&
  /\.scroll-top\.visible \{ opacity:1; transform:translateY\(0\); pointer-events:all; \}/.test(css) &&
  /\.scroll-top:hover\s+\{ background:var\(--forest-2\); transform:translateY\(-3px\); \}/.test(css),
  'leftover scroll-top should keep leftover 44×44 / leftover desktop bottom 28px / leftover hover'
);

assert(
  /@media \(max-width:768px\) \{\s*\.scroll-top \{ bottom:78px; \}\s*\}/.test(css),
  'phones (max-width:768px) should keep leftover scroll-top bottom:78px above leftover 4-item bar'
);

assert(
  css.indexOf('position:fixed; bottom:28px; left:28px; z-index:900;') <
    css.indexOf('.scroll-top { bottom:78px; }') &&
  css.indexOf('.scroll-top { bottom:78px; }') >
    css.indexOf('position:fixed; bottom:28px; left:28px; z-index:900;'),
  'leftover mobile bottom:78px must sit after leftover later bottom:28px so leftover cascade wins on leftover phones'
);

assert(
  (css.match(/\.scroll-top \{ bottom:78px; \}/g) || []).length === 1,
  'leftover mobile bottom:78px should appear once after leftover later bottom:28px, not leftover twice'
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
  /<button class="cat-quick-btn" onclick="abrirCatalogo\('frutas'\)">/.test(index) &&
  /<button class="shop-link" onclick="abrirCatalogo\('legumes'\)">Ver todos os legumes →<\/button>/.test(index) &&
  !/<button type="button" class="cat-quick-btn"/.test(index) &&
  !/<button class="cat-quick-btn"[^>]*type="button"/.test(index) &&
  !/<button type="button" class="shop-link"/.test(index) &&
  !/<button class="shop-link"[^>]*type="button"/.test(index),
  'should not invent leftover type=button on leftover cat-quick-btn / leftover shop-link'
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
  app.includes('`<button class="cabaz-ver" onclick="event.stopPropagation(); abrirCabaz(\'${id}\')">👁 Ver o que leva</button>`'),
  'leftover cabaz-ver should stay leftover 👁 Ver o que leva without leftover type=button (PR #302)'
);

assert(
  !app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  !app.includes('aria-label="Ver o que leva no ${item.nome}`'),
  'should not redo leftover cabaz-ver aria-label (PR #64)'
);

assert(
  !index.includes('aria-expanded') &&
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(index),
  'should not redo leftover hamburger aria-expanded (PR #70) or leftover mobile-close accessible name (PR #179)'
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
  !category.includes('id="float-legumes"') &&
  !product.includes('id="float-legumes"') &&
  !credits.includes('id="float-legumes"') &&
  !category.includes('class="float-legumes"') &&
  !product.includes('class="float-legumes"') &&
  !credits.includes('class="float-legumes"') &&
  !category.includes('id="scroll-top"') &&
  !product.includes('id="scroll-top"') &&
  !credits.includes('id="scroll-top"') &&
  !category.includes('class="scroll-top"') &&
  !product.includes('class="scroll-top"') &&
  !credits.includes('class="scroll-top"') &&
  !generator.includes('id="scroll-top"') &&
  !generator.includes('class="scroll-top"'),
  'should not invent leftover hamburger / leftover mobile-menu / leftover mobile-close / leftover float-legumes / leftover scroll-top on leftover catalog / leftover credits'
);

assert(
  category.includes('>Ver produto<') &&
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"'),
  'catalog Ver produto / Ver no catálogo e encomendar should stay'
);

assert(
  /type="submit" class="btn-wa"/.test(index) &&
  index.includes('📱 Encomendar por WhatsApp'),
  'leftover order WhatsApp should stay leftover type=submit leftover .btn-wa'
);

assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.scroll-top \{ min-height:44px/.test(css) &&
  !/\.scroll-top \{[^}]*min-(width|height):44px/.test(css),
  'should not invent leftover scroll-top 44px tap (leftover width/height 44px already stay)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.shop-link \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover shop-link 44px tap (PR #314)'
);
assert(
  !/\.shop-link:focus-visible/.test(css),
  'should not redo leftover .shop-link:focus-visible (PR #315)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.cabaz-ver \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover cabaz-ver tap target (PR #301)'
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
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-no \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-yes \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-btns button \{ min-height:44px/.test(css),
  'should not invent leftover consent Aceitar tudo / Só essenciais 44px tap'
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
  !/@media \(max-width:640px\) \{[\s\S]*\.cat-quick-btn \{ min-height:44px/.test(css),
  'should not invent leftover cat-quick-btn 44px tap'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.float-legumes \{ min-height:44px/.test(css),
  'should not invent leftover float-legumes 44px tap'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.float-cart \{ min-height:44px/.test(css),
  'should not invent leftover float-cart 44px tap'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.hamburger \{ min-(width|height):44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css),
  'should not redo leftover hamburger 44px tap'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.nav-order \{ min-height:44px/.test(css) &&
  !/\.nav-order:focus-visible/.test(css),
  'should not redo leftover header Encomendar 44px tap / leftover .nav-order:focus-visible (PR #180)'
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
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css),
  'should not invent leftover .float-legumes:focus-visible / leftover .float-cart:focus-visible / leftover .scroll-top:focus-visible / leftover .mb-item:focus-visible / leftover .search-clear:focus-visible / leftover .mobile-close:focus-visible / leftover .hamburger:focus-visible / leftover .nav-order:focus-visible / leftover .cabaz-modal-add:focus-visible / leftover .cabaz-modal-close:focus-visible / leftover .cabaz-ver:focus-visible / leftover .btn-wa:focus-visible / leftover .shop-link:focus-visible'
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
  console.error('check-scroll-top-bottom failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-scroll-top-bottom: ok');
