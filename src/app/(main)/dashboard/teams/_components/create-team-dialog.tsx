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
import { Textarea } from "@/components/ui/textarea";
import type { City, RecentUser, Team } from "@/lib/api/types";
import { createTeamAction } from "@/server/actions/management";

const formSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  description: z.string().optional(),
  logo: z.url("Informe um URL válido.").or(z.literal("")),
  // Guardados como strings no formulário (os Selects devolvem texto) e convertidos no submit.
  cityId: z.string().min(1, "Selecione a cidade."),
  ownerId: z.string().min(1, "Selecione o proprietário."),
});

interface CreateTeamDialogProps {
  /** Cidades ativas — opções do seletor de cidade. */
  cities: City[];
  /** Utilizadores recentes — opções do seletor de proprietário. */
  users: RecentUser[];
  /** Chamado após a criação — a equipa entra na lista e fica selecionada. */
  onCreated?: (team: Team) => void;
}

export function CreateTeamDialog({ cities, users, onCreated }: CreateTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", logo: "", cityId: "", ownerId: "" },
  });

  const noCities = cities.length === 0;
  const noUsers = users.length === 0;

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const logo = data.logo.trim();
      const description = data.description?.trim();
      const result = await createTeamAction({
        name: data.name.trim(),
        description: description ? description : undefined,
        logo: logo === "" ? undefined : logo,
        cityId: Number(data.cityId),
        ownerId: Number(data.ownerId),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Equipa ${result.data.name} criada.`);
      form.reset({ name: "", description: "", logo: "", cityId: "", ownerId: "" });
      setOpen(false);
      onCreated?.(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Nova equipa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova equipa</DialogTitle>
          <DialogDescription>Regista uma equipa em POST /teams.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-team-name">Nome</FieldLabel>
                  <Input
                    {...field}
                    id="create-team-name"
                    placeholder="Peladeiros FC"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-team-description">Descrição</FieldLabel>
                  <Textarea
                    {...field}
                    id="create-team-description"
                    placeholder="Time de futebol amador"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="logo"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="create-team-logo">Logótipo (URL)</FieldLabel>
                  <Input
                    {...field}
                    id="create-team-logo"
                    type="url"
                    placeholder="https://…"
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
                      <SelectTrigger aria-invalid={fieldState.invalid} aria-label="Cidade" className="w-full">
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
            {noUsers ? (
              <Field>
                <FieldLabel>Proprietário</FieldLabel>
                <p className="text-muted-foreground text-sm">Sem utilizadores disponíveis.</p>
              </Field>
            ) : (
              <Controller
                control={form.control}
                name="ownerId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Proprietário</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid} aria-label="Proprietário" className="w-full">
                        <SelectValue placeholder="Selecione o proprietário" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name} — {user.email}
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
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || noCities || noUsers}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {isPending ? "Criando..." : "Criar equipa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
