import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search, ShoppingBasket, X } from "lucide-react";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart, useUi } from "@/lib/cart";
import { formatarCentimos, LOJA, porId, precoLinhaCentimos, totaisDe, whatsappHref } from "@/lib/shop";

const NAV = [
  { href: "/produtos", label: "Produtos" },
  { href: "/categorias/promocoes", label: "Promoções" },
  { href: "/categorias/cabazes", label: "Cabazes" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [menu, setMenu] = useState(false);
  const [busca, setBusca] = useState(false);
  const [consent, setConsent] = useState(true);
  const qty = useCart((state) => state.qty);
  const setCartOpen = useUi((state) => state.setCartOpen);
  const toast = useUi((state) => state.toast);
  const linhas = Object.entries(qty)
    .map(([id, qtd]) => {
      const produto = porId(id);
      return produto ? { produto, qtd } : null;
    })
    .filter((linha): linha is { produto: NonNullable<ReturnType<typeof porId>>; qtd: number } => Boolean(linha));
  const totais = totaisDe(linhas);

  useEffect(() => {
    void useCart.persist.rehydrate();
    setConsent(Boolean(localStorage.getItem("mf_consent")));
  }, []);

  useEffect(() => {
    setMenu(false);
    setBusca(false);
  }, [path]);

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const q = String(data.get("q") || "").trim();
    void navigate({ to: "/produtos", search: q ? { q } : {} });
  }

  function guardarConsentimento(valor: "essential" | "all") {
    localStorage.setItem("mf_consent", valor);
    setConsent(true);
  }

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
        Saltar para o conteúdo
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="font-display text-xl tracking-tight">
            MUNDI<span className="text-leaf">FRUTA</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-4 text-sm font-medium lg:flex" aria-label="Principal">
            <Link to="/produtos" className="hover:text-leaf">
              Produtos
            </Link>
            <Link to="/categorias/$categoria" params={{ categoria: "promocoes" }} className="hover:text-leaf">
              Promoções
            </Link>
            <Link to="/categorias/$categoria" params={{ categoria: "cabazes" }} className="hover:text-leaf">
              Cabazes
            </Link>
            <Link to="/" hash="quem-somos" className="hover:text-leaf">
              Quem Somos
            </Link>
            <Link to="/" hash="contacto" className="hover:text-leaf">
              Contacto
            </Link>
          </nav>
          <form role="search" onSubmit={pesquisar} className="ml-auto hidden md:block">
            <label className="sr-only" htmlFor="busca">
              Pesquisar produtos
            </label>
            <input
              id="busca"
              name="q"
              placeholder="Pesquisar"
              className="h-11 w-44 rounded-lg border border-line bg-card px-3 lg:w-52"
            />
          </form>
          <button
            type="button"
            className="ml-auto grid size-11 place-items-center md:hidden"
            aria-label="Pesquisar"
            aria-expanded={busca}
            onClick={() => setBusca((value) => !value)}
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            className="relative grid size-11 place-items-center"
            aria-label={`Abrir carrinho, ${totais.quantidade} artigos`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBasket className="size-5" />
            {totais.quantidade > 0 ? (
              <span className="absolute top-1 right-1 grid min-w-5 place-items-center rounded-full bg-fruit px-1 text-xs font-semibold text-paper">
                {totais.quantidade}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className="grid size-11 place-items-center lg:hidden"
            aria-label={menu ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menu}
            onClick={() => setMenu((value) => !value)}
          >
            {menu ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {busca ? (
          <form role="search" onSubmit={pesquisar} className="border-t border-line px-4 py-3 md:hidden">
            <label className="sr-only" htmlFor="busca-m">
              Pesquisar produtos
            </label>
            <input id="busca-m" name="q" autoFocus placeholder="Pesquisar fruta ou legumes" className="h-11 w-full rounded-lg border border-line bg-card px-3" />
          </form>
        ) : null}
        {menu ? (
          <nav className="flex flex-col border-t border-line px-4 py-2 lg:hidden" aria-label="Menu">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="flex h-11 items-center text-base">
                {item.label}
              </a>
            ))}
            <Link to="/" hash="quem-somos" className="flex h-11 items-center">
              Quem Somos
            </Link>
            <Link to="/" hash="contacto" className="flex h-11 items-center">
              Contacto
            </Link>
            <a className="flex h-11 items-center" href={whatsappHref()} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className="flex h-11 items-center" href={LOJA.mapas} target="_blank" rel="noreferrer">
              Como chegar
            </a>
          </nav>
        ) : null}
      </header>
      <main id="conteudo">{children}</main>
      <footer className="mt-8 bg-leaf-deep text-paper">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
          <div>
            <p className="font-display text-2xl">
              MUNDI<span className="text-foam">FRUTA</span>
            </p>
            <p className="mt-2 text-sm text-foam">Frutas e legumes frescos em Carnaxide. Levantamento na loja.</p>
          </div>
          <div className="text-sm">
            <p>{LOJA.morada}</p>
            <p>{LOJA.cp}</p>
            <p className="mt-2">{LOJA.horarioLongo}</p>
            <a className="mt-2 inline-block font-semibold" href={LOJA.telefoneHref}>
              {LOJA.telefone}
            </a>
          </div>
          <nav className="flex flex-col gap-2 text-sm" aria-label="Rodapé">
            <Link to="/produtos">Produtos</Link>
            <Link to="/categorias/$categoria" params={{ categoria: "promocoes" }}>
              Promoções
            </Link>
            <Link to="/categorias/$categoria" params={{ categoria: "cabazes" }}>
              Cabazes
            </Link>
            <Link to="/privacidade">Privacidade</Link>
            <Link to="/creditos">Créditos das fotos</Link>
          </nav>
        </div>
        <p className="border-t border-leaf px-4 py-4 text-center text-xs text-foam">© 2026 MUNDIFRUTA · Carnaxide</p>
      </footer>
      <CartDrawer />
      <div className="fixed inset-x-0 bottom-0 z-40">
        {totais.quantidade > 0 ? (
          <button
            type="button"
            className="flex h-14 w-full items-center justify-between bg-leaf px-4 text-sm font-semibold text-paper lg:hidden"
            onClick={() => setCartOpen(true)}
          >
            <span>Ver carrinho · {totais.quantidade}</span>
            <span className="tabular-nums">{formatarCentimos(totais.centimos)}</span>
          </button>
        ) : null}
        {!consent ? (
          <div className="border-t border-line bg-ink px-3 py-2 text-xs text-paper">
            <p>
              Carrinho guardado neste dispositivo. Sem publicidade.{" "}
              <Link to="/privacidade" className="underline">
                Privacidade
              </Link>
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="h-10 flex-1 rounded-lg border border-paper" onClick={() => guardarConsentimento("essential")}>
                Só essenciais
              </button>
              <button type="button" className="h-10 flex-1 rounded-lg bg-paper font-semibold text-ink" onClick={() => guardarConsentimento("all")}>
                Aceitar tudo
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {toast ? (
        <p className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-paper" role="status">
          {toast}
        </p>
      ) : null}
      <div className="h-28 lg:h-0" />
    </>
  );
}
