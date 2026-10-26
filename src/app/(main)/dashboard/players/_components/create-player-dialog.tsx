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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { City, Team } from "@/lib/api/types";
import { PLAYER_POSITIONS } from "@/lib/format";
import { createPlayerAction } from "@/server/actions/players";

const formSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo.").max(150, "Máximo de 150 caracteres."),
  nickname: z.string().optional(),
  birthDate: z
    .string()
    .min(1, "Informe a data de nascimento.")
    .refine((value) => value === "" || !Number.isNaN(new Date(value).getTime()), "Data inválida.")
    .refine((value) => {
      if (value === "") return true;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) || date.getTime() <= Date.now();
    }, "A data de nascimento não pode estar no futuro."),
  position: z.string().min(1, "Selecione a posição."),
  jerseyNumber: z.coerce
    .number()
    .int("Número inválido.")
    .min(1, "Número entre 1 e 99.")
    .max(99, "Número entre 1 e 99."),
  teamId: z.coerce.number().refine((value) => value > 0, "Selecione a equipa."),
  cityId: z.coerce.number().refine((value) => value > 0, "Selecione a cidade."),
});

interface CreatePlayerDialogProps {
  /** Equipas ativas — opções do seletor de equipa. */
  teams: Team[];
  /** Cidades ativas — opções do seletor de cidade. */
  cities: City[];
  /** Chamado após a criação — recarrega a lista e seleciona o novo jogador. */
  onCreated?: (playerId: string) => void;
}

export function CreatePlayerDialog({ teams, cities, onCreated }: CreatePlayerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", nickname: "", birthDate: "", position: "", jerseyNumber: 1, teamId: 0, cityId: 0 },
  });

  const noTeams = teams.length === 0;
  const noCities = cities.length === 0;

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const fullName = data.fullName.trim();
      const nickname = data.nickname?.trim();
      const result = await createPlayerAction({
        fullName,
        nickname: nickname ? nickname : undefined,
        birthDate: data.birthDate,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        teamId: data.teamId,
        cityId: data.cityId,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Jogador ${fullName} criado.`);
      form.reset({
        fullName: "",
        nickname: "",
        birthDate: "",
        position: "",
        jerseyNumber: 1,
        teamId: 0,
        cityId: 0,
      });
      setOpen(false);
      onCreated?.(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Novo jogador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo jogador</DialogTitle>
          <DialogDescription>Regista um jogador em POST /players.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">Identificação</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="fullName"
                render={({ field, fieldState }) => (
                  <Field className="sm:col-span-2" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-player-full-name">Nome completo</FieldLabel>
                    <Input
                      {...field}
                      id="create-player-full-name"
                      placeholder="José Manuel"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="create-player-nickname">Apelido (opcional)</FieldLabel>
                    <Input {...field} id="create-player-nickname" placeholder="Ex.: O Kan" value={field.value ?? ""} />
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">Desporto</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="birthDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-player-birth-date">Data de nascimento</FieldLabel>
                    <Input
                      {...field}
                      id="create-player-birth-date"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="position"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Posição</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid} aria-label="Posição" className="w-full">
                        <SelectValue placeholder="Selecione a posição" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {PLAYER_POSITIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="jerseyNumber"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-player-jersey-number">Número</FieldLabel>
                    <Input
                      {...field}
                      id="create-player-jersey-number"
                      type="number"
                      min={1}
                      max={99}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">Vínculo</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {noTeams ? (
                <Field>
                  <FieldLabel>Equipa</FieldLabel>
                  <p className="text-muted-foreground text-sm">Crie uma equipa primeiro no ecrã Equipas.</p>
                </Field>
              ) : (
                <Controller
                  control={form.control}
                  name="teamId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Equipa</FieldLabel>
                      <Select value={String(field.value)} onValueChange={field.onChange}>
                        <SelectTrigger aria-invalid={fieldState.invalid} aria-label="Equipa" className="w-full">
                          <SelectValue placeholder="Selecione a equipa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={String(team.id)}>
                                {team.name}
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
                      <Select value={String(field.value)} onValueChange={field.onChange}>
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
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || noTeams || noCities}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {isPending ? "Criando..." : "Criar jogador"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
