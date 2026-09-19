/* ═══════════════════════════════════════════════════════════
   EXTRAS — cross-sell, oferta 1ª compra + progresso, Quem Somos,
   consentimento RGPD e analítica (Google Ads) com consentimento.
   Carregado depois de app.js; usa as funções/variáveis globais dele.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── util: mapa nome → id (produtos_map é preenchido por app.js) ─── */
  function idPorNome(nome) {
    return Object.keys(produtos_map).find(k => produtos_map[k].nome === nome);
  }
  function itemPorNome(nome) {
    const id = idPorNome(nome);
    return id ? produtos_map[id] : null;
  }

  /* ═══════════ ANALÍTICA (Google Ads) — só após consentimento ═══════════ */
  const GOOGLE_ADS_ID = 'AW-16771350041';
  // GA4: quando existir um Measurement ID (G-XXXX), definir aqui e será carregado também.
  const GA4_MEASUREMENT_ID = '';
  let gtagCarregado = false;

  function carregarGtag() {
    if (gtagCarregado) return;
    gtagCarregado = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GOOGLE_ADS_ID);
    if (GA4_MEASUREMENT_ID) gtag('config', GA4_MEASUREMENT_ID);
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_ADS_ID;
    document.head.appendChild(s);
  }

  // API pública usada por app.js e por este ficheiro.
  window.trackEvent = function (nome, params) {
    if (typeof window.gtag === 'function') window.gtag('event', nome, params || {});
  };

  /* ═══════════ CONSENTIMENTO RGPD ═══════════ */
  function estadoConsentimento() {
    try { return localStorage.getItem('mf_consent'); } catch (e) { return null; }
  }
  function initConsent() {
    const estado = estadoConsentimento();
    if (estado === 'all') carregarGtag();
    if (!estado) document.getElementById('consent').hidden = false;
  }
  window.definirConsentimento = function (aceitarTudo) {
    try { localStorage.setItem('mf_consent', aceitarTudo ? 'all' : 'essential'); } catch (e) {}
    document.getElementById('consent').hidden = true;
    if (aceitarTudo) carregarGtag();
  };
  window.reporConsentimento = function () {
    try { localStorage.removeItem('mf_consent'); } catch (e) {}
    fecharPrivacidade();
    document.getElementById('consent').hidden = false;
  };
  window.abrirPrivacidade = function () { document.getElementById('privacy-modal').hidden = false; };
  window.fecharPrivacidade = function () { document.getElementById('privacy-modal').hidden = true; };

  /* ═══════════ CUPÃO / OFERTA 1ª COMPRA ═══════════ */
  function lerCupao() {
    try { return JSON.parse(localStorage.getItem('mf_coupon') || 'null'); } catch (e) { return null; }
  }
  function gravarCupao(c) {
    try { localStorage.setItem('mf_coupon', JSON.stringify(c)); } catch (e) {}
  }
  function cupaoAtivo() {
    const c = lerCupao();
    if (!c || c.status !== 'available') return false;
    const expira = c.issuedAt + cupaoConfig.validadeDias * 86400000;
    return Date.now() < expira;
  }
  function descontoCentimos(totalCentimos) {
    if (!cupaoAtivo()) return 0;
    if (totalCentimos < cupaoConfig.minimo * 100) return 0;
    return cupaoConfig.desconto * 100; // 10€
  }

  function preencherOferta() {
    // texto dinâmico → sempre coerente com o mínimo real do cupão
    const t = document.getElementById('offer-text');
    const f = document.getElementById('offer-fine');
    if (t) t.textContent = `Na sua primeira compra de ${cupaoConfig.minimo}€ ou mais.`;
    if (f) f.textContent = cupaoConfig.copyExclusivo;
  }
  let _revealKey = null;
  function mostrarOferta() {
    // só a novos visitantes: sem cupão emitido nem dispensado
    if (lerCupao()) return;
    const pop = document.getElementById('offer-pop');
    if (!pop) return;
    preencherOferta();
    pop.hidden = false;
    document.body.style.overflow = 'hidden';
    const foco = pop.querySelectorAll('button');
    const cta = pop.querySelector('.reveal-cta');
    setTimeout(() => { try { (cta || foco[0]).focus(); } catch (e) {} }, 60);
    _revealKey = function (e) {
      if (e.key === 'Escape') { e.preventDefault(); window.fecharOferta(); return; }
      if (e.key === 'Tab' && foco.length) {
        const first = foco[0], last = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', _revealKey);
    if (typeof window.trackEvent === 'function') window.trackEvent('offer_shown', { coupon: cupaoConfig.codigo });
  }
  function encerrarReveal() {
    const pop = document.getElementById('offer-pop');
    if (pop) pop.hidden = true;
    document.body.style.overflow = '';
    if (_revealKey) { document.removeEventListener('keydown', _revealKey); _revealKey = null; }
  }
  window.aceitarOferta = function () {
    gravarCupao({ code: cupaoConfig.codigo, status: 'available', issuedAt: Date.now() });
    encerrarReveal();
    if (typeof mostrarToast === 'function') mostrarToast(`🎁 Cupão ${cupaoConfig.codigo} reservado (mín. ${cupaoConfig.minimo}€)`);
    if (typeof window.trackEvent === 'function') window.trackEvent('coupon_generated', { coupon: cupaoConfig.codigo });
    atualizarProgresso();
  };
  window.fecharOferta = function () {
    // marca como dispensado para não voltar a aparecer
    if (!lerCupao()) gravarCupao({ code: cupaoConfig.codigo, status: 'dismissed', issuedAt: Date.now() });
    encerrarReveal();
  };

  function initOferta() {
    if (lerCupao()) return; // já emitido/dispensado
    let mostrado = false;
    const disparar = () => { if (!mostrado) { mostrado = true; mostrarOferta(); limpar(); } };
    const timer = setTimeout(disparar, 1200);
    const onInteract = () => disparar();
    function limpar() {
      clearTimeout(timer);
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('click', onInteract);
    }
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    // clique conta como interação significativa (exceto no próprio popup)
    setTimeout(() => window.addEventListener('click', onInteract, { once: true }), 1500);
  }

  /* Progresso do cupão + desconto aplicado (Phase 7) */
  window.atualizarProgresso = function () {
    const box = document.getElementById('promo-progress');
    if (!box) return;
    if (!cupaoAtivo()) { box.hidden = true; return; }
    const total = totaisCarrinho().centimos;
    const minimo = cupaoConfig.minimo * 100;
    box.hidden = false;
    if (total <= 0) {
      box.className = 'promo-progress';
      box.innerHTML = `🎁 <strong>Cupão de ${cupaoConfig.desconto}€ reservado.</strong> Adicione produtos até ${cupaoConfig.minimo}€ e desbloqueie o seu desconto.`;
    } else if (total < minimo) {
      const faltam = formatarCentimos(minimo - total);
      box.className = 'promo-progress';
      box.innerHTML = `🎁 Faltam <strong>${faltam}</strong> para desbloquear o seu desconto de <strong>${cupaoConfig.desconto}€</strong>.`;
    } else {
      const desconto = descontoCentimos(total);
      const net = formatarCentimos(total - desconto);
      box.className = 'promo-progress qualificado';
      box.innerHTML = `✅ Já atingiu o mínimo! Desconto de boas-vindas <strong>−${formatarCentimos(desconto)}</strong> · Total com desconto: <strong>${net}</strong>
        <small>Cupão ${cupaoConfig.codigo} confirmado no levantamento na loja.</small>`;
    }
  };

  // Linha de cupão para a mensagem de WhatsApp (chamada por app.js).
  window.linhaCupao = function (totalCentimos) {
    const d = descontoCentimos(totalCentimos);
    if (!d) return '';
    const net = formatarCentimos(totalCentimos - d);
    return `\n\nCupão ${cupaoConfig.codigo}: -${formatarCentimos(d)} (1ª compra ≥ ${cupaoConfig.minimo}€)\n*TOTAL COM DESCONTO: ${net}*`;
  };

  /* ═══════════ CROSS-SELL ═══════════ */
  function recomendacoes(base, n) {
    const vistos = new Set();
    const out = [];
    const emCarrinho = id => Boolean(carrinho[id]);
    const push = (item) => {
      if (!item || !item._id) return;
      if (vistos.has(item._id) || emCarrinho(item._id)) return;
      if (item.status === 'Indisponível') return;
      if (item._id === base._id) return;
      vistos.add(item._id); out.push(item);
    };
    (base.rel || []).forEach(nome => push(itemPorNome(nome)));
    // fallback: mesma categoria (produtos com destaque) até completar
    if (out.length < n) {
      const lista = (base._cat === 'legumes' ? produtos.legumes : produtos.frutas);
      lista.forEach(it => { if (out.length < n + 2) push(it); });
    }
    return out.slice(0, n);
  }

  function cartaoCS(item) {
    const src = urlFoto(item.foto);
    const thumb = src
      ? `<img src="${src}" alt="${item.alt || item.nome}" loading="lazy" decoding="async" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'cs-emoji',textContent:'${item.emoji}'}))"/>`
      : `<span class="cs-emoji">${item.emoji || ''}</span>`;
    return `<button class="cs-card" type="button" onclick="csAdd('${item._id}')">
        ${thumb}
        <span class="cs-nome">${item.nome}</span>
        <span class="cs-preco">${rotuloPreco(item)}</span>
        <span class="cs-add">＋</span>
      </button>`;
  }

  window.csAdd = function (id) {
    const item = produtos_map[id];
    if (!item) return;
    adicionarProduto(id, item, 1);
    window.trackEvent('cross_sell_add', { item: item.nome });
    fecharCrossSell();
  };
  window.fecharCrossSell = function () { document.getElementById('cs-pop').hidden = true; };

  let csTimer;
  window.aoAdicionar = function (item) {
    window.trackEvent('add_to_cart', { item: item && item.nome });
    if (!item) return;
    const recs = recomendacoes(item, 4);
    if (!recs.length) return;
    document.getElementById('cs-pop-title').textContent =
      (item.rel && item.rel.length) ? 'Combina bem com…' : 'Também pode gostar';
    document.getElementById('cs-pop-row').innerHTML = recs.map(cartaoCS).join('');
    const pop = document.getElementById('cs-pop');
    pop.hidden = false;
    clearTimeout(csTimer);
    csTimer = setTimeout(() => { pop.hidden = true; }, 9000);
    renderCsCart();
  };

  function renderCsCart() {
    const box = document.getElementById('crosssell-cart');
    const row = document.getElementById('crosssell-cart-row');
    if (!box || !row) return;
    const noCarrinho = Object.values(carrinho);
    if (!noCarrinho.length) { box.hidden = true; return; }
    const vistos = new Set(); const recs = [];
    noCarrinho.forEach(ci => recomendacoes(ci, 3).forEach(r => {
      if (!vistos.has(r._id) && recs.length < 6) { vistos.add(r._id); recs.push(r); }
    }));
    if (!recs.length) { box.hidden = true; return; }
    row.innerHTML = recs.map(cartaoCS).join('');
    box.hidden = false;
  }
  window.aoAtualizarResumo = function () { atualizarProgresso(); renderCsCart(); };

  /* ═══════════ QUEM SOMOS ═══════════ */
  function renderQuemSomos() {
    const gallery = document.getElementById('qs-gallery');
    if (gallery) {
      const fotos = [
        'fotos/mundifruta-photos-web/20260706_195657.jpg',
        'fotos/mundifruta-photos-web/20260706_195719.jpg',
        'fotos/mundifruta-photos-web/20260706_195742.jpg',
        'fotos/mundifruta-photos-web/20260706_200221.jpg',
        'fotos/mundifruta-photos-web/20260706_141845.jpg',
        'fotos/mundifruta-photos-web/20260706_120442.jpg',
      ];
      gallery.innerHTML = fotos.map(f => `<div class="qs-photo"><img src="${f}" alt="Mundi Fruta — seleção diária" loading="lazy" decoding="async"/></div>`).join('');
    }
  }

  /* ═══════════ HERO SLIDESHOW ═══════════ */
  function initHeroSlides() {
    const wrap = document.getElementById('hero-slides');
    if (!wrap) return;
    const fotos = [
      'fotos/mundifruta-photos-web/20260706_195625.jpg',
      'fotos/mundifruta-photos-web/20260706_195657.jpg',
      'fotos/mundifruta-photos-web/20260706_195901.jpg',
      'fotos/mundifruta-photos-web/20260706_120442.jpg',
      'fotos/mundifruta-photos-web/20260706_195742.jpg',
    ];
    wrap.innerHTML = fotos.map((f, i) =>
      `<div class="hero-slide${i === 0 ? ' active' : ''}" style="background-image:url('${f}')"></div>`).join('');
    const slides = [...wrap.children];
    if (slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove('active');
      i = (i + 1) % slides.length;
      slides[i].classList.add('active');
    }, 5000);
  }

  /* ═══════════ CARROSSÉIS (linhas de destaque) ═══════════ */
  function initCarousels() {
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.feature-grid').forEach(grid => {
      if (!grid.children.length || grid.dataset.carousel) return;
      grid.dataset.carousel = '1';
      grid.classList.add('carousel');
      const wrap = document.createElement('div');
      wrap.className = 'carousel-wrap';
      grid.parentNode.insertBefore(wrap, grid);
      wrap.appendChild(grid);
      const passo = () => (grid.firstElementChild ? grid.firstElementChild.offsetWidth + 14 : 220);
      const prev = document.createElement('button');
      prev.className = 'carousel-nav prev'; prev.type = 'button';
      prev.setAttribute('aria-label', 'Anterior'); prev.textContent = '‹';
      prev.onclick = () => grid.scrollBy({ left: -passo() * 2, behavior: 'smooth' });
      const next = document.createElement('button');
      next.className = 'carousel-nav next'; next.type = 'button';
      next.setAttribute('aria-label', 'Seguinte'); next.textContent = '›';
      next.onclick = () => grid.scrollBy({ left: passo() * 2, behavior: 'smooth' });
      wrap.appendChild(prev); wrap.appendChild(next);

      if (reduzir) return;
      let timer = setInterval(auto, 4500);
      function auto() {
        const fim = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 8;
        if (fim) grid.scrollTo({ left: 0, behavior: 'smooth' });
        else grid.scrollBy({ left: passo(), behavior: 'smooth' });
      }
      const parar = () => { clearInterval(timer); timer = null; };
      const retomar = () => { if (!timer) timer = setInterval(auto, 4500); };
      wrap.addEventListener('pointerenter', parar);
      wrap.addEventListener('pointerleave', retomar);
      grid.addEventListener('pointerdown', parar);
      grid.addEventListener('touchstart', parar, { passive: true });
    });
  }

  /* ═══════════ INIT ═══════════ */
  // extras.js é carregado depois de app.js (que já correu o seu INIT e o DOM
  // já está pronto), por isso arrancamos diretamente aqui.
  window.iniciarExtras = function () {
    renderQuemSomos();
    initHeroSlides();
    initCarousels();
    initConsent();
    initOferta();
    atualizarProgresso();
    renderCsCart();
  };
  window.iniciarExtras();
})();
