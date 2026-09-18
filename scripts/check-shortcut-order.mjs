#!/usr/bin/env node
/**
 * Guards the complementary storefront tweaks in this change:
 * - category shortcuts expose a visible-label accessible name
 * - JSON-LD advertises existing hours + WhatsApp pickup orders
 * - mobile WhatsApp uses the same greeting as "Fale Connosco"
 * - order form offers a next/send keyboard on the required fields
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const css = readFileSync(join(root, 'css/estilos.css'), 'utf8');
const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

const jsonLdMatch = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/);
assert(jsonLdMatch, 'JSON-LD script block missing');
let data = null;
if (jsonLdMatch) {
  try {
    data = JSON.parse(jsonLdMatch[1]);
  } catch (e) {
    errors.push('JSON-LD is not valid JSON: ' + e.message);
  }
}

if (data) {
  assert(data.openingHours === 'Mo-Su 08:00-20:00', 'JSON-LD openingHours should reuse the published 8h–20h schedule');
  assert(data.potentialAction && data.potentialAction['@type'] === 'OrderAction', 'JSON-LD OrderAction missing');
  const target = data.potentialAction && data.potentialAction.target;
  assert(target && target.urlTemplate === 'https://wa.me/351932699850', 'OrderAction should target the existing WhatsApp number');
  assert(
    data.potentialAction.deliveryMethod === 'https://purl.org/goodrelations/v1#DeliveryModePickUp',
    'OrderAction should stay pickup-only'
  );
}

const quickBlock = html.slice(html.indexOf('class="cat-quick"'), html.indexOf('class="order-steps-mini"'));
assert(quickBlock.includes('class="cat-quick"'), 'Category shortcuts block missing');
const quickImgs = [...quickBlock.matchAll(/<img\b([^>]*)>/g)].map((m) => m[1]);
assert(quickImgs.length === 6, `Expected 6 shortcut images, found ${quickImgs.length}`);
quickImgs.forEach((attrs, i) => {
  assert(/\balt=""/.test(attrs), `Shortcut image ${i + 1} should have empty alt (decorative)`);
  assert(/\baria-hidden="true"/.test(attrs), `Shortcut image ${i + 1} should be aria-hidden`);
});
assert(
  !/alt="Carrinho de compras vazio/.test(quickBlock),
  'Cart shortcut should not announce a stale empty-cart description'
);
assert((quickBlock.match(/type="button"/g) || []).length >= 6, 'Shortcut controls should be type=button');

assert(
  html.includes('wa.me/351932699850?text=Ol%C3%A1%20MUNDIFRUTA!%20Gostaria%20de%20fazer%20uma%20pergunta.'),
  'Mobile WhatsApp tab should reuse the existing Fale Connosco greeting'
);
assert(
  /id="cust-nome"[^>]*enterkeyhint="next"/.test(html),
  'Name field should use enterkeyhint=next'
);
assert(
  /id="cust-telemovel"[^>]*enterkeyhint="send"/.test(html),
  'Phone field should use enterkeyhint=send'
);
assert(
  /class="nav-order"[^>]*type="button"|type="button"[^>]*class="nav-order"/.test(html),
  'Header Encomendar should be type=button'
);
assert(
  css.includes('.cat-quick-btn:focus-visible'),
  'Shortcut tiles need a keyboard focus ring'
);

if (errors.length) {
  console.error('check-shortcut-order failed:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}
console.log('check-shortcut-order: ok');
