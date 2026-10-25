import variants from "@/data/img-variants.json";

type Info = { w: number; h: number; v: number[] };
const MAPA = variants as Record<string, Info>;

/** Responsive attributes (srcSet + intrinsic width/height) for a local /fotos image. */
export function imgResponsiva(src: string, sizes: string) {
  const info = MAPA[src];
  if (!info) return { src } as { src: string; srcSet?: string; sizes?: string; width?: number; height?: number };
  const base = src.replace(/\.webp$/, "");
  const srcSet = [...info.v.map((w) => `${base}-w${w}.webp ${w}w`), `${src} ${info.w}w`].join(", ");
  return { src, srcSet: info.v.length ? srcSet : undefined, sizes: info.v.length ? sizes : undefined, width: info.w, height: info.h };
}
