import type * as React from "react";

import { Shield, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

import type { MatchSimple, MatchStatus } from "@/lib/api/types";

const statusLabels: Record<MatchStatus, string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  LIVE: "Em andamento",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
  POSTPONED: "Adiada",
};

const progressRingClasses: Record<MatchStatus, string> = {
  SCHEDULED: "text-muted-foreground",
  CONFIRMED: "text-primary",
  LIVE: "text-primary",
  FINISHED: "text-green-600",
  CANCELLED: "text-destructive",
  POSTPONED: "text-amber-500",
};

/** Avanço visual da partida (mesmo anel/linha do card de shipments). */
const statusProgress: Record<MatchStatus, number> = {
  SCHEDULED: 10,
  CONFIRMED: 30,
  LIVE: 70,
  FINISHED: 100,
  CANCELLED: 50,
  POSTPONED: 15,
};

function getProgressRingClass(status: MatchStatus) {
  return cn(
    "grid size-3 place-items-center rounded-full p-[0.5px] bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)]",
    progressRingClasses[status],
  );
}

type MatchCardProps = {
  active?: boolean;
  match: MatchSimple;
  onSelectMatch: (matchId: number) => void;
};

export function MatchCard({ active, match, onSelectMatch }: MatchCardProps) {
  const progress = statusProgress[match.status];
  const angle = progress * 3.6;
  const hasScore = match.homeScore !== null && match.awayScore !== null;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(event) => {
        event.currentTarget.blur();
        onSelectMatch(match.id);
      }}
      className={cn(
        "flex w-full flex-col gap-5 rounded-xl border p-3 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active && "border-primary bg-muted/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>#{match.id}</div>
          {hasScore && (
            <div className="text-sm font-medium tabular-nums tracking-tight">
              {match.homeScore} – {match.awayScore}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <div style={{ "--angle": `${angle}deg` } as React.CSSProperties} className={getProgressRingClass(match.status)}>
            <div className="grid size-2 place-items-center rounded-full bg-card">
              <div className="size-1 rounded-full bg-current" />
            </div>
          </div>
          <div className="text-muted-foreground text-xs">{statusLabels[match.status]}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shield className="size-4 shrink-0 text-primary" />
          <div className="flex flex-col gap-0.5">
            <div className="truncate font-medium text-xs leading-none">{match.homeTeamName}</div>
            <div className="text-muted-foreground text-xs">Mandante</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          <div className="flex flex-col gap-0.5">
            <div className="truncate font-medium text-xs leading-none">{match.awayTeamName}</div>
            <div className="text-muted-foreground text-xs">Visitante</div>
          </div>
          <Shield className="size-4 shrink-0 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <span
          className="h-px min-w-0 border-foreground border-t border-dashed"
          style={{ flexGrow: progress, flexBasis: 0 }}
        />
        <Trophy className="size-3.5" />
        <span
          className="h-px min-w-0 border-border border-t border-dashed"
          style={{ flexGrow: 100 - progress, flexBasis: 0 }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs leading-none">Campo</div>
          <div className="truncate text-sm tracking-tight">{match.fieldName ?? "Não definido"}</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground text-xs leading-none">Data</div>
          <div className="text-sm tabular-nums tracking-tight">{formatMatchDate(match.matchDate)}</div>
        </div>
      </div>
    </button>
  );
}

function formatMatchDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
