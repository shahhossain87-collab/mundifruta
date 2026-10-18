#!/usr/bin/env node
/**
 * Guards leftover homepage Encontre-nos tel / mailto tap targets on phones.
 * Complementary to leftover homepage footer-links tap (PR #291), leftover
 * homepage footer-credit tap (PR #290), leftover catalog header-logo tap
 * (PR #289), leftover catalog footer tap (PR #288), leftover wrapping-nav
 * tap (PR #285), leftover breadcrumb tap (PR #286), leftover category-card
 * product-title tap (PR #287), leftover category-card Ver produto (PR #281),
 * leftover product-page order CTA (PR #270), leftover Encontre-nos hover
 * lift (PR #280), leftover contact-link forest ring (PR #188), and leftover
 * contact-link hover-on-touch (PR #138); does not redo leftover footer shop
 * links, leftover wrapping-nav expansion (PR #218), leftover footer Cabazes
 * / Promoções / Avaliações (PR #229), leftover footer Ervas / Época
 * (PR #230), leftover forest wordmark (PR #196), or leftover Morada maps
 * (PR #227).
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
  /\.contact-card a \{ display:inline-flex; align-items:center; \}/.test(css) &&
  !/\.contact-card p, \.contact-card a \{[^}]*display:\s*inline-flex/.test(css),
  'leftover .contact-card a should be inline-flex and vertically centered, hugging the label on desktop'
);

assert(
  /@media \(max-width:640px\) \{[\s\S]*\.contact-card a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'phones (max-width:640px) should make leftover homepage Encontre-nos tel / mailto min-height:44px'
);

assert(
  /<a href="tel:932699850">932 699 850<\/a>/.test(index) &&
  /<a href="mailto:shahhossain87@gmail.com">shahhossain87@gmail.com<\/a>/.test(index),
  'homepage Encontre-nos should keep leftover 932 699 850 tel and leftover shahhossain87@gmail.com mailto'
);

assert(
  /<h4>Morada<\/h4>\s*<p>Av de Portugal, Centro Cívico<br>Loja 24-C, 2790-129 Carnaxide<\/p>/.test(index) &&
  /<h4>Horário<\/h4>\s*<p>Segunda – Domingo<br>8:00 – 20:00<\/p>/.test(index),
  'homepage Encontre-nos Morada / Horário should stay leftover paragraphs, not invented tap-target links'
);

assert(
  /<h4>Telefone \/ WhatsApp<\/h4>/.test(index) &&
  /<h4>Email<\/h4>/.test(index),
  'homepage Encontre-nos headings should stay leftover Telefone / WhatsApp and Email'
);

assert(
  /<div class="footer-credit">Desenvolvido por <a href="mailto:shahhossain050187@gmail.com">Shah Hossain<\/a><\/div>/.test(index),
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
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(category) &&
  /<nav class="seo-nav" aria-label="Navegação principal">\s*<a href="\.\.\/\.\.\/">Início<\/a>\s*<a href="\.\.\/\.\.\/categorias\/frutas\/">Frutas<\/a>\s*<a href="\.\.\/\.\.\/categorias\/legumes\/">Legumes<\/a>\s*<a href="\.\.\/\.\.\/categorias\/promocoes\/">Promoções<\/a>\s*<\/nav>/.test(product),
  'wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);

assert(
  category.includes('>Ver produto<') &&
  product.includes('Ver no catálogo e encomendar') &&
  product.includes('href="/?produto=melancia-1-4#produtos"'),
  'catalog Ver produto / Ver no catálogo e encomendar should stay'
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
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-header \.logo \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog header-logo tap target (PR #289)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-footer a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover catalog footer tap target (PR #288)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-nav a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover wrapping-nav tap target (PR #285)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-breadcrumbs a \{ min-height:44px; box-sizing:border-box; \}/.test(css),
  'should not redo leftover breadcrumb tap target (PR #286)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-product-card h2 a \{ display:block; width:100%; min-height:44px; \}/.test(css),
  'should not redo leftover category-card product-title tap target (PR #287)'
);
assert(
  /display:inline-block; margin-top:14px; text-decoration:none;/.test(css) &&
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-order-link \{ width:100%; min-height:48px/.test(css),
  'should not redo leftover product-page seo-order-link full-width CTA (PR #270)'
);
assert(
  !/@media \(max-width:640px\) \{[\s\S]*\.seo-product-card \.seo-text-link \{ width:100%; min-height:44px/.test(css),
  'should not redo leftover category-card Ver produto tap target (PR #281)'
);
assert(
  /\.contact-card:hover \{ transform:translateY\(-6px\); box-shadow:var\(--sh-lg\); \}/.test(css) &&
  !/@media \(hover:hover\) \{[\s\S]*\.contact-card:hover/.test(css),
  'should not redo leftover Encontre-nos hover-capable card lift (PR #280)'
);
assert(
  !/\.contact-card a:focus-visible/.test(css) &&
  !/\.footer-credit a:focus-visible/.test(css) &&
  !/\.footer-links a:focus-visible/.test(css),
  'should not redo leftover contact-card / footer-credit / footer-links forest rings (PR #188 / #223 / #181)'
);
assert(
  !/\.seo-header \.logo \{[^}]*color:\s*var\(--forest\)/.test(css),
  'should not redo leftover forest wordmark on white catalog headers (PR #196)'
);
assert(
  /<a href="\$\{homePath\}">Início<\/a>\s*<a href="\$\{homePath\}categorias\/frutas\/">Frutas<\/a>\s*<a href="\$\{homePath\}categorias\/legumes\/">Legumes<\/a>\s*<a href="\$\{homePath\}categorias\/promocoes\/">Promoções<\/a>/.test(generator) &&
  !/<nav class="seo-nav"[^>]*>[\s\S]*ervas-frescas/.test(generator),
  'generator wrapping nav should stay leftover Início / Frutas / Legumes / Promoções'
);
assert(
  !index.includes('>Cabazes<') || !/<div class="footer-links">[\s\S]*>Cabazes</.test(index),
  'should not redo leftover footer Cabazes / Promoções / Avaliações shop-links (PR #229)'
);
assert(
  !/<div class="footer-links">[\s\S]*>Ervas</.test(index) &&
  !/<div class="footer-links">[\s\S]*>Época</.test(index),
  'should not redo leftover footer Ervas / Época shop-links (PR #230)'
);
const contactGrid = index.match(/<div class="contact-grid">[\s\S]*?<div class="map-wrap/)?.[0] || '';
assert(
  contactGrid.includes('<h4>Morada</h4>') &&
  !/href="https:\/\/(www\.)?google\.com\/maps/.test(contactGrid) &&
  !/href="https:\/\/maps\.app\.goo\.gl/.test(contactGrid),
  'should not invent leftover Morada maps tap-target (PR #227)'
);

if (failures.length) {
  console.error('check-contact-card-tap failed:\n' + failures.map(item => ` - ${item}`).join('\n'));
  process.exit(1);
}
console.log('check-contact-card-tap: ok');
