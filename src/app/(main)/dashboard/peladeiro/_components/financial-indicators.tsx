import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionsOverview, MetricsOverview, StoreOverview } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

import type { ResourceState } from "./load-resource";

export interface FinancialIndicatorsProps {
  metrics: ResourceState<MetricsOverview>;
  conversions: ResourceState<ConversionsOverview>;
  store: ResourceState<StoreOverview>;
}

function pct(value: number | null): string {
  if (value === null) return "n/d";
  return `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;
}

interface IndicatorCardProps {
  label: string;
  value: string;
  hint?: string;
  failed?: boolean;
}

function IndicatorCard({ label, value, hint, failed = false }: IndicatorCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-muted-foreground text-sm">{label}</CardTitle>
        {failed && <span className="text-destructive text-xs">offline</span>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl leading-none tracking-tight tabular-nums">{failed ? "—" : value}</div>
        {hint && !failed && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function FinancialIndicators({ metrics, conversions, store }: FinancialIndicatorsProps) {
  const pendingPayments = conversions.data
    ? Math.max(conversions.data.payments.created - conversions.data.payments.paid, 0)
    : 0;
  const refunds = conversions.data
    ? conversions.data.payments.byStatus
        .filter((row) => row.status.toLowerCase().includes("refund"))
        .reduce((sum, row) => sum + row.count, 0)
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <IndicatorCard
        label="Volume transacionado"
        value={formatKz(conversions.data?.volume.current ?? 0)}
        hint={`Pagamentos nos últimos 30 dias · ${pct(conversions.data?.volume.deltaPct ?? null)}`}
        failed={conversions.failed}
      />
      <IndicatorCard
        label="Receitas"
        value={formatKz(metrics.data?.revenue.current ?? 0)}
        hint="Receita total registada (30 d)"
        failed={metrics.failed}
      />
      <IndicatorCard
        label="Receitas da loja"
        value={formatKz(store.data?.revenue.total ?? 0)}
        hint="Vendas de produtos (30 d)"
        failed={store.failed}
      />
      <IndicatorCard
        label="Comissões"
        value="—"
        hint="Ainda sem endpoint de comissões na API."
      />
      <IndicatorCard
        label="Pagamentos pendentes"
        value={String(pendingPayments)}
        hint={conversions.data ? `${conversions.data.payments.created} criados · ${conversions.data.payments.paid} pagos (30 d)` : undefined}
        failed={conversions.failed}
      />
      <IndicatorCard
        label="Reembolsos"
        value={String(refunds)}
        hint="Pagamentos reembolsados (30 d)"
        failed={conversions.failed}
      />
    </div>
  );
}
