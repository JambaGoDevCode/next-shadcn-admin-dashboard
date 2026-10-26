"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { City } from "@/lib/api/types";
import { listCitiesAction } from "@/server/actions/management";

import { CitiesListCard } from "./cities-list-card";
import { CityDetailsCard } from "./city-details-card";

/**
 * Gestão de cidades: lista filtrável (GET /cities), seleção de linha e cartão
 * de detalhe com edição (PUT) e exclusão (DELETE) — CRUD completo.
 */
export function CitiesAdmin() {
  const [cities, setCities] = useState<City[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const detailsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Lista de cidades — recarrega no mount e a cada refreshKey.
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);

    listCitiesAction()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setCities(result.data);
          setListError(null);
        } else {
          setCities(null);
          setListError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setCities(null);
        setListError("Não foi possível carregar as cidades.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Seleciona a primeira cidade (mais recente) quando nada está selecionado.
  useEffect(() => {
    if (!cities || cities.length === 0 || selectedId !== null) return;
    setSelectedId(cities[0].id);
  }, [cities, selectedId]);

  const selectedCity = cities?.find((city) => city.id === selectedId) ?? null;

  const handleSelect = useCallback((city: City) => {
    setSelectedId(city.id);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Cidade criada (diálogo) — entra no topo da lista e fica selecionada. */
  const handleCreated = useCallback(
    (city: City) => {
      setCities((current) => (current ? [city, ...current.filter((row) => row.id !== city.id)] : [city]));
      setSelectedId(city.id);
      refresh();
    },
    [refresh],
  );

  const handleUpdated = useCallback((city: City) => {
    setCities((current) => (current ? current.map((row) => (row.id === city.id ? city : row)) : current));
  }, []);

  /** Exclusão — a API remove a cidade da listagem; a seleção avança para o vizinho seguinte. */
  const handleDeleted = useCallback(
    (cityId: number) => {
      if (!cities) return;
      const index = cities.findIndex((city) => city.id === cityId);
      const remaining = cities.filter((city) => city.id !== cityId);
      const neighbor = remaining[Math.min(index, remaining.length - 1)] ?? null;
      setCities(remaining);
      setSelectedId(neighbor ? neighbor.id : null);
    },
    [cities],
  );

  return (
    <div className="flex flex-col gap-4">
      <CitiesListCard
        cities={cities}
        error={listError}
        loading={listLoading}
        onCreated={handleCreated}
        onRefresh={refresh}
        onRetry={refresh}
        onSelect={handleSelect}
        selectedCityId={selectedId}
      />

      <div className="flex flex-col gap-4" ref={detailsRef}>
        {selectedCity ? (
          <Card key={`details-${selectedCity.id}`}>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
              <CardDescription>Dados da cidade e ações de gestão.</CardDescription>
            </CardHeader>
            <CardContent>
              <CityDetailsCard city={selectedCity} onChanged={handleUpdated} onDeleted={handleDeleted} />
            </CardContent>
          </Card>
        ) : listLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : null}
      </div>
    </div>
  );
}
