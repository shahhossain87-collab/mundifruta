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
import { canonicalLink } from "@/lib/seo";

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
    links: [canonicalLink("/")],
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
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative isolate overflow-hidden bg-leaf-deep text-white" aria-labelledby="hero-titulo">
        {/* Real shop photos (mosaic). Sized webp, LCP image: eager + fetchpriority high; box sized by the section, so no layout shift. */}
        <picture className="pointer-events-none absolute inset-0 -z-10 block overflow-hidden" aria-hidden="true">
          <source media="(min-width: 768px)" srcSet="/fotos/home/hero-desktop.webp" width={1600} height={600} type="image/webp" />
          <img
            src="/fotos/home/hero-phone.webp"
            alt=""
            width={780}
            height={680}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="hero-zoom h-full w-full object-cover"
          />
        </picture>
        {/* Gradient keeps the text readable: from the bottom on phones, from the left on desktop. */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/55 to-black/0 md:bg-gradient-to-r md:from-black/80 md:via-black/45 md:to-black/0"
          aria-hidden="true"
        />
        <div className="mx-auto flex min-h-[19.5rem] max-w-6xl flex-col justify-end px-4 pt-24 pb-4 md:min-h-[24rem] md:justify-center md:py-12">
          <div className="max-w-xl [text-shadow:0_1px_3px_rgb(0_0_0/0.6)]">
            <h1 id="hero-titulo" className="font-display text-[1.75rem] leading-tight md:text-5xl">
              Frutas e legumes frescos em Carnaxide
            </h1>
            <p className="mt-1 text-base font-semibold md:mt-2 md:text-lg">Encomende por WhatsApp, levante na loja.</p>
            <p className="mt-1 text-xs text-white/90 md:text-sm">{LOJA.horario} · Sem entrega ao domicílio</p>
            <div className="mt-3 flex flex-wrap gap-2 [text-shadow:none] md:mt-5">
              <a
                href={whatsappHref("Olá MUNDIFRUTA! Gostaria de fazer uma encomenda para levantar na loja.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center rounded-lg bg-[#25D366] px-5 text-sm font-semibold text-white shadow-md"
              >
                Encomendar por WhatsApp
              </a>
              <Link
                to="/produtos"
                className="inline-flex h-11 items-center rounded-lg bg-white/95 px-4 text-sm font-semibold text-leaf-deep shadow-md"
              >
                Ver produtos
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-3 pb-2 md:pt-6" aria-labelledby="categorias-titulo">
        <div className="flex items-end justify-between gap-3">
          <h2 id="categorias-titulo" className="font-display text-xl md:text-3xl">
            Comprar por categoria
          </h2>
          <Link to="/produtos" className="text-sm font-semibold text-leaf">
            Ver tudo
          </Link>
        </div>
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
