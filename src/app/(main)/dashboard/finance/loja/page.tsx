import { FinanceShell } from "../_components/finance-shell";
import { StoreOrdersTable } from "../_components/store-orders-table";

export default function StorePaymentsPage() {
  return (
    <FinanceShell view="store">
      <StoreOrdersTable />
    </FinanceShell>
  );
}
