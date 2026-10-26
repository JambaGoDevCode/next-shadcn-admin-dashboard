"use client";

import { useCallback, useEffect, useState } from "react";

import { CalendarClock, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Booking, Field, Match } from "@/lib/api/types";
import { bookingStatusLabel, formatDateTime, formatKz, matchStatusLabel } from "@/lib/format";
import {
  listBookingsAction,
  listFieldMatchesAction,
  listFieldsAction,
  updateFieldAction,
} from "@/server/actions/management";

/** Intervalos [start, end) que se sobrepõem — conflito de agenda. */
function hasOverlap(aStart?: string, aEnd?: string, bStart?: string, bEnd?: string): boolean {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  const aStartMs = new Date(aStart).getTime();
  const aEndMs = new Date(aEnd).getTime();
  const bStartMs = new Date(bStart).getTime();
  const bEndMs = new Date(bEnd).getTime();
  if (Number.isNaN(aStartMs) || Number.isNaN(aEndMs) || Number.isNaN(bStartMs) || Number.isNaN(bEndMs)) return false;
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

/**
 * Disponibilidade: horários, reservas, indisponibilidades e conflitos de
 * agenda por campo — a partir de `GET /bookings`, `GET /matches/field/:id` e
 * do estado operacional (`PUT /fields/:id`).
 */
export function FieldAvailabilityAdmin() {
  const [fields, setFields] = useState<Field[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [_refreshKey, setRefreshKey] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [matches, setMatches] = useState<Match[] | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [toggling, setToggling] = useState(false);

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

  useEffect(() => {
    if (selectedId === null) {
      setBookings(null);
      setMatches(null);
      return;
    }
    let cancelled = false;
    setLoadingBookings(true);
    setLoadingMatches(true);

    listBookingsAction(selectedId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setBookings(result.data);
          setBookingsError(null);
        } else {
          setBookings(null);
          setBookingsError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setBookings(null);
        setBookingsError("Não foi possível carregar as reservas.");
      })
      .finally(() => {
        if (!cancelled) setLoadingBookings(false);
      });

    listFieldMatchesAction(selectedId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setMatches(result.data);
          setMatchesError(null);
        } else {
          setMatches(null);
          setMatchesError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMatches(null);
        setMatchesError("Não foi possível carregar as partidas.");
      })
      .finally(() => {
        if (!cancelled) setLoadingMatches(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const field = fields?.find((candidate) => candidate.id === selectedId) ?? null;
  const activeBookings = (bookings ?? []).filter((booking) => booking.status !== "CANCELLED");
  const hasConflict = activeBookings.some((a, index) =>
    activeBookings.some(
      (b, otherIndex) => otherIndex !== index && hasOverlap(a.startTime, a.endTime, b.startTime, b.endTime),
    ),
  );

  async function handleToggleAvailability() {
    if (selectedId === null) return;
    setToggling(true);
    const result = await updateFieldAction(selectedId, { isAvailable: !field?.isAvailable });
    setToggling(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(result.data.isAvailable ? "Campo marcado como disponível." : "Campo marcado como indisponível.");
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl leading-none">Agenda do campo</CardTitle>
              <CardDescription>Horários, reservas e conflitos de agenda.</CardDescription>
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
                  {fields?.map((candidate) => (
                    <SelectItem key={candidate.id} value={String(candidate.id)}>
                      {candidate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                disabled={selectedId === null || toggling}
                onClick={() => void handleToggleAvailability()}
                size="sm"
              >
                <CalendarClock /> {field?.isAvailable ? "Marcar indisponível" : "Marcar disponível"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {listLoading && !fields && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton className="h-14 w-full rounded-xl" key={`field-skeleton-${index}`} />
              ))}
            </div>
          )}
          {listError && <p className="text-destructive text-sm">{listError}</p>}
          {field && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Estado operacional</p>
                  <Badge variant={field.isAvailable ? "default" : "secondary"}>
                    {field.isAvailable ? "Disponível" : "Indisponível"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Preço por hora</p>
                  <p className="font-medium text-sm tabular-nums">{formatKz(field.pricePerHour ?? 0)}</p>
                </div>
              </div>
              {hasConflict ? (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
                  <TriangleAlert className="size-4 shrink-0" />
                  Conflito de agenda detetado entre reservas do campo.
                </div>
              ) : null}
            </>
          )}
          {!field && !listLoading && !listError && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClock />
                </EmptyMedia>
                <EmptyTitle>Sem campo selecionado</EmptyTitle>
                <EmptyDescription>Escolha um campo para consultar a agenda e as disponibilidades.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reservas</CardTitle>
          <CardDescription>Horários reservados e bloqueios por campo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loadingBookings && <Skeleton className="h-24 w-full" />}
          {!loadingBookings && bookingsError && <p className="text-destructive text-sm">{bookingsError}</p>}
          {!loadingBookings && !bookingsError && !bookings && (
            <p className="text-muted-foreground text-sm">Sem reservas registadas para este campo.</p>
          )}
          {!loadingBookings && !bookingsError && bookings && bookings.length > 0 && (
            <ul className="divide-y">
              {bookings.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">
                      {formatDateTime(booking.startTime)} · {formatDateTime(booking.endTime)}
                    </p>
                    <p className="text-muted-foreground text-xs">Reserva #{booking.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{bookingStatusLabel(booking.status)}</Badge>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {formatKz(booking.totalPrice ?? 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Partidas</CardTitle>
          <CardDescription>Partidas agendadas, adiadas ou concluídas no campo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loadingMatches && <Skeleton className="h-24 w-full" />}
          {!loadingMatches && matchesError && <p className="text-muted-foreground text-sm">{matchesError}</p>}
          {!loadingMatches && !matchesError && !matches && (
            <p className="text-muted-foreground text-sm">Sem partidas registadas para este campo.</p>
          )}
          {!loadingMatches && !matchesError && matches && matches.length > 0 && (
            <ul className="divide-y">
              {matches.map((match) => (
                <li key={match.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm">
                      {match.homeScore ?? 0} — {match.awayScore ?? 0}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatDateTime(match.matchDate)}</p>
                  </div>
                  <Badge variant="outline">{matchStatusLabel(match.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
