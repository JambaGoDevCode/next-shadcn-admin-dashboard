"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tournament } from "@/lib/api/types";

const ALL = "all";

interface TournamentSelectorProps {
  readonly tournaments: readonly Tournament[];
  /** `null` quando "todos os campeonatos" (apenas com `allowAll`). */
  readonly value: number | null;
  readonly onChange: (tournamentId: number | null) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly allowAll?: boolean;
  readonly label?: string;
  readonly placeholder?: string;
  readonly id?: string;
}

/**
 * Seletor de campeonato usado pelas páginas de gestão dos sub-módulos
 * (inscrições, classificações, fases, jogos, prémios, disciplinas,
 * pagamentos, históricos e estatísticas).
 */
export function TournamentSelector({
  tournaments,
  value,
  onChange,
  disabled = false,
  loading = false,
  allowAll = false,
  label = "Campeonato",
  placeholder = "Selecione um campeonato",
  id = "tournament-selector",
}: TournamentSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value === null ? ALL : String(value)}
        onValueChange={(next) => onChange(next === ALL ? null : Number(next))}
        disabled={disabled || loading}
      >
        <SelectTrigger id={id} aria-label={label} className="w-64">
          <SelectValue placeholder={loading ? "A carregar campeonatos…" : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {allowAll ? <SelectItem value={ALL}>Todos os campeonatos</SelectItem> : null}
            {tournaments.map((tournament) => (
              <SelectItem key={tournament.id} value={String(tournament.id)}>
                {tournament.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
