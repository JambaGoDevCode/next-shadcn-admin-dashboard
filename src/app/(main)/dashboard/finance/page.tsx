import { listPayments, type PlatformPayment } from "@/lib/api/finance-admin";
import { getConversionsOverview, getMetricsOverview, getStoreOverview } from "@/lib/api/resources";
import type { ConversionsOverview, MetricsOverview, StoreOverview } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { FinanceOverview } from "./_components/finance-overview";
import { FinanceShell } from "./_components/finance-shell";
import { createLoader } from "./_components/load";

export default async function FinancePage() {
  const { accessToken } = await getSessionTokens();
  const load = createLoader(accessToken ?? "");

  const [metrics, conversions, store] = await Promise.all([
    load<MetricsOverview>(getMetricsOverview),
    load<ConversionsOverview>((token) => getConversionsOverview(token, 30)),
    load<StoreOverview>((token) => getStoreOverview(token, 30)),
  ]);

  let payments: PlatformPayment[] | null = null;
  try {
    payments = accessToken ? await listPayments(accessToken) : null;
  } catch {
    payments = null;
  }

  return (
    <FinanceShell view="overview">
      <FinanceOverview metrics={metrics} conversions={conversions} store={store} payments={payments} />
    </FinanceShell>
  );
}
