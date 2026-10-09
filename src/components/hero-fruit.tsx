import type { CSSProperties } from "react";

/**
 * Decorative, animated fruit layer for the homepage hero.
 * Real shop photos (small WebP crops in /fotos/hero/), CSS-only motion
 * (transform/opacity), disabled under prefers-reduced-motion. Everything is
 * aria-hidden and absolutely positioned, so it never changes the hero height.
 */

const FUNDOS = ["roma", "clementina-folhas", "maca-fuji", "uva-dona-maria"] as const;

type Chip = {
  nome: string;
  className: string;
  dur: number;
  delay: number;
  rot: number;
};

const CHIPS: Chip[] = [
  // Mobile: hide floating chips so they never cover the CTA buttons.
  // Desktop (md+): same positions as before around the shop photos.
  {
    nome: "roma",
    className: "hidden md:block md:right-[45%] md:bottom-[8%] md:size-24",
    dur: 8,
    delay: 0,
    rot: 6,
  },
  {
    nome: "clementina-folhas",
    className: "hidden md:block md:right-[2%] md:bottom-[7%] md:size-20",
    dur: 9.5,
    delay: -3,
    rot: -5,
  },
  {
    nome: "uva-sem-grainha",
    className: "hidden md:block md:right-[38%] md:top-[6%] md:bottom-auto md:size-16",
    dur: 7,
    delay: -1.5,
    rot: 4,
  },
  {
    nome: "manga-premium",
    className: "hidden md:block md:right-[1%] md:top-[4%] md:bottom-auto md:size-16",
    dur: 10,
    delay: -5,
    rot: -7,
  },
  {
    nome: "maca-fuji",
    className: "hidden lg:block lg:right-[47%] lg:top-[38%] lg:size-14",
    dur: 11,
    delay: -2,
    rot: 8,
  },
  {
    nome: "castanha",
    className: "hidden md:block md:right-[20%] md:bottom-[4%] md:size-14",
    dur: 8.5,
    delay: -6,
    rot: -4,
  },
];

export function HeroFruitBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {FUNDOS.map((nome, i) => (
        <img
          key={nome}
          src={`/fotos/hero/bg-${nome}.webp`}
          alt=""
          width={168}
          height={112}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="hero-kb absolute inset-0 h-full w-full object-cover"
          style={{ animationDelay: `${i * 6}s` } as CSSProperties}
        />
      ))}
      {/* Cream veil keeps the text readable (stronger on mobile, where text spans the width). */}
      <div className="absolute inset-0 bg-gradient-to-b from-paper/90 via-paper/80 to-paper/70 md:bg-gradient-to-r md:from-paper md:via-paper/90 md:to-paper/55" />
    </div>
  );
}

export function HeroFruitChips() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {CHIPS.map((chip) => (
        <img
          key={chip.nome}
          src={`/fotos/hero/chip-${chip.nome}.webp`}
          alt=""
          width={96}
          height={96}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className={`hero-float absolute rounded-full object-cover shadow-lg ring-4 ring-card/90 ${chip.className}`}
          style={
            {
              "--hero-dur": `${chip.dur}s`,
              "--hero-delay": `${chip.delay}s`,
              "--hero-rot": `${chip.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
