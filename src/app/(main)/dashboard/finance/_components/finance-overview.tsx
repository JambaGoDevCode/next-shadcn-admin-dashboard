import Link from "next/link";

import { ArrowRight, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PlatformPayment } from "@/lib/api/finance-admin";
import type { ConversionsOverview, MetricsOverview, StoreOverview } from "@/lib/api/types";
import { formatKz, paymentStatusLabel, statusTone } from "@/lib/format";

import type { LoadState } from "./load";

interface FinanceOverviewProps {
  metrics: LoadState<MetricsOverview>;
  conversions: LoadState<ConversionsOverview>;
  store: LoadState<StoreOverview>;
  /** `null` quando a API de pagamentos não respondeu. */
  payments: PlatformPayment[] | null;
}

interface KpiProps {
  label: string;
  value: string;
  hint?: string;
  failed?: boolean;
}

function Kpi({ label, value, hint, failed = false }: KpiProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-muted-foreground text-sm">{label}</CardTitle>
        {failed && <span className="text-destructive text-xs">offline</span>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl tabular-nums leading-none tracking-tight">{failed ? "—" : value}</div>
        {hint && !failed && <p className="mt-1 text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "n/d";
  return `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;
}

function sumBy(payments: PlatformPayment[], status: string): { count: number; total: number } {
  const rows = payments.filter((payment) => payment.status === status);
  return { count: rows.length, total: rows.reduce((sum, payment) => sum + payment.amount, 0) };
}

export function FinanceOverview({ metrics, conversions, store, payments }: FinanceOverviewProps) {
  const rows = payments ?? [];
  const paid = sumBy(rows, "PAID");
  const pending = sumBy(rows, "PENDING");
  const refunded = sumBy(rows, "REFUNDED");
  const allTotal = rows.reduce((sum, payment) => sum + payment.amount, 0);

  const statuses = [...new Set(rows.map((payment) => payment.status))].sort();
  const pendingBookings = metrics.data?.bookings.pending ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Receitas"
          value={formatKz(metrics.data?.revenue.current ?? 0)}
          hint={`Reservas concluídas (30 d) · ${pct(metrics.data?.revenue.deltaPct)}`}
          failed={metrics.failed}
        />
        <Kpi
          label="Volume transacionado"
          value={formatKz(conversions.data?.volume.current ?? 0)}
          hint={`Pagamentos (30 d) · ${pct(conversions.data?.volume.deltaPct)}`}
          failed={conversions.failed}
        />
        <Kpi
          label="Valores pendentes"
          value={formatKz(pending.total)}
          hint={
            payments
              ? `${pending.count} pagamento(ões) aguardam liquidação`
              : "Sem dados: a API de pagamentos não respondeu"
          }
          failed={payments === null}
        />
        <Kpi
          label="Reembolsos"
          value={formatKz(refunded.total)}
          hint={payments ? `${refunded.count} pagamento(ões) reembolsados` : "Sem dados de pagamentos"}
          failed={payments === null}
        />
        <Kpi
          label="Pagamentos liquidados"
          value={formatKz(paid.total)}
          hint={payments ? `${paid.count} de ${rows.length} transações` : "Sem dados de pagamentos"}
          failed={payments === null}
        />
        <Kpi
          label="Comissões da plataforma"
          value="—"
          hint="A tabela platform_fees existe na API, mas não tem endpoint de consulta."
        />
        <Kpi
          label="Receita da loja"
          value={formatKz(store.data?.revenue.total ?? 0)}
          hint={
            store.data
              ? `${store.data.orders.paid} encomendas pagas · média ${formatKz(store.data.orders.averageValue)}`
              : "Vendas de produtos (30 d)"
          }
          failed={store.failed}
        />
        <Kpi
          label="Taxa de pagamento"
          value={`${conversions.data?.paymentRate.current ?? 0}%`}
          hint={
            conversions.data
              ? `Reservas com pagamento (${conversions.data.days} d) · ${pct(conversions.data.paymentRate.deltaPct)}`
              : "Indisponível"
          }
          failed={conversions.failed}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-xl leading-none">Estado dos pagamentos</CardTitle>
                <p className="text-muted-foreground text-sm">
                  {payments === null
                    ? "API de pagamentos indisponível."
                    : `${rows.length} transações · ${formatKz(allTotal)}`}
                </p>
              </div>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/finance/transacoes">
                    Ver transações <ArrowRight />
                  </Link>
                </Button>
              </CardAction>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {payments === null ? (
              <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                Não foi possível consultar <code className="font-mono">GET /payments</code>.
              </p>
            ) : statuses.length ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Transações</TableHead>
                      <TableHead className="text-right">Valor total</TableHead>
                      <TableHead className="text-right">% do volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statuses.map((status) => {
                      const summary = sumBy(rows, status);
                      const share = allTotal > 0 ? Math.round((summary.total / allTotal) * 100) : 0;
                      return (
                        <TableRow key={status}>
                          <TableCell>
                            <Badge variant="outline" className={statusTone(status)}>
                              {paymentStatusLabel(status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{summary.count}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatKz(summary.total)}</TableCell>
                          <TableCell className="text-right tabular-nums">{share}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
                Sem pagamentos registados.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-none">Notas desta visão</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Alert>
              <Info />
              <AlertTitle>Fontes de dados</AlertTitle>
              <AlertDescription>
                Receitas vêm de <code className="font-mono">/metrics/overview</code>, volume e taxa de pagamento de{" "}
                <code className="font-mono">/analytics/conversions/overview</code> e valores pendentes/reembolsos de{" "}
                <code className="font-mono">/payments</code>.
              </AlertDescription>
            </Alert>
            <Alert>
              <Info />
              <AlertTitle>Comissões por concluir</AlertTitle>
              <AlertDescription>
                Sem endpoint de leitura das comissões não é possível apresentar valores cobrados pela plataforma sem
                inventar dados.
              </AlertDescription>
            </Alert>
            <Alert>
              <Info />
              <AlertTitle>Reservas pendentes</AlertTitle>
              <AlertDescription>
                {pendingBookings === null
                  ? "Contagem de reservas pendentes indisponível."
                  : `${pendingBookings} reserva(s) pendente(s) de confirmação nos últimos 30 dias.`}
              </AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/finance/reembolsos">Reembolsos</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/finance/reconciliacao">Reconciliação</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/finance/relatorios">Relatórios</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
