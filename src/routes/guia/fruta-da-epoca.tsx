import { createFileRoute, Link } from "@tanstack/react-router";
import { LOJA, nomeVisivel, porSlug, whatsappHref, type Product } from "@/lib/shop";
import { canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/guia/fruta-da-epoca")({
  head: () => ({
    meta: [
      { title: "Guia da fruta da época em Carnaxide | MUNDIFRUTA" },
      {
        name: "description",
        content:
          "Que fruta está tipicamente de época no outono em Portugal: uva, dióspiro, figo, manga, clementina, romã, marmelo e pêra Rocha. Como escolher e encomendar na MUNDIFRUTA, Carnaxide.",
      },
      {
        property: "og:title",
        content: "Guia da fruta da época em Carnaxide | MUNDIFRUTA",
      },
      {
        property: "og:description",
        content:
          "Guia prático de fruta de outono em Portugal — como escolher, conservar e encomendar para levantamento na loja em Carnaxide.",
      },
    ],
    links: [canonicalLink("/guia/fruta-da-epoca")],
  }),
  component: GuiaFrutaDaEpoca,
});

type GuiaItem = {
  titulo: string;
  slug: string;
  quando: string;
  escolher: string;
  conservar: string;
  dica?: string;
};

const OUTONO: GuiaItem[] = [
  {
    titulo: "Uva",
    slug: "uva-dona-maria",
    quando: "Fim de verão e outono — Dona Maria, Vale de Rosa e outras castas portuguesas.",
    escolher: "Cacho firme, bagos bem pegados e com o pedúnculo verde. Evite bagos moles ou com cheiro azedo.",
    conservar: "Na parte menos fria do frigorífico, sem lavar até servir. Consuma em poucos dias.",
  },
  {
    titulo: "Dióspiro",
    slug: "diospiros-kaki",
    quando: "Outono clássico em Portugal — Sharon e outras variedades de polpa firme ou macia.",
    escolher: "Casca lisa, sem manchas profundas. Se preferir firme, escolha ainda um pouco duro; para comer à colher, deixe amadurecer.",
    conservar: "À temperatura ambiente até amadurecer; depois no frigorífico por 2–3 dias.",
  },
  {
    titulo: "Figo",
    slug: "figos",
    quando: "Final de verão e início de outono — curta e intensa.",
    escolher: "Figo macio ao toque, com aroma doce e pele intacta. Muito maduro estraga-se depressa.",
    conservar: "Coma no próprio dia ou guarde no frigorífico por 1–2 dias. Não empilhe.",
  },
  {
    titulo: "Manga",
    slug: "manga-aviao",
    quando: "Presente no outono nas lojas portuguesas (origem tropical); boa alternativa à fruta de verão.",
    escolher: "Cheire junto ao pé: aroma doce e casca que cede um pouco ao toque. Evite zonas enrugadas ou moles.",
    conservar: "Amadureça à temperatura ambiente; depois no frigorífico. Corte só quando madura.",
  },
  {
    titulo: "Clementina",
    slug: "clementina",
    quando: "Outono e inverno — começa mais cedo que a laranja de sumo.",
    escolher: "Fruto pesado para o tamanho, casca fina e fácil de descascar, sem zonas moles.",
    conservar: "Em local fresco ou no frigorífico. Aguenta bem uma semana se estiver intacta.",
  },
  {
    titulo: "Romã",
    slug: "roma",
    quando: "Outono — temporada curta e muito apreciada na cozinha e em sumos.",
    escolher: "Casca firme, cor viva e peso notável (muitos bagos). Evite rachas profundas ou bolor.",
    conservar: "Inteira, à temperatura ambiente ou no frigorífico várias semanas. Os bagos, já limpos, no frigorífico 3–4 dias.",
  },
  {
    titulo: "Marmelo",
    slug: "marmelo",
    quando: "Outono — tipicamente para doce, geleia ou assados (raramente se come cru).",
    escolher: "Aroma forte e doce, casca amarela sem danificações graves. O perfume é o melhor indicador.",
    conservar: "Em local fresco e arejado. Não precisa de frigorífico se for usar em poucos dias.",
    dica: "Ideal para marmelada caseira e acompanhamentos de queijo.",
  },
  {
    titulo: "Pêra Rocha",
    slug: "pera-rocha",
    quando: "Outono e além — a pêra portuguesa por excelência, muito comum em Carnaxide e arredores.",
    escolher: "Pele com a típica ferrugem da Rocha, firme mas não pétrea. Amadurece bem fora do frigorífico.",
    conservar: "Para amadurecer: à temperatura ambiente. Para atrasar: frigorífico. Não guarde junto de bananas muito maduras se quiser abrandar o processo.",
  },
];

