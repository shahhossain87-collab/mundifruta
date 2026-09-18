#!/usr/bin/env node
/**
 * Headless Chrome: Tab stays inside the open mobile filter drawer,
 * catalog search/sort are 16px on a phone, and add-to-cart still works.
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

function inSidebar(page) {
  return page.evaluate(() => {
    const sb = document.getElementById('shop-sidebar');
    const el = document.activeElement;
    return {
      id: el && el.id,
      className: el && el.className,
      tag: el && el.tagName,
      inside: Boolean(sb && el && sb.contains(el)),
    };
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

  // --- Phone: Tab trap + 16px fields + add Melancia 1/4 ---
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#grid-catalog .product-card, #no-catalog');
  await dismissOverlays(page);

  const searchSize = await page.$eval('#search-input', el => parseFloat(getComputedStyle(el).fontSize));
  const sortSize = await page.$eval('#price-sort', el => parseFloat(getComputedStyle(el).fontSize));
  assert(searchSize >= 16, `search font-size ${searchSize}px should be ≥16 on a phone`);
  assert(sortSize >= 16, `sort font-size ${sortSize}px should be ≥16 on a phone`);

  await page.click('.filtbtn');
  await page.waitForFunction(() => document.getElementById('shop-sidebar')?.classList.contains('open'));
  await page.waitForFunction(() => {
    const t = getComputedStyle(document.getElementById('shop-sidebar')).transform;
    return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
  });

  const filterSelectSize = await page.$eval('#filter-preco', el => parseFloat(getComputedStyle(el).fontSize));
  assert(filterSelectSize >= 16, `filter-preco font-size ${filterSelectSize}px should be ≥16 in the drawer`);

  // Focus (do not click) Filtros — a second click would toggle the drawer shut via the backdrop.
  await page.$eval('.filtbtn', el => el.focus());
  const before = await inSidebar(page);
  assert(!before.inside, `Filtros button should sit outside the drawer (was ${before.className})`);

  await page.keyboard.press('Tab');
  const firstTab = await inSidebar(page);
  assert(firstTab.inside, `first Tab from Filtros must enter the drawer (landed on ${firstTab.tag}.${firstTab.className})`);

  const seen = new Set();
  let leftDrawer = false;
  for (let i = 0; i < 24; i++) {
    await page.keyboard.press('Tab');
    const now = await inSidebar(page);
    const key = `${now.tag}|${now.id}|${now.className}`;
    if (!now.inside) {
      leftDrawer = true;
      assert(false, `Tab ${i + 2} left the drawer (landed on ${key})`);
      break;
    }
    seen.add(key);
  }
  assert(!leftDrawer, 'Tab must stay inside the open drawer');
  assert(seen.size >= 3, `drawer should cycle several controls (saw ${seen.size})`);

  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
  const shiftTab = await inSidebar(page);
  assert(shiftTab.inside, `Shift+Tab must stay in the drawer (landed on ${shiftTab.tag}.${shiftTab.className})`);

  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('shop-sidebar')?.classList.contains('open'));
  await dismissOverlays(page);

  const added = await page.evaluate(() => {
    const card = [...document.querySelectorAll('#grid-catalog .product-card')]
      .find(c => (c.textContent || '').includes('Melancia 1/4'));
    const btn = card && card.querySelector('.add-btn');
    if (!btn) return false;
    btn.click();
    return true;
  });
  assert(added, 'Melancia 1/4 add button is missing');
  const cartCount = await page.$eval('#cart-count', el => el.textContent.trim());
  assert(cartCount !== '0', `cart should not stay 0 after add (was "${cartCount}")`);

  // --- Desktop: trap must not steal Tab from the catalog search ---
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#grid-catalog .product-card, #no-catalog');
  await dismissOverlays(page);

  const desktopSearch = await page.$eval('#search-input', el => parseFloat(getComputedStyle(el).fontSize));
  assert(desktopSearch < 16, `desktop search should stay under 16px (was ${desktopSearch}px); 16px is mobile-only`);

  await page.focus('#search-input');
  await page.keyboard.press('Tab');
  const afterDesktopTab = await inSidebar(page);
  const onClose = (afterDesktopTab.className || '').includes('sidebar-close');
  assert(!onClose, 'desktop Tab from search must not jump to the sidebar close control');

  const sidebarPosition = await page.$eval('#shop-sidebar', el => getComputedStyle(el).position);
  assert(sidebarPosition === 'sticky', `desktop sidebar should stay sticky (was ${sidebarPosition})`);
} catch (err) {
  fails.push(String(err && err.stack || err));
} finally {
  await browser.close();
}

if (fails.length) {
  console.error(fails.map(f => `FAIL: ${f}`).join('\n'));
  process.exit(1);
}
console.log('ok: filter tab trap browser checks');
