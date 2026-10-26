"use client";

import * as React from "react";

import { Download, Package, Pencil, Plus, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StoreCatalogItem, StoreProduct } from "@/lib/api/types";
import { formatKz, plural, productStatusLabel, productStatusTone } from "@/lib/format";

interface ProductsSectionProps {
  products: StoreProduct[];
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
  onNew: () => void;
  onEdit: (product: StoreProduct) => void;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os estados" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "ARCHIVED", label: "Arquivado" },
];

/**
 * Lista de produtos do catÃ¡logo (tabela em card) com pesquisa por
 * nome, filtro de categoria/estado e aÃ§Ãµes de ediÃ§Ã£o e exportaÃ§Ã£o.
 */
export function ProductsSection({ products, categories, brands, onNew, onEdit }: ProductsSectionProps) {
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  const rows = products
    .filter((product) => {
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryId !== "all" && product.categoryId !== Number(categoryId)) return false;
      if (status !== "all" && product.status !== status) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  function exportCsv() {
    const header = ["Produto", "Categoria", "Marca", "PreÃ§o base", "Variantes", "Stock", "Estado"];
    const lines = rows.map((product) =>
      [
        product.name,
        product.categoryName ?? "",
        product.brandName ?? "",
        String(product.price),
        String(product.variantCount),
        String(product.stockUnits),
        productStatusLabel(product.status),
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(";"),
    );
    const csv = [header.join(";"), ...lines].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "produtos-peladeiro.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>
            CatÃ¡logo comercial â€” preÃ§o base, variantes por tamanho/cor e stock agregado.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="secondary">
            {products.length} {plural(products.length, "produto", "produtos")}
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
              placeholder="Procurar produto..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Procurar produto"
            />
          </InputGroup>

          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filtrar por categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={exportCsv}
            disabled={rows.length === 0}
            title="Exportar lista filtrada em CSV"
          >
            <Download className="size-3.5" />
            Exportar CSV
          </Button>

          <Button size="sm" className="h-9 sm:ml-auto" onClick={onNew}>
            <Plus className="size-3.5" />
            Novo produto
          </Button>
        </div>

        {rows.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Package />
              </EmptyMedia>
              <EmptyTitle>Nenhum produto encontrado</EmptyTitle>
              <EmptyDescription>
                {products.length === 0
                  ? "Comece por criar o primeiro produto do catÃ¡logo."
                  : "Ajuste a pesquisa ou os filtros para ver resultados."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {products.length === 0 ? (
                <Button size="sm" onClick={onNew}>
                  Novo produto
                </Button>
              ) : null}
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">PreÃ§o base</TableHead>
                <TableHead className="text-right">Variantes</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12 text-right">AÃ§Ãµes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-muted-foreground text-xs">{product.brandName ?? "Sem marca"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.categoryName ?? "â€”"}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatKz(product.price)}</TableCell>
                  <TableCell className="text-right tabular-nums">{product.variantCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{product.stockUnits}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={productStatusTone(product.status)}>
                      {productStatusLabel(product.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={`Editar ${product.name}`}
                      title="Editar produto"
                      onClick={() => onEdit(product)}
                    >
                      <Pencil className="size-3.5" />
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
