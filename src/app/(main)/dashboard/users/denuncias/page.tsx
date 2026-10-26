import Link from "next/link";

import { ArrowRight, Flag } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getSessionTokens } from "@/lib/auth/session";

import { ApiStatusHeader } from "../../_components/api-status-header";
import { checkApiHealth } from "../../_components/api-health";

export default async function UserReportsPage() {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Denúncias de utilizadores"
        description="Consultar denúncias relacionadas com contas e comportamentos."
        apiFailed={!apiOk}
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Flag className="size-6 text-muted-foreground/50" />
          <p className="font-medium text-sm">Sem denúncias para mostrar</p>
          <p className="text-muted-foreground max-w-xl text-sm">
            A peladeiro-api ainda não expõe um endpoint de denúncias de contas ou comportamentos. Quando existir, este
            ecrã lista cada denúncia com a conta denunciada, o motivo, o estado da análise e as ações administrativas
            (arquivar, escalar e registar a decisão).
          </p>
          <Link
            href="/dashboard/users"
            className="text-primary mt-1 inline-flex items-center gap-1 text-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            Ver todos os utilizadores <ArrowRight />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
