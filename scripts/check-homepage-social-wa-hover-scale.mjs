#!/usr/bin/env node
/**
 * Guards leftover Fale Connosco / Encomendar .social-wa scale:
 * hover-capable pointers only. Complementary to leftover featured-row
 * / .carousel-nav scale (PR #365), leftover unused summer-carousel /
 * .sc lift (PR #364), leftover homepage shop-card / .product-card lift
 * (PR #363), leftover homepage category-tile / .cat-quick-btn lift
 * (PR #362), leftover Voltar ao topo / .scroll-top lift (PR #361),
 * leftover order WhatsApp / .btn-wa lift (PR #360), leftover
 * Avaliações Google-badge / .google-badge lift (PR #359), leftover
 * homepage Google-rating / .hero-rating lift (PR #358), leftover hero
 * CTA ↗ arrow hover (PR #357), leftover header Encomendar /
 * .nav-order lift (PR #356), leftover Encomendar por WhatsApp /
 * .btn-ghost lift (PR #355), leftover Ver Produtos / .btn-prim lift
 * (PR #354), leftover unused Encomenda online oo-step lift (PR #353),
 * leftover Como Encomendar step-card lift (PR #352), leftover Combina
 * bem cs-card lift (PR #351); leftover .social-wa scale slice of the
 * leftover hover-capable pass. Does not redo leftover featured-row
 * / .carousel-nav scale (PR #365), leftover unused summer-carousel /
 * .sc lift (PR #364), leftover homepage shop-card / .product-card lift
 * (PR #363), leftover wrapping-nav Ervas / Época / Cabazes (PR #218),
 * leftover unused .sc photo zoom (PR #276), leftover shop-card photo
 * zoom (PR #272), leftover scroll-top type=button (PR #311). Does not
 * invent leftover type="button" on leftover hamburger / leftover
 * Encomendar / leftover mobile-close. Does not hide leftover
 * .social-panel on leftover hover-capable pointers. Does not wrap
 * leftover .social-link:hover slide-out.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const extras = readFileSync(join(root, 'js', 'extras.js'), 'utf8');
const app = readFileSync(join(root, 'js', 'app.js'), 'utf8');
const credits = readFileSync(join(root, 'creditos.html'), 'utf8');
const product = readFileSync(join(root, 'produtos', 'banana-madeira', 'index.html'), 'utf8');
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
  !/estilos\.css\?v=67/.test(generator),
  'generated catalog CSS cache should stay estilos.css?v=65'
);
assert(
  product.includes('css/estilos.css?v=65') &&
  category.includes('css/estilos.css?v=65'),
  'generated Banana Madeira / Frutas pages should stay estilos.css?v=65'
);
assert(
  credits.includes('css/estilos.css?v=64'),
  'credits cache should stay estilos.css?v=64'
);

const socialWaScale = css.match(/@media \(hover:\s*hover\) \{\s*\.social-wa:hover \{ transform:translateX\(0\) scale\(1\.03\); \}\s*\}/);
assert(socialWaScale, 'leftover Fale Connosco / Encomendar .social-wa scale should be inside @media (hover: hover)');
assert(
  (css.split('.social-wa:hover { transform:translateX(0) scale(1.03); }').length - 1) === 1,
  'leftover Fale Connosco / Encomendar .social-wa scale must appear once, scoped to hover-capable pointers'
);
assert(
  /@media \(hover:\s*hover\) \{\s*\.social-wa:hover \{ transform:translateX\(0\) scale\(1\.03\); \}/.test(css) &&
  !/@media \(hover:\s*none\) \{\s*\.social-wa:hover \{/.test(css),
  'leftover Fale Connosco / Encomendar .social-wa scale must not add a leftover hover:none reset'
);
assert(
  /@media \(max-width:768px\) \{[\s\S]*?\.social-panel \{ display:none !important; \}/.test(css),
  'leftover .social-panel should stay hidden on leftover phones ≤768px'
);
assert(
  /\.social-link:hover \{ transform:translateX\(0\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.social-link:hover \{/.test(css),
  'leftover .social-link slide-out stays unscoped'
);
assert(
  /\.social-wa\s+\{\s*background:#25D366; transform:translateX\(0\);/.test(css),
  'leftover Fale Connosco / Encomendar .social-wa should stay expanded at rest'
);

assert(
  /class="social-link social-wa" title="Fale connosco no WhatsApp"/.test(index) &&
  /class="social-link social-wa" title="Encomendar via WhatsApp"/.test(index) &&
  index.includes('<span class="social-label">Fale Connosco</span>') &&
  index.includes('<span class="social-label">Encomendar</span>') &&
  (index.split('class="social-link social-wa"').length - 1) === 2 &&
  /href="https:\/\/wa\.me\/351932699850\?text=/.test(index) &&
  /href="https:\/\/wa\.me\/351932699850" target="_blank" class="social-link social-wa"/.test(index),
  'homepage leftover Fale Connosco / Encomendar .social-wa links and leftover wa.me stay'
);
assert(
  !product.includes('class="social-wa"') &&
  !product.includes('class="social-panel"') &&
  !category.includes('class="social-wa"') &&
  !credits.includes('class="social-wa"'),
  'leftover Fale Connosco / Encomendar .social-wa stays homepage-only'
);

assert(
  /\.carousel-nav:hover \{ opacity:1; transform:translateY\(-50%\) scale\(1\.08\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.carousel-nav:hover \{/.test(css),
  'leftover featured-row .carousel-nav scale stays unscoped (PR #365)'
);
assert(
  /\.sc:hover \{ transform:translateY\(-16px\) scale\(1\.025\); box-shadow:0 30px 70px rgba\(0,0,0,0\.24\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover \{ transform:translateY\(-16px\)/.test(css),
  'leftover unused summer-carousel .sc lift stays unscoped (PR #364)'
);
assert(
  /\.sc:hover img \{ transform:scale\(1\.1\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover img/.test(css),
  'must not redo leftover unused .sc photo zoom (PR #276)'
);
assert(
  /\.product-card:hover \{ transform:translateY\(-12px\) scale\(1\.02\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \{ transform:translateY\(-12px\)/.test(css),
  'leftover homepage shop-card lift stays unscoped (PR #363)'
);
assert(
  /\.cat-quick-btn:hover \{ transform:translateY\(-4px\);/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cat-quick-btn:hover \{/.test(css),
  'leftover homepage category-tile card lift stays unscoped (PR #362)'
);
assert(
  /\.scroll-top:hover\s+\{ background:var\(--forest-2\); transform:translateY\(-3px\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.scroll-top:hover/.test(css),
  'leftover Voltar ao topo .scroll-top lift stays unscoped (PR #361)'
);
assert(
  /\.btn-wa:hover \{ background:#1ebe5d; transform:translateY\(-1px\); box-shadow:0 8px 22px rgba\(37,211,102,0\.42\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.btn-wa:hover \{/.test(css),
  'leftover order WhatsApp .btn-wa lift stays unscoped (PR #360)'
);
assert(
  /\.google-badge:hover \{ transform:translateY\(-2px\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.google-badge:hover \{/.test(css),
  'leftover Avaliações Google-badge .google-badge lift stays unscoped (PR #359)'
);
assert(
  /\.hero-rating:hover \{ transform:translateY\(-2px\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.hero-rating:hover \{/.test(css),
  'leftover homepage Google-rating .hero-rating lift stays unscoped (PR #358)'
);
assert(
  /body\.homepage \.hero-ctas a:hover span \{ transform:translate\(2px,-2px\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*body\.homepage \.hero-ctas a:hover span \{/.test(css),
  'leftover hero CTA arrow hover stays unscoped (PR #357)'
);
assert(
  /\.nav-order:hover \{ background:var\(--peach-lt\); transform:translateY\(-1px\); box-shadow:0 6px 20px rgba\(224,123,57,0\.4\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.nav-order:hover \{/.test(css),
  'leftover header Encomendar .nav-order lift stays unscoped (PR #356)'
);
assert(
  /\.btn-ghost:hover \{ background:rgba\(255,255,255,0\.2\); border-color:rgba\(255,255,255,0\.5\); transform:translateY\(-2px\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.btn-ghost:hover \{/.test(css),
  'leftover Encomendar por WhatsApp .btn-ghost lift stays unscoped (PR #355)'
);
assert(
  /\.btn-prim:hover \{ background:var\(--peach-lt\); transform:translateY\(-3px\); box-shadow:0 16px 40px rgba\(224,123,57,0\.5\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.btn-prim:hover \{/.test(css),
  'leftover Ver Produtos .btn-prim lift stays unscoped (PR #354)'
);
assert(
  /\.oo-step:hover \{ transform:translateY\(-4px\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.oo-step:hover \{/.test(css),
  'leftover unused Encomenda online .oo-step lift stays unscoped (PR #353)'
);
assert(
  /\.step-card:hover \{ transform:translateY\(-10px\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.step-card:hover \{/.test(css),
  'leftover Como Encomendar step-card lift stays unscoped (PR #352)'
);
assert(
  /\.cs-card:hover \{ transform:translateY\(-3px\); box-shadow:var\(--sh\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cs-card:hover \{/.test(css),
  'leftover Combina bem cs-card lift stays unscoped (PR #351)'
);
assert(
  /\.contact-card:hover \{ transform:translateY\(-6px\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.contact-card:hover \{/.test(css),
  'leftover Encontre-nos contact-card lift stays unscoped (PR #280)'
);
assert(
  /\.product-card:hover \.photo-wrap img \{ transform:scale\(1\.09\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \.photo-wrap img/.test(css),
  'must not redo leftover homepage shop-card photo zoom (PR #272)'
);
assert(
  /\.seo-product-card:hover \.seo-product-image img \{ transform:scale\(1\.04\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.seo-product-card:hover \.seo-product-image img/.test(css),
  'must not redo leftover catalog category-card photo zoom (PR #271)'
);
assert(
  /\.qs-photo:hover img \{ transform:scale\(1\.06\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.qs-photo:hover img/.test(css),
  'must not redo leftover homepage Quem Somos gallery zoom (PR #275)'
);
assert(
  /\.feature-photo:hover img \{ transform:scale\(1\.045\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.feature-photo:hover img/.test(css),
  'must not redo leftover homepage featured-photo zoom (PR #274)'
);
assert(
  /\.cat-quick-btn:hover img \{ transform:scale\(1\.055\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cat-quick-btn:hover img/.test(css),
  'must not redo leftover homepage category-tile photo zoom (PR #273)'
);
assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:hover img \{ transform:scale\(1\.06\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*body\.homepage \.homepage-category \.cat-quick-btn:hover img/.test(css),
  'must not redo leftover homepage category-tile homepage photo zoom (PR #273)'
);

assert(
  css.includes('.summer-section') &&
  css.includes('.summer-scroll') &&
  css.includes('.sc-name') &&
  !index.includes('class="sc"') &&
  !index.includes('summer-scroll') &&
  !extras.includes('class="sc"') &&
  !extras.includes('summer-scroll'),
  'leftover unused summer-carousel CSS should stay unused (no leftover .sc markup)'
);
assert(
  css.includes('.online-order') &&
  css.includes('.oo-step') &&
  css.includes('.oo-ic') &&
  !index.includes('class="oo-step"') &&
  !index.includes('online-order') &&
  !extras.includes('class="oo-step"') &&
  !extras.includes('online-order'),
  'leftover unused Encomenda online .oo-step CSS should stay unused (no leftover markup)'
);
assert(
  extras.includes("prev.className = 'carousel-nav prev'; prev.type = 'button';") &&
  extras.includes("next.className = 'carousel-nav next'; next.type = 'button';") &&
  extras.includes("prev.setAttribute('aria-label', 'Anterior'); prev.textContent = '‹';") &&
  extras.includes("next.setAttribute('aria-label', 'Seguinte'); next.textContent = '›';") &&
  extras.includes('function initCarousels()'),
  'leftover featured-row carousel-nav should stay type=button with leftover Anterior / Seguinte names'
);
assert(
  app.includes('card.className = \'product-card\'') &&
  app.includes("card.innerHTML = `") &&
  app.includes('<button class="add-btn" type="button" onclick="adicionarProduto(\'${id}\', produtos_map[\'${id}\'])">＋ Adicionar</button>') &&
  app.includes("document.createElement('article')"),
  'leftover catalog shop cards stay leftover article.product-card with leftover Adicionar'
);
assert(
  extras.includes('return `<button class="cs-card" type="button" onclick="csAdd(\'${item._id}\')">') &&
  extras.includes("document.getElementById('cs-pop-title').textContent =") &&
  extras.includes("? 'Combina bem com…' : 'Também pode gostar'"),
  'leftover CS card render and leftover Combina bem / Também pode gostar titles stay'
);
assert(
  index.includes('id="cs-pop"') &&
  index.includes('Também pode gostar') &&
  index.includes('Continuar sem adicionar') &&
  index.includes('Complete o seu pedido') &&
  index.includes('id="crosssell-cart"') &&
  index.includes('id="crosssell-cart-row"'),
  'visible leftover Combina bem sheet and leftover Complete o seu pedido stay'
);
assert(
  index.includes('id="como-funciona"') &&
  index.includes('Como Encomendar') &&
  index.includes('Escolha os Produtos') &&
  index.includes('Adicione ao Carrinho') &&
  index.includes('Confirme o Subtotal') &&
  index.includes('Envie por WhatsApp') &&
  index.includes('Levante na Loja') &&
  (index.split('class="step-card fi"').length - 1) === 5,
  'homepage Como Encomendar should keep leftover 5 passos copy and leftover 5 step-cards'
);
assert(
  index.includes('id="contacto"') &&
  index.includes('Encontre-nos') &&
  index.includes('<h4>Morada</h4>') &&
  index.includes('<h4>Telefone / WhatsApp</h4>') &&
  index.includes('<h4>Email</h4>') &&
  index.includes('<h4>Horário</h4>') &&
  index.includes('href="tel:932699850"') &&
  index.includes('932 699 850') &&
  index.includes('href="mailto:shahhossain87@gmail.com"'),
  'homepage Encontre-nos should keep leftover Morada / Telefone / Email / Horário copy and contacts'
);
assert(
  /class="hero-rating"[^>]*href="https:\/\/maps\.app\.goo\.gl\/1gHGqMac4ahTtfxf8\?g_st=ac"/.test(index) &&
  index.includes('title="Ver avaliações no Google"') &&
  index.includes('<span class="hr-stars">★★★★★</span>') &&
  index.includes('<span class="hr-score">4,9</span>') &&
  index.includes('<span class="hr-count">107+ Google</span>'),
  'homepage leftover Google rating 4,9 / 107+ Google and leftover maps href stay'
);
assert(
  /class="google-badge fi" id="google-badge" href="#"/.test(index) &&
  index.includes('id="avaliacoes"') &&
  index.includes('<span class="gb-nota" id="gb-nota">4,9</span>') &&
  index.includes('<span class="gb-stars" id="gb-stars">★★★★★</span>') &&
  index.includes('<span class="gb-total" id="gb-total">107 avaliações no Google</span>') &&
  index.includes('id="reviews-cta"') &&
  index.includes('Ver todas as avaliações no Google'),
  'homepage leftover Avaliações Google-badge 4,9 / 107 avaliações no Google stays'
);
assert(
  /class="btn-prim">Ver Produtos <span aria-hidden="true">↗<\/span>/.test(index) &&
  /class="btn-ghost">Encomendar por WhatsApp <span aria-hidden="true">↗<\/span>/.test(index) &&
  index.includes('<button class="nav-order" onclick="irParaEncomenda()">') &&
  index.includes('🛒 Encomendar'),
  'homepage hero CTAs keep leftover ↗ arrows and leftover header Encomendar stays'
);
assert(
  index.includes('Encontre o que procura') &&
  index.includes('data-count-label="frutas">Frutas</span>') &&
  index.includes('data-count-label="legumes">Legumes</span>') &&
  index.includes('data-count-label="cabazes">Cabazes</span>') &&
  index.includes('data-count-label="promocoes">Promoções</span>') &&
  index.includes('data-count-label="ervas">Ervas frescas</span>') &&
  index.includes('data-count-label="epoca">Fruta da Época</span>') &&
  index.includes('class="cat-quick-btn cq-order"') &&
  index.includes('Carrinho <b id="quick-cart-count">0</b>'),
  'homepage category tiles should keep leftover Frutas / Legumes / Cabazes / Promoções / Ervas frescas / Fruta da Época / Carrinho'
);
assert(
  /<button class="cat-quick-btn" onclick="abrirCatalogo\('frutas'\)">/.test(index) &&
  !/<button[^>]*class="cat-quick-btn"[^>]*type="button"/.test(index) &&
  !/<button[^>]*type="button"[^>]*class="cat-quick-btn"/.test(index),
  'leftover category tiles stay without leftover type=button'
);
assert(
  index.includes('Ver catálogo completo') &&
  index.includes('Ver todas as frutas') &&
  index.includes('Explorar fruta') &&
  index.includes('Ver todos os legumes'),
  'featured shop-links should stay leftover catalog jumps'
);
assert(
  index.includes('id="quem-somos"') &&
  index.includes('id="qs-gallery"') &&
  index.includes('Quem Somos') &&
  extras.includes('class="qs-photo"') &&
  extras.includes('Mundi Fruta — seleção diária'),
  'homepage Quem Somos gallery should keep leftover qs-gallery / qs-photo / seleção diária alts'
);
assert(
  index.includes('Promoções da Semana') &&
  index.includes('Frutas Populares') &&
  index.includes('Fruta da Época') &&
  index.includes('Legumes Frescos') &&
  index.includes('id="promo-grid"') &&
  index.includes('id="popular-grid"') &&
  index.includes('id="season-grid"') &&
  index.includes('id="veg-featured-grid"'),
  'homepage featured sections should keep leftover Promoções / Frutas Populares / Fruta da Época / Legumes Frescos'
);
assert(
  index.includes('<span class="mb-label" id="mb-cart-label">Carrinho</span>') &&
  index.includes('<span class="mb-label">Promoções</span>') &&
  index.includes('<span class="mb-label">WhatsApp</span>') &&
  index.includes('<span class="mb-label">Como Chegar</span>'),
  'visible leftover 4-item bar labels stay'
);
assert(
  /<button class="scroll-top" id="scroll-top" onclick="window\.scrollTo\(\{top:0,behavior:'smooth'\}\)" title="Voltar ao topo">▲<\/button>/.test(index) &&
  !/<button[^>]*id="scroll-top"[^>]*type="button"/.test(index),
  'leftover Voltar ao topo ▲ stays without leftover type=button'
);
assert(
  category.includes('Ver produto') &&
  /class="seo-text-link"/.test(category),
  'Frutas cards should keep leftover Ver produto text links'
);
assert(
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('class="btn-prim seo-order-link"') &&
  product.includes('href="/?produto=banana-madeira#produtos"') &&
  !product.includes('hero-ctas') &&
  !product.includes('cat-quick-btn') &&
  !product.includes('class="product-card"') &&
  !product.includes('class="btn-wa"') &&
  !product.includes('scroll-top') &&
  !product.includes('class="carousel-nav') &&
  !product.includes('class="sc"') &&
  !product.includes('summer-scroll'),
  'Banana Madeira should keep leftover Ver no catálogo e encomendar + catalog href, without leftover product-card / leftover cat-quick-btn / leftover btn-wa / leftover scroll-top / leftover carousel-nav / leftover .sc'
);
{
  const nav = category.match(/<nav class="seo-nav"[^>]*>[\s\S]*?<\/nav>/);
  assert(
    nav &&
    /Início/.test(nav[0]) &&
    /Frutas/.test(nav[0]) &&
    /Legumes/.test(nav[0]) &&
    /Promoções/.test(nav[0]) &&
    !/Ervas/.test(nav[0]) &&
    !/Época/.test(nav[0]) &&
    !/Cabazes/.test(nav[0]),
    'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
  );
}
assert(
  !category.includes('aria-current') &&
  !category.includes('og:image') &&
  !category.includes('twitter:card'),
  'should not redo leftover wrapping-nav aria-current, leftover catalog og:image, or leftover Twitter cards'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.btn-prim \{[^}]*min-height:44px/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.seo-order-link:focus-visible/.test(css) &&
  !index.includes('role="tabpanel"'),
  'must not redo leftover 44px tap-target / peach-ring / catalog tabpanel PRs'
);
assert(
  !/<button[^>]*class="hamburger"[^>]*type="button"/.test(index) &&
  !/<button[^>]*type="button"[^>]*class="hamburger"/.test(index) &&
  !/<button[^>]*class="nav-order"[^>]*type="button"/.test(index) &&
  !/<button[^>]*class="mobile-close"[^>]*type="button"/.test(index) &&
  !/<button[^>]*class="scroll-top"[^>]*type="button"/.test(index),
  'must not invent leftover type="button" on leftover hamburger / leftover Encomendar / leftover mobile-close / leftover scroll-top'
);
assert(
  index.includes('type="submit" class="btn-wa"') &&
  index.includes('📱 Encomendar por WhatsApp') &&
  /<button type="submit" class="btn-wa">📱 Encomendar por WhatsApp<\/button>/.test(index) &&
  /https:\/\/wa\.me\/351932699850/.test(index) &&
  app.includes("window.open(`https://wa.me/351932699850?text=${encodeURIComponent(t)}`, '_blank')") &&
  index.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'leftover order WhatsApp type=submit leftover .btn-wa, leftover wa.me, and leftover cabaz-modal-add stay'
);

if (failures.length) {
  console.error('check-homepage-social-wa-hover-scale failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-homepage-social-wa-hover-scale: ok');
