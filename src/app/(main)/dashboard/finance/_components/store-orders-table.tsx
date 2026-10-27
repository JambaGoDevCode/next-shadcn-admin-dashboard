"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Copy, Eye, MoreHorizontal, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StoreOrderDetail, StoreOrderList, StoreOrderRow } from "@/lib/api/types";
import { type ExportDataset, exportDataset } from "@/lib/export";
import {
  formatDateTime,
  formatKz,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  statusTone,
} from "@/lib/format";
import { listStoreOrdersAction } from "@/server/actions/finance-admin";
import { getOrderAction } from "@/server/actions/store";

import { ExportToolbar } from "./export-toolbar";
import { TablePagination } from "./table-pagination";

const PAGE_SIZE = 10;
const ORDER_STATUSES = ["PENDING_PAYMENT", "PAID", "PROCESSING", "COMPLETED", "CANCELLED"] as const;

export function StoreOrdersTable() {
  const [list, setList] = useState<StoreOrderList | null>(null);
  const [scope, setScope] = useState<"all" | "own">("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [_reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<StoreOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const requestIdRef = useRef(0);

  const offset = (page - 1) * PAGE_SIZE;

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    listStoreOrdersAction({
      limit: PAGE_SIZE,
      offset,
      status: status === "all" ? undefined : status,
      search: search.trim() || undefined,
    })
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) {
          setList(result.data.list);
          setScope(result.data.scope);
        } else {
          setList(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setList(null);
          setError("Não foi possível carregar as encomendas.");
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [offset, search, status]);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, []);

  const rows = list?.items ?? [];
  const total = list?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    getOrderAction(selectedId)
      .then((result) => {
        if (!cancelled) setDetail(result.ok ? result.data : null);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  /** Lê todas as páginas do conjunto filtrado para exportar além da página visível. */
  const collectAllRows = useCallback(async (): Promise<StoreOrderRow[]> => {
    const collected: StoreOrderRow[] = [];
    const size = 200;
    for (let currentOffset = 0; currentOffset < 2000; currentOffset += size) {
      const result = await listStoreOrdersAction({
        limit: size,
        offset: currentOffset,
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
      });
      if (!result.ok) break;
      collected.push(...result.data.list.items);
      if (result.data.list.items.length < size) break;
    }
    return collected;
  }, [search, status]);

  const buildDataset = (orderRows: StoreOrderRow[]): ExportDataset<StoreOrderRow> => ({
    filename: `loja-encomendas-${new Date().toISOString().slice(0, 10)}`,
    title: "Loja — encomendas e pagamentos",
    notes: [
      `Gerado em ${new Date().toLocaleString("pt-PT")}`,
      `Estado: ${status === "all" ? "todos" : orderStatusLabel(status)} · Pesquisa: ${search || "—"}`,
      `Âmbito: ${scope === "all" ? "todas as encomendas da plataforma" : "apenas encomendas da sessão actual"}`,
      `Total exportado: ${orderRows.length} encomenda(s)`,
    ],
    columns: [
      { header: "Encomenda", value: (order) => `${order.orderNumber} (#${order.id})`, width: 24 },
      { header: "Cliente", value: (order) => `#${order.userId}`, width: 10 },
      { header: "Estado", value: (order) => orderStatusLabel(order.status), width: 18 },
      { header: "Itens", value: (order) => order.itemCount, width: 6 },
      { header: "Subtotal", value: (order) => order.subtotal, width: 12 },
      { header: "Portes", value: (order) => order.shippingAmount, width: 10 },
      { header: "Desconto", value: (order) => order.discountAmount, width: 10 },
      { header: "Total", value: (order) => order.totalAmount, width: 12 },
      { header: "Data", value: (order) => formatDateTime(order.createdAt), width: 14 },
    ],
    rows: orderRows,
  });

  const handleExport = async (format: "excel" | "pdf" | "csv") => {
    const orderRows = await collectAllRows();
    if (!orderRows.length) {
      toast.error("Não há encomendas para exportar com os filtros actuais.");
      return;
    }
    exportDataset(buildDataset(orderRows), format);
  };

  const statusOptions = useMemo(() => ORDER_STATUSES.slice(), []);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl leading-none">Encomendas e pagamentos</CardTitle>
              <p className="text-muted-foreground text-sm">
                {list === null && !error
                  ? "A consultar GET /store/orders na peladeiro-api…"
                  : `${total} encomenda(s) no total`}
              </p>
            </div>
            <CardAction className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
                <RotateCw /> Atualizar
              </Button>
              <ExportToolbar onExport={handleExport} disabled={loading} />
            </CardAction>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              aria-label="Pesquisar encomenda ou cliente"
              placeholder="Número de encomenda ou cliente"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Filtrar por estado">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {statusOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {orderStatusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="self-center text-muted-foreground text-sm">
              {scope === "all"
                ? "Listagem global da plataforma (limit/offset/status/search no servidor)."
                : "Sem perfil administrativo: são mostradas apenas as encomendas da sessão actual."}
            </p>
          </div>

          <Alert>
            <AlertTitle>Pagamentos da loja</AlertTitle>
            <AlertDescription>
              Cada encomenda liga-se ao módulo de pagamentos por <code className="font-mono">paymentId</code>. Abra os
              detalhes de uma encomenda para ver os pagamentos associados e o respectivo estado.
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar as encomendas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Encomenda</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Itens</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-16 text-right">Opções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length ? (
                      rows.map((order) => (
                        <TableRow key={order.id} data-state={selectedId === order.id ? "selected" : undefined}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>Utilizador #{order.userId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={orderStatusTone(order.status)}>
                              {orderStatusLabel(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{order.itemCount}</TableCell>
                          <TableCell className="text-right">{formatKz(order.totalAmount)}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{formatDateTime(order.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-label={`Opções da encomenda ${order.id}`} size="icon-sm" variant="ghost">
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Encomenda {order.orderNumber}</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => setSelectedId((current) => (current === order.id ? null : order.id))}
                                >
                                  <Eye /> {selectedId === order.id ? "Fechar detalhes" : "Ver detalhes"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    void navigator.clipboard.writeText(order.orderNumber);
                                    toast.success("Número de encomenda copiado.");
                                  }}
                                >
                                  <Copy /> Copiar número
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Sem encomendas para os filtros actuais.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                page={page}
                pageCount={pageCount}
                total={total}
                pageSize={PAGE_SIZE}
                unit="encomendas"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {selectedId && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da encomenda #{selectedId}</CardTitle>
            <p className="text-muted-foreground text-sm">Itens, morada e pagamentos associados.</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {detailLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : detail ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <p>
                    <span className="text-muted-foreground">Número:</span> {detail.orderNumber}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Estado:</span>{" "}
                    <Badge variant="outline" className={orderStatusTone(detail.order.status)}>
                      {orderStatusLabel(detail.order.status)}
                    </Badge>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Total:</span> {formatKz(detail.order.totalAmount)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Subtotal:</span> {formatKz(detail.order.subtotal)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Portes:</span> {formatKz(detail.order.shippingAmount)}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Desconto:</span> {formatKz(detail.order.discountAmount)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 font-medium">Pagamentos da encomenda</p>
                  {detail.payments.length ? (
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Referência API</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="font-medium">#{payment.id}</TableCell>
                              <TableCell>
                                {payment.paymentId ? (
                                  <span className="font-mono text-xs">payments/#{payment.paymentId}</span>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusTone(payment.status)}>
                                  {paymentStatusLabel(payment.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatKz(payment.amount)}</TableCell>
                              <TableCell className="whitespace-nowrap">{formatDateTime(payment.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">A encomenda ainda não tem pagamentos registados.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Não foi possível carregar o detalhe da encomenda.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
