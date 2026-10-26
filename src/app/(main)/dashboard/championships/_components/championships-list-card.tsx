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
import type { Tournament } from "@/lib/api/types";
import { formatDate, plural } from "@/lib/format";
import { cn, getInitials } from "@/lib/utils";

import {
  TOURNAMENT_STATUSES,
  championshipStatusLabel,
  championshipStatusVariant,
  tournamentTypeLabel,
} from "./championship-labels";
import { CreateChampionshipDialog } from "./create-championship-dialog";

const STATUS_FILTER_ALL = "__all";

interface ChampionshipsListCardProps {
  /** `null` enquanto ainda não carregou. */
  tournaments: Tournament[] | null;
  loading: boolean;
  error: string | null;
  selectedTournamentId: number | null;
  /** Recarregar a lista (após mutações ou manualmente). */
  onRefresh: () => void;
  onRetry: () => void;
  onSelect: (tournament: Tournament) => void;
  /** Chamado após a criação — seleciona o novo campeonato e recarrega. */
  onCreated: (tournament: Tournament) => void;
}

/**
 * Card principal da página: lista de campeonatos com filtro (nome e estado),
 * seleção de linha e ações «Recarregar» / «Novo campeonato».
 */
export function ChampionshipsListCard({
  tournaments,
  loading,
  error,
  selectedTournamentId,
  onRefresh,
  onRetry,
  onSelect,
  onCreated,
}: ChampionshipsListCardProps) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState(STATUS_FILTER_ALL);

  const visible = React.useMemo(() => {
    if (!tournaments) return [];
    const q = query.trim().toLowerCase();
    return tournaments.filter((tournament) => {
      if (q && !tournament.name.toLowerCase().includes(q)) return false;
      if (status !== STATUS_FILTER_ALL && tournament.status !== status) return false;
      return true;
    });
  }, [tournaments, query, status]);

  const hasFilters = query.trim().length > 0 || status !== STATUS_FILTER_ALL;

  function clearFilters() {
    setQuery("");
    setStatus(STATUS_FILTER_ALL);
  }

  let body: React.ReactNode;
  if (loading && !tournaments) {
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
  } else if (!tournaments || tournaments.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Nenhum campeonato criado</EmptyTitle>
          <EmptyDescription>
            Crie o primeiro campeonato para começar a gerir inscrições e classificação.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateChampionshipDialog onCreated={onCreated} />
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
          <EmptyTitle>Nenhum campeonato corresponde</EmptyTitle>
          <EmptyDescription>
            {hasFilters ? "Ajuste a pesquisa ou limpe os filtros." : "A lista de campeonatos está vazia."}
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
          {visible.map((tournament) => {
            const active = tournament.id === selectedTournamentId;
            const period = `${formatDate(tournament.period.startDate)} – ${formatDate(tournament.period.endDate)}`;
            const meta = `${tournamentTypeLabel(tournament.type)} • ${period}`;
            return (
              <li key={tournament.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onSelect(tournament);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "border-primary bg-muted/50",
                  )}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                    {getInitials(tournament.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm leading-tight">{tournament.name}</div>
                    <div className="truncate text-muted-foreground text-xs">{meta}</div>
                  </div>

                  <Badge
                    className="hidden shrink-0 md:inline-flex"
                    variant={championshipStatusVariant(tournament.status)}
                  >
                    {championshipStatusLabel(tournament.status)}
                  </Badge>

                  <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs tabular-nums lg:block">
                    {formatDate(tournament.period.startDate)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground text-xs">
          A ver {visible.length} de {tournaments.length} {plural(tournaments.length, "campeonato", "campeonatos")}
          {hasFilters ? " (filtros ativos)" : ""}
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Campeonatos</CardTitle>
        <CardDescription className="max-w-xl leading-snug">
          Tipos, períodos, inscrições e classificação dos campeonatos.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Button
            aria-label="Recarregar lista de campeonatos"
            disabled={loading}
            onClick={onRefresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <CreateChampionshipDialog onCreated={onCreated} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Filtrar por nome…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filtrar campeonatos por nome"
            />
          </InputGroup>

          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger aria-label="Filtrar por estado" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={STATUS_FILTER_ALL}>Todos os estados</SelectItem>
                {TOURNAMENT_STATUSES.map((option) => (
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
