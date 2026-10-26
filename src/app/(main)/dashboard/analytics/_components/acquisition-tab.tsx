import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AcquisitionFunnel, AudienceGrowth, AudienceOverview } from "@/lib/api/types";

import { AcquisitionSegments } from "./acquisition-segments";
import { FunnelChart, type FunnelStep } from "./funnel-chart";
import { GrowthChart } from "./growth-chart";
import { type MetricItem, MetricStrip } from "./metric-strip";

interface AcquisitionTabProps {
  overview: AudienceOverview | null;
  funnel: AcquisitionFunnel | null;
  growth: AudienceGrowth | null;
  days: number;
  failed: {
    overview: boolean;
    funnel: boolean;
    growth: boolean;
  };
}

const STEP_LABELS: Record<string, string> = {
  booking: "Primeira reserva",
  created: "Contas criadas",
  profile: "Perfil concluído",
  role: "Papel atribuído",
};

/** Aquisição: de onde vêm os registos e quanto avança no funil. */
export function AcquisitionTab({ overview, funnel, growth, days, failed }: AcquisitionTabProps) {
  const stepCount = (key: string) => funnel?.steps.find((step) => step.key === key)?.count ?? 0;

  const value = (display: number | string) => (failed.funnel && !funnel ? "—" : display);
  const pctBadge = (pct: number | undefined) =>
    failed.funnel && !funnel ? undefined : `${(pct ?? 0).toFixed(0)}% dos registos`;

  const items: MetricItem[] = [
    {
      title: "Contas criadas",
      value: String(value(stepCount("created"))),
      deltaPct: overview?.users.deltaPct ?? null,
      footer: (
        <>
          <span>
            <span className="text-foreground">novos utilizadores</span> no período
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Perfil concluído",
      value: String(value(stepCount("profile"))),
      badgeText: pctBadge(funnel?.rates.profilePct),
      footer: (
        <>
          <span>
            com <span className="text-foreground">perfil criado</span>
          </span>
          <span>•</span>
          <span>coorte do período</span>
        </>
      ),
    },
    {
      title: "Papel atribuído",
      value: String(value(stepCount("role"))),
      badgeText: pctBadge(funnel?.rates.rolePct),
      footer: (
        <>
          <span>
            perfil <span className="text-foreground">e papel</span> completos
          </span>
          <span>•</span>
          <span>coorte do período</span>
        </>
      ),
    },
    {
      title: "Primeira reserva",
      value: String(value(stepCount("booking"))),
      badgeText: pctBadge(funnel?.rates.bookingPct),
      footer: (
        <>
          <span>
            concluíram <span className="text-foreground">o funil completo</span>
          </span>
          <span>•</span>
          <span>coorte do período</span>
        </>
      ),
    },
  ];

  const funnelSteps: FunnelStep[] = funnel
    ? funnel.steps.map((step) => ({ ...step, label: STEP_LABELS[step.key] ?? step.key }))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip items={items} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Card className="h-full gap-2">
            <CardHeader>
              <CardTitle className="font-normal">Funil de aquisição</CardTitle>
              <CardAction>
                <Ellipsis className="size-4" />
              </CardAction>
            </CardHeader>
            <CardDescription className="px-6">
              Percurso das contas criadas nos últimos {days} dias, passo a passo.
            </CardDescription>

            <CardContent>
              {failed.funnel && !funnel ? (
                <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
                  <p className="font-medium text-red-700 text-sm dark:text-red-300">
                    Não foi possível carregar o funil.
                  </p>
                  <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
                </div>
              ) : (
                <FunnelChart steps={funnelSteps} emptyText="Nenhuma conta criada no período." />
              )}
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-5">
          <AcquisitionSegments data={funnel} days={days} failed={failed.funnel} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-12">
          <GrowthChart points={growth?.points ?? []} days={days} failed={failed.growth} series="new" />
        </div>
      </div>
    </div>
  );
}
