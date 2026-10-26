import Link from "next/link";

import { ArrowRight, ChevronDown, CircleDot, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

const navigation = [
  { label: "Modalidades", href: "/modalidades" },
  { label: "Quadras", href: "/#campos" },
  { label: "Loja", href: "/loja" },
  { label: "Campeonatos", href: "/#campeonatos" },
  { label: "Para proprietários", href: "/#proprietarios" },
];

export function PublicBrand() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Peladeiro, início">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform group-hover:rotate-[-8deg]">
        <CircleDot className="size-5" />
      </span>
      <span className="text-lg font-bold tracking-tight">peladeiro<span className="text-emerald-600">.</span></span>
    </Link>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <PublicBrand />
        <nav aria-label="Navegação principal" className="hidden items-center gap-6 lg:flex">
          {navigation.map((item) => <Link key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{item.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="ghost"><Link href="/auth/v2/login">Entrar</Link></Button>
          <Button asChild className="rounded-full px-5"><Link href="/auth/v2/register">Criar conta <ArrowRight /></Link></Button>
        </div>
        <Link href="/loja/carrinho" aria-label="Abrir carrinho" className="flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ShoppingBag className="size-5" />
        </Link>
        <details className="group relative lg:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border [&::-webkit-details-marker]:hidden" aria-label="Abrir menu">
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute top-12 right-0 z-50 w-64 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg">
            <nav aria-label="Navegação móvel" className="grid gap-1">
              {navigation.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">{item.label}</Link>)}
            </nav>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3">
              <Button asChild variant="outline"><Link href="/auth/v2/login">Entrar</Link></Button>
              <Button asChild><Link href="/auth/v2/register">Criar conta</Link></Button>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/20 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <PublicBrand />
          <p className="max-w-sm text-xs leading-5 text-muted-foreground">A plataforma que liga equipas, jogos, quadras, competição e equipamento.</p>
        </div>
        <nav aria-label="Ligações do rodapé" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <Link href="/modalidades" className="hover:text-foreground">Modalidades</Link>
          <Link href="/#campos" className="hover:text-foreground">Quadras</Link>
          <Link href="/loja" className="hover:text-foreground">Loja</Link>
          <Link href="/dashboard/championships" className="hover:text-foreground">Campeonatos</Link>
          <Link href="/auth/v2/login" className="hover:text-foreground">Entrar</Link>
          <Link href="/auth/v2/register" className="hover:text-foreground">Criar conta</Link>
        </nav>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t pt-5 text-xs text-muted-foreground">© {new Date().getFullYear()} Peladeiro. Mais do que marcar jogos, é criar oportunidades para jogar.</div>
    </footer>
  );
}
