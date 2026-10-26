import { MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Booking, City, Field, Match } from "@/lib/api/types";
import { createCityLabeler, formatDate, formatKz } from "@/lib/format";

interface FieldsPortfolioProps {
  fields: Field[];
  cities: City[];
  matches: Match[];
  bookings: Booking[];
  failed: boolean;
}

function fieldState(field: Field): { label: string; className: string } {
  if (field.isActive === false) {
    return {
      label: "Inativo",
      className:
        "border-red-300 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:bg-red-500/15 dark:text-red-300",
    };
  }
  if (field.isAvailable === false) {
    return {
      label: "Indisponível",
      className:
        "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/15 dark:text-amber-300",
    };
  }
  return {
    label: "Disponível",
    className:
      "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
}

export function FieldsPortfolio({ fields, cities, matches, bookings, failed }: FieldsPortfolioProps) {
  const cityLabel = createCityLabeler(cities);

  const rows = fields
    .map((field) => {
      const fieldMatches = matches.filter((match) => match.fieldId === field.id);
      const fieldBookings = bookings.filter((booking) => booking.fieldId === field.id);
      const revenue = fieldBookings.reduce((sum, booking) => sum + (booking.totalPrice ?? 0), 0);

      const lastDates = [
        ...fieldMatches.map((match) => match.matchDate),
        ...fieldBookings.map((booking) => booking.startTime),
      ].filter((date): date is string => Boolean(date));
      const lastActivity = lastDates.sort().at(-1) ?? null;

      return { field, matches: fieldMatches.length, bookings: fieldBookings.length, revenue, lastActivity };
    })
    .sort(
      (a, b) =>
        b.revenue - a.revenue ||
        b.matches - a.matches ||
        b.bookings - a.bookings ||
        a.field.name.localeCompare(b.field.name),
    );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Carteira de quadras</CardTitle>
          <CardDescription>
            Os clientes da plataforma: donos de quadra que recebem as equipas. Ordenado por receita gerada.
          </CardDescription>
        </div>
        <CardAction>
          <Badge variant="secondary">{fields.length} quadras</Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        {failed ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-red-300 bg-red-500/10 px-4 py-10 text-center dark:border-red-900/40">
            <p className="font-medium text-red-700 dark:text-red-300">Não foi possível carregar as quadras.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">
              Verifique se a API está em execução e tente novamente.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <MapPin className="size-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Nenhuma quadra cadastrada ainda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quadra</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Preço/hora</TableHead>
                <TableHead className="text-right">Partidas</TableHead>
                <TableHead className="text-right">Reservas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ field, matches: matchCount, bookings: bookingCount, revenue, lastActivity }) => {
                const state = fieldState(field);
                return (
                  <TableRow key={field.id}>
                    <TableCell>
                      <div className="font-medium">{field.name}</div>
                      <div className="text-muted-foreground text-xs">{field.address ?? "Sem endereço"}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cityLabel(field.cityId)}</TableCell>
                    <TableCell className="text-right">
                      {field.pricePerHour != null ? formatKz(field.pricePerHour) : "—"}
                    </TableCell>
                    <TableCell className="text-right">{matchCount}</TableCell>
                    <TableCell className="text-right">{bookingCount}</TableCell>
                    <TableCell className="text-right">{revenue > 0 ? formatKz(revenue) : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(lastActivity)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={state.className}>
                        {state.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
