"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminUser, Profile, RecentUser } from "@/lib/api/types";
import { getUserContextAction, listUsersAction, searchUserAction, type UserContext } from "@/server/actions/users";

import { UserProfileCard } from "../../_components/user-profile-card";
import { UserDetailsCard } from "./user-details-card";
import { UserRolesCard } from "./user-roles-card";
import { UsersListCard } from "./users-list-card";

interface UsersAdminProps {
  /** Utilizador pré-selecionado via deep link `?userId=` ("Consultar perfil" vindo de outros submenus). */
  initialUserId?: number;
}

/**
 * Página de gestão de usuários: lista filtrável (GET /users/recent), seleção
 * de um usuário e os cartões de cadastro, papéis e perfil — CRUD completo.
 * A redefinição de palavras-passe é deliberadamente omitida: os administradores
 * não alteram credenciais — a recuperação passa pelo fluxo seguro da autenticação.
 */
export function UsersAdmin({ initialUserId }: UsersAdminProps) {
  const [users, setUsers] = useState<RecentUser[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedId, setSelectedId] = useState<number | null>(initialUserId ?? null);
  const [context, setContext] = useState<UserContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [exactSearchPending, startExactSearch] = useTransition();

  const detailsRef = useRef<HTMLDivElement>(null);
  /** Último usuário excluído — a auto-seleção não deve escolhê-lo de novo. */
  const deletedIdRef = useRef<number | null>(null);
  /** Deep link `?userId=` já carregado. */
  const initialLoadedRef = useRef(false);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  /** Carrega usuário + papéis + perfil. `silent` mantém o contexto atual visível durante o reload. */
  const loadContext = useCallback(async (userId: number, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setContextLoading(true);
      setContext(null);
    }
    setContextError(null);

    const result = await getUserContextAction(userId);
    setContextLoading(false);

    if (result.ok) {
      setContext(result.data);
      return true;
    }
    setContextError(result.error);
    return false;
  }, []);

  // Lista de usuários — recarrega no mount e a cada refreshKey.
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);

    listUsersAction(100)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setUsers(result.data);
          setListError(null);
        } else {
          setUsers(null);
          setListError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setUsers(null);
        setListError("Não foi possível carregar a lista de usuários.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Seleciona o primeiro usuário (mais recente) quando nada está selecionado — espelha o template.
  // O usuário recém-excluído (soft delete, continua na lista como inativo) é ignorado.
  useEffect(() => {
    if (!users || users.length === 0 || selectedId !== null) return;
    const next = users.find((user) => user.id !== deletedIdRef.current) ?? users[0];
    setSelectedId(next.id);
    void loadContext(next.id);
  }, [users, selectedId, loadContext]);

  // Deep link `?userId=` — carrega o contexto do utilizador pedido (uma única vez).
  useEffect(() => {
    if (initialUserId === undefined || initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    void loadContext(initialUserId);
  }, [initialUserId, loadContext]);

  const handleSelect = useCallback(
    (user: RecentUser) => {
      if (user.id === selectedId && context) return;
      setSelectedId(user.id);
      void loadContext(user.id).then((loaded) => {
        if (loaded) detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [selectedId, context, loadContext],
  );

  /** Criada a conta (pelo diálogo) — seleciona a nova usuária e atualiza a lista. */
  const handleCreated = useCallback(
    (userId: number) => {
      setSelectedId(userId);
      void loadContext(userId);
      refresh();
    },
    [loadContext, refresh],
  );

  /**
   * Exclusão (soft delete) — a API mantém o usuário na lista com status INACTIVE
   * (é o que o diálogo de confirmação promete). Marcamos o status localmente,
   * limpamos a seleção e deixamos a auto-seleção escolher o vizinho seguinte.
   */
  const handleDeleted = useCallback(() => {
    if (selectedId !== null) {
      const deletedId = selectedId;
      deletedIdRef.current = deletedId;
      setUsers((current) =>
        current ? current.map((user) => (user.id === deletedId ? { ...user, status: "INACTIVE" } : user)) : current,
      );
    }
    setSelectedId(null);
    setContext(null);
    setContextError(null);
    refresh();
  }, [selectedId, refresh]);

  const handleUserChanged = useCallback(
    (user: AdminUser) => {
      setContext((current) => (current ? { ...current, user } : current));
      refresh();
    },
    [refresh],
  );

  const handleRolesChanged = useCallback(() => {
    if (selectedId === null) return;
    void loadContext(selectedId, { silent: true });
    refresh();
  }, [selectedId, loadContext, refresh]);

  const handleProfileChanged = useCallback((profile: Profile) => {
    setContext((current) => (current ? { ...current, profile } : current));
  }, []);

  /** Lookup exato por e-mail na API — cobre usuários fora dos 100 mais recentes. */
  function handleExactEmailSearch(email: string) {
    startExactSearch(async () => {
      const result = await searchUserAction(email);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const { user, roles, profile } = result.data;
      setSelectedId(user.id);
      setContext({ user, roles, profile });
      setContextError(null);
      setContextLoading(false);
      // Traz o usuário encontrado para a lista visível (se ainda não estava nela).
      setUsers((current) => {
        if (!current || current.some((row) => row.id === user.id)) return current;
        return [
          {
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.type ?? "",
            status: user.status ?? "",
            primaryRole: roles[0]?.name ?? null,
            createdAt: user.createdAt ?? new Date().toISOString(),
          },
          ...current,
        ];
      });
      toast.success(`Usuário encontrado: ${user.email}.`);
      detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleRetryContext() {
    if (selectedId !== null) void loadContext(selectedId);
  }

  return (
    <div className="flex flex-col gap-4">
      <UsersListCard
        error={listError}
        exactSearchPending={exactSearchPending}
        loading={listLoading}
        onCreated={handleCreated}
        onExactEmailSearch={handleExactEmailSearch}
        onRefresh={refresh}
        onRetry={refresh}
        onSelect={handleSelect}
        selectedUserId={selectedId}
        users={users}
      />

      <div className="flex flex-col gap-4" ref={detailsRef}>
        {contextLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-40 w-full" />
          </>
        ) : contextError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-destructive text-sm">{contextError}</p>
              <Button onClick={handleRetryContext} size="sm" variant="outline">
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : context ? (
          <>
            <Card key={`details-${context.user.id}`}>
              <CardHeader>
                <CardTitle>Cadastro</CardTitle>
                <CardDescription>Dados da conta e acesso.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <UserDetailsCard user={context.user} onChanged={handleUserChanged} onDeleted={handleDeleted} />
              </CardContent>
            </Card>

            <Card key={`roles-${context.user.id}`}>
              <CardHeader>
                <CardTitle>Papéis</CardTitle>
                <CardDescription>Permissões de acesso concedidas ao usuário.</CardDescription>
              </CardHeader>
              <CardContent>
                <UserRolesCard
                  userId={context.user.id}
                  roles={context.roles}
                  userActive={context.user.status === "ACTIVE"}
                  onChanged={handleRolesChanged}
                />
              </CardContent>
            </Card>

            <Card key={`profile-${context.user.id}`}>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>Informações pessoais complementares.</CardDescription>
              </CardHeader>
              <CardContent>
                <UserProfileCard userId={context.user.id} profile={context.profile} onChanged={handleProfileChanged} />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
