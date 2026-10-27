import { FinanceShell } from "../_components/finance-shell";
import { ReportsWorkspace } from "../_components/reports-workspace";

export default function ReportsPage() {
  return (
    <FinanceShell view="reports">
      <ReportsWorkspace />
    </FinanceShell>
  );
}
