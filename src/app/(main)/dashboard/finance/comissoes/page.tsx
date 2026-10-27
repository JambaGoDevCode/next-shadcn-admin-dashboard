import { getMetricsOverview } from "@/lib/api/resources";
import type { MetricsOverview } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { CommissionsView } from "../_components/commissions-view";
import { FinanceShell } from "../_components/finance-shell";
import { createLoader } from "../_components/load";

export default async function CommissionsPage() {
  const { accessToken } = await getSessionTokens();
  const load = createLoader(accessToken ?? "");
  const metrics = await load<MetricsOverview>(getMetricsOverview);

  return (
    <FinanceShell view="commissions">
      <CommissionsView metrics={metrics} />
    </FinanceShell>
  );
}
