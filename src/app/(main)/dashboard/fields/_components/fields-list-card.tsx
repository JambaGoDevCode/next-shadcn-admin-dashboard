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
import type { City, Field } from "@/lib/api/types";
import { createCityLabeler, formatDate, formatKz, plural } from "@/lib/format";
import { cn, getInitials } from "@/lib/utils";

import { CreateFieldDialog } from "./create-field-dialog";

const CITY_FILTER_ALL = "__all";
const STATE_FILTER_ALL = "__all";
const PRICE_FILTER_ALL = "__all";

/** Faixas de preço por hora (Kz) — alinhadas com a gama actual da API (1 000 – 22 000). */
const PRICE_BANDS = [
  { value: "low", label: "Até 5 000 Kz", min: 0, max: 5_000 },
  { value: "mid", label: "5 001 – 15 000 Kz", min: 5_001, max: 15_000 },
  { value: "high", label: "Acima de 15 000 Kz", min: 15_001, max: Number.POSITIVE_INFINITY },
] as const;

interface FieldsListCardProps {
  /** `null` enquanto ainda não carregou. */
  fields: Field[] | null;
  loading: boolean;
  error: string | null;
  selectedFieldId: number | null;
  /** Cidades ativas — usadas para rótulos e para o filtro/seletor do diálogo. */
  cities: City[];
  /** Recarregar a lista (após mutações ou manualmente). */
  onRefresh: () => void;
  onRetry: () => void;
  onSelect: (field: Field) => void;
  /** Chamado após a criação — seleciona o novo campo e recarrega. */
  onCreated: (field: Field) => void;
}

/**
 * Card principal da página: lista de campos com filtro (nome, morada e cidade),
 * seleção de linha e ações «Recarregar» / «Novo campo».
 */
export function FieldsListCard({
  fields,
  loading,
  error,
  selectedFieldId,
  cities,
  onRefresh,
  onRetry,
  onSelect,
  onCreated,
}: FieldsListCardProps) {
  const [query, setQuery] = React.useState("");
  const [cityFilter, setCityFilter] = React.useState(CITY_FILTER_ALL);
  const [priceFilter, setPriceFilter] = React.useState(PRICE_FILTER_ALL);
  const [stateFilter, setStateFilter] = React.useState(STATE_FILTER_ALL);

  const cityLabel = React.useMemo(() => createCityLabeler(cities), [cities]);

  const cityOptions = React.useMemo(() => {
    if (!fields) return [];
    const ids = new Set<number>();
    for (const field of fields) {
      if (field.cityId != null) ids.add(field.cityId);
    }
    return [...ids]
      .sort((a, b) => a - b)
      .map((id) => ({ id, label: cityLabel(id) }));
  }, [fields, cityLabel]);

  const visible = React.useMemo(() => {
    if (!fields) return [];
    const q = query.trim().toLowerCase();
    const band = PRICE_BANDS.find((entry) => entry.value === priceFilter);
    return fields.filter((field) => {
      if (q && !field.name.toLowerCase().includes(q) && !(field.address ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (cityFilter !== CITY_FILTER_ALL && String(field.cityId ?? "") !== cityFilter) return false;
      if (band) {
        const price = field.pricePerHour ?? 0;
        if (price < band.min || price > band.max) return false;
      }
      if (stateFilter === "available" && !field.isAvailable) return false;
      if (stateFilter === "unavailable" && field.isAvailable) return false;
      return true;
    });
  }, [fields, query, cityFilter, priceFilter, stateFilter]);

  const hasFilters =
    query.trim().length > 0 ||
    cityFilter !== CITY_FILTER_ALL ||
    priceFilter !== PRICE_FILTER_ALL ||
    stateFilter !== STATE_FILTER_ALL;

  function clearFilters() {
    setQuery("");
    setCityFilter(CITY_FILTER_ALL);
    setPriceFilter(PRICE_FILTER_ALL);
    setStateFilter(STATE_FILTER_ALL);
  }

  let body: React.ReactNode;
  if (loading && !fields) {
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
  } else if (!fields || fields.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Nenhum campo registado</EmptyTitle>
          <EmptyDescription>
            Crie o primeiro campo para começar a gerir reservas e partidas por localização.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateFieldDialog cities={cities} onCreated={onCreated} />
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
          <EmptyTitle>Nenhum campo corresponde</EmptyTitle>
          <EmptyDescription>
            {hasFilters ? "Ajuste a pesquisa ou limpe os filtros." : "A lista de campos está vazia."}
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
          {visible.map((field) => {
            const active = field.id === selectedFieldId;
            return (
              <li key={field.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onSelect(field);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "border-primary bg-muted/50",
                  )}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                    {getInitials(field.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm leading-tight">{field.name}</div>
                    <div className="truncate text-muted-foreground text-xs">{field.address ?? "—"}</div>
                  </div>

                  <Badge className="hidden shrink-0 sm:inline-flex" variant="secondary">
                    {cityLabel(field.cityId)}
                  </Badge>

                  {!field.isAvailable ? (
                    <Badge className="hidden shrink-0 sm:inline-flex" variant="outline">
                      Indisponível
                    </Badge>
                  ) : null}

                  <span className="hidden shrink-0 text-right text-muted-foreground text-xs tabular-nums lg:block">
                    {formatKz(field.pricePerHour ?? 0)}
                  </span>

                  <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs tabular-nums lg:block">
                    {formatDate(field.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground text-xs">
          A ver {visible.length} de {fields.length} {plural(fields.length, "campo", "campos")}
          {hasFilters ? " (filtros ativos)" : ""}
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Campos</CardTitle>
        <CardDescription className="max-w-xl leading-snug">
          Quadras e campos da plataforma: localização, preço e disponibilidade; filtre por cidade, faixa de preço e
          estado.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Button
            aria-label="Recarregar lista de campos"
            disabled={loading}
            onClick={onRefresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <CreateFieldDialog cities={cities} onCreated={onCreated} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Filtrar por nome ou morada…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filtrar campos por nome ou morada"
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

          <Select onValueChange={setPriceFilter} value={priceFilter}>
            <SelectTrigger aria-label="Filtrar por preço" className="w-44">
              <SelectValue placeholder="Preço" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={PRICE_FILTER_ALL}>Qualquer preço</SelectItem>
                {PRICE_BANDS.map((band) => (
                  <SelectItem key={band.value} value={band.value}>
                    {band.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={setStateFilter} value={stateFilter}>
            <SelectTrigger aria-label="Filtrar por estado" className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={STATE_FILTER_ALL}>Todos os estados</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="unavailable">Indisponível</SelectItem>
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
