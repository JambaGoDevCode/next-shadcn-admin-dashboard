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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InventoryRow, StockMovementType } from "@/lib/api/types";
import { formatKz } from "@/lib/format";
import { adjustStockAction } from "@/server/actions/store";

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: InventoryRow | null;
  /** Chamado após um ajuste bem-sucedido (fecha e recarrega a página). */
  onSaved: () => void;
}

const TYPE_OPTIONS: Array<{ value: StockMovementType; label: string; hint: string }> = [
  { value: "IN", label: "Entrada", hint: "reposição de unidades" },
  { value: "OUT", label: "Saída", hint: "unidades retiradas do stock" },
  { value: "ADJUST", label: "Contagem", hint: "define o novo total físico" },
  { value: "RETURN", label: "Devolução", hint: "unidades devolvidas e aceites no stock" },
  { value: "LOSS", label: "Perda", hint: "unidades perdidas ou danificadas" },
];

/**
 * Diálogo de stock por variante. Todos os movimentos manuais exigem
 * motivo e ficam registados no histórico de auditoria.
 */
export function StockAdjustDialog({ open, onOpenChange, row, onSaved }: StockAdjustDialogProps) {
  const [saving, setSaving] = React.useState(false);
  const [type, setType] = React.useState<StockMovementType>("IN");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [minStock, setMinStock] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    setSaving(false);
    setType("IN");
    setQuantity("");
    setReason("");
    setMinStock(row ? String(row.minStock) : "");
  }, [open, row]);

  const parsedQuantity = Number(quantity);
  const hasQuantity = quantity.trim() !== "";
  const minQuantity = type === "ADJUST" ? 0 : 1;
  const preview =
    row && hasQuantity && Number.isInteger(parsedQuantity) && parsedQuantity >= minQuantity
      ? type === "IN" || type === "RETURN"
        ? row.quantity + parsedQuantity
        : type === "OUT" || type === "LOSS"
          ? row.quantity - parsedQuantity
          : parsedQuantity
      : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!row || saving) return;

    if (!hasQuantity || !Number.isInteger(parsedQuantity) || parsedQuantity < minQuantity) {
      toast.error(
        type === "ADJUST"
          ? "Informe um total físico inteiro não negativo."
          : "Informe uma quantidade inteira maior que 0.",
      );
      return;
    }

    if (!reason.trim()) {
      toast.error("Indique o motivo do movimento de stock.");
      return;
    }

    if ((type === "OUT" || type === "LOSS") && parsedQuantity > row.available) {
      toast.error(`Stock disponível insuficiente: ${row.available} unidades.`);
      return;
    }

    if (type === "ADJUST" && parsedQuantity < row.reserved) {
      toast.error(`O novo total não pode ser inferior às ${row.reserved} unidades reservadas.`);
      return;
    }

    const parsedMinStock = Number(minStock);
    if (minStock.trim() !== "" && (!Number.isInteger(parsedMinStock) || parsedMinStock < 0)) {
      toast.error("O stock mínimo deve ser um inteiro não negativo.");
      return;
    }

    setSaving(true);

    const result = await adjustStockAction(row.variantId, {
      type,
      quantity: parsedQuantity,
      reason: reason.trim(),
      minStock: minStock.trim() === "" ? row.minStock : parsedMinStock,
    });

    setSaving(false);

    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Resposta inválida do servidor." : result.error);
      return;
    }

    toast.success(`Movimento registado — stock agora em ${result.data.quantity} unidades.`);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar stock</DialogTitle>
          <DialogDescription>
            {row ? `${row.productName} — ${row.sku}` : "Selecione uma variante no inventário."}
          </DialogDescription>
        </DialogHeader>

        {row ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-center">
              <div>
                <p className="text-muted-foreground text-xs">Físico</p>
                <p className="font-medium text-lg tabular-nums leading-tight">{row.quantity}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Reservado</p>
                <p className="font-medium text-lg tabular-nums leading-tight">{row.reserved}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Preço</p>
                <p className="font-medium text-lg tabular-nums leading-tight">{formatKz(row.price)}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="adjust-type">Tipo de movimento</Label>
                <Select value={type} onValueChange={(value) => setType(value as StockMovementType)}>
                  <SelectTrigger id="adjust-type" className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  {TYPE_OPTIONS.find((option) => option.value === type)?.hint}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="adjust-quantity">{type === "ADJUST" ? "Novo total físico" : "Quantidade"}</Label>
                <Input
                  id="adjust-quantity"
                  type="number"
                  min={type === "ADJUST" ? 0 : 1}
                  step={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder={type === "ADJUST" ? String(row.quantity) : "1"}
                  required
                />
                <p className="text-muted-foreground text-xs tabular-nums">
                  {preview !== null ? `Novo stock: ${preview} unidades` : `Disponível: ${row.available}`}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="adjust-reason">Motivo (obrigatório)</Label>
                <Input
                  id="adjust-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Reposição, devolução, perda, contagem..."
                  maxLength={200}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="adjust-min-stock">Stock mínimo (alerta)</Label>
                <Input
                  id="adjust-min-stock"
                  type="number"
                  min={0}
                  step={1}
                  value={minStock}
                  onChange={(event) => setMinStock(event.target.value)}
                  placeholder={String(row.minStock)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Registar movimento
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
