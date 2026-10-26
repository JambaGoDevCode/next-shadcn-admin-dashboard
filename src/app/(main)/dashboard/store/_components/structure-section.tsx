"use client";

import * as React from "react";

import { Boxes, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoreCatalogItem } from "@/lib/api/types";
import { plural } from "@/lib/format";
import { deleteBrandAction, deleteCategoryAction } from "@/server/actions/store";

interface StructureSectionProps {
  categories: StoreCatalogItem[];
  brands: StoreCatalogItem[];
  onNew: (kind: StructureKind) => void;
  onEdit: (kind: StructureKind, item: StoreCatalogItem) => void;
  /** Chamado após remoção bem-sucedida (fecha confirmações e recarrega). */
  onChanged: (kind: StructureKind) => void;
}

export type StructureKind = "category" | "brand";

/**
 * Estrutura do catálogo: cartões de categorias e marcas com contagem
 * de produtos, edição e remoção (bloqueada pela API enquanto houver
 * produtos associados — o erro chega por toast).
 */
export function StructureSection({ categories, brands, onNew, onEdit, onChanged }: StructureSectionProps) {
  const [confirm, setConfirm] = React.useState<{ kind: StructureKind; item: StoreCatalogItem } | null>(null);

  async function handleDelete() {
    if (!confirm) return;

    const result =
      confirm.kind === "category"
        ? await deleteCategoryAction(confirm.item.id)
        : await deleteBrandAction(confirm.item.id);

    setConfirm(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(confirm.kind === "category" ? "Categoria removida." : "Marca removida.");
    onChanged(confirm.kind);
  }

  const renderList = (kind: StructureKind, items: StoreCatalogItem[]) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
          {kind === "category" ? (
            <Boxes className="size-7 text-muted-foreground/50" />
          ) : (
            <Tag className="size-7 text-muted-foreground/50" />
          )}
          <p className="text-muted-foreground text-sm">
            {kind === "category"
              ? "Sem categorias — crie a primeira para organizar o catálogo."
              : "Sem marcas — associe os produtos a fabricantes."}
          </p>
        </div>
      );
    }

    return (
      <ul className="divide-y rounded-lg border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">{item.name}</span>
              {item.description ? (
                <span className="text-muted-foreground truncate text-xs">{item.description}</span>
              ) : null}
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {item.productCount} {plural(item.productCount, "produto", "produtos")}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Editar ${item.name}`}
              title="Editar"
              onClick={() => onEdit(kind, item)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              aria-label={`Remover ${item.name}`}
              title="Remover"
              onClick={() => setConfirm({ kind, item })}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Categorias</CardTitle>
              <CardDescription>Famílias de produtos do catálogo (ex.: Chuteiras, Bolas).</CardDescription>
            </div>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => onNew("category")}>
                <Plus className="size-3.5" />
                Nova categoria
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>{renderList("category", categories)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Marcas</CardTitle>
              <CardDescription>Fabricantes associados aos produtos (ex.: Nike, Molten).</CardDescription>
            </div>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => onNew("brand")}>
                <Plus className="size-3.5" />
                Nova marca
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>{renderList("brand", brands)}</CardContent>
        </Card>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover {confirm?.kind === "brand" ? "marca" : "categoria"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm ? (
                <>
                  “{confirm.item.name}” será removida. Se existirem produtos associados, a remoção é bloqueada —
                  reclassifique-os primeiro.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
