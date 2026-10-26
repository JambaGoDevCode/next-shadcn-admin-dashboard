"use client";

import * as React from "react";

import { Building2, Flag, Loader2, MapPin, Shield } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type MatchDetail, MatchStatus, type PlayerSummary, type TeamSummary } from "@/lib/api/types";
import { formatDateTime, formatKz } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getLogisticsMatchDetailAction } from "@/server/actions/logistics";

import { MatchFieldMap } from "./match-field-map";
import { MatchLifecycleActions } from "./match-lifecycle-actions";
import { MatchRescheduleDialog } from "./match-reschedule-dialog";
import { MatchScoreDialog } from "./match-score-dialog";

type MatchDetailsProps = {
  matchId: number | null;
  /** Incrementar para recarregar o detalhe (após ações de ciclo de vida ou eventos realtime). */
  refreshKey?: number;
  /** A partida foi alterada — a lista/detalhe deve ser recarregado. */
  onChanged?: () => void;
  /** A partida foi eliminada — a seleção atual deve ser limpa. */
  onDeleted?: () => void;
};

const statusBadgeClasses: Record<MatchStatus, string> = {
  [MatchStatus.SCHEDULED]: "border-muted bg-muted/50 text-muted-foreground",
  [MatchStatus.CONFIRMED]: "border-primary/20 bg-primary/10 text-primary",
  [MatchStatus.LIVE]: "border-green-600/20 bg-green-600/10 text-green-600",
  [MatchStatus.FINISHED]: "border-blue-600/20 bg-blue-600/10 text-blue-600",
  [MatchStatus.CANCELLED]: "border-destructive/20 bg-destructive/10 text-destructive",
  [MatchStatus.POSTPONED]: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const progressRingClasses: Record<MatchStatus, string> = {
  [MatchStatus.SCHEDULED]: "text-muted-foreground",
  [MatchStatus.CONFIRMED]: "text-primary",
  [MatchStatus.LIVE]: "text-green-600",
  [MatchStatus.FINISHED]: "text-blue-600",
  [MatchStatus.CANCELLED]: "text-destructive",
  [MatchStatus.POSTPONED]: "text-amber-500",
};

const statusLabels: Record<MatchStatus, string> = {
  [MatchStatus.SCHEDULED]: "Agendada",
  [MatchStatus.CONFIRMED]: "Confirmada",
  [MatchStatus.LIVE]: "Em andamento",
  [MatchStatus.FINISHED]: "Finalizada",
  [MatchStatus.CANCELLED]: "Cancelada",
  [MatchStatus.POSTPONED]: "Adiada",
};

const positionLabels: Record<string, string> = {
  GOALKEEPER: "Guarda-redes",
  DEFENDER: "Defesa",
  MIDFIELDER: "Médio",
  FORWARD: "Avançado",
};

function positionLabel(position: string | null | undefined): string {
  if (!position) return "—";
  return positionLabels[position] ?? position;
}

function teamInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function DataCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-muted-foreground text-xs leading-none">{label}</div>
      <div className="text-sm leading-none">{value}</div>
    </div>
  );
}

