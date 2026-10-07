import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { Gift, Minus, Plus, X } from "lucide-react";
import { useCart, useUi } from "@/lib/cart";
import {
  normalizarTelefone,
  registadoNesteDispositivo,
  registarOferta,
  verificarOferta,
  type EstadoOferta,
} from "@/lib/oferta-cliente";
import {
  disponivel,
  formatarCentimos,
  LOJA,
  nomeVisivel,
  NOTA_PESO,
  OFERTA,
  pesoMedio,
  porId,
  precoLinhaCentimos,
  precoVista,
  textoEncomenda,
  totaisDe,
  whatsappHref,
} from "@/lib/shop";

export function CartDrawer() {
  const open = useUiOpen();
  const qty = useCart((state) => state.qty);
  const nome = useCart((state) => state.nome);
  const telefone = useCart((state) => state.telefone);
  const levantamento = useCart((state) => state.levantamento);
  const nota = useCart((state) => state.nota);
  const setCliente = useCart((state) => state.setCliente);
  const setQty = useCart((state) => state.setQty);
  const remove = useCart((state) => state.remove);
  const clear = useCart((state) => state.clear);
  const setOpen = useUiSet();
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState("");
  const [aEnviar, setAEnviar] = useState(false);
  // Estado da oferta MUNDI10 por número normalizado (verificado no servidor).
  const [estadosOferta, setEstadosOferta] = useState<Record<string, EstadoOferta>>({});

  const linhas = Object.entries(qty)
    .map(([id, qtd]) => {
      const produto = porId(id);
      return produto ? { produto, qtd } : null;
    })
    .filter((linha): linha is { produto: NonNullable<ReturnType<typeof porId>>; qtd: number } => Boolean(linha));
  const totais = totaisDe(linhas);
  const faltam = Math.max(0, OFERTA.minimoEur * 100 - totais.centimos);
  const progresso = Math.min(100, Math.round((totais.centimos / (OFERTA.minimoEur * 100)) * 100));
  const telefoneNormalizado = normalizarTelefone(telefone);
  // Só bloqueia quando o servidor confirma que o número já usou a oferta;
  // qualquer falha ("desconhecido") mantém o comportamento anterior.
  const ofertaUsada = telefoneNormalizado ? estadosOferta[telefoneNormalizado] === "usada" : false;

  function guardarEstado(numero: string, estado: EstadoOferta) {
    setEstadosOferta((atual) => ({ ...atual, [numero]: estado }));
  }

  async function verificarTelefone() {
    const numero = normalizarTelefone(telefone);
    if (!numero || estadosOferta[numero] === "usada" || estadosOferta[numero] === "livre") return;
    const estado = await verificarOferta(numero);
    if (estado === "usada" || estado === "livre") guardarEstado(numero, estado);
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (!linhas.length || aEnviar) return;
    if (!nome.trim() || !telefone.trim()) {
      setErro("Indique o nome e o telemóvel.");
      return;
    }
    setErro("");
    const numero = normalizarTelefone(telefone);
    let semOferta = numero ? estadosOferta[numero] === "usada" : false;
    if (totais.oferta && numero && !semOferta) {
      if (estadosOferta[numero] === "livre" || registadoNesteDispositivo(numero)) {
        // Já verificado: abre o WhatsApp já e regista em segundo plano.
        void registarOferta(numero, qty).then((estado) => {
          if (estado === "registada") guardarEstado(numero, "livre");
        });
      } else {
        setAEnviar(true);
        const estado = await registarOferta(numero, qty, 2500);
        setAEnviar(false);
        if (estado === "usada") {
          semOferta = true;
          guardarEstado(numero, "usada");
        } else if (estado === "registada") {
          guardarEstado(numero, "livre");
        }
      }
    }
    const texto = textoEncomenda({ nome, telefone, levantamento, nota, linhas, semOferta });
    const href = whatsappHref(texto);
    setEnviado(href);
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex max-h-dvh w-full max-w-md flex-col overflow-hidden bg-paper shadow-none">
          <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
            <Dialog.Title className="font-display text-2xl">A sua encomenda</Dialog.Title>
            <Dialog.Close className="grid size-11 place-items-center rounded-lg" aria-label="Fechar carrinho">
              <X className="size-5" />
            </Dialog.Close>
          </div>
          {/* Uma única área com scroll (lista + formulário) para funcionar ao toque em telemóveis. */}
          <div
            data-cart-scroll
            className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
          >
            <div className="px-4 py-4">
              {!linhas.length ? (
                <div className="space-y-3">
                  <p>O carrinho está vazio.</p>
                  <div className="rounded-lg border border-fruit/30 bg-fruit/10 px-3 py-2 text-sm">
                    <p className="flex items-center gap-2 font-semibold">
                      <Gift className="size-4 shrink-0 text-fruit" aria-hidden="true" />
                      Novo cliente? −{OFERTA.descontoEur}€ na primeira compra a partir de {OFERTA.minimoEur}€ (código{" "}
                      {OFERTA.codigo})
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Na primeira compra, {OFERTA.descontoEur}€ indicados a partir de {OFERTA.minimoEur}€. Uma vez por
                      cliente (número de telemóvel), confirmado na loja.
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <Link to="/produtos" className="inline-flex h-11 items-center rounded-lg bg-leaf px-4 text-sm font-semibold text-paper">
                      Ver produtos
                    </Link>
                  </Dialog.Close>
                </div>
              ) : (
                <ul className="space-y-4">
                  {linhas.map(({ produto, qtd }) => {
                    const vista = precoVista(produto);
                    const preco = precoLinhaCentimos(produto);
                    const subtotal = preco === null ? "A confirmar" : formatarCentimos(preco * qtd);
                    return (
                      <li key={produto.id} className="border-b border-line pb-4">
                        <div className="flex gap-3">
                          <img
                            src={produto.foto}
                            alt=""
                            width={72}
                            height={72}
                            className="size-16 rounded-lg bg-foam object-contain"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{nomeVisivel(produto)}</p>
                            <p className="text-xs text-muted">{vista.unidade}</p>
                            {!disponivel(produto) ? <p className="text-xs text-warn">Esgotado — confirme com a loja</p> : null}
                            <p className="mt-1 text-sm tabular-nums">
                              {vista.principal}
                              {pesoMedio(produto) ? " · estimado" : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums">{subtotal}</p>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="grid h-11 w-32 grid-cols-3 overflow-hidden rounded-lg border border-line bg-card">
                            <button type="button" aria-label="Diminuir" onClick={() => setQty(produto.id, qtd - 1)}>
                              <Minus className="mx-auto size-4" />
                            </button>
                            <span className="flex items-center justify-center tabular-nums">{qtd}</span>
                            <button type="button" aria-label="Aumentar" onClick={() => setQty(produto.id, qtd + 1)}>
                              <Plus className="mx-auto size-4" />
                            </button>
                          </div>
                          <button type="button" className="h-11 px-2 text-sm text-muted" onClick={() => remove(produto.id)}>
                            Remover
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {linhas.length ? (
              <div className="border-t border-line bg-card px-4 py-4">
                <div className="mb-3 space-y-1 text-sm">
                  <p className="flex justify-between gap-4">
                    <span>Subtotal estimado</span>
                    <strong className="tabular-nums">{formatarCentimos(totais.centimos)}</strong>
                  </p>
                  {totais.porConfirmar ? (
                    <p className="text-xs text-muted">
                      {totais.porConfirmar} {totais.porConfirmar === 1 ? "artigo" : "artigos"} com preço a confirmar.
                    </p>
                  ) : null}
                  {totais.estimado ? <p className="text-xs text-muted">{NOTA_PESO}</p> : null}
                  {ofertaUsada ? (
                    <p className="rounded-lg border border-line bg-paper px-3 py-2 text-sm" role="status">
                      Este número já usou a oferta {OFERTA.codigo} (válida só na primeira compra).
                    </p>
                  ) : totais.oferta ? (
                    <div className="rounded-lg border border-leaf/30 bg-foam px-3 py-2 text-sm">
                      <p className="flex justify-between gap-4 font-semibold text-leaf-deep">
                        <span className="flex items-center gap-2">
                          <Gift className="size-4 shrink-0" aria-hidden="true" />
                          Oferta indicada
                        </span>
                        <span className="tabular-nums">−{formatarCentimos(totais.desconto)}</span>
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {OFERTA.codigo}: {OFERTA.descontoEur}€ na primeira compra a partir de {OFERTA.minimoEur}€. Uma vez por
                        cliente (número de telemóvel), confirmado na loja.
                      </p>
                      <p className="mt-1 flex justify-between gap-4">
                        <span>Total estimado com oferta</span>
                        <strong className="tabular-nums">{formatarCentimos(totais.comOferta)}</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-fruit/30 bg-fruit/10 px-3 py-2">
                      <p className="flex items-center gap-2 text-sm font-semibold">
                        <Gift className="size-4 shrink-0 text-fruit" aria-hidden="true" />
                        <span>
                          Faltam <span className="tabular-nums text-fruit">{formatarCentimos(faltam)}</span> para{" "}
                          {OFERTA.minimoEur}€ e −{OFERTA.descontoEur}€ ({OFERTA.codigo})
                        </span>
                      </p>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-line"
                        role="progressbar"
                        aria-label={`Progresso para ${OFERTA.minimoEur}€`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progresso}
                      >
                        <div className="h-full rounded-full bg-fruit transition-[width]" style={{ width: `${progresso}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        A partir de {OFERTA.minimoEur}€, a primeira compra pode incluir {OFERTA.descontoEur}€ de desconto,
                        confirmados na loja.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted">Pagamento na loja: MB WAY, Multibanco ou dinheiro. Sem entrega.</p>
                </div>
                <form className="space-y-2" onSubmit={enviar} noValidate>
                  <label className="block text-sm font-medium" htmlFor="cust-nome">
                    Nome
                    <input
                      id="cust-nome"
                      name="name"
                      autoComplete="name"
                      value={nome}
                      onChange={(event) => setCliente({ nome: event.target.value })}
                      className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3"
                    />
                  </label>
                  <label className="block text-sm font-medium" htmlFor="cust-tel">
                    Telemóvel
                    <input
                      id="cust-tel"
                      name="tel"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={telefone}
                      onChange={(event) => setCliente({ telefone: event.target.value })}
                      onBlur={() => void verificarTelefone()}
                      maxLength={40}
                      className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3"
                    />
                  </label>
                  <label className="block text-sm font-medium" htmlFor="cust-hora">
                    Hora de levantamento
                    <input
                      id="cust-hora"
                      value={levantamento}
                      placeholder="Por exemplo, 17h30"
                      onChange={(event) => setCliente({ levantamento: event.target.value })}
                      className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3"
                    />
                  </label>
                  <label className="block text-sm font-medium" htmlFor="cust-nota">
                    Nota
                    <textarea
                      id="cust-nota"
                      value={nota}
                      onChange={(event) => setCliente({ nota: event.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2"
                    />
                  </label>
                  {erro ? <p className="text-sm text-warn">{erro}</p> : null}
                  <button
                    type="submit"
                    disabled={aEnviar}
                    className="h-11 w-full rounded-lg bg-leaf text-sm font-semibold text-paper disabled:opacity-70"
                  >
                    {aEnviar ? "A preparar…" : "Enviar por WhatsApp"}
                  </button>
                  <p className="text-xs text-muted">
                    A MUNDIFRUTA confirma a encomenda por WhatsApp antes do levantamento. O pedido só fica reservado depois
                    dessa confirmação. {LOJA.horario}.
                  </p>
                  {enviado ? (
                    <p className="text-sm">
                      Se o WhatsApp não abriu,{" "}
                      <a className="font-semibold text-leaf" href={enviado} target="_blank" rel="noreferrer">
                        abra esta mensagem
                      </a>
                      .
                    </p>
                  ) : null}
                  <button type="button" className="h-11 text-sm text-muted" onClick={() => clear()}>
                    Esvaziar carrinho
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function useUiOpen() {
  return useUi((state) => state.cartOpen);
}
function useUiSet() {
  return useUi((state) => state.setCartOpen);
}

