#!/usr/bin/env node
/**
 * Static checks: desktop social dock must not cover the add-to-cart
 * cross-sell popup. Complementary to PRs #2–#38 (does not redo hero /
 * info-strip / catalog-order / shop-map / footer gutters, or cross-sell
 * names / focus / timer / alts).
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
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

ok(
  'desktop cross-sell popup sits left of the social dock',
  /\.cs-pop \{\s*left: auto;\s*right: 200px;\s*width: min\(94vw, 520px, calc\(100vw - 224px\)\);\s*transform: none;\s*animation-name: cs-up-dock;/.test(css)
);
ok(
  'cs-pop clearance is desktop-only (min-width 769px)',
  css.includes('/* Desktop social dock clearance for leftover add-to-cart suggestions.')
  && /@media \(min-width:769px\) \{[\s\S]*\.cs-pop \{/.test(css)
);
ok(
  'desktop popup animation does not keep the mobile -50% centering transform',
  css.includes('@keyframes cs-up-dock')
  && /@keyframes cs-up-dock \{\s*from \{ opacity: 0; transform: translateY\(16px\); \}/.test(css)
);
ok(
  'mobile still hides the social dock and keeps the centered cs-pop',
  css.includes('.social-panel { display:none !important; }')
  && /@media \(max-width:600px\) \{[\s\S]*\.cs-pop \{ bottom:74px; \}/.test(css)
  && css.includes("position:fixed; left:50%; bottom:84px; transform:translateX(-50%)")
);
ok(
  'does not redo hero (PR #38), info-strip (PR #37), catalog/order/QS/consent (PR #36), shop-map (PR #35), or footer (PR #34) gutters',
  !css.includes('.hero-content {\n        max-width: min(860px, calc(100% - 200px))')
  && !css.includes('.info-strip-inner {\n        max-width: min(1280px, calc(100% - 200px))')
  && !css.includes('.product-container {\n        max-width: min(1280px, calc(100% - 180px))')
  && !css.includes('#contacto .contact-grid')
  && !css.includes('footer { position:relative; z-index:901; }')
  && !/\.footer-links\s*\{[^}]*margin-right:\s*180px/.test(css)
  && !css.includes('#quem-somos {\n        max-width: min(1080px, calc(100% - 200px))')
  && !css.includes('.reviews-cta {\n        display:flex; align-items:center; justify-content:center;')
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
  && html.includes('Também pode gostar')
  && html.includes('Continuar sem adicionar')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
