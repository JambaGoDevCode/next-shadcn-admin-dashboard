import Link from "next/link";

import { ArrowRight, CreditCard, MapPin, Package, ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConversionsOverview, Field, StoreOrderList } from "@/lib/api/types";

import type { ResourceState } from "./load-resource";

export interface AlertsListProps {
  fields: ResourceState<Field[]>;
  conversions: ResourceState<ConversionsOverview>;
  orders: ResourceState<StoreOrderList>;
}

interface AlertRow {
  id: string;
  icon: typeof MapPin;
  title: string;
  description: string;
  value: string;
  href: string;
}

export function AlertsList({ fields, conversions, orders }: AlertsListProps) {
  const pendingPayments = conversions.data
    ? Math.max(conversions.data.payments.created - conversions.data.payments.paid, 0)
    : null;

  const overdueOrders = (orders.data?.items ?? []).filter((order) => {
    if (order.status !== "PENDING_PAYMENT") return false;
    const created = new Date(order.createdAt).getTime();
    return Number.isFinite(created) && Date.now() - created > 3 * 24 * 60 * 60 * 1000;
  }).length;

  const inactiveFields = (fields.data ?? []).filter((field) => field.isActive === false).length;

  const rows: AlertRow[] = [
    {
      id: "fields",
      icon: MapPin,
      title: "Campos por aprovar",
      description: "Campos registados mas ainda inativos na plataforma.",
      value: fields.failed ? "—" : String(inactiveFields),
      href: "/dashboard/fields",
    },
    {
      id: "payments",
      icon: CreditCard,
      title: "Pagamentos em análise",
      description: "Pagamentos criados que ainda não foram confirmados.",
      value: conversions.failed || pendingPayments === null ? "—" : String(pendingPayments),
      href: "/dashboard/finance",
    },
    {
      id: "orders",
      icon: Package,
      title: "Encomendas atrasadas",
      description: "Encomendas sem pagamento há mais de 3 dias.",
      value: orders.failed ? "—" : String(overdueOrders),
      href: "/dashboard/store",
    },
    {
      id: "reports",
      icon: ShieldAlert,
      title: "Denúncias por tratar",
      description: "Reclamações e conflitos reportados pelos utilizadores.",
      value: "—",
      href: "/dashboard/mail",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alertas e pendências</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="group flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                  <row.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{row.title}</p>
                  <p className="text-muted-foreground truncate text-sm">{row.description}</p>
                </div>
                <span className="text-2xl leading-none tracking-tight tabular-nums">{row.value}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
