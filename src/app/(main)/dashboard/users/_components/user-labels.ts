import type { AccountType } from "@/lib/api/types";

/** Opções do select de tipo de conta (POST /auth/register aceita estes valores em minúsculas). */
export const ACCOUNT_TYPES: ReadonlyArray<{ value: AccountType; label: string }> = [
  { value: "player", label: "Jogador" },
  { value: "team_owner", label: "Dono de time" },
  { value: "field_owner", label: "Dono de quadra" },
  { value: "admin", label: "Administrador" },
  { value: "platform_manager", label: "Gestor da plataforma" },
];

/** Estado do usuário em PT — a API devolve `ACTIVE` / `INACTIVE` e prevê `SUSPENDED` / `BLOCKED`. */
export function userStatusLabel(status?: string | null): string {
  if (status === "ACTIVE") return "Ativo";
  if (status === "INACTIVE") return "Inativo";
  if (status === "SUSPENDED") return "Suspenso";
  if (status === "BLOCKED") return "Bloqueado";
  if (status === "PENDING") return "Pendente";
  if (status === "DELETED") return "Eliminado";
  return status ?? "—";
}

export function userStatusVariant(status?: string | null): "default" | "secondary" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "INACTIVE" || status === "PENDING") return "secondary";
  return "destructive";
}
