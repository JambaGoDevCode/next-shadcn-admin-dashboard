"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Booking, Field, RecentUser } from "@/lib/api/types";
import { bookingStatusLabel, formatDateTime, formatKz, statusTone } from "@/lib/format";
import { listBookingsAction, listFieldsAction } from "@/server/actions/management";
import { listUsersAction } from "@/server/actions/users";

import type { ReservationsView } from "./reservas-page";

interface ReservationsAdminProps {
  view: ReservationsView;
}

type CalendarScale = "day" | "week" | "month";

function normalizedStatus(status: string): string {
  return status
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
}

function matchesView(booking: Booking, view: ReservationsView): boolean {
  const status = normalizedStatus(booking.status);
  if (view === "pending") return /PENDING|AWAITING|WAITING|PENDENTE/.test(status);
  if (view === "confirmed") return /CONFIRM|PAID|VALID|ACCEPTED|CONFIRMADA/.test(status);
  if (view === "cancellations") return /CANCEL|REJECT|EXPIRE|REFUND/.test(status);
  return true;
}

function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function findOverlappingBookingIds(bookings: Booking[]): Set<number> {
  const active = bookings.filter((booking) => !/CANCEL|REJECT|EXPIRE/.test(normalizedStatus(booking.status)));
  const conflicts = new Set<number>();

  for (let index = 0; index < active.length; index += 1) {
    const current = active[index];
    if (!current.startTime || !current.endTime) continue;
    const currentStart = new Date(current.startTime).getTime();
    const currentEnd = new Date(current.endTime).getTime();
    if (Number.isNaN(currentStart) || Number.isNaN(currentEnd)) continue;

    for (let otherIndex = index + 1; otherIndex < active.length; otherIndex += 1) {
      const other = active[otherIndex];
      if (current.fieldId !== other.fieldId || !other.startTime || !other.endTime) continue;
      const otherStart = new Date(other.startTime).getTime();
      const otherEnd = new Date(other.endTime).getTime();
      if (Number.isNaN(otherStart) || Number.isNaN(otherEnd)) continue;
      if (currentStart < otherEnd && otherStart < currentEnd) {
        conflicts.add(current.id);
        conflicts.add(other.id);
      }
    }
  }

  return conflicts;
}

function calendarRange(dateValue: string, scale: CalendarScale): { start: Date; end: Date } {
  const selected = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  const start = Number.isNaN(selected.getTime()) ? new Date() : selected;
  start.setHours(0, 0, 0, 0);

  if (scale === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  } else if (scale === "month") {
    start.setDate(1);
  }

  const end = new Date(start);
  if (scale === "day") end.setDate(end.getDate() + 1);
  if (scale === "week") end.setDate(end.getDate() + 7);
  if (scale === "month") end.setMonth(end.getMonth() + 1);
  return { start, end };
}

