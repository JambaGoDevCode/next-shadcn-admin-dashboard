"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { ArrowRight, Eye, MoreHorizontal, RotateCw } from "lucide-react";
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
import type { PlatformPayment } from "@/lib/api/finance-admin";
import type { Booking, Field } from "@/lib/api/types";
import { type ExportDataset, exportDataset } from "@/lib/export";
import { bookingStatusLabel, formatDateTime, formatKz, statusTone } from "@/lib/format";
import { listPaymentsAction } from "@/server/actions/finance-admin";
import { listBookingsAction, listFieldsAction } from "@/server/actions/management";

import { ExportToolbar } from "./export-toolbar";
import { TablePagination } from "./table-pagination";

const PAGE_SIZE = 10;

function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function BookingsPayments() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [payments, setPayments] = useState<PlatformPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [_reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    listBookingsAction()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) setBookings(result.data);
        else {
          setBookings(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setBookings(null);
          setError("Não foi possível carregar as reservas.");
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });

    listFieldsAction()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) setFields(result.data);
      })
      .catch(() => undefined);

    listPaymentsAction()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setPayments(result.ok ? result.data : null);
      })
      .catch(() => {
        if (requestId === requestIdRef.current) setPayments(null);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, []);

  const fieldNames = useMemo(() => new Map(fields.map((field) => [field.id, field.name])), [fields]);
  const statusOptions = useMemo(
    () => [...new Set((bookings ?? []).map((booking) => booking.status))].sort(),
    [bookings],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-PT");
    return (bookings ?? [])
      .filter((booking) => statusFilter === "all" || booking.status === statusFilter)
      .filter((booking) => {
        const day = toDateInputValue(booking.startTime);
        if (fromDate && (!day || day < fromDate)) return false;
        if (toDate && (!day || day > toDate)) return false;
        return true;
      })
      .filter((booking) => {
        if (!query) return true;
        const fieldName = fieldNames.get(booking.fieldId) ?? "";
        return [booking.id, booking.fieldId, booking.userId ?? "", fieldName, booking.status]
          .join(" ")
          .toLocaleLowerCase("pt-PT")
          .includes(query);
      })
      .sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""));
  }, [fieldNames, fromDate, search, statusFilter, toDate, bookings]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = bookings?.find((booking) => booking.id === selectedId) ?? null;

  const totals = useMemo(() => {
    const active = filtered.filter((booking) => !/CANCEL|EXPIRE|REJECT/.test(booking.status.toUpperCase()));
    return {
      activeCount: active.length,
      revenue: active.reduce((sum, booking) => sum + (booking.totalPrice ?? 0), 0),
      cancelled: filtered.length - active.length,
    };
  }, [filtered]);

  const paymentsSummary = useMemo(() => {
    if (!payments) return null;
    const paid = payments.filter((payment) => payment.status === "PAID");
    return {
      count: payments.length,
      total: payments.reduce((sum, payment) => sum + payment.amount, 0),
      paidCount: paid.length,
      paidTotal: paid.reduce((sum, payment) => sum + payment.amount, 0),
    };
  }, [payments]);

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  const buildDataset = (): ExportDataset<Booking> => ({
    filename: `reservas-pagamentos-${new Date().toISOString().slice(0, 10)}`,
    title: "Reservas e pagamentos",
    notes: [
      `Gerado em ${new Date().toLocaleString("pt-PT")}`,
      `Estado: ${statusFilter === "all" ? "todos" : bookingStatusLabel(statusFilter)} · Período: ${
        fromDate || "início"
      } a ${toDate || "hoje"}`,
      `Total exportado: ${filtered.length} reserva(s) · receita activa ${formatKz(totals.revenue)}`,
      "A API não expõe o vínculo entre pagamentos e reservas (Payment não tem bookingId).",
    ],
    columns: [
      { header: "Reserva", value: (booking) => `#${booking.id}`, width: 10 },
      {
        header: "Campo",
        value: (booking) => fieldNames.get(booking.fieldId) ?? `Campo #${booking.fieldId}`,
        width: 24,
      },
      { header: "Cliente", value: (booking) => (booking.userId == null ? "—" : `#${booking.userId}`), width: 10 },
      { header: "Início", value: (booking) => formatDateTime(booking.startTime), width: 16 },
      { header: "Fim", value: (booking) => formatDateTime(booking.endTime), width: 16 },
      { header: "Estado", value: (booking) => bookingStatusLabel(booking.status), width: 14 },
      { header: "Valor (AOA)", value: (booking) => booking.totalPrice ?? "", width: 14 },
      { header: "Pagamento", value: () => "sem vínculo", width: 14 },
    ],
    rows: filtered,
  });

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    if (!filtered.length) {
      toast.error("Não há reservas para exportar com os filtros actuais.");
      return;
    }
    exportDataset(buildDataset(), format);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-muted-foreground text-sm">Receita das reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl tabular-nums leading-none tracking-tight">
              {loading ? "—" : formatKz(totals.revenue)}
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              {totals.activeCount} reserva(s) activa(s) nos filtros actuais
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-muted-foreground text-sm">Cancelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl tabular-nums leading-none tracking-tight">{totals.cancelled}</div>
            <p className="mt-1 text-muted-foreground text-xs">Reservas canceladas ou expiradas no filtro</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-muted-foreground text-sm">Pagamentos liquidados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl tabular-nums leading-none tracking-tight">
              {paymentsSummary ? formatKz(paymentsSummary.paidTotal) : "—"}
            </div>
            <p className="mt-1 text-muted-foreground text-xs">
              {paymentsSummary
                ? `${paymentsSummary.paidCount} de ${paymentsSummary.count} transações`
                : "API indisponível"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-normal text-muted-foreground text-sm">Vínculo reservas ↔ pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl leading-none tracking-tight">—</div>
            <p className="mt-1 text-muted-foreground text-xs">A API não expõe esta associação</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl leading-none">Reservas com impacto financeiro</CardTitle>
              <p className="text-muted-foreground text-sm">
                {bookings === null && !error
                  ? "A consultar GET /bookings na peladeiro-api…"
                  : `${filtered.length} reserva(s) · ${formatKz(totals.revenue)} em reservas activas`}
              </p>
            </div>
            <CardAction className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={reload} disabled={loading}>
                <RotateCw /> Atualizar
              </Button>
              <ExportToolbar onExport={handleExport} disabled={loading || !filtered.length} />
            </CardAction>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Input
              aria-label="Pesquisar reserva, campo ou cliente"
              placeholder="Reserva, campo ou cliente"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filtrar por estado">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {bookingStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              aria-label="Data inicial"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <Input
              aria-label="Data final"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>

          <Alert>
            <AlertTitle>Situação financeira das reservas</AlertTitle>
            <AlertDescription>
              O valor da reserva vem de <code className="font-mono">GET /bookings</code>. A API de pagamentos não expõe{" "}
              <code className="font-mono">bookingId</code>, por isso cada linha apresenta «sem vínculo» em vez de
              associar pagamentos de forma inventada.
            </AlertDescription>
          </Alert>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar as reservas</AlertTitle>
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
                      <TableHead>Reserva</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="w-16 text-right">Opções</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.length ? (
                      visible.map((booking) => (
                        <TableRow key={booking.id} data-state={selectedId === booking.id ? "selected" : undefined}>
                          <TableCell className="font-medium">#{booking.id}</TableCell>
                          <TableCell>{fieldNames.get(booking.fieldId) ?? `Campo #${booking.fieldId}`}</TableCell>
                          <TableCell>{booking.userId == null ? "—" : `Utilizador #${booking.userId}`}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {formatDateTime(booking.startTime)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusTone(booking.status)}>
                              {bookingStatusLabel(booking.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {booking.totalPrice == null ? "—" : formatKz(booking.totalPrice)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">sem vínculo</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-label={`Opções da reserva ${booking.id}`} size="icon-sm" variant="ghost">
                                  <MoreHorizontal />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Reserva #{booking.id}</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setSelectedId((current) => (current === booking.id ? null : booking.id))
                                  }
                                >
                                  <Eye /> {selectedId === booking.id ? "Fechar detalhes" : "Ver detalhes"}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href="/dashboard/finance/transacoes">
                                    <ArrowRight /> Ver transações
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          Não foram encontradas reservas para os filtros actuais.
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
                unit="reservas"
                onPageChange={setPage}
              />
            </>
          )}

          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/finance/transacoes">
                Ir para transações <ArrowRight />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da reserva #{selected.id}</CardTitle>
            <p className="text-muted-foreground text-sm">Situação financeira disponibilizada pela API de reservas.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Campo:</span>{" "}
              {fieldNames.get(selected.fieldId) ?? `Campo #${selected.fieldId}`}
            </p>
            <p>
              <span className="text-muted-foreground">Cliente:</span>{" "}
              {selected.userId == null ? "—" : `Utilizador #${selected.userId}`}
            </p>
            <p>
              <span className="text-muted-foreground">Início:</span> {formatDateTime(selected.startTime)}
            </p>
            <p>
              <span className="text-muted-foreground">Fim:</span> {formatDateTime(selected.endTime)}
            </p>
            <p>
              <span className="text-muted-foreground">Estado:</span>{" "}
              <Badge variant="outline" className={statusTone(selected.status)}>
                {bookingStatusLabel(selected.status)}
              </Badge>
            </p>
            <p>
              <span className="text-muted-foreground">Valor:</span>{" "}
              {selected.totalPrice == null ? "—" : formatKz(selected.totalPrice)}
            </p>
            <p>
              <span className="text-muted-foreground">Pagamento associado:</span> sem vínculo na API
            </p>
            <p>
              <span className="text-muted-foreground">Preço/histórico:</span> não editável nesta interface
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
