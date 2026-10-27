import { BookingsPayments } from "../_components/bookings-payments";
import { FinanceShell } from "../_components/finance-shell";

export default function BookingsPaymentsPage() {
  return (
    <FinanceShell view="bookings">
      <BookingsPayments />
    </FinanceShell>
  );
}
