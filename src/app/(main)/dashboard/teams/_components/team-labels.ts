import type { RecentUser } from "@/lib/api/types";

/**
 * Rótulo do proprietário de uma equipa: nome do utilizador, `Proprietário #id`
 * quando o utilizador não está na lista, ou `—` quando não há proprietário.
 */
export function createOwnerLabeler(users: RecentUser[]): (ownerId: number | null | undefined) => string {
  const byId = new Map(users.map((user) => [user.id, user.name]));
  return (ownerId) => {
    if (ownerId == null) return "—";
    return byId.get(ownerId) ?? `Proprietário #${ownerId}`;
  };
}

/** Estado de uma inscrição de equipa num torneio — PENDING | APPROVED | REJECTED | REMOVED. */
export function registrationStatusLabel(status?: string | null): string {
  if (status === "PENDING") return "Pendente";
  if (status === "APPROVED") return "Aprovada";
  if (status === "REJECTED") return "Rejeitada";
  if (status === "REMOVED") return "Removida";
  return status ?? "—";
}

export function registrationStatusVariant(status?: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (status === "APPROVED") return "default";
  if (status === "PENDING") return "secondary";
  if (status === "REJECTED" || status === "REMOVED") return "destructive";
  return "outline";
}

/** Estado do torneio em PT — DRAFT | REGISTRATION_OPEN | REGISTRATION_CLOSED | IN_PROGRESS | FINISHED | CANCELLED. */
export function tournamentStatusLabel(status?: string | null): string {
  if (status === "REGISTRATION_OPEN") return "Inscrições abertas";
  if (status === "REGISTRATION_CLOSED") return "Inscrições fechadas";
  if (status === "IN_PROGRESS") return "Em curso";
  if (status === "FINISHED") return "Concluído";
  if (status === "CANCELLED") return "Cancelado";
  if (status === "DRAFT") return "Rascunho";
  return status ?? "—";
}

export function tournamentStatusVariant(status?: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (status === "IN_PROGRESS" || status === "REGISTRATION_OPEN") return "default";
  if (status === "FINISHED" || status === "REGISTRATION_CLOSED") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "outline";
}
