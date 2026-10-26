import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsFeatures, FeatureMetric } from "@/lib/api/types";

const FEATURE_LABELS: Record<string, string> = {
  bookings: "Reservas",
  matches: "Partidas",
  matchmaking: "Matchmaking",
  registrations: "Inscrições",
  tournaments: "Torneios",
  payments: "Pagamentos",
};

function formatDelta(deltaPct: number | null): { text: string; className: string } {
  if (deltaPct === null || deltaPct === 0) {
    return { text: "—", className: "text-muted-foreground" };
  }

  const up = deltaPct > 0;
  const text = `${up ? "+" : ""}${deltaPct.toFixed(1).replace(".", ",")}%`;

  return {
    text,
    className: up ? "text-green-700 dark:text-green-400" : "text-destructive",
  };
}

function FeatureRow({ feature, days }: { feature: FeatureMetric; days: number }) {
  const delta = formatDelta(feature.deltaPct);

  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="max-w-0 truncate py-4 font-medium">{FEATURE_LABELS[feature.key] ?? feature.key}</TableCell>
      <TableCell className="text-right tabular-nums" title={`Últimos ${days} dias`}>
        {feature.current}
      </TableCell>
      <TableCell className="text-right text-muted-foreground tabular-nums">{feature.total}</TableCell>
      <TableCell className={`text-right tabular-nums ${delta.className}`}>{delta.text}</TableCell>
    </TableRow>
  );
}

interface TopPagesProps {
  data: AnalyticsFeatures | null;
  days: number;
  failed: boolean;
}

export function TopPages({ data, days, failed }: TopPagesProps) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Desempenho das funcionalidades</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8" />
              <TableHead className="h-8 w-24 text-right font-normal" title={`Ações nos últimos ${days} dias`}>
                {days} dias
              </TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">Total</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">Variação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {failed && !data ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                  Não foi possível carregar os dados. Verifique se a API está em execução.
                </TableCell>
              </TableRow>
            ) : data && data.features.length > 0 ? (
              data.features.map((feature) => <FeatureRow feature={feature} days={days} key={feature.key} />)
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                  Sem dados no período selecionado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
