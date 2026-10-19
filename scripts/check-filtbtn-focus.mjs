#!/usr/bin/env node
/**
 * Guards leftover catalog Filtros / Abrir filtros e categorias
 * keyboard rings.
 * Complementary to leftover sidebar-close focus (PR #322), leftover
 * sidebar-close tap (PR #321), leftover mobile-close tap (PR #320),
 * leftover float-legumes focus (PR #319), leftover consent-btns tap
 * (PR #318), leftover shop-link focus (PR #315); leftover filtbtn
 * :focus-visible slice. Does not redo leftover sidebar-close
 * :focus-visible (PR #322), leftover sidebar-close 44px tap (PR #321),
 * leftover Filtros 44px tap, leftover wrapping-nav expansion (PR #218),
 * leftover forest wordmark (PR #196), leftover SEO hamburger,
 * leftover hamburger aria-expanded (PR #70), leftover
 * mobile-close accessible name (PR #179), leftover cabaz-ver
 * aria-label (PR #64).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const extras = readFileSync(join(root, 'js', 'extras.js'), 'utf8');
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
  /<button class="filtbtn" type="button" onclick="toggleFiltros\(\)" aria-label="Abrir filtros e categorias">⚙️ Filtros<\/button>/.test(index) &&
  (index.match(/class="filtbtn"/g) || []).length === 1,
  'leftover Filtros stays leftover ⚙️ Filtros / leftover Abrir filtros e categorias / leftover type=button'
);
assert(
  /<button class="sidebar-close" type="button" onclick="toggleFiltros\(\)" aria-label="Fechar filtros">✕<\/button>/.test(index),
  'leftover sidebar-close stays leftover ✕ / leftover Fechar filtros / leftover type=button'
);
assert(
  /<button class="shop-backdrop" id="shop-backdrop" type="button" onclick="toggleFiltros\(\)" aria-label="Fechar filtros" hidden><\/button>/.test(index),
  'leftover shop-backdrop stays leftover Fechar filtros leftover hidden'
);

assert(
  /\.filter-tag:focus-visible, \.photo-wrap:focus-visible, \.filtbtn:focus-visible \{/.test(css) &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover Filtros should join the leftover catalog forest :focus-visible ring'
);
assert(
  !/\.filtbtn:focus \{/.test(css),
  'leftover Filtros should use leftover :focus-visible, not leftover always-on :focus'
);
assert(
  !/\.sidebar-close:focus-visible/.test(css),
  'should not invent leftover sidebar-close :focus-visible in this run (PR #322)'
);
assert(
  /\.filtbtn \{ display:none; align-items:center; gap:8px; border:1px solid var\(--line-2\); background:#fff; border-radius:var\(--r-full\); padding:10px 16px; font:700 \.85rem 'Poppins',sans-serif; cursor:pointer; \}/.test(css) &&
  /\.filtbtn \{ display:inline-flex; \}/.test(css),
  'leftover Filtros should stay leftover hidden on leftover desktop and leftover inline-flex on leftover drawer viewports'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.filtbtn \{[\s\S]*min-height:44px/.test(css) &&
  !/\.filtbtn \{[^}]*min-(height|width):44px/.test(css),
  'should not invent leftover Filtros 44px tap'
);

assert(
  app.includes('function toggleFiltros() {') &&
  app.includes("const sb = document.getElementById('shop-sidebar');") &&
  app.includes("sb.classList.toggle('open', abrir);") &&
  app.includes("document.body.classList.toggle('filtros-open', abrir);"),
  'leftover Filtros still calls leftover toggleFiltros()'
);
assert(
  extras.includes('window.abrirPrivacidade') &&
  extras.includes("document.getElementById('privacy-modal').hidden = false"),
  'leftover footer Privacidade still opens leftover privacy via leftover abrirPrivacidade'
);

assert(
  /<button class="float-cart" id="float-cart" onclick="irParaEncomenda\(\)" title="Ver a sua encomenda">/.test(index) &&
  /<button class="float-legumes" id="float-legumes" onclick="abrirCatalogo\('legumes'\)" title="Ver legumes frescos" hidden>/.test(index) &&
  /<button class="scroll-top" id="scroll-top" onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\)" title="Voltar ao topo">▲<\/button>/.test(index) &&
  /<button class="mb-item" onclick="irParaEncomenda\(\)">/.test(index) &&
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(index) &&
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(index) &&
  /<button class="nav-order" onclick="irParaEncomenda\(\)">/.test(index) &&
  /<button class="search-clear" id="search-clear" onclick="limparPesquisa\(\)" aria-label="Limpar pesquisa">✕<\/button>/.test(index) &&
  /<button class="cabaz-modal-close" onclick="fecharCabaz\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /<button class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋<\/button>/.test(index),
  'leftover chrome buttons should stay leftover without invented type=button'
);

assert(
  /<button class="shop-link" onclick="document\.getElementById\('produtos'\)\.scrollIntoView\(\{behavior:'smooth'\}\)">Ver catálogo completo →<\/button>/.test(index) &&
  /<button class="shop-link" onclick="abrirCatalogo\('legumes'\)">Ver todos os legumes →<\/button>/.test(index) &&
  (index.match(/<button class="shop-link"/g) || []).length === 4,
  'leftover shop-link copy stays leftover without leftover type=button'
);
assert(
  /<button class="cat-quick-btn" onclick="abrirCatalogo\('legumes'\)">/.test(index) &&
  !/<button type="button" class="cat-quick-btn"/.test(index),
  'should not redo leftover cat-quick-btn type=button (PR #312)'
);

assert(
  app.includes('`<button class="cabaz-ver" onclick="event.stopPropagation(); abrirCabaz(\'${id}\')">👁 Ver o que leva</button>`') &&
  !app.includes('aria-label="Ver o que leva no ${item.nome}"') &&
  !index.includes('aria-expanded') &&
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(index),
  'should not redo leftover cabaz-ver aria-label (PR #64), leftover hamburger aria-expanded (PR #70), or leftover mobile-close accessible name (PR #179)'
);

assert(
  /<button class="cs-pop-close" type="button" onclick="fecharCrossSell\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /<button class="cs-pop-skip" type="button" onclick="fecharCrossSell\(\)">Continuar sem adicionar<\/button>/.test(index) &&
  /<button class="privacy-close" type="button" onclick="fecharPrivacidade\(\)" aria-label="Fechar">✕<\/button>/.test(index) &&
  /<button class="privacy-reset" type="button" onclick="reporConsentimento\(\)">Repor consentimento<\/button>/.test(index) &&
  /<button class="consent-link" type="button" onclick="abrirPrivacidade\(\)">Saber mais<\/button>/.test(index) &&
  /<button class="consent-no" type="button" onclick="definirConsentimento\(false\)">Só essenciais<\/button>/.test(index) &&
  /<button class="consent-yes" type="button" onclick="definirConsentimento\(true\)">Aceitar tudo<\/button>/.test(index),
  'leftover consent / leftover privacy / leftover Combina bem copy should stay'
);

assert(
  /href="https:\/\/wa\.me\/351932699850" target="_blank" rel="noopener">WhatsApp<\/a>/.test(index) &&
  /href="mailto:shahhossain87@gmail.com">email<\/a>/.test(index) &&
  /href="tel:932699850">932 699 850<\/a>/.test(index) &&
  /href="mailto:shahhossain87@gmail.com">shahhossain87@gmail.com<\/a>/.test(index) &&
  /<h4>Morada<\/h4>\s*<p>Av de Portugal, Centro Cívico<br>Loja 24-C, 2790-129 Carnaxide<\/p>/.test(index) &&
  /<h4>Horário<\/h4>\s*<p>Segunda – Domingo<br>8:00 – 20:00<\/p>/.test(index) &&
  /Desenvolvido por <a href="mailto:shahhossain050187@gmail.com">Shah Hossain<\/a>/.test(index),
  'leftover WhatsApp / leftover email / leftover Morada / leftover Horário / leftover Shah Hossain should stay'
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
  /body\.homepage \.homepage-category \.cat-quick-btn:focus-visible/.test(css),
  'leftover homepage category tiles keep leftover #194 focus-visible'
);
assert(
  css.includes('.qty-btn:focus-visible') &&
  css.includes('.add-btn:focus-visible') &&
  css.includes('.photo-wrap:focus-visible'),
  'leftover catalog qty / Adicionar / photo forest rings stay'
);
assert(
  !css.includes('outline:3px solid var(--peach)'),
  'must not redo leftover peach overlay rings'
);

assert(
  !/\.sidebar-close:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.float-legumes:focus-visible/.test(css) &&
  !/\.scroll-top:focus-visible/.test(css) &&
  !/\.shop-link:focus-visible/.test(css) &&
  !/\.shop-backdrop:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.feature-photo:focus-visible/.test(css) &&
  !/\.nav-order:focus-visible/.test(css) &&
  !/\.mb-item:focus-visible/.test(css) &&
  !/\.cabaz-ver:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.consent-no:focus-visible/.test(css) &&
  !/\.consent-yes:focus-visible/.test(css) &&
  !index.includes('role="tabpanel"'),
  'must not redo leftover peach rings, leftover catalog tabpanel, or leftover-ring drafts besides leftover Filtros'
);

assert(
  css.includes('.scroll-top { bottom:78px; }') &&
  /\.scroll-top \{\s*position:fixed; bottom:28px; left:28px;/.test(css) &&
  css.indexOf('.scroll-top { bottom:78px; }') < css.indexOf('position:fixed; bottom:28px; left:28px;'),
  'should not invent leftover scroll-top mobile bottom:78px cascade fix'
);
assert(
  !/@media \(max-width:768px\) \{[\s\S]{0,180}\.toast \{ bottom:78px; \}/.test(css),
  'should not invent leftover toast mobile bottom:78px cascade (PR #317)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-no \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.consent-yes \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.shop-link \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.cabaz-ver \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.mobile-close \{ min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.sidebar-close \{ min-height:44px/.test(css),
  'should not redo leftover consent / leftover shop-link / leftover cabaz-ver / leftover mobile-close / leftover sidebar-close tap targets'
);

if (failures.length) {
  console.error('check-filtbtn-focus failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-filtbtn-focus: ok');
