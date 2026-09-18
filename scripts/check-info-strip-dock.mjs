#!/usr/bin/env node
/**
 * Static checks: desktop social dock must not cover the homepage info strip,
 * and the Google reviews CTA must hug its label.
 * Complementary to PRs #2–#36 (does not redo catalog-order / shop-map / footer gutters).
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
  'desktop info strip clears the social dock',
  /\.info-strip-inner \{\s*max-width: min\(1280px, calc\(100% - 200px\)\);\s*margin-right: 200px;/.test(css)
);
ok(
  'info-strip clearance is desktop-only (min-width 769px)',
  css.includes('/* Desktop social dock clearance for leftover homepage chrome.')
  && /@media \(min-width:769px\) \{[\s\S]*\.info-strip-inner \{/.test(css)
);
ok(
  'reviews CTA hugs its label and has a 44px tap target',
  /\.reviews-cta \{[\s\S]*width:max-content;[\s\S]*min-height:44px;/.test(css)
);
ok(
  'mobile still hides the social dock and the info strip under 700px',
  css.includes('.social-panel { display:none !important; }')
  && /@media \(max-width:700px\) \{[\s\S]*\.info-strip,/.test(css)
);
ok(
  'does not redo catalog/order/QS/consent (PR #36), shop-map (PR #35), or footer (PR #34) gutters',
  !css.includes('.product-container {\n        max-width: min(1280px, calc(100% - 180px))')
  && !css.includes('#contacto .contact-grid')
  && !css.includes('footer { position:relative; z-index:901; }')
  && !/\.footer-links\s*\{[^}]*margin-right:\s*180px/.test(css)
  && !css.includes('#quem-somos {\n        max-width: min(1080px, calc(100% - 200px))')
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
  'copy, WhatsApp URLs, hours, and pickup line are unchanged',
  html.includes('https://wa.me/351932699850?text=Ol%C3%A1%20MUNDIFRUTA!')
  && html.includes('Seg–Dom: 8:00 – 20:00')
  && html.includes('Levantamento na Loja')
  && html.includes('Ver todas as avaliações no Google →')
  && html.includes('Av de Portugal, Centro Cívico')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
