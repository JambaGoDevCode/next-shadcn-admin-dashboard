import { getBookings, getConversionsOverview, getRecentUsers } from "@/lib/api/resources";
import type { Booking, ConversionsOverview, RecentUser, StoreOrderList } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { createLoader, loadStoreOrders } from "../_components/load-resource";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { RecentActivity } from "../_components/recent-activity";

export default async function PeladeiroActivityPage() {
  const { accessToken } = await getSessionTokens();
  const load = createLoader(accessToken ?? "");

  const [users, bookings, orders, payments] = await Promise.all([
    load<RecentUser[]>((t) => getRecentUsers(t, 6)),
    load<Booking[]>(getBookings),
    load<StoreOrderList>((t) => loadStoreOrders(t, { all: true, limit: 5 })),
    load<ConversionsOverview>((t) => getConversionsOverview(t, 30)),
  ]);

  const anyFailed = [users, bookings, orders, payments].some((state) => state.failed);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Atividade recente"
        description="Peladeiro Dashboard — novos registos, reservas, encomendas, pagamentos e incidentes."
        apiFailed={anyFailed}
      />
      <RecentActivity users={users} bookings={bookings} orders={orders} payments={payments} />
    </div>
  );
}
