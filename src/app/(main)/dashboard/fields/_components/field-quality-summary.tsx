"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Field, FieldQuality } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

/** Classificação derivada do score 0–100 (Excelente >= 80, Bom >= 60, Fraco < 60). */
export function fieldQualityLabel(score: number | null | undefined): string {
  if (score == null) return "—";
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  return "Fraco";
}

function fieldQualityVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "outline";
}

interface FieldQualitySummaryProps {
  field: Field;
  quality: FieldQuality | null;
  failed?: boolean;
}

/** Resumo de avaliação/qualidade de um campo — usado por Qualidade e Avaliações. */
export function FieldQualitySummary({ field, quality, failed = false }: FieldQualitySummaryProps) {
  if (failed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qualidade</CardTitle>
          <CardDescription>{field.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            — Sem pontuação: o endpoint de qualidade não devolveu dados para este campo.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (quality == null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qualidade</CardTitle>
          <CardDescription>{field.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sem avaliações registadas para este campo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Qualidade</CardTitle>
        <CardDescription>{field.name}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Pontuação</p>
            <p className="font-medium text-2xl tabular-nums leading-none">{quality.score.value}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Classificação</p>
            <Badge variant={fieldQualityVariant(quality.score.value)}>{fieldQualityLabel(quality.score.value)}</Badge>
          </div>
        </div>
        {quality.updatedAt ? <p className="text-muted-foreground text-xs">Última avaliação: {formatDateTime(quality.updatedAt)}</p> : null}
      </CardContent>
    </Card>
  );
}
