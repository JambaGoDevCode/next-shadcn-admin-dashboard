import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../../_components/api-health";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { FieldQualityAdmin } from "./_components/field-quality-admin";

export default async function FieldQualityPage() {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Qualidade dos campos"
        description="Consultar avaliações dos critérios, pontuações e classificação de qualidade."
        apiFailed={!apiOk}
      />
      <FieldQualityAdmin />
      <p className="text-muted-foreground text-xs">
        Nota: a avaliação de qualidade e os critérios utilizados devem ser definidos nas Configurações. Aqui, na
        operação, consultamos e gerimos os campos concretos e as respectivas avaliações. A leitura e o registo de
        avaliações passam por <code>GET /fields/quality/:fieldId</code> e <code>POST /fields/quality/rate</code>, que
        neste momento devolvem erro na API (tabela de qualidade ainda não criada) — os valores ficam indisponíveis até
        a base de dados do backend suportar a tabela.
      </p>
    </div>
  );
}
