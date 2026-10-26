import { getUserById } from "@/lib/api/admin";
import { getBookings, getRecentUsers } from "@/lib/api/resources";
import type { Booking } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { type ActivityEvent, ActivityFeed } from "../_components/activity-feed";

/** Limite de eventos exibidos — o resto fica fora do feed por desempenho/privacidade. */
const EVENT_LIMIT = 40;

interface ActivityPageState {
  events: ActivityEvent[];
  total: number;
  failed: boolean;
}

async function buildEvents(token: string): Promise<ActivityPageState> {
  const users = await getRecentUsers(token, 100);
  const names = new Map(users.map((user) => [user.id, user.name]));

  const [details, bookings] = await Promise.all([
    Promise.all(users.map((user) => getUserById(token, user.id).catch(() => null))),
    getBookings(token).catch(() => [] as Booking[]),
  ]);
  if (details.some((detail) => detail === null)) throw new Error("detail load failed");

  const events: ActivityEvent[] = [];

  for (const detail of details) {
    if (!detail) continue;
    const base = { userId: detail.id, userName: detail.name };
    if (detail.createdAt) events.push({ ...base, key: `registo-${detail.id}`, kind: "registo", at: detail.createdAt });
    if (detail.termsAcceptedAt) {
      events.push({ ...base, key: `termos-${detail.id}`, kind: "termos", at: detail.termsAcceptedAt });
    }
    if (detail.emailVerifiedAt) {
      events.push({ ...base, key: `verif-${detail.id}`, kind: "verificacao", at: detail.emailVerifiedAt });
    }
    if (detail.lastLoginAt) {
      events.push({ ...base, key: `acesso-${detail.id}`, kind: "acesso", at: detail.lastLoginAt });
    }
  }

  for (const booking of bookings) {
    if (booking.userId == null || !booking.createdAt) continue;
    events.push({
      key: `reserva-${booking.id}`,
      kind: "reserva",
      userId: booking.userId,
      userName: names.get(booking.userId) ?? `Utilizador #${booking.userId}`,
      at: booking.createdAt,
      detail: `Reserva #${booking.id} · Campo ${booking.fieldId}`,
    });
  }

  events.sort((a, b) => b.at.localeCompare(a.at));
  return { events: events.slice(0, EVENT_LIMIT), total: events.length, failed: false };
}

export default async function ActivityHistoryPage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let state: ActivityPageState = { events: [], total: 0, failed: false };
  try {
    state = await buildEvents(token);
  } catch {
    state = { events: [], total: 0, failed: true };
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Histórico de atividade"
        description="Eventos relevantes das contas — registo, termos, verificação, acesso e reservas."
        apiFailed={state.failed}
      />
      <ActivityFeed events={state.events} total={state.total} failed={state.failed} />
      <p className="text-muted-foreground text-xs">
        Privacidade e permissões: o histórico é restrito a administradores e inclui apenas eventos da conta — nunca
        credenciais, palavras-passe ou dados de autenticação.
      </p>
    </div>
  );
}
