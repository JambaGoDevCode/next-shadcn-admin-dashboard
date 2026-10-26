"use client";

import * as React from "react";

import { Loader2, Package, Truck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { StoreOrderDetail } from "@/lib/api/types";
import { formatDateTime, formatKz, orderStatusLabel, orderStatusTone } from "@/lib/format";
import {
  cancelOrderAction,
  completeOrderAction,
  confirmPaymentAction,
  deliverShipmentAction,
  dispatchShipmentAction,
  getOrderAction,
  prepareShipmentAction,
  processOrderAction,
} from "@/server/actions/store";

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Id da encomenda a mostrar; o detalhe completo é carregado na abertura. */
  orderId: number | null;
  /** Chamado após qualquer mutação (fecha o diálogo e recarrega a página). */
  onChanged: () => void;
}

/**
 * Detalhe de uma encomenda: itens com snapshots, morada de entrega,
 * pagamentos, remessa e reservas de stock. As ações disponíveis
 * dependem do estado atual (fluxo de pagamentos → fulfillment).
 */
export function OrderDialog({ open, onOpenChange, orderId, onChanged }: OrderDialogProps) {
  const [detail, setDetail] = React.useState<StoreOrderDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [action, setAction] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (orderId == null) return;
    setLoading(true);
    const result = await getOrderAction(orderId);
    setLoading(false);
    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Resposta inválida do servidor." : result.error);
      return;
    }
    setDetail(result.data);
  }, [orderId]);

  React.useEffect(() => {
    if (!open || orderId == null) {
      setDetail(null);
      return;
    }
    void load();
  }, [open, orderId, load]);

  async function runAction(key: string, operation: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    if (action) return;
    setAction(key);
    const result = await operation();
    setAction(null);
    if (!result.ok) {
      toast.error(result.error ?? "Operação falhou.");
      return;
    }
    toast.success(result.message ?? "Encomenda atualizada.");
    await load();
    onChanged();
  }

  const order = detail?.order;

  const confirmPayment = () =>
    runAction("confirm", async () => {
      const res = await confirmPaymentAction(orderId!);
      return res.ok ? { ok: true, message: "Pagamento confirmado." } : { ok: false, error: res.error };
    });

  const process = () =>
    runAction("process", async () => {
      const res = await processOrderAction(orderId!);
      return res.ok ? { ok: true, message: "Encomenda em processamento." } : { ok: false, error: res.error };
    });

  const complete = () =>
    runAction("complete", async () => {
      const res = await completeOrderAction(orderId!);
      return res.ok ? { ok: true, message: "Encomenda concluída." } : { ok: false, error: res.error };
    });

  const cancel = () =>
    runAction("cancel", async () => {
      const res = await cancelOrderAction(orderId!);
      return res.ok ? { ok: true, message: "Encomenda cancelada." } : { ok: false, error: res.error };
    });

  const prepare = () =>
    runAction("prepare", async () => {
      const res = await prepareShipmentAction(orderId!);
      return res.ok ? { ok: true, message: "Remessa preparada." } : { ok: false, error: res.error };
    });

  const dispatch = () =>
    runAction("dispatch", async () => {
      const res = await dispatchShipmentAction(orderId!);
      return res.ok ? { ok: true, message: "Remessa expedida." } : { ok: false, error: res.error };
    });

  const deliver = () =>
    runAction("deliver", async () => {
      const res = await deliverShipmentAction(orderId!);
      return res.ok ? { ok: true, message: "Remessa entregue." } : { ok: false, error: res.error };
    });

  const shipment = detail?.shipment;
  const canConfirm = order?.status === "PENDING_PAYMENT";
  const canProcess = order?.status === "PAID";
  const canComplete = order?.status === "PROCESSING" && (!shipment || shipment.status === "DELIVERED");
  const canCancel = order?.status === "PENDING_PAYMENT" || order?.status === "PAID";
  const canPrepare = order?.status === "PAID" && !shipment;
  const canDispatch = shipment?.status === "PREPARING";
  const canDeliver = shipment?.status === "DISPATCHED";
  const busy = action !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {order ? order.orderNumber : "Encomenda"}
            {order ? (
              <Badge variant="outline" className={orderStatusTone(order.status)}>
                {orderStatusLabel(order.status)}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {order
              ? `Cliente #${order.userId} — criada a ${formatDateTime(order.createdAt)}`
              : "A carregar detalhe da encomenda..."}
          </DialogDescription>
        </DialogHeader>

        {loading && !detail ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" /> A carregar...
          </div>
        ) : null}

        {detail && order ? (
          <div className="flex flex-col gap-4">
            {/* Totais */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-muted-foreground text-xs">Subtotal</p>
                <p className="tabular-nums">{formatKz(order.subtotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Portes</p>
                <p className="tabular-nums">{formatKz(order.shippingAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Desconto</p>
                <p className="tabular-nums">{formatKz(order.discountAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Total</p>
                <p className="font-medium tabular-nums">{formatKz(order.totalAmount)}</p>
              </div>
            </div>

            {/* Itens */}
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Package className="size-3.5" /> Itens ({detail.items.length})
              </h4>
              <div className="rounded-lg border">
                {detail.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm last:border-b-0"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.productNameSnapshot}</span>
                      <span className="text-muted-foreground text-xs">
                        {item.skuSnapshot}
                        {item.variantSnapshot ? ` · ${item.variantSnapshot}` : ""} · {formatKz(item.unitPrice)} ×{" "}
                        {item.quantity}
                      </span>
                    </div>
                    <span className="tabular-nums">{formatKz(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Morada */}
            {detail.address ? (
              <section>
                <h4 className="mb-2 text-sm font-medium">Morada de entrega</h4>
                <div className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{detail.address.recipientName}</p>
                  <p className="text-muted-foreground">
                    {detail.address.addressLine}
                    {detail.address.reference ? ` (${detail.address.reference})` : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">Tel: {detail.address.phone}</p>
                </div>
              </section>
            ) : null}

            {/* Pagamentos */}
            <section>
              <h4 className="mb-2 text-sm font-medium">Pagamentos</h4>
              {detail.payments.length === 0 ? (
                <p className="text-muted-foreground text-sm">Sem registos de pagamento.</p>
              ) : (
                <div className="rounded-lg border">
                  {detail.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-b-0"
                    >
                      <span className="text-muted-foreground">
                        {payment.status === "MANUAL" ? "Confirmação manual" : `Gateway #${payment.paymentId}`}
                        {" · "}
                        {formatDateTime(payment.createdAt)}
                      </span>
                      <span className="tabular-nums">{formatKz(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Remessa */}
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
                <Truck className="size-3.5" /> Remessa
              </h4>
              {!shipment ? (
                <p className="text-muted-foreground text-sm">Sem remessa preparada.</p>
              ) : (
                <div className="rounded-lg border px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>{shipment.shippingMethod}</span>
                    <Badge variant="outline">{shipment.status}</Badge>
                  </div>
                  {shipment.trackingCode ? (
                    <p className="text-muted-foreground text-xs">Rastreio: {shipment.trackingCode}</p>
                  ) : null}
                  {shipment.carrier ? (
                    <p className="text-muted-foreground text-xs">Transportadora: {shipment.carrier}</p>
                  ) : null}
                </div>
              )}
            </section>

            {/* Reservas de stock */}
            {detail.reservations.length > 0 ? (
              <section>
                <h4 className="mb-2 text-sm font-medium">Reservas de stock</h4>
                <div className="rounded-lg border">
                  {detail.reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-b-0"
                    >
                      <span className="text-muted-foreground">Variante #{reservation.variantId}</span>
                      <span className="flex items-center gap-2">
                        <span className="tabular-nums">{reservation.quantity} un.</span>
                        <Badge variant="outline">{reservation.status}</Badge>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="flex-wrap gap-2">
          {canCancel ? (
            <Button variant="outline" onClick={cancel} disabled={busy}>
              {action === "cancel" ? <Loader2 className="animate-spin" /> : null}
              Cancelar encomenda
            </Button>
          ) : null}
          {canConfirm ? (
            <Button onClick={confirmPayment} disabled={busy}>
              {action === "confirm" ? <Loader2 className="animate-spin" /> : null}
              Confirmar pagamento
            </Button>
          ) : null}
          {canPrepare ? (
            <Button variant="outline" onClick={prepare} disabled={busy}>
              {action === "prepare" ? <Loader2 className="animate-spin" /> : null}
              Preparar remessa
            </Button>
          ) : null}
          {canDispatch ? (
            <Button variant="outline" onClick={dispatch} disabled={busy}>
              {action === "dispatch" ? <Loader2 className="animate-spin" /> : null}
              Expedir
            </Button>
          ) : null}
          {canDeliver ? (
            <Button onClick={deliver} disabled={busy}>
              {action === "deliver" ? <Loader2 className="animate-spin" /> : null}
              Marcar entregue
            </Button>
          ) : null}
          {canProcess ? (
            <Button onClick={process} disabled={busy}>
              {action === "process" ? <Loader2 className="animate-spin" /> : null}
              Iniciar processamento
            </Button>
          ) : null}
          {canComplete ? (
            <Button onClick={complete} disabled={busy}>
              {action === "complete" ? <Loader2 className="animate-spin" /> : null}
              Concluir encomenda
            </Button>
          ) : null}
          <Separator orientation="vertical" className="lg:hidden" />
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
