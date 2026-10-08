import catalog from "@/data/catalog.json";

export const LOJA = {
  nome: "MUNDIFRUTA",
  telefone: "932 699 850",
  telefoneHref: "tel:932699850",
  whatsapp: "351932699850",
  morada: "Av. de Portugal, Centro Cívico, Loja 24-C",
  cp: "2790-129 Carnaxide",
  horario: "Seg–Dom · 8h–20h",
  horarioLongo: "Segunda a domingo, 8:00–20:00",
  mapas:
    "https://www.google.com/maps/dir/?api=1&destination=Mundifruta-Carnaxide%2C+Av.+de+Portugal%2C+Centro+C%C3%ADvico%2C+Loja+24-C%2C+2790-129+Carnaxide",
  mapaEmbed:
    "https://maps.google.com/maps?q=Mundifruta-Carnaxide,%20Av%20de%20Portugal,%20Centro%20C%C3%ADvico,%20loja%2024-C,%202790-129%20Carnaxide&hl=pt&z=17&output=embed",
  google: catalog.avaliacoesInfo.link,
  nota: catalog.avaliacoesInfo.nota,
  avaliacoes: catalog.avaliacoesInfo.total,
} as const;

export const OFERTA = {
  codigo: catalog.cupao.codigo,
  descontoEur: catalog.cupao.desconto,
  minimoEur: catalog.cupao.minimo,
  titulo: catalog.cupao.copyTitulo,
  exclusivo: catalog.cupao.copyExclusivo,
} as const;

export const NOTA_PESO =
  "Preço estimado com base no peso médio. O valor final pode variar conforme o peso real no momento da preparação.";

const NOMES: Record<string, string> = {
  "Nectarina grande premium quality": "Nectarina grande",
  "Kiwi Green New Zealand": "Kiwi verde",
  "Laranja África do Sul premium quality": "Laranja da África do Sul",
  "Bravo Esmolfe premium": "Bravo de Esmolfe",
  "Abacaxi Avião Costa Rica": "Abacaxi da Costa Rica",
};

export type Grupo = "frutas" | "legumes" | "cabazes";

export type CabazLinha = { grupo?: string; q: string; nome: string };

export type Product = {
  id: string;
  slug: string;
  nome: string;
  grupo: Grupo;
  peso?: string;
  preco: string;
  precoNormal?: string;
  promo?: boolean;
  origem?: string;
  foto: string;
  alt?: string;
  badge?: string | null;
  status?: string;
  venda?: string;
  pricePerKg?: number;
  averageWeightKg?: number;
  weightRange?: string;
  baseLinha?: string;
  topVendido?: boolean;
  rel?: string[];
  nota?: string;
  itens?: CabazLinha[];
};

export const produtos = catalog.produtos as Product[];
export const avaliacoes = catalog.avaliacoes;

export type Categoria = {
  slug: string;
  key: "frutas" | "legumes" | "ervas" | "epoca" | "promocoes" | "cabazes";
  label: string;
  titulo: string;
  intro: string;
  foto: string;
};

export const categorias: Categoria[] = [
  {
    slug: "frutas",
    key: "frutas",
    label: "Frutas",
    titulo: "Frutas",
    intro:
      "Fruta fresca na MUNDIFRUTA, em Carnaxide. Preço por quilo, cuvete ou unidade. Encomenda por WhatsApp e levantamento na loja.",
    foto: "/fotos/catalogo/morango-500g.webp",
  },
  {
    slug: "legumes",
    key: "legumes",
    label: "Legumes",
    titulo: "Legumes",
    intro:
      "Legumes do dia na MUNDIFRUTA, Carnaxide. Veja a unidade de venda e o preço antes de adicionar ao carrinho.",
    foto: "/fotos/catalogo/tomate-salada.webp",
  },
  {
    slug: "ervas-frescas",
    key: "ervas",
    label: "Ervas frescas",
    titulo: "Ervas frescas",
    intro: "Ervas aromáticas à mão, em molho ou saqueta, para levar no mesmo dia.",
    foto: "/fotos/catalogo/hortela.webp",
  },
  {
    slug: "frutas-da-epoca",
    key: "epoca",
    label: "Fruta da época",
    titulo: "Fruta da época",
    intro: "Uva, dióspiro, figo, manga, clementina e romã. O que está nesta altura na loja.",
    foto: "/fotos/loja/uva-dona-maria.webp",
  },
  {
    slug: "promocoes",
    key: "promocoes",
    label: "Promoções",
    titulo: "Promoções",
    intro: "Produtos com preço promocional marcado pela loja. O preço do carrinho é o preço em promoção.",
    foto: "/fotos/catalogo/pera-rocha-nacional-pequena.webp",
  },
  {
    slug: "cabazes",
    key: "cabazes",
    label: "Cabazes",
    titulo: "Cabazes",
    intro:
      "Cestos preparados pela loja. A imagem é ilustrativa; a lista mostra a composição indicada. Levantamento na loja.",
    foto: "/fotos/catalogo/cabaz-frutas.webp",
  },
];

