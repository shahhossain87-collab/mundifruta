#!/usr/bin/env node
/**
 * Guards leftover cart Mais dados / .order-optional-toggle hover wash:
 * hover-capable pointers only. Complementary to leftover cart × Remover /
 * .order-remove wash (PR #382), leftover cart qty stepper / .oi-stepper
 * wash (PR #381), leftover catalog qty stepper / .qty-btn wash (PR #380),
 * leftover shop-card Adicionar / .add-btn wash (PR #379), leftover Cabaz
 * Detox 👁 Ver o que leva / .cabaz-ver wash (PR #378), leftover cabaz
 * Fechar / .cabaz-modal-close wash (PR #377), leftover homepage Fechar
 * oferta / .reveal-close wash (PR #376), leftover homepage Receber Oferta /
 * .reveal-cta brightness (PR #375), leftover homepage Ver a sua encomenda /
 * .float-cart brightness (PR #374), leftover catalog category-card /
 * .seo-product-card photo zoom (PR #373), leftover homepage Quem Somos
 * gallery / .qs-photo photo zoom (PR #372), leftover homepage
 * featured-photo / .feature-photo photo zoom (PR #371), leftover homepage
 * category-tile / .cat-quick-btn photo zoom (PR #370), leftover homepage
 * shop-card / .product-card photo zoom (PR #369), leftover unused
 * summer-carousel / .sc photo zoom (PR #368), leftover Avalie-nos /
 * Como Chegar .social-link slide-out (PR #367), leftover Fale Connosco /
 * Encomendar .social-wa scale (PR #366), leftover featured-row /
 * .carousel-nav scale (PR #365), leftover unused summer-carousel / .sc
 * lift (PR #364), leftover homepage shop-card / .product-card lift
 * (PR #363), leftover homepage category-tile / .cat-quick-btn lift
 * (PR #362); leftover .order-optional-toggle wash slice of the leftover
 * hover-capable pass.
 * Does not redo leftover wrapping-nav Ervas / Época / Cabazes
 * (PR #218), leftover order-remove wash (PR #382), leftover oi-stepper
 * wash (PR #381), leftover qty-btn wash (PR #380), leftover add-btn wash
 * (PR #379), leftover cabaz-ver wash (PR #378), leftover cabaz Fechar
 * wash (PR #377), leftover Fechar oferta wash (PR #376), leftover Receber
 * Oferta brightness (PR #375), leftover float-cart brightness (PR #374),
 * leftover catalog category-card photo zoom (PR #373), leftover homepage
 * Quem Somos gallery photo zoom (PR #372), leftover homepage
 * featured-photo photo zoom (PR #371), leftover homepage category-tile
 * photo zoom (PR #370), leftover homepage shop-card photo zoom
 * (PR #369), leftover unused .sc photo zoom (PR #368), leftover
 * Avalie-nos / Como Chegar .social-link slide-out (PR #367), leftover
 * Fale Connosco / Encomendar .social-wa scale (PR #366), leftover
 * featured-row / .carousel-nav scale (PR #365), leftover unused .sc card
 * lift (PR #364), leftover shop-card lift (PR #363), leftover
 * category-tile lift (PR #362), leftover add-btn 44px tap (PR #326),
 * leftover cabaz-ver 44px tap (PR #301), leftover cabaz-ver type=button
 * (PR #307), leftover cabaz-modal-close 44px tap (PR #300), leftover
 * cabaz-modal-close type=button (PR #309), leftover float-cart
 * type=button (PR #325), leftover scroll-top type=button (PR #311),
 * leftover oi-stepper 44px tap (PR #329), leftover order-remove 44px tap
 * (PR #330), leftover order-optional 44px tap (PR #332).
 * Does not add a leftover hover:none reset (PR #146). Does not restore
 * leftover #offer-pop markup removed in the homepage refresh. Does not
 * invent leftover type="button" on leftover hamburger / leftover
 * Encomendar / leftover mobile-close / leftover cabaz-ver; leftover
 * order-optional-toggle already has leftover type="button".
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

const wash = css.match(/@media \(hover:\s*hover\) \{\s*\.order-optional-toggle:hover \{ color:#fff; \}\s*\}/g) || [];
assert(
  wash.length === 1,
  'leftover cart Mais dados wash should appear once, inside @media (hover: hover)'
);
assert(
  !/^\s*\.order-optional-toggle:hover \{ color:#fff; \}/m.test(css),
  'leftover cart Mais dados wash must not stay unscoped'
);
assert(
  !/@media \(hover:\s*none\) \{\s*\.order-optional-toggle:hover \{ color:/.test(css),
  'leftover cart Mais dados wash must not add a leftover hover:none reset'
);
assert(
  /\.order-optional-toggle \{\s*display:inline-block; margin-bottom:12px; padding:4px 2px;\s*background:none; border:none; cursor:pointer;\s*color:var\(--sage-lt\); font-weight:600; font-size:0\.86rem;\s*font-family:'Poppins',sans-serif; text-decoration:underline; text-underline-offset:3px;\s*transition:color 0\.2s;\s*\}/.test(css) &&
  index.includes('class="order-optional-toggle" id="order-optional-toggle"') &&
  /<button type="button" class="order-optional-toggle" id="order-optional-toggle"/.test(index) &&
  index.includes('+ Hora de levantamento ou nota <span>(opcional)</span>') &&
  index.includes('id="order-optional"') &&
  index.includes('placeholder="Hora de levantamento (ex: 17h30)"') &&
  index.includes('placeholder="Pedidos especiais ou notas..."'),
  'leftover cart Mais dados rest wash sage-lt, leftover type=button leftover + Hora de levantamento ou nota (opcional) stay'
);
assert(
  /^\s*\.order-remove:hover \{ background:var\(--cherry\); color:#fff; \}/m.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.order-remove:hover \{/.test(css),
  'leftover cart × Remover wash stays unscoped (PR #382)'
);
assert(
  /^\s*\.oi-stepper button:hover \{ background:var\(--sage\); border-color:var\(--sage\); \}/m.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.oi-stepper button:hover \{/.test(css),
  'leftover cart oi-stepper wash stays unscoped (PR #381)'
);
assert(
  /^\s*\.qty-btn:hover \{ background:var\(--forest\); color:#fff; border-color:var\(--forest\); \}/m.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.qty-btn:hover \{/.test(css),
  'leftover catalog qty stepper wash stays unscoped (PR #380)'
);
assert(
  /^\s*\.add-btn:hover \{ background:var\(--forest-2\); \}/m.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.add-btn:hover \{/.test(css),
  'leftover ＋ Adicionar wash stays unscoped (PR #379)'
);
assert(
  /\.cabaz-ver:hover \{ background:rgba\(82,183,136,0\.16\); border-color:var\(--sage\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cabaz-ver:hover \{/.test(css),
  'leftover 👁 Ver o que leva wash stays unscoped (PR #378)'
);
assert(
  /\.cabaz-modal-close:hover \{ background:var\(--cream-3\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cabaz-modal-close:hover \{/.test(css),
  'leftover cabaz-composition Fechar wash stays unscoped (PR #377)'
);
assert(
  /\.reveal-close:hover \{ background:rgba\(255,255,255,\.22\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.reveal-close:hover \{/.test(css),
  'leftover Fechar oferta / .reveal-close wash stays unscoped (PR #376)'
);
assert(
  /\.reveal-cta:hover \{ filter:brightness\(1\.07\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.reveal-cta:hover \{ filter:brightness\(1\.07\)/.test(css),
  'leftover Receber Oferta / .reveal-cta brightness stays unscoped (PR #375)'
);
assert(
  /\.float-cart:hover \{ filter:brightness\(1\.08\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.float-cart:hover \{ filter:brightness\(1\.08\)/.test(css),
  'leftover Ver a sua encomenda / .float-cart brightness stays unscoped (PR #374)'
);
assert(
  /^\s*\.btn-em:hover \{ color:#fff; background:none; \}/m.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.btn-em:hover \{/.test(css),
  'leftover cart ou encomende por email / .btn-em wash stays unscoped'
);
assert(
  /\.product-card:hover \{ transform:translateY\(-12px\) scale\(1\.02\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  /\.product-card:hover \{ transform:translateY\(-5px\); \}/.test(css) &&
  /\.product-card:hover \{ transform:translateY\(-4px\); box-shadow:var\(--sh-hover\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \{ transform:translateY\(-12px\)/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \{ transform:translateY\(-5px\)/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \{ transform:translateY\(-4px\)/.test(css),
  'leftover homepage shop-card lifts stay unscoped (PR #363)'
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
  /\.social-link:hover \{ transform:translateX\(0\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.social-link:hover \{/.test(css),
  'leftover Avalie-nos / Como Chegar .social-link slide-out stays unscoped (PR #367)'
);
assert(
  /\.social-wa:hover \{ transform:translateX\(0\) scale\(1\.03\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.social-wa:hover \{/.test(css),
  'leftover Fale Connosco / Encomendar .social-wa scale stays unscoped (PR #366)'
);
assert(
  /\.carousel-nav:hover \{ opacity:1; transform:translateY\(-50%\) scale\(1\.08\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.carousel-nav:hover \{/.test(css),
  'leftover featured-row .carousel-nav scale stays unscoped (PR #365)'
);
assert(
  /\.sc:hover \{ transform:translateY\(-16px\) scale\(1\.025\);/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover \{/.test(css),
  'must not redo leftover unused .sc card lift (PR #364 / #277)'
);
assert(
  /\.sc:hover img \{ transform:scale\(1\.1\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover img/.test(css),
  'must not redo leftover unused .sc photo zoom (PR #368 / #276)'
);
assert(
  /\.product-card:hover \.photo-wrap img \{ transform:scale\(1\.09\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \.photo-wrap img/.test(css),
  'must not redo leftover homepage shop-card photo zoom (PR #369 / #272)'
);
assert(
  /\.seo-product-card:hover \.seo-product-image img \{ transform:scale\(1\.04\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.seo-product-card:hover \.seo-product-image img/.test(css),
  'must not redo leftover catalog category-card photo zoom (PR #373 / #271)'
);
assert(
  /\.qs-photo:hover img \{ transform:scale\(1\.06\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.qs-photo:hover img/.test(css),
  'must not redo leftover homepage Quem Somos gallery zoom (PR #372 / #275)'
);
assert(
  /\.feature-photo:hover img \{ transform:scale\(1\.045\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.feature-photo:hover img/.test(css),
  'must not redo leftover homepage featured-photo zoom (PR #371 / #274)'
);
assert(
  /\.cat-quick-btn:hover img \{ transform:scale\(1\.055\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cat-quick-btn:hover img/.test(css),
  'must not redo leftover homepage category-tile photo zoom (PR #370 / #273)'
);
assert(
  /body\.homepage \.homepage-category \.cat-quick-btn:hover img \{ transform:scale\(1\.06\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*body\.homepage \.homepage-category \.cat-quick-btn:hover img/.test(css),
  'must not redo leftover homepage category-tile homepage photo zoom (PR #370 / #273)'
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
  extras.includes("document.getElementById('offer-pop')") &&
  extras.includes("pop.querySelector('.reveal-cta')") &&
  extras.includes('window.aceitarOferta') &&
  extras.includes('window.fecharOferta') &&
  extras.includes('initOferta()') &&
  extras.includes("id=\"offer-text\"") === false &&
  css.includes('.offer-reveal') &&
  css.includes('.reveal-close') &&
  css.includes('.reveal-cta'),
  'leftover offer JS / leftover offer CSS stay; leftover extras does not invent leftover offer-text markup'
);
assert(
  !index.includes('id="offer-pop"') &&
  !index.includes('class="reveal-cta"') &&
  !index.includes('class="reveal-close"') &&
  !index.includes('Receber Oferta') &&
  !index.includes('Fechar oferta') &&
  !index.includes('class="offer-reveal"'),
  'leftover homepage refresh should keep leftover #offer-pop / leftover Fechar oferta markup out (human-approval restore)'
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
  /<button class="float-cart" id="float-cart" onclick="irParaEncomenda\(\)" title="Ver a sua encomenda">/.test(index) &&
  index.includes('<span class="fc-icon">🛒</span>') &&
  !/<button[^>]*id="float-cart"[^>]*type="button"/.test(index) &&
  !/<button[^>]*type="button"[^>]*id="float-cart"/.test(index),
  'leftover Ver a sua encomenda / leftover 🛒 stays without leftover type=button'
);
assert(
  app.includes("verBtn = temItens ? `<button class=\"cabaz-ver\" onclick=\"event.stopPropagation(); abrirCabaz('${id}')\">👁 Ver o que leva</button>`") &&
  index.includes('id="cabaz-modal"') &&
  index.includes('id="grid-cabazes"') &&
  index.includes('<span class="eyebrow">Composição do Cabaz</span>') &&
  index.includes('Este cabaz é composto pelos seguintes itens:') &&
  index.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>') &&
  app.includes('function abrirCabaz') &&
  app.includes('function fecharCabaz') &&
  app.includes('function renderCabazes'),
  'leftover Cabaz Detox 👁 Ver o que leva, leftover Composição do Cabaz, leftover cabaz-modal-add stay'
);
assert(
  index.includes('id="encomenda"') &&
  index.includes('id="order-list"') &&
  index.includes('🛒 A Sua Encomenda') &&
  index.includes('📱 Encomendar por WhatsApp') &&
  index.includes('📋 Os Seus Dados') &&
  app.includes('function alterarQtdCarrinho') &&
  app.includes('function atualizarResumo') &&
  app.includes('function removerProduto'),
  'leftover cart Encomendar Online / leftover A Sua Encomenda / leftover Os Seus Dados stay'
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
  !product.includes('float-cart') &&
  !product.includes('reveal-cta') &&
  !product.includes('reveal-close') &&
  !product.includes('offer-pop') &&
  !product.includes('cabaz-modal-close') &&
  !product.includes('cabaz-ver') &&
  !product.includes('cabaz-modal') &&
  !product.includes('class="add-btn"') &&
  !product.includes('class="qty-btn"') &&
  !product.includes('oi-stepper') &&
  !product.includes('order-remove') &&
  !product.includes('order-optional-toggle') &&
  !product.includes('order-optional'),
  'Banana Madeira should keep leftover Ver no catálogo e encomendar + catalog href, without leftover product-card / leftover cat-quick-btn / leftover btn-wa / leftover scroll-top / leftover float-cart / leftover reveal-close / leftover cabaz-ver / leftover add-btn / leftover qty-btn / leftover oi-stepper / leftover order-remove / leftover order-optional-toggle'
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
  !/\.float-cart \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.cabaz-modal-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.cabaz-ver \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.cabaz-modal-close \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.add-btn \{[^}]*min-height:44px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.qty-btn \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.oi-stepper button \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.order-remove \{[^}]*min-(width|height):44px/.test(css) &&
  !/@media \(max-width:640px\) \{[^}]*\.order-optional-toggle \{[^}]*min-(width|height):44px/.test(css) &&
  !/\.reveal-cta:focus-visible/.test(css) &&
  !/\.reveal-close:focus-visible/.test(css) &&
  !/\.logo:focus-visible/.test(css) &&
  !/\.btn-wa:focus-visible/.test(css) &&
  !/\.float-cart:focus-visible/.test(css) &&
  !/\.seo-order-link:focus-visible/.test(css) &&
  !/\.order-optional-toggle:focus-visible/.test(css) &&
  !index.includes('role="tabpanel"'),
  'must not redo leftover 44px tap-target / peach-ring / catalog tabpanel / leftover float-cart / leftover reveal-close / leftover cabaz-ver / leftover add-btn / leftover qty-btn / leftover oi-stepper / leftover order-remove / leftover order-optional tap PRs'
);
assert(
  !/<button[^>]*class="hamburger"[^>]*type="button"/.test(index) &&
  !/<button[^>]*type="button"[^>]*class="hamburger"/.test(index) &&
  !/<button[^>]*class="nav-order"[^>]*type="button"/.test(index) &&
  !/<button[^>]*class="mobile-close"[^>]*type="button"/.test(index) &&
  !/<button[^>]*class="scroll-top"[^>]*type="button"/.test(index) &&
  !/<button[^>]*id="float-cart"[^>]*type="button"/.test(index) &&
  !/<button[^>]*class="cabaz-modal-close"[^>]*type="button"/.test(index) &&
  !app.includes('<button type="button" class="cabaz-ver"') &&
  !app.includes('<button class="cabaz-ver" type="button"'),
  'must not invent leftover type="button" on leftover hamburger / leftover Encomendar / leftover mobile-close / leftover scroll-top / leftover float-cart / leftover cabaz-modal-close / leftover cabaz-ver'
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
  console.error('check-homepage-order-optional-hover failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-homepage-order-optional-hover: ok');
