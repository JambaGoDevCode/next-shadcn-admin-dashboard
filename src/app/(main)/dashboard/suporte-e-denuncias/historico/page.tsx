import { SupportCasesAdmin } from "../_components/support-cases-admin";

export default function ResolutionHistoryPage() {
  return (
    <SupportCasesAdmin
      history
      title="Histórico de resolução"
      description="Consulte decisões, responsáveis, prazos e evidências dos casos resolvidos ou encerrados."
    />
  );
}
