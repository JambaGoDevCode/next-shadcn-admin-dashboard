import Link from "next/link";

import { ArrowRight, CalendarCheck, Clock, History, ScrollText, ShieldCheck, UserPlus } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

export type ActivityKind = "registo" | "termos" | "verificacao" | "acesso" | "reserva";

export interface ActivityEvent {
  key: string;
  kind: ActivityKind;
  userId: number;
  userName: string;
  at: string;
  detail?: string;
}

const KIND_META: Record<ActivityKind, { label: string; icon: typeof UserPlus }> = {
  registo: { label: "Registo", icon: UserPlus },
  termos: { label: "Termos aceites", icon: ScrollText },
  verificacao: { label: "E-mail verificado", icon: ShieldCheck },
  acesso: { label: "Último acesso", icon: Clock },
  reserva: { label: "Reserva criada", icon: CalendarCheck },
};

interface ActivityFeedProps {
  events: ActivityEvent[];
  /** Total de eventos antes do limite de exibição. */
  total: number;
  failed: boolean;
}

export function ActivityFeed({ events, total, failed }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Eventos</CardTitle>
        <CardDescription>
          Do mais recente para o mais antigo
          {total > events.length ? ` · a mostrar ${events.length} de ${total}` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {failed ? (
          <p className="text-muted-foreground py-6 text-center text-sm">— API indisponível</p>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <History className="size-6 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Sem eventos registados.</p>
          </div>
        ) : (
          <ul className="divide-y text-sm">
            {events.map((event) => {
              const meta = KIND_META[event.kind];
              return (
                <li key={event.key} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                      <meta.icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{event.userName}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {meta.label}
                        {event.detail ? ` · ${event.detail}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground text-xs tabular-nums">{formatDateTime(event.at)}</span>
                    <Link
                      href={`/dashboard/users?userId=${event.userId}`}
                      aria-label={`Consultar perfil de ${event.userName}`}
                      className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <ArrowRight />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
