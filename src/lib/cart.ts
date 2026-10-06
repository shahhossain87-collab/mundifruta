import { create } from "zustand";
import { persist } from "zustand/middleware";
import { disponivel, nomeVisivel, porId } from "@/lib/shop";

type Cliente = {
  nome: string;
  telefone: string;
  levantamento: string;
  nota: string;
};

type CartState = Cliente & {
  qty: Record<string, number>;
  setCliente: (patch: Partial<Cliente>) => void;
  add: (id: string, n?: number) => void;
  setQty: (id: string, n: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      qty: {},
      nome: "",
      telefone: "",
      levantamento: "",
      nota: "",
      setCliente: (patch) => set(patch),
      add: (id, n = 1) =>
        set((state) => ({
          qty: { ...state.qty, [id]: (state.qty[id] ?? 0) + Math.max(1, n) },
        })),
      setQty: (id, n) =>
        set((state) => {
          const qty = { ...state.qty };
          if (n <= 0) delete qty[id];
          else qty[id] = n;
          return { qty };
        }),
      remove: (id) =>
        set((state) => {
          const qty = { ...state.qty };
          delete qty[id];
          return { qty };
        }),
      clear: () => set({ qty: {} }),
    }),
    {
      name: "mf_cart",
      skipHydration: true,
      partialize: (state) => ({ qty: state.qty }),
    },
  ),
);

type UiState = {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (message: string) => void;
};

let toastTimer = 0;

export const useUi = create<UiState>((set) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  toast: null,
  showToast: (toast) => {
    set({ toast });
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => set({ toast: null }), 2200);
  },
}));

export function adicionarProduto(id: string, quantidade = 1) {
  const produto = porId(id);
  if (!produto || !disponivel(produto)) return;
  useCart.getState().add(id, quantidade);
  useUi.getState().showToast(`${nomeVisivel(produto)} adicionado`);
}

export function linhasCarrinho() {
  const qty = useCart.getState().qty;
  return Object.entries(qty)
    .map(([id, qtd]) => {
      const produto = porId(id);
      return produto ? { produto, qtd } : null;
    })
    .filter((linha): linha is { produto: NonNullable<ReturnType<typeof porId>>; qtd: number } => Boolean(linha));
}
