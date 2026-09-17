const carrinho = {};
  const produtos_map = {};
  let catAtual = 'frutas';
  const POR_PAGINA = 27;
  const catalogoEstado = {
    frutas:  { pagina:1, todos:[], filtrados:[] },
    legumes: { pagina:1, todos:[], filtrados:[] }
  };
  let modalProdutoId = null;
  let modalQuantidade = 1;
  const NOTA_PRECO_ESTIMADO = 'Preço estimado com base no peso médio. O valor final pode variar conforme o peso real do produto no momento da preparação da encomenda.';
  const DISCLAIMER_PRODUTOS_NATURAIS = 'Produtos naturais podem variar de peso. O preço final será calculado de acordo com o peso exato preparado para a sua encomenda.';

  /* ══ IMAGE FALLBACKS ══ */
  function erroImagem(img) {
    const wrap = img.closest('.photo-wrap');
    if (wrap) {
      wrap.innerHTML = `<div class="photo-fallback">${img.dataset.emoji}</div>`;
    } else {
      const fb = document.createElement('div');
      fb.className = 'sc-fallback'; fb.textContent = img.dataset.emoji;
      img.replaceWith(fb);
    }
  }

  /* ══ SHOPPING-FIRST FEATURED SECTIONS ══ */
  function selecionarPorNomes(lista, nomes) {
    const mapa = new Map(lista.map(item => [item.nome, item]));
    return nomes.map(nome => mapa.get(nome)).filter(Boolean);
  }

  function criarCardDestaque(item) {
    const card = document.createElement('article');
    card.className = 'feature-product';
    if (!produtoDisponivel(item)) card.classList.add('is-unavailable');
    card.dataset.productId = item._id;
    card.innerHTML = `
      <button class="feature-photo" type="button" onclick="abrirProduto('${item._id}')" aria-label="Ver ${item.nome}">
        <img src="${urlFoto(item.foto)}" alt="${item.nome}" data-emoji="${item.emoji}" onerror="erroImagem(this)" loading="lazy" decoding="async"/>
        ${item.badge ? `<span class="feature-badge">${item.badge}</span>` : ''}
        ${item.topVendido ? `<span class="top-badge">⭐ Mais vendido</span>` : ''}
      </button>
      <div class="feature-body">
        <h3>${item.nome}</h3>
        <p>${item.peso || 'Unidade'} · ${item.origem || 'Fresco diário'}</p>
        <div class="feature-buy">
          <strong>${rotuloPreco(item)}</strong>
          <button type="button" class="feature-add" onclick="adicionarProduto('${item._id}', produtos_map['${item._id}'])">＋</button>
        </div>
      </div>`;
    return card;
  }

  function preencherDestaques(id, itens) {
    const grid = document.getElementById(id);
    grid.innerHTML = '';
    itens.forEach(item => grid.appendChild(criarCardDestaque(item)));
  }

  function renderDestaques() {
    // Promoções: produtos em promoção primeiro, depois destaques da semana para preencher.
    const promocionais = [...produtos.frutas, ...produtos.legumes].filter(i => i.promo && produtoDisponivel(i));
    const extraPromo = selecionarPorNomes(
      [...produtos.frutas, ...produtos.legumes],
      ['Morangos','Melancia 1/4','Laranja Algarve','Tomate Salada','Cenoura','Hortelã']
    ).filter(i => !promocionais.includes(i));
    preencherDestaques('promo-grid', [...promocionais, ...extraPromo].slice(0, 8));
    preencherDestaques('popular-grid', selecionarPorNomes(
      produtos.frutas,
      ['Morangos','Banana Madeira','Laranja Algarve','Pêra Rocha','Maçã Royal Gala','Melancia 1/4','Manga Avião','Abacate Hass']
    ));
    preencherDestaques('season-grid', produtos.frutas.filter(item =>
      String(item.badge || '').includes('Verão')
    ).slice(0, 8));
    preencherDestaques('veg-featured-grid', selecionarPorNomes(
      produtos.legumes,
      ['Cenoura','Brócolos sem Folha','Alface','Tomate Salada','Batata Branca','Curgete','Pepino','Couve-flor']
    ));
  }

  /* ══ PRODUCT CARDS ══ */
  function criarCard(item, id) {
    const badge = item.badge ? `<div class="product-badge ${item.badgeClass||''}">${item.badge}</div>` : '';
    const disponivel = produtoDisponivel(item);
    const card  = document.createElement('div');
    card.className = 'product-card'; card.id = `card-${id}`; card.dataset.productId = id;
    if (!disponivel) card.classList.add('is-unavailable');
    const topRibbon = item.topVendido ? `<div class="top-badge">⭐ Mais vendido</div>` : '';
    card.innerHTML = `
      ${badge}
      ${topRibbon}
      <div class="sel-check">✓</div>
      <button class="photo-wrap" type="button" onclick="abrirProduto('${id}')" aria-label="Ver detalhes de ${item.nome}">
        <img src="${urlFoto(item.foto)}" alt="${item.nome}" data-emoji="${item.emoji}" onerror="erroImagem(this)" loading="lazy" decoding="async"/>
      </button>
      <div class="card-body">
        <div class="product-name">${item.nome}</div>
        <div class="product-price">${rotuloPreco(item)}</div>
        ${item.baseLinha ? `<div class="product-base">${item.baseLinha}</div>` : ''}
        ${item.peso ? `<div class="product-peso">${item.peso}</div>` : ''}
        ${item.origem ? `<div class="product-origem">🌍 ${item.origem}</div>` : '<div class="product-fresh">✓ Fresco Diário</div>'}
        ${disponivel
          ? `<button class="add-btn" type="button" onclick="adicionarProduto('${id}', produtos_map['${id}'])">＋</button>`
          : `<div class="unavailable-label">Indisponível</div>`}
        <div class="qty-controls" ${disponivel ? '' : 'hidden'}>
          <button class="qty-btn" type="button" onclick="alterarQtd('${id}',-1,event)">−</button>
          <span class="qty-num" data-qty-id="${id}">1</span>
          <button class="qty-btn" type="button" onclick="alterarQtd('${id}',1,event)">+</button>
        </div>
      </div>`;
    if (carrinho[id]) card.classList.add('selected');
    return card;
  }

  function renderGrid(itens, gridId, prefix, cat) {
    itens.forEach((item, i) => {
      const id = `${prefix}-${i}`;
      item._cat = cat; item._id = id;
      produtos_map[id] = item;
    });
    catalogoEstado[cat].todos = [...itens];
    catalogoEstado[cat].filtrados = [...itens];
    renderPagina(cat);
  }

  function renderPagina(cat) {
    const estado = catalogoEstado[cat];
    const grid = document.getElementById(`grid-${cat}`);
    const inicio = (estado.pagina - 1) * POR_PAGINA;
    const pagina = estado.filtrados.slice(inicio, inicio + POR_PAGINA);
    grid.innerHTML = '';
    pagina.forEach((item, i) => {
      const card = criarCard(item, item._id);
      card.dataset.ord = inicio + i;
      grid.appendChild(card);
    });
    document.getElementById(`no-${cat}`).style.display = pagina.length ? 'none' : 'block';
    renderPaginacao(cat);
    atualizarSugestaoLegumes(cat);

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 55);
          obs.unobserve(e.target);
        }
      });
    }, { threshold:0.08 });
    grid.querySelectorAll('.product-card').forEach(c => obs.observe(c));
  }

  function renderPaginacao(cat) {
    const estado = catalogoEstado[cat];
    const paginas = Math.max(1, Math.ceil(estado.filtrados.length / POR_PAGINA));
    if (estado.pagina > paginas) estado.pagina = paginas;
    const el = document.getElementById(`pagination-${cat}`);
    el.innerHTML = `
      <button type="button" onclick="mudarPagina('${cat}',-1)" ${estado.pagina === 1 ? 'disabled' : ''}>← Anterior</button>
      <span>Página ${estado.pagina} de ${paginas}</span>
      <button type="button" onclick="mudarPagina('${cat}',1)" ${estado.pagina === paginas ? 'disabled' : ''}>Seguinte →</button>`;
  }

  function atualizarSugestaoLegumes(cat) {
    if (cat !== 'frutas') return;
    const sugestao = document.querySelector('#cat-frutas .veg-suggestion');
    if (!sugestao) return;
    const estado = catalogoEstado.frutas;
    const termo = document.getElementById('search-input').value.trim();
    const paginas = Math.max(1, Math.ceil(estado.filtrados.length / POR_PAGINA));
    sugestao.hidden = Boolean(termo) || estado.filtrados.length === 0 || estado.pagina < paginas;
  }

  function mudarPagina(cat, delta) {
    const estado = catalogoEstado[cat];
    const paginas = Math.max(1, Math.ceil(estado.filtrados.length / POR_PAGINA));
    estado.pagina = Math.min(paginas, Math.max(1, estado.pagina + delta));
    renderPagina(cat);
    document.getElementById(`cat-${cat}`).scrollIntoView({ behavior:'smooth', block:'start' });
  }

  /* ══ CABAZES ══ */
  function renderCabazes() {
    const grid = document.getElementById('grid-cabazes');
    produtos.cabazes.forEach((item, i) => {
      const id = `cabaz-${i}`;
      item._cat = 'cabazes'; item._id = id;
      produtos_map[id] = item;
      const temItens = item.itens && item.itens.length;
      const badge = item.badge ? `<div class="product-badge ${item.badgeClass||''}">${item.badge}</div>` : '';
      const verBtn = temItens ? `<button class="cabaz-ver" onclick="event.stopPropagation(); abrirCabaz('${id}')">👁 Ver o que leva</button>` : '';
      const card = document.createElement('div');
      card.className = 'product-card'; card.id = `card-${id}`; card.dataset.productId = id;
      card.innerHTML = `
        ${badge}
        <div class="sel-check">✓</div>
        <button class="photo-wrap" type="button" onclick="abrirCabaz('${id}')" aria-label="Ver detalhes de ${item.nome}">
          <img src="${urlFoto(item.foto)}" alt="${item.nome}" data-emoji="${item.emoji}" onerror="erroImagem(this)" loading="lazy" decoding="async"/>
        </button>
        <div class="card-body">
          <div class="product-name">${item.nome}</div>
          ${item.peso ? `<div class="product-peso">${item.peso}</div>` : ''}
          <div class="product-price">${rotuloPreco(item)}</div>
          ${verBtn}
          <button class="add-btn" type="button" onclick="adicionarProduto('${id}', produtos_map['${id}'])">＋</button>
          <div class="qty-controls">
            <button class="qty-btn" type="button" onclick="alterarQtd('${id}',-1,event)">−</button>
            <span class="qty-num" data-qty-id="${id}">1</span>
            <button class="qty-btn" type="button" onclick="alterarQtd('${id}',1,event)">+</button>
          </div>
        </div>`;
      grid.appendChild(card);
      requestAnimationFrame(() => card.classList.add('visible'));
    });
  }

  function abrirCabaz(id) {
    const item = produtos_map[id];
    if (!item || !item.itens) return;
    document.getElementById('cabaz-modal-title').textContent = item.nome;
    document.getElementById('cabaz-modal-price').textContent = item.preco;
    document.getElementById('cabaz-modal-list').innerHTML = item.itens.map(it => {
      const header = it.grupo ? `<li class="ci-grupo">${it.grupo}</li>` : '';
      return `${header}<li><span class="ci-q">${it.q}</span><span class="ci-nome">${it.nome}</span></li>`;
    }).join('');
    const notaEl = document.getElementById('cabaz-modal-nota');
    if (notaEl) { notaEl.textContent = item.nota || ''; notaEl.style.display = item.nota ? 'block' : 'none'; }
    const addBtn = document.getElementById('cabaz-modal-add');
    addBtn.onclick = () => {
      adicionarProduto(id, item, 1);
      fecharCabaz();
      document.getElementById('encomenda').scrollIntoView({ behavior:'smooth' });
    };
    document.getElementById('cabaz-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function fecharCabaz() {
    document.getElementById('cabaz-modal').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ══ PRODUCT PREVIEW ══ */
  function abrirProduto(id) {
    const item = produtos_map[id];
    if (!item) return;
    modalProdutoId = id;
    modalQuantidade = 1;
    const imagem = document.getElementById('product-modal-image');
    imagem.src = urlFoto(item.foto);
    imagem.alt = item.nome;
    document.getElementById('product-modal-name').textContent = item.nome;
    document.getElementById('product-modal-price').innerHTML = rotuloPreco(item);
    document.getElementById('product-modal-unit').textContent = `Unidade de venda: ${item.peso || 'unidade'}`;
    document.getElementById('product-modal-status').textContent = item.badge
      ? item.badge.replace(/^[^\p{L}\p{N}]+/u, '')
      : 'Disponível hoje';
    document.getElementById('product-modal-note').textContent = item.origem
      ? `Produto fresco de origem ${item.origem}, selecionado diariamente pela Mundifruta.`
      : 'Produto fresco selecionado diariamente pela equipa Mundifruta.';
    document.getElementById('product-modal-qty').textContent = modalQuantidade;
    document.getElementById('product-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    if (window.trackEvent) window.trackEvent('view_item', { item: item.nome });
  }

  function fecharProduto() {
    document.getElementById('product-modal').classList.remove('open');
    document.body.style.overflow = '';
    modalProdutoId = null;
  }

  function alterarQtdModal(delta) {
    modalQuantidade = Math.max(1, modalQuantidade + delta);
    document.getElementById('product-modal-qty').textContent = modalQuantidade;
  }

  function adicionarDoModal() {
    if (!modalProdutoId) return;
    adicionarProduto(modalProdutoId, produtos_map[modalProdutoId], modalQuantidade);
    fecharProduto();
  }

  /* ══ CART ══ */
  function precoCentimos(preco) {
    const texto = String(preco ?? '').trim();
    if (/oferta/i.test(texto)) return 0;
    const valor = texto.match(/(\d+(?:\.\d{3})*)[,.](\d{2})/);
    if (!valor) return null;
    return Number.parseInt(valor[1].replace(/\./g, ''), 10) * 100
      + Number.parseInt(valor[2], 10);
  }

  function formatarCentimos(centimos) {
    return new Intl.NumberFormat('pt-PT', {
      style:'currency',
      currency:'EUR'
    }).format(centimos / 100);
  }

  function normalizarProdutos() {
    [...produtos.frutas, ...produtos.legumes, ...produtos.cabazes].forEach(item => {
      if (item.status === 'Indisponível') {
        item.badge = 'Indisponível';
        item.badgeClass = 'badge-unavailable';
      }
    });
  }

  function produtoDisponivel(item) {
    return item && item.status !== 'Indisponível';
  }

  // Produto vendido à unidade mas pesado → preço no carrinho é uma ESTIMATIVA.
  function produtoComPesoMedio(item) {
    return item && item.venda === 'estimado'
      && Number.isFinite(item.pricePerKg) && Number.isFinite(item.averageWeightKg);
  }

  // Valor cobrado por 1 unidade no carrinho (em cêntimos).
  function precoCalculadoCentimos(item) {
    if (!produtoDisponivel(item)) return null;
    if (produtoComPesoMedio(item)) {
      const peso = Number.isFinite(item.actualWeightKg) && item.actualWeightKg > 0
        ? item.actualWeightKg
        : item.averageWeightKg;
      return Math.round(item.pricePerKg * peso * 100);
    }
    return precoCentimos(item.preco);
  }

  // Sufixo de unidade para o cartão: /kg · /unidade · /100 g · /500 g · /molho · /cuvete
  function sufixoUnidade(peso) {
    const p = String(peso || '');
    if (/^\s*1\s*kg\s*$/i.test(p)) return '/kg';
    if (/unidade|^\s*1\s*un\b/i.test(p)) return '/unidade';
    if (/\b100\s*g\b/i.test(p)) return ' / 100 g';
    if (/\b250\s*g\b/i.test(p)) return ' / 250 g';
    if (/\b500\s*g\b/i.test(p)) return ' / 500 g';
    if (/cuvete/i.test(p)) return '/cuvete';
    if (/molho/i.test(p)) return '/molho';
    return '';
  }

  // Etiqueta de preço mostrada no cartão (NUNCA um total estimado).
  function rotuloPreco(item) {
    if (!produtoDisponivel(item)) return '';
    if (produtoComPesoMedio(item)) {
      return `${formatarCentimos(Math.round(item.pricePerKg * 100))}/kg`;
    }
    const suf = sufixoUnidade(item.peso);
    if (item.promo && item.precoNormal) {
      return `<span class="preco-antigo">${item.precoNormal}${suf}</span> <span class="preco-promo">${item.preco}${suf}</span>`;
    }
    return `${item.preco || 'A consultar'}${suf}`;
  }

  function totaisCarrinho() {
    return Object.values(carrinho).reduce((totais, item) => {
      const preco = precoCalculadoCentimos(item);
      totais.quantidade += item.qtd;
      if (preco === null) {
        totais.porConfirmar += 1;
      } else {
        totais.centimos += preco * item.qtd;
      }
      return totais;
    }, { quantidade:0, centimos:0, porConfirmar:0 });
  }

  function adicionarProduto(id, item, quantidade = 1) {
    if (!item || !produtoDisponivel(item)) return;
    const incremento = Math.max(1, Number.parseInt(quantidade, 10) || 1);
    if (carrinho[id]) {
      carrinho[id].qtd += incremento;
    } else {
      carrinho[id] = { ...item, qtd:incremento };
    }
    atualizarEstadoProduto(id);
    mostrarToast(`✓ ${item.nome} adicionado`);
    atualizarResumo(); atualizarBadge(); salvarCarrinho();
    if (window.aoAdicionar) window.aoAdicionar(item);
  }

  function atualizarEstadoProduto(id) {
    const selecionado = Boolean(carrinho[id]);
    document.querySelectorAll(`[data-product-id="${id}"]`).forEach(card => {
      card.classList.toggle('selected', selecionado);
      const add = card.querySelector('.add-btn, .feature-add');
      if (add) add.textContent = '＋';
    });
    document.querySelectorAll(`[data-qty-id="${id}"]`).forEach(el => {
      el.textContent = selecionado ? carrinho[id].qtd : '1';
    });
  }

  function alterarQtd(id, delta, e) {
    e.stopPropagation();
    if (!carrinho[id]) return;
    carrinho[id].qtd = Math.max(1, carrinho[id].qtd + delta);
    atualizarEstadoProduto(id);
    atualizarResumo(); atualizarBadge(); salvarCarrinho();
  }

  function removerProduto(id) {
    const item = carrinho[id];
    if (!item) return;
    delete carrinho[id];
    atualizarEstadoProduto(id);
    mostrarToast(`${item.emoji} ${item.nome} removido`);
    atualizarResumo(); atualizarBadge(); salvarCarrinho();
  }

  // change quantity from within the cart summary
  function alterarQtdCarrinho(id, delta) {
    if (!carrinho[id]) return;
    carrinho[id].qtd = Math.max(1, carrinho[id].qtd + delta);
    atualizarEstadoProduto(id);
    atualizarResumo(); atualizarBadge(); salvarCarrinho();
  }

  /* ══ PERSISTENT CART (localStorage) ══ */
  function salvarCarrinho() {
    try {
      localStorage.setItem('mf_cart', JSON.stringify(
        Object.fromEntries(Object.entries(carrinho).map(([k,v]) => [k, v.qtd]))
      ));
    } catch (e) {}
  }
  function carregarCarrinho() {
    let saved; try { saved = JSON.parse(localStorage.getItem('mf_cart') || '{}'); } catch (e) { saved = {}; }
    Object.entries(saved).forEach(([id, qtd]) => {
      const item = produtos_map[id]; if (!item) return;
      carrinho[id] = { ...item, qtd: Math.max(1, qtd|0) };
      atualizarEstadoProduto(id);
    });
    atualizarResumo(); atualizarBadge();
  }

  function atualizarBadge() {
    const totais = totaisCarrinho();
    const n = totais.quantidade;
    document.getElementById('cart-count').textContent = n;
    const quick = document.getElementById('quick-cart-count');
    if (quick) quick.textContent = n;
    const mb = document.getElementById('mb-cart-count');
    if (mb) { mb.textContent = n; mb.style.display = n > 0 ? 'flex' : 'none'; }
    // Running subtotal on the persistent cart tab, so shoppers always see "how much am I at".
    const mbLabel = document.getElementById('mb-cart-label');
    if (mbLabel) {
      if (totais.centimos > 0) {
        mbLabel.textContent = formatarCentimos(totais.centimos);
        mbLabel.classList.add('is-total');
      } else {
        mbLabel.textContent = 'Carrinho';
        mbLabel.classList.remove('is-total');
      }
    }
    const fc = document.getElementById('float-cart');
    if (fc) {
      const fcText = document.getElementById('float-cart-text');
      const subtotalText = totais.centimos > 0 ? formatarCentimos(totais.centimos) : (totais.porConfirmar ? 'A confirmar' : formatarCentimos(0));
      if (fcText) fcText.textContent = `${n} · ${subtotalText}`;
      fc.title = n > 0 ? `Ver a sua encomenda — ${n} itens · ${subtotalText}` : 'Ver a sua encomenda';
      fc.setAttribute('aria-label', fc.title);
      if (n > 0) {
        fc.classList.add('visible');
        fc.classList.remove('pop'); void fc.offsetWidth; fc.classList.add('pop');
      } else {
        fc.classList.remove('visible');
      }
    }
  }

  function atualizarResumo() {
    const lista = document.getElementById('order-list');
    const totalEl = document.getElementById('order-total');
    const itens = Object.values(carrinho);
    if (!itens.length) {
      lista.innerHTML = '<li class="empty-msg">Sem artigos ainda. Selecione produtos acima para começar.</li>';
      totalEl.hidden = true;
      totalEl.innerHTML = '';
      return;
    }
    lista.innerHTML = itens.map(i => {
      const preco = precoCalculadoCentimos(i);
      const subtotal = preco === null ? 'A confirmar' : formatarCentimos(preco * i.qtd);
      const estimado = produtoComPesoMedio(i);
      return `<li class="order-item">
        <span class="order-item-main">${i.emoji} ${i.nome}${i.peso ? ` <small>(${i.peso})</small>` : ''}</span>
        <span class="order-item-actions">
          <span class="oi-stepper">
            <button type="button" onclick="alterarQtdCarrinho('${i._id}',-1)" aria-label="Menos">−</button>
            <b>${i.qtd}</b>
            <button type="button" onclick="alterarQtdCarrinho('${i._id}',1)" aria-label="Mais">+</button>
          </span>
          <span class="order-item-price">${estimado
            ? `${rotuloPreco(i)} <strong>Subtotal estimado: ${subtotal}</strong>`
            : `${i.preco} · <strong>${subtotal}</strong>`}</span>
          <button class="order-remove" type="button" onclick="removerProduto('${i._id}')" aria-label="Remover ${i.nome}">×</button>
        </span>
      </li>`;
    }).join('');

    const totais = totaisCarrinho();
    const temEstimados = itens.some(produtoComPesoMedio);
    totalEl.hidden = false;
    totalEl.innerHTML = `
      <span>Total estimado</span>
      <strong>${formatarCentimos(totais.centimos)}</strong>
      ${totais.porConfirmar ? `<small>+ ${totais.porConfirmar} ${totais.porConfirmar === 1 ? 'artigo' : 'artigos'} com preço a confirmar</small>` : ''}
      ${temEstimados ? `<small>${NOTA_PRECO_ESTIMADO}</small><small>${DISCLAIMER_PRODUTOS_NATURAIS}</small>` : ''}
    `;
    if (window.aoAtualizarResumo) window.aoAtualizarResumo();
  }

  /* ══ CATALOG FILTERS / SORT / PAGINATION ══ */
  function precoItem(item) {
    if (produtoComPesoMedio(item)) return Math.round(item.pricePerKg * 100);
    const valor = precoCentimos(item.preco);
    return valor === null ? Infinity : valor;
  }

  function aplicarCatalogo() {
    const termo = document.getElementById('search-input').value.toLocaleLowerCase('pt').trim();
    const ordem = document.getElementById('price-sort').value;
    ['frutas','legumes'].forEach(cat => {
      const estado = catalogoEstado[cat];
      estado.filtrados = estado.todos.filter(item =>
        !termo || item.nome.toLocaleLowerCase('pt').includes(termo)
      );
      if (ordem === 'az' || ordem === 'za') {
        estado.filtrados.sort((a,b) => {
          const cmp = a.nome.localeCompare(b.nome, 'pt', { sensitivity:'base' });
          return ordem === 'az' ? cmp : -cmp;
        });
      } else if (ordem) {
        estado.filtrados.sort((a,b) => {
          const precoA = precoItem(a);
          const precoB = precoItem(b);
          if (!Number.isFinite(precoA)) return 1;
          if (!Number.isFinite(precoB)) return -1;
          return ordem === 'asc' ? precoA - precoB : precoB - precoA;
        });
      }
      estado.pagina = 1;
      renderPagina(cat);
    });
  }

  function ordenarPreco() {
    aplicarCatalogo();
  }

  /* ══ SEARCH ══ */
  function pesquisar() {
    const q = document.getElementById('search-input').value.toLowerCase().trim();
    document.getElementById('search-clear').classList.toggle('visible', q.length > 0);
    aplicarCatalogo();
    if (q) {
      for (const cat of ['frutas','legumes']) {
        if (catalogoEstado[cat].filtrados.length > 0) {
          mostrarCategoria(cat, document.getElementById(`tab-${cat}`)); break;
        }
      }
    }
  }

  function limparPesquisa() { document.getElementById('search-input').value = ''; pesquisar(); }

  /* ══ CATEGORY ══ */
  function mostrarCategoria(cat, btn) {
    document.querySelectorAll('.cat-section').forEach(s => s.classList.remove('visible'));
    document.querySelectorAll('.cat-tab').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    document.getElementById(`cat-${cat}`).classList.add('visible');
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    }
    catAtual = cat;
  }

  function abrirCatalogo(cat) {
    mostrarCategoria(cat, document.getElementById(`tab-${cat}`));
    document.getElementById('produtos').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  /* ══ NAVEGAÇÃO ENCOMENDA ↔ CATÁLOGO ══ */
  // Guarda a posição de navegação do cliente para poder voltar exatamente ali.
  let posCatalogo = 0;
  function irParaEncomenda() {
    const prod = document.getElementById('produtos');
    const y = window.scrollY;
    // Só memoriza se o cliente está a ver o catálogo (não a partir do topo/hero).
    if (prod && y >= prod.offsetTop - 240) posCatalogo = y;
    const enc = document.getElementById('encomenda');
    if (enc) enc.scrollIntoView({ behavior:'smooth', block:'start' });
  }
  // "Continuar a comprar" — fecha a vista de encomenda e volta ao catálogo, na posição anterior.
  function continuarAComprar() {
    const prod = document.getElementById('produtos');
    const alvo = posCatalogo || (prod ? prod.getBoundingClientRect().top + window.scrollY - 8 : 0);
    window.scrollTo({ top: alvo, behavior:'smooth' });
  }

  /* ══ ORDER ══ */
  function obterTextoEncomenda() {
    const nome   = document.getElementById('cust-nome').value.trim();
    const tel    = document.getElementById('cust-telemovel').value.trim();
    const hora   = document.getElementById('cust-levantamento').value.trim();
    const notas  = document.getElementById('cust-notas').value.trim();
    const itens  = Object.values(carrinho);
    if (!itens.length) { alert('Por favor selecione pelo menos um produto!'); return null; }
    if (!nome || !tel) { alert('Por favor preencha o seu nome e número de telemóvel!'); return null; }
    let t = `Olá MUNDIFRUTA! Gostaria de fazer uma encomenda para levantamento na loja:\n\nNome: ${nome}\nTelemóvel: ${tel}\n`;
    if (hora) t += `Levantamento: ${hora}\n`;
    t += `\nEncomenda:\n`;
    const temEstimados = itens.some(produtoComPesoMedio);
    itens.forEach(i => {
      const preco = precoCalculadoCentimos(i);
      const subtotal = preco === null ? 'A confirmar' : formatarCentimos(preco * i.qtd);
      if (produtoComPesoMedio(i)) {
        t += `• *${i.qtd}x* ${i.nome} (${i.peso}) — ${rotuloPreco(i)} — *Subtotal estimado: ${subtotal}*\n`;
      } else {
        t += `• *${i.qtd}x* ${i.nome}${i.peso ? ` (${i.peso})` : ''} — ${i.preco} = *${subtotal}*\n`;
      }
    });
    const totais = totaisCarrinho();
    t += `\n*TOTAL ESTIMADO: ${formatarCentimos(totais.centimos)}*`;
    if (totais.porConfirmar) {
      t += `\nNota: ${totais.porConfirmar} ${totais.porConfirmar === 1 ? 'artigo tem' : 'artigos têm'} preço a confirmar.`;
    }
    if (temEstimados) t += `\n${NOTA_PRECO_ESTIMADO}\n${DISCLAIMER_PRODUTOS_NATURAIS}`;
    if (window.linhaCupao) t += window.linhaCupao(totais.centimos);
    if (notas) t += `\nNotas: ${notas}`;
    return t;
  }

  function enviarWhatsApp(e) {
    e.preventDefault();
    const t = obterTextoEncomenda(); if (!t) return;
    if (window.trackEvent) window.trackEvent('whatsapp_order_click', { value: totaisCarrinho().centimos / 100, currency: 'EUR' });
    window.open(`https://wa.me/351932699850?text=${encodeURIComponent(t)}`, '_blank');
  }

  function enviarEmail() {
    const t = obterTextoEncomenda(); if (!t) return;
    window.location.href = `mailto:shahhossain87@gmail.com?subject=${encodeURIComponent('Encomenda MUNDIFRUTA')}&body=${encodeURIComponent(t)}`;
  }

  /* ══ UI ══ */
  function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }

  function promoverCatalogo() {
    const atalhos = document.querySelector('.cat-quick');
    const catalogo = document.getElementById('produtos');
    if (atalhos && catalogo) atalhos.insertAdjacentElement('afterend', catalogo);
  }

  function atualizarContadoresCategorias() {
    const contadores = {
      frutas: produtos.frutas.length,
      legumes: produtos.legumes.length,
      cabazes: produtos.cabazes.length,
      promocoes: [...produtos.frutas, ...produtos.legumes].filter(item =>
        /popular|premium|recomendado|oferta|promo/i.test(String(item.badge || ''))
      ).length,
      epoca: produtos.frutas.filter(item => /verão|verao/i.test(String(item.badge || ''))).length
    };
    document.getElementById('count-frutas').textContent = contadores.frutas;
    document.getElementById('count-legumes').textContent = contadores.legumes;
    document.querySelectorAll('[data-count-label]').forEach(label => {
      const chave = label.dataset.countLabel;
      const texto = label.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
      if (Number.isFinite(contadores[chave])) label.textContent = `${texto} (${contadores[chave]})`;
    });
  }

  let toastTimer;
  let ultimoScrollY = window.scrollY;
  function mostrarToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  /* ══ SCROLL ══ */
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    document.getElementById('main-nav').classList.toggle('scrolled', y > 60);
    document.getElementById('scroll-top').classList.toggle('visible', y > 400);
    const aDescer = y > ultimoScrollY && y > 170;
    const aSubir = y < ultimoScrollY - 4;
    document.body.classList.toggle('catalog-tools-collapsed', aDescer);
    if (aSubir || y < 120) document.body.classList.remove('catalog-tools-collapsed');
    ultimoScrollY = y;
  }, { passive:true });

  /* ══ NAV ACTIVE HIGHLIGHT ══ */
  (function navSpy(){
    const map = { produtos:'#produtos', cabazes:'#cabazes', verao:'#verao', avaliacoes:'#avaliacoes', contacto:'#contacto' };
    const links = {};
    document.querySelectorAll('.nav-links a').forEach(a => { links[a.getAttribute('href')] = a; });
    const secs = Object.keys(map).map(id => document.getElementById(id)).filter(Boolean);
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          Object.values(links).forEach(l => l.classList.remove('active'));
          const link = links['#'+e.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin:'-45% 0px -50% 0px' });
    secs.forEach(s => obs.observe(s));
  })();

  /* ══ FADE-IN ══ */
  const fiObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); fiObs.unobserve(e.target); } });
  }, { threshold:0.1 });
  document.querySelectorAll('.fi').forEach(el => fiObs.observe(el));

  /* ══ AVALIAÇÕES ══ */
  function renderAvaliacoes() {
    document.getElementById('gb-nota').textContent = avaliacoesInfo.nota;
    document.getElementById('gb-total').textContent = `${avaliacoesInfo.total} avaliações no Google`;
    document.getElementById('google-badge').href = avaliacoesInfo.link;
    document.getElementById('reviews-cta').href = avaliacoesInfo.link;
    document.getElementById('temas-row').innerHTML = avaliacoesInfo.temas
      .map(t => `<span class="tema-chip">✓ ${t}</span>`).join('');
    document.getElementById('reviews-grid').innerHTML = avaliacoes.map(a => {
      const stars = '★★★★★'.slice(0, a.estrelas) + '☆☆☆☆☆'.slice(0, 5 - a.estrelas);
      return `<div class="review-card">
        <div class="review-stars">${stars}</div>
        <p class="review-text">${a.texto}</p>
        <div class="review-author"><span class="review-avatar">${(a.nome[0]||'?').replace('[','C')}</span>${a.nome}</div>
      </div>`;
    }).join('');
  }

  /* ══ INIT ══ */
  promoverCatalogo();
  normalizarProdutos();
  renderGrid(produtos.frutas,  'grid-frutas',  'fruta',  'frutas');
  renderGrid(produtos.legumes, 'grid-legumes', 'legume', 'legumes');
  renderDestaques();
  renderCabazes();
  renderAvaliacoes();
  atualizarContadoresCategorias();
  carregarCarrinho();
  if (window.iniciarExtras) window.iniciarExtras();

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('product-modal').classList.contains('open')) fecharProduto();
    if (document.getElementById('cabaz-modal').classList.contains('open')) fecharCabaz();
    const csp = document.getElementById('cs-pop'); if (csp && !csp.hidden) csp.hidden = true;
    const off = document.getElementById('offer-pop'); if (off && !off.hidden && window.fecharOferta) window.fecharOferta();
    const priv = document.getElementById('privacy-modal'); if (priv && !priv.hidden) priv.hidden = true;
  });
