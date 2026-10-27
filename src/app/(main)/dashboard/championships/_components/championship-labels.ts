/** Tipos de campeonato aceites por POST /tournaments. */
export const TOURNAMENT_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "LEAGUE", label: "Liga" },
  { value: "KNOCKOUT", label: "Eliminação" },
  { value: "GROUP_STAGE", label: "Fase de grupos" },
  { value: "ROUND_ROBIN", label: "Todos contra todos" },
  { value: "FRIENDLY", label: "Amigável" },
  { value: "SWISS", label: "Suíço" },
];

/** Estados possíveis do campeonato (GET /tournaments devolve `status`). */
export const TOURNAMENT_STATUSES: ReadonlyArray<{ value: string; label: string }> = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "REGISTRATION_OPEN", label: "Inscrições abertas" },
  { value: "REGISTRATION_CLOSED", label: "Inscrições fechadas" },
  { value: "IN_PROGRESS", label: "Em curso" },
  { value: "SUSPENDED", label: "Suspenso" },
  { value: "FINISHED", label: "Concluído" },
  { value: "CANCELLED", label: "Cancelado" },
];

/** Variantes de badge disponíveis no componente Badge. */
export type ChampionshipBadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** Tipo do campeonato em PT — a API devolve LEAGUE, KNOCKOUT, GROUP_STAGE… */
export function tournamentTypeLabel(type?: string | null): string {
  if (!type) return "—";
  const option = TOURNAMENT_TYPES.find((entry) => entry.value === type);
  return option ? option.label : type;
}

/** Estado do campeonato em PT. */
export function championshipStatusLabel(status?: string | null): string {
  if (!status) return "—";
  const option = TOURNAMENT_STATUSES.find((entry) => entry.value === status);
  return option ? option.label : status;
}

export function championshipStatusVariant(status?: string | null): ChampionshipBadgeVariant {
  if (status === "REGISTRATION_OPEN" || status === "IN_PROGRESS") return "default";
  if (status === "REGISTRATION_CLOSED" || status === "FINISHED" || status === "SUSPENDED") return "secondary";
  if (status === "CANCELLED") return "destructive";
  return "outline";
}

/** Estado de uma inscrição em PT — PENDING | APPROVED | REJECTED | REMOVED. */
export function registrationStatusLabel(status?: string | null): string {
  if (status === "PENDING") return "Pendente";
  if (status === "APPROVED") return "Aprovada";
  if (status === "REJECTED") return "Rejeitada";
  if (status === "REMOVED") return "Removida";
  return status ?? "—";
}

export function registrationStatusVariant(status?: string | null): ChampionshipBadgeVariant {
  if (status === "PENDING") return "secondary";
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "outline";
}