function produtoOuNulo(slug: string): Product | null {
  return porSlug(slug) ?? null;
}

function CartaoProduto({ slug, fallbackNome }: { slug: string; fallbackNome: string }) {
  const produto = produtoOuNulo(slug);
  if (!produto) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-card p-3 text-sm text-muted">
        {fallbackNome} — confirme disponibilidade na loja.
      </div>
    );
  }
  return (
    <Link
      to="/produtos/$slug"
      params={{ slug: produto.slug }}
      className="flex gap-3 rounded-lg border border-line bg-card p-3 transition hover:border-leaf"
    >
      <img
        src={produto.foto}
        alt={produto.alt || nomeVisivel(produto)}
        width={72}
        height={72}
        loading="lazy"
        decoding="async"
        className="h-[72px] w-[72px] shrink-0 rounded-md bg-foam object-contain p-1"
      />
      <span className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="font-semibold">{nomeVisivel(produto)}</span>
        <span className="text-sm text-leaf">Ver preço atual no produto →</span>
      </span>
    </Link>
  );
}

function GuiaFrutaDaEpoca() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-muted" aria-label="Navegação">
        <Link to="/" className="font-semibold text-leaf">
          Início
        </Link>
        <span aria-hidden="true"> · </span>
        <Link to="/categorias/$categoria" params={{ categoria: "frutas-da-epoca" }} className="font-semibold text-leaf">
          Fruta da época
        </Link>
        <span aria-hidden="true"> · </span>
        <span>Guia</span>
      </nav>

      <h1 className="mt-3 font-display text-4xl tracking-tight">Guia da fruta da época em Carnaxide</h1>
      <p className="mt-3 text-base text-muted">
        Um guia prático para o outono em Portugal: que frutas costumam estar de época, como as escolher e como encomendar
        na MUNDIFRUTA para levantamento na loja — sem preços inventados neste artigo.
      </p>

      <section className="mt-8 space-y-4 text-sm">
        <h2 className="font-display text-2xl">Porquê fruta da época?</h2>
        <p>
          Comprar fruta na sua época natural costuma significar melhor sabor, melhor relação qualidade/preço e menos
          transporte. Em Portugal, o outono traz uvas, dióspiros, figos (no início), clementinas, romãs, marmelos e a
          pêra Rocha — e ainda mangas de boa qualidade nas frutarias.
        </p>
        <p>
          <strong>Nota importante:</strong> a melancia <em>não</em> é fruta típica de outono. É de verão. Se a vir no
          guia de “época” de outra loja nesta altura, trate-a como exceção de stock, não como referência sazonal.
        </p>
        <p>
          Os preços mudam com o mercado. Neste guia só encontrará dicas e ligações aos produtos do catálogo — use{" "}
          <em>«ver preço atual no produto»</em> para o valor do dia.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Frutas de outono em Portugal</h2>
        <ol className="mt-4 space-y-8">
          {OUTONO.map((item, index) => (
            <li key={item.slug} className="rounded-lg border border-line bg-card p-4 sm:p-5">
              <h3 className="font-display text-xl">
                <span className="text-muted">{index + 1}. </span>
                {item.titulo}
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="font-semibold text-leaf">Quando</dt>
                  <dd>{item.quando}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-leaf">Como escolher</dt>
                  <dd>{item.escolher}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-leaf">Como conservar</dt>
                  <dd>{item.conservar}</dd>
                </div>
                {item.dica ? (
                  <div>
                    <dt className="font-semibold text-leaf">Na cozinha</dt>
                    <dd>{item.dica}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="mt-4">
                <CartaoProduto slug={item.slug} fallbackNome={item.titulo} />
              </div>
              {item.slug === "uva-dona-maria" ? (
                <div className="mt-2">
                  <CartaoProduto slug="uva-vale-de-rosa-sem-grainha" fallbackNome="Uva sem grainha" />
                </div>
              ) : null}
              {item.slug === "manga-aviao" ? (
                <div className="mt-2">
                  <CartaoProduto slug="manguita" fallbackNome="Manga" />
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 space-y-4 text-sm">
        <h2 className="font-display text-2xl">Como encomendar na MUNDIFRUTA</h2>
        <p>Não fazemos entrega ao domicílio. O fluxo é simples e pensado para levantamento na loja:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <strong>Encomenda no site</strong> — escolha os produtos no catálogo e monte o carrinho.
          </li>
          <li>
            <strong>WhatsApp</strong> — envie o pedido pelo WhatsApp da loja para confirmarmos disponibilidade e
            preparação.
          </li>
          <li>
            <strong>Levantamento na loja</strong> — passe buscar à MUNDIFRUTA quando estiver pronto.
          </li>
        </ol>
        <div className="rounded-lg border border-line bg-foam p-4">
          <p className="font-semibold">{LOJA.nome}</p>
          <p>
            {LOJA.morada}
            <br />
            {LOJA.cp}
          </p>
          <p className="mt-2">{LOJA.horarioLongo}</p>
          <p className="mt-2">
            Telefone / WhatsApp:{" "}
            <a className="font-semibold text-leaf" href={LOJA.telefoneHref}>
              {LOJA.telefone}
            </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              className="inline-flex h-11 items-center rounded-lg bg-leaf px-4 text-sm font-semibold text-paper"
              href={whatsappHref("Olá! Vi o guia da fruta da época e gostava de encomendar.")}
              target="_blank"
              rel="noreferrer"
            >
              Abrir WhatsApp
            </a>
            <a
              className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-4 text-sm font-semibold"
              href={LOJA.mapas}
              target="_blank"
              rel="noreferrer"
            >
              Como chegar
            </a>
            <Link
              to="/categorias/$categoria"
              params={{ categoria: "frutas-da-epoca" }}
              className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-4 text-sm font-semibold"
            >
              Ver fruta da época
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-3 text-sm">
        <h2 className="font-display text-2xl">Mais no catálogo</h2>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              to="/categorias/$categoria"
              params={{ categoria: "frutas" }}
              className="inline-flex h-10 items-center rounded-lg border border-line bg-card px-3 font-semibold hover:border-leaf"
            >
              Todas as frutas
            </Link>
          </li>
          <li>
            <Link
              to="/categorias/$categoria"
              params={{ categoria: "promocoes" }}
              className="inline-flex h-10 items-center rounded-lg border border-line bg-card px-3 font-semibold hover:border-leaf"
            >
              Promoções
            </Link>
          </li>
          <li>
            <Link
              to="/produtos"
              className="inline-flex h-10 items-center rounded-lg border border-line bg-card px-3 font-semibold hover:border-leaf"
            >
              Todos os produtos
            </Link>
          </li>
        </ul>
        <p className="text-muted">
          Este guia é educativo e sazonal (outono em Portugal). A disponibilidade real depende do dia — confirme sempre
          no produto ou por WhatsApp.
        </p>
      </section>
    </article>
  );
}
