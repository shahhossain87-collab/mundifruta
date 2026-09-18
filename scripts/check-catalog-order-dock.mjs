#!/usr/bin/env node
/**
 * Static checks: desktop social dock must not cover catalog, cabazes,
 * order checkout, how-to-order, reviews, Quem Somos, or the cookie banner.
 * Complementary to PRs #2–#35 (does not redo shop-map-dock-gutter / footer-social-gutter).
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
  'desktop shortcuts and mini order steps clear the social dock',
  /\.cat-quick,\s*\.order-steps-mini \{\s*max-width: min\(1000px, calc\(100% - 180px\)\);\s*margin-right: 180px;/.test(css)
);
ok(
  'desktop catalog and cabaz container clears the social dock',
  /\.product-container \{\s*max-width: min\(1280px, calc\(100% - 180px\)\);\s*margin-right: 180px;/.test(css)
);
ok(
  'desktop how-to-order steps clear the social dock',
  /\.steps-grid \{\s*max-width: min\(1180px, calc\(100% - 180px\)\);\s*margin-right: 180px;/.test(css)
);
ok(
  'desktop order form clears the social dock',
  /\.order-inner \{\s*max-width: min\(920px, calc\(100% - 180px\)\);\s*margin-right: 180px;/.test(css)
);
ok(
  'desktop reviews grid clears the social dock',
  /\.reviews-grid \{\s*max-width: min\(1000px, calc\(100% - 180px\)\);\s*margin-right: 180px;/.test(css)
);
ok(
  'desktop Quem Somos clears the social dock',
  /#quem-somos \{\s*max-width: min\(1080px, calc\(100% - 200px\)\);\s*margin-right: 200px;/.test(css)
);
ok(
  'desktop cookie banner clears the social dock',
  /\.consent \{\s*right: 192px;\s*max-width: min\(760px, calc\(100% - 204px\)\);/.test(css)
);
ok(
  'dock clearance is desktop-only (min-width 769px)',
  css.includes('/* Desktop social dock clearance for leftover shop surfaces.')
  && /@media \(min-width:769px\) \{[\s\S]*\.product-container \{[\s\S]*\.consent \{/.test(css)
);
ok(
  'mobile still hides the social dock',
  css.includes('.social-panel { display:none !important; }')
);
ok(
  'does not redo shop-head/carousel/map gutter (PR #35) or footer gutter (PR #34)',
  !css.includes('.shop-feature-head,\n      .carousel-wrap {')
  && !css.includes('#contacto .contact-grid')
  && !css.includes('footer { position:relative; z-index:901; }')
  && !/\.footer-links\s*\{[^}]*margin-right:\s*180px/.test(css)
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
  'copy, WhatsApp URLs, and map title are unchanged',
  html.includes('https://wa.me/351932699850?text=Ol%C3%A1%20MUNDIFRUTA!')
  && html.includes('title="Localização MUNDIFRUTA"')
  && html.includes('Av de Portugal, Centro Cívico')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} checks passed.`);
