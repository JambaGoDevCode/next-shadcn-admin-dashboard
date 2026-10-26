import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../_components/api-health";
import { ApiStatusHeader } from "../_components/api-status-header";
import { FieldsAdmin } from "./_components/fields-admin";

interface FieldsPageProps {
  searchParams: Promise<{ fieldId?: string }>;
}

export default async function FieldsPage({ searchParams }: FieldsPageProps) {
  const { fieldId } = await searchParams;
  const requestedId = Number(fieldId);
  const initialFieldId = Number.isInteger(requestedId) && requestedId > 0 ? requestedId : undefined;

  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Todos os campos"
        description="Consultar, pesquisar e filtrar campos por cidade, preço e estado; editar dados e publicação."
        apiFailed={!apiOk}
      />
      <FieldsAdmin initialFieldId={initialFieldId} />
      <p className="text-muted-foreground text-xs">
        Nota: o registo de campo da API não tem modalidade nem proprietário (o modelo guarda nome, morada, cidade, preço
        por hora e disponibilidade), pelo que o filtro por modalidade fica indisponível até o modelo de campo a
        suportar. A listagem só devolve campos activos; campos suspensos deixam de ser consultáveis (GET /fields/:id
        responde 404).
      </p>
    </div>
  );
}
