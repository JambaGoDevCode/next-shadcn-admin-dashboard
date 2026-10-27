import { FinanceShell } from "../_components/finance-shell";
import { ReconciliationView } from "../_components/reconciliation-view";

export default function ReconciliationPage() {
  return (
    <FinanceShell view="reconciliation">
      <ReconciliationView />
    </FinanceShell>
  );
}
