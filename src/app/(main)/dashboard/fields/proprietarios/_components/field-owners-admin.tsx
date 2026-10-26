"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { RefreshCw, UsersRound } from "lucide-react";

import { userStatusLabel, userStatusVariant } from "@/app/(main)/dashboard/users/_components/user-labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentUser } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { listUsersAction } from "@/server/actions/users";

/** Perfis/roles que identificam um responsável por campos. */
const OWNER_MARKERS = new Set(["FIELD_OWNER"]);

interface OwnerRow {
  id: number;
  name: string;
  email: string;
  type: string;
  status: string;
  primaryRole: string | null;
  createdAt: string;
}

/**
 * Proprietários e responsáveis: diretório das contas de proprietário de campo.
 *
 * O registo de campo da API não guarda um proprietário (o modelo tem nome,
 * morada, cidade, preço e disponibilidade), pelo que os responsáveis são
 * obtidos das contas com perfil/role `FIELD_OWNER` — a ligação campo ↔
 * proprietário fica para quando o backend a expuser.
 */
export function FieldOwnersAdmin() {
  const [users, setUsers] = useState<RecentUser[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listUsersAction(100)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setUsers(result.data);
          setError(null);
        } else {
          setUsers(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setUsers(null);
        setError("Não foi possível carregar os utilizadores.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const owners = useMemo<OwnerRow[]>(() => {
    if (!users) return [];
    return users
      .filter((user) => OWNER_MARKERS.has(user.type) || (user.primaryRole != null && OWNER_MARKERS.has(user.primaryRole)))
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        type: user.type,
        status: user.status,
        primaryRole: user.primaryRole,
        createdAt: user.createdAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  const scanned = users?.length ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-normal text-muted-foreground text-sm">Contas de proprietário</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-3xl tabular-nums leading-none">
              {loading && !users ? "—" : owners.length}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">Perfil ou role FIELD_OWNER</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-normal text-muted-foreground text-sm">Contas analisadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-3xl tabular-nums leading-none">{loading && !users ? "—" : scanned}</div>
            <p className="text-muted-foreground mt-1 text-xs">Mais recentes registadas na plataforma</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <div className="space-y-1">
            <CardTitle className="text-xl leading-none">Proprietários e responsáveis</CardTitle>
            <CardDescription>
              Contas com responsabilidade sobre campos — consultar dados e estado da conta.
            </CardDescription>
          </div>
          <CardAction>
            <Button
              aria-label="Recarregar diretório de proprietários"
              disabled={loading}
              onClick={refresh}
              size="icon-sm"
              variant="ghost"
            >
              <RefreshCw className={loading ? "animate-spin" : undefined} />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {loading && !users ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton className="h-14 w-full rounded-xl" key={`owner-skeleton-${index}`} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
              <p className="text-destructive text-sm">{error}</p>
              <Button onClick={refresh} size="sm" variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : owners.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersRound />
                </EmptyMedia>
                <EmptyTitle>Sem contas de proprietário</EmptyTitle>
                <EmptyDescription>
                  {scanned > 0
                    ? `Nenhuma das ${scanned} contas analisadas tem o perfil nem o role FIELD_OWNER. As contas de proprietário de campo aparecem aqui quando são registadas com esse tipo de conta.`
                    : "Ainda não existem utilizadores registados na plataforma."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <p className="text-muted-foreground max-w-xl text-center text-xs">
                  Enquanto isso, a consulta e suspensão de contas (incluindo proprietários) está disponível em
                  Utilizadores.
                </p>
                <Link
                  href="/dashboard/users"
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Ver utilizadores →
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {owners.map((owner) => (
                <li
                  key={owner.id}
                  className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm leading-tight">{owner.name}</div>
                    <div className="truncate text-muted-foreground text-xs">{owner.email}</div>
                    <div className="text-muted-foreground/80 mt-1 text-xs">
                      Registo {formatDate(owner.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge className="text-[10px]" variant={userStatusVariant(owner.status)}>
                      {userStatusLabel(owner.status)}
                    </Badge>
                    <Badge className="text-[10px]" variant="secondary">
                      {owner.primaryRole ?? owner.type}
                    </Badge>
                    {owner.primaryRole && owner.primaryRole !== owner.type ? (
                      <Badge className="text-[10px]" variant="outline">
                        {owner.type}
                      </Badge>
                    ) : null}
                    <Link
                      href={`/dashboard/users?userId=${owner.id}`}
                      className="font-medium text-primary text-sm hover:underline"
                    >
                      Consultar conta
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
