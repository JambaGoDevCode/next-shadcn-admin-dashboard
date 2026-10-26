"use client";

import { useState, useTransition } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { City } from "@/lib/api/types";
import { createCityAction } from "@/server/actions/management";

const formSchema = z.object({
  name: z.string().min(2, { message: "Informe o nome da cidade." }),
  state: z.string().min(1, { message: "Informe a província." }),
  country: z.string().min(1, { message: "Informe o país." }),
});

interface CreateCityDialogProps {
  /** Chamado após a criação — a cidade entra na lista e fica selecionada. */
  onCreated?: (city: City) => void;
}

export function CreateCityDialog({ onCreated }: CreateCityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", state: "", country: "Angola" },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await createCityAction(data);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Cidade ${result.data.name} criada.`);
      form.reset({ name: "", state: "", country: "Angola" });
      setOpen(false);
      onCreated?.(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nova cidade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova cidade</DialogTitle>
          <DialogDescription>Regista uma cidade em POST /cities.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-city-name">Nome</FieldLabel>
                  <Input
                    {...field}
                    id="create-city-name"
                    placeholder="Talatona"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="state"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-city-state">Província</FieldLabel>
                  <Input {...field} id="create-city-state" placeholder="Luanda" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="country"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-city-country">País</FieldLabel>
                  <Input {...field} id="create-city-country" placeholder="Angola" aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {isPending ? "Criando..." : "Criar cidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
