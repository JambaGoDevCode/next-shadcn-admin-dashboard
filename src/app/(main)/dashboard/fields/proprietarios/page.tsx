import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../../_components/api-health";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { FieldOwnersAdmin } from "./_components/field-owners-admin";

export default async function FieldOwnersPage() {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Proprietários e responsáveis"
        description="Consultar os dados das pessoas ou entidades responsáveis pelos campos."
        apiFailed={!apiOk}
      />
      <FieldOwnersAdmin />
      <p className="text-muted-foreground text-xs">
        Nota: o registo de campo da API não guarda um proprietário (o modelo tem nome, morada, cidade, preço e
        disponibilidade), pelo que não existe uma ligação directa campo ↔ responsável. Os responsáveis apresentados são
        as contas com perfil ou role <code>FIELD_OWNER</code>; as acções administrativas sobre contas (suspensão,
        reactivação, verificação de dados) ficam em Utilizadores.
      </p>
    </div>
  );
}
