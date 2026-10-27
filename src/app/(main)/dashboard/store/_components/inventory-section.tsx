"use client";

import * as React from "react";

import { Boxes, PackagePlus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InventoryRow, StockMovement } from "@/lib/api/types";
import {
  formatDateTime,
  formatKz,
  plural,
  stockMovementDelta,
  stockMovementLabel,
  stockMovementTone,
  stockStateLabel,
  stockStateTone,
} from "@/lib/format";

interface InventorySectionProps {
  inventory: InventoryRow[];
  movements: StockMovement[];
  showMovements?: boolean;
  onAdjust: (row: InventoryRow) => void;
}

/**
 * Inventário por variante (pesquisa e alertas de stock) seguido do
 * histórico de movimentos de auditoria.
 */
export function InventorySection({ inventory, movements, showMovements = true, onAdjust }: InventorySectionProps) {
  const [search, setSearch] = React.useState("");
  const [alertsOnly, setAlertsOnly] = React.useState(false);

  const rows = inventory
    .filter((row) => {
      if (search) {
        const term = search.toLowerCase();
        if (!row.productName.toLowerCase().includes(term) && !row.sku.toLowerCase().includes(term)) {
          return false;
        }
      }
      if (alertsOnly && !row.lowStock) return false;
      return true;
    })
    .sort(
      (a, b) =>
        Number(b.outOfStock) - Number(a.outOfStock) ||
        Number(b.lowStock) - Number(a.lowStock) ||
        a.productName.localeCompare(b.productName) ||
        a.sku.localeCompare(b.sku),
    );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Inventário</CardTitle>
            <CardDescription>
              Stock disponível por variante (tamanho, cor e SKU) com alertas de reposição.
            </CardDescription>
          </div>
          <CardAction>
            <Badge variant="secondary">
              {inventory.length} {plural(inventory.length, "variante", "variantes")}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <InputGroup className="h-9 w-full sm:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Procurar por produto ou SKU..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Procurar no inventário"
              />
            </InputGroup>

            <Button
              variant={alertsOnly ? "default" : "outline"}
              size="sm"
              className="h-9"
              aria-pressed={alertsOnly}
              onClick={() => setAlertsOnly((current) => !current)}
            >
              <Boxes className="size-3.5" />
              Somente alertas
            </Button>
          </div>

          {rows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Boxes />
                </EmptyMedia>
                <EmptyTitle>Nenhuma variante encontrada</EmptyTitle>
                <EmptyDescription>
                  {inventory.length === 0
                    ? "Adicione variantes aos produtos para gerir o stock."
                    : "Ajuste a pesquisa ou desative o filtro de alertas."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Disponível</TableHead>
                  <TableHead className="text-right">Reservado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-16 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.variantId}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{row.productName}</span>
                        <span className="text-muted-foreground text-xs">
                          {[row.size, row.color].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">{row.sku}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatKz(row.price)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{row.available}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">{row.reserved}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={stockStateTone(row)}>
                        {stockStateLabel(row)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        aria-label={`Ajustar stock de ${row.sku}`}
                        onClick={() => onAdjust(row)}
                      >
                        <PackagePlus className="size-3.5" />
                        Ajustar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showMovements ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Movimentos recentes</CardTitle>
              <CardDescription>
                Entradas, saídas, contagens, devoluções e perdas — registo de auditoria por variante.
              </CardDescription>
            </div>
            <CardAction>
              <Badge variant="secondary">{movements.length}</Badge>
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
                    Os movimentos feitos no inventário ficam registados neste histórico.
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
                          className={`text-right font-medium tabular-nums ${
                            delta >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                          }`}
                        >
                          {delta >= 0 ? `+${delta}` : delta}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{movement.resultQuantity}</TableCell>
                        <TableCell className="max-w-40 truncate text-muted-foreground text-xs">
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
      ) : null}
    </div>
  );
}