const ERVAS = new Set(["Salsa", "Coentros", "Hortelã", "Agrião"]);

export const subcategorias: Record<string, { key: string; label: string; re: RegExp }[]> = {
  frutas: [
    { key: "banana-maca-pera", label: "Banana, maçã e pera", re: /banana|maçã|maca|pêra|pera|esmolfe|marmelo/i },
    { key: "citrinos", label: "Laranja, limão e citrinos", re: /laranja|lim(ã|a)o|lima|tangerina|clementina/i },
    { key: "vermelhos", label: "Frutos vermelhos", re: /morango|framboesa|mirtilo|amora|cereja|rom(ã|a)/i },
    {
      key: "tropicais",
      label: "Uvas e tropicais",
      re: /uva|manga|manguita|abacaxi|anan(á|a)s|papaia|mam(ã|a)o|kiwi|abacate|lichia|anona|castanha/i,
    },
    { key: "caroco", label: "Pêssego e ameixa", re: /p(ê|e)ssego|paraguaio|nectarina|ameixa|alperce|d(i|í)(o|ó)spiro|kaki/i },
    { key: "melao-melancia", label: "Melão e melancia", re: /mel(ã|a)o|melancia|meloa|figo/i },
  ],
  legumes: [
    { key: "batatas-cebolas", label: "Batatas e cebolas", re: /batata|cebola|alho/i },
    { key: "tomates", label: "Tomates", re: /tomate/i },
    {
      key: "couves-folhas",
      label: "Couves e folhas",
      re: /couve|alface|espinafre|grelo|nabi(ç|c)a|agri(ã|a)o|br(ó|o)colos/i,
    },
    {
      key: "raizes",
      label: "Raízes e outros",
      re: /cenoura|nabo|beterraba|gengibre|rabanete|mandioca|inhame|ab(ó|o)bora|curgete|beringela|pepino|pimento|feij(ã|a)o|cogumelo|malagueta|quiabo|chuchu|ma(ç|c)aroca/i,
    },
  ],
};

export type Ordem = "relevancia" | "preco-asc" | "preco-desc" | "az" | "za";
export type BandaPreco = "" | "ate2" | "2a5" | "mais5";

export type ShopQuery = {
  q: string;
  ordem: Ordem;
  sub: string;
  disp: boolean;
  promo: boolean;
  preco: BandaPreco;
};

export type ShopSearch = {
  q?: string;
  ordem?: string;
  sub?: string;
  disp?: boolean;
  promo?: boolean;
  preco?: string;
};

const ORDENS = new Set<Ordem>(["relevancia", "preco-asc", "preco-desc", "az", "za"]);
const BANDAS = new Set<BandaPreco>(["", "ate2", "2a5", "mais5"]);

export function parseShopSearch(search: Record<string, unknown>): ShopSearch {
  const ordem = typeof search.ordem === "string" && ORDENS.has(search.ordem as Ordem) ? search.ordem : undefined;
  const preco = typeof search.preco === "string" && BANDAS.has(search.preco as BandaPreco) ? search.preco : undefined;
  const flag = (value: unknown) => value === true || value === "true" || value === "1";
  return {
    q: typeof search.q === "string" && search.q.trim() ? search.q : undefined,
    ordem,
    sub: typeof search.sub === "string" && search.sub ? search.sub : undefined,
    disp: flag(search.disp) || undefined,
    promo: flag(search.promo) || undefined,
    preco: preco || undefined,
  };
}

