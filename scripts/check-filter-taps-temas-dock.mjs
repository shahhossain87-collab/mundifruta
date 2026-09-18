#!/usr/bin/env node
/**
 * Static checks: Phase A sidebar category/filter controls are 44px taps,
 * and desktop review theme chips clear the social dock.
 * Complementary to PRs #2–#41 (does not redo filtbtn/close 44px, Tab trap,
 * 16px iOS fields, or other dock gutters).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const js = readFileSync(join(root, 'js/app.js'), 'utf8');

const checks = [];
function ok(name, pass, detail = '') {
  checks.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

ok(
  'sidebar category tabs are 44px tap targets',
  /\.shop-sidebar \.cat-tab \{[^}]*min-height:44px;/.test(css)
);
ok(
  'sidebar subcategory chips are 44px tap targets',
  /\.shop-sidebar \.subcat-chip \{ min-height:44px; \}/.test(css)
);
ok(
  'sidebar filter chips are 44px tap targets',
  /\.shop-sidebar \.filter-chip \{[^}]*min-height:44px;/.test(css)
);
ok(
  'sidebar price filter is 44px tap target',
  /\.shop-sidebar \.filter-select \{ min-height:44px; \}/.test(css)
);
ok(
  'desktop theme chips clear the social dock',
  /\.temas-row \{\s*max-width: min\(1000px, calc\(100% - 180px\)\);\s*margin-right: 180px;\s*margin-left: auto;/.test(css)
);
ok(
  'theme-chip gutter is desktop-only (min-width 769px)',
  /@media \(min-width:769px\) \{\s*\.temas-row \{/.test(css)
);
ok(
  'mobile still hides the social dock',
  css.includes('.social-panel { display:none !important; }')
);
ok(
  'does not redo Filtros/close 44px, drawer z-index, or inert (PR #40)',
  !/\.filtbtn \{[^}]*min-height:44px/.test(css)
  && !/flex:0 0 44px/.test(css)
  && !css.includes('z-index:1300')
  && !js.includes('inert')
);
ok(
  'does not redo open-drawer Tab trap or Phase A 16px (PR #41)',
  !js.includes('prenderTabFiltros')
  && !js.includes('gavetaFiltrosAberta')
  && !/\.shop-main \.search-input[\s\S]{0,180}font-size:\s*16px/.test(css)
);
ok(
  'does not redo reviews-grid / reviews-cta / info-strip gutters (PR #36/#37)',
  !/\.reviews-grid \{\s*max-width: min\(1000px, calc\(100% - 180px\)\)/.test(css)
  && !/\.reviews-cta \{[\s\S]*width:max-content/.test(css)
  && !/\.info-strip-inner \{\s*max-width: min\(1280px, calc\(100% - 200px\)\)/.test(css)
);
ok(
  'does not change chip copy, 4-item mobile bar, or theme labels',
  html.includes('>Fale Connosco<')
  && (html.match(/class="mb-item"/g) || []).length === 4
  && html.includes('id="temas-row"')
  && js.includes('avaliacoesInfo.temas')
  && js.includes('class="tema-chip"')
);
ok(
  'cache-bust CSS only; app.js and extras.js unchanged',
  html.includes('estilos.css?v=46')
  && html.includes('app.js?v=36')
  && html.includes('extras.js?v=21')
);

const failed = checks.filter(c => !c.pass);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\n${checks.length} checks passed.`);
