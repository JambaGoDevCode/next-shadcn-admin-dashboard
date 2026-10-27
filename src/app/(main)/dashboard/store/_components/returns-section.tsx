"use client";

import * as React from "react";

import { AlertCircle, ClipboardCheck, LoaderCircle, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { StoreOrderDetail, StoreReturnPolicy, StoreReturnReason, StoreReturnRequest } from "@/lib/api/types";
import { formatDateTime, formatKz } from "@/lib/format";
import {
  closeStoreReturnAction,
  createStoreReturnForOrderAction,
  getOrderAction,
  inspectStoreReturnAction,
  receiveStoreReturnAction,
  recordStoreReturnRefundAction,
  reviewStoreReturnAction,
  updateStoreReturnPolicyAction,
} from "@/server/actions/store";

const RETURN_STATUSES = [
  { value: "all", label: "Todos os estados" },
  { value: "REQUESTED", label: "Pedido submetido" },
  { value: "APPROVED", label: "Autorizada" },
  { value: "RECEIVED", label: "Recebida" },
  { value: "INSPECTED", label: "Inspecionada" },
  { value: "REFUND_RECORDED", label: "Reembolso registado" },
  { value: "REJECTED", label: "Rejeitada" },
  { value: "CLOSED", label: "Encerrada" },
];

const RETURN_REASONS: Array<{ value: StoreReturnReason; label: string }> = [
  { value: "DEFECTIVE", label: "Artigo com defeito" },
  { value: "WRONG_ITEM", label: "Artigo recebido errado" },
  { value: "NOT_AS_DESCRIBED", label: "Diferente da descrição" },
  { value: "CHANGE_OF_MIND", label: "Desistência" },
  { value: "OTHER", label: "Outro motivo" },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  RETURN_STATUSES.filter((status) => status.value !== "all").map((status) => [status.value, status.label]),
);

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "REJECTED") return "destructive";
  if (status === "REFUND_RECORDED") return "default";
  if (status === "REQUESTED" || status === "INSPECTED") return "secondary";
  return "outline";
}

interface ReturnsSectionProps {
  initialPolicy: StoreReturnPolicy;
  initialRequests: StoreReturnRequest[];
}

