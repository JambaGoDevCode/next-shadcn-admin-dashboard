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
import type { City, RecentUser, Team } from "@/lib/api/types";
import { createCityLabeler, formatDate, plural } from "@/lib/format";
import { cn, getInitials } from "@/lib/utils";

import { CreateTeamDialog } from "./create-team-dialog";
import { createOwnerLabeler } from "./team-labels";

const CITY_FILTER_ALL = "__all";
const STATE_FILTER_ALL = "__all";

interface TeamsListCardProps {
  /** `null` enquanto ainda não carregou. */
  teams: Team[] | null;
  loading: boolean;
  error: string | null;
  selectedTeamId: number | null;
  /** Cidades ativas — rótulos, filtro e opções do diálogo. */
  cities: City[];
  /** Utilizadores recentes — rótulos de proprietário e opções do diálogo. */
  users: RecentUser[];
  /** Recarregar a lista (após mutações ou manualmente). */
  onRefresh: () => void;
  onRetry: () => void;
  onSelect: (team: Team) => void;
  /** Chamado após a criação — seleciona a nova equipa e recarrega. */
  onCreated: (team: Team) => void;
}

/**
 * Card principal da página: lista de equipas com filtro (nome, descrição e cidade),
 * seleção de linha e ações «Recarregar» / «Nova equipa».
 */
export function TeamsListCard({
  teams,
  loading,
  error,
  selectedTeamId,
  cities,
  users,
  onRefresh,
  onRetry,
  onSelect,
  onCreated,
}: TeamsListCardProps) {
  const [query, setQuery] = React.useState("");
  const [cityFilter, setCityFilter] = React.useState(CITY_FILTER_ALL);
  const [stateFilter, setStateFilter] = React.useState(STATE_FILTER_ALL);

  const cityLabel = React.useMemo(() => createCityLabeler(cities), [cities]);
  const ownerLabel = React.useMemo(() => createOwnerLabeler(users), [users]);

  const cityOptions = React.useMemo(() => {
    if (!teams) return [];
    const ids = new Set<number>();
    for (const team of teams) {
      if (team.cityId != null) ids.add(team.cityId);
    }
    return [...ids]
      .sort((a, b) => a - b)
      .map((id) => ({ id, label: cityLabel(id) }));
  }, [teams, cityLabel]);

  const visible = React.useMemo(() => {
    if (!teams) return [];
    const q = query.trim().toLowerCase();
    return teams.filter((team) => {
      if (q && !team.name.toLowerCase().includes(q) && !(team.description ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (cityFilter !== CITY_FILTER_ALL && String(team.cityId ?? "") !== cityFilter) return false;
      if (stateFilter !== STATE_FILTER_ALL) {
        const active = team.isActive !== false;
        if (stateFilter === "ACTIVE" && !active) return false;
        if (stateFilter === "INACTIVE" && active) return false;
      }
      return true;
    });
  }, [teams, query, cityFilter, stateFilter]);

  const hasFilters = query.trim().length > 0 || cityFilter !== CITY_FILTER_ALL || stateFilter !== STATE_FILTER_ALL;

  function clearFilters() {
    setQuery("");
    setCityFilter(CITY_FILTER_ALL);
    setStateFilter(STATE_FILTER_ALL);
  }

  let body: React.ReactNode;
  if (loading && !teams) {
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
  } else if (!teams || teams.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Nenhuma equipa registada</EmptyTitle>
          <EmptyDescription>Crie a primeira equipa para começar a gerir jogadores e campeonatos.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateTeamDialog cities={cities} onCreated={onCreated} users={users} />
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
          <EmptyTitle>Nenhuma equipa corresponde</EmptyTitle>
          <EmptyDescription>
            {hasFilters ? "Ajuste a pesquisa ou limpe os filtros." : "A lista de equipas está vazia."}
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
          {visible.map((team) => {
            const active = team.id === selectedTeamId;
            return (
              <li key={team.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onSelect(team);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "border-primary bg-muted/50",
                  )}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                    {getInitials(team.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm leading-tight">{team.name}</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {`${cityLabel(team.cityId)} • ${ownerLabel(team.ownerId)}`}
                    </div>
                  </div>

                  <Badge
                    className="hidden shrink-0 sm:inline-flex"
                    variant={team.isActive === false ? "destructive" : "secondary"}
                  >
                    {team.isActive === false ? "Inactiva" : cityLabel(team.cityId)}
                  </Badge>

                  <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs tabular-nums lg:block">
                    {formatDate(team.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground text-xs">
          A ver {visible.length} de {teams.length} {plural(teams.length, "equipa", "equipas")}
          {hasFilters ? " (filtros ativos)" : ""}
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Equipas</CardTitle>
        <CardDescription className="max-w-xl leading-snug">
          Equipas da plataforma: cidade, proprietário e elenco.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Button
            aria-label="Recarregar lista de equipas"
            disabled={loading}
            onClick={onRefresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <CreateTeamDialog cities={cities} onCreated={onCreated} users={users} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Filtrar por nome ou descrição…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filtrar equipas por nome ou descrição"
            />
          </InputGroup>

          <Select onValueChange={setCityFilter} value={cityFilter}>
            <SelectTrigger aria-label="Filtrar por cidade" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={CITY_FILTER_ALL}>Todas as cidades</SelectItem>
                {cityOptions.map((city) => (
                  <SelectItem key={city.id} value={String(city.id)}>
                    {city.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={setStateFilter} value={stateFilter}>
            <SelectTrigger aria-label="Filtrar por estado" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={STATE_FILTER_ALL}>Todos os estados</SelectItem>
                <SelectItem value="ACTIVE">Activas</SelectItem>
                <SelectItem value="INACTIVE">Inactivas</SelectItem>
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
