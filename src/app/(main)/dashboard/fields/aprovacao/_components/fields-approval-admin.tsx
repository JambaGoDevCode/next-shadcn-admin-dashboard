"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { Check, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { City, Field } from "@/lib/api/types";
import { createCityLabeler, formatKz, plural } from "@/lib/format";
import { listCitiesAction, listFieldsAction, updateFieldAction } from "@/server/actions/management";

/**
 * Aprovação de campos: fila operacional com as decisões sobre a publicação.
 *
 * A API ainda não expõe um estado «pending» de aprovação — o registo nasce já
 * publicado (`isActive`/`isAvailable`) e a publicação pode ser suspensa via
 * `PUT /fields/:id`. Este ecrã concentra as ações de aprovação, rejeição (não
 * publicação) e suspensão sobre os campos consultados.
 */
export function FieldsApprovalAdmin() {
  const [fields, setFields] = useState<Field[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [_refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

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
  }, []);

  const cityLabel = createCityLabeler(cities);
  const publishedCount = (fields ?? []).filter((field) => field.isAvailable).length;

  async function handleSetAvailability(field: Field, isAvailable: boolean) {
    const result = await updateFieldAction(field.id, { isAvailable });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      result.data.isAvailable
        ? `Campo ${field.name} aprovado e publicado.`
        : `Campo ${field.name} suspenso da publicação.`,
    );
    refresh();
  }

  let body: ReactNode;
  if (listLoading && !fields) {
    body = (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-14 w-full rounded-xl" key={index} />
        ))}
      </div>
    );
  } else if (listError) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <p className="text-destructive text-sm">{listError}</p>
        <Button onClick={refresh} size="sm" variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  } else if (!fields || fields.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Check />
          </EmptyMedia>
          <EmptyTitle>Nenhum campo registado</EmptyTitle>
          <EmptyDescription>Crie o primeiro campo para começar a avaliar a sua publicação.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/dashboard/fields" className="font-medium text-primary text-sm hover:underline">
            Ir para Todos os campos
          </Link>
        </EmptyContent>
      </Empty>
    );
  } else {
    body = (
      <>
        <ul className="flex max-h-[26rem] flex-col gap-1.5 overflow-y-auto pr-1">
          {fields.map((field) => (
            <li
              key={field.id}
              className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-sm leading-tight">{field.name}</div>
                <div className="truncate text-muted-foreground text-xs">
                  {field.address ?? "—"} · {cityLabel(field.cityId)} · {formatKz(field.pricePerHour ?? 0)}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Badge variant={field.isAvailable ? "default" : "secondary"}>
                  {field.isAvailable ? "Publicado" : "Indisponível"}
                </Badge>
                {field.isAvailable ? (
                  <Button size="sm" variant="outline" onClick={() => void handleSetAvailability(field, false)}>
                    <X /> Suspender publicação
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => void handleSetAvailability(field, true)}>
                    <Check /> Aprovar publicação
                  </Button>
                )}
                <Link
                  href={`/dashboard/fields?fieldId=${field.id}`}
                  className="font-medium text-primary text-sm hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Verificar dados
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground text-xs">
          A ver {fields.length} {plural(fields.length, "campo", "campos")} · {publishedCount} publicados ·{" "}
          {fields.length - publishedCount} indisponíveis
        </p>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-normal text-muted-foreground text-sm">Campos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-3xl tabular-nums leading-none">{fields?.length ?? "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-normal text-muted-foreground text-sm">Publicados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-3xl tabular-nums leading-none">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-normal text-muted-foreground text-sm">Indisponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-3xl tabular-nums leading-none">
              {fields ? fields.length - publishedCount : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">Fila de aprovação</CardTitle>
          <CardDescription className="max-w-xl leading-snug">
            Registos de campos com as decisões sobre a publicação.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <Button
              aria-label="Recarregar fila de campos"
              disabled={listLoading}
              onClick={refresh}
              size="icon-sm"
              variant="ghost"
            >
              <RefreshCw className={listLoading ? "animate-spin" : undefined} />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">{body}</CardContent>
      </Card>
    </div>
  );
}
