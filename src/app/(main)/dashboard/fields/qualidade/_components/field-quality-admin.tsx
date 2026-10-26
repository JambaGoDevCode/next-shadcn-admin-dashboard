"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Field, FieldQuality, FieldQualityCriteria } from "@/lib/api/types";
import { getFieldQualityAction, listFieldsAction, rateFieldAction } from "@/server/actions/management";

import { FieldQualitySummary } from "../../_components/field-quality-summary";

const QUALITY_CRITERIA: { value: FieldQualityCriteria; label: string }[] = [
  { value: "RELVADO", label: "Relvado" },
  { value: "ILUMINACAO", label: "Iluminação" },
  { value: "REDES", label: "Redes" },
  { value: "BALNEARIOS", label: "Balneários" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "COBERTURA", label: "Cobertura" },
  { value: "ESTACIONAMENTO", label: "Estacionamento" },
  { value: "BOLA_INCLUIDA", label: "Bola incluída" },
];

const RATING_OPTIONS = ["1", "2", "3", "4", "5"];

/**
 * Qualidade dos campos: avaliações por critério, pontuação consolidada e
 * classificação — com registo de novas avaliações (`POST /fields/quality/rate`).
 */
export function FieldQualityAdmin() {
  const [fields, setFields] = useState<Field[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [_refreshKey, setRefreshKey] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [quality, setQuality] = useState<FieldQuality | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  const [evalOpen, setEvalOpen] = useState(false);
  const [criteria, setCriteria] = useState<FieldQualityCriteria | undefined>(undefined);
  const [value, setValue] = useState("5");
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  const _refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

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

  function openEvaluation() {
    setCriteria(undefined);
    setValue("5");
    setComment("");
    setEvalOpen(true);
  }

  function handleRate() {
    if (selectedId === null) return;
    const parsedValue = Number(value);
    if (!criteria) {
      toast.error("Selecione o critério avaliado.");
      return;
    }
    if (!Number.isInteger(parsedValue) || parsedValue < 1 || parsedValue > 5) {
      toast.error("A avaliação deve estar entre 1 e 5.");
      return;
    }
    startTransition(async () => {
      const result = await rateFieldAction({
        fieldId: selectedId,
        criteria,
        value: parsedValue,
        comment: comment.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Avaliação registada.");
      setEvalOpen(false);
      void loadQuality(selectedId);
    });
  }

  const selectedField = fields?.find((field) => field.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl leading-none">Campos avaliados</CardTitle>
              <CardDescription>Consultar pontuações e registar novas avaliações.</CardDescription>
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
              <Button disabled={selectedId === null} onClick={openEvaluation} size="sm">
                <Check /> Avaliar
              </Button>
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
                  <Check />
                </EmptyMedia>
                <EmptyTitle>Sem campos avaliados</EmptyTitle>
                <EmptyDescription>Crie um campo para começar a avaliar a qualidade.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avaliar campo</DialogTitle>
            <DialogDescription>
              Registe uma avaliação por critério (1–5) aplicada à classificação do campo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Critério</p>
              <Select onValueChange={(value) => setCriteria(value as FieldQualityCriteria)} value={criteria}>
                <SelectTrigger aria-label="Critério de avaliação" className="w-full">
                  <SelectValue placeholder="Selecionar critério" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_CRITERIA.map((entry) => (
                    <SelectItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Avaliação (1–5)</p>
              <Select onValueChange={setValue} value={value}>
                <SelectTrigger aria-label="Avaliação" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATING_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Comentário (opcional)</p>
              <Input id="field-quality-comment" value={comment} onChange={(event) => setComment(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEvalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={pending || selectedId === null} onClick={handleRate}>
              {pending ? "A registar..." : "Registar avaliação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
