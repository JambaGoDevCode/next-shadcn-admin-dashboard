import { getRecentUsers } from "@/lib/api/resources";

/**
 * Verifica se a peladeiro-api responde com a sessão atual (pede 1 registo mínimo
 * a qualquer endpoint autenticado). Alimenta o badge de ligação do cabeçalho das
 * secções do dashboard que espelham dados da API.
 */
export async function checkApiHealth(token: string): Promise<boolean> {
  try {
    await getRecentUsers(token, 1);
    return true;
  } catch {
    return false;
  }
}
