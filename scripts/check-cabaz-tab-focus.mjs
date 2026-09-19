#!/usr/bin/env node
/**
 * Static checks for leftover Phase A category navigation:
 * Cabazes tab highlight, filter-drawer focus restore, shop crumb links.
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

assert(/estilos\.css\?v=51/.test(html), 'index.html cache-busts estilos.css?v=51');
assert(/app\.js\?v=40/.test(html), 'index.html cache-busts app.js?v=40');
assert(/extras\.js\?v=21/.test(html), 'extras.js cache token stays ?v=21');

const crumbs = html.match(/<nav class="shop-crumbs"[\s\S]*?<\/nav>/);
assert(crumbs, 'shop crumbs nav exists');
assert(crumbs && /<a href="#inicio">Início<\/a>/.test(crumbs[0]), 'Início crumb links to #inicio');
assert(crumbs && /<a href="#produtos">Loja<\/a>/.test(crumbs[0]), 'Loja crumb links to #produtos');
assert(crumbs && /id="crumb-cat"/.test(crumbs[0]), 'current-category crumb stays a <b>');
assert(!crumbs || !/<span>Início<\/span>/.test(crumbs[0]), 'Início is no longer a plain span');

const crumbCss = css.match(/\.shop-crumbs a\s*\{[^}]+}/);
assert(crumbCss, 'shop crumb links have CSS');
assert(crumbCss && /min-height:44px/.test(crumbCss[0]), 'shop crumb links are at least 44px tall');
assert(/\.shop-crumbs a:focus-visible/.test(css), 'shop crumb links keep a visible keyboard ring');

assert(/function ativarSeparador\(id\)/.test(js), 'shared tab highlighter exists');
assert(/ativarSeparador\('tab-cabazes'\)/.test(js), 'abrirCabazes marks the Cabazes tab selected');
assert(/ativarSeparador\(\(btn && btn\.id\) \|\| `tab-\$\{cat\}`\)/.test(js), 'mostrarCategoria still highlights the matching catalog tab');
assert(/function devolverFocoFiltros\(/.test(js), 'closing the drawer restores focus to Filtros');
assert(/filt\.focus\(\)/.test(js), 'focus returns to .filtbtn');
assert(/if \(sb\.classList\.contains\('open'\)\) \{\s*fecharFiltros\(\);/.test(js), 'toggleFiltros closes through fecharFiltros so focus is restored');
assert(/if \(estavaAberto\) devolverFocoFiltros\(\);/.test(js), 'focus restore only runs when the drawer was open');

assert(
  /id="verao"[\s\S]{0,500}?abrirCatalogo\('frutas'\)/.test(html),
  'does not redo the Época featured CTA destination (stays frutas; PR #40)'
);
assert(!/sb\.inert/.test(js), 'does not add drawer inert (PR #40)');
assert(
  !/role="dialog"/.test(html.match(/id="shop-sidebar"[^>]*>/)?.[0] || ''),
  'does not turn the sidebar into a dialog (PR #40)'
);

if (fails.length) {
  console.error('check-cabaz-tab-focus failed:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('check-cabaz-tab-focus: ok');
