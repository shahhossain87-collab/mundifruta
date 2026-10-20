#!/usr/bin/env node
/**
 * Guards leftover checkout Continuar a comprar tap targets on phones.
 * Complementary to leftover checkout email tap (PR #333), leftover
 * checkout Hora de levantamento tap (PR #332), leftover checkout ×
 * Remover tap / focus (PR #330 / #331), leftover checkout qty tap
 * (PR #329), leftover product-modal qty tap (PR #328), leftover
 * catalog qty tap (PR #327), leftover catalog Adicionar tap (PR #326),
 * leftover catalog Filtros tap (PR #324), leftover catalog Filtros
 * focus (PR #323), leftover sidebar-close tap / focus (PRs #321 /
 * #322), leftover mobile-close tap (PR #320), leftover shop-link tap
 * (PR #314), leftover consent-link tap (PR #294); leftover Continuar
 * a comprar already has leftover type="button". Does not redo leftover
 * type=button on leftover hamburger / Encomendar / mobile-close /
 * search-clear / 4-item bar Carrinho / cabaz-modal-close /
 * cabaz-modal-add / cabaz-ver / float-cart / float-legumes /
 * scroll-top / cat-quick-btn / shop-link, leftover hamburger 44px
 * (PR #7), leftover Filtros 44px (PR #324), leftover catalog
 * Adicionar 44px (PR #326), leftover catalog qty 44px (PR #327),
 * leftover product-modal qty 44px (PR #328), leftover checkout qty
 * 44px (PR #329), leftover checkout × Remover 44px (PR #330), leftover
 * checkout Hora de levantamento 44px (PR #332), leftover checkout
 * email 44px (PR #333), leftover wrapping Ervas / Época / Cabazes
 * (PR #218), leftover footer Ervas / Época (PR #230), leftover SEO
 * hamburger, leftover forest wordmark (PR #196), leftover Morada maps
 * (PR #227), leftover consent-btns tap (PR #318), leftover toast /
 * scroll-top mobile bottom (PR #317 / #316), leftover shop-link ring
 * / tap / type (PR #315 / #314 / #313), leftover float-cart type
 * (PR #325), leftover cabaz / featured add 44px (PR #45), leftover
 * shop-main .add-btn 44px combined tap, leftover search-clear 44px,
 * leftover feature-add 44px, leftover product-modal-add 44px, leftover
 * all-breakpoint checkout 44px (PR #50), leftover
 * .order-optional-toggle:focus-visible (PR #206), leftover
 * .oi-stepper button:focus-visible (PR #166), leftover
 * .order-remove:focus-visible (PR #331), leftover
 * .btn-continuar:focus-visible, leftover .btn-em:focus-visible,
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
  /\.btn-continuar \{\s*display:inline-flex; align-items:center; justify-content:center; gap:6px;/.test(css),
  'leftover Continuar a comprar should hug leftover labels on leftover desktop (inline-flex / align-items:center / leftover padding:9px 16px)'
);
assert(
  /\.btn-continuar \{[\s\S]*?padding:9px 16px;/.test(css),
  'leftover Continuar a comprar should keep leftover padding:9px 16px'
);
assert(
  /@media \(max-width:640px\) \{\s*\/\* Checkout Continuar a comprar: 44px tap target on phones, copy unchanged\. \*\/\s*\.btn-continuar \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover Continuar a comprar min-height:44px'
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
  /<button type="button" class="order-optional-toggle" id="order-optional-toggle"/.test(index) &&
  index.includes('+ Hora de levantamento ou nota <span>(opcional)</span>'),
  'leftover checkout Hora de levantamento should stay leftover + Hora de levantamento ou nota (opcional) with leftover type=button'
);
assert(
  /<button type="submit" class="btn-wa">📱 Encomendar por WhatsApp<\/button>/.test(index),
  'leftover order WhatsApp should stay leftover type=submit leftover .btn-wa'
);
assert(
  app.includes('function continuarAComprar()') &&
  app.includes("window.scrollTo({ top: alvo, behavior:'smooth' });"),
  'leftover Continuar a comprar should keep leftover continuarAComprar() catalog scroll'
);
assert(
  app.includes("window.location.href = `mailto:shahhossain87@gmail.com?subject=${encodeURIComponent('Encomenda MUNDIFRUTA')}&body=${encodeURIComponent(t)}`"),
  'leftover checkout email should keep leftover mailto:shahhossain87@gmail.com Encomenda MUNDIFRUTA'
);
assert(
  app.includes("window.open(`https://wa.me/351932699850?text=${encodeURIComponent(t)}`, '_blank')"),
  'leftover order WhatsApp should keep leftover wa.me/351932699850'
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
  !/\.btn-continuar:focus-visible/.test(css) &&
  !/\.btn-continuar:focus \{/.test(css),
  'should not invent leftover .btn-continuar:focus-visible'
);
assert(
  !/\.btn-em:focus-visible/.test(css) &&
  !/\.btn-em:focus \{/.test(css),
  'should not invent leftover .btn-em:focus-visible (PR #333 leftover ring)'
);
assert(
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus \{/.test(css),
  'should not invent leftover .order-optional-toggle:focus-visible (PR #206)'
);
assert(
  app.includes('<button class="order-remove" type="button" onclick="removerProduto(\'${i._id}\')" aria-label="Remover ${i.nome}">×</button>'),
  'leftover checkout × Remover should stay leftover × with leftover type=button and leftover Remover ${i.nome}'
);
assert(
  app.includes('<button type="button" onclick="alterarQtdCarrinho(\'${i._id}\',-1)" aria-label="Menos">−</button>') &&
  app.includes('<button type="button" onclick="alterarQtdCarrinho(\'${i._id}\',1)" aria-label="Mais">+</button>'),
  'leftover checkout qty − / + should stay leftover − / + with leftover type=button and leftover Menos / Mais'
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
  !product.includes('btn-continuar') &&
  !category.includes('btn-continuar') &&
  !credits.includes('btn-continuar'),
  'catalog / credits pages should still have leftover no Continuar a comprar'
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
  console.error('check-btn-continuar-tap failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-btn-continuar-tap: ok');
