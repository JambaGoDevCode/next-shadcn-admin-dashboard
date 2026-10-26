"use client";

import * as React from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw, Search, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { City } from "@/lib/api/types";
import { cn, getInitials } from "@/lib/utils";

import { CreateCityDialog } from "./create-city-dialog";

const STATE_FILTER_ALL = "__all";

interface CitiesListCardProps {
  /** `null` enquanto ainda não carregou. */
  cities: City[] | null;
  loading: boolean;
  error: string | null;
  selectedCityId: number | null;
  /** Recarregar a lista (após mutações ou manualmente). */
  onRefresh: () => void;
  onRetry: () => void;
  onSelect: (city: City) => void;
  /** Chamado após a criação — seleciona a nova cidade e recarrega. */
  onCreated: (city: City) => void;
}

function formatCreatedAt(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Card principal da página: lista de cidades com filtro (nome, província e país),
 * seleção de linha e ações «Recarregar» / «Nova cidade».
 */
export function CitiesListCard({
  cities,
  loading,
  error,
  selectedCityId,
  onRefresh,
  onRetry,
  onSelect,
  onCreated,
}: CitiesListCardProps) {
  const [query, setQuery] = React.useState("");
  const [state, setState] = React.useState(STATE_FILTER_ALL);

  const stateOptions = React.useMemo(() => {
    if (!cities) return [];
    const distinct = new Set<string>();
    for (const city of cities) {
      if (city.state) distinct.add(city.state);
    }
    return [...distinct].sort();
  }, [cities]);

  const visible = React.useMemo(() => {
    if (!cities) return [];
    const q = query.trim().toLowerCase();
    return cities.filter((city) => {
      if (
        q &&
        !city.name.toLowerCase().includes(q) &&
        !(city.state ?? "").toLowerCase().includes(q) &&
        !(city.country ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      if (state !== STATE_FILTER_ALL && city.state !== state) return false;
      return true;
    });
  }, [cities, query, state]);

  const hasFilters = query.trim().length > 0 || state !== STATE_FILTER_ALL;

  function clearFilters() {
    setQuery("");
    setState(STATE_FILTER_ALL);
  }

  let body: React.ReactNode;
  if (loading && !cities) {
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
  } else if (!cities || cities.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Nenhuma cidade registada</EmptyTitle>
          <EmptyDescription>Crie a primeira cidade para começar a gerir campos e equipas por localização.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateCityDialog onCreated={onCreated} />
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
          <EmptyTitle>Nenhuma cidade corresponde</EmptyTitle>
          <EmptyDescription>
            {hasFilters ? "Ajuste a pesquisa ou limpe os filtros." : "A lista de cidades está vazia."}
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
          {visible.map((city) => {
            const active = city.id === selectedCityId;
            return (
              <li key={city.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onSelect(city);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "border-primary bg-muted/50",
                  )}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                    {getInitials(city.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm leading-tight">{city.name}</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {[city.state, city.country].filter(Boolean).join(" • ") || "—"}
                    </div>
                  </div>

                  <span className="hidden shrink-0 text-muted-foreground text-xs sm:block">{city.state ?? "—"}</span>

                  <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs tabular-nums lg:block">
                    {formatCreatedAt(city.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground text-xs">
          A ver {visible.length} de {cities.length} cidade{cities.length === 1 ? "" : "s"}
          {hasFilters ? " (filtros ativos)" : ""}
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Cidades</CardTitle>
        <CardDescription className="max-w-xl leading-snug">
          Localizações da plataforma: província, país e ligação a campos e equipas.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Button
            aria-label="Recarregar lista de cidades"
            disabled={loading}
            onClick={onRefresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <CreateCityDialog onCreated={onCreated} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Filtrar por cidade, província ou país…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filtrar cidades por nome, província ou país"
            />
          </InputGroup>

          <Select onValueChange={setState} value={state}>
            <SelectTrigger aria-label="Filtrar por província" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={STATE_FILTER_ALL}>Todas as províncias</SelectItem>
                {stateOptions.map((stateName) => (
                  <SelectItem key={stateName} value={stateName}>
                    {stateName}
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
