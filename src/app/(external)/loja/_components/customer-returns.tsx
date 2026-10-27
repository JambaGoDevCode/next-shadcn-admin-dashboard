"use client";

import * as React from "react";

import { AlertCircle, LoaderCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { StoreOrderDetail, StoreReturnReason, StoreReturnRequest } from "@/lib/api/types";
import {
  createStoreReturnAction,
  getOrderReturnsAction,
  getStoreReturnPolicyAction,
  setStoreReturnTrackingAction,
} from "@/server/actions/storefront";

const REASONS: Array<{ value: StoreReturnReason; label: string }> = [
  { value: "DEFECTIVE", label: "Artigo com defeito" },
  { value: "WRONG_ITEM", label: "Artigo recebido errado" },
  { value: "NOT_AS_DESCRIBED", label: "Diferente da descrição" },
  { value: "CHANGE_OF_MIND", label: "Desistência" },
  { value: "OTHER", label: "Outro motivo" },
];

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Pedido submetido",
  APPROVED: "Autorizada — enviar para devolução",
  REJECTED: "Pedido rejeitado",
  RECEIVED: "Recebida — em inspeção",
  INSPECTED: "Inspeção concluída — reembolso pendente",
  REFUND_RECORDED: "Reembolso registado",
  CLOSED: "Encerrada",
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 2 }).format(value);
}

