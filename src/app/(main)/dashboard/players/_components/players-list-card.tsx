"use client";

import * as React from "react";

import { RefreshCw, Search, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { City, Player, Team } from "@/lib/api/types";
import { createTeamLabeler, PLAYER_POSITIONS, playerPositionLabel, plural } from "@/lib/format";
import { cn, getInitials } from "@/lib/utils";

import { CreatePlayerDialog } from "./create-player-dialog";

const TEAM_FILTER_ALL = "__all";
const POSITION_FILTER_ALL = "__all";

interface PlayersListCardProps {
  /** `null` enquanto ainda não carregou. */
  players: Player[] | null;
  loading: boolean;
  error: string | null;
  selectedPlayerId: string | null;
  /** Equipas ativas — filtro e opções do diálogo de criação. */
  teams: Team[];
  /** Cidades ativas — opções do diálogo de criação. */
  cities: City[];
  /** Recarregar a lista (após mutações ou manualmente). */
  onRefresh: () => void;
  onRetry: () => void;
  onSelect: (player: Player) => void;
  /** Chamado após a criação — recarrega e seleciona o novo jogador. */
  onCreated: (playerId: string) => void;
}

/**
 * Card principal da página: lista de jogadores com filtro (nome/apelido, equipa e
 * posição), seleção de linha e ações «Recarregar» / «Novo jogador».
 */
export function PlayersListCard({
  players,
  loading,
  error,
  selectedPlayerId,
  teams,
  cities,
  onRefresh,
  onRetry,
  onSelect,
  onCreated,
}: PlayersListCardProps) {
  const [query, setQuery] = React.useState("");
  const [teamFilter, setTeamFilter] = React.useState(TEAM_FILTER_ALL);
  const [position, setPosition] = React.useState(POSITION_FILTER_ALL);

  const teamLabel = React.useMemo(() => createTeamLabeler(teams), [teams]);

  const visible = React.useMemo(() => {
    if (!players) return [];
    const q = query.trim().toLowerCase();
    return players.filter((player) => {
      if (q && !player.fullName.toLowerCase().includes(q) && !(player.nickname ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (teamFilter !== TEAM_FILTER_ALL && String(player.teamId ?? "") !== teamFilter) return false;
      if (position !== POSITION_FILTER_ALL && player.position !== position) return false;
      return true;
    });
  }, [players, query, teamFilter, position]);

  const hasFilters = query.trim().length > 0 || teamFilter !== TEAM_FILTER_ALL || position !== POSITION_FILTER_ALL;

  function clearFilters() {
    setQuery("");
    setTeamFilter(TEAM_FILTER_ALL);
    setPosition(POSITION_FILTER_ALL);
  }

  let body: React.ReactNode;
  if (loading && !players) {
    body = (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-14 w-full rounded-xl" key={index} />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={onRetry} size="sm" variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  } else if (!players || players.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Nenhum jogador registado</EmptyTitle>
          <EmptyDescription>Adicione o primeiro jogador para começar a gerir equipas e estatísticas.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreatePlayerDialog cities={cities} onCreated={onCreated} teams={teams} />
        </EmptyContent>
      </Empty>
    );
  } else if (visible.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>Nenhum jogador corresponde</EmptyTitle>
          <EmptyDescription>
            {hasFilters ? "Ajuste a pesquisa ou limpe os filtros." : "A lista de jogadores está vazia."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={clearFilters} size="sm" variant="outline">
            Limpar filtros
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else {
    body = (
      <>
        <ul className="flex max-h-[26rem] flex-col gap-1.5 overflow-y-auto pr-1">
          {visible.map((player) => {
            const active = player.id === selectedPlayerId;
            const jersey = `#${player.jerseyNumber ?? "—"}`;
            const meta = `${jersey} • ${playerPositionLabel(player.position)} • ${teamLabel(player.teamId)}`;
            return (
              <li key={player.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onSelect(player);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "border-primary bg-muted/50",
                  )}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                    {getInitials(player.fullName)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm leading-tight">{player.fullName}</div>
                    <div className="truncate text-muted-foreground text-xs">{meta}</div>
                  </div>

                  <Badge className="hidden shrink-0 sm:inline-flex" variant="secondary">
                    {jersey}
                  </Badge>

                  {player.isCaptain ? <Badge className="hidden shrink-0 md:inline-flex">Capitão</Badge> : null}
                  {!player.isActive ? (
                    <Badge className="hidden shrink-0 md:inline-flex" variant="secondary">
                      Inativo
                    </Badge>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground text-xs">
          A ver {visible.length} de {players.length} {plural(players.length, "jogador", "jogadores")}
          {hasFilters ? " (filtros ativos)" : ""}
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Jogadores</CardTitle>
        <CardDescription className="max-w-xl leading-snug">
          Jogadores registados: posição, equipa, estatísticas e capitania.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Button
            aria-label="Recarregar lista de jogadores"
            disabled={loading}
            onClick={onRefresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <CreatePlayerDialog cities={cities} onCreated={onCreated} teams={teams} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Filtrar por nome ou apelido…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filtrar jogadores por nome ou apelido"
            />
          </InputGroup>

          <Select onValueChange={setTeamFilter} value={teamFilter}>
            <SelectTrigger aria-label="Filtrar por equipa" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={TEAM_FILTER_ALL}>Todas as equipas</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={setPosition} value={position}>
            <SelectTrigger aria-label="Filtrar por posição" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={POSITION_FILTER_ALL}>Todas as posições</SelectItem>
                {PLAYER_POSITIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {hasFilters ? (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              Limpar
            </Button>
          ) : null}
        </div>

        {body}
      </CardContent>
    </Card>
  );
}
