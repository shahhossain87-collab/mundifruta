import { createFileRoute, Link } from "@tanstack/react-router";
import { imgResponsiva } from "@/lib/img";
import { ProductCard } from "@/components/product-card";
import { adicionarProduto } from "@/lib/cart";
import {
  avaliacoes,
  categorias,
  disponivel,
  LOJA,
  nomeVisivel,
  novidades,
  porNome,
  precoVista,
  produtosDaCategoria,
  whatsappHref,
} from "@/lib/shop";
import { absoluteUrl, canonicalLink, LOJA_MORADA_SCHEMA, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fruta e legumes em Carnaxide | MUNDIFRUTA" },
      {
        name: "description",
        content:
          "Frutas e legumes frescos em Carnaxide. Encomende por WhatsApp e levante na loja. Seg–Sáb 8h–20h, Dom 10h–13h. Pagamento na loja.",
      },
    ],
    links: [canonicalLink("/")],
  }),
  component: Home,
});

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.2 1.5Z" />
    </svg>
  );
}

function Home() {
  const destaques = novidades();
  const cabazes = produtosDaCategoria("cabazes");
  const outono = porNome("Cabaz de Outono");
  const cabaz = outono && disponivel(outono) ? outono : cabazes.find((item) => disponivel(item));
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
    sameAs: [LOJA.google, LOJA.facebook, LOJA.instagram],
    address: LOJA_MORADA_SCHEMA,
    geo: { "@type": "GeoCoordinates", latitude: 38.726346, longitude: -9.241328 },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: LOJA.nota.replace(",", "."),
      reviewCount: LOJA.avaliacoes,
      bestRating: "5",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "20:00",
      },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "10:00", closes: "13:00" },
    ],
  };
  const vistaCabaz = cabaz ? precoVista(cabaz) : null;

  return (
    <div className="hv">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="hv-hero" aria-labelledby="hero-titulo">
        <img
          className="hv-hero-img"
          src="/fotos/home/hero-banner.webp"
          srcSet="/fotos/home/hero-banner-w800.webp 800w, /fotos/home/hero-banner-w1200.webp 1200w, /fotos/home/hero-banner.webp 1920w"
          sizes="100vw"
          width={1920}
          height={1080}
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="hv-hero-shade" />
        <div className="hv-wrap hv-hero-body">
          <h1 id="hero-titulo">Fruta e legumes frescos, todos os dias.</h1>
          <p className="hv-pick">Levantamento na loja, em Carnaxide</p>
          <div className="hv-cta">
            <a
              href={whatsappHref("Olá MUNDIFRUTA! Gostaria de fazer uma encomenda para levantar na loja.")}
              target="_blank"
              rel="noreferrer"
              className="hv-btn hv-btn-wa"
            >
              <WhatsAppIcon />
              Encomendar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="hv-section hv-section-cats" aria-labelledby="categorias-titulo">
        <div className="hv-wrap">
          <h2 id="categorias-titulo" className="sr-only">
            Categorias
          </h2>
          <div className="hv-cats">
            {categoriasDestaque.map((categoria) => (
              <Link key={categoria.slug} to="/categorias/$categoria" params={{ categoria: categoria.slug }} className="hv-cat">
                <img
                  {...imgResponsiva(`/fotos/home/tile-${categoria.slug}.webp`, "(min-width: 700px) 380px, 34vw")}
                  alt=""
                  loading="eager"
                  decoding="async"
                />
                <span>
                  {categoria.label}
                  <i>{produtosDaCategoria(categoria.slug).length} produtos</i>
                </span>
              </Link>
            ))}
          </div>
          <div className="hv-strip">
            <span>
              <span className="hv-stars" aria-hidden="true">
                ★★★★★
              </span>
              <a href="#reviews-titulo">
                <strong>{LOJA.nota}</strong> · {LOJA.avaliacoes} avaliações Google
              </a>
            </span>
            <span>Levantamento na loja, em Carnaxide · {LOJA.horario}</span>
            <Link to="/produtos" className="hv-more">
              Ver todos os produtos
            </Link>
          </div>
        </div>
      </section>

      {destaques.length > 0 ? (
        <section className="hv-section" style={{ paddingTop: 0 }} aria-labelledby="novidades-titulo">
          <div className="hv-wrap">
            <div className="hv-head">
              <div>
                <h2 id="novidades-titulo" className="hv-h2">
                  Novidades
                </h2>
                <p className="hv-sub">Acabaram de chegar. Preço válido enquanto houver.</p>
              </div>
              <Link to="/categorias/$categoria" params={{ categoria: "promocoes" }} className="hv-more">
                Ver promoções
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
              {destaques.slice(0, 4).map((produto) => (
                <ProductCard key={produto.id} product={produto} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {cabaz && vistaCabaz ? (
        <section className="hv-basket" aria-labelledby="cabaz-titulo">
          <div className="hv-basket-grid">
            <img
              {...imgResponsiva(cabaz.foto, "(min-width: 900px) 590px, 100vw")}
              alt={cabaz.alt || nomeVisivel(cabaz)}
              loading="lazy"
              decoding="async"
            />
            <div className="hv-basket-body">
              <h2 id="cabaz-titulo" className="hv-h2">
                {nomeVisivel(cabaz)}
              </h2>
              <p className="hv-price-big">
                {vistaCabaz.principal}
                {vistaCabaz.unidade ? <small>{vistaCabaz.unidade}</small> : null}
              </p>
              {cabaz.itens && cabaz.itens.length > 0 ? (
                <p className="hv-basket-list">{cabaz.itens.map((item) => item.nome).join(", ")}.</p>
              ) : null}
              {cabaz.nota ? <p className="hv-note">{cabaz.nota}</p> : null}
              <div className="hv-basket-actions">
                <button type="button" className="hv-btn hv-btn-ink" onClick={() => adicionarProduto(cabaz.id)}>
                  Adicionar ao carrinho
                </button>
                <Link to="/categorias/$categoria" params={{ categoria: "cabazes" }} className="hv-btn hv-btn-line">
                  Ver todos os cabazes
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="hv-section" aria-labelledby="como-titulo">
        <div className="hv-wrap">
          <div className="hv-head">
            <h2 id="como-titulo" className="hv-h2">
              Como encomendar
            </h2>
          </div>
          <ol className="hv-steps">
            <li className="hv-step">
              <div>
                <h3>Veja os produtos no site</h3>
                <p>Escolha frutas, legumes ou um cabaz.</p>
              </div>
            </li>
            <li className="hv-step">
              <div>
                <h3>Envie a encomenda por WhatsApp</h3>
                <p>Adicione ao carrinho e confirme o subtotal.</p>
              </div>
            </li>
            <li className="hv-step">
              <div>
                <h3>Levante e pague na loja</h3>
                <p>Centro Cívico, Carnaxide.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="hv-section" aria-labelledby="reviews-titulo">
        <div className="hv-wrap">
          <div className="hv-rating">
            <span className="hv-score">{LOJA.nota}</span>
            <div>
              <div className="hv-stars" aria-hidden="true" style={{ fontSize: "1.4rem" }}>
                ★★★★★
              </div>
              <h2 id="reviews-titulo" style={{ fontSize: "1rem", fontWeight: 400, letterSpacing: 0 }}>
                {LOJA.avaliacoes} avaliações no Google
              </h2>
            </div>
          </div>
          <div className="hv-reviews">
            {avaliacoes.map((avaliacao) => (
              <figure key={avaliacao.nome} className="hv-review">
                <blockquote>{avaliacao.texto}</blockquote>
                <figcaption>
                  {avaliacao.nome}
                  <span className="sr-only">, {avaliacao.estrelas} de 5 estrelas</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <a className="hv-more" style={{ display: "inline-block", marginTop: "1.5rem" }} href={LOJA.google} target="_blank" rel="noreferrer">
            Ver todas as avaliações no Google
          </a>
        </div>
      </section>

      <section className="hv-section hv-store" aria-labelledby="loja-titulo">
        <div className="hv-wrap hv-store-grid">
          <img
            {...imgResponsiva("/fotos/loja/fachada.webp", "(min-width: 900px) 590px, 92vw")}
            alt="Fachada da loja MUNDIFRUTA no Centro Cívico de Carnaxide, com bancas de fruta e chapéus vermelhos"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h2 id="loja-titulo" className="hv-h2">
              A nossa loja
            </h2>
            <dl>
              <div>
                <dt>Morada</dt>
                <dd>
                  {LOJA.morada}
                  <br />
                  {LOJA.cp}
                </dd>
              </div>
              <div>
                <dt>Horário</dt>
                <dd>{LOJA.horarioLongo}</dd>
              </div>
              <div>
                <dt>Telefone e WhatsApp</dt>
                <dd>
                  <a href={LOJA.telefoneHref}>{LOJA.telefone}</a>
                </dd>
              </div>
            </dl>
            <div className="hv-cta" style={{ marginTop: 0 }}>
              <a
                href={whatsappHref("Olá MUNDIFRUTA! Gostaria de fazer uma encomenda para levantar na loja.")}
                target="_blank"
                rel="noreferrer"
                className="hv-btn hv-btn-wa"
              >
                <WhatsAppIcon />
                Encomendar por WhatsApp
              </a>
              <a href={LOJA.mapas} target="_blank" rel="noreferrer" className="hv-btn hv-btn-line">
                Como chegar
              </a>
            </div>
          </div>
        </div>
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
