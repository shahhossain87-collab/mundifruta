#!/usr/bin/env node
/**
 * Guards the complementary storefront tweaks in this change:
 * - featured section CTAs are real in-page links
 * - footer includes the existing shopping hashes
 * - JSON-LD reuses published store names/slogan
 * - modal add controls expose an accessible name
 * - mobile price-sort stays at 16px (no iOS input zoom)
 * - 404 page points home without new business copy
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const missing = readFileSync(join(root, '404.html'), 'utf8');
const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

assert(html.includes('estilos.css?v=38'), 'estilos.css cache bust should be v=38');
assert(html.includes('app.js?v=33'), 'app.js cache bust should be v=33');

const jsonLdMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/);
assert(jsonLdMatch, 'JSON-LD script block missing');
let data = null;
if (jsonLdMatch) {
  try {
    data = JSON.parse(jsonLdMatch[1]);
  } catch (e) {
    errors.push('JSON-LD is not valid JSON: ' + e.message);
  }
}
if (data) {
  assert(data.alternateName === 'Mundi Fruta', 'JSON-LD alternateName should reuse the existing Mundi Fruta name');
  assert(data.slogan === 'Fruta & Legumes Frescos Todos os Dias', 'JSON-LD slogan should reuse the existing homepage heading');
  assert(data.telephone === '+351932699850', 'JSON-LD must keep the published phone number');
}

assert(
  /<a class="shop-link" href="#produtos">Ver catálogo completo →<\/a>/.test(html),
  'Promoções CTA should be a #produtos link'
);
assert(
  html.includes('href="#produtos" onclick="mostrarCategoria(\'frutas\''),
  'Frutas featured CTAs should switch to the frutas tab and keep #produtos'
);
assert(
  html.includes('href="#produtos" onclick="mostrarCategoria(\'legumes\''),
  'Legumes featured CTA should switch to the legumes tab and keep #produtos'
);
assert(!/<button class="shop-link"/.test(html), 'Featured CTAs should not stay as non-link buttons');

const footer = html.slice(html.indexOf('class="footer-links"'), html.indexOf('class="footer-credit"'));
['#produtos', '#cabazes', '#promocoes', '#avaliacoes', '#quem-somos', '#encomenda', '#contacto'].forEach((hash) => {
  assert(footer.includes(`href="${hash}"`), `Footer should include ${hash}`);
});

assert(html.includes('<address>Av de Portugal, Centro Cívico'), 'Contact address should use the address element');
assert(
  /id="product-modal-add"[^>]*aria-label="Adicionar ao carrinho"/.test(html),
  'Product modal add button needs an accessible name'
);
assert(
  /id="cabaz-modal-add"[^>]*aria-label="Adicionar cabaz ao carrinho"/.test(html),
  'Cabaz modal add button needs an accessible name'
);
assert(
  app.includes('addBtn.setAttribute(\'aria-label\', `Adicionar ${item.nome} ao carrinho`)'),
  'Modal add labels should include the product name when opened'
);

assert(
  /font-size:\s*16px/.test(css) && css.includes('.price-sort'),
  'Price sort should use 16px on small screens'
);
assert(css.includes('.shop-link:focus-visible'), 'Featured section links need a keyboard focus ring');
assert(css.includes('.contact-card address'), 'Address element should inherit contact-card type styles');

assert(missing.includes('noindex'), '404 page should stay out of the index');
assert(missing.includes('href="/"'), '404 page should link to the homepage');
assert(!/€/.test(missing), '404 page should not invent prices');
assert(!/932\s*699|wa\.me/.test(missing), '404 page should not invent contact details');

if (errors.length) {
  console.error('check-nav-fallbacks failed:');
  errors.forEach((err) => console.error(' -', err));
  process.exit(1);
}

console.log('check-nav-fallbacks: ok');
