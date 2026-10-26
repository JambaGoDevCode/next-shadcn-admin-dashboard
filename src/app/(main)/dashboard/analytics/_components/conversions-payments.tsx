import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionsOverview } from "@/lib/api/types";
import { paymentStatusLabel } from "@/lib/format";

import { HBarChart } from "./hbar-chart";

interface ConversionsPaymentsProps {
  data: ConversionsOverview | null;
  failed: boolean;
}

/** Operações financeiras do período agrupadas por estado. */
export function ConversionsPayments({ data, failed }: ConversionsPaymentsProps) {
  const chartData = (data?.payments.byStatus ?? []).map((state) => ({
    label: paymentStatusLabel(state.status),
    value: state.count,
    display: `${state.count}`,
  }));

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Pagamentos por estado</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardDescription className="px-6">Operações financeiras criadas no período selecionado.</CardDescription>

      <CardContent>
        {failed && !data ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">
              Não foi possível carregar os pagamentos.
            </p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : (
          <HBarChart data={chartData} emptyText="Sem pagamentos no período selecionado." />
        )}
      </CardContent>
    </Card>
  );
}
