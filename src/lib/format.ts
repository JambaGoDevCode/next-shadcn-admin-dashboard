import { format } from "date-fns";

import type { City, Team } from "@/lib/api/types";

const numberFormatter = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });

export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

export function formatKz(value: number): string {
  return `${numberFormatter.format(value)} Kz`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy");
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM HH:mm");
}

export function createCityLabeler(cities: City[]): (cityId: number | null | undefined) => string {
  const byId = new Map(cities.map((city) => [city.id, city.name]));
  return (cityId) => (cityId != null ? (byId.get(cityId) ?? "—") : "—");
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
  PAID: "Paga",
  PENDING_PAYMENT: "Pendente de pagamento",
  PROCESSING: "Em processamento",
};

const ORDER_STATUS_TONES: Record<string, string> = {
  CANCELLED: "border-red-300 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:bg-red-500/15 dark:text-red-300",
  COMPLETED:
    "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  PAID: "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  PENDING_PAYMENT:
    "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/15 dark:text-amber-300",
  PROCESSING:
    "border-blue-300 bg-blue-500/10 text-blue-700 dark:border-blue-900/40 dark:bg-blue-500/15 dark:text-blue-300",
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function orderStatusTone(status: string): string {
  return ORDER_STATUS_TONES[status] ?? "border-border bg-muted text-muted-foreground";
}

const BOOKING_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelada",
  COMPLETED: "Concluída",
  CONFIRMED: "Confirmada",
  PENDING: "Pendente",
};

const MATCH_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelada",
  FINISHED: "Encerrada",
  LIVE: "Ao vivo",
  POSTPONED: "Adiada",
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
};

const MATCHMAKING_STATUS_LABELS: Record<string, string> = {
  ACCEPTED: "Aceite",
  EXPIRED: "Expirada",
  PENDING: "Pendente",
  REJECTED: "Rejeitada",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  failed: "Falhou",
  paid: "Pago",
  pending: "Pendente",
  processing: "Processando",
  refunded: "Reembolsado",
};

const PROFILE_TYPE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  FIELD_OWNER: "Dono de quadra",
  MODERATOR: "Moderador",
  ORGANIZER: "Organizador",
  PLATFORM_MANAGER: "Gestor da plataforma",
  PLAYER: "Jogador",
  REGULAR: "Regular",
  REFEREE: "Árbitro",
  STAFF: "Equipa técnica",
  SUPPORT: "Suporte",
  SUPER_ADMIN: "Super administrador",
  TEAM_MANAGER: "Gerente de equipa",
  TEAM_OWNER: "Dono de equipa",
  USER: "Usuário",
};

const STATUS_TONES: Record<string, string> = {
  // tasks (módulo de produtividade)
  TODO: "border-border bg-muted text-muted-foreground",
  IN_PROGRESS:
    "border-blue-300 bg-blue-500/10 text-blue-700 dark:border-blue-900/40 dark:bg-blue-500/15 dark:text-blue-300",
  IN_REVIEW:
    "border-violet-300 bg-violet-500/10 text-violet-700 dark:border-violet-900/40 dark:bg-violet-500/15 dark:text-violet-300",
  DONE: "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  // bookings
  PENDING:
    "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/15 dark:text-amber-300",
  CONFIRMED:
    "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  COMPLETED:
    "border-blue-300 bg-blue-500/10 text-blue-700 dark:border-blue-900/40 dark:bg-blue-500/15 dark:text-blue-300",
  CANCELLED: "border-red-300 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:bg-red-500/15 dark:text-red-300",
  // matches
  LIVE: "border-red-300 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:bg-red-500/15 dark:text-red-300",
  SCHEDULED:
    "border-blue-300 bg-blue-500/10 text-blue-700 dark:border-blue-900/40 dark:bg-blue-500/15 dark:text-blue-300",
  FINISHED:
    "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  POSTPONED:
    "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/15 dark:text-amber-300",
};

export function bookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABELS[status] ?? status;
}

export function matchStatusLabel(status: string): string {
  return MATCH_STATUS_LABELS[status] ?? status;
}

