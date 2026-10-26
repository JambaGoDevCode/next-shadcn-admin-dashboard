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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { City, Field as FieldEntity } from "@/lib/api/types";
import { createFieldAction } from "@/server/actions/management";

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  address: z.string().min(5, "Informe a morada completa."),
  // Guardado como string no formulário (o Select devolve texto) e convertido no submit.
  cityId: z.string().min(1, "Selecione a cidade."),
  pricePerHour: z.coerce.number().min(0, "Preço inválido."),
});

interface CreateFieldDialogProps {
  /** Cidades ativas — opções do seletor de cidade. */
  cities: City[];
  /** Chamado após a criação — o campo entra na lista e fica selecionado. */
  onCreated?: (field: FieldEntity) => void;
}

export function CreateFieldDialog({ cities, onCreated }: CreateFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", address: "", cityId: "", pricePerHour: 0 },
  });

  const noCities = cities.length === 0;

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const result = await createFieldAction({
        name: data.name.trim(),
        address: data.address.trim(),
        cityId: Number(data.cityId),
        pricePerHour: data.pricePerHour,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Campo ${result.data.name} criado.`);
      form.reset({ name: "", address: "", cityId: "", pricePerHour: 0 });
      setOpen(false);
      onCreated?.(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Novo campo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo campo</DialogTitle>
          <DialogDescription>Regista um campo em POST /fields.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-field-name">Nome</FieldLabel>
                  <Input
                    {...field}
                    id="create-field-name"
                    placeholder="Campo do Kilamba"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="address"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-field-address">Morada</FieldLabel>
                  <Input
                    {...field}
                    id="create-field-address"
                    placeholder="Kilamba, Luanda, Quarterao B2"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {noCities ? (
              <Field>
                <FieldLabel>Cidade</FieldLabel>
                <p className="text-muted-foreground text-sm">Crie uma cidade primeiro no ecrã Cidades.</p>
              </Field>
            ) : (
              <Controller
                control={form.control}
                name="cityId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Cidade</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        aria-label="Cidade"
                        className="w-full"
                      >
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={String(city.id)}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
            <Controller
              control={form.control}
              name="pricePerHour"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-field-price">Preço por hora (Kz)</FieldLabel>
                  <Input
                    {...field}
                    id="create-field-price"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="18000"
                    aria-invalid={fieldState.invalid}
                    onChange={(event) => field.onChange(event.target.value === "" ? 0 : Number(event.target.value))}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || noCities}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {isPending ? "Criando..." : "Criar campo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
