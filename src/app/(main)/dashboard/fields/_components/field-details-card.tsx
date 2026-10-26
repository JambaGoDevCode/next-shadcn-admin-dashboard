"use client";

import { useState, useTransition } from "react";

import { Loader2, Pencil, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { City, Field as FieldEntity } from "@/lib/api/types";
import { createCityLabeler, formatDateTime, formatKz } from "@/lib/format";
import { deleteFieldAction, updateFieldAction } from "@/server/actions/management";

interface FieldDetailsCardProps {
  field: FieldEntity;
  /** Cidades ativas — usadas para rotular a cidade do campo. */
  cities: City[];
  onChanged: (field: FieldEntity) => void;
  /** Chamado após a exclusão — a lista remove a linha e move a seleção. */
  onDeleted: (fieldId: number) => void;
}

export function FieldDetailsCard({ field, cities, onChanged, onDeleted }: FieldDetailsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(field.name);
  const [address, setAddress] = useState(field.address ?? "");
  const [price, setPrice] = useState(field.pricePerHour ?? 0);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cityLabel = createCityLabeler(cities);

  function handleSave() {
    if (name.trim().length < 3) {
      setNameError("O nome deve ter pelo menos 3 caracteres.");
      return;
    }
    setNameError(null);
    startTransition(async () => {
      const trimmedAddress = address.trim();
      const result = await updateFieldAction(field.id, {
        name: name.trim(),
        address: trimmedAddress === "" ? undefined : trimmedAddress,
        pricePerHour: price,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Campo atualizado.");
      onChanged(result.data);
      setEditOpen(false);
    });
  }

  function handleToggleAvailability() {
    startTransition(async () => {
      const result = await updateFieldAction(field.id, { isAvailable: !field.isAvailable });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.data.isAvailable ? "Campo marcado como disponível." : "Campo marcado como indisponível.");
      onChanged(result.data);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteFieldAction(field.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Campo eliminado.");
      onDeleted(field.id);
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nome</p>
          <p className="font-medium text-sm">{field.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Morada</p>
          <p className="font-medium text-sm">{field.address ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Cidade</p>
          <p className="font-medium text-sm">{cityLabel(field.cityId)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Preço por hora</p>
          <p className="font-medium text-sm tabular-nums">{formatKz(field.pricePerHour ?? 0)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Disponibilidade</p>
          <Badge variant={field.isAvailable ? "default" : "secondary"}>
            {field.isAvailable ? "Disponível" : "Indisponível"}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Criado em</p>
          <p className="font-medium text-sm">{formatDateTime(field.createdAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Atualizado em</p>
          <p className="font-medium text-sm">{formatDateTime(field.updatedAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">ID</p>
          <p className="font-medium text-sm tabular-nums">{field.id}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil /> Editar
        </Button>
        <Button disabled={isPending} size="sm" variant="outline" onClick={handleToggleAvailability}>
          {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          {field.isAvailable ? "Marcar indisponível" : "Marcar disponível"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Trash2 /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar campo {field.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                A API faz um soft delete: o campo deixa de aparecer nas listagens e passa a estar indisponível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={isPending} onClick={handleDelete}>
                {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar campo</DialogTitle>
            <DialogDescription>Alterações aplicadas via PUT /fields na API.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="edit-field-name">Nome</FieldLabel>
              <Input
                id="edit-field-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <FieldError errors={[{ message: nameError }]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-field-address">Morada</FieldLabel>
              <Input id="edit-field-address" value={address} onChange={(event) => setAddress(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-field-price">Preço por hora (Kz)</FieldLabel>
              <Input
                id="edit-field-price"
                type="number"
                min={0}
                step={100}
                value={price}
                onChange={(event) => setPrice(event.target.value === "" ? 0 : Number(event.target.value))}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSave}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
