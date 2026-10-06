import { createFileRoute, Link } from "@tanstack/react-router";
import credits from "@/data/credits.json";

export const Route = createFileRoute("/creditos")({
  head: () => ({
    meta: [
      { title: "Créditos das fotos | MUNDIFRUTA" },
      {
        name: "description",
        content: "Créditos e licenças das fotografias do catálogo MUNDIFRUTA em Carnaxide.",
      },
    ],
  }),
  component: Creditos,
});

function Creditos() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link to="/" className="text-sm font-semibold text-leaf">
        Voltar à loja
      </Link>
      <h1 className="mt-3 font-display text-4xl">Créditos das fotos</h1>
      <p className="mt-3 text-sm">
        Algumas fotografias do catálogo são trabalho próprio da MUNDIFRUTA. As restantes vêm do Wikimedia Commons, com
        licença que permite uso comercial. Obrigado aos autores.
      </p>
      <p className="mt-2 text-sm">
        As imagens de cabazes são meramente ilustrativas. Bravo de Esmolfe usa um marcador até haver uma foto da loja.
      </p>
      <ul className="mt-6 space-y-2">
        {credits.map((item) => (
          <li key={item.name} className="rounded-lg border border-line bg-card px-3 py-2 text-sm">
            <strong>{item.name}</strong>
            {" — "}
            {item.text.replace(item.name, "").replace(/^—\s*/, "")}{" "}
            {item.source ? (
              <a className="text-leaf" href={item.source} target="_blank" rel="noreferrer">
                fonte
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}
