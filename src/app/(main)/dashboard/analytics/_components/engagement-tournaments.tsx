import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsFeatures } from "@/lib/api/types";

interface EngagementTournamentsProps {
  data: AnalyticsFeatures | null;
  days: number;
  failed: boolean;
}

function findFeature(features: AnalyticsFeatures["features"], key: string) {
  return features.find((feature) => feature.key === key);
}

/** Torneios criados e inscrições realizadas no período. */
export function EngagementTournaments({ data, days, failed }: EngagementTournamentsProps) {
  const features = data?.features ?? [];
  const tournaments = findFeature(features, "tournaments");
  const registrations = findFeature(features, "registrations");

  const value = (display: number) => (failed && !data ? "—" : display);

  const rows = [
    {
      label: "Torneios criados",
      period: value(tournaments?.current ?? 0),
      total: tournaments?.total ?? 0,
    },
    {
      label: "Inscrições",
      period: value(registrations?.current ?? 0),
      total: registrations?.total ?? 0,
    },
  ];

  const registrationRate =
    tournaments && tournaments.current > 0
      ? Math.round(((registrations?.current ?? 0) / tournaments.current) * 100)
      : null;

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Torneios e inscrições</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardDescription className="px-6">Competição criada nos últimos {days} dias.</CardDescription>

      <CardContent className="flex flex-col gap-4">
        {rows.map((row) => (
          <div className="flex items-center justify-between gap-4" key={row.label}>
            <div>
              <div className="text-sm">{row.label}</div>
              <div className="text-muted-foreground text-xs">{failed && !data ? "—" : `de ${row.total} no total`}</div>
            </div>
            <div className="text-2xl leading-none tracking-tight tabular-nums">{row.period}</div>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 border-border/60 border-t pt-3">
          <div>
            <div className="text-sm">Inscrições por torneio</div>
            <div className="text-muted-foreground text-xs">média no período</div>
          </div>
          <div className="text-2xl leading-none tracking-tight tabular-nums">
            {registrationRate === null ? "—" : `${registrationRate}%`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
