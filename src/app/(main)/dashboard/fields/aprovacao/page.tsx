import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../../_components/api-health";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { FieldsApprovalAdmin } from "./_components/fields-approval-admin";

export default async function FieldsApprovalPage() {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Aprovação de campos"
        description="Analisar novos registos antes de os disponibilizar publicamente, se houver processo de aprovação."
        apiFailed={!apiOk}
      />
      <FieldsApprovalAdmin />
      <p className="text-muted-foreground text-xs">
        Nota: a peladeiro-api ainda não expõe um endpoint de fila de aprovação (estado «pending»). A publicação de um
        campo é gerida por disponibilidade (<code>isAvailable</code>), pelo que as ações de aprovação, rejeição e
        suspensão concentram-se nas decisões operacionais sobre os registos existentes — na API o registo nasce já
        publicado.
      </p>
    </div>
  );
}
