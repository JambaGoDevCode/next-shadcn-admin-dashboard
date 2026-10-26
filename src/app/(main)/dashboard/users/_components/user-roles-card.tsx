"use client";

import { useState, useTransition } from "react";

import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SYSTEM_ROLES } from "@/lib/api/admin";
import type { Role } from "@/lib/api/types";
import { assignRoleAction, removeRoleAction } from "@/server/actions/users";

interface UserRolesCardProps {
  userId: number;
  roles: Role[];
  userActive: boolean;
  onChanged: () => void;
}

export function UserRolesCard({ userId, roles, userActive, onChanged }: UserRolesCardProps) {
  const [roleId, setRoleId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const assignedIds = new Set(roles.map((role) => role.id));
  const availableRoles = SYSTEM_ROLES.filter((role) => !assignedIds.has(role.id));

  function handleAssign() {
    if (!roleId) {
      toast.error("Selecione um papel para atribuir.");
      return;
    }
    startTransition(async () => {
      const result = await assignRoleAction(userId, Number(roleId));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Papel atribuído.");
      setRoleId("");
      onChanged();
    });
  }

  function handleRemove(role: Role) {
    startTransition(async () => {
      const result = await removeRoleAction(userId, role.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Papel ${role.name} removido.`);
      onChanged();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {roles.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum papel atribuído.</p>
        ) : (
          roles.map((role) => (
            <Badge key={role.id} variant="secondary" className="gap-1 pr-1">
              {role.name}
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(role)}
                aria-label={`Remover papel ${role.name}`}
                className="ml-1 rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger
            size="sm"
            className="w-full sm:w-64"
            disabled={availableRoles.length === 0 || !userActive}
            aria-label="Papel a atribuir"
          >
            <SelectValue
              placeholder={
                !userActive
                  ? "Ative o usuário para atribuir papéis"
                  : availableRoles.length === 0
                    ? "Todos os papéis já atribuídos"
                    : "Selecione um papel"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {role.name} — {role.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" disabled={isPending || !roleId || !userActive} onClick={handleAssign}>
          {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          Atribuir
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Os 10 papéis do sistema são fixos na API (IDs 1–10). Atribuições são feitas por <code>roleId</code>.
        {!userActive && " A API não permite atribuir papéis a usuários inativos."}
      </p>
    </div>
  );
}
