const carrinho = {};
  const produtos_map = {};
  const POR_PAGINA = 24;

  /* ══ CATÁLOGO — categorias e subcategorias derivadas dos dados existentes ══
     Nada é inventado: as listas resultam sempre de filtrar `produtos`. */
  const ERVAS = ['Salsa','Coentros','Hortelã','Agrião'];
  const ehErva  = item => ERVAS.includes(item.nome);
  const ehPromo = item => Boolean(item.promo);

  // Subcategorias por palavra-chave (apenas filtram a lista visível).
  const SUBCATS = {
    frutas: [
      { key:'banana-maca-pera', label:'Banana, maçã e pera',   re:/banana|maçã|maca|pêra|pera/i },
      { key:'citrinos',         label:'Laranja, limão e citrinos', re:/laranja|lim(ã|a)o|lima|tangerina|marcott|clementina/i },
      { key:'vermelhos',        label:'Frutos vermelhos',      re:/morango|framboesa|mirtilo|amora|cereja|rom(ã|a)/i },
      { key:'tropicais',        label:'Uvas e frutas tropicais', re:/uva|manga|abacaxi|anan(á|a)s|papaia|mam(ã|a)o|kiwi|abacate|coco|lichia/i },
      { key:'caroco',           label:'Pêssego e ameixa',      re:/p(ê|e)ssego|nectarina|ameixa|alperce|d(i|í)ospiro|n(ê|e)speras/i },
      { key:'melao-melancia',   label:'Melão e melancia',      re:/mel(ã|a)o|melancia|meloa|figo/i },
    ],
    legumes: [
      { key:'batatas-cebolas',  label:'Batatas e cebolas',     re:/batata|cebola|alho/i },
      { key:'tomates',          label:'Tomates',               re:/tomate/i },
      { key:'couves-folhas',    label:'Couves e folhas verdes', re:/couve|alface|espinafre|grelo|nabi(ç|c)a|agri(ã|a)o|br(ó|o)colos/i },
      { key:'raizes',           label:'Raízes e outros',       re:/cenoura|nabo|beterraba|gengibre|rabanete|mandioca|inhame|ab(ó|o)bora|curgete|beringela|pepino|pimento|feij(ã|a)o|cogumelo|malagueta|quiabo|chuchu|ma(ç|c)aroca|milho/i },
    ],
  };

  const ehEpoca = item => /ver(ã|a)o/i.test(String(item.badge || ''));

  // Categorias do catálogo (Cabazes mantém a sua própria secção).
  const CATEGORIAS = {
    frutas:    { label:'Frutas',          fonte:() => produtos.frutas },
    legumes:   { label:'Legumes',         fonte:() => produtos.legumes.filter(i => !ehErva(i)) },
    ervas:     { label:'Ervas frescas',   fonte:() => produtos.legumes.filter(ehErva) },
    epoca:     { label:'Frutas da Época', fonte:() => produtos.frutas.filter(ehEpoca) },
    promocoes: { label:'Promoções',       fonte:() => [...produtos.frutas, ...produtos.legumes].filter(ehPromo) },
  };

  const catalogo = {
    categoria:'frutas',
    subcat:'',
    ordem:'',
    pagina:1,
    filtros:{ promo:false, disp:false, preco:'' },
    filtrados:[],
  };
  let catAtual = 'frutas'; // compat com código existente
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
    const card  = document.createElement('article');
    card.className = 'product-card'; card.id = `card-${id}`; card.dataset.productId = id;
    if (!disponivel) card.classList.add('is-unavailable');
    const topRibbon = item.topVendido ? `<div class="top-badge">⭐ Mais vendido</div>` : '';
    const oosOverlay = disponivel ? '' : `<div class="oos-flag">Esgotado</div>`;
    card.innerHTML = `
      ${badge}
      ${topRibbon}
      <div class="sel-check" aria-hidden="true">✓</div>
      <button class="photo-wrap" type="button" onclick="abrirProduto('${id}')" aria-label="Ver detalhes de ${item.nome}">
        <img src="${urlFoto(item.foto)}" alt="${item.nome}" data-emoji="${item.emoji}" onerror="erroImagem(this)" loading="lazy" decoding="async"/>
        ${oosOverlay}
      </button>
      <div class="card-body">
        <h3 class="product-name">${item.nome}</h3>
        <div class="product-meta">
          ${item.peso ? `<span class="product-peso">${item.peso}</span>` : ''}
          ${item.origem ? `<span class="product-origem">🌍 ${item.origem}</span>` : ''}
        </div>
        <div class="product-price">${rotuloPreco(item)}${pctPromo(item) ? ` <span class="promo-save">−${pctPromo(item)}%</span>` : ''}</div>
        ${precoSecundario(item) ? `<div class="product-unit">${precoSecundario(item)}</div>` : ''}
        ${item.baseLinha ? `<div class="product-base">${item.baseLinha}</div>` : ''}
        <div class="card-actions">
          ${disponivel
            ? `<button class="add-btn" type="button" onclick="adicionarProduto('${id}', produtos_map['${id}'])">＋ Adicionar</button>`
            : `<div class="unavailable-label">Indisponível</div>`}
          <div class="qty-controls" ${disponivel ? '' : 'hidden'} aria-label="Quantidade de ${item.nome}">
            <button class="qty-btn" type="button" onclick="alterarQtd('${id}',-1,event)" aria-label="Diminuir">−</button>
            <span class="qty-num" data-qty-id="${id}">1</span>
            <button class="qty-btn" type="button" onclick="alterarQtd('${id}',1,event)" aria-label="Aumentar">+</button>
          </div>
        </div>
      </div>`;
    if (carrinho[id]) card.classList.add('selected');
    return card;
  }

  // Atribui um _id estável a cada produto (mantém compatibilidade com o carrinho guardado).
  function indexarProdutos() {
    const marcar = (lista, prefix, cat) => lista.forEach((item, i) => {
      const id = `${prefix}-${i}`;
      item._cat = cat; item._id = id;
      produtos_map[id] = item;
    });
    marcar(produtos.frutas,  'fruta',  'frutas');
    marcar(produtos.legumes, 'legume', 'legumes');
  }

  // Lista base da categoria atual (antes de filtros/pesquisa/ordenação).
  function itensDaCategoria() {
    const def = CATEGORIAS[catalogo.categoria] || CATEGORIAS.frutas;
    return def.fonte();
  }

  function renderCatalogo() {
    const grid = document.getElementById('grid-catalog');
    if (!grid) return;
    const lista = catalogo.filtrados;
    const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (catalogo.pagina > paginas) catalogo.pagina = paginas;
    const inicio = (catalogo.pagina - 1) * POR_PAGINA;
    const pagina = lista.slice(inicio, inicio + POR_PAGINA);

    grid.innerHTML = '';
    pagina.forEach((item, i) => {
      const card = criarCard(item, item._id);
      card.dataset.ord = inicio + i;
      grid.appendChild(card);
    });

    document.getElementById('no-catalog').style.display = lista.length ? 'none' : 'block';
    renderContagem(lista.length);
    renderFiltrosAtivos();
    renderPaginacao(paginas);

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 45);
          obs.unobserve(e.target);
        }
      });
    }, { threshold:0.06 });
    grid.querySelectorAll('.product-card').forEach(c => obs.observe(c));
  }

  function renderContagem(total) {
    const nome = (CATEGORIAS[catalogo.categoria] || {}).label || '';
    const el = document.getElementById('catalog-count');
    if (el) el.textContent = total === 1 ? `1 produto em ${nome}` : `${total} produtos em ${nome}`;
    const crumb = document.getElementById('crumb-cat');
    if (crumb) crumb.textContent = nome;
  }

  // Tags de filtros ativos (removíveis) — estilo "filtros aplicados" de supermercado.
  function renderFiltrosAtivos() {
    const box = document.getElementById('active-filters');
    if (!box) return;
    const tags = [];
    const termo = (document.getElementById('search-input').value || '').trim();
    if (termo) tags.push({ t:'busca', txt:`“${termo}”` });
    if (catalogo.subcat) {
      const s = (SUBCATS[catalogo.categoria] || []).find(x => x.key === catalogo.subcat);
      if (s) tags.push({ t:'subcat', txt:s.label });
    }
    if (catalogo.filtros.promo) tags.push({ t:'promo', txt:'Em promoção' });
    if (catalogo.filtros.disp)  tags.push({ t:'disp',  txt:'Disponíveis' });
    if (catalogo.filtros.preco) {
      const rot = { '0-2':'Até 2 €', '2-5':'2 € – 5 €', '5-999':'Mais de 5 €' }[catalogo.filtros.preco] || 'Preço';
      tags.push({ t:'preco', txt:rot });
    }
    if (!tags.length) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = tags.map(tag =>
      `<button class="filter-tag" type="button" onclick="removerFiltro('${tag.t}')" aria-label="Remover filtro ${tag.txt}">${tag.txt} <span aria-hidden="true">✕</span></button>`
    ).join('') + `<button class="filter-tag clear-all" type="button" onclick="limparTudo()">Limpar tudo</button>`;
  }

  function removerFiltro(tipo) {
    if (tipo === 'busca') {
      document.getElementById('search-input').value = '';
      document.getElementById('search-clear').classList.remove('visible');
    } else if (tipo === 'subcat') {
      catalogo.subcat = '';
      renderSubcats();
    } else if (tipo === 'promo' || tipo === 'disp') {
      catalogo.filtros[tipo] = false;
      const b = document.getElementById('filter-' + tipo);
      if (b) { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); }
    } else if (tipo === 'preco') {
      document.getElementById('filter-preco').value = '';
      catalogo.filtros.preco = '';
    }
    catalogo.pagina = 1;
    aplicarCatalogo();
  }

  function renderPaginacao(paginas) {
    const el = document.getElementById('pagination-catalog');
    if (!el) return;
    if (paginas <= 1) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <button type="button" onclick="mudarPagina(-1)" ${catalogo.pagina === 1 ? 'disabled' : ''} aria-label="Página anterior">← Anterior</button>
      <span>Página ${catalogo.pagina} de ${paginas}</span>
      <button type="button" onclick="mudarPagina(1)" ${catalogo.pagina === paginas ? 'disabled' : ''} aria-label="Página seguinte">Seguinte →</button>`;
  }

  function mudarPagina(delta) {
    const paginas = Math.max(1, Math.ceil(catalogo.filtrados.length / POR_PAGINA));
    catalogo.pagina = Math.min(paginas, Math.max(1, catalogo.pagina + delta));
    renderCatalogo();
    document.getElementById('catalog-toolbar').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // Chips de subcategoria para a categoria atual (Frutas/Legumes).
  function renderSubcats() {
    const row = document.getElementById('subcat-row');
    if (!row) return;
    const painel = document.getElementById('subcat-panel');
    const subs = SUBCATS[catalogo.categoria];
    if (!subs) { row.innerHTML = ''; row.hidden = true; if (painel) painel.hidden = true; return; }
    row.hidden = false;
    if (painel) painel.hidden = false;
    const base = itensDaCategoria();
    const chips = [`<button class="subcat-chip${catalogo.subcat ? '' : ' active'}" type="button" aria-pressed="${catalogo.subcat ? 'false' : 'true'}" onclick="selecionarSubcat('')">Todas</button>`];
    subs.forEach(s => {
      const n = base.filter(i => s.re.test(i.nome)).length;
      if (!n) return;
      const ativo = catalogo.subcat === s.key;
      chips.push(`<button class="subcat-chip${ativo ? ' active' : ''}" type="button" aria-pressed="${ativo}" onclick="selecionarSubcat('${s.key}')">${s.label} <span class="subcat-count">${n}</span></button>`);
    });
    row.innerHTML = chips.join('');
  }

  function selecionarSubcat(key) {
    catalogo.subcat = key;
    catalogo.pagina = 1;
    renderSubcats();
    aplicarCatalogo();
    fecharFiltros(); // no mobile, escolher subcategoria fecha o painel para ver os resultados
  }

  function alternarFiltro(tipo, btn) {
    catalogo.filtros[tipo] = !catalogo.filtros[tipo];
    if (btn) { btn.classList.toggle('active', catalogo.filtros[tipo]); btn.setAttribute('aria-pressed', String(catalogo.filtros[tipo])); }
    catalogo.pagina = 1;
    aplicarCatalogo();
    fecharFiltros(); // no mobile, um chip de filtro fecha o painel para ver os resultados
  }

  // Preço é um commit (select): volta à página 1 e, no mobile, fecha a gaveta.
  function aplicarFiltroPreco() {
    catalogo.pagina = 1;
    aplicarCatalogo();
    fecharFiltros();
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
            <button class="qty-btn" onclick="alterarQtd('${id}',-1,event)">−</button>
            <span class="qty-num" data-qty-id="${id}">1</span>
            <button class="qty-btn" onclick="alterarQtd('${id}',1,event)">+</button>
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

  // Percentagem de desconto de uma promoção (inspiração Continente: indicador de poupança).
  function pctPromo(item) {
    if (!item || !item.promo || !item.precoNormal) return 0;
    const antigo = precoCentimos(item.precoNormal);
    const atual = precoCentimos(item.preco);
    if (!antigo || !atual || antigo <= atual) return 0;
    return Math.round((1 - atual / antigo) * 100);
  }

  // Linha de preço secundária (preço por unidade de medida) — estilo supermercado:
  //   • peso médio  → estimativa por unidade (ex: "≈ 2,97 € / unidade")
  //   • embalagem g → preço por kg (ex: "3,98 € / kg")
  function precoSecundario(item) {
    if (!item || !produtoDisponivel(item)) return '';
    if (produtoComPesoMedio(item)) {
      const c = Math.round(item.pricePerKg * item.averageWeightKg * 100);
      return `≈ ${formatarCentimos(c)} / unidade`;
    }
    const base = precoCentimos(item.preco);
    if (base === null) return '';
    const p = String(item.peso || '');
    if (/^\s*1\s*kg\s*$/i.test(p)) return '';          // o preço já é por kg
    if (/molho|unidade|^\s*\d*\s*un\b/i.test(p)) return ''; // sem peso claro para calcular /kg
    const mg = p.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
    const mkg = p.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
    let gramas = null;
    if (mg) gramas = parseFloat(mg[1].replace(',', '.'));
    else if (mkg) gramas = parseFloat(mkg[1].replace(',', '.')) * 1000;
    if (!gramas || gramas <= 0) return '';
    return `${formatarCentimos(Math.round(base / (gramas / 1000)))} / kg`;
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

  function ordenarLista(lista) {
    const ordem = catalogo.ordem;
    if (ordem === 'az' || ordem === 'za') {
      lista.sort((a,b) => {
        const cmp = a.nome.localeCompare(b.nome, 'pt', { sensitivity:'base' });
        return ordem === 'az' ? cmp : -cmp;
      });
    } else if (ordem === 'popular') {
      lista.sort((a,b) => (b.topVendido ? 1 : 0) - (a.topVendido ? 1 : 0));
    } else if (ordem === 'asc' || ordem === 'desc') {
      lista.sort((a,b) => {
        const precoA = precoItem(a), precoB = precoItem(b);
        if (!Number.isFinite(precoA)) return 1;
        if (!Number.isFinite(precoB)) return -1;
        return ordem === 'asc' ? precoA - precoB : precoB - precoA;
      });
    }
    // '' (relevância) → mantém a ordem curada dos dados.
  }

  function aplicarCatalogo() {
    const termo = (document.getElementById('search-input').value || '').toLocaleLowerCase('pt').trim();
    catalogo.ordem = document.getElementById('price-sort').value;
    catalogo.filtros.preco = document.getElementById('filter-preco').value;

    let lista = itensDaCategoria().slice();

    const subs = SUBCATS[catalogo.categoria];
    if (subs && catalogo.subcat) {
      const s = subs.find(x => x.key === catalogo.subcat);
      if (s) lista = lista.filter(i => s.re.test(i.nome));
    }
    if (termo) lista = lista.filter(i => i.nome.toLocaleLowerCase('pt').includes(termo));
    if (catalogo.filtros.promo) lista = lista.filter(ehPromo);
    if (catalogo.filtros.disp)  lista = lista.filter(produtoDisponivel);
    if (catalogo.filtros.preco) {
      const [min, max] = catalogo.filtros.preco.split('-').map(Number);
      lista = lista.filter(i => {
        const c = precoItem(i);
        if (!Number.isFinite(c)) return false;
        const eur = c / 100;
        return eur >= min && eur < max;
      });
    }
    ordenarLista(lista);

    catalogo.filtrados = lista;
    renderCatalogo();
  }

  function ordenarPreco() {
    catalogo.pagina = 1;
    aplicarCatalogo();
  }

  /* ══ SEARCH ══ */
  function pesquisar() {
    const q = (document.getElementById('search-input').value || '').trim();
    document.getElementById('search-clear').classList.toggle('visible', q.length > 0);
    catalogo.pagina = 1;
    aplicarCatalogo();
    // Se a categoria atual não tem resultados, salta para outra categoria que tenha.
    if (q && catalogo.filtrados.length === 0) {
      const termo = q.toLocaleLowerCase('pt');
      for (const cat of ['frutas','legumes','ervas','epoca','promocoes']) {
        if (cat === catalogo.categoria) continue;
        const tem = CATEGORIAS[cat].fonte().some(i => i.nome.toLocaleLowerCase('pt').includes(termo));
        if (tem) { mostrarCategoria(cat, document.getElementById(`tab-${cat}`)); break; }
      }
    }
  }

  function limparPesquisa() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-clear').classList.remove('visible');
    catalogo.pagina = 1;
    aplicarCatalogo();
  }

  function limparTudo() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-clear').classList.remove('visible');
    document.getElementById('filter-preco').value = '';
    document.getElementById('price-sort').value = '';
    catalogo.filtros = { promo:false, disp:false, preco:'' };
    catalogo.subcat = ''; catalogo.ordem = ''; catalogo.pagina = 1;
    ['filter-promo','filter-disp'].forEach(id => {
      const b = document.getElementById(id);
      if (b) { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); }
    });
    renderSubcats();
    aplicarCatalogo();
  }

  /* ══ CATEGORY ══ */
  function mostrarCategoria(cat, btn) {
    if (!CATEGORIAS[cat]) return;
    catalogo.categoria = cat;
    catAtual = cat;
    catalogo.subcat = '';
    catalogo.pagina = 1;
    document.querySelectorAll('.cat-tab').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    const tab = btn || document.getElementById(`tab-${cat}`);
    if (tab) { tab.classList.add('active'); tab.setAttribute('aria-selected','true'); }
    renderSubcats();
    aplicarCatalogo();
    fecharFiltros(); // no mobile, escolher categoria fecha o painel de filtros
  }

  function abrirCatalogo(cat) {
    mostrarCategoria(cat, document.getElementById(`tab-${cat}`));
    document.getElementById('produtos').scrollIntoView({ behavior:'smooth', block:'start' });
  }

  // Cabazes têm secção própria — o separador leva o cliente até lá.
  function abrirCabazes() {
    fecharFiltros();
    const el = document.getElementById('cabazes');
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  /* ══ FILTROS: painel lateral / drawer no mobile ══ */
  function toggleFiltros() {
    const sb = document.getElementById('shop-sidebar');
    const bd = document.getElementById('shop-backdrop');
    if (!sb) return;
    const abrir = !sb.classList.contains('open');
    sb.classList.toggle('open', abrir);
    if (bd) bd.hidden = !abrir;
    document.body.classList.toggle('filtros-open', abrir);
  }
  function fecharFiltros() {
    const sb = document.getElementById('shop-sidebar');
    const bd = document.getElementById('shop-backdrop');
    if (sb) sb.classList.remove('open');
    if (bd) bd.hidden = true;
    document.body.classList.remove('filtros-open');
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
    const nCat = key => (CATEGORIAS[key] ? CATEGORIAS[key].fonte().length : 0);
    const contadores = {
      frutas: nCat('frutas'),
      legumes: nCat('legumes'),
      ervas: nCat('ervas'),
      promocoes: nCat('promocoes'),
      cabazes: produtos.cabazes.length,
      epoca: nCat('epoca')
    };
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('count-frutas', contadores.frutas);
    set('count-legumes', contadores.legumes);
    set('count-ervas', contadores.ervas);
    set('count-epoca', contadores.epoca);
    set('count-promocoes', contadores.promocoes);
    set('count-cabazes', contadores.cabazes);
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
  indexarProdutos();
  renderSubcats();
  aplicarCatalogo();
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
    const sbEl = document.getElementById('shop-sidebar'); if (sbEl && sbEl.classList.contains('open')) fecharFiltros();
    const csp = document.getElementById('cs-pop'); if (csp && !csp.hidden) csp.hidden = true;
    const off = document.getElementById('offer-pop'); if (off && !off.hidden && window.fecharOferta) window.fecharOferta();
    const priv = document.getElementById('privacy-modal'); if (priv && !priv.hidden) priv.hidden = true;
  });
