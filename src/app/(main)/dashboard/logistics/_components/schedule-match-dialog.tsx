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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Match } from "@/lib/api/types";
import { createMatchAction } from "@/server/actions/logistics";

import { defaultFutureDatetimeLocal, isFutureDatetimeLocal } from "./match-date";
import { useMatchReference } from "./use-match-reference";

interface ScheduleMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pré-preenchimento vindo do matchmaking (equipas sugeridas). */
  prefill?: { homeTeamId?: number; awayTeamId?: number } | null;
  onCreated: (match: Match) => void;
}

/**
 * Diálogo «Marcar jogo» — agenda um confronto entre duas equipas,
 * num campo e data/hora específicos (POST /matches).
 */
export function ScheduleMatchDialog({ open, onOpenChange, prefill, onCreated }: ScheduleMatchDialogProps) {
  const { data: reference, loading, error, retry } = useMatchReference(open);

  const [cityId, setCityId] = React.useState("");
  const [fieldId, setFieldId] = React.useState("");
  const [homeTeamId, setHomeTeamId] = React.useState("");
  const [awayTeamId, setAwayTeamId] = React.useState("");
  const [matchDate, setMatchDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCityId("");
    setFieldId("");
    setHomeTeamId(prefill?.homeTeamId ? String(prefill.homeTeamId) : "");
    setAwayTeamId(prefill?.awayTeamId ? String(prefill.awayTeamId) : "");
    setMatchDate(defaultFutureDatetimeLocal());
    setSaving(false);
  }, [open, prefill]);

  const cityFields = React.useMemo(() => {
    if (!reference || !cityId) return [];
    return reference.fields.filter((field) => String(field.cityId) === cityId);
  }, [reference, cityId]);

  const awayOptions = React.useMemo(() => {
    if (!reference) return [];
    return reference.teams.filter((team) => String(team.id) !== homeTeamId);
  }, [reference, homeTeamId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || loading || error) return;

    if (!cityId) return toast.error("Selecione a cidade.");
    if (!fieldId) return toast.error("Selecione o campo.");
    if (!homeTeamId) return toast.error("Selecione a equipa mandante.");
    if (!awayTeamId) return toast.error("Selecione a equipa visitante.");
    if (homeTeamId === awayTeamId) return toast.error("A equipa mandante e a visitante têm de ser diferentes.");
    if (!matchDate) return toast.error("Indique a data e a hora do jogo.");
    if (!isFutureDatetimeLocal(matchDate)) return toast.error("A data do jogo tem de ser no futuro.");

    setSaving(true);
    const result = await createMatchAction({
      homeTeamId: Number(homeTeamId),
      awayTeamId: Number(awayTeamId),
      fieldId: Number(fieldId),
      cityId: Number(cityId),
      matchDate,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Partida agendada.");
    onCreated(result.data);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Marcar jogo</DialogTitle>
          <DialogDescription>Agende um confronto entre duas equipas, com campo e data definidos.</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {loading ? (
            <div className="flex h-32 items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              A carregar equipas, campos e cidades…
            </div>
          ) : error ? (
            <div className="flex h-32 flex-col items-center justify-center gap-3 text-center">
              <p className="text-destructive text-sm">{error}</p>
              <Button onClick={retry} size="sm" type="button" variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="schedule-city">Cidade</Label>
                  <Select
                    onValueChange={(value) => {
                      setCityId(value);
                      setFieldId("");
                    }}
                    value={cityId}
                  >
                    <SelectTrigger id="schedule-city">
                      <SelectValue placeholder="Selecionar cidade…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {reference?.cities.map((city) => (
                          <SelectItem key={city.id} value={String(city.id)}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="schedule-field">Campo</Label>
                  <Select disabled={!cityId} onValueChange={setFieldId} value={fieldId}>
                    <SelectTrigger id="schedule-field">
                      <SelectValue placeholder={cityId ? "Selecionar campo…" : "Escolha a cidade"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {cityFields.map((field) => (
                          <SelectItem key={field.id} value={String(field.id)}>
                            {field.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {cityId && cityFields.length === 0 ? (
                    <p className="text-muted-foreground text-xs">Sem campos registados nesta cidade.</p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="schedule-home">Equipa mandante</Label>
                  <Select onValueChange={setHomeTeamId} value={homeTeamId}>
                    <SelectTrigger id="schedule-home">
                      <SelectValue placeholder="Selecionar equipa…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {reference?.teams.map((team) => (
                          <SelectItem key={team.id} value={String(team.id)}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="schedule-away">Equipa visitante</Label>
                  <Select onValueChange={setAwayTeamId} value={awayTeamId}>
                    <SelectTrigger id="schedule-away">
                      <SelectValue placeholder="Selecionar equipa…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {awayOptions.map((team) => (
                          <SelectItem key={team.id} value={String(team.id)}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="schedule-date">Data e hora</Label>
                <Input
                  id="schedule-date"
                  onChange={(event) => setMatchDate(event.target.value)}
                  type="datetime-local"
                  value={matchDate}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={saving || loading || Boolean(error)} type="submit">
              {saving ? <Loader2 className="animate-spin" /> : null}
              Agendar jogo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
