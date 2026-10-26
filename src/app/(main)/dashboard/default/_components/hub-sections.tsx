import type { ReactNode } from "react";

import {
  CalendarCheck,
  ChartColumn,
  CircleCheckBig,
  MapPin,
  MessageSquareWarning,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Swords,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

import type { AudienceOverview, Match, MetricsOverview, StoreMetrics, StoreOverview, Tournament } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

import { ModuleCard, type ModuleCardProps } from "./module-card";

export interface ResourceState<T> {
  data: T | null;
  failed: boolean;
}

export interface HubData {
  metrics: ResourceState<MetricsOverview>;
  matches: ResourceState<Match[]>;
  tournaments: ResourceState<Tournament[]>;
  storeMetrics: ResourceState<StoreMetrics>;
  storeOverview: ResourceState<StoreOverview>;
  audience: ResourceState<AudienceOverview>;
}

/** Renders a metric line from a loaded resource — "—" when the fetch failed or returned nothing. */
function line<T>(resource: ResourceState<T>, render: (data: T) => string): string {
  if (resource.failed || resource.data === null) return "—";
  return render(resource.data);
}

/** Combines two loaded resources — "—" unless both are available. */
function line2<A, B>(left: ResourceState<A>, right: ResourceState<B>, render: (left: A, right: B) => string): string {
  if (left.failed || left.data === null || right.failed || right.data === null) return "—";
  return render(left.data, right.data);
}

/** Signed percentage in pt-BR notation (e.g. "+4,2%" / "n/d"). */
function pct(value: number | null): string {
  if (value === null) return "n/d";
  return `${value > 0 ? "+" : ""}${value.toFixed(1).replace(".", ",")}%`;
}

function HubSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-medium text-muted-foreground text-xs tracking-wider uppercase">{label}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function HubSections({ metrics, matches, tournaments, storeMetrics, storeOverview, audience }: HubData) {
  const now = Date.now();

  const operational: ModuleCardProps[] = [
    {
      href: "/dashboard/users",
      icon: Users,
      title: "Utilizadores",
      description: "Contas, perfis e bloqueios.",
      metric: line(metrics, (m) => `${m.users.total} contas · ${m.users.active} ativas`),
    },
    {
      href: "/dashboard/teams",
      icon: CircleCheckBig,
      title: "Equipas",
      description: "Equipas, membros e estado.",
      metric: line(metrics, (m) => `${m.teams.total} equipas · ${m.teams.active} ativas`),
    },
    {
      href: "/dashboard/fields",
      icon: MapPin,
      title: "Campos",
      description: "Registos, qualidade e disponibilidade.",
      metric: line(metrics, (m) => `${m.fields.total} campos · ${m.fields.available} disponíveis`),
    },
    {
      href: "/dashboard/calendar",
      icon: CalendarCheck,
      title: "Reservas",
      description: "Agendamentos e cancelamentos.",
      metric: line(metrics, (m) => `${m.bookings.total} reservas · ${m.bookings.pending} pendentes`),
    },
    {
      href: "/dashboard/logistics",
      icon: Swords,
      title: "Jogos e desafios",
      description: "Partidas e confrontos.",
      metric: line(matches, (rows) => {
        const upcoming = rows.filter((match) => new Date(match.matchDate).getTime() > now).length;
        return `${rows.length} partidas · ${upcoming} agendadas`;
      }),
    },
    {
      href: "/dashboard/championships",
      icon: Trophy,
      title: "Torneios",
      description: "Inscrições, fases e resultados.",
      metric: line(tournaments, (rows) => {
        const inProgress = rows.filter((row) => row.status === "IN_PROGRESS").length;
        return `${rows.length} torneios · ${inProgress} em curso`;
      }),
    },
    {
      href: "/dashboard/store",
      icon: ShoppingBag,
      title: "Loja",
      description: "Produtos, stock e encomendas.",
      metric: line2(
        storeMetrics,
        storeOverview,
        (m, o) => `${m.products.total} produtos · ${m.stock.units} em stock · ${o.orders.total} encomendas (30 d)`,
      ),
    },
    {
      href: "/dashboard/finance",
      icon: ChartColumn,
      title: "Financeiro",
      description: "Transações, comissões e reconciliação.",
      metric: line(metrics, (m) => `Receita ${formatKz(m.revenue.current)} · ${pct(m.revenue.deltaPct)} (30 d)`),
    },
    {
      href: "/dashboard/mail",
      icon: MessageSquareWarning,
      title: "Suporte e denúncias",
      description: "Reclamações, conflitos e incidentes.",
    },
    {
      href: "/dashboard/analytics",
      icon: TrendingUp,
      title: "Relatórios",
      description: "Desempenho e indicadores de negócio.",
      metric: line(
        audience,
        (a) => `${a.conversion.rate.toFixed(1).replace(".", ",")}% conversão · ${a.conversion.bookers} compradores (30 d)`,
      ),
    },
  ];

  const configItem: ModuleCardProps = {
    href: "/dashboard/infrastructure",
    icon: SlidersHorizontal,
    title: "Configurações da plataforma",
    description: "Modalidades, localização, regras, preços, permissões e integrações.",
    iconVariant: "boxed",
  };

  const accessItem: ModuleCardProps = {
    href: "/dashboard/roles",
    icon: ShieldCheck,
    title: "Acesso, segurança e auditoria",
    description: "Administradores, papéis, permissões e histórico de alterações.",
    iconVariant: "boxed",
  };

  return (
    <>
      <HubSection label="Operação — informação dinâmica">
        {operational.map((item) => (
          <ModuleCard key={item.href} {...item} />
        ))}
      </HubSection>

      <HubSection label="Configurações — parâmetros e regras">
        <ModuleCard {...configItem} />
      </HubSection>

      <HubSection label="Controle e administração">
        <ModuleCard {...accessItem} />
      </HubSection>
    </>
  );
}