function TeamBlock({ team, role }: { team: TeamSummary; role: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-9 after:rounded-sm">
          <AvatarFallback className="rounded-sm">{teamInitials(team.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm leading-none">{team.name}</div>
          <div className="mt-1 truncate text-muted-foreground text-xs leading-none">
            {team.cityName ?? "Cidade não informada"}
          </div>
        </div>
        <Badge variant={team.isActive === false ? "secondary" : "outline"}>
          {team.isActive === false ? "Inativa" : "Ativa"}
        </Badge>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t pt-3 text-muted-foreground text-xs">
        <Shield className="size-3.5" />
        {role}
      </div>
    </div>
  );
}

function SquadSection({ title, players }: { title: string; players: PlayerSummary[] }) {
  if (players.length === 0) {
    return (
      <div>
        <div className="mb-3 flex items-center justify-between border-b pb-2">
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
          Sem convocados registados.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b pb-2">
        <span className="font-medium text-sm">{title}</span>
        <span className="text-muted-foreground text-xs">
          {players.length} jogador{players.length === 1 ? "" : "es"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {players.map((player) => (
          <div className="flex items-center gap-3 rounded-lg border p-2" key={player.id}>
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted font-medium text-xs tabular-nums">
              {player.jerseyNumber ?? "—"}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-sm">{player.fullName}</div>
              <div className="truncate text-muted-foreground text-xs">{positionLabel(player.position)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StateBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid h-full min-h-0 place-items-center p-4">
      <div className="grid w-full place-items-center rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
        {children}
      </div>
    </div>
  );
}

function MatchOverview({ detail, actions }: { detail: MatchDetail; actions?: React.ReactNode }) {
  const { match, homeTeam, awayTeam } = detail;
  const statusLabel = statusLabels[match.status] ?? match.status;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-medium text-lg tabular-nums tracking-tight sm:text-xl">#{match.id}</h1>
          <Badge variant="outline" className={cn("gap-1.5", statusBadgeClasses[match.status])}>
            <span className={cn("size-1.5 rounded-full bg-current", progressRingClasses[match.status])} />
            {statusLabel}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
          <span className="font-medium tabular-nums text-sm sm:text-base">
            {match.homeScore ?? "—"} – {match.awayScore ?? "—"}
          </span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground tabular-nums">{formatDateTime(match.matchDate)}</span>
          {match.tournamentId != null && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">Torneio #{match.tournamentId}</span>
            </>
          )}
        </div>
      </div>

      {actions}

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamBlock role="Mandante" team={homeTeam} />
        <TeamBlock role="Visitante" team={awayTeam} />
      </div>
    </div>
  );
}

export function MatchDetails({ matchId, refreshKey = 0, onChanged, onDeleted }: MatchDetailsProps) {
  const [detail, setDetail] = React.useState<MatchDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(matchId !== null);
  const [scoreOpen, setScoreOpen] = React.useState(false);
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);

  // Ao trocar de partida, fecha os diálogos abertos sobre a anterior.
  React.useEffect(() => {
    setScoreOpen(false);
    setRescheduleOpen(false);
  }, [matchId]);

  React.useEffect(() => {
    if (matchId === null) {
      setDetail(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);

      try {
        const result = await getLogisticsMatchDetailAction(matchId as number);
        if (cancelled) return;

        if (result.ok) {
          setDetail(result.data);
        } else {
          setDetail(null);
          setError(result.error);
        }
      } catch (cause) {
        if (!cancelled) {
          setDetail(null);
          setError(cause instanceof Error ? cause.message : "Não foi possível carregar os detalhes da partida.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [matchId, refreshKey]);

  const mapRow = detail ? (
    <MatchFieldMap
      address={detail.field?.address ?? null}
      cityName={detail.match.cityName ?? detail.field?.cityName ?? null}
      fieldName={detail.field?.name ?? null}
    />
  ) : (
    <div className="grid size-full place-items-center bg-muted p-4 text-center text-muted-foreground text-sm">
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Carregando detalhes da partida…
        </span>
      ) : (
        "Selecione uma partida para ver o mapa do campo."
      )}
    </div>
  );

  let tabBody: React.ReactNode;

  if (loading) {
    tabBody = (
      <StateBox>
        <span className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          Carregando detalhes da partida…
        </span>
      </StateBox>
    );
  } else if (error || !detail) {
    tabBody = (
      <StateBox>
        <span>{error ?? "Partida não encontrada."}</span>
        {matchId !== null && (
          <Button className="mt-3" onClick={() => window.location.reload()} size="sm" variant="outline">
            Tentar novamente
          </Button>
        )}
      </StateBox>
    );
  } else {
    const { match, homeTeam, awayTeam, field, city, players } = detail;
    const homeSquad = players.filter((player) => player.teamId === homeTeam.id);
    const awaySquad = players.filter((player) => player.teamId === awayTeam.id);

    tabBody = (
      <Tabs className="h-full gap-0" defaultValue="teams">
        <TabsList
          className="w-full justify-start gap-2 border-b px-4 **:data-[slot=tabs-trigger]:text-xs sm:gap-4 sm:**:data-[slot=tabs-trigger]:text-sm"
          variant="line"
        >
          <TabsTrigger className="flex-none" value="teams">
            Equipes
          </TabsTrigger>
          <TabsTrigger className="flex-none" value="players">
            Jogadores
          </TabsTrigger>
          <TabsTrigger className="flex-none" value="field">
            Campo
          </TabsTrigger>
          <TabsTrigger className="flex-none" value="city">
            Cidade
          </TabsTrigger>
        </TabsList>

        <TabsContent className="min-h-0 overflow-auto p-4" value="teams">
          <MatchOverview
            actions={
              <MatchLifecycleActions
                match={match}
                onChanged={() => onChanged?.()}
                onDeleted={() => onDeleted?.()}
                onOpenReschedule={() => setRescheduleOpen(true)}
                onOpenScore={() => setScoreOpen(true)}
              />
            }
            detail={detail}
          />
        </TabsContent>

        <TabsContent className="min-h-0 overflow-auto p-4" value="players">
          <div className="flex flex-col gap-6">
            <SquadSection players={homeSquad} title={`${homeTeam.name} — Mandante`} />
            <SquadSection players={awaySquad} title={`${awayTeam.name} — Visitante`} />
          </div>
        </TabsContent>

        <TabsContent className="min-h-0 overflow-auto p-4" value="field">
          {field ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span className="font-medium">{field.name}</span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4">
                <DataCell label="Nome" value={field.name} />
                <DataCell label="Endereço" value={field.address ?? "—"} />
                <DataCell label="Cidade" value={field.cityName ?? match.cityName ?? "—"} />
                <DataCell label="Preço/hora" value={field.pricePerHour != null ? formatKz(field.pricePerHour) : "—"} />
                <DataCell
                  label="Disponibilidade"
                  value={field.isAvailable === false ? "Indisponível" : "Disponível"}
                />
              </div>
            </div>
          ) : (
            <div className="grid place-items-center rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
              Esta partida não tem campo associado.
            </div>
          )}
        </TabsContent>

        <TabsContent className="min-h-0 overflow-auto p-4" value="city">
          {city ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Flag className="size-4 text-primary" />
                <span className="font-medium">{city.name}</span>
                <span className="text-muted-foreground text-xs">Cidade da partida</span>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <Shield className="size-3.5" />
                      Equipas na cidade
                    </span>
                    <span className="text-muted-foreground text-xs">{city.teams.length}</span>
                  </div>
                  {city.teams.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {city.teams.map((team) => (
                        <li className="flex items-center justify-between gap-2 text-sm" key={team.id}>
                          <span className="truncate">{team.name}</span>
                          <Badge variant={team.isActive === false ? "secondary" : "outline"}>
                            {team.isActive === false ? "Inativa" : "Ativa"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sem equipas registadas nesta cidade.</p>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between border-b pb-2">
                    <span className="flex items-center gap-2 font-medium text-sm">
                      <Building2 className="size-3.5" />
                      Campos na cidade
                    </span>
                    <span className="text-muted-foreground text-xs">{city.fields.length}</span>
                  </div>
                  {city.fields.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {city.fields.map((cityField) => (
                        <li className="flex items-center justify-between gap-2 text-sm" key={cityField.id}>
                          <span className="truncate">{cityField.name}</span>
                          <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                            {cityField.pricePerHour != null ? formatKz(cityField.pricePerHour) : "—"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-sm">Sem campos registados nesta cidade.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid place-items-center rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
              Cidade não informada para esta partida.
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]">
      <div className="min-h-0 overflow-hidden">{mapRow}</div>
      <div className="min-h-0 overflow-hidden">
        <div className="h-full min-h-0 py-2">{tabBody}</div>
      </div>

      {detail ? (
        <>
          <MatchScoreDialog
            match={detail.match}
            onOpenChange={setScoreOpen}
            onSaved={() => onChanged?.()}
            open={scoreOpen}
          />
          <MatchRescheduleDialog
            match={detail.match}
            onOpenChange={setRescheduleOpen}
            onSaved={() => onChanged?.()}
            open={rescheduleOpen}
          />
        </>
      ) : null}
    </div>
  );
}