export function ReservationsAdmin({ view }: ReservationsAdminProps) {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestIdRef = useRef(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [calendarDate, setCalendarDate] = useState(() => toDateInputValue(new Date().toISOString()));
  const [calendarScale, setCalendarScale] = useState<CalendarScale>("week");
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const loadReservations = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setBookingsError(null);
    setFieldsError(null);
    setUsersError(null);

    listBookingsAction()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) {
          setBookings(result.data);
        } else {
          setBookings(null);
          setBookingsError(result.error);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setBookings(null);
          setBookingsError("Não foi possível carregar as reservas.");
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });

    listFieldsAction()
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) {
          setFields(result.data);
        } else {
          setFieldsError(result.error);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setFieldsError("Não foi possível carregar os nomes dos campos.");
        }
      });

    listUsersAction(100)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (result.ok) {
          setUsers(result.data);
        } else {
          setUsersError(result.error);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setUsersError("Não foi possível carregar os nomes dos utilizadores recentes.");
        }
      });
  }, []);

  useEffect(() => {
    loadReservations();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadReservations]);

  const fieldNames = useMemo(() => new Map(fields.map((field) => [field.id, field.name])), [fields]);
  const userNames = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);
  const conflictIds = useMemo(() => findOverlappingBookingIds(bookings ?? []), [bookings]);
  const statusOptions = useMemo(
    () => [...new Set((bookings ?? []).map((booking) => booking.status))].sort(),
    [bookings],
  );
  const filteredBookings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-PT");
    return (bookings ?? [])
      .filter((booking) => (view === "conflicts" ? conflictIds.has(booking.id) : matchesView(booking, view)))
      .filter((booking) => statusFilter === "all" || booking.status === statusFilter)
      .filter((booking) => fieldFilter === "all" || String(booking.fieldId) === fieldFilter)
      .filter((booking) => {
        const date = toDateInputValue(booking.startTime);
        return (!fromDate || (date && date >= fromDate)) && (!toDate || (date && date <= toDate));
      })
      .filter((booking) => {
        if (!query) return true;
        const fieldName = fieldNames.get(booking.fieldId) ?? "";
        const userName = booking.userId == null ? "" : (userNames.get(booking.userId) ?? "");
        return [booking.id, booking.fieldId, booking.userId ?? "", userName, fieldName, booking.status]
          .join(" ")
          .toLocaleLowerCase("pt-PT")
          .includes(query);
      })
      .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
  }, [bookings, conflictIds, fieldFilter, fieldNames, fromDate, search, statusFilter, toDate, userNames, view]);

  const selectedBooking = bookings?.find((booking) => booking.id === selectedBookingId) ?? null;
  const calendarBookings = useMemo(() => {
    if (view !== "calendar") return [];
    const { start, end } = calendarRange(calendarDate, calendarScale);
    return filteredBookings.filter((booking) => {
      if (!booking.startTime) return false;
      const date = new Date(booking.startTime);
      return !Number.isNaN(date.getTime()) && date >= start && date < end;
    });
  }, [calendarDate, calendarScale, filteredBookings, view]);

  const bookingsToRender = view === "calendar" ? calendarBookings : filteredBookings;
  const results = (() => {
    if (bookingsError) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar as reservas</AlertTitle>
          <AlertDescription>{bookingsError}</AlertDescription>
        </Alert>
      );
    }

    if (loading) return <Skeleton className="h-48 w-full" />;

    if (view === "calendar") {
      return (
        <div className="flex flex-col gap-3">
          {calendarBookings.length ? (
            calendarBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                className="flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => setSelectedBookingId(booking.id)}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Reserva #{booking.id}</span>
                  <span className="text-muted-foreground text-sm">
                    {formatDateTime(booking.startTime)}–{formatDateTime(booking.endTime)} ·{" "}
                    {fieldNames.get(booking.fieldId) ?? `Campo #${booking.fieldId}`}
                  </span>
                </div>
                <Badge variant="outline" className={statusTone(booking.status)}>
                  {bookingStatusLabel(booking.status)}
                </Badge>
              </button>
            ))
          ) : (
            <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
              Não existem reservas neste período.
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referência</TableHead>
              <TableHead>Campo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data e hora</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookingsToRender.length ? (
              bookingsToRender.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">#{booking.id}</TableCell>
                  <TableCell>{fieldNames.get(booking.fieldId) ?? `Campo #${booking.fieldId}`}</TableCell>
                  <TableCell>
                    {booking.userId == null ? "—" : (userNames.get(booking.userId) ?? `Utilizador #${booking.userId}`)}
                  </TableCell>
                  <TableCell>{formatDateTime(booking.startTime)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusTone(booking.status)}>
                      {bookingStatusLabel(booking.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {booking.totalPrice == null ? "—" : formatKz(booking.totalPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBookingId((current) => (current === booking.id ? null : booking.id))}
                    >
                      {selectedBookingId === booking.id ? "Fechar" : "Consultar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Não foram encontradas reservas para estes filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  })();

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl leading-none">Gestão de reservas</CardTitle>
              <CardDescription>
                {bookings === null ? "Dados consultados na API de reservas." : `${bookingsToRender.length} reserva(s)`}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadReservations} disabled={loading}>
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pt-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Input
              aria-label="Pesquisar referência, campo ou cliente"
              placeholder="Referência, campo ou cliente"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger aria-label="Filtrar por campo">
                <SelectValue placeholder="Todos os campos" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos os campos</SelectItem>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={String(field.id)}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filtrar por estado">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {bookingStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              aria-label="Data inicial"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
            <Input
              aria-label="Data final"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </div>

          {view === "calendar" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                aria-label="Data do calendário"
                type="date"
                value={calendarDate}
                onChange={(event) => setCalendarDate(event.target.value)}
              />
              <Select value={calendarScale} onValueChange={(value) => setCalendarScale(value as CalendarScale)}>
                <SelectTrigger aria-label="Escala do calendário">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="day">Dia</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {view === "cancellations" && (
            <Alert>
              <AlertTitle>Dados de cancelamento limitados</AlertTitle>
              <AlertDescription>
                A API de reservas não disponibiliza o motivo, o autor do cancelamento nem as consequências financeiras.
              </AlertDescription>
            </Alert>
          )}
          {view === "conflicts" && (
            <Alert>
              <AlertTitle>Conflitos identificados automaticamente</AlertTitle>
              <AlertDescription>
                São listadas reservas com horários sobrepostos no mesmo campo. A resolução ainda requer revisão
                operacional.
              </AlertDescription>
            </Alert>
          )}
          <Alert>
            <AlertTitle>Proteção do histórico financeiro</AlertTitle>
            <AlertDescription>
              Esta área é apenas de consulta: a API não disponibiliza operações auditadas para alterar reservas pagas,
              cancelar reservas ou encaminhar reembolsos. Nenhum preço ou horário histórico é editado aqui.
            </AlertDescription>
          </Alert>

          {results}
          {fieldsError && (
            <p className="text-muted-foreground text-xs">{fieldsError} Os campos serão apresentados por ID.</p>
          )}
          <p className="text-muted-foreground text-xs">
            A pesquisa por nome consulta os 100 utilizadores mais recentes; os restantes ficam identificados pelo ID.
          </p>
          {usersError && <p className="text-muted-foreground text-xs">{usersError} Pesquise por ID do utilizador.</p>}
        </CardContent>
      </Card>

      {selectedBooking && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da reserva #{selectedBooking.id}</CardTitle>
            <CardDescription>Informação disponibilizada pela API e registo de criação/atualização.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <p>
              <span className="text-muted-foreground">Campo:</span>{" "}
              {fieldNames.get(selectedBooking.fieldId) ?? `Campo #${selectedBooking.fieldId}`}
            </p>
            <p>
              <span className="text-muted-foreground">Cliente:</span>{" "}
              {selectedBooking.userId == null
                ? "—"
                : (userNames.get(selectedBooking.userId) ?? `Utilizador #${selectedBooking.userId}`)}
            </p>
            <p>
              <span className="text-muted-foreground">Estado:</span> {bookingStatusLabel(selectedBooking.status)}
            </p>
            <p>
              <span className="text-muted-foreground">Início:</span> {formatDateTime(selectedBooking.startTime)}
            </p>
            <p>
              <span className="text-muted-foreground">Fim:</span> {formatDateTime(selectedBooking.endTime)}
            </p>
            <p>
              <span className="text-muted-foreground">Valor registado:</span>{" "}
              {selectedBooking.totalPrice == null ? "—" : formatKz(selectedBooking.totalPrice)}
            </p>
            <p>
              <span className="text-muted-foreground">Criada em:</span> {formatDateTime(selectedBooking.createdAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Atualizada em:</span> {formatDateTime(selectedBooking.updatedAt)}
            </p>
            {conflictIds.has(selectedBooking.id) && (
              <p className="font-medium text-destructive">Esta reserva tem sobreposição com outra reserva do campo.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
