#!/usr/bin/env node
/**
 * Guards leftover catalog pagination tap targets on phones.
 * Complementary to leftover no-results Limpar filtros tap (PR #337),
 * leftover catalog sort tap (PR #336), leftover catalog search-clear
 * tap (PR #335), leftover checkout Continuar a comprar tap (PR #334),
 * leftover checkout email tap (PR #333), leftover checkout Hora de
 * levantamento tap (PR #332), leftover checkout × Remover tap / focus
 * (PR #330 / #331), leftover checkout qty tap (PR #329), leftover
 * product-modal qty tap (PR #328), leftover catalog qty tap (PR #327),
 * leftover catalog Adicionar tap (PR #326), leftover catalog Filtros
 * tap (PR #324), leftover catalog-sort keyboard ring (PR #61); leftover
 * catalog pagination already has leftover type="button" leftover
 * onclick="mudarPagina()" leftover aria-label="Página anterior" /
 * leftover "Página seguinte". Does not redo leftover type=button on
 * leftover hamburger / Encomendar / mobile-close / search-clear /
 * 4-item bar Carrinho / cabaz-modal-close / cabaz-modal-add /
 * cabaz-ver / float-cart / float-legumes / scroll-top / cat-quick-btn /
 * shop-link, leftover hamburger 44px (PR #7), leftover Filtros 44px
 * (PR #324), leftover catalog Adicionar 44px (PR #326), leftover
 * catalog qty 44px (PR #327), leftover product-modal qty 44px
 * (PR #328), leftover checkout qty 44px (PR #329), leftover checkout
 * × Remover 44px (PR #330), leftover checkout Hora de levantamento
 * 44px (PR #332), leftover checkout email 44px (PR #333), leftover
 * checkout Continuar a comprar 44px (PR #334), leftover catalog
 * search-clear 44px (PR #335), leftover catalog sort 44px (PR #336),
 * leftover no-results Limpar filtros 44px (PR #337), leftover wrapping
 * Ervas / Época / Cabazes (PR #218), leftover footer Ervas / Época
 * (PR #230), leftover SEO hamburger, leftover forest wordmark
 * (PR #196), leftover Morada maps (PR #235), leftover consent-btns
 * tap (PR #318), leftover toast / scroll-top mobile bottom (PR #317 /
 * #316), leftover shop-link ring / tap / type (PR #315 / #314 / #313),
 * leftover float-cart type (PR #325), leftover cabaz / featured add
 * 44px (PR #45), leftover shop-main .add-btn 44px combined tap,
 * leftover search-clear type=button (PR #308), leftover search-clear
 * :focus-visible (PR #171), leftover feature-add 44px, leftover
 * product-modal-add 44px, leftover all-breakpoint checkout 44px
 * (PR #50), leftover .order-optional-toggle:focus-visible (PR #206),
 * leftover .oi-stepper button:focus-visible (PR #166), leftover
 * .order-remove:focus-visible (PR #331), leftover
 * .btn-continuar:focus-visible (PR #178), leftover .btn-em:focus-visible
 * (PR #177), leftover filtbtn forest ring (PR #323), leftover
 * sidebar-close forest ring (PR #322), leftover combined search-clear
 * 44px at all breakpoints (PR #16 / #43), leftover catalog search
 * field 44px (PR #57), leftover all-breakpoint .no-results .link-btn
 * 44px (PR #43), leftover all-breakpoint .shop-main .price-sort 44px
 * (PR #43 / #49), leftover all-breakpoint catalog pagination 44px
 * (PR #43), leftover iOS catalog zoom 16px sort (PR #41), leftover
 * filter-tag Limpar tudo 44px, leftover filter-chip / subcat-chip
 * 44px, or leftover SEO hamburger.
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
  /\.catalog-pagination button \{\s*min-height:42px;/.test(css),
  'leftover catalog pagination should hug leftover 42px on leftover desktop (leftover no 44px)'
);
assert(
  /@media \(max-width:700px\) \{[\s\S]*?\.catalog-pagination button \{\s*min-height:36px;/.test(css),
  'leftover 641–700px catalog pagination should stay leftover 36px, leftover no 44px'
);
assert(
  /@media \(max-width:640px\) \{\s*\/\* Catalog pagination: 44px tap target on phones, copy unchanged\. \*\/\s*\.catalog-pagination button \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover catalog pagination min-height:44px'
);
assert(
  !/\.catalog-pagination button \{[^}]*min-height:44px/.test(css.split('@media (max-width:640px)')[0] || ''),
  'must not invent leftover all-breakpoint catalog pagination 44px (PR #43 combined)'
);
assert(
  /\.catalog-pagination button:focus-visible/.test(css) &&
  css.includes('outline:3px solid var(--forest)'),
  'leftover catalog :focus-visible forest ring must stay so leftover pagination can use it'
);
assert(
  index.includes('id="pagination-catalog"') &&
  /<div class="catalog-pagination" id="pagination-catalog"><\/div>/.test(index),
  'leftover catalog pagination host should stay leftover #pagination-catalog'
);
assert(
  app.includes('function renderPaginacao(paginas)') &&
  app.includes('aria-label="Página anterior">← Anterior</button>') &&
  app.includes('aria-label="Página seguinte">Seguinte →</button>') &&
  app.includes('onclick="mudarPagina(-1)"') &&
  app.includes('onclick="mudarPagina(1)"') &&
  app.includes('function mudarPagina(delta)'),
  'leftover ← Anterior / leftover Seguinte → should stay leftover named leftover type=button leftover mudarPagina()'
);
assert(
  app.includes('const POR_PAGINA = 24;'),
  'leftover catalog page size should stay leftover 24'
);
assert(
  /<button type="button" class="link-btn" onclick="limparTudo\(\)">Limpar filtros<\/button>/.test(index),
  'leftover Limpar filtros should stay leftover Limpar filtros with leftover type=button leftover limparTudo()'
);
assert(
  app.includes('onclick="limparTudo()">Limpar tudo</button>') ||
  app.includes("onclick=\"limparTudo()\">Limpar tudo</button>"),
  'leftover filter-tag Limpar tudo should stay leftover Limpar tudo, not this leftover pagination slice'
);
assert(
  /<button type="button" class="btn-continuar" onclick="continuarAComprar\(\)">← Continuar a comprar<\/button>/.test(index),
  'leftover Continuar a comprar should stay leftover ← Continuar a comprar with leftover type=button'
);
assert(
  /<button type="button" class="btn-em" onclick="enviarEmail\(\)">ou encomende por email<\/button>/.test(index),
  'leftover checkout email should stay leftover ou encomende por email with leftover type=button'
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
  !/@media \(max-width:640px\) \{\s*\/\* No-results Limpar filtros: 44px tap target on phones, copy unchanged\. \*\/\s*\.no-results \.link-btn \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover no-results Limpar filtros 44px tap in this slice (PR #337)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Catalog sort: 44px tap target on phones, copy unchanged\. \*\/\s*\.shop-main \.price-sort \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog sort 44px tap in this slice (PR #336)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Catalog search-clear: 44px tap target on phones, copy unchanged\. \*\/\s*\.shop-main \.search-clear \{/.test(css),
  'should not redo leftover catalog search-clear 44px tap in this slice (PR #335)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Checkout Continuar a comprar: 44px tap target on phones, copy unchanged\. \*\/\s*\.btn-continuar \{ min-height:44px; box-sizing:border-box; \}/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.btn-continuar \{ min-height:44px/.test(css),
  'should not redo leftover checkout Continuar a comprar 44px tap in this slice (PR #334)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Checkout ou encomende por email: 44px tap target on phones, copy unchanged\. \*\/\s*\.btn-em \{ min-height:44px; box-sizing:border-box; \}/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.btn-em \{ min-height:44px/.test(css),
  'should not redo leftover checkout email 44px tap in this slice (PR #333)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Checkout Hora de levantamento: 44px tap target on phones, copy unchanged\. \*\/\s*\.order-optional-toggle \{ min-height:44px; box-sizing:border-box; \}/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.order-optional-toggle \{ min-height:44px/.test(css),
  'should not redo leftover checkout Hora de levantamento 44px tap in this slice (PR #332)'
);
assert(
  !/@media \(max-width:640px\) \{\s*\/\* Checkout × Remover: 44px tap target on phones, copy unchanged\. \*\/\s*\.order-remove \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.order-remove \{ min-height:44px/.test(css),
  'should not redo leftover checkout × Remover 44px tap in this slice (PR #330)'
);
assert(
  /\.oi-stepper button \{\s*width:28px; height:28px; border-radius:var\(--r-full\);/.test(css) &&
  !/@media \(max-width:640px\) \{\s*\/\* Checkout qty − \/ \+: 44px tap target on phones, copy unchanged\. \*\/\s*\.oi-stepper button \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.oi-stepper button \{ min-height:44px/.test(css),
  'should not redo leftover checkout qty − / + 44px tap in this slice (PR #329)'
);
assert(
  /\.qty-btn \{\s*width:32px; height:32px; border-radius:50%;/.test(css) &&
  !/@media \(max-width:640px\) \{\s*\/\* Catalog qty − \/ \+: 44px tap target on phones, copy unchanged\. \*\/\s*\.qty-btn \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog qty − / + tap target (PR #327)'
);
assert(
  /\.product-modal-qty button \{\s*width:36px; height:36px;/.test(css) &&
  !/@media \(max-width:640px\) \{\s*\/\* Product-modal qty − \/ \+: 44px tap target on phones, copy unchanged\. \*\/\s*\.product-modal-qty button \{ min-height:44px; min-width:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover product-modal qty − / + tap target (PR #328)'
);
assert(
  !/\.search-clear:focus-visible/.test(css) &&
  !/\.shop-main \.search-clear:focus-visible/.test(css) &&
  !/\.search-clear:focus \{/.test(css),
  'should not invent leftover .search-clear:focus-visible (PR #171)'
);
assert(
  !/\.btn-continuar:focus-visible/.test(css) &&
  !/\.btn-em:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css),
  'should not invent leftover checkout keyboard rings in this slice'
);
assert(
  !/\.shop-main \.search-input \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.price-sort \{[^}]*min-height:44px/.test(css) &&
  !/\.shop-main \.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/\.feature-add \{[^}]*min-width:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.filter-tag \{[^}]*min-height:44px/.test(css) &&
  !/\.filter-chip \{[^}]*min-height:44px/.test(css) &&
  !/\.subcat-chip \{[^}]*min-height:44px/.test(css) &&
  !/\.no-results \.link-btn \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs or leftover all-breakpoint catalog sort 44px'
);
assert(
  /<button class="search-clear" id="search-clear" onclick="limparPesquisa\(\)" aria-label="Limpar pesquisa">✕<\/button>/.test(index),
  'leftover catalog search-clear should stay leftover ✕ leftover Limpar pesquisa without invented type=button'
);
assert(
  /<select class="price-sort" id="price-sort" onchange="ordenarPreco\(\)" aria-label="Ordenar produtos">/.test(index),
  'leftover catalog sort should stay leftover Ordenar produtos without invented type=button'
);
assert(
  app.includes("? `<button class=\"add-btn\" type=\"button\" onclick=\"adicionarProduto('${id}', produtos_map['${id}'])\">＋ Adicionar</button>`"),
  'leftover catalog Adicionar should stay leftover ＋ Adicionar with leftover type=button'
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
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  !product.includes('id="pagination-catalog"') &&
  !category.includes('id="pagination-catalog"') &&
  !credits.includes('id="pagination-catalog"') &&
  !product.includes('class="catalog-pagination"') &&
  !category.includes('class="catalog-pagination"'),
  'catalog / credits pages should still have leftover no catalog pagination'
);
assert(
  index.includes('<span class="eyebrow">Poupe esta semana</span><h2 class="section-title">Promoções da Semana</h2>') &&
  index.includes('<span class="eyebrow">Os favoritos dos clientes</span><h2 class="section-title">Frutas Populares</h2>') &&
  index.includes('<span class="eyebrow">No melhor momento</span><h2 class="section-title">Fruta da Época</h2>') &&
  index.includes('<span class="eyebrow">Escolhidos diariamente</span><h2 class="section-title">Legumes Frescos</h2>'),
  'leftover shop-feature headings should stay leftover Promoções da Semana / leftover Frutas Populares / leftover Fruta da Época / leftover Legumes Frescos'
);
assert(
  !index.includes('aria-expanded') &&
  /<button class="mobile-close" onclick="toggleMenu\(\)">✕<\/button>/.test(index),
  'should not redo leftover hamburger aria-expanded (PR #70) or leftover mobile-close accessible name (PR #179)'
);
assert(
  !app.includes('aria-label="Ver o que leva no ${item.nome}"'),
  'should not redo leftover cabaz-ver aria-label (PR #64)'
);
assert(
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.feature-add:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !index.includes('role="tabpanel"'),
  'must not redo leftover peach rings or catalog tabpanel from open PRs'
);

if (failures.length) {
  console.error('check-catalog-pagination-tap failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-catalog-pagination-tap: ok');
