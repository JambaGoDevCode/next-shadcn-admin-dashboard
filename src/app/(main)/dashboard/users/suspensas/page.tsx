import { getUserById } from "@/lib/api/admin";
import { getRecentUsers } from "@/lib/api/resources";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { SuspendedList, type SuspensionRow } from "../_components/suspended-list";

/** Estados que retiram o acesso à conta — INACTIVE é o "desativar" disponível na API. */
const SUSPENDED_STATES = new Set(["SUSPENDED", "BLOCKED", "INACTIVE"]);

export default async function SuspendedAccountsPage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let failed = false;
  let rows: SuspensionRow[] = [];

  try {
    const users = await getRecentUsers(token, 100);
    const details = await Promise.all(users.map((user) => getUserById(token, user.id).catch(() => null)));
    if (details.some((detail) => detail === null)) failed = true;
    rows = details
      .filter((detail): detail is NonNullable<typeof detail> => detail !== null)
      .filter((detail) => SUSPENDED_STATES.has(detail.status ?? ""));
  } catch {
    failed = true;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Contas suspensas"
        description="Consultar motivo, duração e histórico da suspensão — e reativar contas."
        apiFailed={failed}
      />
      <SuspendedList rows={rows} failed={failed} />
      <p className="text-muted-foreground text-xs">
        Nota: a API não expõe motivo nem duração da suspensão (não existe endpoint de suspensão com esses campos) —
        «Motivo» e «Duração» serão preenchidos aqui quando o backend os suportar. Enquanto isso, o histórico mostra
        registo, último acesso e última alteração da conta.
      </p>
    </div>
  );
}
