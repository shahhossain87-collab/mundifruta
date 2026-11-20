#!/usr/bin/env node
/**
 * Guards leftover Combina bem / Complete o seu pedido cs-card lift:
 * hover-capable pointers only. Complementary to leftover Encontre-nos
 * contact-card lift (PR #280), leftover homepage category-tile lift
 * (PR #279), leftover homepage shop-card lift (PR #278), leftover unused
 * .sc card lift (PR #277), leftover unused .sc photo zoom (PR #276),
 * leftover homepage Quem Somos gallery hover zoom (PR #275), leftover
 * homepage featured-photo hover zoom (PR #274), leftover homepage
 * category-tile hover zoom (PR #273), leftover homepage shop-card hover
 * zoom (PR #272), leftover catalog category-card hover zoom (PR #271),
 * leftover Combina bem keyboard ring (PR #227), leftover Combina bem
 * hover:none reset (PR #116); leftover .cs-card lift slice of the
 * leftover hover-capable pass.
 * Does not redo leftover Encontre-nos contact-card lift (PR #280),
 * leftover Como Encomendar step-card lift (PR #117), leftover Combina
 * bem hover:none reset (PR #116), leftover wrapping-nav Ervas / Época /
 * Cabazes (PR #218), leftover catalog share photos (PR #215).
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

const csLift = css.match(/@media \(hover:\s*hover\) \{\s*\.cs-card:hover \{ transform:translateY\(-3px\); box-shadow:var\(--sh\); \}\s*\}/);
assert(csLift, 'leftover Combina bem cs-card lift should be inside @media (hover: hover)');

const csLiftRule = '.cs-card:hover { transform:translateY(-3px); box-shadow:var(--sh); }';
assert(
  (css.split(csLiftRule).length - 1) === 1,
  'leftover Combina bem cs-card lift must appear once, scoped to hover-capable pointers'
);
assert(
  !/@media \(hover:\s*none\) \{\s*\.cs-card:hover/.test(css) &&
  !/@media \(prefers-reduced-motion:\s*reduce\) \{\s*\.cs-card \{ transition: none; \}/.test(css),
  'must not redo leftover Combina bem hover:none / reduced-motion reset (PR #116)'
);

assert(
  /@media \(hover:\s*hover\) \{\s*\.cs-card:hover \{/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.contact-card:hover \{/.test(css),
  'must not redo leftover Encontre-nos contact-card lift (PR #280)'
);
assert(
  /\.contact-card:hover \{ transform:translateY\(-6px\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.contact-card:hover \{/.test(css),
  'leftover Encontre-nos contact-card lift stays unscoped (PR #280)'
);
assert(
  /\.step-card:hover \{ transform:translateY\(-10px\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:\s*hover\) \{\s*\.step-card:hover \{/.test(css),
  'must not redo leftover Como Encomendar step-card lift (PR #117)'
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
  extras.includes("return `<button class=\"cs-card\" type=\"button\" onclick=\"csAdd('${item._id}')\">") &&
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
  index.includes('Levante na Loja'),
  'homepage Como Encomendar should keep leftover 5 passos copy'
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
  index.includes('Ver Produtos') &&
  index.includes('Encomendar por WhatsApp'),
  'homepage hero CTAs should stay leftover Ver Produtos / Encomendar por WhatsApp'
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
  !index.includes('role="tabpanel"'),
  'must not redo leftover 44px tap-target / peach-ring / catalog tabpanel PRs'
);

if (failures.length) {
  console.error('check-homepage-cs-card-hover-lift failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-homepage-cs-card-hover-lift: ok');