export function matchmakingStatusLabel(status: string): string {
  return MATCHMAKING_STATUS_LABELS[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function profileTypeLabel(type: string): string {
  return PROFILE_TYPE_LABELS[type] ?? type;
}

export function statusTone(status: string): string {
  return STATUS_TONES[status] ?? "border-border bg-muted text-muted-foreground";
}

// ============================================================
// TASKS (módulo de produtividade)
// ============================================================

const TASK_STATUS_LABELS: Record<string, string> = {
  DONE: "Concluída",
  IN_PROGRESS: "Em andamento",
  IN_REVIEW: "Em revisão",
  TODO: "A fazer",
};

const TASK_PRIORITY_LABELS: Record<string, string> = {
  HIGH: "Alta",
  LOW: "Baixa",
  MEDIUM: "Média",
  URGENT: "Urgente",
};

export function taskStatusLabel(status: string): string {
  return TASK_STATUS_LABELS[status] ?? status;
}

export function taskPriorityLabel(priority: string): string {
  return TASK_PRIORITY_LABELS[priority] ?? priority;
}

// ============================================================
// STORE (módulo da loja)
// ============================================================

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  DRAFT: "Rascunho",
  ARCHIVED: "Arquivado",
};

const PRODUCT_STATUS_TONES: Record<string, string> = {
  ACTIVE:
    "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  DRAFT:
    "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/15 dark:text-amber-300",
  ARCHIVED: "border-border bg-muted text-muted-foreground",
};

const STOCK_MOVEMENT_LABELS: Record<string, string> = {
  IN: "Entrada",
  OUT: "Saída",
  ADJUST: "Ajuste",
};

const STOCK_MOVEMENT_TONES: Record<string, string> = {
  IN: "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  OUT: "border-border bg-muted text-muted-foreground",
  ADJUST: "border-sky-300 bg-sky-500/10 text-sky-700 dark:border-sky-900/40 dark:bg-sky-500/15 dark:text-sky-300",
};

const STOCK_STATE_LABELS: Record<string, string> = {
  out: "Sem stock",
  low: "Stock baixo",
  ok: "Normal",
};

const STOCK_STATE_TONES: Record<string, string> = {
  out: "border-red-300 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:bg-red-500/15 dark:text-red-300",
  low: "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/15 dark:text-amber-300",
  ok: "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export function productStatusLabel(status: string): string {
  return PRODUCT_STATUS_LABELS[status] ?? status;
}

export function productStatusTone(status: string): string {
  return PRODUCT_STATUS_TONES[status] ?? "border-border bg-muted text-muted-foreground";
}

export function stockMovementLabel(type: string): string {
  return STOCK_MOVEMENT_LABELS[type] ?? type;
}

export function stockMovementTone(type: string): string {
  return STOCK_MOVEMENT_TONES[type] ?? "border-border bg-muted text-muted-foreground";
}

/** Estado do stock de uma linha de inventário: `out` / `low` / `ok`. */
export function stockStateKey(row: { outOfStock: boolean; lowStock: boolean }): "out" | "low" | "ok" {
  if (row.outOfStock) return "out";
  if (row.lowStock) return "low";
  return "ok";
}

export function stockStateLabel(row: { outOfStock: boolean; lowStock: boolean }): string {
  return STOCK_STATE_LABELS[stockStateKey(row)];
}

export function stockStateTone(row: { outOfStock: boolean; lowStock: boolean }): string {
  return STOCK_STATE_TONES[stockStateKey(row)];
}

// ============================================================
// GESTÃO (cidades, campos, equipas, jogadores, campeonatos)
// ============================================================

export function createTeamLabeler(teams: Team[]): (teamId: number | null | undefined) => string {
  const byId = new Map(teams.map((team) => [team.id, team.name]));
  return (teamId) => (teamId != null ? (byId.get(teamId) ?? "—") : "—");
}

/** Posições do jogador — espelha `PlayerPosition` da peladeiro-api (11 valores). */
export const PLAYER_POSITIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "GOALKEEPER", label: "Guarda-redes" },
  { value: "DEFENDER", label: "Defesa" },
  { value: "LEFT_BACK", label: "Lateral esquerdo" },
  { value: "RIGHT_BACK", label: "Lateral direito" },
  { value: "CENTER_BACK", label: "Central" },
  { value: "DEFENSIVE_MIDFIELDER", label: "Médio defensivo" },
  { value: "MIDFIELDER", label: "Médio" },
  { value: "ATTACKING_MIDFIELDER", label: "Médio ofensivo" },
  { value: "LEFT_WINGER", label: "Extremo esquerdo" },
  { value: "RIGHT_WINGER", label: "Extremo direito" },
  { value: "STRIKER", label: "Avançado" },
];

export function playerPositionLabel(position: string | null | undefined): string {
  if (!position) return "—";
  return PLAYER_POSITIONS.find((option) => option.value === position)?.label ?? position;
}
