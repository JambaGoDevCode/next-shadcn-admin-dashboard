import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsAssets } from "@/lib/api/types";

import { HBarChart } from "./hbar-chart";

interface AudienceGeographyProps {
  data: AnalyticsAssets | null;
  failed: boolean;
}

/** Quadras, equipas e jogadores por cidade — dimensão geográfica da comunidade. */
export function AudienceGeography({ data, failed }: AudienceGeographyProps) {
  const cities = data?.byCity ?? [];
  const grandTotal = cities.reduce((sum, city) => sum + city.total, 0);

  const chartData = cities.map((city) => ({
    label: city.city,
    value: city.total,
    display: grandTotal > 0 ? `${city.total} · ${Math.round((city.total / grandTotal) * 100)}%` : String(city.total),
  }));

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Distribuição geográfica</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardDescription className="px-6">
        Quadras, equipas e jogadores por cidade, de acordo com o registo.
      </CardDescription>

      <CardContent>
        {failed ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar as cidades.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : (
          <HBarChart data={chartData} emptyText="Ainda não há recursos registados por cidade." />
        )}
      </CardContent>
    </Card>
  );
}
