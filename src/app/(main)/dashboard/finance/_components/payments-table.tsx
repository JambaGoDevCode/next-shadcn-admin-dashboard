"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Copy, Eye, MoreHorizontal, RotateCw, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlatformPayment } from "@/lib/api/finance-admin";
import { type ExportDataset, exportDataset } from "@/lib/export";
import {
  formatDate,
  formatDateTime,
  formatKz,
  paymentMethodLabel,
  paymentStatusLabel,
  plural,
  statusTone,
} from "@/lib/format";
import { listPaymentsAction, refundPlatformPaymentAction } from "@/server/actions/finance-admin";

import { ExportToolbar } from "./export-toolbar";
import { TablePagination } from "./table-pagination";

export type PaymentsVariant = "transactions" | "refunds" | "reconciliation";

const PAGE_SIZE = 10;

const variantCopy: Record<PaymentsVariant, { title: string; description: string; exportTitle: string }> = {
  transactions: {
    title: "Transações",
    description: "Pagamentos da plataforma: referência, origem, estado e data.",
    exportTitle: "Transações da plataforma",
  },
  refunds: {
    title: "Reembolsos",
    description: "Devoluções financeiras autorizadas e pagamentos elegíveis a reembolso.",
    exportTitle: "Reembolsos",
  },
  reconciliation: {
    title: "Reconciliação",
    description: "Registos internos de pagamento prontos para confronto com o fornecedor.",
    exportTitle: "Reconciliação de pagamentos",
  },
};

function paymentOrigin(payment: PlatformPayment): string {
  const parts: string[] = [`Utilizador #${payment.userId}`];
  if (payment.matchId) parts.push(`Partida #${payment.matchId}`);
  if (payment.tournamentId) parts.push(`Torneio #${payment.tournamentId}`);
  if (payment.teamId) parts.push(`Equipa #${payment.teamId}`);
  return parts.join(" · ");
}

interface PaymentsTableProps {
  variant: PaymentsVariant;
}

