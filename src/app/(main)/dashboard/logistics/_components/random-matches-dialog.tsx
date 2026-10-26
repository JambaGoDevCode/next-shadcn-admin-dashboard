"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateRandomMatchesAction } from "@/server/actions/logistics";

import { useMatchReference } from "./use-match-reference";

interface RandomMatchesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado depois de gerar jogos — a lista deve ser atualizada. */
  onGenerated: () => void;
}

/**
 * Diálogo «Gerar jogos aleatórios» — escolhe um conjunto de equipas e gera
 * confrontos aleatórios (pares distintos) no campo/cidade indicados.
 */
export function RandomMatchesDialog({ open, onOpenChange, onGenerated }: RandomMatchesDialogProps) {
  const { data: reference, loading, error, retry } = useMatchReference(open);

  const [cityId, setCityId] = React.useState("");
  const [fieldId, setFieldId] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [count, setCount] = React.useState("1");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCityId("");
    setFieldId("");
    setSelectedIds([]);
    setCount("1");
    setSaving(false);
  }, [open]);

  const cityFields = React.useMemo(() => {
    if (!reference || !cityId) return [];
    return reference.fields.filter((field) => String(field.cityId) === cityId);
  }, [reference, cityId]);

  const possiblePairs = (selectedIds.length * (selectedIds.length - 1)) / 2;
  const maxCount = Math.max(possiblePairs, 1);
  const countValue = Math.min(Math.max(Number(count) || 1, 1), maxCount);
  const countOptions = Array.from({ length: Math.min(maxCount, 10) }, (_, index) => index + 1);

  function toggleTeam(teamId: number) {
    const next = selectedIds.includes(teamId)
      ? selectedIds.filter((id) => id !== teamId)
      : [...selectedIds, teamId];
    setSelectedIds(next);

    const nextMax = Math.max((next.length * (next.length - 1)) / 2, 1);
    setCount(String(Math.min(Math.max(Number(count) || 1, 1), nextMax)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || loading || error) return;

    if (!cityId) return void toast.error("Selecione a cidade.");
    if (!fieldId) return void toast.error("Selecione o campo.");
    if (selectedIds.length < 2) return void toast.error("Selecione pelo menos duas equipas.");

    setSaving(true);
    const result = await generateRandomMatchesAction({
      teamIds: selectedIds,
      fieldId: Number(fieldId),
      cityId: Number(cityId),
      count: countValue,
    });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.data === 1 ? "1 jogo gerado." : `${result.data} jogos gerados.`,
    );
    onGenerated();
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerar jogos aleatórios</DialogTitle>
          <DialogDescription>
            Selecione as equipas e o número de jogos — os confrontos são escolhidos ao acaso.
          </DialogDescription>
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
                  <Label htmlFor="random-city">Cidade</Label>
                  <Select
                    onValueChange={(value) => {
                      setCityId(value);
                      setFieldId("");
                    }}
                    value={cityId}
                  >
                    <SelectTrigger id="random-city">
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
                  <Label htmlFor="random-field">Campo</Label>
                  <Select disabled={!cityId} onValueChange={setFieldId} value={fieldId}>
                    <SelectTrigger id="random-field">
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

              <div className="flex flex-col gap-2">
                <Label>Equipas</Label>
                <div className="max-h-44 overflow-y-auto rounded-md border p-1">
                  {reference?.teams.map((team) => (
                    <Label
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      htmlFor={`random-team-${team.id}`}
                      key={team.id}
                    >
                      <Checkbox
                        checked={selectedIds.includes(team.id)}
                        id={`random-team-${team.id}`}
                        onCheckedChange={() => toggleTeam(team.id)}
                      />
                      <span className="min-w-0 flex-1 truncate">{team.name}</span>
                    </Label>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  {selectedIds.length} equipa{selectedIds.length === 1 ? "" : "s"} selecionada
                  {selectedIds.length === 1 ? "" : "s"} · {possiblePairs} confronto
                  {possiblePairs === 1 ? "" : "s"} possível{possiblePairs === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="random-count">Número de jogos</Label>
                <Select onValueChange={setCount} value={String(countValue)}>
                  <SelectTrigger className="w-32" id="random-count">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {countOptions.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={saving || loading || Boolean(error)} type="submit">
              {saving ? <Loader2 className="animate-spin" /> : null}
              Gerar jogos
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
