"use client";

import * as React from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw, Search, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentUser } from "@/lib/api/types";
import { cn, getInitials } from "@/lib/utils";

import { CreateUserDialog } from "./create-user-dialog";
import { userStatusLabel, userStatusVariant } from "./user-labels";

const STATUS_FILTER_ALL = "__all";
const ROLE_FILTER_ALL = "__all";
const ROLE_FILTER_NONE = "__none";

interface UsersListCardProps {
  /** `null` enquanto ainda não carregou. */
  users: RecentUser[] | null;
  loading: boolean;
  error: string | null;
  selectedUserId: number | null;
  exactSearchPending: boolean;
  /** Recarregar a lista (após mutações ou manualmente). */
  onRefresh: () => void;
  onRetry: () => void;
  onSelect: (user: RecentUser) => void;
  /** Lookup exato na API — para usuários fora dos 100 mais recentes. */
  onExactEmailSearch: (email: string) => void;
  /** Chamado após a criação de uma conta — seleciona e recarrega. */
  onCreated: (userId: number) => void;
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Card principal da página: lista de usuários com filtro (nome/e-mail, estado e papel),
 * seleção de linha e ações «Recarregar» / «Novo usuário».
 */
export function UsersListCard({
  users,
  loading,
  error,
  selectedUserId,
  exactSearchPending,
  onRefresh,
  onRetry,
  onSelect,
  onExactEmailSearch,
  onCreated,
}: UsersListCardProps) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState(STATUS_FILTER_ALL);
  const [role, setRole] = React.useState(ROLE_FILTER_ALL);

  const roleOptions = React.useMemo(() => {
    if (!users) return [];
    const distinct = new Set<string>();
    for (const user of users) {
      if (user.primaryRole) distinct.add(user.primaryRole);
    }
    return [...distinct].sort();
  }, [users]);

  const visible = React.useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (q && !user.name.toLowerCase().includes(q) && !user.email.toLowerCase().includes(q)) return false;
      if (status !== STATUS_FILTER_ALL && user.status !== status) return false;
      if (role !== ROLE_FILTER_ALL) {
        if (role === ROLE_FILTER_NONE ? user.primaryRole !== null : user.primaryRole !== role) return false;
      }
      return true;
    });
  }, [users, query, status, role]);

  const hasFilters = query.trim().length > 0 || status !== STATUS_FILTER_ALL || role !== ROLE_FILTER_ALL;
  const showExactSearch = query.trim().includes("@") && !exactSearchPending;

  function clearFilters() {
    setQuery("");
    setStatus(STATUS_FILTER_ALL);
    setRole(ROLE_FILTER_ALL);
  }

  let body: React.ReactNode;
  if (loading && !users) {
    body = (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-14 w-full rounded-xl" key={index} />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={onRetry} size="sm" variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  } else if (!users || users.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Nenhum usuário na plataforma</EmptyTitle>
          <EmptyDescription>Crie a primeira conta para começar a gerir utilizadores.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateUserDialog onCreated={onCreated} />
        </EmptyContent>
      </Empty>
    );
  } else if (visible.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>Nenhum usuário corresponde</EmptyTitle>
          <EmptyDescription>
            {hasFilters ? "Ajuste a pesquisa ou limpe os filtros." : "A lista de usuários está vazia."}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={clearFilters} size="sm" variant="outline">
            Limpar filtros
          </Button>
        </EmptyContent>
      </Empty>
    );
  } else {
    body = (
      <>
        <ul className="flex max-h-[26rem] flex-col gap-1.5 overflow-y-auto pr-1">
          {visible.map((user) => {
            const active = user.id === selectedUserId;
            return (
              <li key={user.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={(event) => {
                    event.currentTarget.blur();
                    onSelect(user);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "border-primary bg-muted/50",
                  )}
                >
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                    {getInitials(user.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm leading-tight">{user.name}</div>
                    <div className="truncate text-muted-foreground text-xs">{user.email}</div>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    {user.primaryRole ? (
                      <Badge className="text-[10px]" variant="secondary">
                        {user.primaryRole}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sem papel</span>
                    )}
                  </div>

                  <Badge className="hidden text-[10px] md:inline-flex" variant={userStatusVariant(user.status)}>
                    {userStatusLabel(user.status)}
                  </Badge>

                  <span className="hidden w-20 shrink-0 text-right text-muted-foreground text-xs tabular-nums lg:block">
                    {formatCreatedAt(user.createdAt)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="text-muted-foreground text-xs">
          A ver {visible.length} de {users.length} usuário{users.length === 1 ? "" : "s"}
          {hasFilters ? " (filtros ativos)" : ""}
        </p>
      </>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Usuários</CardTitle>
        <CardDescription className="max-w-xl leading-snug">
          Gestão de contas da plataforma: cadastro, papéis, perfil, acesso e senha.
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <Button
            aria-label="Recarregar lista de usuários"
            disabled={loading}
            onClick={onRefresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
          <CreateUserDialog onCreated={onCreated} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-9 w-full sm:w-72">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Filtrar por nome ou e-mail…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filtrar usuários por nome ou e-mail"
            />
          </InputGroup>

          <Select onValueChange={setStatus} value={status}>
            <SelectTrigger aria-label="Filtrar por estado" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={STATUS_FILTER_ALL}>Todos os estados</SelectItem>
                <SelectItem value="ACTIVE">Ativos</SelectItem>
                <SelectItem value="INACTIVE">Inativos</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select onValueChange={setRole} value={role}>
            <SelectTrigger aria-label="Filtrar por papel" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ROLE_FILTER_ALL}>Todos os papéis</SelectItem>
                <SelectItem value={ROLE_FILTER_NONE}>Sem papel</SelectItem>
                {roleOptions.map((roleName) => (
                  <SelectItem key={roleName} value={roleName}>
                    {roleName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {showExactSearch ? (
            <Button
              disabled={exactSearchPending}
              onClick={() => onExactEmailSearch(query.trim())}
              size="sm"
              variant="outline"
            >
              Buscar e-mail na API
            </Button>
          ) : null}

          {hasFilters ? (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              Limpar
            </Button>
          ) : null}
        </div>

        {body}
      </CardContent>
    </Card>
  );
}
