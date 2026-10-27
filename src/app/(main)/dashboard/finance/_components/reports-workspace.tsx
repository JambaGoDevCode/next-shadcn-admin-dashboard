"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FileSpreadsheet, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlatformPayment } from "@/lib/api/finance-admin";
import type { Booking, Field, StoreOrderRow } from "@/lib/api/types";
import { type ExportDataset, exportDataset } from "@/lib/export";
import {
  bookingStatusLabel,
  formatDateTime,
  formatKz,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
  statusTone,
} from "@/lib/format";
import { listPaymentsAction, listStoreOrdersAction } from "@/server/actions/finance-admin";
import { listBookingsAction, listFieldsAction } from "@/server/actions/management";

import { ExportToolbar } from "./export-toolbar";
import { TablePagination } from "./table-pagination";

type DatasetKey = "transactions" | "refunds" | "bookings" | "orders";

const PAGE_SIZE = 10;

const datasetCopy: Record<DatasetKey, { label: string; description: string }> = {
  transactions: { label: "Transações", description: "Todos os pagamentos da plataforma." },
  refunds: { label: "Reembolsos", description: "Pagamentos com estado REembolsado." },
  bookings: { label: "Reservas", description: "Reservas de campos com valor financeiro." },
  orders: { label: "Encomendas da loja", description: "Encomendas e os seus totais." },
};

interface ReportItem {
  id: string;
  type: string;
  origin: string;
  status: string;
  statusKey: string;
  date: string | null;
  amount: number | null;
}

