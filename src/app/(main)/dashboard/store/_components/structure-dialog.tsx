"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StoreCatalogItem } from "@/lib/api/types";
import {
  createBrandAction,
  createCategoryAction,
  updateBrandAction,
  updateCategoryAction,
} from "@/server/actions/store";

interface StructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "category" | "brand";
  /** `null` abre em modo criação; com item abre em modo edição. */
  item: StoreCatalogItem | null;
  onSaved: () => void;
}

/**
 * Diálogo de criação/edição de categorias e marcas do catálogo —
 * o mesmo formulário, com as actions adequadas ao `kind`.
 */
export function StructureDialog({ open, onOpenChange, kind, item, onSaved }: StructureDialogProps) {
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");

  const isCategory = kind === "category";
  const kindLabel = isCategory ? "categoria" : "marca";

  React.useEffect(() => {
    if (!open) return;

    setSaving(false);
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
  }, [open, item]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error(`O nome da ${kindLabel} precisa de pelo menos 2 caracteres.`);
      return;
    }

    setSaving(true);

    const payload = { name: trimmedName, description: description.trim() || null };

    const result =
      item === null
        ? isCategory
          ? await createCategoryAction(payload)
          : await createBrandAction(payload)
        : isCategory
          ? await updateCategoryAction(item.id, payload)
          : await updateBrandAction(item.id, payload);

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${isCategory ? "Categoria" : "Marca"} ${item === null ? "criada" : "atualizada"}.`);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item === null ? `Nova ${kindLabel}` : `Editar ${kindLabel}`}</DialogTitle>
          <DialogDescription>
            {isCategory
              ? "Família de produtos usada para organizar o catálogo."
              : "Fabricante ou marca comercial associada aos produtos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="structure-name">Nome</Label>
            <Input
              id="structure-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={isCategory ? "Ex.: Chuteiras" : "Ex.: Nike"}
              maxLength={80}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="structure-description">Descrição (opcional)</Label>
            <Textarea
              id="structure-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={isCategory ? "Calçado para relvado e futsal" : "Marca esportiva global"}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {item === null ? `Criar ${kindLabel}` : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
