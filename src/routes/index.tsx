import { createFileRoute, Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { OfferCard } from "@/components/offer";
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
import { absoluteUrl, canonicalLink, LOJA_MORADA_SCHEMA, SITE_URL } from "@/lib/seo";

const HERO_PILHAS: [string, number][] = [
  ["diospiro", 388],
  ["castanhas", 263],
  ["abobora", 338],
  ["roma", 433],
  ["laranja", 324],
  ["grelos", 278],
  ["maca", 340],
  ["uva", 254],
];

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
    links: [
      canonicalLink("/"),
      { rel: "preload", as: "image", href: "/fotos/home/grid/diospiro.webp", type: "image/webp", fetchPriority: "high" },
      { rel: "preload", as: "image", href: "/fotos/home/grid/castanhas.webp", type: "image/webp" },
    ],
  }),
  component: Home,
});

function Home() {
  const destaques = novidades();
  const escolha = selecionados();
  const cabazes = produtosDaCategoria("cabazes");
  const categoriasDestaque = ["frutas", "legumes", "cabazes", "promocoes", "frutas-da-epoca", "ervas-frescas"]
    .map((slug) => categorias.find((categoria) => categoria.slug === slug))
    .filter((categoria): categoria is (typeof categorias)[number] => Boolean(categoria));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    "@id": `${SITE_URL}/#loja`,
    name: "MUNDIFRUTA",
    url: `${SITE_URL}/`,
    image: absoluteUrl("/fotos/loja/fachada.webp"),
    telephone: "+351932699850",
    priceRange: "€",
    hasMap: LOJA.google,
    sameAs: [LOJA.google],
    address: LOJA_MORADA_SCHEMA,
    geo: { "@type": "GeoCoordinates", latitude: 38.726, longitude: -9.2391 },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: LOJA.nota.replace(",", "."),
      reviewCount: LOJA.avaliacoes,
      bestRating: "5",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "20:00",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative isolate overflow-hidden bg-leaf-deep text-white" aria-labelledby="hero-titulo">
        {/* Seasonal fruit piles in a grid (2x3 phone, 4x2 desktop). Gentle transform-only zoom, staggered per cell. */}
        <div className="hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          {HERO_PILHAS.map(([nome, altura], i) => (
            <div key={nome} className="hero-cell" style={{ "--d": `${i * -0.8}s` } as CSSProperties}>
              <img
                src={`/fotos/home/grid/${nome}.webp`}
                alt=""
                width={480}
                height={altura}
                loading={i < 6 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={i < 2 ? "high" : "auto"}
              />
            </div>
          ))}
        </div>
        {/* Gradient keeps the text readable: from the bottom on phones, from the left on desktop. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/55 to-black/0 md:bg-gradient-to-r md:from-black/80 md:via-black/45 md:to-black/0"
          aria-hidden="true"
        />
        <div className="mx-auto flex min-h-[19.5rem] max-w-6xl flex-col justify-end px-4 pt-24 pb-4 md:min-h-[24rem] md:justify-center md:py-12">
          <div className="hero-rise max-w-xl [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
            <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm [text-shadow:none]">
              <i className="size-1.5 rounded-full bg-[#25D366]" aria-hidden="true" /> Frescura local em Carnaxide
            </span>
            <h1 id="hero-titulo" className="font-display text-[1.75rem] leading-tight md:text-5xl">
              Frutas e legumes <em className="not-italic text-[#ffd54a]">frescos todos os dias</em>
            </h1>
            <p className="mt-1 text-base font-semibold md:mt-2 md:text-lg">Escolha a sua seleção, encomende por WhatsApp e levante na loja.</p>
            <p className="mt-1 text-xs text-white/90 md:text-sm"><a href="#reviews-titulo" className="font-semibold text-[#ffd54a]">★★★★★ {LOJA.nota}</a> · {LOJA.horario} · Sem entrega ao domicílio</p>
            <div className="mt-3 flex flex-wrap gap-2 [text-shadow:none] md:mt-5">
              <a
                href={whatsappHref("Olá MUNDIFRUTA! Gostaria de fazer uma encomenda para levantar na loja.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-lg bg-[#25D366] px-5 text-sm font-semibold text-white shadow-md"
              >
                Encomendar por WhatsApp <span aria-hidden="true" className="ml-1">↗</span>
              </a>
              <Link
                to="/produtos"
                className="inline-flex h-11 items-center rounded-lg bg-white/95 px-4 text-sm font-semibold text-leaf-deep shadow-md"
              >
                Ver produtos <span aria-hidden="true" className="ml-1">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-3 pb-2 md:pt-6" aria-labelledby="categorias-titulo">
        <span className="text-xs font-semibold tracking-wide text-leaf uppercase">Comprar por categoria</span>
        <div className="flex items-end justify-between gap-3">
          <h2 id="categorias-titulo" className="font-display text-xl md:text-3xl">
            Encontre o que procura
          </h2>
          <Link to="/produtos" className="text-sm font-semibold text-leaf">
            Ver tudo
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted">Frutas, legumes, cabazes e os destaques desta semana, prontos a levantar na loja.</p>
        <div className="mt-2 grid grid-cols-2 gap-2.5 sm:gap-3 md:mt-4 lg:grid-cols-6">
          {categoriasDestaque.map((categoria, index) => (
            <Link
              key={categoria.slug}
              to="/categorias/$categoria"
              params={{ categoria: categoria.slug }}
              className="group relative isolate block aspect-[4/3] overflow-hidden rounded-2xl bg-foam shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img
                src={`/fotos/home/tile-${categoria.slug}.webp`}
                alt=""
                width={560}
                height={420}
                loading="eager"
                decoding="async"
                className="tile-drift absolute inset-0 -z-10 h-full w-full object-cover"
                style={{ "--tile-delay": `${-index * 1.7}s` } as CSSProperties}
              />
              <span className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-black/75 to-black/0" aria-hidden="true" />
              <span className="absolute inset-x-0 bottom-0 p-2.5 text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.6)] sm:p-3">
                <span className="block font-display text-lg leading-tight font-semibold sm:text-xl">{categoria.label}</span>
                <span className="block text-xs text-white/90">{produtosDaCategoria(categoria.slug).length} produtos</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <OfferCard />

      <section className="mx-auto max-w-6xl px-4 pt-4" aria-labelledby="como-titulo">
        <h2 id="como-titulo" className="sr-only">
          Como encomendar
        </h2>
        <ol className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
          {["Veja os produtos no site", "Envie a encomenda por WhatsApp", "Levante e pague na loja"].map((passo, index) => (
            <li key={passo} className="rounded-xl border border-line bg-card px-2 py-2.5">
              <span className="mx-auto mb-1 grid size-6 place-items-center rounded-full bg-leaf text-xs font-bold text-paper">{index + 1}</span>
              {passo}
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-6" aria-labelledby="loja-titulo">
        <div className="grid items-center gap-4 rounded-2xl border border-line bg-card p-3 sm:grid-cols-[minmax(0,26rem)_1fr] sm:p-4">
          <img
            src="/fotos/loja/fachada.webp"
            alt="Fachada da loja MUNDIFRUTA no Centro Cívico de Carnaxide, com bancas de fruta e chapéus vermelhos"
            width={720}
            height={591}
            loading="lazy"
            decoding="async"
            className="aspect-[720/591] w-full rounded-xl object-cover"
          />
          <div>
            <h2 id="loja-titulo" className="font-display text-2xl md:text-3xl">
              A nossa loja
            </h2>
            <p className="mt-1 text-sm">Centro Cívico, loja 24C, Carnaxide · {LOJA.horario}</p>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-fruit">{LOJA.nota} ★</span> ({LOJA.avaliacoes} avaliações Google)
            </p>
            <p className="mt-2 text-sm text-muted">Há mais de 12 anos em Carnaxide. Encomende por WhatsApp e levante na loja.</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-leaf">
              <a href={LOJA.mapas} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center">
                Como chegar
              </a>
              <a href="#reviews-titulo" className="inline-flex h-9 items-center">
                Ler avaliações
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4" aria-labelledby="novidades-titulo">
        <div className="flex items-end justify-between gap-3">
          <h2 id="novidades-titulo" className="font-display text-3xl">
            Novidades
          </h2>
          <div className="flex gap-3 text-sm font-semibold text-leaf">
            <Link to="/produtos">Ver tudo</Link>
            <Link to="/categorias/$categoria" params={{ categoria: "promocoes" }}>
              Ver promoções
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted">Acabaram de chegar. Preço válido enquanto houver.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {destaques.slice(0, 4).map((produto) => (
            <ProductCard key={produto.id} product={produto} />
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
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {escolha.slice(0, 4).map((produto) => (
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
