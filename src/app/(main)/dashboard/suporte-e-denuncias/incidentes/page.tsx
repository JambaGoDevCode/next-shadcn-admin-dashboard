import { SupportCasesAdmin } from "../_components/support-cases-admin";

export default function OperationalIncidentsPage() {
  return (
    <SupportCasesAdmin
      type="OPERATIONAL_INCIDENT"
      title="Incidentes operacionais"
      description="Registe e acompanhe problemas que afectem a disponibilidade ou o funcionamento da plataforma."
    />
  );
}