export function queryFromSearch(search: ShopSearch): ShopQuery {
  return {
    q: search.q ?? "",
    ordem: (search.ordem as Ordem) || "relevancia",
    sub: search.sub ?? "",
    disp: Boolean(search.disp),
    promo: Boolean(search.promo),
    preco: (search.preco as BandaPreco) || "",
  };
}

export function searchFromQuery(query: ShopQuery): ShopSearch {
  return {
    q: query.q.trim() || undefined,
    ordem: query.ordem === "relevancia" ? undefined : query.ordem,
    sub: query.sub || undefined,
    disp: query.disp || undefined,
    promo: query.promo || undefined,
    preco: query.preco || undefined,
  };
}

export function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function nomeVisivel(produto: Product) {
  return NOMES[produto.nome] ?? produto.nome;
}

export function porId(id: string) {
  return produtos.find((produto) => produto.id === id);
}

export function porSlug(slug: string) {
  return produtos.find((produto) => produto.slug === slug);
}

export function porNome(nome: string) {
  const alvo = norm(nome);
  return produtos.find((produto) => norm(produto.nome) === alvo);
}

export function categoriaPorSlug(slug: string) {
  return categorias.find((categoria) => categoria.slug === slug);
}

export function ehErva(produto: Product) {
  return ERVAS.has(produto.nome);
}

const EPOCA = new Set([
  "figos",
  "diospiros-kaki",
  "manguita",
  "manga-aviao",
  "clementina",
  "clementina-com-folhas",
  "uva-vale-de-rosa-sem-grainha",
  "uva-dona-maria",
  "roma",
  "marmelo",
  "ameixa-roxa-nacional",
  "pera-rocha",
]);

export function ehEpoca(produto: Product) {
  return EPOCA.has(produto.slug);
}

export function disponivel(produto: Product) {
  return produto.status !== "Indisponível";
}

export function sobConfirmacao(produto: Product) {
  return /disponibilidade/i.test(produto.baseLinha || "");
}

export function biologico(produto: Product) {
  return /bio/i.test(produto.badge || "");
}

export type Badge = "Esgotado" | "Promoção" | "Novo" | "Fruta da época";

export function badgeProduto(produto: Product): Badge | null {
  if (!disponivel(produto)) return "Esgotado";
  if (produto.promo) return "Promoção";
  if (/novo/i.test(produto.badge || "")) return "Novo";
  if (ehEpoca(produto)) return "Fruta da época";
  return null;
}

export function estadoProduto(produto: Product) {
  if (!disponivel(produto)) return "Esgotado";
  if (sobConfirmacao(produto)) return "Sob confirmação";
  return "Disponível";
}

export function produtosDaCategoria(slug: string) {
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return [];
  switch (categoria.key) {
    case "frutas":
      return produtos.filter((produto) => produto.grupo === "frutas");
    case "legumes":
      return produtos.filter((produto) => produto.grupo === "legumes" && !ehErva(produto));
    case "ervas":
      return produtos.filter((produto) => produto.grupo === "legumes" && ehErva(produto));
    case "epoca":
      return produtos.filter((produto) => produto.grupo === "frutas" && ehEpoca(produto));
    case "promocoes":
      return produtos.filter((produto) => produto.grupo !== "cabazes" && Boolean(produto.promo));
    case "cabazes":
      return produtos.filter((produto) => produto.grupo === "cabazes");
    default:
      return [];
  }
}

export function todosProdutos() {
  return produtos.filter((produto) => produto.grupo !== "cabazes");
}

export function categoriaDe(produto: Product) {
  if (produto.grupo === "cabazes") return categoriaPorSlug("cabazes")!;
  if (ehErva(produto)) return categoriaPorSlug("ervas-frescas")!;
  if (produto.grupo === "frutas") return categoriaPorSlug("frutas")!;
  return categoriaPorSlug("legumes")!;
}

export function precoCentimos(preco: string | undefined) {
  const texto = String(preco ?? "").trim();
  if (/oferta/i.test(texto)) return 0;
  const valor = texto.match(/(\d+(?:\.\d{3})*)[,.](\d{2})/);
  if (!valor) return null;
  return Number.parseInt(valor[1].replace(/\./g, ""), 10) * 100 + Number.parseInt(valor[2], 10);
}

