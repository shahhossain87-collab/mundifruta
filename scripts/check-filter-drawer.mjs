#!/usr/bin/env node
/**
 * Static checks for the Phase A filter drawer vs the mobile bar,
 * plus the Fruta da Época featured CTA wiring.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const css = readFileSync(resolve(root, 'css/estilos.css'), 'utf8');
const js = readFileSync(resolve(root, 'js/app.js'), 'utf8');
const fails = [];

function assert(cond, msg) {
  if (!cond) fails.push(msg);
}

const verao = html.match(/id="verao"[\s\S]{0,500}?shop-link[^>]*>/);
assert(verao, 'featured Época section still has a shop-link');
assert(
  verao && /abrirCatalogo\('epoca'\)/.test(verao[0]),
  'Época featured CTA must open the epoca catalog category'
);
assert(
  !/id="verao"[\s\S]{0,500}?abrirCatalogo\('frutas'\)/.test(html),
  'Época featured CTA must not open the full frutas list'
);

assert(/id="filtbtn"/.test(html), 'Filtros button has id=filtbtn');
assert(
  /aria-expanded="false"/.test(html) && /aria-controls="shop-sidebar"/.test(html),
  'Filtros button exposes aria-expanded and aria-controls'
);

const drawerBlock = css.match(/\/\* Mobile\/tablet: sidebar vira gaveta[\s\S]*?body\.filtros-open \.mobile-bar[^}]+}/);
assert(drawerBlock, 'mobile drawer CSS block exists');
if (drawerBlock) {
  const zSide = drawerBlock[0].match(/\.shop-sidebar\s*\{[^}]*z-index:(\d+)/);
  const zBack = drawerBlock[0].match(/\.shop-backdrop\s*\{[^}]*z-index:(\d+)/);
  const zBar = css.match(/\.mobile-bar\s*\{[^}]*z-index:(\d+)/);
  assert(zSide && Number(zSide[1]) > 1200, `drawer z-index must sit above the mobile bar (got ${zSide && zSide[1]})`);
  assert(zBack && Number(zBack[1]) > 1200, `backdrop z-index must sit above the mobile bar (got ${zBack && zBack[1]})`);
  assert(zBar && Number(zBar[1]) === 1200, 'mobile-bar z-index stays 1200');
  assert(/body\.filtros-open \.mobile-bar \{ pointer-events:none; \}/.test(css), 'mobile bar cannot intercept taps while the drawer is open');
  assert(/min-height:44px/.test(css.match(/\.filtbtn\s*\{[^}]+}/)[0]), 'Filtros tap target is 44px');
  assert(/flex:0 0 44px/.test(drawerBlock[0]), 'drawer close control does not shrink in the column');
}

assert(/function sincronizarFiltros/.test(js), 'filter drawer syncs expanded/hidden state');
assert(/sb\.inert = !abrir/.test(js), 'closed mobile drawer is inert so it cannot steal focus');
assert(/close\.focus\(\)/.test(js), 'opening the drawer moves focus to the close control');

if (fails.length) {
  console.error('check-filter-drawer failed:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('check-filter-drawer: ok');
