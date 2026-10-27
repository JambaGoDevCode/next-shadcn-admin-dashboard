import { FinanceShell } from "../_components/finance-shell";
import { PaymentsTable } from "../_components/payments-table";

export default function RefundsPage() {
  return (
    <FinanceShell view="refunds">
      <PaymentsTable variant="refunds" />
    </FinanceShell>
  );
}
