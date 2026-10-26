"use client";

import { useTransition } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminUser, Profile, SessionInfo } from "@/lib/api/types";
import { revokeOtherSessionsAction } from "@/server/actions/users";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

interface AccountSummaryProps {
  profile: Profile | null;
  user: AdminUser | null;
  session: SessionInfo | null;
}

export function AccountSummary({ user, session }: AccountSummaryProps) {
  const [isPending, startTransition] = useTransition();

  function handleRevokeOthers() {
    startTransition(async () => {
      const result = await revokeOtherSessionsAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Outras sessões foram encerradas.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nome</p>
          <p className="font-medium text-sm">{user?.name ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">E-mail</p>
          <p className="font-medium text-sm">{user?.email ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Tipo</p>
          <p className="font-medium text-sm">{user?.type ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Status</p>
          <Badge variant={user?.status === "ACTIVE" ? "default" : "secondary"}>{user?.status ?? "—"}</Badge>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-2 flex items-center gap-2 font-medium text-sm">
          <ShieldCheck className="size-4" /> Sessão atual
        </p>
        {session ? (
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground text-xs">Sessão ID</p>
              <p className="tabular-nums">{session.sessionId}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Status</p>
              <p>{session.status}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Expira em</p>
              <p>{formatDate(session.expiresAt)}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Não foi possível carregar a sessão atual.</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleRevokeOthers}>
          <LogOut /> Encerrar outras sessões
        </Button>
      </div>
    </div>
  );
}
