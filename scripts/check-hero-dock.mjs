#!/usr/bin/env node
/**
 * Static checks: desktop social dock must not cover first-paint hero chips.
 * Complementary to PRs #2–#37 (does not redo info-strip / catalog-order /
 * shop-map / footer gutters).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

ok(
  'desktop hero content clears the social dock',
  /\.hero-content \{\s*max-width: min\(860px, calc\(100% - 200px\)\);\s*min-width: 0;\s*width: 100%;\s*margin-left: auto;\s*margin-right: 200px;/.test(css)
);
ok(
  'hero-content clearance is desktop-only (min-width 769px)',
  css.includes('/* Desktop social dock clearance for leftover first-paint hero chrome.')
  && /@media \(min-width:769px\) \{[\s\S]*\.hero-content \{/.test(css)
);
ok(
  'mobile still hides the social dock and hero chips under 700px',
  css.includes('.social-panel { display:none !important; }')
  && /@media \(max-width:700px\) \{[\s\S]*\.hero-chip \{ display:none; \}/.test(css)
);
ok(
  'does not redo info-strip (PR #37), catalog/order/QS/consent (PR #36), shop-map (PR #35), or footer (PR #34) gutters',
  !css.includes('.info-strip-inner {\n        max-width: min(1280px, calc(100% - 200px))')
  && !css.includes('.product-container {\n        max-width: min(1280px, calc(100% - 180px))')
  && !css.includes('#contacto .contact-grid')
  && !css.includes('footer { position:relative; z-index:901; }')
  && !/\.footer-links\s*\{[^}]*margin-right:\s*180px/.test(css)
  && !css.includes('#quem-somos {\n        max-width: min(1080px, calc(100% - 200px))')
  && !css.includes('.reviews-cta {\n      display:flex; align-items:center; justify-content:center;')
);
ok(
  'does not restyle chips, change the 4-item mobile bar, or convert Privacidade',
  html.includes('>Fale Connosco<')
  && html.includes('title="Encomendar via WhatsApp"')
  && (html.match(/class="mb-item"/g) || []).length === 4
  && /href="#" onclick="abrirPrivacidade\(\);return false;">Privacidade<\/a>/.test(html)
);
ok(
  'cache-bust CSS only; app.js and extras.js unchanged',
  html.includes('estilos.css?v=38') && html.includes('app.js?v=32') && html.includes('extras.js?v=21')
);
ok(
  'copy, WhatsApp URLs, hours, and pickup chip are unchanged',
  html.includes('https://wa.me/351932699850?text=Ol%C3%A1%20MUNDIFRUTA!')
  && html.includes('Seg–Dom: 8:00 – 20:00')
  && html.includes('🛍️ Levantamento na Loja')
  && html.includes('Comprar Agora')
  && html.includes('Av de Portugal, Centro Cívico')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
