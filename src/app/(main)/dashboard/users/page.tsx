import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../_components/api-status-header";
import { checkApiHealth } from "../_components/api-health";
import { UsersAdmin } from "./_components/users-admin";

interface UsersPageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const { userId } = await searchParams;
  const requestedId = Number(userId);
  const initialUserId = Number.isInteger(requestedId) && requestedId > 0 ? requestedId : undefined;

  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Todos os utilizadores"
        description="Listar, pesquisar, filtrar e consultar perfis."
        apiFailed={!apiOk}
      />
      <UsersAdmin initialUserId={initialUserId} />
    </div>
  );
}
