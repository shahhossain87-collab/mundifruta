import { createFileRoute, Link } from "@tanstack/react-router";
import { LOJA, OFERTA, whatsappHref } from "@/lib/shop";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade | MUNDIFRUTA" },
      {
        name: "description",
        content: "Como a MUNDIFRUTA trata os dados da encomenda e o que fica guardado neste dispositivo.",
      },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-4xl">Privacidade</h1>
      <div className="mt-4 space-y-4 text-sm">
        <p>A MUNDIFRUTA respeita a sua privacidade e o RGPD.</p>
        <h2 className="font-display text-2xl">Que dados usamos</h2>
        <p>
          O nome, o telemóvel e a nota que escreve na encomenda servem apenas para preparar o pedido. São enviados por si
          através do WhatsApp. O site não guarda a encomenda num servidor.
        </p>
        <p>O carrinho fica neste dispositivo, no armazenamento do browser, até o esvaziar ou limpar os dados do site.</p>
        <h2 className="font-display text-2xl">Cookies e estatísticas</h2>
        <p>
          Não carregamos publicidade nem estatísticas de terceiros. “Só essenciais” e “Aceitar tudo” guardam apenas a sua
          escolha neste dispositivo. Pode apagá-la nas definições do browser.
        </p>
        <h2 className="font-display text-2xl">Oferta de primeira compra</h2>
        <p>
          A oferta {OFERTA.codigo} ({OFERTA.descontoEur}€ a partir de {OFERTA.minimoEur}€) é indicativa. A loja confirma no
          levantamento, uma vez por cliente. Este site não tem contas de cliente e não verifica se a compra é a primeira.
        </p>
        <h2 className="font-display text-2xl">Os seus direitos</h2>
        <p>
          Pode pedir acesso ou eliminação dos dados da encomenda pelo WhatsApp{" "}
          <a className="font-semibold text-leaf" href={whatsappHref()} target="_blank" rel="noreferrer">
            {LOJA.telefone}
          </a>
          .
        </p>
        <p>
          <Link to="/" className="font-semibold text-leaf">
            Voltar à loja
          </Link>
        </p>
      </div>
    </article>
  );
}
