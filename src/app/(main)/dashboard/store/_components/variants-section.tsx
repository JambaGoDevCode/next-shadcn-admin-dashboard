"use client";

import * as React from "react";

import { Pencil, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StoreProduct } from "@/lib/api/types";
import { formatKz, plural } from "@/lib/format";

interface VariantsSectionProps {
  products: StoreProduct[];
  onEdit: (product: StoreProduct) => void;
}

export function VariantsSection({ products, onEdit }: VariantsSectionProps) {
  const [search, setSearch] = React.useState("");
  const rows = products.flatMap((product) =>
    product.variants
      .filter((variant) => {
        const term = search.trim().toLowerCase();
        return (
          !term ||
          product.name.toLowerCase().includes(term) ||
          variant.sku.toLowerCase().includes(term) ||
          variant.size?.toLowerCase().includes(term) ||
          variant.color?.toLowerCase().includes(term)
        );
      })
      .map((variant) => ({ product, variant })),
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Variantes vendáveis</CardTitle>
          <CardDescription>Tamanhos, cores, modelos, SKU, preço e estado de cada variante.</CardDescription>
        </div>
        <CardAction>
          <Badge variant="secondary">
            {rows.length} {plural(rows.length, "variante", "variantes")}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <InputGroup className="h-9 w-full sm:w-80">
          <InputGroupAddon align="inline-start">
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Procurar produto, SKU, tamanho ou cor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Procurar variantes"
          />
        </InputGroup>

        {rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Pencil />
              </EmptyMedia>
              <EmptyTitle>Nenhuma variante encontrada</EmptyTitle>
              <EmptyDescription>
                {products.some((product) => product.variants.length > 0)
                  ? "Ajuste a pesquisa para ver outras variantes."
                  : "Edite um produto para criar as suas variantes vendáveis."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Variante</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ product, variant }) => (
                <TableRow key={variant.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {[variant.size, variant.color].filter(Boolean).join(" · ") || "Modelo padrão"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatKz(variant.price ?? product.price)}</TableCell>
                  <TableCell className="text-right tabular-nums">{variant.available}</TableCell>
                  <TableCell>
                    <Badge variant={variant.isActive ? "secondary" : "outline"}>
                      {variant.isActive ? "Ativa" : "Desativada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Editar variante ${variant.sku}`}
                      title="Editar variante"
                      onClick={() => onEdit(product)}
                    >
                      <Pencil data-icon="inline-start" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
