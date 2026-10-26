"use client";

import { CalendarX2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { Booking } from "@/lib/api/types";
import { bookingStatusLabel, formatKz } from "@/lib/format";

const chartConfig = {
  total: {
    label: "Reservas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface BookingsStatusChartProps {
  bookings: Booking[] | null;
  failed: boolean;
}

export function BookingsStatusChart({ bookings, failed }: BookingsStatusChartProps) {
  const counts = new Map<string, number>();
  for (const booking of bookings ?? []) {
    counts.set(booking.status, (counts.get(booking.status) ?? 0) + 1);
  }
  const data = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, total]) => ({ status: bookingStatusLabel(status), total }));

  const revenue = (bookings ?? []).reduce((sum, booking) => sum + (booking.totalPrice ?? 0), 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Funil de reservas</CardTitle>
          <CardDescription>
            {revenue > 0 ? `Receita total ${formatKz(revenue)}` : "Reservas por estado de confirmação"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {failed ? (
          <div className="flex h-54 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar as reservas.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-54 flex-col items-center justify-center gap-2 text-center">
            <CalendarX2 className="size-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Nenhuma reserva registada ainda.</p>
            <p className="text-muted-foreground/70 text-xs">
              Assim que os clientes reservarem quadras, o funil aparece aqui.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-54 w-full">
            <BarChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
