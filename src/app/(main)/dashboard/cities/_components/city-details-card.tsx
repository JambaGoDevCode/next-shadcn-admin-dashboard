"use client";

import { useState, useTransition } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import type { City } from "@/lib/api/types";
import { deleteCityAction, updateCityAction } from "@/server/actions/management";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

interface CityDetailsCardProps {
  city: City;
  onChanged: (city: City) => void;
  /** Chamado após a exclusão — a lista remove a linha e move a seleção. */
  onDeleted: (cityId: number) => void;
}

export function CityDetailsCard({ city, onChanged, onDeleted }: CityDetailsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(city.name);
  const [state, setState] = useState(city.state ?? "");
  const [country, setCountry] = useState(city.country ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (name.trim().length < 2) {
      setNameError("Informe o nome da cidade.");
      return;
    }
    setNameError(null);
    startTransition(async () => {
      const result = await updateCityAction(city.id, {
        name: name.trim(),
        state: state.trim(),
        country: country.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Cidade atualizada.");
      onChanged(result.data);
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCityAction(city.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Cidade eliminada.");
      onDeleted(city.id);
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nome</p>
          <p className="font-medium text-sm">{city.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Província</p>
          <p className="font-medium text-sm">{city.state ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">País</p>
          <p className="font-medium text-sm">{city.country ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Criado em</p>
          <p className="font-medium text-sm">{formatDate(city.createdAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Atualizado em</p>
          <p className="font-medium text-sm">{formatDate(city.updatedAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">ID</p>
          <p className="font-medium text-sm tabular-nums">{city.id}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil /> Editar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Trash2 /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar cidade {city.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                A API faz um soft delete: a cidade deixa de aparecer nas listagens e nos seletores de novos registos.
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
            <DialogTitle>Editar cidade</DialogTitle>
            <DialogDescription>Alterações aplicadas via PUT /cities na API.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="edit-city-name">Nome</FieldLabel>
              <Input
                id="edit-city-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <FieldError errors={[{ message: nameError }]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-city-state">Província</FieldLabel>
              <Input id="edit-city-state" value={state} onChange={(event) => setState(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-city-country">País</FieldLabel>
              <Input id="edit-city-country" value={country} onChange={(event) => setCountry(event.target.value)} />
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
