"use client";

import * as React from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { StoreCart, StorefrontResult } from "@/server/actions/storefront";
import { removeStoreCartItemAction, updateStoreCartItemAction } from "@/server/actions/storefront";

import { PublicFooter, PublicHeader } from "../../_components/public-chrome";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(price);
}

export function CartWorkspace({ authenticated, result }: { authenticated: boolean; result: StorefrontResult<StoreCart> }) {
  const router = useRouter();
  const [cart, setCart] = React.useState(result.ok ? result.data : null);
  const [pendingItem, setPendingItem] = React.useState<number | null>(null);
  const [error, setError] = React.useState(result.ok ? "" : result.error);
  const subtotal = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;

  async function update(itemId: number, quantity: number) {
    setPendingItem(itemId);
    const result = quantity <= 0 ? await removeStoreCartItemAction(itemId) : await updateStoreCartItemAction(itemId, quantity);
    setPendingItem(null);
    if (result.ok) {
      setCart(result.data);
      setError("");
      router.refresh();
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto min-h-[60vh] max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-5 text-xs text-muted-foreground"><Link href="/">Início</Link><span>/</span><Link href="/loja">Loja</Link><span>/</span><span className="text-foreground">Carrinho</span></nav>
        <h1 className="text-3xl font-semibold tracking-tight">O teu carrinho</h1>
        {!authenticated ? (
          <div className="mt-8 rounded-2xl border border-dashed p-8 text-center sm:p-12"><ShoppingBag className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-medium">Inicia sessão para aceder ao teu carrinho</h2><p className="mt-2 text-sm text-muted-foreground">Os produtos e variantes escolhidos serão mantidos na tua conta.</p><Button asChild className="mt-5 rounded-full"><Link href={`/auth/v2/login?returnTo=${encodeURIComponent("/loja/carrinho")}`}>Entrar para continuar <ArrowRight /></Link></Button><p className="mt-3 text-sm text-muted-foreground">Ainda não tens conta? <Link className="underline underline-offset-4" href={`/auth/v2/register?returnTo=${encodeURIComponent("/loja/carrinho")}`}>Criar conta</Link></p></div>
        ) : error && !cart ? (
          <div role="alert" className="mt-8 rounded-xl border border-dashed p-8 text-sm text-destructive">{error}</div>
        ) : cart?.items.length ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_350px]">
            <section className="divide-y rounded-2xl border bg-card px-4 sm:px-6" aria-label="Produtos no carrinho">
              {cart.items.map((item) => (
                <article key={item.id} className="flex gap-4 py-5">
                  <Link href="/loja" aria-label="Voltar ao catálogo da loja" className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
                    {item.imageUrl ? <Image src={item.imageUrl} alt="" fill unoptimized sizes="112px" className="object-cover" /> : <span className="flex size-full items-center justify-center text-muted-foreground"><ShoppingBag className="size-7" /></span>}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3"><div><h2 className="font-medium leading-5">{item.productName}</h2><p className="mt-1 text-xs text-muted-foreground">{[item.size, item.color].filter(Boolean).join(" · ") || item.sku}</p></div><p className="shrink-0 text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p></div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex h-9 items-center rounded-lg border">
                        <button type="button" aria-label="Diminuir quantidade" disabled={pendingItem === item.id} onClick={() => void update(item.id, item.quantity - 1)} className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button>
                        <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button type="button" aria-label="Aumentar quantidade" disabled={pendingItem === item.id || item.quantity >= 100} onClick={() => void update(item.id, item.quantity + 1)} className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground"><Plus className="size-3.5" /></button>
                      </div>
                      <Button variant="ghost" size="icon-sm" aria-label={`Remover ${item.productName}`} disabled={pendingItem === item.id} onClick={() => void update(item.id, 0)}><Trash2 className="text-muted-foreground" /></Button>
                    </div>
                  </div>
                </article>
              ))}
              {error && <p role="alert" className="pb-4 text-sm text-destructive">{error}</p>}
            </section>
            <aside className="h-fit rounded-2xl border bg-card p-5 sm:p-6">
              <h2 className="font-semibold">Resumo do pedido</h2>
              <div className="mt-5 flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="mt-3 flex justify-between text-sm text-muted-foreground"><span>Entrega</span><span>Calculada no checkout</span></div>
              <div className="mt-5 flex justify-between border-t pt-4 font-semibold"><span>Total estimado</span><span>{formatPrice(subtotal)}</span></div>
              <Button asChild className="mt-5 w-full rounded-full"><Link href="/loja/finalizar-compra">Continuar para entrega <ArrowRight /></Link></Button>
              <Button asChild variant="link" className="mt-2 w-full"><Link href="/loja">Continuar a explorar</Link></Button>
            </aside>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed p-8 text-center sm:p-12"><ShoppingBag className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-medium">O carrinho está vazio</h2><p className="mt-2 text-sm text-muted-foreground">Explora o catálogo e encontra o equipamento para o teu próximo jogo.</p><Button asChild className="mt-5 rounded-full"><Link href="/loja">Explorar a loja <ArrowRight /></Link></Button></div>
        )}
      </div>
      <PublicFooter />
    </main>
  );
}
