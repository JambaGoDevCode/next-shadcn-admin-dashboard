"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { MessageSquareWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Field, FieldQuality } from "@/lib/api/types";
import { getFieldQualityAction, listFieldsAction } from "@/server/actions/management";

import { FieldQualitySummary } from "../../_components/field-quality-summary";

/**
 * Avaliações e denúncias: consulta as avaliações/qualificações registadas nos
 * campos e acompanha as reclamações reportadas (condições, segurança ou informação
 * incorrecta).
 */
export function FieldReviewsAdmin() {
  const [fields, setFields] = useState<Field[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [_refreshKey, setRefreshKey] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quality, setQuality] = useState<FieldQuality | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  const _refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);

    listFieldsAction()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setFields(result.data);
          setListError(null);
          setSelectedId(result.data[0]?.id ?? null);
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

    return () => {
      cancelled = true;
    };
  }, []);

  const loadQuality = useCallback(async (fieldId: number) => {
    const result = await getFieldQualityAction(fieldId);
    if (result.ok) {
      setQuality(result.data);
      setQualityError(null);
    } else {
      setQuality(null);
      setQualityError(result.error);
    }
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      setQuality(null);
      setQualityError(null);
      return;
    }
    void loadQuality(selectedId);
  }, [selectedId, loadQuality]);

  const selectedField = fields?.find((field) => field.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl leading-none">Avaliações</CardTitle>
              <CardDescription>Pontuações e classificações registadas nos campos.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                onValueChange={(value) => setSelectedId(Number(value))}
                value={selectedId ? String(selectedId) : undefined}
              >
                <SelectTrigger aria-label="Selecionar campo" className="w-full sm:w-64">
                  <SelectValue placeholder="Selecionar campo" />
                </SelectTrigger>
                <SelectContent>
                  {fields?.map((field) => (
                    <SelectItem key={field.id} value={String(field.id)}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {listLoading && !fields ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton className="h-14 w-full rounded-xl" key={index} />
              ))}
            </div>
          ) : listError ? (
            <p className="text-destructive text-sm">{listError}</p>
          ) : selectedField ? (
            <>
              <FieldQualitySummary field={selectedField} quality={quality} failed={Boolean(qualityError)} />
              {qualityError ? (
                <p className="text-muted-foreground text-xs">A avaliação não pôde ser carregada: {qualityError}</p>
              ) : null}
            </>
          ) : fields && fields.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageSquareWarning />
                </EmptyMedia>
                <EmptyTitle>Sem campos avaliados</EmptyTitle>
                <EmptyDescription>Crie um campo para começar a avaliar a qualidade.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Denúncias</CardTitle>
          <CardDescription>Reclamações sobre condições, segurança ou informação incorrecta.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareWarning />
              </EmptyMedia>
              <EmptyTitle>Sem denúncias registadas</EmptyTitle>
              <EmptyDescription>
                Investigar reclamações sobre condições, segurança ou informação incorrecta sobre os campos.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/fields/disponibilidade">Consultar disponibilidade e agenda</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  );
}
