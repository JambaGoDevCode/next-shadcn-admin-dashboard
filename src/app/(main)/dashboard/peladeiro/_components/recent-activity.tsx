import { CalendarCheck, Inbox, Package, UserPlus, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking, ConversionsOverview, RecentUser, StoreOrderList } from "@/lib/api/types";
import { bookingStatusLabel, formatDate, formatKz, orderStatusLabel, statusTone } from "@/lib/format";

import type { ResourceState } from "./load-resource";

export interface RecentActivityProps {
  users: ResourceState<RecentUser[]>;
  bookings: ResourceState<Booking[]>;
  orders: ResourceState<StoreOrderList>;
  payments: ResourceState<ConversionsOverview>;
}

function Empty({ children }: { children: string }) {
  return <p className="text-muted-foreground py-6 text-center text-sm">{children}</p>;
}

function Failed() {
  return <p className="py-6 text-center text-muted-foreground text-sm">— API indisponível</p>;
}

export function RecentActivity({ users, bookings, orders, payments }: RecentActivityProps) {
  const recentBookings = [...(bookings.data ?? [])]
    .sort((a, b) => (b.createdAt ?? b.startTime ?? "").localeCompare(a.createdAt ?? a.startTime ?? ""))
    .slice(0, 5);

  const recentOrders = (orders.data?.items ?? []).slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <UserPlus className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Novos registos</CardTitle>
        </CardHeader>
        <CardContent>
          {users.failed ? (
            <Failed />
          ) : users.data?.length ? (
            <ul className="divide-y text-sm">
              {users.data.slice(0, 5).map((user) => (
                <li key={user.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="text-muted-foreground truncate text-xs">{user.type}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {formatDate(user.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sem registos recentes.</Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <CalendarCheck className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Reservas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.failed ? (
            <Failed />
          ) : recentBookings.length ? (
            <ul className="divide-y text-sm">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium">Reserva #{booking.id} · Campo {booking.fieldId}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(booking.startTime ?? booking.createdAt ?? null)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline" className={statusTone(booking.status)}>
                      {bookingStatusLabel(booking.status)}
                    </Badge>
                    {booking.totalPrice != null && (
                      <span className="text-muted-foreground text-xs tabular-nums">{formatKz(booking.totalPrice)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sem reservas recentes.</Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Package className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Encomendas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.failed ? (
            <Failed />
          ) : recentOrders.length ? (
            <ul className="divide-y text-sm">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{order.orderNumber}</p>
                    <p className="text-muted-foreground text-xs">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="outline" className={statusTone(order.status)}>
                      {orderStatusLabel(order.status)}
                    </Badge>
                    <span className="text-muted-foreground text-xs tabular-nums">{formatKz(order.totalAmount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Sem encomendas recentes.</Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Wallet className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.failed ? (
            <Failed />
          ) : payments.data ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Criados (30 d)</span>
                <span className="font-medium tabular-nums">{payments.data.payments.created}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Pagos (30 d)</span>
                <span className="font-medium tabular-nums">{payments.data.payments.paid}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {payments.data.payments.byStatus.length ? (
                  payments.data.payments.byStatus.map((entry) => (
                    <Badge key={entry.status} variant="outline" className={statusTone(entry.status)}>
                      {entry.status}: {entry.count}
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-xs">Sem pagamentos no período.</span>
                )}
              </div>
            </div>
          ) : (
            <Empty>Sem dados de pagamentos.</Empty>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Inbox className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm">Incidentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <Inbox className="size-6 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Sem dados de incidentes.</p>
            <p className="text-muted-foreground/80 text-xs">Ainda não existe endpoint de incidentes na API.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
