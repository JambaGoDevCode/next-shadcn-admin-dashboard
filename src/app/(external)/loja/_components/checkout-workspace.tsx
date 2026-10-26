"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { City, StoreOrderDetail } from "@/lib/api/types";
import type { StoreCart, StorePaymentResult, StorefrontResult } from "@/server/actions/storefront";
import {
  confirmStorePaymentAction,
  createStoreOrderAction,
  createStorePaymentAction,
  getShippingQuoteAction,
} from "@/server/actions/storefront";

import { PublicFooter, PublicHeader } from "../../_components/public-chrome";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(price);
}

export function CheckoutWorkspace({
  authenticated,
  cartResult,
  citiesResult,
}: {
  authenticated: boolean;
  cartResult: StorefrontResult<StoreCart>;
  citiesResult: StorefrontResult<City[]>;
}) {
  const router = useRouter();
  const cart = cartResult.ok ? cartResult.data : null;
  const cities = citiesResult.ok ? citiesResult.data : [];
  const subtotal = cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) ?? 0;
  const [shipping, setShipping] = React.useState(0);
  const [quoteError, setQuoteError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [order, setOrder] = React.useState<StoreOrderDetail | null>(null);
  const [payment, setPayment] = React.useState<StorePaymentResult | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [recipientName, setRecipientName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [cityId, setCityId] = React.useState("");
  const [addressLine, setAddressLine] = React.useState("");
  const [reference, setReference] = React.useState("");

  React.useEffect(() => {
    if (!authenticated || subtotal <= 0) return;
    let cancelled = false;
    void getShippingQuoteAction(subtotal).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setShipping(result.data.amount);
        setQuoteError("");
      } else {
        setQuoteError(result.error);
      }
    });
    return () => { cancelled = true; };
  }, [authenticated, subtotal]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cityId) {
      setError("Seleciona uma cidade para entrega.");
      return;
    }
    setBusy(true);
    setError("");
    const result = await createStoreOrderAction({
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      cityId: Number(cityId),
      addressLine: addressLine.trim(),
      reference: reference.trim() || undefined,
    });
    if (!result.ok || !result.data) {
      setError(result.error);
      setBusy(false);
      return;
    }
    setOrder(result.data);
    const paymentResult = await createStorePaymentAction(result.data.order.id);
    if (paymentResult.ok && paymentResult.data) setPayment(paymentResult.data);
    else setError("Encomenda criada. " + paymentResult.error);
    setBusy(false);
    router.refresh();
    router.push(`/loja/encomendas/${result.data.order.id}`);
  }

  async function checkPayment() {
    if (!order || !payment) return;
    setConfirming(true);
    const result = await confirmStorePaymentAction(order.order.id, payment.paymentId);
    setConfirming(false);
    if (result.ok && result.data) {
      setOrder(result.data);
      toast.success(result.data.order.status === "PAID" ? "Pagamento confirmado." : "Ainda não recebemos a confirmação do pagamento.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto min-h-[60vh] max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-5 text-xs text-muted-foreground"><Link href="/">Início</Link><span>/</span><Link href="/loja">Loja</Link><span>/</span><Link href="/loja/carrinho">Carrinho</Link><span>/</span><span className="text-foreground">Finalizar compra</span></nav>
        <h1 className="text-3xl font-semibold tracking-tight">Finalizar compra</h1>

        {!authenticated ? <div className="mt-8 rounded-2xl border border-dashed p-8 text-center"><ShieldCheck className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-4 font-medium">Inicia sessão para continuar</h2><p className="mt-2 text-sm text-muted-foreground">O teu carrinho será mantido na tua conta.</p><Button asChild className="mt-5 rounded-full"><Link href={`/auth/v2/login?returnTo=${encodeURIComponent("/loja/finalizar-compra")}`}>Entrar para finalizar <ArrowRight /></Link></Button></div>
          : order ? (
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border bg-card p-6 sm:p-9">
              <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-6" /></span>
              <h2 className="mt-5 text-2xl font-semibold">Encomenda criada</h2>
              <p className="mt-2 text-sm text-muted-foreground">Referência <span className="font-medium text-foreground">{order.order.orderNumber}</span> · Total {formatPrice(order.order.totalAmount)}</p>
              {order.order.status === "PAID" ? <p className="mt-6 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">Pagamento confirmado. A encomenda está a ser preparada.</p> : payment ? <div className="mt-6 rounded-xl border p-4"><p className="text-sm font-medium">Pagamento {payment.status.toLocaleLowerCase("pt-PT")}</p><p className="mt-1 text-sm text-muted-foreground">Referência de pagamento: {payment.reference ?? payment.paymentId}</p><Button variant="outline" disabled={confirming} onClick={() => void checkPayment()} className="mt-4">{confirming && <LoaderCircle className="animate-spin" />} Consultar estado do pagamento</Button></div> : <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">{error || "A encomenda aguarda pagamento. Tenta novamente mais tarde ou contacta o suporte."}</p>}
              <Button asChild variant="outline" className="mt-6 rounded-full"><Link href="/loja">Voltar à loja</Link></Button>
            </div>
          ) : !cart?.items.length ? <div className="mt-8 rounded-2xl border border-dashed p-8 text-center"><p className="font-medium">O teu carrinho está vazio.</p><Button asChild className="mt-4 rounded-full"><Link href="/loja">Explorar a loja</Link></Button></div> : (
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_370px]">
              <form onSubmit={(event) => void submit(event)} className="grid gap-6">
                <section className="rounded-2xl border bg-card p-5 sm:p-7">
                  <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-muted"><MapPin className="size-4" /></span><div><h2 className="font-semibold">Dados de entrega</h2><p className="text-xs text-muted-foreground">Indica onde devemos entregar a encomenda.</p></div></div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2"><Label htmlFor="checkout-name">Nome do destinatário</Label><Input id="checkout-name" required maxLength={150} value={recipientName} onChange={(event) => setRecipientName(event.target.value)} autoComplete="name" /></div>
                    <div className="grid gap-2"><Label htmlFor="checkout-phone">Telefone</Label><Input id="checkout-phone" type="tel" required maxLength={30} value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" /></div>
                    <div className="grid gap-2"><Label htmlFor="checkout-city">Cidade</Label><select id="checkout-city" required value={cityId} onChange={(event) => setCityId(event.target.value)} className="h-9 rounded-lg border bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Selecionar cidade</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select></div>
                    <div className="grid gap-2 sm:col-span-2"><Label htmlFor="checkout-address">Morada</Label><Input id="checkout-address" required maxLength={300} value={addressLine} onChange={(event) => setAddressLine(event.target.value)} autoComplete="street-address" /></div>
                    <div className="grid gap-2 sm:col-span-2"><Label htmlFor="checkout-reference">Ponto de referência <span className="text-muted-foreground">(opcional)</span></Label><Input id="checkout-reference" maxLength={300} value={reference} onChange={(event) => setReference(event.target.value)} /></div>
                  </div>
                </section>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {quoteError && <p role="alert" className="text-sm text-destructive">{quoteError}</p>}
                {!citiesResult.ok && <p role="alert" className="text-sm text-destructive">{citiesResult.error}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3"><Button asChild variant="link" className="px-0"><Link href="/loja/carrinho"><ArrowLeft /> Voltar ao carrinho</Link></Button><Button type="submit" disabled={busy || Boolean(quoteError) || !cities.length} className="h-11 rounded-full px-6">{busy && <LoaderCircle className="animate-spin" />} Criar encomenda <ArrowRight /></Button></div>
              </form>
              <aside className="h-fit rounded-2xl border bg-card p-5 sm:p-6">
                <h2 className="font-semibold">Resumo do pedido</h2>
                <div className="mt-4 grid gap-3">{cart.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="line-clamp-2 text-muted-foreground">{item.productName} <span className="text-xs">× {item.quantity}</span></span><span className="shrink-0">{formatPrice(item.price * item.quantity)}</span></div>)}</div>
                <div className="mt-5 grid gap-3 border-t pt-4 text-sm"><div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between text-muted-foreground"><span>Entrega</span><span>{formatPrice(shipping)}</span></div><div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatPrice(subtotal + shipping)}</span></div></div>
                <p className="mt-4 text-xs leading-5 text-muted-foreground">O total final e o stock são validados pelo servidor ao criar a encomenda.</p>
              </aside>
            </div>
          )}
      </div>
      <PublicFooter />
    </main>
  );
}
