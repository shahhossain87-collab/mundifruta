import { createFileRoute, Link } from "@tanstack/react-router";
import { ProductCard } from "@/components/product-card";
import { adicionarProduto } from "@/lib/cart";
import {
  avaliacoes,
  categorias,
  disponivel,
  LOJA,
  nomeVisivel,
  novidades,
  precoVista,
  produtosDaCategoria,
  selecionados,
  whatsappHref,
} from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fruta e legumes em Carnaxide | MUNDIFRUTA" },
      {
        name: "description",
        content:
          "Frutas e legumes frescos em Carnaxide. Encomende por WhatsApp e levante na loja. Seg–Dom, 8h–20h. Pagamento na loja.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const destaques = novidades();
  const escolha = selecionados();
  const cabazes = produtosDaCategoria("cabazes");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: "MUNDIFRUTA",
    telephone: "+351932699850",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. de Portugal, Centro Cívico, Loja 24-C",
      postalCode: "2790-129",
      addressLocality: "Carnaxide",
      addressRegion: "Oeiras",
      addressCountry: "PT",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "20:00",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: String(LOJA.avaliacoes),
      bestRating: "5",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-4 md:grid-cols-[1.15fr_0.85fr] md:py-10">
          <div>
            <h1 className="font-display text-3xl leading-tight md:text-5xl">Frutas e legumes frescos em Carnaxide</h1>
            <ul className="mt-4 space-y-1 text-sm text-muted">
              <li>{LOJA.horario}</li>
              <li>Encomendas por WhatsApp</li>
              <li>Levantamento na loja</li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/produtos" className="inline-flex h-11 items-center rounded-lg bg-leaf px-4 text-sm font-semibold text-paper">
                Ver produtos
              </Link>
              <a
                href={whatsappHref("Olá MUNDIFRUTA! Gostaria de fazer uma pergunta.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-lg border border-line bg-card px-4 text-sm font-semibold"
              >
                WhatsApp
              </a>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-3 md:grid">
            <img src="/fotos/loja/uva-dona-maria.webp" alt="Uva Dona Maria" width={480} height={480} className="aspect-square rounded-lg bg-foam object-contain p-4" />
            <img src="/fotos/loja/roma.webp" alt="Romã em promoção" width={480} height={480} className="mt-8 aspect-square rounded-lg bg-foam object-contain p-4" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4" aria-labelledby="novidades-titulo">
        <div className="flex items-end justify-between gap-3">
          <h2 id="novidades-titulo" className="font-display text-3xl">
            Novidades
          </h2>
          <Link to="/categorias/$categoria" params={{ categoria: "promocoes" }} className="text-sm font-semibold text-leaf">
            Ver promoções
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted">Acabaram de chegar. Preço válido enquanto houver.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {destaques.map((produto) => (
            <ProductCard key={produto.id} product={produto} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-5" aria-labelledby="categorias-titulo">
        <h2 id="categorias-titulo" className="font-display text-3xl">
          Comprar por categoria
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {categorias.map((categoria) => (
            <Link
              key={categoria.slug}
              to="/categorias/$categoria"
              params={{ categoria: categoria.slug }}
              className="flex items-center gap-3 rounded-lg border border-line bg-card p-3"
            >
              <img src={categoria.foto} alt="" width={64} height={64} className="size-14 rounded-lg bg-foam object-contain" />
              <span>
                <span className="block font-semibold">{categoria.label}</span>
                <span className="text-xs text-muted">{produtosDaCategoria(categoria.slug).length} produtos</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="selecao-titulo">
        <div className="flex items-end justify-between gap-3">
          <h2 id="selecao-titulo" className="font-display text-3xl">
            A sair agora
          </h2>
          <Link to="/produtos" className="text-sm font-semibold text-leaf">
            Ver tudo
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {escolha.map((produto) => (
            <ProductCard key={produto.id} product={produto} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4" aria-labelledby="cabazes-titulo">
        <div className="flex items-end justify-between gap-3">
          <h2 id="cabazes-titulo" className="font-display text-3xl">
            Cabazes
          </h2>
          <Link to="/categorias/$categoria" params={{ categoria: "cabazes" }} className="text-sm font-semibold text-leaf">
            Ver cabazes
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {cabazes.map((cabaz) => {
            const vista = precoVista(cabaz);
            return (
              <article key={cabaz.id} className="grid grid-cols-[112px_1fr] gap-3 rounded-lg border border-line bg-card p-3 sm:grid-cols-[160px_1fr]">
                <img src={cabaz.foto} alt={cabaz.alt || nomeVisivel(cabaz)} width={320} height={320} loading="lazy" className="aspect-square rounded-lg bg-foam object-contain" />
                <div>
                  <h3 className="font-display text-2xl">{nomeVisivel(cabaz)}</h3>
                  <p className="text-xs text-muted">{vista.unidade}</p>
                  <p className="font-display text-2xl text-fruit tabular-nums">{vista.principal}</p>
                  <p className="mt-1 text-xs text-muted">{cabaz.nota}</p>
                  <details className="mt-2 text-sm">
                    <summary className="cursor-pointer font-semibold">Ver o que leva</summary>
                    <ul className="mt-2 space-y-1">
                      {cabaz.itens?.map((item, index) => (
                        <li key={`${item.nome}-${index}`}>
                          {item.grupo ? <span className="mt-2 block text-xs font-semibold text-muted">{item.grupo}</span> : null}
                          {item.q} · {item.nome}
                        </li>
                      ))}
                    </ul>
                  </details>
                  {disponivel(cabaz) ? (
                    <button type="button" className="mt-3 h-11 rounded-lg bg-leaf px-4 text-sm font-semibold text-paper" onClick={() => adicionarProduto(cabaz.id)}>
                      Adicionar
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="reviews-titulo">
        <h2 id="reviews-titulo" className="font-display text-3xl">
          Google
        </h2>
        <p className="mt-2 text-sm">
          {LOJA.nota} em {LOJA.avaliacoes} avaliações no Google.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {avaliacoes.map((avaliacao) => (
            <figure key={avaliacao.nome} className="rounded-lg border border-line bg-card p-4">
              <blockquote className="text-sm">{avaliacao.texto}</blockquote>
              <figcaption className="mt-3 text-sm font-semibold">
                {avaliacao.nome}
                <span className="ml-2 font-normal text-muted">{avaliacao.estrelas}/5</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <a className="mt-4 inline-block text-sm font-semibold text-leaf" href={LOJA.google} target="_blank" rel="noreferrer">
          Ver todas as avaliações no Google
        </a>
      </section>

      <section id="quem-somos" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="font-display text-3xl">Quem somos</h2>
          <p className="mt-3 max-w-2xl text-sm">
            Há mais de 12 anos em Carnaxide, fazemos parte da comunidade local. Continuamos dedicados a oferecer frutas e
            legumes frescos, preços justos e um atendimento próximo e de confiança.
          </p>
          <p className="mt-2 text-sm text-muted">Frescura do dia, preços justos e atendimento de proximidade.</p>
        </div>
      </section>

      <section id="contacto" className="scroll-mt-20 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl">A loja</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold">Morada</dt>
                <dd>
                  {LOJA.morada}
                  <br />
                  {LOJA.cp}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Horário</dt>
                <dd>{LOJA.horarioLongo}</dd>
              </div>
              <div>
                <dt className="font-semibold">Telefone e WhatsApp</dt>
                <dd>
                  <a className="font-semibold text-leaf" href={LOJA.telefoneHref}>
                    {LOJA.telefone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Encomendas</dt>
                <dd>Por WhatsApp. Levantamento e pagamento na loja. Sem entrega ao domicílio.</dd>
              </div>
            </dl>
            <a className="mt-4 inline-flex h-11 items-center text-sm font-semibold text-leaf" href={LOJA.mapas} target="_blank" rel="noreferrer">
              Como chegar
            </a>
          </div>
          <iframe
            title="Localização MUNDIFRUTA"
            src={LOJA.mapaEmbed}
            loading="lazy"
            className="h-72 w-full rounded-lg border border-line"
          />
        </div>
      </section>
    </div>
  );
}
