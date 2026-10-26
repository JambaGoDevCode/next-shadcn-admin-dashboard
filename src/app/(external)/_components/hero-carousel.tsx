"use client";

import * as React from "react";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface HeroSlide {
  name: string;
  image: string;
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const showNext = React.useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, [slides.length]);

  const showPrevious = React.useCallback(() => {
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  }, [slides.length]);

  React.useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(showNext, 5500);
    return () => window.clearInterval(interval);
  }, [paused, showNext, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Desportos no Peladeiro"
      aria-roledescription="carrossel"
      className="absolute inset-0 z-0 overflow-hidden bg-emerald-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.name}
          role="img"
          aria-label={`Joga ${slide.name} no Peladeiro`}
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 bg-cover bg-center transition-[opacity,transform] duration-1000 ease-out motion-reduce:transition-none ${index === activeIndex ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        />
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/25 to-emerald-950/20" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/65 to-emerald-950/20" />

      <div className="absolute right-4 bottom-5 z-20 flex items-center gap-3 sm:right-8 sm:bottom-8">
        <div className="hidden rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md sm:block">
          <span aria-live="polite" aria-atomic="true">{slides[activeIndex].name}</span> <span className="text-white/55">{String(activeIndex + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</span>
        </div>
        <div className="flex items-center gap-1.5" aria-label="Escolher desporto">
          {slides.map((slide, index) => (
            <button
              key={slide.name}
              type="button"
              aria-label={`Mostrar ${slide.name}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 ${index === activeIndex ? "w-7 bg-lime-300" : "w-2 bg-white/60 hover:bg-white"}`}
            />
          ))}
        </div>
      </div>
      <div className="absolute right-4 top-5 z-20 flex gap-2 sm:right-8 sm:top-8">
        <button type="button" onClick={showPrevious} aria-label="Ver desporto anterior" className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">
          <ArrowLeft className="size-4" />
        </button>
        <button type="button" onClick={showNext} aria-label="Ver próximo desporto" className="flex size-10 items-center justify-center rounded-full border border-white/25 bg-black/20 text-white backdrop-blur-md transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
