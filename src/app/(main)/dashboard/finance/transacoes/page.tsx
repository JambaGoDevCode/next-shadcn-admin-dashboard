import { FinanceShell } from "../_components/finance-shell";
import { PaymentsTable } from "../_components/payments-table";

export default function TransactionsPage() {
  return (
    <FinanceShell view="transactions">
      <PaymentsTable variant="transactions" />
    </FinanceShell>
  );
}
