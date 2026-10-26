"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ArrowRight, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, profileTypeLabel } from "@/lib/format";
import { setUserActiveAction } from "@/server/actions/users";

import { userStatusLabel, userStatusVariant } from "./user-labels";

export interface SuspensionRow {
  id: number;
  name: string;
  email: string;
  type?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
}

interface SuspendedListProps {
  rows: SuspensionRow[];
  failed: boolean;
}

export function SuspendedList({ rows, failed }: SuspendedListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);

  async function handleReactivate(userId: number) {
    setPendingId(userId);
    const result = await setUserActiveAction(userId, true);
    setPendingId(null);
    if (result.ok) {
      toast.success("Conta reativada.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contas com acesso suspenso</CardTitle>
        <CardDescription>
          Estados SUSPENDED, BLOCKED ou INACTIVE, com os dados de histórico que a API expõe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {failed ? (
          <p className="text-muted-foreground py-6 text-center text-sm">— API indisponível</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-6 text-center">
            <UserCheck className="size-6 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Sem contas suspensas.</p>
            <p className="text-muted-foreground/80 text-xs">Todas as contas estão ativas.</p>
          </div>
        ) : (
          <ul className="divide-y text-sm">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{row.name}</p>
                    <Badge variant={userStatusVariant(row.status)}>{userStatusLabel(row.status)}</Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {row.email}
                    {row.type ? ` · ${profileTypeLabel(row.type)}` : ""}
                  </p>
                  <p className="text-muted-foreground/80 text-xs">
                    Registo {formatDate(row.createdAt)} · Último acesso {formatDate(row.lastLoginAt ?? null)} · Última
                    alteração {formatDate(row.updatedAt)} · Motivo não registado
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingId === row.id}
                    onClick={() => handleReactivate(row.id)}
                  >
                    <UserCheck /> Reativar
                  </Button>
                  <Link
                    href={`/dashboard/users?userId=${row.id}`}
                    aria-label={`Consultar perfil de ${row.name}`}
                    className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <ArrowRight />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
