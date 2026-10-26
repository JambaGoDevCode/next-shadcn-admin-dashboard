import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../_components/api-status-header";
import { checkApiHealth } from "../_components/api-health";
import { TeamsAdmin } from "./_components/teams-admin";

interface TeamsPageProps {
  searchParams: Promise<{ teamId?: string }>;
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const { teamId } = await searchParams;
  const requestedId = Number(teamId);
  const initialTeamId = Number.isInteger(requestedId) && requestedId > 0 ? requestedId : undefined;

  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Todas as equipas"
        description="Listar, pesquisar e filtrar por cidade e estado; consultar e corrigir dados mediante autorização."
        apiFailed={!apiOk}
      />
      <TeamsAdmin initialTeamId={initialTeamId} />
      <p className="text-muted-foreground text-xs">
        Nota: o registo de equipa da API não tem campo de modalidade (a modalidade vive nos torneios e nas quadras),
        pelo que o filtro por modalidade fica indisponível até o modelo de equipa a suportar. O filtro de estado
        distingue equipas activas das inactivas; a listagem da API só devolve activas, por isso as inactivas são
        detetadas por consulta directa do registo (GET /teams/:id).
      </p>
    </div>
  );
}
