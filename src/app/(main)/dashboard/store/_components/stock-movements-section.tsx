"use client";

import { PackagePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockMovement } from "@/lib/api/types";
import { formatDateTime, plural, stockMovementDelta, stockMovementLabel, stockMovementTone } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StockMovementsSection({ movements }: { movements: StockMovement[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Histórico de movimentos</CardTitle>
          <CardDescription>
            Entradas, saídas, contagens, devoluções e perdas, com motivo, data e saldo resultante.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="secondary">
            {movements.length} {plural(movements.length, "movimento", "movimentos")}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackagePlus />
              </EmptyMedia>
              <EmptyTitle>Sem movimentos registados</EmptyTitle>
              <EmptyDescription>
                Os movimentos efetuados no inventário ficam registados neste histórico.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Δ Unidades</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => {
                const delta = stockMovementDelta(movement.type, movement.quantity);
                return (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                      {formatDateTime(movement.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{movement.productName}</TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">{movement.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={stockMovementTone(movement.type)}>
                        {stockMovementLabel(movement.type)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        delta >= 0 ? "text-primary" : "text-destructive",
                      )}
                    >
                      {delta >= 0 ? `+${delta}` : delta}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{movement.resultQuantity}</TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground text-xs">
                      {movement.reason ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
