import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRight, ArrowUpRight, BadgeCheck, CircleDot, Dumbbell, Goal, Volleyball } from "lucide-react";

import { Button } from "@/components/ui/button";

import { PublicFooter, PublicHeader } from "../_components/public-chrome";

export const metadata: Metadata = {
  title: "Modalidades desportivas | Peladeiro",
  description: "Descobre modalidades, encontra oportunidades para jogar e explora equipamento desportivo no Peladeiro.",
};

const modalities = [
  { name: "Futebol", detail: "Organiza equipas e partidas, encontra quadras e acompanha campeonatos.", state: "Joga no Peladeiro", icon: Goal, featured: true },
  { name: "Andebol", detail: "Junta a equipa, combina a partida e encontra um espaço para jogar.", state: "Desporto de quadra", icon: CircleDot, featured: false },
  { name: "Voleibol", detail: "Descobre espaços, reúne os jogadores e prepara o próximo encontro.", state: "Desporto de quadra", icon: Volleyball, featured: false },
  { name: "Basquetebol", detail: "Encontra jogadores e quadras para pôr a equipa em jogo.", state: "Desporto de quadra", icon: Dumbbell, featured: false },
  { name: "Ténis e padel", detail: "Desportos de raquete para jogar a pares ou um contra um.", state: "Desportos de quadra", icon: CircleDot, featured: false },
];

export default function ModalitiesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-5 text-xs text-muted-foreground"><Link href="/">Início</Link><span>/</span><span className="text-foreground">Modalidades</span></nav>
        <section className="max-w-3xl py-10 sm:py-16">
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-400">Desporto para todos</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">Cada modalidade tem o seu jogo.</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">O Peladeiro aproxima pessoas e equipas de quadras, competição e equipamento para diferentes desportos: futebol, andebol, voleibol, basquetebol, ténis, padel e mais.</p>
        </section>
        <section aria-label="Modalidades no Peladeiro" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modalities.map(({ name, detail, state, icon: Icon, featured }) => (
            <article key={name} className={`flex min-h-64 flex-col rounded-2xl border p-6 ${featured ? "bg-primary text-primary-foreground" : "bg-card"}`}>
              <div className="flex items-start justify-between gap-4"><span className={`flex size-11 items-center justify-center rounded-xl ${featured ? "bg-primary-foreground/10" : "bg-muted text-foreground"}`}><Icon className="size-5" /></span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${featured ? "bg-primary-foreground/10 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{featured && <BadgeCheck className="size-3.5" />}{state}</span></div>
              <h2 className="mt-8 text-xl font-semibold tracking-tight">{name}</h2>
              <p className={`mt-2 flex-1 text-sm leading-6 ${featured ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{detail}</p>
              {featured ? <Button asChild variant="secondary" className="mt-5 w-fit rounded-full"><Link href="/auth/v2/register">Começar a jogar <ArrowRight /></Link></Button> : <Button asChild variant="link" className="mt-5 w-fit justify-start px-0"><Link href="/loja">Explorar equipamento <ArrowUpRight /></Link></Button>}
            </article>
          ))}
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}