export function ReportsWorkspace() {
  const [dataset, setDataset] = useState<DatasetKey>("transactions");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [payments, setPayments] = useState<PlatformPayment[] | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [orders, setOrders] = useState<StoreOrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadedRef = useRef<Record<DatasetKey, boolean>>({
    transactions: false,
    refunds: false,
    bookings: false,
    orders: false,
  });

  const loadDataset = useCallback((key: DatasetKey) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const done = () => {
      if (requestId === requestIdRef.current) setLoading(false);
    };

    if (key === "transactions" || key === "refunds") {
      if (loadedRef.current[key]) {
        done();
        return;
      }
      listPaymentsAction()
        .then((result) => {
          if (requestId !== requestIdRef.current) return;
          if (result.ok) {
            setPayments(result.data);
            loadedRef.current.transactions = true;
            loadedRef.current.refunds = true;
          } else {
            setPayments(null);
            setError(result.error);
          }
        })
        .catch(() => {
          if (requestId === requestIdRef.current) {
            setPayments(null);
            setError("Não foi possível carregar as transações.");
          }
        })
        .finally(done);
      return;
    }

    if (key === "bookings") {
      if (loadedRef.current.bookings) {
        done();
        return;
      }
      Promise.all([listBookingsAction(), listFieldsAction()])
        .then(([bookingsResult, fieldsResult]) => {
          if (requestId !== requestIdRef.current) return;
          if (bookingsResult.ok) {
            setBookings(bookingsResult.data);
            loadedRef.current.bookings = true;
          } else {
            setBookings(null);
            setError(bookingsResult.error);
          }
          if (fieldsResult.ok) setFields(fieldsResult.data);
        })
        .catch(() => {
          if (requestId === requestIdRef.current) {
            setBookings(null);
            setError("Não foi possível carregar as reservas.");
          }
        })
        .finally(done);
      return;
    }

    if (loadedRef.current.orders) {
      done();
      return;
    }
    (async () => {
      const collected: StoreOrderRow[] = [];
      for (let offset = 0; offset < 2000; offset += 200) {
        const result = await listStoreOrdersAction({ limit: 200, offset });
        if (!result.ok) return { ok: false as const, error: result.error };
        collected.push(...result.data.list.items);
        if (result.data.list.items.length < 200) break;
      }
      return { ok: true as const, rows: collected };
    })()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) {
          setOrders(result.rows);
          loadedRef.current.orders = true;
        } else {
          setOrders(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setOrders(null);
          setError("Não foi possível carregar as encomendas.");
        }
      })
      .finally(done);
  }, []);

  useEffect(() => {
    loadDataset(dataset);
  }, [dataset, loadDataset]);

  const fieldName = useMemo(() => new Map(fields.map((field) => [field.id, field.name])), [fields]);

  const items = useMemo<ReportItem[]>(() => {
    if (dataset === "transactions" || dataset === "refunds") {
      const rows = dataset === "refunds" ? (payments ?? []).filter((p) => p.status === "REFUNDED") : (payments ?? []);
      return rows.map((payment) => ({
        id: `#${payment.id}`,
        type: paymentMethodLabel(payment.method),
        origin: `Utilizador #${payment.userId}`,
        status: paymentStatusLabel(payment.status),
        statusKey: payment.status,
        date: payment.createdAt,
        amount: payment.amount,
      }));
    }

    if (dataset === "bookings") {
      return (bookings ?? []).map((booking) => ({
        id: `#${booking.id}`,
        type: "Reserva",
        origin: fieldName.get(booking.fieldId) ?? `Campo #${booking.fieldId}`,
        status: bookingStatusLabel(booking.status),
        statusKey: booking.status,
        date: booking.startTime ?? null,
        amount: booking.totalPrice ?? null,
      }));
    }

    return (orders ?? []).map((order) => ({
      id: order.orderNumber,
      type: "Encomenda",
      origin: `Utilizador #${order.userId}`,
      status: orderStatusLabel(order.status),
      statusKey: order.status,
      date: order.createdAt,
      amount: order.totalAmount,
    }));
  }, [bookings, dataset, fieldName, orders, payments]);

  const statusOptions = useMemo(() => [...new Set(items.map((item) => item.statusKey))].sort(), [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-PT");
    return items
      .filter((item) => status === "all" || item.statusKey === status)
      .filter((item) => {
        const day = item.date ? item.date.slice(0, 10) : "";
        if (fromDate && (!day || day < fromDate)) return false;
        if (toDate && (!day || day > toDate)) return false;
        return true;
      })
      .filter((item) => {
        if (!query) return true;
        return [item.id, item.type, item.origin, item.status].join(" ").toLocaleLowerCase("pt-PT").includes(query);
      })
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }, [fromDate, items, search, status, toDate]);

  useEffect(() => {
    setPage(1);
    setStatus("all");
  }, []);

  useEffect(() => {
    setPage(1);
  }, []);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalAmount = filtered.reduce((sum, item) => sum + (item.amount ?? 0), 0);

  const buildDataset = (): ExportDataset<ReportItem> => ({
    filename: `relatorio-${dataset}-${new Date().toISOString().slice(0, 10)}`,
    title: `Relatório financeiro — ${datasetCopy[dataset].label}`,
    notes: [
      `Gerado em ${new Date().toLocaleString("pt-PT")}`,
      `Período: ${fromDate || "início"} a ${toDate || "hoje"} · Estado: ${
        status === "all" ? "todos" : (items.find((item) => item.statusKey === status)?.status ?? status)
      } · Pesquisa: ${search || "—"}`,
      `Total exportado: ${filtered.length} registo(s) · ${formatKz(totalAmount)}`,
      "Origem: peladeiro-api (módulo de pagamentos, reservas e loja).",
    ],
    columns: [
      { header: "Identificador", value: (item) => item.id, width: 16 },
      { header: "Tipo", value: (item) => item.type, width: 16 },
      { header: "Origem", value: (item) => item.origin, width: 26 },
      { header: "Estado", value: (item) => item.status, width: 16 },
      { header: "Data", value: (item) => formatDateTime(item.date), width: 16 },
      { header: "Valor (AOA)", value: (item) => item.amount ?? "", width: 14 },
    ],
    rows: filtered,
  });

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    if (!filtered.length) {
      toast.error("Não há registos para exportar com os filtros actuais.");
      return;
    }
    exportDataset(buildDataset(), format);
    toast.success(`Relatório exportado em ${format.toUpperCase()}.`);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl leading-none">Gerar relatório</CardTitle>
              <p className="text-muted-foreground text-sm">
                {datasetCopy[dataset].description} Escolha o conjunto, o período e o estado, depois exporte.
              </p>
            </div>
            <CardAction className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadedRef.current[dataset] = false;
                  loadDataset(dataset);
                }}
                disabled={loading}
              >
                <RotateCw /> Recarregar
              </Button>
              <ExportToolbar onExport={handleExport} disabled={loading || !filtered.length} label="Exportar" />
            </CardAction>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-dataset">Conjunto de dados</Label>
              <Select value={dataset} onValueChange={(value) => setDataset(value as DatasetKey)}>
                <SelectTrigger id="report-dataset" aria-label="Conjunto de dados">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {(Object.keys(datasetCopy) as DatasetKey[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {datasetCopy[key].label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="report-status" aria-label="Estado">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {items.find((item) => item.statusKey === option)?.status ?? option}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-from">Data inicial</Label>
              <Input
                id="report-from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-to">Data final</Label>
              <Input id="report-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="report-search">Pesquisa</Label>
              <Input
                id="report-search"
                placeholder="Identificador, origem ou estado"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Registos filtrados</p>
              <p className="font-medium tabular-nums">{filtered.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Soma dos valores</p>
              <p className="font-medium tabular-nums">{formatKz(totalAmount)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Formatos disponíveis</p>
              <p className="font-medium">Excel · PDF · CSV</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Filtros do relatório</p>
              <p className="font-medium">
                {fromDate || "início"} → {toDate || "hoje"}
              </p>
            </div>
          </div>

          <Alert>
            <FileSpreadsheet />
            <AlertTitle>Escopo da exportação</AlertTitle>
            <AlertDescription>
              A exportação inclui <strong>todos os registos filtrados</strong>, não apenas a página visível. Os filtros
              e o total aparecem no cabeçalho do documento.
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível gerar o relatório</AlertTitle>
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
                      <TableHead>Identificador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.length ? (
                      visible.map((item) => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.origin}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusTone(item.statusKey)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{formatDateTime(item.date)}</TableCell>
                          <TableCell className="text-right">
                            {item.amount == null ? "—" : formatKz(item.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Sem registos para os filtros seleccionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <TablePagination
                page={currentPage}
                pageCount={pageCount}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                unit="registos"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
