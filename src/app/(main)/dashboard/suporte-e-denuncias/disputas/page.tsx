import { SupportCasesAdmin } from "../_components/support-cases-admin";

export default function DisputesPage() {
  return (
    <SupportCasesAdmin
      type="DISPUTE"
      title="Disputas"
      description="Acompanhe conflitos relacionados com jogos, reservas, pagamentos ou torneios."
    />
  );
}
