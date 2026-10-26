import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../../_components/api-health";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { FieldReviewsAdmin } from "./_components/field-reviews-admin";

export default async function FieldReviewsPage() {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Avaliações e denúncias"
        description="Investigar reclamações sobre condições, segurança ou informação incorrecta."
        apiFailed={!apiOk}
      />
      <FieldReviewsAdmin />
      <p className="text-muted-foreground text-xs">
        Nota: a avaliação de qualidade e os critérios utilizados devem ser definidos nas Configurações. Aqui, na
        operação, consultamos as avaliações concretas e as reclamações reportadas sobre os campos. A API ainda não tem
        endpoints de denúncias de campos e a leitura de avaliações (<code>GET /fields/quality/:fieldId</code>) devolve
        erro por falta da tabela correspondente — por isso as denúncias aparecem como vazias e as pontuações ficam
        indisponíveis até o backend as suportar.
      </p>
    </div>
  );
}