export function formatarCentimos(centimos: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(centimos / 100);
}

export function pesoMedio(produto: Product) {
  return (
    produto.venda === "estimado" &&
    Number.isFinite(produto.pricePerKg) &&
    Number.isFinite(produto.averageWeightKg)
  );
}

export function precoLinhaCentimos(produto: Product) {
  if (pesoMedio(produto)) {
    return Math.round(produto.pricePerKg! * produto.averageWeightKg! * 100);
  }
  return precoCentimos(produto.preco);
}

function eurosFiltro(produto: Product) {
  if (pesoMedio(produto)) return produto.pricePerKg!;
  const centimos = precoCentimos(produto.preco);
  return centimos === null ? null : centimos / 100;
}

export type PrecoVista = {
  unidade: string;
  principal: string;
  secundario: string;
  rasurado: string;
  estimado: boolean;
  consultar: boolean;
};

function unidadeDe(produto: Product) {
  const peso = (produto.peso || "").trim();
  if (!peso) return "";
  if (/cuvete/i.test(peso)) return peso.charAt(0).toLowerCase() + peso.slice(1);
  if (/^\d+(?:[.,]\d+)?\s*g$/i.test(peso)) return `emb. ${peso}`;
  return peso;
}

export function precoVista(produto: Product): PrecoVista {
  const unidade = unidadeDe(produto);
  const consultar = precoCentimos(produto.preco) === null;
  if (pesoMedio(produto)) {
    const porKg = formatarCentimos(Math.round(produto.pricePerKg! * 100));
    const porUn = formatarCentimos(Math.round(produto.pricePerKg! * produto.averageWeightKg! * 100));
    return {
      unidade,
      principal: `${porKg}/kg`,
      secundario: `aprox. ${porUn}/un`,
      rasurado: "",
      estimado: true,
      consultar: false,
    };
  }
  if (consultar) {
    return { unidade, principal: "A consultar", secundario: "", rasurado: "", estimado: false, consultar: true };
  }
  const porKg = /^\s*1\s*kg\s*$/i.test(produto.peso || "");
  const sufixo = porKg ? "/kg" : "";
  const principal = `${formatarCentimos(precoCentimos(produto.preco)!)}${sufixo}`;
  const rasurado =
    produto.promo && produto.precoNormal && precoCentimos(produto.precoNormal) !== null
      ? `${formatarCentimos(precoCentimos(produto.precoNormal)!)}${sufixo}`
      : "";
  let secundario = "";
  const base = produto.baseLinha && /€\s*\/\s*kg/i.test(produto.baseLinha) ? produto.baseLinha.replace(/^Base:\s*/i, "") : "";
  const peso = produto.peso || "";
  const semComparacao = /molho|unidade|^\s*\d*\s*un\b/i.test(peso);
  if (!porKg && !semComparacao) {
    const gramas = peso.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
    const quilos = peso.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
    const g = gramas
      ? Number.parseFloat(gramas[1].replace(",", "."))
      : quilos
        ? Number.parseFloat(quilos[1].replace(",", ".")) * 1000
        : 0;
    const centimos = precoCentimos(produto.preco);
    if (g > 0 && centimos !== null) {
      secundario = `${formatarCentimos(Math.round(centimos / (g / 1000)))}/kg`;
    }
  }
  if (!secundario && base) secundario = base;
  return { unidade, principal, secundario, rasurado, estimado: false, consultar };
}

