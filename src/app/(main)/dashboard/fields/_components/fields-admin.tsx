"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { City, Field } from "@/lib/api/types";
import { listCitiesAction, listFieldsAction } from "@/server/actions/management";

import { FieldDetailsCard } from "./field-details-card";
import { FieldsListCard } from "./fields-list-card";

interface FieldsAdminProps {
  /** Campo pré-selecionado via deep link `?fieldId=` (vindo de Aprovação, Qualidade, etc.). */
  initialFieldId?: number;
}

/**
 * Gestão de campos: lista filtrável (GET /fields), seleção de linha e cartão
 * de detalhe com edição (PUT), disponibilidade e exclusão (DELETE) — CRUD completo.
 */
export function FieldsAdmin({ initialFieldId }: FieldsAdminProps) {
  const [fields, setFields] = useState<Field[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const detailsRef = useRef<HTMLDivElement>(null);
  /** Deep link `?fieldId=` já carregado. */
  const initialLoadedRef = useRef(false);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Campos + cidades (referência) — recarrega no mount e a cada refreshKey.
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);

    listFieldsAction()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setFields(result.data);
          setListError(null);
        } else {
          setFields(null);
          setListError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFields(null);
        setListError("Não foi possível carregar os campos.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    // Dados de referência: falhas não quebram o ecrã — os rótulos ficam «—».
    listCitiesAction()
      .then((result) => {
        if (!cancelled) setCities(result.ok ? result.data : []);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Seleciona o primeiro campo quando nada está selecionado.
  useEffect(() => {
    if (!fields || fields.length === 0 || selectedId !== null) return;
    setSelectedId(fields[0].id);
  }, [fields, selectedId]);

  // Deep link `?fieldId=` — seleciona o campo pedido (uma única vez).
  useEffect(() => {
    if (initialFieldId === undefined || initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    setSelectedId(initialFieldId);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialFieldId]);

  const selectedField = fields?.find((field) => field.id === selectedId) ?? null;

  const handleSelect = useCallback((field: Field) => {
    setSelectedId(field.id);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Campo criado (diálogo) — entra no topo da lista e fica selecionado. */
  const handleCreated = useCallback(
    (field: Field) => {
      setFields((current) => (current ? [field, ...current.filter((row) => row.id !== field.id)] : [field]));
      setSelectedId(field.id);
      refresh();
    },
    [refresh],
  );

  const handleUpdated = useCallback((field: Field) => {
    setFields((current) => (current ? current.map((row) => (row.id === field.id ? field : row)) : current));
  }, []);

  /** Exclusão — a API remove o campo da listagem; a seleção avança para o vizinho seguinte. */
  const handleDeleted = useCallback(
    (fieldId: number) => {
      if (!fields) return;
      const index = fields.findIndex((field) => field.id === fieldId);
      const remaining = fields.filter((field) => field.id !== fieldId);
      const neighbor = remaining[Math.min(index, remaining.length - 1)] ?? null;
      setFields(remaining);
      setSelectedId(neighbor ? neighbor.id : null);
    },
    [fields],
  );

  return (
    <div className="flex flex-col gap-4">
      <FieldsListCard
        cities={cities}
        error={listError}
        fields={fields}
        loading={listLoading}
        onCreated={handleCreated}
        onRefresh={refresh}
        onRetry={refresh}
        onSelect={handleSelect}
        selectedFieldId={selectedId}
      />

      <div className="flex flex-col gap-4" ref={detailsRef}>
        {selectedField ? (
          <Card key={`details-${selectedField.id}`}>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
              <CardDescription>Dados do campo e ações de gestão.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldDetailsCard
                cities={cities}
                field={selectedField}
                onChanged={handleUpdated}
                onDeleted={handleDeleted}
              />
            </CardContent>
          </Card>
        ) : listLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : null}
      </div>
    </div>
  );
}
