"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, PackageCheck, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StoreOrderDetail } from "@/lib/api/types";
import type { StorePaymentResult } from "@/server/actions/storefront";
import { confirmStorePaymentAction, createStorePaymentAction } from "@/server/actions/storefront";

import { PublicFooter, PublicHeader } from "../../_components/public-chrome";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(price);
}

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Aguarda pagamento",
  PAID: "Pago",
  PROCESSING: "Em preparação",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export function OrderStatusWorkspace({ initialDetail }: { initialDetail: StoreOrderDetail }) {
  const router = useRouter();
  const [detail, setDetail] = React.useState(initialDetail);
  const [payment, setPayment] = React.useState<StorePaymentResult | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState("");
  const activePayment = payment ?? detail.payments.at(-1) ?? null;

  async function startPayment() {
    setPending(true);
    setError("");
    const result = await createStorePaymentAction(detail.order.id);
    setPending(false);
    if (result.ok && result.data) {
      setPayment(result.data);
      toast.success("Pedido de pagamento criado.");
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  async function checkPayment() {
    if (!activePayment) return;
    setPending(true);
    const paymentId = "paymentId" in activePayment ? activePayment.paymentId : activePayment.id;
    const result = await confirmStorePaymentAction(detail.order.id, paymentId);
    setPending(false);
    if (result.ok && result.data) {
      setDetail(result.data);
      toast.success(result.data.order.status === "PAID" ? "Pagamento confirmado." : "O pagamento ainda está pendente.");
    } else {
      setError(result.error);
    }
  }

  const status = detail.order.status;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      <div className="mx-auto min-h-[60vh] max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-5 text-xs text-muted-foreground"><Link href="/">Início</Link><span>/</span><Link href="/loja">Loja</Link><span>/</span><span className="text-foreground">Encomenda</span></nav>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs text-muted-foreground">Encomenda</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{detail.order.orderNumber}</h1></div><Badge variant={status === "PAID" || status === "COMPLETED" ? "default" : status === "CANCELLED" ? "destructive" : "secondary"}>{statusLabel[status] ?? status}</Badge></div>
        <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border bg-card p-5 sm:p-7">
            <h2 className="font-semibold">Artigos da encomenda</h2>
            <div className="mt-4 divide-y">{detail.items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-4"><div><p className="text-sm font-medium">{item.productNameSnapshot}</p><p className="mt-1 text-xs text-muted-foreground">{item.variantSnapshot ?? item.skuSnapshot} · {item.quantity} un.</p></div><p className="shrink-0 text-sm">{formatPrice(item.lineTotal)}</p></div>)}</div>
            {detail.address && <div className="mt-5 border-t pt-5"><h3 className="text-sm font-medium">Entrega para</h3><p className="mt-2 text-sm text-muted-foreground">{detail.address.recipientName} · {detail.address.phone}<br />{detail.address.addressLine}{detail.address.reference ? ` · ${detail.address.reference}` : ""}</p></div>}
            {detail.shipment && <div className="mt-5 flex items-start gap-3 border-t pt-5"><Truck className="mt-0.5 size-4 text-muted-foreground" /><div><h3 className="text-sm font-medium">Entrega</h3><p className="mt-1 text-sm text-muted-foreground">{detail.shipment.status}{detail.shipment.carrier ? ` · ${detail.shipment.carrier}` : ""}{detail.shipment.trackingCode ? ` · ${detail.shipment.trackingCode}` : ""}</p></div></div>}
          </section>
          <aside className="h-fit rounded-2xl border bg-card p-5 sm:p-6">
            <h2 className="font-semibold">Estado do pedido</h2>
            <div className="mt-5 flex items-center gap-3"><span className={`flex size-9 items-center justify-center rounded-full ${status === "PAID" || status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>{status === "PAID" || status === "COMPLETED" ? <CheckCircle2 className="size-4" /> : status === "PROCESSING" ? <PackageCheck className="size-4" /> : <Clock3 className="size-4" />}</span><div><p className="text-sm font-medium">{statusLabel[status] ?? status}</p><p className="text-xs text-muted-foreground">{new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(detail.order.createdAt))}</p></div></div>
            <div className="mt-5 flex justify-between border-t pt-4 text-sm"><span>Total</span><span className="font-semibold">{formatPrice(detail.order.totalAmount)}</span></div>
            {status === "PENDING_PAYMENT" && <div className="mt-5 grid gap-2">
              {activePayment ? <><p className="text-xs text-muted-foreground">Pagamento {activePayment.status.toLocaleLowerCase("pt-PT")} · referência {"paymentId" in activePayment ? activePayment.paymentId : activePayment.id}</p><Button disabled={pending} variant="outline" onClick={() => void checkPayment()}>{pending ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} Consultar pagamento</Button></> : <Button disabled={pending} onClick={() => void startPayment()}>{pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />} Iniciar pagamento</Button>}
            </div>}
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          </aside>
        </div>
        <div className="mt-6 flex flex-wrap gap-3"><Button asChild variant="outline" className="rounded-full"><Link href="/loja">Voltar à loja</Link></Button><Button asChild variant="link" className="rounded-full"><Link href="/loja/carrinho">Ver carrinho</Link></Button></div>
      </div>
      <PublicFooter />
    </main>
  );
}
