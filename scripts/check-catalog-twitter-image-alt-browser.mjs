#!/usr/bin/env node
/** Chrome: leftover catalog twitter:image:alt; wrapping catalog nav and homepage cart stay. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch {
  puppeteer = require('/tmp/mf-test/node_modules/puppeteer-core');
}

const root = resolve(import.meta.dirname, '..');
const chrome = process.env.CHROME_PATH
  || (existsSync('/usr/bin/google-chrome-stable')
    ? '/usr/bin/google-chrome-stable'
    : '/usr/bin/google-chrome');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let file = decodeURIComponent(url.pathname);
  if (file === '/') file = '/index.html';
  if (file.endsWith('/')) file += 'index.html';
  try {
    const buf = await readFile(join(root, file));
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});

await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
});

const errors = [];
const ok = (cond, msg) => { if (!cond) errors.push(msg); };
const shareImage = 'https://mundifruta.com/fotos/cabaz_mix.jpeg';
const shareAlt = 'MUNDIFRUTA — Frutas & Legumes Frescos em Carnaxide';
const frutasAlt = 'Seleção de frutas frescas';
const promoAlt = 'Promoções e destaques da semana';
const cabazesAlt = 'Cabazes de frutas e legumes';
const morangoAlt = 'Morangos frescos isolados em fundo branco';
const melanciaAlt = 'Quarto de melancia com sementes pretas em fundo branco';

async function openPage(page, path, vw, vh) {
  await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1, isMobile: vw <= 430 });
  await page.goto(new URL(path, base).href, { waitUntil: 'networkidle0', timeout: 60000 });
}

async function leftoverCredits(page, path, vw, vh, label) {
  await openPage(page, path, vw, vh);
  const data = await page.evaluate(() => {
    const back = document.querySelector('.credits-back');
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map(link => link.getAttribute('href') || '')
      .find(href => href.includes('estilos.css')) || '';
    const alts = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => ({
      hreflang: link.getAttribute('hreflang') || '',
      href: link.getAttribute('href') || '',
    }));
    const og = [...document.querySelectorAll('meta[property^="og:"]')].map(meta => ({
      property: meta.getAttribute('property') || '',
      content: meta.getAttribute('content') || '',
    }));
    const twitter = [...document.querySelectorAll('meta[name^="twitter:"]')].map(meta => ({
      name: meta.getAttribute('name') || '',
      content: meta.getAttribute('content') || '',
    }));
    return {
      lang: document.documentElement.getAttribute('lang') || '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      alts,
      og,
      twitter,
      iconCount: document.querySelectorAll('link[rel="icon"]').length,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      ogImageAlt: document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content') || '',
      ogImageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content') || '',
      ogImageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute('content') || '',
      ogImageType: document.querySelector('meta[property="og:image:type"]')?.getAttribute('content') || '',
      ogLocale: document.querySelector('meta[property="og:locale"]')?.getAttribute('content') || '',
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '',
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '',
      twitterImageAlt: document.querySelector('meta[name="twitter:image:alt"]')?.getAttribute('content') || '',
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '',
      appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content') || '',
      mobileCapable: document.querySelector('meta[name="mobile-web-app-capable"]')?.getAttribute('content') || '',
      colorScheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute('content') || '',
      h1: document.querySelector('h1')?.textContent?.trim() || '',
      title: document.title,
      backHref: back ? back.getAttribute('href') || '' : '',
      backText: back ? (back.textContent || '').replace(/\s+/g, ' ').trim() : '',
      cssHref: css,
      creditsPage: document.body.classList.contains('credits-page'),
    };
  });
  ok(data.lang === 'pt-PT', `${label}: leftover credits lang="pt-PT" stays`);
  ok(data.canonical === 'https://mundifruta.com/creditos.html',
    `${label}: leftover credits canonical stays`);
  ok(data.alts.length === 0, `${label}: leftover credits hreflang stays out (PR #238)`);
  ok(data.h1 === 'Créditos das fotos', `${label}: leftover credits h1 stays`);
  ok(data.title === 'Créditos das fotos — MUNDIFRUTA', `${label}: leftover credits title stays`);
  ok(data.backHref === 'index.html' && /Voltar à loja/i.test(data.backText),
    `${label}: leftover credits back link stays`);
  ok(data.cssHref.includes('estilos.css?v=64'), `${label}: leftover credits CSS cache stays ?v=64`);
  ok(data.creditsPage, `${label}: leftover credits-page class stays`);
  ok(data.iconCount === 0, `${label}: leftover credits favicon stays out (draft #201)`);
  ok(!data.ogImageType, `${label}: leftover credits og:image:type stays out (PR #268)`);
  ok(data.og.length === 0, `${label}: leftover credits Open Graph identity stays out (PR #241)`);
  ok(!data.ogImage && !data.twitterCard && !data.twitterImage, `${label}: leftover credits share tags stay out (PR #243)`);
  ok(!data.ogImageAlt, `${label}: leftover credits og:image:alt stays out (PR #265)`);
  ok(!data.twitterImageAlt && data.twitter.length === 0, `${label}: leftover credits twitter:image:alt stays out (PR #266)`);
  ok(!data.ogImageWidth && !data.ogImageHeight, `${label}: leftover credits og:image size stays out (PR #267)`);
  ok(!data.ogLocale, `${label}: leftover credits og:locale stays out (PR #242)`);
  ok(!data.themeColor, `${label}: leftover credits theme-color stays out (PR #250)`);
  ok(!data.appleCapable, `${label}: leftover credits apple-capable stays out (PR #256)`);
  ok(!data.mobileCapable, `${label}: leftover credits mobile-web-app-capable stays out (PR #262)`);
  ok(!data.colorScheme, `${label}: leftover credits color-scheme stays out (PR #258)`);
}

async function leftoverHomepage(page, label) {
  await page.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  const burger = await page.$eval('.hamburger', el => el.getAttribute('aria-expanded'));
  ok(burger === null, `${label}: leftover hamburger stays without aria-expanded`);
  const home = await page.evaluate(() => {
    const alts = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => ({
      hreflang: link.getAttribute('hreflang') || '',
      href: link.getAttribute('href') || '',
    }));
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map(link => link.getAttribute('href') || '')
      .find(href => href.includes('estilos.css')) || '';
    const credits = [...document.querySelectorAll('a')]
      .some(a => /Créditos das fotos/i.test(a.textContent || '') && /creditos\.html/.test(a.getAttribute('href') || ''));
    return {
      lang: document.documentElement.getAttribute('lang') || '',
      alts,
      css,
      credits,
      ogLocale: document.querySelector('meta[property="og:locale"]')?.getAttribute('content') || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      ogImageAlt: document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content') || '',
      ogImageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content') || '',
      ogImageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute('content') || '',
      ogImageType: document.querySelector('meta[property="og:image:type"]')?.getAttribute('content') || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '',
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '',
      twitterImageAlt: document.querySelector('meta[name="twitter:image:alt"]')?.getAttribute('content') || '',
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content') || '',
      appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content') || '',
      mobileCapable: document.querySelector('meta[name="mobile-web-app-capable"]')?.getAttribute('content') || '',
    };
  });
  ok(home.lang === 'pt', `${label}: leftover homepage lang="pt" stays`);
  ok(home.alts.some(a => a.hreflang === 'pt-PT' && a.href === 'https://mundifruta.com/'),
    `${label}: leftover homepage pt-PT hreflang stays`);
  ok(home.alts.some(a => a.hreflang === 'x-default' && a.href === 'https://mundifruta.com/'),
    `${label}: leftover homepage x-default hreflang stays`);
  ok(home.ogLocale === 'pt_PT', `${label}: leftover homepage og:locale pt_PT stays`);
  ok(home.ogImage === shareImage, `${label}: leftover homepage og:image stays`);
  ok(home.ogTitle === shareAlt, `${label}: leftover homepage og:title stays`);
  ok(!home.ogImageAlt, `${label}: leftover homepage og:image:alt stays out (PR #244)`);
  ok(!home.ogImageWidth && !home.ogImageHeight, `${label}: leftover homepage og:image size stays out (PR #247)`);
  ok(!home.ogImageType, `${label}: leftover homepage og:image:type stays out (PR #248)`);
  ok(home.twitterCard === 'summary_large_image' && home.twitterImage === shareImage,
    `${label}: leftover homepage Twitter share tags stay`);
  ok(!home.twitterImageAlt, `${label}: leftover homepage twitter:image:alt stays out (PR #245)`);
  ok(!home.themeColor, `${label}: leftover homepage theme-color stays out (PR #249)`);
  ok(!home.appleCapable, `${label}: leftover homepage apple-capable stays out (PR #255)`);
  ok(!home.mobileCapable, `${label}: leftover homepage mobile-web-app-capable stays out (PR #261)`);
  ok(home.css.includes('estilos.css?v=66'), `${label}: homepage CSS cache stays ?v=66`);
  ok(home.credits, `${label}: leftover footer credits link stays`);
  const added = await page.evaluate(() => {
    if (window.limparTudo) window.limparTudo();
    if (window.mostrarCategoria) window.mostrarCategoria('frutas', document.getElementById('tab-frutas'));
    const card = [...document.querySelectorAll('.shop-main .product-card')]
      .find(c => /Melancia 1\/4/i.test(c.textContent || ''));
    if (!card) return { ok: false, reason: 'card missing' };
    const btn = card.querySelector('.add-btn');
    if (btn) btn.click();
    const cs = document.getElementById('cs-pop');
    if (cs) cs.hidden = true;
    return { ok: true, count: document.getElementById('cart-count')?.textContent || '' };
  });
  ok(added.ok && added.count === '1', `${label}: leftover add Melancia 1/4 (count=${added.count})`);
}

async function leftoverCatalogPage(page, path, vw, vh, expectedH1, canonical, expectedAlt, label) {
  await openPage(page, path, vw, vh);
  const data = await page.evaluate(() => {
    const nav = [...document.querySelectorAll('.seo-nav a')].map(a => (a.textContent || '').trim());
    const h1 = document.querySelector('h1')?.textContent?.trim() || '';
    const names = [...document.querySelectorAll('.seo-product-card h2')].map(el => (el.textContent || '').trim());
    const css = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map(link => link.getAttribute('href') || '')
      .find(href => href.includes('estilos.css')) || '';
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    let parsed = null;
    try { parsed = JSON.parse(jsonLd ? jsonLd.textContent : 'null'); } catch (e) { parsed = { parseError: true }; }
    const order = document.querySelector('.seo-order-link')?.getAttribute('href') || '';
    const footer = (document.querySelector('.seo-footer')?.textContent || '').replace(/\s+/g, ' ').trim();
    const crumbs = (document.querySelector('.seo-breadcrumbs')?.textContent || '').replace(/\s+/g, ' ').trim();
    const crumbHidden = [...document.querySelectorAll('.seo-breadcrumbs span')]
      .some(el => el.getAttribute('aria-hidden') === 'true');
    const alts = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => ({
      hreflang: link.getAttribute('hreflang') || '',
      href: link.getAttribute('href') || '',
    }));
    return {
      lang: document.documentElement.getAttribute('lang') || '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      alts,
      iconCount: document.querySelectorAll('link[rel="icon"]').length,
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      ogImageAlt: document.querySelector('meta[property="og:image:alt"]')?.getAttribute('content') || '',
      ogImageWidth: document.querySelector('meta[property="og:image:width"]')?.getAttribute('content') || '',
      ogImageHeight: document.querySelector('meta[property="og:image:height"]')?.getAttribute('content') || '',
      ogImageType: document.querySelector('meta[property="og:image:type"]')?.getAttribute('content') || '',
      ogLocale: document.querySelector('meta[property="og:locale"]')?.getAttribute('content') || '',
      twitterCard: document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '',
      twitterImage: document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '',
      twitterImageAlt: document.querySelector('meta[name="twitter:image:alt"]')?.getAttribute('content') || '',
      appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content') || '',
      nav,
      h1,
      names,
      crumbs,
      crumbHidden,
      cssHref: css,
      jsonType: parsed?.['@type'] || null,
      order,
      footer,
      h3Count: document.querySelectorAll('.seo-product-card h3').length,
    };
  });
  ok(data.h1 === expectedH1, `${label}: leftover h1 stays ${expectedH1}`);
  ok(data.lang === 'pt-PT', `${label}: leftover catalog lang="pt-PT" stays`);
  ok(data.canonical === canonical, `${label}: leftover canonical stays ${canonical}`);
  ok(data.alts.some(a => a.hreflang === 'pt-PT' && a.href === canonical),
    `${label}: leftover pt-PT hreflang stays on leftover canonical`);
  ok(!data.alts.some(a => a.hreflang === 'x-default'),
    `${label}: leftover catalog x-default stays out (PR #236)`);
  ok(data.alts.length === 1, `${label}: leftover catalog hreflang stays the pt-PT-only first phase`);
  ok(data.nav.join(' | ') === 'Início | Frutas | Legumes | Promoções',
    `${label}: leftover wrapping nav stays (${data.nav.join(' | ')})`);
  ok(!data.nav.includes('Ervas frescas') && !data.nav.includes('Cabazes'),
    `${label}: leftover wrapping nav is still the four-link first phase`);
  ok(data.cssHref.includes('estilos.css?v=65'), `${label}: generated CSS cache stays ?v=65`);
  ok(data.iconCount === 0, `${label}: leftover catalog favicon stays out (draft #198)`);
  ok(data.h3Count === 0, `${label}: leftover category-card titles stay h2`);
  ok(!data.ogImage, `${label}: leftover catalog og:image stays out (PR #215)`);
  ok(!data.ogImageAlt, `${label}: leftover catalog og:image:alt stays out (PR #269)`);
  ok(!data.twitterCard && !data.twitterImage, `${label}: leftover catalog Twitter cards stay out (PR #215)`);
  ok(data.twitterImageAlt === expectedAlt, `${label}: leftover catalog twitter:image:alt stays ${expectedAlt}`);
  ok(!data.ogImageWidth && !data.ogImageHeight, `${label}: leftover catalog og:image size stays out`);
  ok(!data.ogImageType, `${label}: leftover catalog og:image:type stays out`);
  ok(!data.ogLocale, `${label}: leftover catalog og:locale stays out (PR #240)`);
  ok(!data.appleCapable, `${label}: leftover catalog apple-capable stays out (PR #264)`);
  ok(!data.crumbHidden, `${label}: leftover breadcrumb › stays without aria-hidden`);
  ok(!/WhatsApp|932 699 850|Email/i.test(data.footer),
    `${label}: leftover SEO footer contacts stay out`);
  return data;
}

try {
  const desktop = await browser.newPage();
  desktop.on('pageerror', err => errors.push('1280 pageerror: ' + err.message));
  await leftoverCredits(desktop, '/creditos.html', 1280, 800, '1280 credits');

  const frutas = await leftoverCatalogPage(
    desktop,
    '/categorias/frutas/',
    1280,
    800,
    'Frutas',
    'https://mundifruta.com/categorias/frutas/',
    frutasAlt,
    '1280 Frutas'
  );
  ok(frutas.names.includes('Melancia 1/4'), '1280 Frutas: leftover Melancia 1/4 card stays');
  ok(frutas.names.includes('Morango 500g'), '1280 Frutas: leftover Morango 500g card stays');
  ok(frutas.jsonType !== 'Product', '1280 Frutas: leftover category page is not a Product JSON-LD');
  ok(/^Início›Frutas$/.test(frutas.crumbs.replace(/\s+/g, '')), '1280 Frutas: leftover Início › Frutas crumbs stay');

  const promo = await leftoverCatalogPage(
    desktop,
    '/categorias/promocoes/',
    1280,
    800,
    'Promoções',
    'https://mundifruta.com/categorias/promocoes/',
    promoAlt,
    '1280 Promoções'
  );
  ok(/^Início›Promoções$/.test(promo.crumbs.replace(/\s+/g, '')), '1280 Promoções: leftover Início › Promoções crumbs stay');

  const cabazes = await leftoverCatalogPage(
    desktop,
    '/categorias/cabazes/',
    1280,
    800,
    'Cabazes',
    'https://mundifruta.com/categorias/cabazes/',
    cabazesAlt,
    '1280 Cabazes'
  );
  ok(/^Início›Cabazes$/.test(cabazes.crumbs.replace(/\s+/g, '')), '1280 Cabazes: leftover Início › Cabazes crumbs stay');

  const morango = await leftoverCatalogPage(
    desktop,
    '/produtos/morango-500g/',
    1280,
    800,
    'Morango 500g',
    'https://mundifruta.com/produtos/morango-500g/',
    morangoAlt,
    '1280 Morango'
  );
  ok(morango.jsonType === 'Product', '1280 Morango: leftover Product JSON-LD stays');
  ok(morango.order === '/?produto=morango-500g#produtos', '1280 Morango: leftover order link stays');
  ok(/Início\s*›\s*Frutas\s*›\s*Morango 500g/.test(morango.crumbs),
    '1280 Morango: leftover Início › Frutas › Morango 500g crumbs stay');

  const melancia = await leftoverCatalogPage(
    desktop,
    '/produtos/melancia-1-4/',
    1280,
    800,
    'Melancia 1/4',
    'https://mundifruta.com/produtos/melancia-1-4/',
    melanciaAlt,
    '1280 Melancia'
  );
  ok(melancia.order === '/?produto=melancia-1-4#produtos', '1280 Melancia: leftover order link stays');

  await openPage(desktop, '/', 1280, 800);
  await leftoverHomepage(desktop, '1280');

  const mobile = await browser.newPage();
  mobile.on('pageerror', err => errors.push('390 pageerror: ' + err.message));
  await leftoverCredits(mobile, '/creditos.html', 390, 844, '390 credits');

  const mobileFrutas = await leftoverCatalogPage(
    mobile,
    '/categorias/frutas/',
    390,
    844,
    'Frutas',
    'https://mundifruta.com/categorias/frutas/',
    frutasAlt,
    '390 Frutas'
  );
  ok(mobileFrutas.names.includes('Melancia 1/4'), '390 Frutas: leftover Melancia 1/4 card stays');
  const mobileProduct = await leftoverCatalogPage(
    mobile,
    '/produtos/morango-500g/',
    390,
    844,
    'Morango 500g',
    'https://mundifruta.com/produtos/morango-500g/',
    morangoAlt,
    '390 Morango'
  );
  ok(mobileProduct.order === '/?produto=morango-500g#produtos', '390 Morango: leftover order link stays');

  await openPage(mobile, '/', 390, 844);
  await mobile.evaluate(() => {
    try { localStorage.setItem('mf_consent', 'essential'); } catch (e) {}
    try { localStorage.removeItem('mf_cart'); } catch (e) {}
    try { localStorage.setItem('mf_coupon', JSON.stringify({ code: 'WELCOME', status: 'dismissed', issuedAt: Date.now() })); } catch (e) {}
  });
  await mobile.reload({ waitUntil: 'networkidle0', timeout: 60000 });
  await mobile.evaluate(() => {
    const c = document.getElementById('consent'); if (c) c.hidden = true;
    const o = document.getElementById('offer-pop'); if (o) o.hidden = true;
  });
  const bar = await mobile.evaluate(() => [...document.querySelectorAll('.mb-item')].map(el =>
    (el.textContent || '').replace(/\s+/g, ' ').trim()
  ));
  ok(bar.some(t => /Carrinho/i.test(t)) && bar.some(t => /Promoções/i.test(t))
    && bar.some(t => /WhatsApp/i.test(t)) && bar.some(t => /Como Chegar/i.test(t)) && bar.length === 4,
    `390: leftover 4-item bar stays (got ${bar.join(' / ')})`);
  await leftoverHomepage(mobile, '390');

  await browser.close();
  server.close();
  if (errors.length) {
    console.error('check-catalog-twitter-image-alt-browser failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    process.exit(1);
  }
  console.log('check-catalog-twitter-image-alt-browser: ok');
} catch (err) {
  try { await browser.close(); } catch {}
  try { server.close(); } catch {}
  console.error(err);
  process.exit(1);
}
