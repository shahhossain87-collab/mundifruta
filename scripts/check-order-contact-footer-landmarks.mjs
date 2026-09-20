#!/usr/bin/env node
/**
 * Guards for leftover how-to / order / contact / footer landmarks.
 * Complementary to PR #75 (mobile-menu / cat-quick / order-list / order-form,
 * not these section wrappers), PR #74 (main-nav / mobile-bar),
 * PR #34 (desktop social-dock landmark + footer gutter, not footer-links nav),
 * PR #51 (footer-links 44px, not landmark), PR #26 (footer extra hashes),
 * PR #33 (Privacidade as button), PR #8 (footer logo #inicio / tappable address),
 * PR #11 (how-to emoji icons, not the section landmark).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=38'),
  'index.html should keep estilos.css?v=64 and app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=21') && html.includes('js/dados.js?v=25'),
  'extras.js / dados.js cache tokens should stay ?v=21 / ?v=25'
);
assert(
  /<section class="section alt fi" id="como-funciona" aria-label="Como Encomendar">/.test(html) &&
  html.includes('<h2 class="section-title">Como Encomendar</h2>'),
  'leftover #como-funciona should be a section named from the existing Como Encomendar title'
);
assert(
  /<section class="section dark" id="encomenda" aria-label="Encomendar Online">/.test(html) &&
  html.includes('<h2 class="section-title">Encomendar Online</h2>'),
  'leftover #encomenda should be a section named from the existing Encomendar Online title'
);
assert(
  /<section class="section" id="contacto" aria-label="Encontre-nos">/.test(html) &&
  html.includes('<h2 class="section-title">Encontre-nos</h2>'),
  'leftover #contacto should be a section named from the existing Encontre-nos title'
);
assert(
  /<nav class="footer-links" aria-label="MUNDIFRUTA">/.test(html) &&
  html.includes('<div class="footer-logo">MUNDI<span>FRUTA</span></div>') &&
  html.includes('href="creditos.html">Créditos das fotos</a>\n    </nav>'),
  'leftover .footer-links should be a nav named from the existing footer logo'
);
assert(
  /<div class="mobile-menu" id="mobile-menu">/.test(html) &&
  /<div class="cat-quick">/.test(html) &&
  /<ul class="order-items" id="order-list">/.test(html) &&
  /<form class="order-form" id="order-form" onsubmit="enviarWhatsApp\(event\)">/.test(html),
  'must not redo leftover menu / category / order-list / order-form landmarks (PR #75)'
);
assert(
  /<nav id="main-nav">/.test(html) &&
  /<nav class="mobile-bar" id="mobile-bar">/.test(html),
  'must not redo leftover main-nav / mobile-bar landmarks (PR #74)'
);
assert(
  /<div class="social-panel">/.test(html) &&
  !html.includes('aria-label="Contactos rápidos"'),
  'must not redo leftover social-dock landmark (PR #34)'
);
assert(
  /<button class="hamburger" onclick="toggleMenu\(\)" aria-label="Menu">/.test(html) &&
  !html.includes('aria-expanded="false"'),
  'must not redo leftover hamburger expanded (PR #70)'
);
assert(
  html.includes('<button class="cat-quick-btn" onclick="abrirCatalogo(\'frutas\')">') &&
  html.includes('href="#" onclick="abrirPrivacidade();return false;">Privacidade</a>'),
  'must not redo leftover shortcut types (PR #25) or leftover Privacidade button (PR #33)'
);
assert(
  !html.includes('for="cust-nome"') &&
  !html.includes('id="cust-nome-label"') &&
  !html.includes('name="nome"') &&
  !html.includes('name="telemovel"') &&
  !html.includes('name="pesquisa"'),
  'must not redo leftover order visible labels (PR #4), order names (PR #21), or catalog names (PR #73)'
);
assert(
  app.includes('aria-label="Diminuir"') &&
  app.includes('aria-label="Aumentar"') &&
  app.includes('aria-label="Menos"') &&
  app.includes('aria-label="Mais"'),
  'must not redo leftover catalog qty labels (PR #5 / #67) or cart stepper names (PR #31)'
);
assert(
  /id="product-modal-add"[^>]*>＋<\/button>/.test(html) &&
  html.includes('class="btn-wa cabaz-modal-add" id="cabaz-modal-add">＋</button>'),
  'product/cabaz modal add buttons stay a visible plus (PR #2 / #26)'
);
assert(
  html.includes('role="dialog" aria-label="Sugestões de produtos">') &&
  !html.includes('id="cs-pop" hidden role="dialog" aria-modal="true"') &&
  html.includes('<div class="cabaz-modal-box">'),
  'must not redo leftover CS aria-modal / cabaz dialog role (PR #73)'
);
assert(
  !/\.btn-wa \{[^}]*min-height:44px/.test(css) &&
  !/\.hamburger \{[^}]*min-(width|height):44px/.test(css) &&
  !html.includes('role="tabpanel"') &&
  !/\.footer-links \{[^}]*min-height:44px/.test(css),
  'must not redo leftover 44px tap-target PRs, catalog tabpanel, or footer-link size (PR #51)'
);

if (failures.length) {
  console.error('check-order-contact-footer-landmarks failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-order-contact-footer-landmarks: ok');
