import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RETENTION_ROWS = [
  { period: "D1 — dia seguinte", note: "Voltaram a entrar no dia seguinte" },
  { period: "D7 — após 7 dias", note: "Voltaram a entrar na semana seguinte" },
  { period: "D30 — após 30 dias", note: "Voltaram a entrar no mês seguinte" },
];

/** Retenção D1/D7/D30 — exige tracking de eventos de retorno. */
export function EngagementRetention() {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Retenção de utilizadores</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardDescription className="px-6">Percentagem que regressa após a primeira utilização.</CardDescription>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 font-normal">Período de retorno</TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">Retenção</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {RETENTION_ROWS.map((row) => (
              <TableRow className="hover:bg-transparent" key={row.period}>
                <TableCell className="py-3">
                  <div className="font-medium">{row.period}</div>
                  <div className="text-muted-foreground text-xs font-normal">{row.note}</div>
                </TableCell>
                <TableCell className="py-3 text-right text-muted-foreground tabular-nums">—</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="px-4 pt-3 text-muted-foreground text-xs">
          Disponível assim que o tracking de eventos de retorno (<code className="font-mono">user_returned</code>) for
          implementado na API.
        </p>
      </CardContent>
    </Card>
  );
}