export function CustomerReturns({ order }: { order: StoreOrderDetail }) {
  const [policy, setPolicy] = React.useState<{
    enabled: boolean;
    windowDays: number;
    allowChangeOfMind: boolean;
  } | null>(null);
  const [requests, setRequests] = React.useState<StoreReturnRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [reason, setReason] = React.useState<StoreReturnReason>("DEFECTIVE");
  const [description, setDescription] = React.useState("");
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});

  const reload = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const [policyResult, requestResult] = await Promise.all([
      getStoreReturnPolicyAction(),
      getOrderReturnsAction(order.order.id),
    ]);
    setLoading(false);
    if (!policyResult.ok) {
      setError(policyResult.error);
      return;
    }
    if (!requestResult.ok) {
      setError(requestResult.error);
      return;
    }
    setPolicy(policyResult.data);
    setRequests(requestResult.data);
  }, [order.order.id]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const deliveredAt = order.shipment?.deliveredAt ? new Date(order.shipment.deliveredAt).getTime() : 0;
  const eligible =
    policy?.enabled === true &&
    order.order.status === "COMPLETED" &&
    order.shipment?.status === "DELIVERED" &&
    deliveredAt > 0 &&
    Date.now() <= deliveredAt + policy.windowDays * 24 * 60 * 60 * 1000;
  const hasActiveRequest = requests.some((request) =>
    ["REQUESTED", "APPROVED", "RECEIVED", "INSPECTED"].includes(request.status),
  );

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !policy?.enabled) return;
    const items = order.items
      .map((item) => ({ orderItemId: item.id, quantity: Number(quantities[item.id] ?? 0) }))
      .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);
    if (items.length === 0) {
      toast.error("Selecione pelo menos um artigo e uma quantidade.");
      return;
    }
    setSaving(true);
    const result = await createStoreReturnAction(order.order.id, { reason, description, items });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setRequests((current) => [result.data, ...current]);
    setDialogOpen(false);
    setDescription("");
    setQuantities({});
    toast.success("Pedido de devolução submetido para análise.");
  }

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Devoluções e reembolsos</CardTitle>
          <CardDescription>
            Consulte o estado dos pedidos de devolução desta encomenda e acompanhe as decisões da equipa.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Não foi possível carregar as devoluções</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {!loading && policy && !policy.enabled ? (
            <p className="text-muted-foreground text-sm">A política de devoluções ainda não está ativa.</p>
          ) : null}
          {!loading && policy?.enabled && !eligible ? (
            <p className="text-muted-foreground text-sm">
              Esta encomenda não está dentro do prazo ou estado elegível para um novo pedido de devolução.
            </p>
          ) : null}
          {loading ? (
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <LoaderCircle className="animate-spin" /> A carregar pedidos...
            </p>
          ) : null}
          {eligible && hasActiveRequest ? (
            <p className="text-muted-foreground text-sm">
              Já existe um pedido de devolução em curso para esta encomenda.
            </p>
          ) : null}
          {eligible && !hasActiveRequest ? (
            <Button className="w-fit" onClick={() => setDialogOpen(true)}>
              <RotateCcw data-icon="inline-start" />
              Solicitar devolução
            </Button>
          ) : null}
          {requests.map((request) => (
            <CustomerReturnCard key={request.id} request={request} onChanged={reload} />
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Solicitar devolução</DialogTitle>
            <DialogDescription>
              A equipa analisará o pedido e enviará as instruções de envio. O reembolso só é decidido após a receção e
              inspeção.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitRequest} className="flex flex-col gap-5">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="return-reason">Motivo</FieldLabel>
                <Select value={reason} onValueChange={(value) => setReason(value as StoreReturnReason)}>
                  <SelectTrigger id="return-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {REASONS.filter((option) => policy?.allowChangeOfMind || option.value !== "CHANGE_OF_MIND").map(
                        (option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="return-description">Detalhes</FieldLabel>
                <Textarea
                  id="return-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  minLength={5}
                  maxLength={1000}
                  required
                />
              </Field>
            </FieldGroup>
            <div className="flex flex-col gap-3">
              <h3 className="font-medium text-sm">Artigos e quantidades</h3>
              {order.items.map((item) => (
                <Field key={item.id} orientation="horizontal">
                  <FieldLabel className="flex-1" htmlFor={`return-item-${item.id}`}>
                    {item.productNameSnapshot} · {item.variantSnapshot ?? item.skuSnapshot} ({item.quantity} un.)
                  </FieldLabel>
                  <Input
                    id={`return-item-${item.id}`}
                    className="w-24"
                    type="number"
                    min={0}
                    max={item.quantity}
                    step={1}
                    value={quantities[item.id] ?? "0"}
                    onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: event.target.value }))}
                    aria-label={`Quantidade a devolver de ${item.productNameSnapshot}`}
                  />
                </Field>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                Submeter pedido
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CustomerReturnCard({ request, onChanged }: { request: StoreReturnRequest; onChanged: () => void }) {
  const [carrier, setCarrier] = React.useState(request.carrier ?? "");
  const [trackingCode, setTrackingCode] = React.useState(request.trackingCode ?? "");
  const [saving, setSaving] = React.useState(false);

  async function submitTracking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const result = await setStoreReturnTrackingAction(request.id, { carrier, trackingCode });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Rastreio atualizado.");
    onChanged();
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">Pedido #{request.id}</p>
        <Badge variant={request.status === "REJECTED" ? "destructive" : "secondary"}>
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">{request.description}</p>
      <ul className="flex flex-col gap-1 text-sm">
        {request.items.map((item) => (
          <li key={item.id}>
            {item.productName} · {item.quantityRequested} solicitada(s)
          </li>
        ))}
      </ul>
      {request.status === "APPROVED" ? (
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={submitTracking}>
          <Field>
            <FieldLabel htmlFor={`return-carrier-${request.id}`}>Transportadora</FieldLabel>
            <Input
              id={`return-carrier-${request.id}`}
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`return-tracking-${request.id}`}>Código de rastreio</FieldLabel>
            <Input
              id={`return-tracking-${request.id}`}
              value={trackingCode}
              onChange={(event) => setTrackingCode(event.target.value)}
              required
            />
          </Field>
          <Button className="self-end" type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
            Guardar rastreio
          </Button>
        </form>
      ) : null}
      {request.status === "REFUND_RECORDED" ? (
        <p className="text-sm">
          Valor registado: {formatPrice(request.refundAmount)} · referência {request.refundReference}
        </p>
      ) : null}
      <ol className="flex flex-col gap-2 border-t pt-3">
        {request.events.map((event) => (
          <li key={event.id} className="text-muted-foreground text-xs">
            {new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short" }).format(
              new Date(event.createdAt),
            )}
            {" · "}
            {event.note ?? event.action}
          </li>
        ))}
      </ol>
    </article>
  );
}
