"use client";

import { useState, useTransition } from "react";

import { CheckCircle2, Loader2, SearchX } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { checkPermissionAction } from "@/server/actions/users";

export function PermissionCheck() {
  const [userId, setUserId] = useState("");
  const [permission, setPermission] = useState("");
  const [result, setResult] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0 || !permission.trim()) {
      toast.error("Informe um ID de usuário e uma permissão.");
      return;
    }
    startTransition(async () => {
      const actionResult = await checkPermissionAction(parsedUserId, permission.trim());
      if (!actionResult.ok) {
        setResult(null);
        setError(actionResult.error);
        return;
      }
      setError(null);
      setResult(actionResult.data);
    });
  }

  return (
    <form onSubmit={handleCheck} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="permission-user-id">ID do usuário</FieldLabel>
            <Input
              id="permission-user-id"
              inputMode="numeric"
              placeholder="15"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="permission-name">Permissão</FieldLabel>
            <Input
              id="permission-name"
              placeholder="MATCH_CREATE"
              value={permission}
              onChange={(event) => setPermission(event.target.value)}
            />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Verificar
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {result === true && (
          <p className="flex items-center gap-1.5 font-medium text-green-700 text-sm dark:text-green-300">
            <CheckCircle2 className="size-4" /> Permitido
          </p>
        )}
        {result === false && (
          <p className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <SearchX className="size-4" /> Não permitido
          </p>
        )}
      </div>

      <p className="text-muted-foreground text-xs">
        A verificação usa <code>GET /authorization/users/:id/permissions/:permission</code> e exige um token com o papel
        ADMIN.
      </p>
    </form>
  );
}
