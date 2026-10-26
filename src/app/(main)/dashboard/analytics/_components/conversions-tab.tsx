import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionsOverview } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

import { ConversionsPayments } from "./conversions-payments";
import { ConversionsRevenue } from "./conversions-revenue";
import { FunnelChart, type FunnelStep } from "./funnel-chart";
import { type MetricItem, MetricStrip } from "./metric-strip";

interface ConversionsTabProps {
  data: ConversionsOverview | null;
  days: number;
  failed: boolean;
}

const FUNNEL_LABELS: Record<string, string> = {
  confirmed: "Pagamentos confirmados",
  created: "Reservas e inscrições criadas",
  started: "Pagamentos iniciados",
};

/** Conversões: ações de valor concluídas e impacto financeiro. */
export function ConversionsTab({ data, days, failed }: ConversionsTabProps) {
  const value = (display: number | string) => (failed && !data ? "—" : display);

  const items: MetricItem[] = [
    {
      title: "Reservas concluídas",
      value: String(value(data?.bookings.completed ?? 0)),
      deltaPct: data?.bookings.deltaCompleted ?? null,
      footer: (
        <>
          <span>
            de <span className="text-foreground">{value(data?.bookings.created ?? 0)}</span> criadas no período
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Pagamentos confirmados",
      value: String(value(data?.payments.paid ?? 0)),
      deltaPct: data?.payments.deltaPaid ?? null,
      footer: (
        <>
          <span>
            de <span className="text-foreground">{value(data?.payments.created ?? 0)}</span> iniciados no período
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Volume transaccionado",
      value: failed && !data ? "—" : formatKz(data?.volume.current ?? 0),
      deltaPct: data?.volume.deltaPct ?? null,
      footer: (
        <>
          <span>
            em <span className="text-foreground">pagamentos pagos</span>
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Taxa de pagamento",
      value: failed && !data ? "—" : `${data?.paymentRate.current.toFixed(1).replace(".", ",") ?? "0,0"}%`,
      deltaPct: data?.paymentRate.deltaPct ?? null,
      deltaSuffix: " p.p.",
      footer: (
        <>
          <span>
            <span className="text-foreground">{value(data?.payments.paid ?? 0)}</span> de{" "}
            {value(data?.payments.created ?? 0)} pagamentos
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
  ];

  const funnelSteps: FunnelStep[] = data
    ? data.funnel
        .filter((step) => step.key !== "actionUsers")
        .map((step) => ({ ...step, label: FUNNEL_LABELS[step.key] ?? step.key }))
    : [];

  const actionUsers = data?.funnel.find((step) => step.key === "actionUsers")?.count ?? 0;
  const actionNote =
    actionUsers === 0
      ? "Nenhum utilizador realizou uma ação no período."
      : `${actionUsers} ${actionUsers === 1 ? "utilizador realizou" : "utilizadores realizaram"} uma ação no período.`;

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip items={items} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="h-full gap-2">
            <CardHeader>
              <CardTitle className="font-normal">Funil de conversão</CardTitle>
              <CardAction>
                <Ellipsis className="size-4" />
              </CardAction>
            </CardHeader>
            <CardDescription className="px-6">
              Da criação da ação ao pagamento confirmado, nos últimos {days} dias.
            </CardDescription>

            <CardContent>
              {failed && !data ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                  <p className="font-medium text-red-700 text-sm dark:text-red-300">
                    Não foi possível carregar o funil.
                  </p>
                  <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
                </div>
              ) : (
                <FunnelChart steps={funnelSteps} emptyText="Sem conversões no período." note={actionNote} />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <ConversionsPayments data={data} failed={failed} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-12">
          <ConversionsRevenue points={data?.revenuePoints ?? []} days={days} failed={failed} />
        </div>
      </div>
    </div>
  );
}
