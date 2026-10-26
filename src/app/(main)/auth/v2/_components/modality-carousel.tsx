"use client";

import * as React from "react";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface ModalitySlide {
  name: string;
  description: string;
  category: string;
  image: string;
}

const MODALITIES: ModalitySlide[] = [
  {
    name: "Futebol",
    description: "O jogo que move o país, dentro e fora do campo.",
    category: "Desporto coletivo",
    image: "/modalities/futebol.webp",
  },
  {
    name: "Futsal",
    description: "Técnica e velocidade em cada jogada de quadra.",
    category: "Desporto coletivo",
    image: "/modalities/futsal.webp",
  },
  {
    name: "Basquetebol",
    description: "Ritmo, pontos e competição até ao último segundo.",
    category: "Desporto coletivo",
    image: "/modalities/basquetebol.webp",
  },
  {
    name: "Voleibol",
    description: "Rede, equipa e estratégia em cada ponto.",
    category: "Desporto coletivo",
    image: "/modalities/voleibol.webp",
  },
  {
    name: "Andebol",
    description: "Força e precisão para conquistar cada jogada.",
    category: "Desporto coletivo",
    image: "/modalities/andebol.webp",
  },
  {
    name: "Ténis",
    description: "Duelos de raquete, concentração e resistência.",
    category: "Desporto de raquete",
    image: "/modalities/tenis.webp",
  },
  {
    name: "Pádel",
    description: "Jogo de pares, sempre em movimento.",
    category: "Desporto de raquete",
    image: "/modalities/padel.webp",
  },
  {
    name: "Badminton",
    description: "Leveza, reflexos e precisão em cada volante.",
    category: "Desporto de raquete",
    image: "/modalities/badminton.webp",
  },
];

export function ModalityCarousel() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const showNext = React.useCallback(() => {
    setActiveIndex((current) => (current + 1) % MODALITIES.length);
  }, []);

  const showPrevious = React.useCallback(() => {
    setActiveIndex((current) => (current - 1 + MODALITIES.length) % MODALITIES.length);
  }, []);

  React.useEffect(() => {
    if (paused || MODALITIES.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(showNext, 5500);
    return () => window.clearInterval(interval);
  }, [paused, showNext]);

  const active = MODALITIES[activeIndex] ?? MODALITIES[0];

  return (
    <section
      aria-label="Modalidades da plataforma"
      aria-roledescription="carrossel"
      className="absolute inset-0 z-0 overflow-hidden bg-primary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      {MODALITIES.map((slide, index) => (
        <div
          key={slide.name}
          role="img"
          aria-label={`${slide.name} no Peladeiro`}
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 bg-center bg-cover transition-[opacity,transform] duration-1000 ease-out motion-reduce:transition-none ${
            index === activeIndex ? "scale-100 opacity-100" : "scale-105 opacity-0"
          }`}
          style={{ backgroundImage: `url(${slide.image})` }}
        />
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />

      <div className="absolute top-5 right-5 z-30 flex gap-2">
        <button
          type="button"
          onClick={showPrevious}
          aria-label="Ver modalidade anterior"
          className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={showNext}
          aria-label="Ver próxima modalidade"
          className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="absolute right-6 bottom-6 left-6 z-20 sm:right-10 sm:bottom-10 sm:left-10">
        <div className="max-w-sm">
          <p className="font-semibold text-[10px] text-white/55 uppercase tracking-[0.24em]">{active.category}</p>
          <p aria-live="polite" aria-atomic="true" className="mt-2 font-semibold text-3xl text-white tracking-tight">
            {active.name}
          </p>
          <p className="mt-2 text-sm text-white/70 leading-6">{active.description}</p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <fieldset className="m-0 flex min-w-0 items-center gap-1.5 border-0 p-0" aria-label="Escolher modalidade">
            {MODALITIES.map((slide, index) => (
              <button
                key={slide.name}
                type="button"
                aria-label={`Mostrar ${slide.name}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => setActiveIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  index === activeIndex ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </fieldset>
          <p className="font-medium text-white/55 text-xs">
            {String(activeIndex + 1).padStart(2, "0")} / {String(MODALITIES.length).padStart(2, "0")}
          </p>
        </div>
      </div>
    </section>
  );
}
