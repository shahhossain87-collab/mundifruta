#!/usr/bin/env node
/**
 * Guards for leftover cookie-banner / privacy-dialog Tab cycling.
 * Complementary to PR #8 (product/cabaz trap), PR #9 (hamburger trap),
 * PR #41 (filter-drawer trap), leftover welcome-offer trap in
 * mostrarOferta, PR #32 (consent aria-modal), PR #4 (consent vs bar),
 * PR #10 (cookie vs offer stacking / CS focus).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const extras = readFileSync(join(root, 'js/extras.js'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const app = readFileSync(join(root, 'js/app.js'), 'utf8');

const failures = [];
const assert = (cond, msg) => { if (!cond) failures.push(msg); };

assert(
  html.includes('css/estilos.css?v=64') && html.includes('js/app.js?v=38'),
  'index.html should keep estilos.css?v=64 and app.js?v=38'
);
assert(
  html.includes('js/extras.js?v=22'),
  'index.html should cache-bust extras.js?v=22'
);
assert(
  html.includes('js/dados.js?v=25'),
  'dados.js cache token should stay ?v=25'
);

assert(
  extras.includes('function rgpdFocusaveis') &&
  extras.includes('function ligarRgpdTrap') &&
  extras.includes('function sincronizarRgpdTrap') &&
  extras.includes("e.key !== 'Tab'") &&
  extras.includes("querySelector('.consent-yes')") &&
  extras.includes("querySelector('.privacy-close')"),
  'leftover cookie/privacy dialogs should Tab-cycle and focus Aceitar tudo / Fechar'
);

assert(
  extras.includes('sincronizarRgpdTrap();') &&
  extras.includes('focarRgpd();') &&
  extras.includes("document.getElementById('consent').hidden = false") &&
  extras.includes("document.getElementById('privacy-modal').hidden = false"),
  'leftover initConsent / abrirPrivacidade / reporConsentimento should wire the trap'
);

assert(
  extras.includes("if (offer && !offer.hidden) return [];") &&
  extras.includes('if (rgpdVisivel()) focarRgpd();'),
  'leftover cookie trap should yield to the welcome-offer trap and restore focus after Agora não'
);

assert(
  html.includes('role="dialog" aria-label="Preferências de privacidade"') &&
  html.includes('>Só essenciais</button>') &&
  html.includes('>Aceitar tudo</button>') &&
  html.includes('>Saber mais</button>') &&
  html.includes('Política de Privacidade') &&
  html.includes('>Repor consentimento</button>'),
  'visible leftover cookie / privacy copy must stay'
);

assert(
  !/aria-modal="true"/.test(html.match(/id="consent"[^>]*>/)?.[0] || ''),
  'must not redo leftover consent aria-modal (PR #32)'
);

assert(
  /\.consent\s*\{[^}]*bottom:\s*12px/.test(css),
  'must not redo leftover consent overlay vs bar (PR #4)'
);

assert(
  extras.includes('_revealKey') &&
  extras.includes('mostrarOferta') &&
  extras.includes("e.key === 'Escape'"),
  'must not redo leftover welcome-offer trap'
);

assert(
  !app.includes('ligarRgpdTrap') &&
  app.includes("if (e.key !== 'Escape') return"),
  'must not redo leftover product/cabaz/menu Escape in app.js (PR #8 / #9)'
);

if (failures.length) {
  console.error('check-consent-privacy-trap failed:\n' + failures.map(f => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('check-consent-privacy-trap: ok');
