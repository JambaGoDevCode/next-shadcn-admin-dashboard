import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AcquisitionFunnel } from "@/lib/api/types";
import { profileTypeLabel } from "@/lib/format";

import { HBarChart } from "./hbar-chart";

interface AcquisitionSegmentsProps {
  data: AcquisitionFunnel | null;
  days: number;
  failed: boolean;
}

/** Papéis escolhidos pela coorte de contas criadas no período. */
export function AcquisitionSegments({ data, days, failed }: AcquisitionSegmentsProps) {
  const chartData = (data?.bySegment ?? []).map((segment) => ({
    label: profileTypeLabel(segment.type),
    value: segment.count,
  }));

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Segmentos dos novos registos</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardDescription className="px-6">Papel escolhido pelas contas criadas nos últimos {days} dias.</CardDescription>

      <CardContent>
        {failed ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">
              Não foi possível carregar os segmentos.
            </p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : (
          <HBarChart data={chartData} emptyText="Nenhuma conta criada no período." />
        )}
      </CardContent>
    </Card>
  );
}