export function ReturnsSection({ initialPolicy, initialRequests }: ReturnsSectionProps) {
  const [policy, setPolicy] = React.useState(initialPolicy);
  const [enabled, setEnabled] = React.useState(initialPolicy.enabled);
  const [windowDays, setWindowDays] = React.useState(String(initialPolicy.windowDays));
  const [allowChangeOfMind, setAllowChangeOfMind] = React.useState(initialPolicy.allowChangeOfMind);
  const [savingPolicy, setSavingPolicy] = React.useState(false);
  const [requests, setRequests] = React.useState(initialRequests);
  const [filter, setFilter] = React.useState("all");
  const [selected, setSelected] = React.useState<StoreReturnRequest | null>(null);
  const [newRequestOpen, setNewRequestOpen] = React.useState(false);

  async function savePolicy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const days = Number(windowDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      toast.error("O prazo tem de ser um número inteiro entre 1 e 365 dias.");
      return;
    }

    setSavingPolicy(true);
    const result = await updateStoreReturnPolicyAction({ enabled, windowDays: days, allowChangeOfMind });
    setSavingPolicy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setPolicy(result.data);
    toast.success("Política de devoluções guardada.");
  }

  function updateRequest(request: StoreReturnRequest) {
    setRequests((current) => current.map((item) => (item.id === request.id ? request : item)));
    setSelected(request);
  }

  const visibleRequests = requests.filter((request) => filter === "all" || request.status === filter);

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <AlertCircle />
        <AlertTitle>Reembolso manual, com auditoria</AlertTitle>
        <AlertDescription>
          O Peladeiro não executa o pagamento externo. A equipa deve processar o reembolso no meio financeiro e registar
          método, referência e nota; só então o pedido fica marcado como reembolso registado. O valor calculado cobre os
          artigos aceites após inspeção, não inclui portes e nunca pode exceder o total pago. Confirme a política com
          assessoria local antes de a ativar.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Política da loja</CardTitle>
            <CardDescription>
              Defina os parâmetros de elegibilidade. A configuração inicial está desativada e não abre pedidos aos
              clientes até ser ativada.
            </CardDescription>
          </div>
          <CardAction>
            <Badge variant={policy.enabled ? "default" : "secondary"}>{policy.enabled ? "Ativa" : "Inativa"}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePolicy} className="flex flex-col gap-5">
            <FieldGroup className="sm:grid sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="return-window-days">Prazo após entrega (dias)</FieldLabel>
                <Input
                  id="return-window-days"
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  value={windowDays}
                  onChange={(event) => setWindowDays(event.target.value)}
                  required
                />
              </Field>
              <Field orientation="horizontal" className="justify-between rounded-lg border p-3">
                <FieldLabel htmlFor="allow-change-of-mind" className="flex-col items-start gap-1">
                  Aceitar desistência
                  <span className="font-normal text-muted-foreground text-xs">
                    Sujeita ao prazo e análise da equipa
                  </span>
                </FieldLabel>
                <Switch id="allow-change-of-mind" checked={allowChangeOfMind} onCheckedChange={setAllowChangeOfMind} />
              </Field>
              <Field orientation="horizontal" className="justify-between rounded-lg border p-3">
                <FieldLabel htmlFor="return-policy-enabled" className="flex-col items-start gap-1">
                  Ativar pedidos
                  <span className="font-normal text-muted-foreground text-xs">
                    Permite pedidos de clientes e da equipa
                  </span>
                </FieldLabel>
                <Switch id="return-policy-enabled" checked={enabled} onCheckedChange={setEnabled} />
              </Field>
            </FieldGroup>
            <Button className="w-fit" type="submit" disabled={savingPolicy}>
              {savingPolicy ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
              Guardar política
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pedidos de devolução</CardTitle>
            <CardDescription>
              Rever, autorizar, receber, inspecionar e registar reembolsos por encomenda.
            </CardDescription>
          </div>
          <CardAction>
            <Badge variant="secondary">{requests.length} pedidos</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-64" aria-label="Filtrar devoluções por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {RETURN_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setNewRequestOpen(true)}>
              <RotateCcw data-icon="inline-start" />
              Abrir em nome do cliente
            </Button>
          </div>
          {visibleRequests.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardCheck />
                </EmptyMedia>
                <EmptyTitle>Sem pedidos neste estado</EmptyTitle>
                <EmptyDescription>Os pedidos de devolução submetidos aparecerão aqui.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Encomenda</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Button
                        variant="link"
                        className="h-auto p-0 font-medium"
                        aria-label={`Abrir pedido de devolução #${request.id}`}
                        onClick={() => setSelected(request)}
                      >
                        #{request.id}
                      </Button>
                    </TableCell>
                    <TableCell>{request.orderNumber}</TableCell>
                    <TableCell>#{request.customerId}</TableCell>
                    <TableCell>
                      {RETURN_REASONS.find((reason) => reason.value === request.reason)?.label ?? request.reason}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(request.status)}>
                        {STATUS_LABELS[request.status] ?? request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(request.createdAt)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatKz(request.refundAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReturnDetailsDialog
        request={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onUpdated={updateRequest}
      />
      <AdminCreateReturnDialog
        open={newRequestOpen}
        onOpenChange={setNewRequestOpen}
        onCreated={(request) => setRequests((current) => [request, ...current])}
      />
    </div>
  );
}

function AdminCreateReturnDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (request: StoreReturnRequest) => void;
}) {
  const [orderId, setOrderId] = React.useState("");
  const [order, setOrder] = React.useState<StoreOrderDetail | null>(null);
  const [reason, setReason] = React.useState<StoreReturnReason>("DEFECTIVE");
  const [description, setDescription] = React.useState("");
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function loadOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = Number(orderId);
    if (!Number.isInteger(id) || id < 1) {
      toast.error("Indique um número de encomenda válido.");
      return;
    }
    setLoading(true);
    const result = await getOrderAction(id);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setOrder(result.data);
    setQuantities(Object.fromEntries(result.data.items.map((item) => [item.id, "0"])));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order) return;
    const items = order.items
      .map((item) => ({ orderItemId: item.id, quantity: Number(quantities[item.id] ?? 0) }))
      .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);
    if (items.length === 0) {
      toast.error("Selecione pelo menos um artigo.");
      return;
    }
    setSaving(true);
    const result = await createStoreReturnForOrderAction(order.order.id, { reason, description, items });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onCreated(result.data);
    onOpenChange(false);
    setOrder(null);
    setOrderId("");
    setDescription("");
    toast.success("Pedido de devolução aberto.");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setOrder(null);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Abrir devolução em nome do cliente</DialogTitle>
          <DialogDescription>
            Localize a encomenda e registe os artigos e o motivo comunicados pelo cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={loadOrder} className="flex items-end gap-3">
          <Field className="flex-1">
            <FieldLabel htmlFor="return-order-id">ID da encomenda</FieldLabel>
            <Input
              id="return-order-id"
              type="number"
              min={1}
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" variant="outline" disabled={loading}>
            {loading ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Search data-icon="inline-start" />
            )}
            Carregar
          </Button>
        </form>
        {order ? (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <p className="font-medium text-sm">
              {order.order.orderNumber} · Cliente #{order.order.userId}
            </p>
            <FieldGroup className="sm:grid sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="admin-return-reason">Motivo</FieldLabel>
                <Select value={reason} onValueChange={(value) => setReason(value as StoreReturnReason)}>
                  <SelectTrigger id="admin-return-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {RETURN_REASONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="admin-return-description">Descrição do cliente</FieldLabel>
                <Textarea
                  id="admin-return-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  minLength={5}
                  maxLength={1000}
                  required
                />
              </Field>
            </FieldGroup>
            <div className="flex flex-col gap-3">
              {order.items.map((item) => (
                <Field key={item.id} orientation="horizontal">
                  <FieldLabel className="flex-1" htmlFor={`admin-return-item-${item.id}`}>
                    {item.productNameSnapshot} · {item.variantSnapshot ?? item.skuSnapshot} ({item.quantity})
                  </FieldLabel>
                  <Input
                    id={`admin-return-item-${item.id}`}
                    className="w-24"
                    type="number"
                    min={0}
                    max={item.quantity}
                    step={1}
                    value={quantities[item.id] ?? "0"}
                    onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: event.target.value }))}
                  />
                </Field>
              ))}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : null}
                Abrir pedido
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ReturnDetailsDialog({
  request,
  onOpenChange,
  onUpdated,
}: {
  request: StoreReturnRequest | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: (request: StoreReturnRequest) => void;
}) {
  const [note, setNote] = React.useState("");
  const [method, setMethod] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [received, setReceived] = React.useState<Record<number, string>>({});
  const [inspection, setInspection] = React.useState<
    Record<number, { accepted: string; restocked: string; note: string }>
  >({});

  React.useEffect(() => {
    if (!request) return;
    setNote("");
    setMethod("");
    setReference("");
    setReceived(Object.fromEntries(request.items.map((item) => [item.orderItemId, String(item.quantityRequested)])));
    setInspection(
      Object.fromEntries(
        request.items.map((item) => [
          item.orderItemId,
          { accepted: String(item.quantityReceived), restocked: "0", note: "" },
        ]),
      ),
    );
  }, [request]);

  async function run(operation: () => Promise<{ ok: boolean; data?: StoreReturnRequest; error?: string }>) {
    if (saving) return;
    setSaving(true);
    const result = await operation();
    setSaving(false);
    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Resposta inválida do servidor." : (result.error ?? "Operação falhou."));
      return;
    }
    onUpdated(result.data);
    setNote("");
    toast.success("Pedido de devolução atualizado.");
  }

  function submitReview(decision: "APPROVE" | "REJECT") {
    if (!request) return;
    void run(() => reviewStoreReturnAction(request.id, { decision, note }));
  }

  function submitReceipt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request) return;
    const items = request.items.map((item) => ({
      orderItemId: item.orderItemId,
      quantityReceived: Number(received[item.orderItemId] ?? 0),
    }));
    void run(() => receiveStoreReturnAction(request.id, { items }));
  }

  function submitInspection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request) return;
    const items = request.items.map((item) => ({
      orderItemId: item.orderItemId,
      quantityAccepted: Number(inspection[item.orderItemId]?.accepted ?? 0),
      quantityRestocked: Number(inspection[item.orderItemId]?.restocked ?? 0),
      inspectionNote: inspection[item.orderItemId]?.note,
    }));
    void run(() => inspectStoreReturnAction(request.id, { items }));
  }

  function submitRefund(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request) return;
    void run(() => recordStoreReturnRefundAction(request.id, { method, reference, note }));
  }

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {request ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                Devolução #{request.id} · {request.orderNumber}
                <Badge variant={statusVariant(request.status)}>{STATUS_LABELS[request.status] ?? request.status}</Badge>
              </DialogTitle>
              <DialogDescription>
                Cliente #{request.customerId} · submetido em {formatDateTime(request.createdAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Alert>
                <AlertTitle>
                  {RETURN_REASONS.find((reason) => reason.value === request.reason)?.label ?? request.reason}
                </AlertTitle>
                <AlertDescription>{request.description}</AlertDescription>
              </Alert>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Artigo</TableHead>
                      <TableHead className="text-right">Pedido</TableHead>
                      <TableHead className="text-right">Recebido</TableHead>
                      <TableHead className="text-right">Aceite</TableHead>
                      <TableHead className="text-right">Reposto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {request.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-muted-foreground text-xs">
                            {item.sku} · {formatKz(item.unitPrice)}/un.
                          </p>
                        </TableCell>
                        <TableCell className="text-right">{item.quantityRequested}</TableCell>
                        <TableCell className="text-right">{item.quantityReceived}</TableCell>
                        <TableCell className="text-right">{item.quantityAccepted}</TableCell>
                        <TableCell className="text-right">{item.quantityRestocked}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {request.status === "REQUESTED" ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="return-review-note">Decisão e instruções para envio</FieldLabel>
                    <Textarea
                      id="return-review-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      minLength={3}
                      maxLength={1000}
                      placeholder="Explique a decisão. Se autorizar, inclua instruções de envio e morada de devolução."
                      required
                    />
                  </Field>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => submitReview("REJECT")}
                      disabled={saving || note.trim().length < 3}
                    >
                      Rejeitar pedido
                    </Button>
                    <Button onClick={() => submitReview("APPROVE")} disabled={saving || note.trim().length < 3}>
                      Autorizar devolução
                    </Button>
                  </DialogFooter>
                </FieldGroup>
              ) : null}

              {request.status === "APPROVED" ? (
                <form onSubmit={submitReceipt} className="flex flex-col gap-4">
                  <p className="font-medium text-sm">Confirmar receção no armazém</p>
                  {request.items.map((item) => (
                    <Field key={item.id} orientation="horizontal">
                      <FieldLabel className="flex-1" htmlFor={`received-${item.id}`}>
                        {item.productName} · até {item.quantityRequested}
                      </FieldLabel>
                      <Input
                        id={`received-${item.id}`}
                        className="w-24"
                        type="number"
                        min={0}
                        max={item.quantityRequested}
                        step={1}
                        value={received[item.orderItemId] ?? "0"}
                        onChange={(event) =>
                          setReceived((current) => ({ ...current, [item.orderItemId]: event.target.value }))
                        }
                      />
                    </Field>
                  ))}
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>
                      Confirmar receção
                    </Button>
                  </DialogFooter>
                </form>
              ) : null}

              {request.status === "RECEIVED" ? (
                <form onSubmit={submitInspection} className="flex flex-col gap-4">
                  <p className="font-medium text-sm">Inspeção dos artigos recebidos</p>
                  {request.items.map((item) => (
                    <div key={item.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-4">
                      <p className="self-center font-medium text-sm sm:col-span-4">
                        {item.productName} · {item.quantityReceived} recebido(s)
                      </p>
                      <Field>
                        <FieldLabel htmlFor={`accepted-${item.id}`}>Aceites</FieldLabel>
                        <Input
                          id={`accepted-${item.id}`}
                          type="number"
                          min={0}
                          max={item.quantityReceived}
                          step={1}
                          value={inspection[item.orderItemId]?.accepted ?? "0"}
                          onChange={(event) =>
                            setInspection((current) => ({
                              ...current,
                              [item.orderItemId]: {
                                ...current[item.orderItemId],
                                accepted: event.target.value,
                              },
                            }))
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`restocked-${item.id}`}>Repor em stock</FieldLabel>
                        <Input
                          id={`restocked-${item.id}`}
                          type="number"
                          min={0}
                          max={item.quantityReceived}
                          step={1}
                          value={inspection[item.orderItemId]?.restocked ?? "0"}
                          onChange={(event) =>
                            setInspection((current) => ({
                              ...current,
                              [item.orderItemId]: {
                                ...current[item.orderItemId],
                                restocked: event.target.value,
                              },
                            }))
                          }
                        />
                      </Field>
                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor={`inspection-note-${item.id}`}>
                          Nota (obrigatória se não aceitar tudo)
                        </FieldLabel>
                        <Input
                          id={`inspection-note-${item.id}`}
                          value={inspection[item.orderItemId]?.note ?? ""}
                          onChange={(event) =>
                            setInspection((current) => ({
                              ...current,
                              [item.orderItemId]: {
                                ...current[item.orderItemId],
                                note: event.target.value,
                              },
                            }))
                          }
                        />
                      </Field>
                    </div>
                  ))}
                  <DialogFooter>
                    <Button type="submit" disabled={saving}>
                      Concluir inspeção e calcular reembolso
                    </Button>
                  </DialogFooter>
                </form>
              ) : null}

              {request.status === "INSPECTED" ? (
                request.refundAmount > 0 ? (
                  <form onSubmit={submitRefund} className="flex flex-col gap-4">
                    <Alert>
                      <AlertTitle>Reembolso calculado: {formatKz(request.refundAmount)}</AlertTitle>
                      <AlertDescription>
                        Faça o pagamento fora do Peladeiro. Depois, registe o meio e a referência verificável da
                        operação para fechar a auditoria.
                      </AlertDescription>
                    </Alert>
                    <FieldGroup className="sm:grid sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="refund-method">Meio usado</FieldLabel>
                        <Input
                          id="refund-method"
                          value={method}
                          onChange={(event) => setMethod(event.target.value)}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="refund-reference">Referência do comprovativo</FieldLabel>
                        <Input
                          id="refund-reference"
                          value={reference}
                          onChange={(event) => setReference(event.target.value)}
                          required
                        />
                      </Field>
                      <Field className="sm:col-span-2">
                        <FieldLabel htmlFor="refund-note">Nota de auditoria</FieldLabel>
                        <Textarea
                          id="refund-note"
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          required
                        />
                      </Field>
                    </FieldGroup>
                    <DialogFooter>
                      <Button type="submit" disabled={saving}>
                        Registar reembolso externo
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="close-return-note">Motivo para encerrar sem reembolso</FieldLabel>
                      <Textarea
                        id="close-return-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        required
                      />
                    </Field>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        disabled={saving || note.trim().length < 3}
                        onClick={() => {
                          void run(() => closeStoreReturnAction(request.id, note));
                        }}
                      >
                        Encerrar sem reembolso
                      </Button>
                    </DialogFooter>
                  </FieldGroup>
                )
              ) : null}

              {request.status === "REFUND_RECORDED" ? (
                <Alert>
                  <AlertTitle>Reembolso registado manualmente: {formatKz(request.refundAmount)}</AlertTitle>
                  <AlertDescription>
                    {request.refundMethod} · {request.refundReference} · {request.refundNote}
                  </AlertDescription>
                </Alert>
              ) : null}

              <section className="flex flex-col gap-2 border-t pt-4">
                <h3 className="font-medium text-sm">Histórico de auditoria</h3>
                <ol className="flex flex-col gap-2">
                  {request.events.map((event) => (
                    <li key={event.id} className="text-muted-foreground text-xs">
                      {formatDateTime(event.createdAt)} · {event.action} · operador #{event.actorId ?? "sistema"}
                      {event.note ? ` — ${event.note}` : ""}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
