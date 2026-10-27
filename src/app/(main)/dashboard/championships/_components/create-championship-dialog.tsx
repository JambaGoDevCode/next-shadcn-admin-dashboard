"use client";

import { useEffect, useState, useTransition } from "react";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { City, SportModality, Tournament } from "@/lib/api/types";
import { createTournamentAction } from "@/server/actions/championships";

import { TOURNAMENT_TYPES } from "./championship-labels";

const formSchema = z
  .object({
    name: z.string().min(3, "Informe o nome do campeonato."),
    description: z.string().optional(),
    type: z.string().min(1, "Selecione o tipo."),
    modalityId: z.coerce.number<number>().int().positive("Selecione a modalidade."),
    cityId: z.coerce.number<number>().int().positive("Selecione a cidade."),
    organizerId: z.coerce.number<number>().int().positive().optional(),
    startDate: z.string().min(1, "Indique a data de início."),
    endDate: z.string().min(1, "Indique a data de fim."),
    minTeams: z.coerce.number<number>().int("Valor inválido.").min(2, "Mínimo de 2 equipas."),
    maxTeams: z.coerce.number<number>().int("Valor inválido.").min(2, "Máximo inválido."),
    allowDraws: z.boolean(),
    pointsPerWin: z.coerce.number<number>().int("Valor inválido.").min(0, "Valor inválido."),
    pointsPerDraw: z.coerce.number<number>().int("Valor inválido.").min(0, "Valor inválido."),
    pointsPerLoss: z.coerce.number<number>().int("Valor inválido.").min(0, "Valor inválido."),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data de fim deve ser posterior à data de início.",
      });
    }
    if (data.maxTeams < data.minTeams) {
      ctx.addIssue({
        code: "custom",
        path: ["maxTeams"],
        message: "O máximo deve ser igual ou superior ao mínimo.",
      });
    }
  });

interface CreateChampionshipDialogProps {
  /** Chamado após a criação — o campeonato entra na lista e fica selecionado. */
  onCreated?: (tournament: Tournament) => void;
  cities: City[];
  modalities: SportModality[];
  organizers?: { id: number; name: string }[];
}

export function CreateChampionshipDialog({
  cities,
  modalities,
  organizers = [],
  onCreated,
}: CreateChampionshipDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.input<typeof formSchema>, unknown, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "LEAGUE",
      modalityId: 0,
      cityId: 0,
      organizerId: organizers[0]?.id,
      startDate: "",
      endDate: "",
      minTeams: 2,
      maxTeams: 16,
      allowDraws: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
      pointsPerLoss: 0,
    },
  });

  useEffect(() => {
    if (form.getValues("organizerId") === undefined && organizers[0]) {
      form.setValue("organizerId", organizers[0].id);
    }
  }, [form, organizers]);

  function onSubmit(data: z.output<typeof formSchema>) {
    startTransition(async () => {
      const description = data.description?.trim();
      const result = await createTournamentAction({
        name: data.name.trim(),
        description: description ? description : undefined,
        type: data.type,
        modalityId: data.modalityId,
        cityId: data.cityId,
        organizerId: data.organizerId,
        startDate: data.startDate,
        endDate: data.endDate,
        rules: {
          minTeams: data.minTeams,
          maxTeams: data.maxTeams,
          allowDraws: data.allowDraws,
          pointsPerWin: data.pointsPerWin,
          pointsPerDraw: data.pointsPerDraw,
          pointsPerLoss: data.pointsPerLoss,
        },
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Campeonato ${result.data.name} criado.`);
      form.reset();
      if (organizers[0]) form.setValue("organizerId", organizers[0].id);
      setOpen(false);
      onCreated?.(result.data);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> Novo campeonato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo campeonato</DialogTitle>
          <DialogDescription>Cria um campeonato em POST /tournaments com calendário e regras.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">Identificação</p>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field className="sm:col-span-2" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-name">Nome</FieldLabel>
                    <Input
                      {...field}
                      id="create-championship-name"
                      placeholder="Copa Peladeiro 2026"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="description"
                render={({ field }) => (
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor="create-championship-description">Descrição (opcional)</FieldLabel>
                    <Textarea
                      {...field}
                      id="create-championship-description"
                      placeholder="Detalhes do campeonato…"
                      value={field.value ?? ""}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="type"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Tipo</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        aria-label="Tipo de campeonato"
                        className="w-full"
                      >
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {TOURNAMENT_TYPES.map((option) => (
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
                name="modalityId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Modalidade</FieldLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <SelectTrigger aria-label="Modalidade" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Selecione a modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {modalities.map((modality) => (
                            <SelectItem key={modality.id} value={String(modality.id)}>
                              {modality.name}
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
                name="cityId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Cidade</FieldLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <SelectTrigger aria-label="Cidade" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Selecione a cidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {cities.map((city) => (
                            <SelectItem key={city.id} value={String(city.id)}>
                              {city.name}
                              {city.state ? ` · ${city.state}` : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              {organizers.length > 0 && (
                <Controller
                  control={form.control}
                  name="organizerId"
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Organizador</FieldLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value ? String(field.value) : ""}
                      >
                        <SelectTrigger aria-label="Organizador" className="w-full">
                          <SelectValue placeholder="Selecione o organizador" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {organizers.map((organizer) => (
                              <SelectItem key={organizer.id} value={String(organizer.id)}>
                                {organizer.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              )}
            </FieldGroup>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">Calendário</p>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="startDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-start-date">Data de início</FieldLabel>
                    <Input
                      {...field}
                      id="create-championship-start-date"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="endDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-end-date">Data de fim</FieldLabel>
                    <Input {...field} id="create-championship-end-date" type="date" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-xs">Regras</p>
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="minTeams"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-min-teams">Número mínimo de equipas</FieldLabel>
                    <Input
                      {...field}
                      id="create-championship-min-teams"
                      type="number"
                      min={2}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="maxTeams"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-max-teams">Número máximo de equipas</FieldLabel>
                    <Input
                      {...field}
                      id="create-championship-max-teams"
                      type="number"
                      min={2}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="allowDraws"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <FieldLabel htmlFor="create-championship-allow-draws">Permitir empates</FieldLabel>
                    <Switch
                      checked={field.value}
                      id="create-championship-allow-draws"
                      onCheckedChange={field.onChange}
                    />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="pointsPerWin"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-points-win">Pontos por vitória</FieldLabel>
                    <Input
                      {...field}
                      id="create-championship-points-win"
                      type="number"
                      min={0}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="pointsPerDraw"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-points-draw">Pontos por empate</FieldLabel>
                    <Input
                      {...field}
                      id="create-championship-points-draw"
                      type="number"
                      min={0}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="pointsPerLoss"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-championship-points-loss">Pontos por derrota</FieldLabel>
                    <Input
                      {...field}
                      id="create-championship-points-loss"
                      type="number"
                      min={0}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {isPending ? "Criando..." : "Criar campeonato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