export function filtrarProdutos(lista: Product[], query: ShopQuery, categoriaSlug: string | null) {
  let saida = lista.slice();
  if (query.sub && categoriaSlug) {
    const categoria = categoriaPorSlug(categoriaSlug);
    const sub = categoria ? subcategorias[categoria.key]?.find((item) => item.key === query.sub) : undefined;
    if (sub) saida = saida.filter((produto) => sub.re.test(produto.nome));
  }
  const termo = norm(query.q);
  if (termo) {
    saida = saida.filter((produto) => {
      const texto = norm(`${produto.nome} ${nomeVisivel(produto)} ${produto.origem || ""} ${produto.peso || ""}`);
      return texto.includes(termo);
    });
  }
  if (query.disp) saida = saida.filter(disponivel);
  if (query.promo) saida = saida.filter((produto) => Boolean(produto.promo));
  if (query.preco) {
    saida = saida.filter((produto) => {
      const euros = eurosFiltro(produto);
      if (euros === null) return false;
      if (query.preco === "ate2") return euros <= 2;
      if (query.preco === "2a5") return euros > 2 && euros <= 5;
      return euros > 5;
    });
  }
  saida.sort((a, b) => {
    if (query.ordem === "az" || query.ordem === "za") {
      const cmp = nomeVisivel(a).localeCompare(nomeVisivel(b), "pt", { sensitivity: "base" });
      return query.ordem === "za" ? -cmp : cmp;
    }
    if (query.ordem === "preco-asc" || query.ordem === "preco-desc") {
      const pa = eurosFiltro(a);
      const pb = eurosFiltro(b);
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1;
      if (pb === null) return -1;
      return query.ordem === "preco-asc" ? pa - pb : pb - pa;
    }
    const da = disponivel(a) ? 0 : 1;
    const db = disponivel(b) ? 0 : 1;
    if (da !== db) return da - db;
    const promo = Number(Boolean(b.promo)) - Number(Boolean(a.promo));
    if (promo) return promo;
    return nomeVisivel(a).localeCompare(nomeVisivel(b), "pt", { sensitivity: "base" });
  });
  return saida;
}

export function relacionados(produto: Product) {
  const escolhidos: Product[] = [];
  const candidatos = [
    ...(produto.rel || []).map((nome) => porNome(nome)).filter((item): item is Product => Boolean(item)),
    ...produtos.filter((item) => item.grupo === produto.grupo && disponivel(item)),
  ];
  for (const item of candidatos) {
    if (escolhidos.length >= 4) break;
    if (item.id === produto.id || escolhidos.some((existente) => existente.id === item.id)) continue;
    escolhidos.push(item);
  }
  return escolhidos;
}

export function novidades() {
  const nomes = [
    "Figo Premium",
    "Dióspiro Sharon",
    "Manga",
    "Clementina com folhas",
    "Manga Premium",
    "Clementina",
    "Uva sem grainha",
    "Cebola Nacional",
  ];
  return nomes
    .map((nome) => porNome(nome))
    .filter((produto): produto is Product => Boolean(produto && disponivel(produto)));
}

export function selecionados() {
  const usados = new Set(novidades().map((produto) => produto.id));
  const nomes = [
    "Uva Dona Maria",
    "Romã",
    "Pêra Rocha",
    "Marmelo",
    "Ameixa Roxa Nacional",
    "Maçã Royal Gala média",
    "Feijão Verde",
    "Maçaroca",
  ];
  return nomes
    .map((nome) => porNome(nome))
    .filter((produto): produto is Product => Boolean(produto && disponivel(produto) && !usados.has(produto.id)))
    .slice(0, 8);
}

export type Totais = {
  quantidade: number;
  centimos: number;
  porConfirmar: number;
  estimado: boolean;
  oferta: boolean;
  desconto: number;
  comOferta: number;
};

export function totaisDe(linhas: { produto: Product; qtd: number }[]): Totais {
  const totais = linhas.reduce(
    (acc, linha) => {
      acc.quantidade += linha.qtd;
      const preco = precoLinhaCentimos(linha.produto);
      if (preco === null) acc.porConfirmar += 1;
      else acc.centimos += preco * linha.qtd;
      if (pesoMedio(linha.produto)) acc.estimado = true;
      return acc;
    },
    { quantidade: 0, centimos: 0, porConfirmar: 0, estimado: false },
  );
  const oferta = totais.centimos >= OFERTA.minimoEur * 100 && totais.quantidade > 0;
  const desconto = oferta ? OFERTA.descontoEur * 100 : 0;
  return { ...totais, oferta, desconto, comOferta: Math.max(0, totais.centimos - desconto) };
}