export function PaymentsTable({ variant }: PaymentsTableProps) {
  const copy = variantCopy[variant];

  const [payments, setPayments] = useState<PlatformPayment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(variant === "refunds" ? "REFUNDED" : "all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [refundTarget, setRefundTarget] = useState<PlatformPayment | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(() => {
    const requestId = ++requestIdRef.current;
    if (isFirstLoadRef.current) setLoading(true);
    setError(null);

    listPaymentsAction()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) {
          setPayments(result.data);
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
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        isFirstLoadRef.current = false;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const statusOptions = useMemo(
    () => [...new Set((payments ?? []).map((payment) => payment.status))].sort(),
    [payments],
  );
  const methodOptions = useMemo(
    () => [...new Set((payments ?? []).map((payment) => payment.method))].sort(),
    [payments],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-PT");
    return (payments ?? [])
      .filter((payment) => statusFilter === "all" || payment.status === statusFilter)
      .filter((payment) => methodFilter === "all" || payment.method === methodFilter)
      .filter((payment) => {
        const day = payment.createdAt ? payment.createdAt.slice(0, 10) : "";
        if (fromDate && (!day || day < fromDate)) return false;
        if (toDate && (!day || day > toDate)) return false;
        return true;
      })
      .filter((payment) => {
        if (!query) return true;
        return [payment.id, payment.reference, paymentOrigin(payment), payment.status, payment.method]
          .join(" ")
          .toLocaleLowerCase("pt-PT")
          .includes(query);
      })
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.id - a.id);
  }, [fromDate, methodFilter, payments, search, statusFilter, toDate]);

  useEffect(() => {
    setPage(1);
  }, []);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = payments?.find((payment) => payment.id === selectedId) ?? null;

  const totals = useMemo(() => {
    const sum = (rows: PlatformPayment[]) => rows.reduce((acc, payment) => acc + payment.amount, 0);
    return {
      all: sum(filtered),
      paid: sum(filtered.filter((payment) => payment.status === "PAID")),
      pending: sum(filtered.filter((payment) => payment.status === "PENDING")),
      refunded: sum(filtered.filter((payment) => payment.status === "REFUNDED")),
    };
  }, [filtered]);

  const reload = useCallback(() => {
    isFirstLoadRef.current = false;
    load();
  }, [load]);

  const buildDataset = (): ExportDataset<PlatformPayment> => {
    const notes = [
      `Gerado em ${new Date().toLocaleString("pt-PT")}`,
      `Estado: ${statusFilter === "all" ? "todos" : paymentStatusLabel(statusFilter)} · Método: ${
        methodFilter === "all" ? "todos" : paymentMethodLabel(methodFilter)
      }`,
      `Período: ${fromDate || "início"} a ${toDate || "hoje"} · Pesquisa: ${search || "—"}`,
      `Total filtrado: ${formatKz(totals.all)} em ${filtered.length} ${plural(filtered.length, "transação", "transações")}`,
      "Data derivada da referência PAY-<epoch>-<rand>: a tabela de pagamentos não tem coluna de data.",
    ];
    return {
      filename: `pagamentos-${variant}-${new Date().toISOString().slice(0, 10)}`,
      title: copy.exportTitle,
      notes,
      columns: [
        { header: "ID", value: (payment) => payment.id, width: 6 },
        { header: "Referência", value: (payment) => payment.reference, width: 26 },
        { header: "Origem", value: (payment) => paymentOrigin(payment), width: 34 },
        { header: "Estado", value: (payment) => paymentStatusLabel(payment.status), width: 14 },
        { header: "Método", value: (payment) => paymentMethodLabel(payment.method), width: 14 },
        { header: "Data", value: (payment) => formatDate(payment.createdAt), width: 12 },
        { header: "Valor (AOA)", value: (payment) => payment.amount, width: 14 },
      ],
      rows: filtered,
    };
  };

  const handleExport = (format: "excel" | "pdf" | "csv") => {
    if (!filtered.length) {
      toast.error("Não há registos para exportar com os filtros actuais.");
      return;
    }
    exportDataset(buildDataset(), format);
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    const amount = refundAmount.trim() === "" ? undefined : Number(refundAmount.replace(",", "."));
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error("Indique um valor de reembolso válido (maior que zero).");
      return;
    }

    setRefunding(true);
    const result = await refundPlatformPaymentAction({ paymentId: refundTarget.id, amount });
    setRefunding(false);

    if (result.ok) {
      toast.success(result.data.audit);
      setRefundTarget(null);
      setRefundAmount("");
      setSelectedId(null);
      reload();
    } else {
      toast.error(result.error);
    }
  };

  const results = (() => {
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar as transações</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (loading) return <Skeleton className="h-64 w-full" />;

    return (
      <>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                {variant === "reconciliation" && <TableHead>Fornecedor</TableHead>}
                <TableHead className="w-16 text-right">Opções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((payment) => (
                  <TableRow key={payment.id} data-state={selectedId === payment.id ? "selected" : undefined}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                    <TableCell className="text-sm">{paymentOrigin(payment)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusTone(payment.status)}>
                        {paymentStatusLabel(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{paymentMethodLabel(payment.method)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{formatDateTime(payment.createdAt)}</TableCell>
                    <TableCell className="text-right">{formatKz(payment.amount)}</TableCell>
                    {variant === "reconciliation" && <TableCell className="text-muted-foreground">—</TableCell>}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label={`Opções do pagamento ${payment.id}`} size="icon-sm" variant="ghost">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Pagamento #{payment.id}</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => setSelectedId((current) => (current === payment.id ? null : payment.id))}
                          >
                            <Eye /> {selectedId === payment.id ? "Fechar detalhes" : "Ver detalhes"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              void navigator.clipboard.writeText(payment.reference);
                              toast.success("Referência copiada.");
                            }}
                          >
                            <Copy /> Copiar referência
                          </DropdownMenuItem>
                          {payment.status === "PAID" && variant !== "refunds" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setRefundTarget(payment);
                                  setRefundAmount("");
                                }}
                              >
                                <Undo2 /> Reembolsar pagamento
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={variant === "reconciliation" ? 9 : 8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Não foram encontradas transações para os filtros actuais.
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
          unit="transação"
          unitPlural="transações"
          onPageChange={setPage}
        />
      </>
    );
  })();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl leading-none">{copy.title}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {payments === null && !error
                  ? "A consultar GET /payments na peladeiro-api…"
                  : `${filtered.length} ${plural(filtered.length, "transação", "transações")} · ${formatKz(totals.all)}`}
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
              aria-label="Pesquisar referência, ID ou origem"
              placeholder="Referência, ID ou origem"
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
                      {paymentStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger aria-label="Filtrar por método">
                <SelectValue placeholder="Todos os métodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos os métodos</SelectItem>
                  {methodOptions.map((method) => (
                    <SelectItem key={method} value={method}>
                      {paymentMethodLabel(method)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
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
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Filtrado</p>
              <p className="font-medium tabular-nums">{formatKz(totals.all)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Liquidados</p>
              <p className="font-medium tabular-nums">{formatKz(totals.paid)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Pendentes</p>
              <p className="font-medium tabular-nums">{formatKz(totals.pending)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">Reembolsados</p>
              <p className="font-medium tabular-nums">{formatKz(totals.refunded)}</p>
            </div>
          </div>

          {variant === "reconciliation" && (
            <Alert>
              <AlertTitle>Sem dados do fornecedor de pagamento</AlertTitle>
              <AlertDescription>
                A API não expõe um endpoint de reconciliação: a comparação é feita em segundo plano pelo
                ReconciliationWorker, quando um pagamento é confirmado. A coluna do fornecedor apresenta «—» enquanto
                não existir uma API de consulta das transações do gateway.
              </AlertDescription>
            </Alert>
          )}
          {variant === "refunds" && (
            <Alert>
              <AlertTitle>Reembolsos com registo auditável</AlertTitle>
              <AlertDescription>
                Os reembolsos executados identificam o operador e o momento no log do servidor. Só pagamentos liquidados
                (PAID) podem ser reembolsados e cada operação exige confirmação.
              </AlertDescription>
            </Alert>
          )}

          {results}

          <p className="text-muted-foreground text-xs">
            A API ignora os filtros de query em <code className="font-mono">GET /payments</code>: a paginação, os
            filtros e a ordenação são aplicados no cliente. A data é derivada da referência do pagamento.
          </p>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do pagamento #{selected.id}</CardTitle>
            <p className="text-muted-foreground text-sm">
              Registo devolvido por <code className="font-mono">GET /payments/{selected.id}</code>.
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Referência:</span>{" "}
              <span className="font-mono">{selected.reference}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Estado:</span>{" "}
              <Badge variant="outline" className={statusTone(selected.status)}>
                {paymentStatusLabel(selected.status)}
              </Badge>
            </p>
            <p>
              <span className="text-muted-foreground">Valor:</span> {formatKz(selected.amount)}{" "}
              <span className="text-muted-foreground">({selected.currency})</span>
            </p>
            <p>
              <span className="text-muted-foreground">Método:</span> {paymentMethodLabel(selected.method)}
            </p>
            <p>
              <span className="text-muted-foreground">Data (derivada):</span> {formatDateTime(selected.createdAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Origem:</span> {paymentOrigin(selected)}
            </p>
            <p>
              <span className="text-muted-foreground">Cidade:</span>{" "}
              {selected.cityId == null ? "—" : `#${selected.cityId}`}
            </p>
            <p>
              <span className="text-muted-foreground">Metadados:</span>{" "}
              {selected.metadata ? JSON.stringify(selected.metadata) : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Histórico de auditoria:</span> indisponível na API
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={refundTarget !== null} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reembolsar o pagamento #{refundTarget?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta operação altera o estado do pagamento para Reembolsado (REFUNDED) na peladeiro-api, exige permissão
              específica e é registada com o seu utilizador de sessão. Não pode ser desfeita na interface.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="refund-amount">
              Valor parcial (opcional)
            </label>
            <Input
              id="refund-amount"
              inputMode="decimal"
              placeholder={refundTarget ? `Valor total: ${formatKz(refundTarget.amount)}` : "Valor total"}
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refunding}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={refunding} onClick={handleRefund}>
              {refunding ? "A processar…" : "Confirmar reembolso"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
