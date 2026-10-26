import { getConversionsOverview, getFields } from "@/lib/api/resources";
import type { ConversionsOverview, Field, StoreOrderList } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { AlertsList } from "../_components/alerts-list";
import { createLoader, loadStoreOrders } from "../_components/load-resource";
import { ApiStatusHeader } from "../../_components/api-status-header";

export default async function PeladeiroAlertsPage() {
  const { accessToken } = await getSessionTokens();
  const load = createLoader(accessToken ?? "");

  const [fields, conversions, orders] = await Promise.all([
    load<Field[]>(getFields),
    load<ConversionsOverview>((t) => getConversionsOverview(t, 30)),
    load<StoreOrderList>((t) => loadStoreOrders(t, { all: true, limit: 100 })),
  ]);

  const anyFailed = [fields, conversions, orders].some((state) => state.failed);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Alertas e pendências"
        description="Peladeiro Dashboard — campos por aprovar, pagamentos em análise, encomendas atrasadas e denúncias."
        apiFailed={anyFailed}
      />
      <AlertsList fields={fields} conversions={conversions} orders={orders} />
    </div>
  );
}
