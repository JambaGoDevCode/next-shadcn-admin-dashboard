import type { Metadata } from "next";
import Link from "next/link";

import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Shirt,
  Trophy,
  Users,
  CircleDot,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PublicFooter, PublicHeader } from "./_components/public-chrome";
import { FeaturedStoreProducts } from "./_components/featured-store-products";
import { HeroCarousel } from "./_components/hero-carousel";

export const metadata: Metadata = {
  title: "Peladeiro — O teu próximo jogo começa aqui",
  description:
    "Encontra equipas, organiza partidas, descobre campos e participa em campeonatos. O teu próximo jogo começa no Peladeiro.",
  openGraph: {
    title: "Peladeiro — O teu próximo jogo começa aqui",
    description: "Equipas, jogos, campos e campeonatos num só lugar.",
    type: "website",
  },
};

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Reúne a tua equipa",
    description: "Cria a equipa, junta os jogadores e deixa tudo pronto para novos desafios.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "Encontra onde jogar",
    description: "Explora campos desportivos e procura um espaço para a tua próxima partida.",
  },
  {
    number: "03",
    icon: Trophy,
    title: "Entra em competição",
    description: "Descobre campeonatos e encontra novas oportunidades para a tua equipa.",
  },
];

const sports = [
  { name: "Futebol", image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=85" },
  { name: "Padel", image: "https://asset.ayo.co.id/image/venue/170589169121493.image_cropper_1705891619803_large.jpg" },
  { name: "Basquetebol", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=900&q=85" },
  { name: "Ténis", image: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=900&q=85" },
  { name: "Voleibol", image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=900&q=85" },
  { name: "Andebol", image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=85" },
];

const features = [
  {
    icon: Users,
    title: "Equipas e jogadores",
    description: "Organiza o teu grupo, acompanha os jogadores e prepara a equipa para entrar em campo.",
  },
  {
    icon: CircleDot,
    title: "Jogos entre equipas",
    description: "Encontra adversários, combina partidas e mantém os detalhes do jogo organizados.",
  },
  {
    icon: MessageCircle,
    title: "Conversa sobre o jogo",
    description: "Coordena os detalhes da partida com a equipa adversária num espaço dedicado.",
  },
  {
    icon: Trophy,
    title: "Campeonatos",
    description: "Leva a tua equipa para novos desafios e acompanha a competição no mesmo lugar.",
  },
];

const faqs = [
  {
    question: "O que é o Peladeiro?",
    answer:
      "O Peladeiro é uma plataforma para aproximar jogadores, equipas, campos e organizadores. Ajuda a preparar jogos, descobrir espaços desportivos e acompanhar competições.",
  },
  {
    question: "Como começo a usar a plataforma?",
    answer:
      "Cria a tua conta e completa o teu perfil. Depois podes organizar uma equipa, explorar campos e consultar as funcionalidades disponíveis para a tua conta.",
  },
  {
    question: "Posso registar o meu campo?",
    answer:
      "Sim. Podes criar uma conta e registar as informações do teu campo. A disponibilidade de reservas depende das funcionalidades configuradas para cada espaço.",
  },
  {
    question: "Como funciona a conversa entre equipas?",
    answer:
      "A conversa está associada a uma partida confirmada e permite aos participantes combinar os detalhes do jogo. A disponibilidade segue as regras da própria partida.",
  },
  {
    question: "O Peladeiro tem custos?",
    answer:
      "Os preços de campos e produtos são apresentados nas respetivas páginas quando disponíveis. Não anunciamos planos ou valores que ainda não estejam definidos.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-2xl space-y-4 ${centered ? "mx-auto text-center" : ""}`}>
      <p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-400">{eyebrow}</p>
      <h2 className="text-3xl leading-tight font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h2>
      <p className="text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
    </div>
  );
}

export default async function Home() {
  return (
    <main id="inicio" className="overflow-hidden bg-background text-foreground">
      <PublicHeader />

      <section className="relative isolate overflow-hidden bg-[#071c18] text-white" aria-labelledby="hero-title">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_45%,rgba(16,185,129,0.24),transparent_48%)]" />
        <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3.5 py-2 text-xs font-medium tracking-wide text-emerald-100">
              <span className="size-1.5 rounded-full bg-lime-300" /> DESPORTO DE QUADRA, NUM SÓ LUGAR
            </div>
            <h1 id="hero-title" className="text-5xl leading-[0.98] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Há sempre <span className="text-lime-300">jogo para todos.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
              Encontra pessoas, equipas e quadras para o teu desporto. Marca uma partida, descobre novos espaços e entra em campo — seja qual for o jogo.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-white/80">
              {sports.slice(0, 5).map((sport) => <Link key={sport.name} href="/modalidades" className="rounded-full border border-white/15 bg-white/5 px-3 py-2 transition hover:border-lime-300/60 hover:text-lime-200">{sport.name}</Link>)}
            </div>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full bg-lime-300 px-6 text-emerald-950 hover:bg-lime-200"><Link href="/auth/v2/register">Encontrar o meu jogo <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/30 bg-white/5 px-6 text-white hover:bg-white/15 hover:text-white"><Link href="#modalidades">Explorar desportos <ArrowDown /></Link></Button>
            </div>
            <p className="mt-5 text-xs text-white/55">Para jogadores, equipas, clubes e gestores de quadras.</p>
          </div>
          <HeroCarousel slides={sports} />
        </div>
      </section>

      <section id="modalidades" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-semibold tracking-[0.18em] text-emerald-700 uppercase dark:text-emerald-400">Encontra a tua modalidade</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">A quadra é de todos.</h2></div><Link href="/modalidades" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">Ver modalidades <ArrowRight className="size-4" /></Link></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{sports.map((sport, index) => <Link key={sport.name} href="/modalidades" className="group relative isolate flex aspect-[0.92] items-end overflow-hidden rounded-2xl bg-zinc-900 p-4 text-white"><div className="absolute inset-0 -z-20 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${sport.image})` }} /><div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/15 to-transparent" /><span className="absolute top-3 left-3 rounded-full border border-white/25 bg-black/20 px-2.5 py-1 text-[10px] font-medium backdrop-blur">0{index + 1}</span><span className="text-base font-semibold sm:text-lg">{sport.name}</span></Link>)}</div>
        </div>
      </section>

      <section id="possibilidades" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <SectionHeading
              eyebrow="O jogo é teu"
              title="Mais do que marcar jogos, é criar oportunidades para jogar."
              description="Do primeiro convite ao apito final, o Peladeiro ajuda-te a organizar a experiência desportiva e a manter a tua equipa em movimento."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className={`rounded-2xl border p-5 transition-colors hover:bg-muted/50 ${index === 0 ? "bg-muted/40" : "bg-card"}`}>
                  <span className="mb-5 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><Icon className="size-5" /></span>
                  <h3 className="font-semibold tracking-tight">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 border-y bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Simples desde o início"
            title="Da ideia ao campo, passo a passo."
            description="Tira a organização do caminho e concentra-te no que importa: juntar a equipa e jogar."
            centered
          />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <article key={number} className="relative rounded-2xl border bg-card p-6 sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Icon className="size-5" /></span>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">{number}</span>
                </div>
                <h3 className="mt-7 text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild className="rounded-full px-5"><Link href="/auth/v2/register">Começar agora <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-3xl bg-zinc-950 p-7 text-white sm:p-10">
              <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80)", backgroundSize: "cover", backgroundPosition: "center" }} />
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/90 via-zinc-950/55 to-emerald-950/50" />
              <div className="relative">
                <span className="flex size-12 items-center justify-center rounded-xl border border-white/20 bg-white/10"><MessageCircle className="size-5" /></span>
                <p className="mt-16 text-xs font-semibold tracking-[0.18em] text-emerald-300 uppercase">A partida continua aqui</p>
                <h3 className="mt-3 max-w-md text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">Combinem o jogo. Falem entre equipas. Entrem em quadra.</h3>
                <p className="mt-4 max-w-md text-sm leading-6 text-white/70">Coordena horários e detalhes com a equipa adversária numa conversa associada à partida.</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Organização sem ruído"
              title="Os jogos não terminam na marcação."
              description="A preparação também faz parte do desporto. Mantém a comunicação da partida perto dos detalhes do jogo e da equipa adversária."
            />
            <ul className="mt-7 grid gap-4">
              {["Conversa ligada à partida", "Detalhes combinados num só lugar", "Mais tempo para pensar no jogo"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground"><span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><Check className="size-3.5" /></span>{item}</li>
              ))}
            </ul>
            <Button asChild variant="link" className="mt-5 h-auto px-0"><Link href="/auth/v2/register">Organizar o próximo jogo <ArrowRight /></Link></Button>
          </div>
        </div>
      </section>

      <section id="campos" className="scroll-mt-20 border-y bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Quadras e espaços desportivos"
              title="A tua equipa está pronta. Encontra a quadra certa."
              description="Descobre espaços para diferentes desportos, compara a informação disponível e prepara a próxima partida com a tua equipa."
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-5"><Link href="/dashboard/fields">Encontrar uma quadra <ArrowRight /></Link></Button>
              <Button asChild variant="outline" className="rounded-full px-5"><Link href="#proprietarios">Tenho um espaço <ArrowUpRight /></Link></Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2"><MapPin className="size-4 text-emerald-700 dark:text-emerald-400" />Explora por localização</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="size-4 text-emerald-700 dark:text-emerald-400" />Consulta disponibilidade</span>
            </div>
          </div>
          <div className="relative min-h-80 overflow-hidden rounded-3xl border bg-zinc-950 sm:min-h-[420px]">
            <div className="absolute inset-0 bg-cover bg-center" role="img" aria-label="Quadras desportivas prontas para receber partidas" style={{ backgroundImage: `url(${sports[1].image})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-transparent to-transparent" />
            <div className="absolute right-5 bottom-5 left-5 rounded-2xl border border-white/20 bg-background/90 p-4 text-foreground shadow-lg backdrop-blur-sm sm:right-7 sm:bottom-7 sm:left-7">
              <p className="text-xs text-muted-foreground">O teu próximo jogo</p>
              <p className="mt-1 text-base font-semibold">Encontra um espaço para a tua modalidade.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="campeonatos" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-primary text-primary-foreground">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7 sm:p-12 lg:p-16">
              <p className="text-xs font-semibold tracking-[0.18em] text-primary-foreground/65 uppercase">Campeonatos e competição</p>
              <h2 className="mt-5 max-w-xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">A tua equipa está pronta para o próximo desafio?</h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-primary-foreground/75 sm:text-base">Participa em campeonatos, procura novas experiências competitivas e dá à tua equipa a oportunidade de mostrar o que vale.</p>
              <Button asChild variant="secondary" className="mt-8 rounded-full px-5"><Link href="/dashboard/championships">Descobrir campeonatos <ArrowRight /></Link></Button>
            </div>
            <div className="relative min-h-64 bg-zinc-950/20 lg:min-h-full">
              <div className="absolute inset-0 bg-cover bg-center opacity-75" role="img" aria-label="Equipa de futebol celebra em campo" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80)" }} />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent lg:bg-gradient-to-r" />
              <div className="absolute right-6 bottom-6 flex size-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm"><Trophy className="size-6" /></div>
            </div>
          </div>
        </div>
      </section>

      <section id="proprietarios" className="scroll-mt-20 border-y bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Para gestores de espaços desportivos"
              title="A tua quadra pode receber muitos grandes jogos."
              description="Apresenta os teus espaços e modalidades a equipas que procuram onde jogar e ajuda mais pessoas a encontrar a quadra certa."
            />
            <ul className="mt-7 grid gap-3 text-sm text-muted-foreground">
              {["Apresenta as características do teu campo", "Ajuda equipas a descobrir o teu espaço", "Recebe pedidos através das funcionalidades disponíveis"].map((item) => (
                <li key={item} className="flex items-start gap-3"><Check className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />{item}</li>
              ))}
            </ul>
              <Button asChild className="mt-8 rounded-full px-5"><Link href="/auth/v2/register">Registar o meu espaço <ArrowRight /></Link></Button>
          </div>
          <article className="rounded-3xl border bg-card p-7 sm:p-9">
            <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><ShieldCheck className="size-6" /></span>
            <h3 className="mt-6 text-xl font-semibold tracking-tight">Mais visibilidade para o teu espaço.</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Partilha a informação do campo e facilita a descoberta por parte de jogadores e equipas. A disponibilidade e as condições de reserva são apresentadas conforme estejam configuradas.</p>
            <div className="mt-7 border-t pt-5 text-xs leading-5 text-muted-foreground">Sem promessas de ocupação ou rendimento garantido. Cada espaço define a sua informação e disponibilidade.</div>
          </article>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          <article className="group rounded-3xl border bg-card p-7 transition-colors hover:bg-muted/40 sm:p-9">
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted"><Shirt className="size-6" /></span>
            <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Loja Peladeiro</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">O próximo jogo merece o equipamento certo.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Descobre equipamentos e acessórios desportivos para treinar, competir e representar a tua equipa.</p>
            <Button asChild variant="link" className="mt-5 h-auto px-0"><Link href="/loja">Explorar a loja <ArrowRight className="transition-transform group-hover:translate-x-1" /></Link></Button>
          </article>
          <article className="rounded-3xl border bg-muted/30 p-7 sm:p-9">
            <span className="flex size-12 items-center justify-center rounded-xl bg-background"><Users className="size-6" /></span>
            <p className="mt-8 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Clubes e instituições</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">O desporto cresce quando jogamos juntos.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Escolas, clubes e empresas podem aproximar pessoas do desporto e estruturar iniciativas para as suas comunidades.</p>
            <Button asChild variant="link" className="mt-5 h-auto px-0"><Link href="/auth/v2/register">Conhecer o Peladeiro <ArrowRight /></Link></Button>
          </article>
        </div>
      </section>

      <FeaturedStoreProducts />

      <section className="border-y bg-muted/30 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading
            eyebrow="Perguntas frequentes"
            title="Tudo a postos para começar?"
            description="Algumas respostas para entrares em jogo com mais confiança."
          />
          <div className="divide-y rounded-2xl border bg-card px-5 sm:px-7">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {faq.question}<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-2xl pt-3 pr-8 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-emerald-600 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-white/75 uppercase">O próximo apito é teu</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">A tua próxima história no desporto começa agora.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">Cria a tua conta e dá o primeiro passo para o teu próximo jogo.</p>
          <Button asChild size="lg" variant="secondary" className="mt-8 h-12 rounded-full px-6"><Link href="/auth/v2/register">Criar conta gratuitamente <ArrowRight /></Link></Button>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
