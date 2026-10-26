import { getUserById } from "@/lib/api/admin";
import { getRecentUsers } from "@/lib/api/resources";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { VerificationPanel, type VerificationRow } from "../_components/verification-panel";

export default async function AccountVerificationPage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  let failed = false;
  let rows: VerificationRow[] = [];

  try {
    const users = await getRecentUsers(token, 100);
    const details = await Promise.all(users.map((user) => getUserById(token, user.id).catch(() => null)));
    if (details.some((detail) => detail === null)) failed = true;
    rows = details.filter((detail): detail is NonNullable<typeof detail> => detail !== null);
  } catch {
    failed = true;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Verificação de contas"
        description="Analisar os dados de verificação exigidos pela plataforma (e-mail e termos)."
        apiFailed={failed}
      />
      <VerificationPanel rows={rows} failed={failed} />
    </div>
  );
}
