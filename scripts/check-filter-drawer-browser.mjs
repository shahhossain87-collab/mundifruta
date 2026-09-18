#!/usr/bin/env node
/**
 * Headless Chrome checks: filter drawer stacks above the mobile bar,
 * and the Época featured CTA opens the epoca catalog category.
 */
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const require = createRequire(existsSync('/tmp/node_modules/puppeteer-core/package.json')
  ? '/tmp/package.json'
  : import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765/';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const fails = [];
const assert = (cond, msg) => { if (!cond) fails.push(msg); };

async function dismissOverlays(page) {
  await page.evaluate(() => {
    const consent = document.getElementById('consent');
    if (consent && !consent.hidden) {
      const btn = consent.querySelector('.consent-no, .consent-yes');
      if (btn) btn.click();
    }
    if (window.fecharOferta) window.fecharOferta();
    const offer = document.getElementById('offer-pop');
    if (offer) offer.hidden = true;
    document.body.style.overflow = '';
  });
}

async function zIndexOf(page, selector) {
  return page.$eval(selector, el => {
    const z = getComputedStyle(el).zIndex;
    return z === 'auto' ? 0 : Number(z);
  });
}

async function boxes(page, selector) {
  return page.$eval(selector, el => {
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
  });
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--window-size=390,844'],
});

try {
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#grid-catalog .product-card, #no-catalog');
  await dismissOverlays(page);

  const filt = await page.$('#filtbtn');
  assert(filt, 'Filtros button is present on mobile');
  const filtBox = await boxes(page, '#filtbtn');
  assert(filtBox.height >= 44, `Filtros tap height is ${filtBox.height}, need ≥44`);

  await page.click('#filtbtn');
  await page.waitForSelector('#shop-sidebar.open');
  await page.waitForFunction(() => {
    const el = document.querySelector('#shop-sidebar.open .sidebar-close');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.top >= 0;
  });

  const zSide = await zIndexOf(page, '#shop-sidebar');
  const zBack = await zIndexOf(page, '#shop-backdrop');
  const zBar = await zIndexOf(page, '#mobile-bar');
  assert(zSide > zBar, `drawer z-index ${zSide} must beat mobile-bar ${zBar}`);
  assert(zBack > zBar, `backdrop z-index ${zBack} must beat mobile-bar ${zBar}`);
  assert(zSide > zBack, `drawer ${zSide} must sit above backdrop ${zBack}`);

  const expanded = await page.$eval('#filtbtn', el => el.getAttribute('aria-expanded'));
  assert(expanded === 'true', `aria-expanded should be true while open (got ${expanded})`);
  const dialog = await page.$eval('#shop-sidebar', el => ({
    role: el.getAttribute('role'),
    modal: el.getAttribute('aria-modal'),
    hidden: el.getAttribute('aria-hidden'),
    inert: el.inert,
  }));
  assert(dialog.role === 'dialog' && dialog.modal === 'true' && dialog.hidden === 'false' && dialog.inert === false,
    `open drawer a11y: ${JSON.stringify(dialog)}`);

  const closeBox = await boxes(page, '.sidebar-close');
  const barBox = await boxes(page, '#mobile-bar');
  assert(closeBox.height >= 44 && closeBox.width >= 44, `close control is ${closeBox.width}×${closeBox.height}`);
  assert(closeBox.bottom < barBox.top || zSide > zBar,
    'close control must not sit under the mobile bar');

  const barClickable = await page.$eval('#mobile-bar', el => {
    const r = el.getBoundingClientRect();
    const samples = [
      [r.left + r.width / 2, r.top + r.height / 2],
      [r.right - 24, r.top + r.height / 2],
    ];
    return samples.some(([x, y]) => {
      const mid = document.elementFromPoint(x, y);
      return mid && (mid === el || el.contains(mid) || mid.closest('#mobile-bar'));
    });
  });
  assert(!barClickable, 'mobile bar must not receive taps while the filter drawer is open');

  await page.$eval('.sidebar-close', el => el.click());
  await page.waitForFunction(() => !document.getElementById('shop-sidebar').classList.contains('open'));
  const closed = await page.$eval('#shop-sidebar', el => ({
    expanded: document.getElementById('filtbtn').getAttribute('aria-expanded'),
    hidden: el.getAttribute('aria-hidden'),
    inert: el.inert,
  }));
  assert(closed.expanded === 'false' && closed.hidden === 'true' && closed.inert === true,
    `closed drawer a11y: ${JSON.stringify(closed)}`);

  // Add Melancia 1/4 as a cart regression on mobile.
  await page.evaluate(() => {
    const card = [...document.querySelectorAll('.product-card')].find(c =>
      (c.querySelector('.product-name') || {}).textContent?.includes('Melancia'));
    const add = card && card.querySelector('.add-btn');
    if (add) add.click();
  });
  await page.waitForFunction(() => {
    const n = document.getElementById('cart-count');
    return n && Number(n.textContent) >= 1;
  });

  // Desktop: Época featured CTA opens the epoca category.
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#season-grid, #verao');
  await dismissOverlays(page);
  const epocaBtn = await page.$('#verao .shop-link');
  assert(epocaBtn, 'Época featured CTA exists');
  await page.evaluate(() => document.querySelector('#verao .shop-link')?.click());
  await page.waitForFunction(() => {
    const tab = document.getElementById('tab-epoca');
    const crumb = document.getElementById('crumb-cat');
    return tab && tab.classList.contains('active') && crumb && /época/i.test(crumb.textContent);
  });
  const crumb = await page.$eval('#crumb-cat', el => el.textContent);
  assert(/Frutas da Época/i.test(crumb), `breadcrumb after Época CTA is "${crumb}"`);
} catch (err) {
  fails.push(String(err && err.message ? err.message : err));
} finally {
  await browser.close();
}

if (fails.length) {
  console.error('check-filter-drawer-browser failed:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('check-filter-drawer-browser: ok');