export function textoEncomenda(input: {
  nome: string;
  telefone: string;
  levantamento: string;
  nota: string;
  linhas: { produto: Product; qtd: number }[];
  /** Este número já usou a oferta (verificado no servidor): sem linhas MUNDI10. */
  semOferta?: boolean;
}) {
  const totais = totaisDe(input.linhas);
  let texto = `Olá MUNDIFRUTA! Gostaria de fazer uma encomenda para levantamento na loja:\n\nNome: ${input.nome}\nTelemóvel: ${input.telefone}\n`;
  if (input.levantamento.trim()) texto += `Levantamento: ${input.levantamento.trim()}\n`;
  texto += `\nEncomenda:\n`;
  for (const linha of input.linhas) {
    const vista = precoVista(linha.produto);
    const preco = precoLinhaCentimos(linha.produto);
    const subtotal = preco === null ? "A confirmar" : formatarCentimos(preco * linha.qtd);
    const nome =
      nomeVisivel(linha.produto) === linha.produto.nome
        ? linha.produto.nome
        : `${nomeVisivel(linha.produto)} (${linha.produto.nome})`;
    const extra = !disponivel(linha.produto) ? " — indisponível no site, confirmar" : "";
    if (pesoMedio(linha.produto)) {
      texto += `• *${linha.qtd}x* ${nome} (${linha.produto.peso}) — ${vista.principal} — *Subtotal estimado: ${subtotal}*${extra}\n`;
    } else {
      texto += `• *${linha.qtd}x* ${nome}${linha.produto.peso ? ` (${linha.produto.peso})` : ""} — ${linha.produto.preco} = *${subtotal}*${extra}\n`;
    }
  }
  texto += `\n*SUBTOTAL ESTIMADO: ${formatarCentimos(totais.centimos)}*`;
  if (totais.porConfirmar) {
    texto += `\nNota: ${totais.porConfirmar} ${totais.porConfirmar === 1 ? "artigo tem" : "artigos têm"} preço a confirmar.`;
  }
  if (totais.estimado) texto += `\n${NOTA_PESO}`;
  if (totais.oferta && !input.semOferta) {
    texto += `\n\nOferta ${OFERTA.codigo}: -${formatarCentimos(totais.desconto)} indicados na primeira compra de ${OFERTA.minimoEur}€ ou mais.`;
    texto += `\nA loja confirma, uma vez por cliente.`;
    texto += `\n*TOTAL ESTIMADO COM OFERTA, SE CONFIRMADA: ${formatarCentimos(totais.comOferta)}*`;
  }
  if (input.nota.trim()) texto += `\nNotas: ${input.nota.trim()}`;
  texto += `\n\nAguardo confirmação da loja antes do levantamento.`;
  return texto;
}

export function whatsappHref(texto?: string) {
  const base = `https://wa.me/${LOJA.whatsapp}`;
  if (!texto) return base;
  return `${base}?text=${encodeURIComponent(texto)}`;
}

/** Short meta description for search results (Google shows ~155 chars). */
export function metaDescricaoProduto(produto: Product) {
  const LIMITE = 155;
  const base = `${nomeVisivel(produto)} na MUNDIFRUTA, frutaria em Carnaxide (Oeiras).`;
  const estado = !disponivel(produto) ? " De momento esgotado." : "";
  const opcionais = [
    produto.origem ? ` Origem: ${produto.origem}.` : "",
    " Encomende por WhatsApp e levante na loja.",
    " Sem entrega.",
  ];
  let texto = base + estado;
  for (const parte of opcionais) {
    if (parte && (texto + parte).length <= LIMITE) texto += parte;
  }
  return texto;
}

export function descricaoProduto(produto: Product) {
  const partes = [
    `${nomeVisivel(produto)} na MUNDIFRUTA, frutaria em Carnaxide (Oeiras).`,
    produto.peso ? `Unidade de venda: ${produto.peso}.` : "",
    produto.origem ? `Origem indicada: ${produto.origem}.` : "",
    biologico(produto) ? "Marcado como biológico no catálogo da loja." : "",
    sobConfirmacao(produto) ? "Sujeito a confirmação de disponibilidade." : "",
    !disponivel(produto) ? "De momento esgotado." : "",
    "Encomenda por WhatsApp e levantamento na loja. Pagamento na loja. Sem entrega.",
  ];
  return partes.filter(Boolean).join(" ");
}
