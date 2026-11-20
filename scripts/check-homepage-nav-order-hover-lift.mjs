#!/usr/bin/env node
/**
 * Guards leftover homepage header Encomendar / .nav-order lift:
 * hover-capable pointers only. Complementary to leftover Encomendar
 * por WhatsApp / .btn-ghost lift (PR #355), leftover Ver Produtos /
 * .btn-prim lift (PR #354), leftover unused Encomenda online oo-step
 * lift (PR #353), leftover Como Encomendar step-card lift (PR #352),
 * leftover Combina bem cs-card lift (PR #351), leftover Encontre-nos
 * contact-card lift (PR #280), leftover homepage category-tile lift
 * (PR #279), leftover homepage shop-card lift (PR #278), leftover
 * unused .sc card lift (PR #277); leftover .nav-order lift slice of
 * the leftover hover-capable pass.
 * Does not redo leftover Encomendar por WhatsApp / .btn-ghost lift
 * (PR #355), leftover Ver Produtos / .btn-prim lift (PR #354),
 * leftover unused Encomenda online oo-step lift (PR #353), leftover
 * Como Encomendar step-card lift (PR #352), leftover Combina bem
 * cs-card lift (PR #351), leftover wrapping-nav Ervas / Época /
 * Cabazes (PR #218), leftover catalog share photos (PR #215).
 * Does not wrap leftover hero-ctas arrow hover.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'css', 'estilos.css'), 'utf8');
const generator = readFileSync(join(root, 'scripts', 'generate-seo-pages.mjs'), 'utf8');
const index = readFileSync(join(root, 'index.html'), 'utf8');
const extras = readFileSync(join(root, 'js', 'extras.js'), 'utf8');
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

const navOrderLift = css.match(/@media \(hover:\s*hover\) \{\s*\.nav-order:hover \{ background:var\(--peach-lt\); transform:translateY\(-1px\); box-shadow:0 6px 20px rgba\(224,123,57,0\.4\); \}\s*\}/);
assert(navOrderLift, 'leftover .nav-order lift should be inside @media (hover: hover)');

const navOrderHoverRule = '.nav-order:hover { background:var(--peach-lt); transform:translateY(-1px); box-shadow:0 6px 20px rgba(224,123,57,0.4); }';
assert(
  (css.split(navOrderHoverRule).length - 1) === 1,
  'leftover .nav-order hover lift must appear once, scoped to hover-capable pointers'
);
assert(
  /@media \(hover:\s*hover\) \{\s*\.nav-order:hover \{/.test(css) &&
  !/@media \(hover:\s*none\) \{\s*\.nav-order:hover/.test(css),
  'leftover .nav-order lift must not add a leftover hover:none reset'
);

assert(
  /@media \(max-width:768px\) \{[\s\S]*?\.nav-links, \.nav-order \{ display:none; \}/.test(css),
  'leftover header Encomendar stays hidden on leftover phones (hamburger path)'
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
  /body\.homepage \.hero-ctas a:hover span \{ transform:translate\(2px,-2px\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*body\.homepage \.hero-ctas a:hover span/.test(css),
  'leftover hero CTA arrow hover stays unscoped'
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
  /\.cat-quick-btn:hover \{ transform:translateY\(-4px\); box-shadow:var\(--sh-lg\); border-color:var\(--sage\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.cat-quick-btn:hover \{ transform:translateY\(-4px\)/.test(css),
  'must not redo leftover homepage category-tile card lift (PR #279)'
);
assert(
  /\.product-card:hover \{ transform:translateY\(-12px\) scale\(1\.02\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.product-card:hover \{ transform:translateY\(-12px\)/.test(css),
  'must not redo leftover homepage shop-card lift (PR #278)'
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
  /\.sc:hover \{ transform:translateY\(-16px\) scale\(1\.025\);/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover \{/.test(css),
  'must not redo leftover unused .sc card lift (PR #277)'
);
assert(
  /\.sc:hover img \{ transform:scale\(1\.1\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.sc:hover img/.test(css),
  'must not redo leftover unused .sc photo zoom (PR #276)'
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
  index.includes('class="btn-prim">Ver Produtos') &&
  index.includes('class="btn-ghost">Encomendar por WhatsApp') &&
  index.includes('Ver Produtos') &&
  index.includes('Encomendar por WhatsApp') &&
  index.includes('<button class="nav-order" onclick="irParaEncomenda()">') &&
  index.includes('🛒 Encomendar'),
  'homepage hero CTAs and leftover header Encomendar stay'
);
assert(
  index.includes('<span class="mb-label" id="mb-cart-label">Carrinho</span>') &&
  index.includes('<span class="mb-label">Promoções</span>') &&
  index.includes('<span class="mb-label">WhatsApp</span>') &&
  index.includes('<span class="mb-label">Como Chegar</span>'),
  'visible leftover 4-item bar labels stay'
);
assert(
  category.includes('Ver produto') &&
  /class="seo-text-link"/.test(category),
  'Frutas cards should keep leftover Ver produto text links'
);
assert(
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('class="btn-prim seo-order-link"') &&
  product.includes('href="/?produto=banana-madeira#produtos"'),
  'Banana Madeira should keep leftover Ver no catálogo e encomendar + catalog href'
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
  !/<button[^>]*class="mobile-close"[^>]*type="button"/.test(index),
  'must not invent leftover type="button" on leftover hamburger / leftover Encomendar / leftover mobile-close'
);
assert(
  index.includes('type="submit" class="btn-wa"') &&
  /https:\/\/wa\.me\/351932699850/.test(index),
  'leftover order WhatsApp type=submit leftover .btn-wa and leftover wa.me stay'
);

if (failures.length) {
  console.error('check-homepage-nav-order-hover-lift failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-homepage-nav-order-hover-lift: ok');
